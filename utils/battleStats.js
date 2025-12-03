import Battle from '../models/Battle';
import StreamCount from '../models/StreamCount';
import Team from '../models/Team';

/**
 * Calculate comprehensive statistics for a battle
 * @param {string} battleId - The battle ID
 * @returns {Promise<Object>} Statistics object
 */
export async function calculateBattleStats(battleId) {
  const battle = await Battle.findById(battleId);
  if (!battle) throw new Error('Battle not found');

  const streamCounts = await StreamCount.find({ battleId });

  // Basic stats
  const totalScrobbles = streamCounts.reduce((sum, sc) => sum + sc.count, 0);
  const activeParticipants = battle.participants.length;
  const removedParticipants = battle.removedParticipants?.length || 0;

  // Team stats
  let teamCount = 0;
  let soloCount = 0;
  if (battle.allowTeams) {
    const teams = await Team.find({ battleId }).distinct('_id');
    teamCount = teams.length;
    soloCount = streamCounts.filter(sc => !sc.teamId).length;
  }

  // Time-based stats
  const now = new Date();
  const startTime = new Date(battle.startTime);
  const endTime = new Date(battle.endTime);
  const totalDuration = endTime - startTime;
  const elapsed = Math.min(now - startTime, totalDuration);
  const percentComplete = (elapsed / totalDuration) * 100;

  // Participation rate
  const scrobblingUsers = new Set(streamCounts.filter(sc => sc.count > 0).map(sc => sc.userId.toString()));
  const participationRate = (scrobblingUsers.size / activeParticipants) * 100;

  // Top performer
  let topPerformer = null;
  if (streamCounts.length > 0) {
    const sorted = [...streamCounts].sort((a, b) => b.count - a.count);
    topPerformer = {
      username: sorted[0].username,
      score: sorted[0].count
    };
  }

  // Average scrobbles per user
  const avgScrobblesPerUser = scrobblingUsers.size > 0
    ? totalScrobbles / scrobblingUsers.size
    : 0;

  // Extension stats
  const timesExtended = battle.extensionHistory?.length || 0;
  const totalExtensionTime = battle.extensionHistory?.reduce((sum, ext) => {
    return sum + (new Date(ext.newEndTime) - new Date(ext.previousEndTime));
  }, 0) || 0;

  // Kick stats
  const kickedUsers = removedParticipants;
  const totalScoresRemoved = battle.removedParticipants?.reduce((sum, rp) =>
    sum + (rp.scoreAtRemoval || 0), 0) || 0;

  return {
    basic: {
      totalScrobbles,
      activeParticipants,
      removedParticipants,
      participationRate: Math.round(participationRate * 10) / 10
    },
    teams: battle.allowTeams ? {
      teamCount,
      soloCount,
      totalParticipants: activeParticipants
    } : null,
    progress: {
      percentComplete: Math.round(percentComplete * 10) / 10,
      elapsedTime: elapsed,
      remainingTime: Math.max(0, endTime - now),
      totalDuration
    },
    performance: {
      topPerformer,
      avgScrobblesPerUser: Math.round(avgScrobblesPerUser * 10) / 10,
      scrobblingUsers: scrobblingUsers.size
    },
    extensions: {
      timesExtended,
      totalExtensionTime,
      originalEndTime: battle.originalEndTime || battle.endTime
    },
    removals: {
      kickedUsers,
      totalScoresRemoved
    },
    timeline: {
      created: battle.createdAt,
      started: battle.startTime,
      ends: battle.endTime,
      status: battle.status
    }
  };
}

/**
 * Calculate hourly scrobble distribution
 * @param {string} battleId - The battle ID
 * @returns {Promise<Array>} Hourly distribution
 */
export async function getHourlyDistribution(battleId) {
  const battle = await Battle.findById(battleId);
  if (!battle) throw new Error('Battle not found');

  const streamCounts = await StreamCount.find({ battleId });

  // Create hourly buckets from start to end time
  const startTime = new Date(battle.startTime);
  const endTime = new Date(battle.endTime);
  const hours = Math.ceil((endTime - startTime) / (1000 * 60 * 60));

  const distribution = [];
  for (let i = 0; i < hours; i++) {
    distribution.push({
      hour: i,
      timestamp: new Date(startTime.getTime() + i * 60 * 60 * 1000),
      scrobbles: 0
    });
  }

  // Note: This is a simplified version. For real hourly tracking,
  // you'd need to store timestamps with each scrobble.
  // For now, we'll estimate based on current counts
  const totalScrobbles = streamCounts.reduce((sum, sc) => sum + sc.count, 0);
  const currentHour = Math.floor((new Date() - startTime) / (1000 * 60 * 60));

  if (currentHour >= 0 && currentHour < hours) {
    distribution[currentHour].scrobbles = totalScrobbles;
  }

  return distribution;
}

/**
 * Get top performers list
 * @param {string} battleId - The battle ID
 * @param {number} limit - Number of top performers to return
 * @returns {Promise<Array>} Top performers
 */
export async function getTopPerformers(battleId, limit = 10) {
  const streamCounts = await StreamCount.find({ battleId })
    .sort({ count: -1 })
    .limit(limit);

  return streamCounts.map((sc, index) => ({
    rank: index + 1,
    username: sc.username,
    score: sc.count,
    teamId: sc.teamId || null
  }));
}
