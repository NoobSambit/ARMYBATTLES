import connectDB from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import StreamCount from '../../../../models/StreamCount';
import User from '../../../../models/User';
import mongoose from 'mongoose';
import { createHandler, withCors } from '../../../../lib/middleware';
import { logger } from '../../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid battle ID' });
    }

    const battle = await Battle.findById(id).populate('participants', 'username');
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    let leaderboard;

    if (battle.status === 'ended' && battle.finalLeaderboard && battle.finalLeaderboard.length > 0) {
      leaderboard = battle.finalLeaderboard;
    } else {
      const streamCounts = await StreamCount.find({ battleId: id }).populate('userId', 'username');

      const participantIds = battle.participants.map(p => p._id.toString());
      const existingUserIds = streamCounts.map(sc => sc.userId._id.toString());
      
      const missingParticipants = battle.participants.filter(
        p => !existingUserIds.includes(p._id.toString())
      );

      leaderboard = [
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
    }

    res.status(200).json({
      battleId: id,
      battleName: battle.name,
      status: battle.status,
      startTime: battle.startTime,
      endTime: battle.endTime,
      participantCount: battle.participants.length,
      leaderboard,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Leaderboard fetch error', { error: error.message, battleId: req.query.id });
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
}

export default createHandler(handler, [withCors]);
