import dbConnect from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import { calculateBattleStats, getHourlyDistribution, getTopPerformers } from '../../../../utils/battleStats';
import { createHandler, withCors, withRateLimit, withAuth } from '../../../../lib/middleware';

// Cache statistics for 2 minutes to reduce database load (extended for Netlify optimization)
let statsCache = {};
const CACHE_TTL = 120000; // 2 minutes (increased from 30 seconds)

/**
 * API endpoint to get comprehensive statistics for a battle
 * Only the battle host can view detailed statistics
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get authenticated user ID from middleware
    const userId = req.userId;

    const { id: battleId } = req.query;

    // Check cache
    const cacheKey = battleId;
    const now = Date.now();
    if (statsCache[cacheKey] && now - statsCache[cacheKey].timestamp < CACHE_TTL) {
      return res.status(200).json({
        ...statsCache[cacheKey].data,
        cached: true,
      });
    }

    // Find battle
    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    // Check if requester is the host
    if (battle.host.toString() !== userId) {
      return res.status(403).json({ error: 'Only the battle host can view detailed statistics' });
    }

    // Calculate comprehensive statistics
    const stats = await calculateBattleStats(battleId);
    const hourlyDistribution = await getHourlyDistribution(battleId);
    const topPerformers = await getTopPerformers(battleId, 10);

    const response = {
      success: true,
      battleId,
      battleName: battle.name,
      stats,
      charts: {
        hourlyDistribution,
        topPerformers,
      },
      cached: false,
    };

    // Update cache
    statsCache[cacheKey] = {
      data: response,
      timestamp: now,
    };

    // Clean old cache entries (older than 5 minutes)
    Object.keys(statsCache).forEach((key) => {
      if (now - statsCache[key].timestamp > 300000) {
        delete statsCache[key];
      }
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(20, 60000),
  withAuth({ requireAdmin: false }),
]);
