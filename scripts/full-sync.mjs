// Get parameters from command line arguments
const battleId = process.argv[2];
const userId = process.argv[3];

if (!battleId || !userId) {
  console.error('Usage: node full-sync.mjs <battleId> <userId>');
  process.exit(1);
}

console.log(`Starting full sync: Battle ${battleId}, User ${userId}`);

// Dynamic imports
const connectDB = (await import('../utils/db.js')).default;
const Battle = (await import('../models/Battle.js')).default;
const StreamCount = (await import('../models/StreamCount.js')).default;
const Team = (await import('../models/Team.js')).default;
const User = (await import('../models/User.js')).default;
const { getRecentTracks, matchTrack } = await import('../utils/lastfm.js');
const { logger } = await import('../utils/logger.js');
const mongoose = (await import('mongoose')).default;

function detectCheating(timestamps) {
  if (!timestamps || timestamps.length < 5) {
    return false;
  }

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

async function fullSync() {
  const startTime = Date.now();

  try {
    await connectDB();

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(battleId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid battleId or userId');
    }

    // Fetch battle
    const battle = await Battle.findById(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    if (battle.status !== 'active') {
      throw new Error(`Battle is ${battle.status}, not active`);
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.lastfmUsername) {
      throw new Error('User has no Last.fm username');
    }

    // Check if user is participant
    if (!battle.participants.some(p => p.toString() === userId)) {
      throw new Error('User is not a participant in this battle');
    }

    // Get or create StreamCount
    let streamCount = await StreamCount.findOne({
      battleId: battle._id,
      userId: user._id
    });

    if (!streamCount) {
      streamCount = await StreamCount.create({
        battleId: battle._id,
        userId: user._id,
        count: 0,
        isCheater: false,
        scrobbleTimestamps: [],
        teamId: null
      });
    }

    const countScrobblesFrom = streamCount.createdAt.getTime();

    logger.info('Fetching ALL scrobbles for user', {
      username: user.lastfmUsername,
      battleId,
      userId,
      from: new Date(Math.max(battle.startTime.getTime(), countScrobblesFrom)),
      to: new Date(battle.endTime.getTime())
    });

    // Fetch ALL tracks (no maxPages limit, full pagination)
    const recentTracks = await getRecentTracks(
      user.lastfmUsername,
      Math.max(battle.startTime.getTime(), countScrobblesFrom),
      battle.endTime.getTime(),
      { maxPages: null, delayBetweenRequests: 200 } // FULL PAGINATION
    );

    logger.info(`Fetched ${recentTracks.length} total scrobbles from Last.fm`);

    // Match tracks against playlist
    const matchedTracks = recentTracks.filter(scrobble => {
      const isInTimeRange =
        scrobble.timestamp >= Math.max(battle.startTime.getTime(), countScrobblesFrom) &&
        scrobble.timestamp <= battle.endTime.getTime();

      return isInTimeRange && matchTrack(scrobble, battle.playlistTracks);
    });

    const count = matchedTracks.length;
    const timestamps = matchedTracks.map(t => t.timestamp);
    const isCheater = detectCheating(timestamps);

    logger.info(`Matched ${count} playlist tracks`);

    // Check if user is in a team
    const userTeam = await Team.findOne({
      battleId: battle._id,
      members: user._id
    });

    // Update StreamCount
    await StreamCount.findOneAndUpdate(
      { battleId: battle._id, userId: user._id },
      {
        count,
        isCheater,
        scrobbleTimestamps: timestamps,
        teamId: userTeam ? userTeam._id : null
      }
    );

    const executionTime = Date.now() - startTime;

    logger.info('Full sync completed', {
      userId,
      battleId,
      username: user.username,
      count,
      isCheater,
      executionTime,
      totalScrobbles: recentTracks.length,
      matchedScrobbles: count
    });

    console.log('Full sync successful:', {
      user: user.username,
      battle: battle.name,
      count,
      executionTime: `${executionTime}ms`
    });

    process.exit(0);

  } catch (error) {
    logger.error('Full sync error', {
      error: error.message,
      stack: error.stack,
      battleId,
      userId
    });
    console.error('Full sync failed:', error.message);
    process.exit(1);
  }
}

// Run sync
fullSync();
