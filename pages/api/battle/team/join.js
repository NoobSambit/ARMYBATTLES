import { createHandler, withCors, withRateLimit, withValidation, withAuth } from '../../../../lib/middleware';
import connectDB from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import Team from '../../../../models/Team';
import StreamCount from '../../../../models/StreamCount';
import { joinTeamSchema } from '../../../../lib/schemas';

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

    const { inviteCode } = req.body;
    const userId = req.userId;

    // Find team by invite code
    const team = await Team.findOne({ inviteCode });
    if (!team) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if battle exists and is not ended
    const battle = await Battle.findById(team.battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.status === 'ended') {
      return res.status(400).json({ error: 'Cannot join team for ended battle' });
    }

    // Check if user is a participant in the battle
    if (!battle.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ error: 'You must join the battle before joining a team' });
    }

    // Check if user is already in a team for this battle
    const existingTeam = await Team.findOne({
      battleId: team.battleId,
      members: userId
    });

    if (existingTeam) {
      if (existingTeam._id.toString() === team._id.toString()) {
        return res.status(400).json({ error: 'You are already a member of this team' });
      }
      return res.status(400).json({
        error: 'You are already in another team for this battle',
        teamName: existingTeam.name
      });
    }

    // Add user to team
    team.members.push(userId);
    await team.save();

    // Update user's StreamCount to set teamId
    await StreamCount.findOneAndUpdate(
      { battleId: team.battleId, userId },
      { teamId: team._id },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Emit Socket.io event for real-time update
    const io = getSocketIO();
    if (io) {
      io.to(`battle-${team.battleId}`).emit('team-updated', {
        teamId: team._id,
        action: 'member-joined',
        memberCount: team.members.length,
      });
    }

    return res.status(200).json({
      team: {
        id: team._id.toString(),
        name: team.name,
        members: team.members,
        memberCount: team.members.length,
      },
    });

  } catch (error) {
    console.error('Join team error:', error);
    return res.status(500).json({
      error: 'Failed to join team. Please try again.'
    });
  }
}

export default createHandler(handler, [
  withCors,
  withAuth(),
  withRateLimit(10, 60000),
  withValidation(joinTeamSchema),
]);
