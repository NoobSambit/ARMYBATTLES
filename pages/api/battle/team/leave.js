import { createHandler, withCors, withRateLimit, withValidation, withAuth } from '../../../../lib/middleware';
import connectDB from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import Team from '../../../../models/Team';
import StreamCount from '../../../../models/StreamCount';
import { leaveTeamSchema } from '../../../../lib/schemas';

function getSocketIO() {
  try {
    const socketModule = require('../../socket');
    return socketModule.getIO();
  } catch (error) {
    return null;
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { teamId } = req.body;
    const userId = req.userId;

    // Find team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is a member
    if (!team.members.some(m => m.toString() === userId)) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }

    // Check if battle is ended
    const battle = await Battle.findById(team.battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.status === 'ended') {
      return res.status(400).json({ error: 'Cannot leave team after battle has ended' });
    }

    // Remove user from team
    team.members = team.members.filter(m => m.toString() !== userId);

    // If team is now empty, delete it
    if (team.members.length === 0) {
      await Team.findByIdAndDelete(teamId);

      // Update user's StreamCount to remove teamId (becomes solo player)
      await StreamCount.findOneAndUpdate(
        { battleId: team.battleId, userId },
        { teamId: null }
      );

      // Emit Socket.io event for real-time update
      const io = getSocketIO();
      if (io) {
        io.to(`battle-${team.battleId}`).emit('team-updated', {
          teamId: team._id,
          action: 'team-deleted',
          memberCount: 0,
        });
      }

      return res.status(200).json({
        message: 'Left team successfully. Team was deleted as it became empty.',
      });
    } else {
      await team.save();

      // Update user's StreamCount to remove teamId (becomes solo player)
      await StreamCount.findOneAndUpdate(
        { battleId: team.battleId, userId },
        { teamId: null }
      );

      // Emit Socket.io event for real-time update
      const io = getSocketIO();
      if (io) {
        io.to(`battle-${team.battleId}`).emit('team-updated', {
          teamId: team._id,
          action: 'member-left',
          memberCount: team.members.length,
        });
      }

      return res.status(200).json({
        message: 'Left team successfully',
      });
    }

  } catch (error) {
    console.error('Leave team error:', error);
    return res.status(500).json({
      error: 'Failed to leave team. Please try again.'
    });
  }
}

export default createHandler(handler, [
  withCors,
  withAuth(),
  withRateLimit(10, 60000),
  withValidation(leaveTeamSchema),
]);
