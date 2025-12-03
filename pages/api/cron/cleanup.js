import connectDB from '../../../utils/db';
import Battle from '../../../models/Battle';
import StreamCount from '../../../models/StreamCount';
import Team from '../../../models/Team';
import BattleActivityLog from '../../../models/BattleActivityLog';
import User from '../../../models/User';
import { logger } from '../../../utils/logger';

/**
 * Comprehensive database cleanup endpoint
 * Designed to be called by an external cron service (e.g., cron-job.org)
 * Cleans up old battles and all related data
 * 
 * Configuration via environment variables:
 * - CLEANUP_RETENTION_DAYS: How many days to keep ended battles (default: 2)
 * - CLEANUP_EXPIRED_SESSIONS: Whether to clean expired user sessions (default: true)
 */
async function performCleanup() {
  try {
    await connectDB();

    // Get retention period from env (default: 2 days)
    const retentionDays = parseInt(process.env.CLEANUP_RETENTION_DAYS || '2', 10);
    const cleanupExpiredSessions = process.env.CLEANUP_EXPIRED_SESSIONS !== 'false';
    
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    logger.info('Starting database cleanup', {
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      cleanupExpiredSessions
    });

    // Step 1: Find old ended battles
    const oldBattles = await Battle.find({
      status: 'ended',
      endedAt: { $lte: cutoffDate },
    });

    const battleIds = oldBattles.map(b => b._id.toString());
    
    logger.info('Found old battles to clean', {
      count: battleIds.length,
      battleIds: battleIds.slice(0, 5) // Log first 5 for debugging
    });

    let summary = {
      battlesDeleted: 0,
      streamCountsDeleted: 0,
      teamsDeleted: 0,
      activityLogsDeleted: 0,
      expiredSessionsCleaned: 0,
    };

    if (battleIds.length > 0) {
      // Step 2: Delete associated StreamCounts
      const streamCountResult = await StreamCount.deleteMany({
        battleId: { $in: battleIds },
      });
      summary.streamCountsDeleted = streamCountResult.deletedCount;

      // Step 3: Delete associated Teams
      const teamsResult = await Team.deleteMany({
        battleId: { $in: battleIds },
      });
      summary.teamsDeleted = teamsResult.deletedCount;

      // Step 4: Delete associated Activity Logs
      const activityLogsResult = await BattleActivityLog.deleteMany({
        battleId: { $in: battleIds },
      });
      summary.activityLogsDeleted = activityLogsResult.deletedCount;

      // Step 5: Delete the battles themselves
      const battlesResult = await Battle.deleteMany({
        _id: { $in: battleIds },
      });
      summary.battlesDeleted = battlesResult.deletedCount;
    }

    // Step 6: Clean up orphaned data (data referencing non-existent battles)
    const existingBattleIds = await Battle.find().distinct('_id');
    
    const orphanedStreamCounts = await StreamCount.deleteMany({
      battleId: { $nin: existingBattleIds },
    });
    summary.streamCountsDeleted += orphanedStreamCounts.deletedCount;

    const orphanedTeams = await Team.deleteMany({
      battleId: { $nin: existingBattleIds },
    });
    summary.teamsDeleted += orphanedTeams.deletedCount;

    const orphanedActivityLogs = await BattleActivityLog.deleteMany({
      battleId: { $nin: existingBattleIds },
    });
    summary.activityLogsDeleted += orphanedActivityLogs.deletedCount;

    // Step 7: Clean up expired user sessions (optional)
    if (cleanupExpiredSessions) {
      const now = new Date();
      const expiredSessionsResult = await User.updateMany(
        {
          sessionExpiresAt: { $lt: now },
          sessionToken: { $ne: null }
        },
        {
          $set: {
            sessionToken: null,
            sessionExpiresAt: null
          }
        }
      );
      summary.expiredSessionsCleaned = expiredSessionsResult.modifiedCount;
    }

    logger.info('Cleanup completed successfully', summary);

    return {
      success: true,
      summary,
      retentionDays,
      cutoffDate: cutoffDate.toISOString()
    };
  } catch (error) {
    logger.error('Cleanup error', { 
      error: error.message, 
      stack: error.stack 
    });
    throw error;
  }
}

/**
 * Cron-triggered cleanup endpoint
 * Can be called by cron-job.org or similar services
 * Uses CRON_SECRET header authentication (same as /api/battle/verify)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate secret header (same as verification endpoint)
  const authHeader = req.headers['x-cron-secret'];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== cronSecret) {
    logger.warn('Unauthorized cleanup attempt', {
      hasAuthHeader: !!authHeader,
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      expectedHeader: 'x-cron-secret',
      hint: authHeader ? 'Header value mismatch' : 'Missing x-cron-secret header'
    });
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Missing or invalid x-cron-secret header'
    });
  }

  try {
    logger.info('Cleanup triggered by external cron');

    const result = await performCleanup();

    res.status(200).json({
      message: 'Cleanup completed successfully',
      ...result
    });
  } catch (error) {
    logger.error('Cleanup handler error', { error: error.message });
    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message
    });
  }
}

