import connectDB from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import StreamCount from '../../../../models/StreamCount';
import Team from '../../../../models/Team';
import User from '../../../../models/User';
import { getRecentTracks, matchTrack } from '../../../../utils/lastfm';
import { createHandler, withCors, withRateLimit, withAuth } from '../../../../lib/middleware';
import { logger } from '../../../../utils/logger';
import mongoose from 'mongoose';

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

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const MAX_EXECUTION_TIME = 9000; // 9 seconds (Netlify 10s - 1s buffer)
  const startTime = Date.now();

  try {
    await connectDB();

    const { battleId } = req.body;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(battleId)) {
      return res.status(400).json({ error: 'Invalid battle ID' });
    }

    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.status !== 'active') {
      return res.status(400).json({
        error: 'Battle is not active',
        status: battle.status
      });
    }

    // Check if user is participant
    const user = await User.findById(req.userId);
    if (!user.lastfmUsername) {
      return res.status(400).json({ error: 'Last.fm username not set' });
    }

    if (!battle.participants.some(p => p.toString() === req.userId)) {
      return res.status(400).json({ error: 'You are not a participant in this battle' });
    }

    // Get or create StreamCount
    let streamCount = await StreamCount.findOne({
      battleId: battle._id,
      userId: req.userId
    });

    if (!streamCount) {
      streamCount = await StreamCount.create({
        battleId: battle._id,
        userId: req.userId,
        count: 0,
        isCheater: false,
        scrobbleTimestamps: [],
        teamId: null,
        lastSyncedAt: null,
        lastSyncType: null,
        lastSyncedBy: null
      });
    }

    // Check 5-minute cooldown
    const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
    if (streamCount.lastSyncedAt) {
      const timeSinceLastSync = Date.now() - streamCount.lastSyncedAt.getTime();
      if (timeSinceLastSync < RATE_LIMIT_MS) {
        const remainingSeconds = Math.ceil((RATE_LIMIT_MS - timeSinceLastSync) / 1000);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Please wait ${remainingSeconds} seconds before syncing again`,
          retryAfter: remainingSeconds,
          lastSyncedAt: streamCount.lastSyncedAt
        });
      }
    }

    // Fetch scrobbles with pagination (max 4 pages = 800 tracks)
    const countScrobblesFrom = streamCount.createdAt.getTime();
    const recentTracks = await getRecentTracks(
      user.lastfmUsername,
      Math.max(battle.startTime.getTime(), countScrobblesFrom),
      battle.endTime.getTime(),
      { maxPages: 4, delayBetweenRequests: 200 } // ~800 scrobbles, ~4 seconds
    );

    // Check timeout
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'Sync took too long. Try full sync instead.'
      });
    }

    // Match tracks against playlist
    const matchedTracks = recentTracks.filter(scrobble => {
      const isInTimeRange =
        scrobble.timestamp >= Math.max(battle.startTime.getTime(), countScrobblesFrom) &&
        scrobble.timestamp <= battle.endTime.getTime();

      return isInTimeRange && matchTrack(scrobble, battle.playlistTracks);
    });

    const count = matchedTracks.length;
    const timestamps = matchedTracks.map(t => t.timestamp);

    // Detect cheating
    const isCheater = detectCheating(timestamps);

    // Check if user is in a team
    const userTeam = await Team.findOne({
      battleId: battle._id,
      members: req.userId
    });

    // Update StreamCount
    await StreamCount.findOneAndUpdate(
      { battleId: battle._id, userId: req.userId },
      {
        count,
        isCheater,
        scrobbleTimestamps: timestamps,
        teamId: userTeam ? userTeam._id : null,
        lastSyncedAt: new Date(),
        lastSyncType: 'quick',
        lastSyncedBy: req.userId
      }
    );

    logger.info('Quick sync completed', {
      userId: req.userId,
      battleId,
      username: user.username,
      count,
      executionTime: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      count,
      isCheater,
      syncType: 'quick',
      message: isCheater ? 'Scrobbles synced (suspicious pattern detected)' : 'Scrobbles synced successfully',
      executionTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Quick sync error', {
      error: error.message,
      userId: req.userId,
      battleId: req.body.battleId
    });
    res.status(500).json({ error: 'Sync failed', message: error.message });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(5, 60000), // 5 requests per minute per user
  withAuth()
]);
