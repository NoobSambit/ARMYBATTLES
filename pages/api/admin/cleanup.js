import connectDB from '../../../utils/db';
import Battle from '../../../models/Battle';
import StreamCount from '../../../models/StreamCount';
import { createHandler, withCors, withRateLimit, withAuth } from '../../../lib/middleware';
import { logger } from '../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const oldBattles = await Battle.find({
      status: 'ended',
      endedAt: { $lte: sevenDaysAgo },
    });

    const battleIds = oldBattles.map(b => b._id);

    const deletedStreamCounts = await StreamCount.deleteMany({
      battleId: { $in: battleIds },
    });

    const deletedBattles = await Battle.deleteMany({
      _id: { $in: battleIds },
    });

    const orphanedStreamCounts = await StreamCount.deleteMany({
      battleId: { $nin: await Battle.find().distinct('_id') },
    });

    logger.info('Cleanup completed', {
      battlesDeleted: deletedBattles.deletedCount,
      streamCountsDeleted: deletedStreamCounts.deletedCount,
      orphanedStreamCountsDeleted: orphanedStreamCounts.deletedCount,
      adminId: req.userId,
    });

    res.status(200).json({
      message: 'Cleanup completed successfully',
      summary: {
        battlesDeleted: deletedBattles.deletedCount,
        streamCountsDeleted: deletedStreamCounts.deletedCount,
        orphanedStreamCountsDeleted: orphanedStreamCounts.deletedCount,
      },
    });
  } catch (error) {
    logger.error('Cleanup error', { error: error.message });
    res.status(500).json({ error: 'Server error during cleanup' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(2, 60000),
  withAuth({ requireAdmin: true }),
]);
