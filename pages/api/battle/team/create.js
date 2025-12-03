import { createHandler, withCors, withRateLimit, withValidation, withAuth } from '../../../../lib/middleware';
import connectDB from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import Team from '../../../../models/Team';
import StreamCount from '../../../../models/StreamCount';
import { createTeamSchema } from '../../../../lib/schemas';
import crypto from 'crypto';

/**
 * Generate a random 8-character invite code
 * Uses uppercase alphanumeric characters
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const bytes = crypto.randomBytes(8);

  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }

  return code;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { battleId, teamName } = req.body;
    const userId = req.userId;

    // Check if battle exists and is not ended
    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.status === 'ended') {
      return res.status(400).json({ error: 'Cannot create team for ended battle' });
    }

    // Check if user is a participant in the battle
    if (!battle.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ error: 'You must join the battle before creating a team' });
    }

    // Check if user is already in a team for this battle
    const existingTeam = await Team.findOne({
      battleId,
      members: userId
    });

    if (existingTeam) {
      return res.status(400).json({
        error: 'You are already in a team for this battle',
        teamName: existingTeam.name
      });
    }

    // Generate unique invite code
    let inviteCode;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      inviteCode = generateInviteCode();
      const existingCode = await Team.findOne({ inviteCode });
      if (!existingCode) break;
      attempts++;
    }

    if (attempts === maxAttempts) {
      return res.status(500).json({ error: 'Failed to generate unique invite code. Please try again.' });
    }

    // Create team
    const team = await Team.create({
      battleId,
      name: teamName,
      creatorId: userId,
      members: [userId],
      inviteCode,
    });

    // Update user's StreamCount to set teamId (or create if doesn't exist yet)
    await StreamCount.findOneAndUpdate(
      { battleId, userId },
      { teamId: team._id },
      { upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      team: {
        id: team._id.toString(),
        name: team.name,
        inviteCode: team.inviteCode,
        members: [userId],
        memberCount: 1,
      },
    });

  } catch (error) {
    console.error('Create team error:', error);

    // Handle unique constraint violation on team name
    if (error.code === 11000 && error.keyPattern?.name) {
      return res.status(400).json({
        error: 'A team with this name already exists in this battle'
      });
    }

    return res.status(500).json({
      error: 'Failed to create team. Please try again.'
    });
  }
}

export default createHandler(handler, [
  withCors,
  withAuth(),
  withRateLimit(10, 60000),
  withValidation(createTeamSchema),
]);
