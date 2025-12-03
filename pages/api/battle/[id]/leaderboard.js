import connectDB from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import StreamCount from '../../../../models/StreamCount';
import Team from '../../../../models/Team';
import User from '../../../../models/User';
import mongoose from 'mongoose';
import { createHandler, withCors } from '../../../../lib/middleware';
import { logger } from '../../../../utils/logger';

// Cache for leaderboards (30 second TTL per battleId + filter)
const leaderboardCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const filter = req.query.filter || 'all'; // all, teams, solo

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid battle ID' });
    }

    // Check cache first (only cache active battles, not ended ones)
    const cacheKey = `${id}-${filter}`;
    const now = Date.now();
    const cached = leaderboardCache.get(cacheKey);

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // Check if battle is still active before serving cache
      if (cached.data.status === 'active') {
        logger.info('Leaderboard served from cache', { battleId: id, filter });
        return res.status(200).json({ ...cached.data, updatedAt: new Date().toISOString() });
      }
    }

    await connectDB();

    const battle = await Battle.findById(id).populate('participants', 'username displayName avatarUrl');
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    let leaderboard;

    if (battle.status === 'ended' && battle.finalLeaderboard && battle.finalLeaderboard.length > 0) {
      // Debug: log raw finalLeaderboard
      console.log('[Leaderboard API] Raw finalLeaderboard:', JSON.stringify(battle.finalLeaderboard, null, 2));

      // Use stored final leaderboard for ended battles, but populate user data
      leaderboard = await Promise.all(battle.finalLeaderboard.map(async (entry) => {
        // Convert to plain object to ensure we can modify it
        const plainEntry = entry.toObject ? entry.toObject() : { ...entry };

        if (plainEntry.type === 'solo' && plainEntry.userId) {
          // Populate user data for solo players
          const user = await User.findById(plainEntry.userId, 'username displayName avatarUrl');
          if (user) {
            return {
              type: 'solo',
              userId: plainEntry.userId,
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              count: plainEntry.count,
              isCheater: plainEntry.isCheater || false,
            };
          }
        } else if (plainEntry.type === 'team') {
          // For teams, populate team data
          const team = await Team.findById(plainEntry.teamId);
          if (team) {
            return {
              type: 'team',
              teamId: plainEntry.teamId,
              teamName: team.name,
              memberCount: team.members.length,
              totalScore: plainEntry.totalScore,
              isCheater: plainEntry.isCheater || false,
            };
          }
        }
        return plainEntry;
      }));

      // Filter based on the filter parameter
      if (filter === 'teams') {
        leaderboard = leaderboard.filter(entry => entry.type === 'team');
      } else if (filter === 'solo') {
        leaderboard = leaderboard.filter(entry => entry.type === 'solo');
      }

      // Debug log
      console.log('[Leaderboard API] Ended battle - returning populated leaderboard:',
        leaderboard.map(e => ({ type: e.type, username: e.username, userId: e.userId }))
      );
    } else {
      // Build current leaderboard with team support
      const streamCounts = await StreamCount.find({ battleId: id })
        .populate('userId', 'username displayName avatarUrl')
        .populate({ path: 'teamId', strictPopulate: false });

      // Aggregate team scores
      const teamScoresMap = new Map();
      const soloPlayers = [];
      const processedUsers = new Set();

      for (const sc of streamCounts) {
        processedUsers.add(sc.userId._id.toString());

        if (sc.teamId) {
          // Team member
          if (!teamScoresMap.has(sc.teamId._id.toString())) {
            teamScoresMap.set(sc.teamId._id.toString(), {
              type: 'team',
              teamId: sc.teamId._id,
              teamName: sc.teamId.name,
              memberCount: sc.teamId.members.length,
              totalScore: 0,
              isCheater: false,
            });
          }

          const teamData = teamScoresMap.get(sc.teamId._id.toString());
          teamData.totalScore += sc.count;
          if (sc.isCheater) {
            teamData.isCheater = true; // Flag team if any member is cheater
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

      // Add missing participants (those with 0 scrobbles) as solo players
      const missingParticipants = battle.participants.filter(
        p => !processedUsers.has(p._id.toString())
      );

      for (const p of missingParticipants) {
        soloPlayers.push({
          type: 'solo',
          userId: p._id,
          username: p.username,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          count: 0,
          isCheater: false,
        });
      }

      // Convert team map to array
      const teams = Array.from(teamScoresMap.values());

      // Combine and sort
      let combinedLeaderboard = [];

      if (filter === 'teams') {
        combinedLeaderboard = teams;
      } else if (filter === 'solo') {
        combinedLeaderboard = soloPlayers;
      } else {
        // all
        combinedLeaderboard = [...teams, ...soloPlayers];
      }

      // Sort by score (totalScore for teams, count for solo)
      leaderboard = combinedLeaderboard.sort((a, b) => {
        const scoreA = a.type === 'team' ? a.totalScore : a.count;
        const scoreB = b.type === 'team' ? b.totalScore : b.count;
        return scoreB - scoreA;
      });
    }

    const response = {
      battleId: id,
      battleName: battle.name,
      status: battle.status,
      startTime: battle.startTime,
      endTime: battle.endTime,
      spotifyPlaylist: battle.spotifyPlaylist,
      participantCount: battle.participants.length,
      hostId: battle.host.toString(),
      participants: battle.participants.map(p => p._id.toString()),
      filter,
      leaderboard,
      updatedAt: new Date().toISOString(),
    };

    // Cache only if battle is active
    if (battle.status === 'active') {
      leaderboardCache.set(cacheKey, {
        data: response,
        timestamp: now
      });

      // Clean up old cache entries (simple cleanup)
      if (leaderboardCache.size > 100) {
        const oldestKeys = Array.from(leaderboardCache.keys()).slice(0, 50);
        oldestKeys.forEach(key => leaderboardCache.delete(key));
      }
    }

    res.status(200).json(response);
  } catch (error) {
    logger.error('Leaderboard fetch error', { error: error.message, battleId: req.query.id });
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
}

export default createHandler(handler, [withCors]);
