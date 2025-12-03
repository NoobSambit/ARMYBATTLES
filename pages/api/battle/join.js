import connectDB from '../../../utils/db';
import Battle from '../../../models/Battle';
import User from '../../../models/User';
import mongoose from 'mongoose';
import { createHandler, withCors, withRateLimit, withAuth, withValidation } from '../../../lib/middleware';
import { joinBattleSchema } from '../../../lib/schemas';
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

    const user = await User.findById(req.userId);
    if (!user || !user.lastfmUsername) {
      return res.status(400).json({ error: 'Please set your Last.fm username before joining a battle' });
    }

    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.status === 'ended') {
      return res.status(400).json({ error: 'This battle has already ended' });
    }

    const result = await Battle.findByIdAndUpdate(
      battleId,
      { $addToSet: { participants: req.userId } },
      { new: true }
    );

    const isNewParticipant = result.participants.length > battle.participants.length;

    if (isNewParticipant) {
      logger.info('User joined battle', { userId: req.userId, battleId, battleName: battle.name });
    }

    res.status(200).json({
      message: isNewParticipant ? 'Successfully joined battle' : 'You have already joined this battle',
      battle: {
        id: result._id,
        name: result.name,
        participantCount: result.participants.length,
      },
    });
  } catch (error) {
    logger.error('Battle join error', { error: error.message });
    res.status(500).json({ error: 'Server error joining battle' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
  withAuth(),
  withValidation(joinBattleSchema),
]);
