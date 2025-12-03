import dbConnect from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import BattleActivityLog from '../../../../models/BattleActivityLog';
import { createHandler, withCors, withRateLimit, withAuth } from '../../../../lib/middleware';

// Cache for activity logs (30 second TTL, only cache first page)
const activityCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

/**
 * API endpoint to get activity log for a battle
 * Only the battle host can view the activity log
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: battleId } = req.query;
    const { limit = 50, offset = 0 } = req.query;

    // Validate limit
    const parsedLimit = Math.min(parseInt(limit) || 50, 500);
    const parsedOffset = parseInt(offset) || 0;

    // Check cache for first page only (offset = 0)
    if (parsedOffset === 0) {
      const cacheKey = `${battleId}-${parsedLimit}`;
      const now = Date.now();
      const cached = activityCache.get(cacheKey);

      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return res.status(200).json({ ...cached.data, cached: true });
      }
    }

    await dbConnect();

    // Get authenticated user ID from middleware
    const userId = req.userId;

    // Find battle
    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    // Check if requester is the host
    if (battle.host.toString() !== userId) {
      return res.status(403).json({ error: 'Only the battle host can view activity logs' });
    }

    // Get activity logs
    const activities = await BattleActivityLog.find({ battleId })
      .sort({ timestamp: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .lean();

    // Get total count
    const totalCount = await BattleActivityLog.countDocuments({ battleId });

    // Format activities for display
    const formattedActivities = activities.map((activity) => {
      let description = '';
      let icon = '';
      let color = '';

      switch (activity.action) {
        case 'battle_created':
          description = `${activity.actorUsername} created the battle`;
          icon = '🎮';
          color = 'blue';
          break;
        case 'participant_joined':
          description = `${activity.targetUsername} joined the battle`;
          icon = '👋';
          color = 'green';
          break;
        case 'team_created':
          description = `${activity.actorUsername} created team "${activity.metadata.teamName}"`;
          icon = '👥';
          color = 'purple';
          break;
        case 'team_joined':
          description = `${activity.targetUsername} joined team "${activity.metadata.teamName}"`;
          icon = '🤝';
          color = 'purple';
          break;
        case 'kicked_participant':
          description = `${activity.targetUsername} was removed from the battle`;
          icon = '⚠️';
          color = 'red';
          break;
        case 'extended_battle':
          description = `Battle extended by ${activity.metadata.extensionHours} hours`;
          icon = '⏰';
          color = 'yellow';
          break;
        case 'battle_ended':
          description = `Battle ended`;
          icon = '🏁';
          color = 'gray';
          break;
        default:
          description = `${activity.action}`;
          icon = '📝';
          color = 'gray';
      }

      return {
        id: activity._id,
        timestamp: activity.timestamp,
        action: activity.action,
        description,
        icon,
        color,
        actor: {
          id: activity.actorId,
          username: activity.actorUsername,
        },
        target: activity.targetUserId ? {
          id: activity.targetUserId,
          username: activity.targetUsername,
        } : null,
        metadata: activity.metadata,
      };
    });

    const response = {
      success: true,
      activities: formattedActivities,
      pagination: {
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < totalCount,
      },
    };

    // Cache first page only
    if (parsedOffset === 0) {
      const cacheKey = `${battleId}-${parsedLimit}`;
      const now = Date.now();
      activityCache.set(cacheKey, {
        data: response,
        timestamp: now
      });

      // Clean up old cache entries
      if (activityCache.size > 50) {
        const oldestKeys = Array.from(activityCache.keys()).slice(0, 25);
        oldestKeys.forEach(key => activityCache.delete(key));
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(20, 60000),
  withAuth({ requireAdmin: false }),
]);
