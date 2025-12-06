import dbConnect from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import StreamCount from '../../../../models/StreamCount';
import Team from '../../../../models/Team';
import { kickParticipantSchema } from '../../../../lib/schemas';
import { createHandler, withCors, withRateLimit, withAuth } from '../../../../lib/middleware';

/**
 * API endpoint to kick a participant from a battle
 * Only the battle host can kick participants
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get authenticated user ID from middleware
    const hostId = req.userId;

    const { id: battleId } = req.query;

    // Validate input
    const validation = kickParticipantSchema.safeParse({
      battleId,
      userId: req.body.userId,
      reason: req.body.reason,
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const { userId, reason } = validation.data;

    // Find battle
    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    // Check if requester is the host
    if (battle.host.toString() !== hostId) {
      return res.status(403).json({ error: 'Only the battle host can kick participants' });
    }

    // Check if battle is active
    if (battle.status === 'ended') {
      return res.status(400).json({ error: 'Cannot kick participants from an ended battle' });
    }

    // Check if user is a participant
    const participantIndex = battle.participants.findIndex(
      p => p.userId.toString() === userId
    );

    if (participantIndex === -1) {
      return res.status(400).json({ error: 'User is not a participant in this battle' });
    }

    // Prevent host from kicking themselves
    if (userId === hostId) {
      return res.status(400).json({ error: 'Host cannot kick themselves' });
    }

    const participant = battle.participants[participantIndex];

    // Get their current score
    const streamCount = await StreamCount.findOne({ battleId, userId });
    const scoreAtRemoval = streamCount?.count || 0;

    // Remove from participants array
    battle.participants.splice(participantIndex, 1);

    // Add to removedParticipants
    if (!battle.removedParticipants) {
      battle.removedParticipants = [];
    }

    battle.removedParticipants.push({
      userId,
      username: participant.username,
      removedAt: new Date(),
      removedBy: hostId,
      scoreAtRemoval,
      reason: reason || 'No reason provided',
    });

    // Remove from any teams
    const team = await Team.findOne({
      battleId,
      'members.userId': userId,
    });

    if (team) {
      team.members = team.members.filter(m => m.userId.toString() !== userId);
      await team.save();
    }

    // Save battle
    await battle.save();

    return res.status(200).json({
      success: true,
      message: `${participant.username} has been removed from the battle`,
      removedUser: {
        userId,
        username: participant.username,
        scoreAtRemoval,
      },
    });
  } catch (error) {
    console.error('Error kicking participant:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
  withAuth({ requireAdmin: false }),
]);
