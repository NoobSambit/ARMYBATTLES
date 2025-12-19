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
        const teamIdStr = sc.teamId._id.toString();
        if (!teamScoresMap.has(teamIdStr)) {
          teamScoresMap.set(teamIdStr, {
            type: 'team',
            teamId: sc.teamId._id,
            teamName: sc.teamId.name,
            memberCount: sc.teamId.members.length,
            totalScore: 0,
            members: [], // Store individual team member scores
          });
        }

        const teamData = teamScoresMap.get(teamIdStr);
        teamData.totalScore += sc.count;

        // Add individual team member data
        teamData.members.push({
          userId: sc.userId._id,
          username: sc.userId.username,
          displayName: sc.userId.displayName,
          count: sc.count,
        });
      } else {
        // Solo player
        soloPlayers.push({
          type: 'solo',
          userId: sc.userId._id,
          username: sc.userId.username,
          displayName: sc.userId.displayName,
          count: sc.count,
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

    logger.info(`🏁 "${battle.name}" ended: ${finalLeaderboard.length} entries, ${battle.participants.length} participants`);

    // Socket.io removed - clients will poll for battle status updates
  } catch (error) {
    logger.error('Error freezing battle', { battleId: battle._id, error: error.message });
  }
}

/**
 * Shard-based verification for parallel processing
 * @param {number} shardId - The shard number (0, 1, 2, or 3)
 * @param {number} totalShards - Total number of shards (default: 4)
 */
async function verifyScrobbles(shardId = null, totalShards = 4) {
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 9000; // 9 seconds for Netlify free tier (10s limit - 1s buffer)

  const isNearTimeout = () => (Date.now() - startTime) > MAX_EXECUTION_TIME;

  // Log sharding info
  const shardingEnabled = shardId !== null;
  if (shardingEnabled) {
    // Sharding enabled - removed verbose logging
  }

  try {
    await connectDB();

    if (isNearTimeout()) {
      logger.warn('Timeout during DB connection');
      return { success: false, message: 'Timeout during database connection', timeout: true };
    }

    const now = new Date();

    const upcomingToActive = await Battle.updateMany(
      { status: 'upcoming', startTime: { $lte: now } },
      { status: 'active' }
    );

    if (upcomingToActive.modifiedCount > 0) {
      logger.info(`🟢 ${upcomingToActive.modifiedCount} battles transitioned to active`);
    }

    if (isNearTimeout()) {
      logger.warn('Timeout after battle transitions');
      return { success: true, message: 'Battles transitioned but verification skipped due to timeout', partialSuccess: true };
    }

    const activeBattlesToEnd = await Battle.find({ status: 'active', endTime: { $lte: now } });

    if (activeBattlesToEnd.length > 0) {
      logger.info(`🏁 Ending ${activeBattlesToEnd.length} battles`);
    }

    for (const battle of activeBattlesToEnd) {
      if (isNearTimeout()) {
        logger.warn(`⚠️ Timeout during battle freezing, ${activeBattlesToEnd.length} remaining`);
        break;
      }
      await freezeBattle(battle);
    }

    const activeBattles = await Battle.find({ status: 'active' });

    // OPTIMIZATION: Early exit if no active battles - saves Netlify function invocations
    if (activeBattles.length === 0) {
      logger.info('⏸️  No active battles, skipping verification cycle');
      return { success: true, message: 'No active battles to verify', skipped: true };
    }

    // Clean, informative logging
    const totalParticipants = activeBattles.reduce((sum, b) => sum + b.participants.length, 0);
    logger.info(`🔄 Starting verification: ${activeBattles.length} battles, ${totalParticipants} total participants`);

    // OPTIMIZATION: Skip shard if it has no participants to process
    // This saves Netlify invocations when using many shards with few participants
    if (shardingEnabled && totalParticipants < totalShards) {
      // If we have fewer participants than shards, some shards will be empty
      // Example: 10 participants, 16 shards → shards 10-15 have nothing to do
      if (shardId >= totalParticipants) {
        logger.info(`⏸️  Shard ${shardId} has no participants to process (total: ${totalParticipants})`);
        return {
          success: true,
          message: 'Shard has no participants',
          skipped: true,
          shardId,
          totalShards,
          totalParticipants
        };
      }
    }

    // OPTIMIZATION: Deduplicate participants across battles
    // Collect all unique participants first, then fetch tracks once per user
    // NOTE: Since users can only join one active/upcoming battle at a time (enforced in join.js),
    // each user will typically only have 1 battle in their battles array. This deduplication
    // is kept for backward compatibility and edge cases.
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

    // Deduplication complete - removed verbose logging

    // Convert to array for processing
    const participantEntries = Array.from(uniqueParticipantsMap.entries());

    // Apply sharding if enabled
    let participantsToProcess = participantEntries;

    if (shardingEnabled) {
      // Calculate which participants this shard should handle
      participantsToProcess = participantEntries.filter((_, index) => {
        return index % totalShards === shardId;
      });

      logger.info(`Shard ${shardId}/${totalShards}: Processing ${participantsToProcess.length}/${participantEntries.length} participants`);
    }

    // ROUND-ROBIN ROTATION: Rotate starting position based on current time
    // This ensures different users get priority each cycle, preventing starvation
    // Use seconds/10 to get a different offset every ~10 seconds (faster rotation than minutes)
    // Example with 18 participants:
    // Cycle 1 (time=1000s): offset = 100 % 18 = 10, process [10,11,...,17,0,1,...,9]
    // Cycle 2 (time=1240s): offset = 124 % 18 = 16, process [16,17,0,1,...,15]
    // Cycle 3 (time=1480s): offset = 148 % 18 = 4,  process [4,5,6,...,17,0,1,2,3]
    const currentSeconds = Math.floor(Date.now() / 1000);
    const rotationSeed = Math.floor(currentSeconds / 10); // Changes every 10 seconds
    const rotationOffset = participantsToProcess.length > 0 ? rotationSeed % participantsToProcess.length : 0;

    if (rotationOffset > 0) {
      participantsToProcess = [
        ...participantsToProcess.slice(rotationOffset),
        ...participantsToProcess.slice(0, rotationOffset)
      ];
    }

    // Process each unique participant once
    let participantsProcessed = 0;
    let participantsSkipped = 0;

    for (let i = 0; i < participantsToProcess.length; i++) {
      // Check if we're approaching timeout
      if (isNearTimeout()) {
        participantsSkipped = participantsToProcess.length - participantsProcessed;

        logger.warn('Timeout approaching - stopping processing', {
          processed: participantsProcessed,
          skipped: participantsSkipped,
          total: participantsToProcess.length,
          shardId: shardingEnabled ? shardId : 'none',
          note: shardingEnabled
            ? 'Skipped participants will be retried in next cycle'
            : 'Consider enabling sharding for better performance'
        });
        break;
      }

      const [username, data] = participantsToProcess[i];

      const participant = data.user;
      const participantBattles = data.battles;

      const PARTICIPANT_TIMEOUT = 4000; // 4 seconds max per participant (increased for multi-page fetches)

      try {
        // Find earliest start time across all battles this user is in
        const earliestStartTime = Math.min(...participantBattles.map(b => b.startTime.getTime()));

        // OPTIMIZATION: Check cache for participant tracks
        // Include battle IDs in cache key to prevent cross-battle contamination
        const battleIds = participantBattles.map(b => b._id.toString()).sort().join(',');
        const cacheKey = `${username}-${earliestStartTime}-${battleIds}`;
        const cachedData = participantTrackCache.get(cacheKey);
        let recentTracks;

        if (cachedData && (Date.now() - cachedData.timestamp) < PARTICIPANT_CACHE_TTL) {
          recentTracks = cachedData.tracks;
          // Using cached tracks - removed verbose logging
        } else {
          // Wrap Last.fm fetch with timeout
          // Use faster settings for serverless: 5s per request, 100ms delay between pages
          const fetchPromise = getRecentTracks(
            username,
            earliestStartTime,
            now.getTime(),
            {
              timeout: 5000, // 5 seconds per Last.fm API request (vs default 3s)
              delayBetweenRequests: 100 // 100ms between pages (vs default 200ms)
            }
          );

          let timeoutId;
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Participant processing timeout')), PARTICIPANT_TIMEOUT);
          });

          try {
            recentTracks = await Promise.race([fetchPromise, timeoutPromise]);
          } finally {
            // Clear timeout to prevent memory leak
            if (timeoutId) clearTimeout(timeoutId);
          }

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

          // Get existing StreamCount to determine when user joined the battle
          let streamCount = await StreamCount.findOne({
            battleId: battle._id,
            userId: participant._id
          });

          // Create StreamCount if it doesn't exist
          // The createdAt timestamp will capture when user first joined (first verification after join)
          if (!streamCount) {
            streamCount = await StreamCount.create({
              battleId: battle._id,
              userId: participant._id,
              count: 0,
              isCheater: false,
              scrobbleTimestamps: [],
              teamId: null
            });
          }

          // Always use createdAt as the join time boundary
          // This ensures consistent behavior: scrobbles are only counted from when user joined
          const countScrobblesFrom = streamCount.createdAt.getTime();

          // Only count scrobbles from AFTER the user joined
          // Use Math.max to ensure we don't count scrobbles before battle start OR before user joined
          const matchedTracks = recentTracks.filter(scrobble => {
            const isInTimeRange =
              scrobble.timestamp >= Math.max(battle.startTime.getTime(), countScrobblesFrom) &&
              scrobble.timestamp <= battle.endTime.getTime();

            return isInTimeRange && matchTrack(scrobble, battle.playlistTracks);
          });

          const count = matchedTracks.length;
          const timestamps = matchedTracks.map(t => t.timestamp);

          // Check if user is in a team for this battle
          const userTeam = await Team.findOne({
            battleId: battle._id,
            members: participant._id
          });

          await StreamCount.findOneAndUpdate(
            { battleId: battle._id, userId: participant._id },
            {
              count,
              isCheater: false,
              scrobbleTimestamps: timestamps,
              teamId: userTeam ? userTeam._id : null,
            },
            { upsert: false } // Don't upsert, we already created it above if needed
          );

          // Log all users with scrobbles
          if (count > 0) {
            logger.info(`${participant.username}: ${count} scrobbles`);
          }
        } // end for battle loop

        participantsProcessed++;

      } catch (error) {
        // Skip participant if they timeout or error
        if (error.message === 'Participant processing timeout') {
          logger.warn(`⏱️ ${participant.username}: Skipped (timeout)`);
          participantsSkipped++;
        } else {
          logger.error(`❌ Error for ${participant.username}: ${error.message}`);
          participantsProcessed++; // Count errors as processed
        }
      }
    } // end for unique participants loop

    // Socket.io removed - leaderboard updates will be fetched via polling

    const executionTime = Date.now() - startTime;

    // Comprehensive completion summary
    const shardInfo = shardingEnabled ? ` [Shard ${shardId}/${totalShards}]` : '';
    const status = participantsSkipped > 0 ? '⚠️' : '✅';
    logger.info(`${status} Verification complete${shardInfo}: ${participantsProcessed}/${participantsProcessed + participantsSkipped} processed (${executionTime}ms)`);

    return {
      success: true,
      executionTimeMs: executionTime,
      participantsProcessed,
      participantsSkipped,
      partialSuccess: participantsSkipped > 0,
      allComplete: participantsSkipped === 0,
      shardId: shardingEnabled ? shardId : null,
      totalShards: shardingEnabled ? totalShards : null
    };

  } catch (error) {
    logger.error('Verification error', { error: error.message, stack: error.stack });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Netlify-compatible verification endpoint
 * Designed to be called by an external cron service every 2 minutes
 * No setInterval - each invocation performs one verification cycle
 *
 * Query Parameters:
 * - shard: (optional) Shard ID for parallel processing (0, 1, 2, 3...)
 * - totalShards: (optional) Total number of shards (default: 4)
 *
 * Examples:
 * - POST /api/battle/verify - Process all participants (no sharding)
 * - POST /api/battle/verify?shard=0&totalShards=4 - Process shard 0 of 4
 * - POST /api/battle/verify?shard=1&totalShards=4 - Process shard 1 of 4
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
    // Parse shard parameters from query string
    const shardIdParam = req.query.shard;
    const totalShardsParam = req.query.totalShards;

    let shardId = null;
    let totalShards = 4;

    if (shardIdParam !== undefined) {
      shardId = parseInt(shardIdParam, 10);
      if (isNaN(shardId) || shardId < 0) {
        return res.status(400).json({
          error: 'Invalid shard parameter',
          message: 'shard must be a non-negative integer'
        });
      }
    }

    if (totalShardsParam !== undefined) {
      totalShards = parseInt(totalShardsParam, 10);
      if (isNaN(totalShards) || totalShards < 1) {
        return res.status(400).json({
          error: 'Invalid totalShards parameter',
          message: 'totalShards must be a positive integer'
        });
      }
    }

    if (shardId !== null && shardId >= totalShards) {
      return res.status(400).json({
        error: 'Invalid shard configuration',
        message: `shard (${shardId}) must be less than totalShards (${totalShards})`
      });
    }

    // Cron triggered - removed verbose logging

    const result = await verifyScrobbles(shardId, totalShards);

    res.status(200).json({
      message: 'Verification completed successfully',
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error) {
    logger.error('Verification handler error', { error: error.message });
    res.status(500).json({
      error: 'Verification failed',
      message: error.message
    });
  }
}
