import connectDB from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import StreamCount from '../../../../models/StreamCount';
import Team from '../../../../models/Team';
import mongoose from 'mongoose';
import { createHandler, withCors, withRateLimit, withAuth } from '../../../../lib/middleware';
import { logger } from '../../../../utils/logger';
import { buildBattleLeaderboard, sortBattleLeaderboard } from '../../../../lib/leaderboard-utils';
import { clearBattleLeaderboardCache } from '../../../../lib/leaderboard-cache';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid battle ID' });
    }

    const battle = await Battle.findById(id);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    // Check if the authenticated user is the battle host
    if (battle.host.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the battle host can end the battle' });
    }

    if (battle.status === 'ended') {
      return res.status(400).json({ error: 'Battle has already ended' });
    }

    // Fetch all stream counts for this battle
    const streamCounts = await StreamCount.find({ battleId: id })
      .populate('userId', 'username displayName avatarUrl')
      .populate('teamId', 'name members');
    const battleTeams = await Team.find({ battleId: id }).select('name members');

    const { teams, soloPlayers } = buildBattleLeaderboard({
      streamCounts,
      battleTeams,
      includeTeamMembers: true,
    });

    // Combine teams and solo players
    const combinedLeaderboard = [...teams, ...soloPlayers];

    // Sort by score
    const finalLeaderboard = sortBattleLeaderboard(combinedLeaderboard);

    // Update battle status
    await Battle.findByIdAndUpdate(id, {
      status: 'ended',
      finalLeaderboard,
      endedAt: new Date(),
    });

    clearBattleLeaderboardCache(id);

    logger.info('Battle ended by host', {
      battleId: id,
      battleName: battle.name,
      hostId: req.userId,
      participantCount: battle.participants.length,
      finalScores: finalLeaderboard.length,
    });

    res.status(200).json({
      message: 'Battle ended successfully',
      battle: {
        id,
        name: battle.name,
        status: 'ended',
        finalLeaderboard,
      },
    });
  } catch (error) {
    logger.error('Error ending battle', { error: error.message, battleId: req.query.id });
    res.status(500).json({ error: 'Server error ending battle' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
  withAuth({ requireAdmin: false }),
]);
