// Standalone verification script for Render.com cron jobs
// This runs outside of Next.js/Netlify serverless context with UNLIMITED timeout!

import connectDB from '../utils/db.js';
import Battle from '../models/Battle.js';
import StreamCount from '../models/StreamCount.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { getRecentTracks, matchTrack } from '../utils/lastfm.js';
import { logger } from '../utils/logger.js';

// Get shard info from command line arguments
const shardId = parseInt(process.argv[2] || '0', 10);
const totalShards = parseInt(process.argv[3] || '4', 10);

console.log(`Starting verification: Shard ${shardId}/${totalShards}`);

// Cache for participant tracks (same as verify.js)
const participantTrackCache = new Map();
const PARTICIPANT_CACHE_TTL = 90000; // 90 seconds

// Import cheating detection function
function detectCheating(timestamps) {
  if (timestamps.length < 5) return false;

  const sortedTimestamps = [...timestamps].sort((a, b) => a - b);

  // Rule 1: Detect 11+ scrobbles within 1 minute window
  for (let i = 0; i <= sortedTimestamps.length - 11; i++) {
    const windowStart = sortedTimestamps[i];
    const windowEnd = sortedTimestamps[i + 10];
    const windowDuration = (windowEnd - windowStart) / 1000 / 60;

    if (windowDuration <= 1) {
      return true;
    }
  }

  // Rule 2: Detect 5+ scrobbles within 30 seconds
  if (sortedTimestamps.length >= 5) {
    for (let i = 0; i <= sortedTimestamps.length - 5; i++) {
      const windowStart = sortedTimestamps[i];
      const windowEnd = sortedTimestamps[i + 4];
      const windowDuration = (windowEnd - windowStart) / 1000;

      if (windowDuration <= 30) {
        return true;
      }
    }
  }

  // Rule 3: Average time between scrobbles < 30 seconds
  if (sortedTimestamps.length >= 10) {
    const totalDuration = sortedTimestamps[sortedTimestamps.length - 1] - sortedTimestamps[0];
    const avgTimeBetweenScrobbles = totalDuration / (sortedTimestamps.length - 1) / 1000;

    if (avgTimeBetweenScrobbles < 30) {
      return true;
    }
  }

  return false;
}

async function freezeBattle(battle) {
  const streamCounts = await StreamCount.find({ battleId: battle._id })
    .populate('userId', 'username displayName')
    .populate({ path: 'teamId', strictPopulate: false });

  const teamScoresMap = new Map();
  const soloPlayers = [];

  for (const sc of streamCounts) {
    if (sc.teamId) {
      const teamIdStr = sc.teamId._id.toString();
      if (!teamScoresMap.has(teamIdStr)) {
        teamScoresMap.set(teamIdStr, {
          type: 'team',
          teamId: sc.teamId._id,
          teamName: sc.teamId.name,
          memberCount: sc.teamId.members.length,
          totalScore: 0,
          isCheater: false,
          members: [],
        });
      }

      const teamData = teamScoresMap.get(teamIdStr);
      teamData.totalScore += sc.count;
      if (sc.isCheater) {
        teamData.isCheater = true;
      }

      teamData.members.push({
        userId: sc.userId._id,
        username: sc.userId.username,
        displayName: sc.userId.displayName,
        count: sc.count,
        isCheater: sc.isCheater || false,
      });
    } else {
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

  const teams = Array.from(teamScoresMap.values());
  const combinedLeaderboard = [...teams, ...soloPlayers];

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
}

async function verifyScrobbles() {
  const startTime = Date.now();

  try {
    await connectDB();

    const now = new Date();

    // Transition upcoming battles to active
    const upcomingToActive = await Battle.updateMany(
      { status: 'upcoming', startTime: { $lte: now } },
      { status: 'active' }
    );

    if (upcomingToActive.modifiedCount > 0) {
      logger.info(`🟢 ${upcomingToActive.modifiedCount} battles transitioned to active`);
    }

    // End active battles
    const activeBattlesToEnd = await Battle.find({ status: 'active', endTime: { $lte: now } });

    if (activeBattlesToEnd.length > 0) {
      logger.info(`🏁 Ending ${activeBattlesToEnd.length} battles`);
    }

    for (const battle of activeBattlesToEnd) {
      await freezeBattle(battle);
    }

    // Get active battles for verification
    const activeBattles = await Battle.find({ status: 'active' });

    if (activeBattles.length === 0) {
      logger.info('⏸️  No active battles, skipping verification cycle');
      return { success: true, message: 'No active battles to verify', skipped: true };
    }

    const totalParticipants = activeBattles.reduce((sum, b) => sum + b.participants.length, 0);
    logger.info(`🔄 Starting verification: ${activeBattles.length} battles, ${totalParticipants} total participants`);

    // Early exit optimization for empty shards
    if (totalParticipants < totalShards && shardId >= totalParticipants) {
      logger.info(`⏸️  Shard ${shardId} has no participants to process (total: ${totalParticipants})`);
      return { success: true, message: 'Shard has no participants', skipped: true };
    }

    // Deduplicate participants
    const uniqueParticipantsMap = new Map();

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

    const participantEntries = Array.from(uniqueParticipantsMap.entries());

    // Apply sharding
    const participantsToProcess = participantEntries.filter((_, index) => {
      return index % totalShards === shardId;
    });

    logger.info(`Shard ${shardId}/${totalShards}: Processing ${participantsToProcess.length}/${participantEntries.length} participants`);

    // Round-robin rotation
    const currentSeconds = Math.floor(Date.now() / 1000);
    const rotationSeed = Math.floor(currentSeconds / 10);
    const rotationOffset = participantsToProcess.length > 0 ? rotationSeed % participantsToProcess.length : 0;

    let rotatedParticipants = participantsToProcess;
    if (rotationOffset > 0) {
      rotatedParticipants = [
        ...participantsToProcess.slice(rotationOffset),
        ...participantsToProcess.slice(0, rotationOffset)
      ];
    }

    // Process participants with NO TIMEOUT LIMIT!
    let participantsProcessed = 0;

    for (const [username, data] of rotatedParticipants) {
      const participant = data.user;
      const participantBattles = data.battles;

      try {
        const earliestStartTime = Math.min(...participantBattles.map(b => b.startTime.getTime()));
        const battleIds = participantBattles.map(b => b._id.toString()).sort().join(',');
        const cacheKey = `${username}-${earliestStartTime}-${battleIds}`;

        let recentTracks;
        const cachedData = participantTrackCache.get(cacheKey);

        if (cachedData && (Date.now() - cachedData.timestamp) < PARTICIPANT_CACHE_TTL) {
          recentTracks = cachedData.tracks;
        } else {
          recentTracks = await getRecentTracks(username, earliestStartTime, now.getTime());

          participantTrackCache.set(cacheKey, {
            tracks: recentTracks,
            timestamp: Date.now()
          });

          if (participantTrackCache.size > 200) {
            const oldestKeys = Array.from(participantTrackCache.keys()).slice(0, 100);
            oldestKeys.forEach(key => participantTrackCache.delete(key));
          }
        }

        for (const battle of participantBattles) {
          let streamCount = await StreamCount.findOne({
            battleId: battle._id,
            userId: participant._id
          });

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

          const countScrobblesFrom = streamCount.createdAt.getTime();

          const matchedTracks = recentTracks.filter(scrobble => {
            const isInTimeRange =
              scrobble.timestamp >= Math.max(battle.startTime.getTime(), countScrobblesFrom) &&
              scrobble.timestamp <= battle.endTime.getTime();

            return isInTimeRange && matchTrack(scrobble, battle.playlistTracks);
          });

          const count = matchedTracks.length;
          const timestamps = matchedTracks.map(t => t.timestamp);
          const isCheater = detectCheating(timestamps);

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
            { upsert: false }
          );

          if (isCheater || count > 50) {
            logger.warn(`${participant.username}: ${count} scrobbles${isCheater ? ' [CHEATER]' : ''}`);
          }
        }

        participantsProcessed++;

      } catch (error) {
        logger.error(`❌ Error for ${participant.username}: ${error.message}`);
      }
    }

    const executionTime = Date.now() - startTime;
    logger.info(`✅ Verification complete [Shard ${shardId}/${totalShards}]: ${participantsProcessed}/${participantsToProcess.length} processed (${executionTime}ms)`);

    return {
      success: true,
      executionTimeMs: executionTime,
      participantsProcessed,
      shardId,
      totalShards
    };

  } catch (error) {
    logger.error('Verification error', { error: error.message, stack: error.stack });
    throw error;
  }
}

// Run verification and exit
verifyScrobbles()
  .then(result => {
    console.log('Verification completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
