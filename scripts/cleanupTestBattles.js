import mongoose from 'mongoose';
import Battle from '../models/Battle.js';
import Team from '../models/Team.js';
import StreamCount from '../models/StreamCount.js';

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI or MONGO_URI environment variable is not set');
  }

  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');
}

async function cleanupTestBattles() {
  console.log('\n🗑️  CLEANING UP ALL BATTLES');
  console.log('============================\n');

  // Find ALL battles
  const allBattles = await Battle.find({});

  if (allBattles.length === 0) {
    console.log('✅ No battles found - database is already clean!');
    return;
  }

  console.log(`Found ${allBattles.length} battle(s) to delete:\n`);
  allBattles.forEach((battle, i) => {
    const participantCount = battle.participants?.length || 0;
    const statusEmoji = battle.status === 'active' ? '🟢' : battle.status === 'ended' ? '🔴' : '🟡';
    console.log(`  ${i + 1}. ${statusEmoji} "${battle.name}" - ${battle.status} - ${participantCount} participants`);
  });

  const battleIds = allBattles.map(b => b._id);

  // Count related data that will be deleted
  const relatedTeams = await Team.countDocuments({ battleId: { $in: battleIds } });
  const relatedStreamCounts = await StreamCount.countDocuments({ battleId: { $in: battleIds } });

  console.log('\nThis will also delete:');
  console.log(`  • ${relatedTeams} team(s)`);
  console.log(`  • ${relatedStreamCounts} stream count record(s)`);

  console.log('\n⚠️  This will DELETE ALL BATTLES from your database!');
  console.log('⚠️  Proceeding with deletion in 5 seconds...');
  console.log('⚠️  Press Ctrl+C to cancel\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Delete related data first (maintain referential integrity)
  const streamCountResult = await StreamCount.deleteMany({ battleId: { $in: battleIds } });
  console.log(`✓ Deleted ${streamCountResult.deletedCount} stream count(s)`);

  const teamResult = await Team.deleteMany({ battleId: { $in: battleIds } });
  console.log(`✓ Deleted ${teamResult.deletedCount} team(s)`);

  const battleResult = await Battle.deleteMany({ _id: { $in: battleIds } });
  console.log(`✓ Deleted ${battleResult.deletedCount} battle(s)`);

  console.log('\n✅ All battles deleted successfully!');
  console.log('Your database is now clean and ready for production battles.\n');
}

async function main() {
  try {
    await connectDB();
    await cleanupTestBattles();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
}

main();
