import dbConnect from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import BattleStats from '../../../../models/BattleStats';
import { createHandler, withCors, withRateLimit } from '../../../../lib/middleware';

/**
 * API endpoint to fetch battle statistics
 * Returns BTS and member stream counts that persist even when users leave
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { id: battleId } = req.query;

    // Find battle
    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    // Find or create battle stats
    let battleStats = await BattleStats.findOne({ battleId });

    if (!battleStats) {
      // No stats yet, return zeros
      battleStats = {
        battleId,
        totalBTSStreams: 0,
        memberStats: {
          RM: 0,
          Jin: 0,
          Suga: 0,
          'J-Hope': 0,
          Jimin: 0,
          V: 0,
          'Jung Kook': 0
        },
        topTracks: [],
        lastUpdated: null
      };
    }

    return res.status(200).json({
      success: true,
      battleId: battle._id,
      battleName: battle.name,
      battleStatus: battle.status,
      stats: {
        totalBTSStreams: battleStats.totalBTSStreams || 0,
        memberStats: battleStats.memberStats || {
          RM: 0,
          Jin: 0,
          Suga: 0,
          'J-Hope': 0,
          Jimin: 0,
          V: 0,
          'Jung Kook': 0
        },
        topTracks: (battleStats.topTracks || []).slice(0, 10), // Top 10
        lastUpdated: battleStats.lastUpdated || battleStats.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching battle stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(30, 60000) // 30 requests per minute
]);
