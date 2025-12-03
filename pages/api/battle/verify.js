import connectDB from '../../../utils/db';
import Battle from '../../../models/Battle';
import StreamCount from '../../../models/StreamCount';
import Team from '../../../models/Team';
import User from '../../../models/User';
import { getRecentTracks, matchTrack } from '../../../utils/lastfm';
import { logger } from '../../../utils/logger';

// Removed Socket.io support for Netlify serverless compatibility

// Cache for participant tracks (90 second TTL) - Netlify optimization
const participantTrackCache = new Map();
const PARTICIPANT_CACHE_TTL = 90000; // 90 seconds

/**
 * Detects cheating patterns in scrobble timestamps
 * According to Last.fm API documentation and scrobbling guidelines:
 * - Minimum track duration to scrobble: 30 seconds OR 50% of track length (whichever is shorter)
 * - Tracks should be scrobbled after they've been played, not before
 * - Average song length is ~3-4 minutes
 *
 * Detection rules:
 * 1. Impossible scrobble rate: 11+ songs in 1 minute (avg <5.5 sec/song - impossible for legitimate play)
 * 2. Suspicious skip pattern: 5+ songs in 30 seconds (avg <6 sec/song - likely skipping)
 * 3. Unrealistic tempo: Average time between scrobbles < 30 seconds over 10+ songs
 */
function detectCheating(timestamps, tracks = []) {
  if (timestamps.length < 5) return false;

  const sortedTimestamps = [...timestamps].sort((a, b) => a - b);

  // Rule 1: Detect 11+ scrobbles within 1 minute window (original logic - definitely cheating)
  for (let i = 0; i <= sortedTimestamps.length - 11; i++) {
    const windowStart = sortedTimestamps[i];
    const windowEnd = sortedTimestamps[i + 10];
    const windowDuration = (windowEnd - windowStart) / 1000 / 60;

    if (windowDuration <= 1) {
      logger.warn('Cheating detected: 11+ scrobbles in 1 minute', {
        windowDuration,
        scrobbleCount: 11
      });
      return true;
    }
  }

  // Rule 2: Detect 5+ scrobbles within 30 seconds (suspicious skipping pattern)
  if (sortedTimestamps.length >= 5) {
    for (let i = 0; i <= sortedTimestamps.length - 5; i++) {
      const windowStart = sortedTimestamps[i];
      const windowEnd = sortedTimestamps[i + 4];
      const windowDuration = (windowEnd - windowStart) / 1000;

      if (windowDuration <= 30) {
        logger.warn('Cheating detected: 5+ scrobbles in 30 seconds', {
          windowDuration,
          scrobbleCount: 5
        });
        return true;
      }
    }
  }

  // Rule 3: Calculate average time between scrobbles for 10+ songs
  if (sortedTimestamps.length >= 10) {
    const totalDuration = sortedTimestamps[sortedTimestamps.length - 1] - sortedTimestamps[0];
    const avgTimeBetweenScrobbles = totalDuration / (sortedTimestamps.length - 1) / 1000; // in seconds

    // If average time between scrobbles is less than 30 seconds, it's unrealistic
    // (Most songs are 2-5 minutes, so even with skipping to 50% mark, you'd need at least 60+ seconds per song)
    if (avgTimeBetweenScrobbles < 30) {
      logger.warn('Cheating detected: Unrealistic average tempo', {
        avgTimeBetweenScrobbles,
        totalScrobbles: sortedTimestamps.length,
        totalDurationMinutes: totalDuration / 1000 / 60
      });
      return true;
    }
  }

  return false;
}

async function freezeBattle(battle) {
  try {
    const streamCounts = await StreamCount.find({ battleId: battle._id })
      .populate('userId', 'username displayName')
      .populate({ path: 'teamId', strictPopulate: false });

    // Build final leaderboard with team support
    const teamScoresMap = new Map();
    const soloPlayers = [];

    for (const sc of streamCounts) {
      if (sc.teamId) {
        // Team member
        if (!teamScoresMap.has(sc.teamId._id.toString())) {
          teamScoresMap.set(sc.teamId._id.toString(), {
            type: 'team',
            teamId: sc.teamId._id,
            teamName: sc.teamId.name,
            memberCount: sc.teamId.members.length,
            totalScore: 0,
            isCheater: false,
          });
        }

        const teamData = teamScoresMap.get(sc.teamId._id.toString());
        teamData.totalScore += sc.count;
        if (sc.isCheater) {
          teamData.isCheater = true;
        }
      } else {
        // Solo player
        soloPlayers.push({
          type: 'solo',
          userId: sc.userId._id,
          username: sc.userId.username,
          displayName: sc.userId.displayName,
          count: sc.count,
          isCheater: sc.isCheater || false,
        });
      }
    }

    // Combine teams and solo players
    const teams = Array.from(teamScoresMap.values());
    const combinedLeaderboard = [...teams, ...soloPlayers];

    // Sort by score
    const finalLeaderboard = combinedLeaderboard.sort((a, b) => {
      const scoreA = a.type === 'team' ? a.totalScore : a.count;
      const scoreB = b.type === 'team' ? b.totalScore : b.count;
      return scoreB - scoreA;
    });

    await Battle.findByIdAndUpdate(battle._id, {
      status: 'ended',
      finalLeaderboard,
      endedAt: new Date(),
    });

    logger.info('Battle frozen', {
      battleId: battle._id,
      battleName: battle.name,
      participantCount: battle.participants.length,
      leaderboardEntries: finalLeaderboard.length
    });

    // Socket.io removed - clients will poll for battle status updates
  } catch (error) {
    logger.error('Error freezing battle', { battleId: battle._id, error: error.message });
  }
}

async function verifyScrobbles() {
  try {
    await connectDB();

    const now = new Date();

    const upcomingToActive = await Battle.updateMany(
      { status: 'upcoming', startTime: { $lte: now } },
      { status: 'active' }
    );

    if (upcomingToActive.modifiedCount > 0) {
      logger.info('Battles transitioned to active', { count: upcomingToActive.modifiedCount });
    }

    const activeBattlesToEnd = await Battle.find({ status: 'active', endTime: { $lte: now } });

    for (const battle of activeBattlesToEnd) {
      await freezeBattle(battle);
    }

    const activeBattles = await Battle.find({ status: 'active' });

    // OPTIMIZATION: Early exit if no active battles - saves Netlify function invocations
    if (activeBattles.length === 0) {
      logger.info('No active battles, skipping verification cycle');
      return { success: true, message: 'No active battles to verify', skipped: true };
    }

    logger.info('Verification cycle started', {
      time: now.toISOString(),
      activeBattles: activeBattles.length
    });

    // OPTIMIZATION: Deduplicate participants across battles
    // Collect all unique participants first, then fetch tracks once per user
    const uniqueParticipantsMap = new Map(); // username -> { user, battles: [battleData] }

    for (const battle of activeBattles) {
      const participants = await User.find({ _id: { $in: battle.participants } });

      for (const participant of participants) {
        if (!participant.lastfmUsername) continue;

        const username = participant.lastfmUsername;
        if (!uniqueParticipantsMap.has(username)) {
          uniqueParticipantsMap.set(username, {
            user: participant,
            battles: []
          });
        }

        uniqueParticipantsMap.get(username).battles.push(battle);
      }
    }

    logger.info('Deduplication stats', {
      totalUniqueparticipants: uniqueParticipantsMap.size,
      totalBattles: activeBattles.length
    });

    // Process each unique participant once
    for (const [username, data] of uniqueParticipantsMap.entries()) {
      const participant = data.user;
      const participantBattles = data.battles;

      try {
        // Find earliest start time across all battles this user is in
        const earliestStartTime = Math.min(...participantBattles.map(b => b.startTime.getTime()));

        // OPTIMIZATION: Check cache for participant tracks
        const cacheKey = `${username}-${earliestStartTime}`;
        const cachedData = participantTrackCache.get(cacheKey);
        let recentTracks;

        if (cachedData && (Date.now() - cachedData.timestamp) < PARTICIPANT_CACHE_TTL) {
          recentTracks = cachedData.tracks;
          logger.info('Using cached tracks for participant', {
            username,
            battlesCount: participantBattles.length
          });
        } else {
          recentTracks = await getRecentTracks(
            username,
            earliestStartTime,
            now.getTime()
          );

          // Cache the tracks
          participantTrackCache.set(cacheKey, {
            tracks: recentTracks,
            timestamp: Date.now()
          });

          // Clean up old cache entries
          if (participantTrackCache.size > 200) {
            const oldestKeys = Array.from(participantTrackCache.keys()).slice(0, 100);
            oldestKeys.forEach(key => participantTrackCache.delete(key));
          }
        }

        // Now process tracks for each battle this user is in
        for (const battle of participantBattles) {

          const matchedTracks = recentTracks.filter(scrobble => {
            const isInTimeRange =
              scrobble.timestamp >= battle.startTime.getTime() &&
              scrobble.timestamp <= battle.endTime.getTime();

            return isInTimeRange && matchTrack(scrobble, battle.playlistTracks);
          });

          const count = matchedTracks.length;
          const timestamps = matchedTracks.map(t => t.timestamp);
          const isCheater = detectCheating(timestamps, matchedTracks);

          // Calculate additional statistics for monitoring
          let avgTimeBetweenScrobbles = 0;
          let suspiciousScrobbles = 0;

          if (timestamps.length > 1) {
            const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
            const totalDuration = sortedTimestamps[sortedTimestamps.length - 1] - sortedTimestamps[0];
            avgTimeBetweenScrobbles = totalDuration / (sortedTimestamps.length - 1) / 1000; // seconds

            // Count scrobbles that are suspiciously close together (< 30 seconds apart)
            for (let i = 1; i < sortedTimestamps.length; i++) {
              const timeDiff = (sortedTimestamps[i] - sortedTimestamps[i - 1]) / 1000;
              if (timeDiff < 30) {
                suspiciousScrobbles++;
              }
            }
          }

          // Check if user is in a team for this battle
          const userTeam = await Team.findOne({
            battleId: battle._id,
            members: participant._id
          });

          await StreamCount.findOneAndUpdate(
            { battleId: battle._id, userId: participant._id },
            {
              count,
              isCheater,
              scrobbleTimestamps: timestamps,
              teamId: userTeam ? userTeam._id : null,
            },
            { upsert: true }
          );

          logger.info('Scrobbles verified', {
            battleId: battle._id,
            userId: participant._id,
            username: participant.username,
            scrobblesCounted: count,
            playlistMatches: count,
            isCheater,
            avgTimeBetweenScrobbles: avgTimeBetweenScrobbles.toFixed(1),
            suspiciousScrobbles,
            totalRecentTracks: recentTracks.length,
          });
        } // end for battle loop

      } catch (error) {
        logger.error('Error verifying scrobbles for user', {
          username: participant.username,
          error: error.message
        });
      }
    } // end for unique participants loop

    // Now handle missing participants (users with 0 scrobbles) for each battle
    for (const battle of activeBattles) {
      const streamCounts = await StreamCount.find({ battleId: battle._id }).populate('userId', 'username');
      
      const participantIds = battle.participants.map(p => p.toString());
      const existingUserIds = streamCounts.map(sc => sc.userId._id.toString());
      
      const missingParticipants = await User.find({
        _id: { $in: participantIds.filter(id => !existingUserIds.includes(id)) }
      });

      // Socket.io removed - leaderboard updates will be fetched via polling
    }

    logger.info('Verification cycle completed', { time: now.toISOString() });

  } catch (error) {
    logger.error('Verification error', { error: error.message, stack: error.stack });
  }
}

/**
 * Netlify-compatible verification endpoint
 * Designed to be called by an external cron service every 2 minutes
 * No setInterval - each invocation performs one verification cycle
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Validate secret header to prevent unauthorized calls
  const authHeader = req.headers['x-cron-secret'];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== cronSecret) {
    logger.warn('Unauthorized verification attempt', {
      hasAuthHeader: !!authHeader,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      expectedHeader: 'x-cron-secret',
      hint: authHeader ? 'Header value mismatch' : 'Missing x-cron-secret header'
    });
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Missing or invalid x-cron-secret header. Please configure your cron service to send the x-cron-secret header with your CRON_SECRET value.',
      hint: 'If using cron-job.org, add a custom header in Advanced Settings: Header Name: x-cron-secret, Header Value: [your CRON_SECRET]'
    });
  }

  try {
    logger.info('Verification triggered by external cron');

    await verifyScrobbles();

    res.status(200).json({
      message: 'Verification completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Verification handler error', { error: error.message });
    res.status(500).json({
      error: 'Verification failed',
      message: error.message
    });
  }
}
