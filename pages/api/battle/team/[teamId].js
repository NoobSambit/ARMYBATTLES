import { createHandler, withCors } from '../../../../lib/middleware';
import connectDB from '../../../../utils/db';
import Team from '../../../../models/Team';
import StreamCount from '../../../../models/StreamCount';
import User from '../../../../models/User';
import mongoose from 'mongoose';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { teamId } = req.query;

    // Validate team ID format
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID format' });
    }

    // Find team and populate creator
    const team = await Team.findById(teamId).populate('creatorId', 'username displayName');
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Fetch StreamCounts for all team members
    const streamCounts = await StreamCount.find({
      battleId: team.battleId,
      userId: { $in: team.members }
    }).populate('userId', 'username displayName avatarUrl');

    // Build member details array
    const members = await Promise.all(
      team.members.map(async (memberId) => {
        const streamCount = streamCounts.find(
          sc => sc.userId._id.toString() === memberId.toString()
        );

        // If no stream count exists yet, fetch user details
        let user;
        if (!streamCount) {
          user = await User.findById(memberId).select('username displayName avatarUrl');
        } else {
          user = streamCount.userId;
        }

        return {
          userId: memberId.toString(),
          username: user?.username || 'Unknown',
          displayName: user?.displayName || null,
          avatarUrl: user?.avatarUrl || null,
          scrobbleCount: streamCount?.count || 0,
          isCheater: streamCount?.isCheater || false,
        };
      })
    );

    // Calculate total score
    const totalScore = members.reduce((sum, member) => sum + member.scrobbleCount, 0);

    return res.status(200).json({
      team: {
        id: team._id.toString(),
        name: team.name,
        creatorId: team.creatorId._id.toString(),
        creatorUsername: team.creatorId.username,
        inviteCode: team.inviteCode,
        members,
        totalScore,
        memberCount: team.members.length,
      },
    });

  } catch (error) {
    console.error('Get team details error:', error);
    return res.status(500).json({
      error: 'Failed to fetch team details. Please try again.'
    });
  }
}

export default createHandler(handler, [withCors]);
