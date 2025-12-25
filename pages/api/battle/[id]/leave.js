import dbConnect from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import StreamCount from '../../../../models/StreamCount';
import Team from '../../../../models/Team';
import User from '../../../../models/User';
import { createHandler, withCors, withRateLimit, withAuth } from '../../../../lib/middleware';

/**
 * API endpoint for users to leave a battle
 * Battle hosts are not allowed to leave their own battles
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get authenticated user ID from middleware
    const userId = req.userId;

    const { id: battleId } = req.query;

    // Validate battleId
    if (!battleId) {
      return res.status(400).json({ error: 'Battle ID is required' });
    }

    // Find battle
    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    // Check if battle has ended
    if (battle.status === 'ended') {
      return res.status(400).json({ error: 'Cannot leave an ended battle' });
    }

    // Check if user is the battle host
    if (battle.host.toString() === userId) {
      return res.status(403).json({
        error: 'Battle hosts cannot leave their own battles',
        message: 'As the host, you must remain in the battle. You can end the battle or transfer host privileges to another participant.'
      });
    }

    // Check if user is a participant
    const participantIndex = battle.participants.findIndex(
      p => p.toString() === userId
    );

    if (participantIndex === -1) {
      return res.status(400).json({ error: 'You are not a participant in this battle' });
    }

    // Get user info
    const user = await User.findById(userId);

    // Get their current score before leaving
    const streamCount = await StreamCount.findOne({ battleId, userId });
    const scoreAtLeaving = streamCount?.count || 0;

    // Remove from participants array
    battle.participants.splice(participantIndex, 1);

    // Add to removedParticipants with "left voluntarily" reason
    if (!battle.removedParticipants) {
      battle.removedParticipants = [];
    }

    battle.removedParticipants.push({
      userId,
      username: user?.username || 'Unknown',
      removedAt: new Date(),
      removedBy: userId, // Self-removal
      scoreAtRemoval: scoreAtLeaving,
      reason: 'Left voluntarily',
    });

    // Remove from any teams
    const team = await Team.findOne({
      battleId,
      'members.userId': userId,
    });

    if (team) {
      team.members = team.members.filter(m => m.userId.toString() !== userId);

      // Delete team if no members left
      if (team.members.length === 0) {
        await Team.findByIdAndDelete(team._id);
      } else {
        await team.save();
      }
    }

    // Delete StreamCount record for this user in this battle
    await StreamCount.deleteOne({ battleId, userId });

    // Save battle
    await battle.save();

    return res.status(200).json({
      success: true,
      message: 'You have successfully left the battle',
      leftBattle: {
        battleId: battle._id,
        battleName: battle.name,
        scoreAtLeaving,
      },
    });
  } catch (error) {
    console.error('Error leaving battle:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
  withAuth({ requireAdmin: false }),
]);
