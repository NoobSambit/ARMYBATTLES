import mongoose from 'mongoose';
import connectDB from '../utils/db.js';
import Battle from '../models/Battle.js';
import StreamCount from '../models/StreamCount.js';

async function cleanup() {
  try {
    console.log('Starting cleanup of old battles...');
    
    await connectDB();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const oldBattles = await Battle.find({
      status: 'ended',
      endedAt: { $lte: sevenDaysAgo },
    });

    console.log(`Found ${oldBattles.length} battles older than 7 days`);

    const battleIds = oldBattles.map(b => b._id);

    const deletedStreamCounts = await StreamCount.deleteMany({
      battleId: { $in: battleIds },
    });

    console.log(`Deleted ${deletedStreamCounts.deletedCount} stream counts`);

    const deletedBattles = await Battle.deleteMany({
      _id: { $in: battleIds },
    });

    console.log(`Deleted ${deletedBattles.deletedCount} battles`);

    const allBattleIds = await Battle.find().distinct('_id');
    const orphanedStreamCounts = await StreamCount.deleteMany({
      battleId: { $nin: allBattleIds },
    });

    console.log(`Deleted ${orphanedStreamCounts.deletedCount} orphaned stream counts`);

    console.log('Cleanup completed successfully');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
}

cleanup();
