import connectDB from '../../../utils/db';
import Battle from '../../../models/Battle';
import StreamCount from '../../../models/StreamCount';
import User from '../../../models/User';
import { getRecentTracks, matchTrack } from '../../../utils/lastfm';
import { logger } from '../../../utils/logger';

let verificationInterval = null;
let socketIO = null;

function getSocketIO() {
  try {
    if (!socketIO) {
      const socketModule = require('./socket');
      socketIO = socketModule.getIO();
    }
    return socketIO;
  } catch (error) {
    return null;
  }
}

function detectCheating(timestamps) {
  if (timestamps.length < 11) return false;

  const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
  
  for (let i = 0; i <= sortedTimestamps.length - 11; i++) {
    const windowStart = sortedTimestamps[i];
    const windowEnd = sortedTimestamps[i + 10];
    const windowDuration = (windowEnd - windowStart) / 1000 / 60;
    
    if (windowDuration <= 1) {
      return true;
    }
  }
  
  return false;
}

async function freezeBattle(battle) {
  try {
    const streamCounts = await StreamCount.find({ battleId: battle._id }).populate('userId', 'username');
    
    const finalLeaderboard = streamCounts.map(sc => ({
      userId: sc.userId._id,
      username: sc.userId.username,
      count: sc.count,
      isCheater: sc.isCheater || false,
    })).sort((a, b) => b.count - a.count);

    await Battle.findByIdAndUpdate(battle._id, {
      status: 'ended',
      finalLeaderboard,
      endedAt: new Date(),
    });

    logger.info('Battle frozen', { 
      battleId: battle._id, 
      battleName: battle.name,
      participantCount: finalLeaderboard.length 
    });

    const io = getSocketIO();
    if (io) {
      io.to(`battle-${battle._id}`).emit('battle-ended', {
        battleId: battle._id,
        leaderboard: finalLeaderboard,
      });
    }
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

    logger.info('Verification cycle started', { 
      time: now.toISOString(), 
      activeBattles: activeBattles.length 
    });

    for (const battle of activeBattles) {
      const participants = await User.find({ _id: { $in: battle.participants } });

      for (const participant of participants) {
        if (!participant.lastfmUsername) {
          continue;
        }

        try {
          const recentTracks = await getRecentTracks(
            participant.lastfmUsername,
            battle.startTime.getTime(),
            now.getTime()
          );

          const matchedTracks = recentTracks.filter(scrobble => {
            const isInTimeRange = 
              scrobble.timestamp >= battle.startTime.getTime() &&
              scrobble.timestamp <= battle.endTime.getTime();
            
            return isInTimeRange && matchTrack(scrobble, battle.playlistTracks);
          });

          const count = matchedTracks.length;
          const timestamps = matchedTracks.map(t => t.timestamp);
          const isCheater = detectCheating(timestamps);

          await StreamCount.findOneAndUpdate(
            { battleId: battle._id, userId: participant._id },
            { 
              count, 
              isCheater,
              scrobbleTimestamps: timestamps,
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
          });

        } catch (error) {
          logger.error('Error verifying scrobbles for user', { 
            username: participant.username, 
            battleId: battle._id,
            error: error.message 
          });
        }
      }

      const streamCounts = await StreamCount.find({ battleId: battle._id }).populate('userId', 'username');
      
      const participantIds = battle.participants.map(p => p.toString());
      const existingUserIds = streamCounts.map(sc => sc.userId._id.toString());
      
      const missingParticipants = await User.find({
        _id: { $in: participantIds.filter(id => !existingUserIds.includes(id)) }
      });

      const leaderboard = [
        ...streamCounts.map(sc => ({
          userId: sc.userId._id,
          username: sc.userId.username,
          count: sc.count,
          isCheater: sc.isCheater || false,
        })),
        ...missingParticipants.map(p => ({
          userId: p._id,
          username: p.username,
          count: 0,
          isCheater: false,
        })),
      ].sort((a, b) => b.count - a.count);

      const io = getSocketIO();
      if (io) {
        io.to(`battle-${battle._id}`).emit('leaderboard-update', {
          battleId: battle._id,
          leaderboard,
          updatedAt: now.toISOString(),
        });
      }
    }

    logger.info('Verification cycle completed', { time: now.toISOString() });

  } catch (error) {
    logger.error('Verification error', { error: error.message, stack: error.stack });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verificationInterval) {
    logger.info('Starting scrobble verification process');
    
    verificationInterval = setInterval(verifyScrobbles, 30000);
    
    verifyScrobbles();

    res.status(200).json({ message: 'Verification process started' });
  } else {
    res.status(200).json({ message: 'Verification process already running' });
  }
}
