import connectDB from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import StreamCount from '../../../../models/StreamCount';
import mongoose from 'mongoose';
import { createHandler, withCors, withRateLimit, withAuth } from '../../../../lib/middleware';
import { logger } from '../../../../utils/logger';

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

    // Build final leaderboard with team support
    const teamScoresMap = new Map();
    const soloPlayers = [];

    for (const sc of streamCounts) {
      if (sc.teamId) {
        // Team member
        const teamIdStr = sc.teamId._id.toString();
        if (!teamScoresMap.has(teamIdStr)) {
          teamScoresMap.set(teamIdStr, {
            type: 'team',
            teamId: sc.teamId._id,
            teamName: sc.teamId.name,
            memberCount: sc.teamId.members.length,
            totalScore: 0,
            isCheater: false,
            members: [], // Store individual team member scores
          });
        }

        const teamData = teamScoresMap.get(teamIdStr);
        teamData.totalScore += sc.count;
        if (sc.isCheater) {
          teamData.isCheater = true;
        }

        // Add individual team member data
        teamData.members.push({
          userId: sc.userId._id,
          username: sc.userId.username,
          displayName: sc.userId.displayName,
          count: sc.count,
          isCheater: sc.isCheater || false,
        });
      } else {
        // Solo player
        soloPlayers.push({
          type: 'solo',
          userId: sc.userId._id,
          username: sc.userId.username,
          displayName: sc.userId.displayName,
          avatarUrl: sc.userId.avatarUrl,
          count: sc.count,
          isCheater: sc.isCheater || false,
        });
      }
    }

    // Combine teams and solo players
    const teams = Array.from(teamScoresMap.values());
    const combinedLeaderboard = [...teams, ...soloPlayers];

    // Sort by score
    const finalLeaderboard = combinedLeaderboard.sort((a, b) => {
      const scoreA = a.type === 'team' ? a.totalScore : a.count;
      const scoreB = b.type === 'team' ? b.totalScore : b.count;
      return scoreB - scoreA;
    });

    // Update battle status
    await Battle.findByIdAndUpdate(id, {
      status: 'ended',
      finalLeaderboard,
      endedAt: new Date(),
    });

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
