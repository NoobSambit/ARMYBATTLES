import connectDB from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import StreamCount from '../../../../models/StreamCount';
import Team from '../../../../models/Team';
import User from '../../../../models/User';
import mongoose from 'mongoose';
import { createHandler, withCors } from '../../../../lib/middleware';
import { logger } from '../../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { battleId, userId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(battleId)) {
      return res.status(400).json({ error: 'Invalid battle ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    await connectDB();

    // Fetch battle
    const battle = await Battle.findById(battleId).populate('participants', 'username displayName avatarUrl');
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    // Only show scorecards for ended battles
    if (battle.status !== 'ended') {
      return res.status(400).json({ error: 'Scorecard only available for ended battles' });
    }

    // Fetch user
    const user = await User.findById(userId, 'username displayName avatarUrl');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get leaderboard
    let leaderboard = battle.finalLeaderboard || [];

    // If finalLeaderboard is empty, build it from StreamCount
    if (leaderboard.length === 0) {
      const streamCounts = await StreamCount.find({ battleId })
        .populate('userId', 'username displayName avatarUrl')
        .populate({ path: 'teamId', strictPopulate: false });

      // Aggregate team scores
      const teamScoresMap = new Map();
      const soloPlayers = [];

      for (const sc of streamCounts) {
        if (sc.teamId) {
          // Team member
          if (!teamScoresMap.has(sc.teamId._id.toString())) {
            teamScoresMap.set(sc.teamId._id.toString(), {
              type: 'team',
              teamId: sc.teamId._id,
              teamName: sc.teamId.name,
              memberCount: sc.teamId.members.length,
              totalScore: 0,
              members: [],
              isCheater: false,
            });
          }

          const teamData = teamScoresMap.get(sc.teamId._id.toString());
          teamData.totalScore += sc.count;
          teamData.members.push({
            userId: sc.userId._id,
            username: sc.userId.username,
            displayName: sc.userId.displayName,
            count: sc.count,
            isCheater: sc.isCheater || false,
          });
          if (sc.isCheater) {
            teamData.isCheater = true;
          }
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

      const teams = Array.from(teamScoresMap.values());
      const combinedLeaderboard = [...teams, ...soloPlayers];

      leaderboard = combinedLeaderboard.sort((a, b) => {
        const scoreA = a.type === 'team' ? a.totalScore : a.count;
        const scoreB = b.type === 'team' ? b.totalScore : b.count;
        return scoreB - scoreA;
      });
    } else {
      // Populate finalLeaderboard data
      leaderboard = await Promise.all(battle.finalLeaderboard.map(async (entry) => {
        const plainEntry = entry.toObject ? entry.toObject() : { ...entry };

        if (plainEntry.type === 'solo' && plainEntry.userId) {
          const userDoc = await User.findById(plainEntry.userId, 'username displayName avatarUrl');
          if (userDoc) {
            return {
              type: 'solo',
              userId: plainEntry.userId,
              username: userDoc.username,
              displayName: userDoc.displayName,
              avatarUrl: userDoc.avatarUrl,
              count: plainEntry.count,
              isCheater: plainEntry.isCheater || false,
            };
          }
        } else if (plainEntry.type === 'team') {
          const team = await Team.findById(plainEntry.teamId);
          if (team) {
            return {
              type: 'team',
              teamId: plainEntry.teamId,
              teamName: team.name,
              memberCount: team.members.length,
              totalScore: plainEntry.totalScore,
              members: plainEntry.members || [],
              isCheater: plainEntry.isCheater || false,
            };
          }
        }

        return plainEntry;
      }));
    }

    // Find user's rank and score
    let userRank = 0;
    let userScore = 0;
    let teamData = null;

    // Check if user is a solo player
    const soloEntry = leaderboard.find((entry) => {
      if (entry.type === 'team') return false;
      return entry.userId?.toString() === userId || entry.username === user.username;
    });

    if (soloEntry) {
      userRank = leaderboard.indexOf(soloEntry) + 1;
      userScore = soloEntry.count;
    } else {
      // Check if user is in a team
      const userTeamEntry = leaderboard.find((entry) => {
        if (entry.type !== 'team') return false;

        if (entry.members && Array.isArray(entry.members)) {
          return entry.members.some(
            (m) => m.userId?.toString() === userId || m.username === user.username
          );
        }

        return false;
      });

      if (userTeamEntry) {
        const teamRank = leaderboard.indexOf(userTeamEntry) + 1;

        // Find user's individual contribution
        let individualScore = 0;
        if (userTeamEntry.members && Array.isArray(userTeamEntry.members)) {
          const memberEntry = userTeamEntry.members.find(
            (member) => member.userId?.toString() === userId || member.username === user.username
          );
          if (memberEntry) {
            individualScore = memberEntry.count;
          }
        }

        userScore = individualScore;

        // Calculate individual rank among ALL players
        const allIndividualPlayers = [];
        leaderboard.forEach((entry) => {
          if (entry.type === 'team' && entry.members && Array.isArray(entry.members)) {
            entry.members.forEach((member) => {
              allIndividualPlayers.push({
                userId: member.userId,
                username: member.username,
                count: member.count,
              });
            });
          } else if (entry.type === 'solo') {
            allIndividualPlayers.push({
              userId: entry.userId,
              username: entry.username,
              count: entry.count,
            });
          }
        });

        allIndividualPlayers.sort((a, b) => b.count - a.count);

        const individualRankIndex = allIndividualPlayers.findIndex(
          (player) => player.userId?.toString() === userId || player.username === user.username
        );

        const individualRank = individualRankIndex >= 0 ? individualRankIndex + 1 : 0;
        const totalPlayers = allIndividualPlayers.length;

        userRank = individualRank;

        teamData = {
          name: userTeamEntry.teamName || userTeamEntry.name,
          teamRank: teamRank,
          rank: userRank,
          totalScore: userTeamEntry.totalScore || userTeamEntry.score,
          memberCount: userTeamEntry.memberCount || 0,
          contribution: userScore,
          individualRank: individualRank,
          totalPlayers: totalPlayers,
        };
      }
    }

    // Get top 5 for leaderboard display
    const top5 = leaderboard.slice(0, 5).map((entry, index) => {
      const name = entry.type === 'team'
        ? (entry.teamName || entry.name)
        : (entry.displayName || entry.username);

      const score = entry.type === 'team'
        ? (entry.totalScore || entry.score)
        : entry.count;

      return {
        rank: index + 1,
        type: entry.type,
        name: name,
        score: score,
        memberCount: entry.memberCount,
      };
    });

    // Calculate total scrobbles
    const totalScrobbles = leaderboard.reduce(
      (sum, entry) => sum + (entry.count || entry.totalScore || 0),
      0
    );

    // Calculate duration
    const durationMs = new Date(battle.endTime) - new Date(battle.startTime);
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationDays = Math.floor(durationHours / 24);
    const durationStr =
      durationDays > 0 ? `${durationDays}d ${durationHours % 24}h` : `${durationHours}h`;

    const scorecardData = {
      battle: {
        name: battle.name,
        endTime: battle.endTime,
        participantCount: battle.participants.length,
        duration: durationStr,
      },
      user: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      stats: {
        rank: userRank,
        score: userScore,
        totalScrobbles,
      },
      team: teamData,
      leaderboard: top5,
    };

    res.status(200).json(scorecardData);
  } catch (error) {
    logger.error('Scorecard fetch error', { error: error.message, battleId: req.query.battleId, userId: req.query.userId });
    res.status(500).json({ error: 'Server error fetching scorecard' });
  }
}

export default createHandler(handler, [withCors]);
