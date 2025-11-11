import connectDB from '../../../utils/db';
import Battle from '../../../models/Battle';
import StreamCount from '../../../models/StreamCount';
import mongoose from 'mongoose';
import { createHandler, withCors, withRateLimit, withAuth, withValidation } from '../../../lib/middleware';
import { endBattleSchema } from '../../../lib/schemas';
import { logger } from '../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { battleId } = req.validatedBody;

    if (!mongoose.Types.ObjectId.isValid(battleId)) {
      return res.status(400).json({ error: 'Invalid battle ID' });
    }

    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.status === 'ended') {
      return res.status(400).json({ error: 'Battle has already ended' });
    }

    const streamCounts = await StreamCount.find({ battleId }).populate('userId', 'username');

    const finalLeaderboard = streamCounts.map(sc => ({
      userId: sc.userId._id,
      username: sc.userId.username,
      count: sc.count,
      isCheater: sc.isCheater || false,
    })).sort((a, b) => b.count - a.count);

    await Battle.findByIdAndUpdate(battleId, {
      status: 'ended',
      finalLeaderboard,
      endedAt: new Date(),
    });

    logger.info('Battle manually ended by admin', {
      battleId,
      battleName: battle.name,
      adminId: req.userId,
      participantCount: finalLeaderboard.length,
    });

    res.status(200).json({
      message: 'Battle ended successfully',
      battle: {
        id: battleId,
        name: battle.name,
        status: 'ended',
        finalLeaderboard,
      },
    });
  } catch (error) {
    logger.error('Error manually ending battle', { error: error.message });
    res.status(500).json({ error: 'Server error ending battle' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
  withAuth({ requireAdmin: true }),
  withValidation(endBattleSchema),
]);
