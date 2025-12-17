import mongoose from 'mongoose';
import readline from 'readline';
import Battle from '../models/Battle.js';
import Team from '../models/Team.js';
import StreamCount from '../models/StreamCount.js';
import User from '../models/User.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');
}

async function getStats() {
  const stats = {
    battles: await Battle.countDocuments(),
    teams: await Team.countDocuments(),
    streamCounts: await StreamCount.countDocuments(),
    users: await User.countDocuments()
  };
  return stats;
}

async function cleanupAll() {
  console.log('\n🗑️  FULL DATABASE CLEANUP');
  console.log('========================\n');

  const beforeStats = await getStats();
  console.log('Current database state:');
  console.log(`  Battles: ${beforeStats.battles}`);
  console.log(`  Teams: ${beforeStats.teams}`);
  console.log(`  Stream Counts: ${beforeStats.streamCounts}`);
  console.log(`  Users: ${beforeStats.users}`);

  const confirm = await question('\n⚠️  This will DELETE ALL data. Type "DELETE ALL" to confirm: ');

  if (confirm !== 'DELETE ALL') {
    console.log('❌ Cleanup cancelled');
    return false;
  }

  console.log('\n🔄 Deleting all data...\n');

  // Delete in proper order to maintain referential integrity
  const streamCountResult = await StreamCount.deleteMany({});
  console.log(`✓ Deleted ${streamCountResult.deletedCount} stream counts`);

  const teamResult = await Team.deleteMany({});
  console.log(`✓ Deleted ${teamResult.deletedCount} teams`);

  const battleResult = await Battle.deleteMany({});
  console.log(`✓ Deleted ${battleResult.deletedCount} battles`);

  const userResult = await User.deleteMany({});
  console.log(`✓ Deleted ${userResult.deletedCount} users`);

  const afterStats = await getStats();
  console.log('\n✅ Cleanup complete!');
  console.log('Final database state:');
  console.log(`  Battles: ${afterStats.battles}`);
  console.log(`  Teams: ${afterStats.teams}`);
  console.log(`  Stream Counts: ${afterStats.streamCounts}`);
  console.log(`  Users: ${afterStats.users}`);

  return true;
}

async function cleanupTestBattles() {
  console.log('\n🗑️  TEST BATTLE CLEANUP');
  console.log('======================\n');

  // Find battles with test-like names
  const testPatterns = [
    /test/i,
    /demo/i,
    /sample/i,
    /trial/i,
    /debug/i,
    /temp/i,
    /junk/i,
    /asdf/i,
    /aaa/i,
    /zzz/i,
    /^[0-9]+$/,  // Only numbers
    /^.{1,3}$/    // Very short names (1-3 chars)
  ];

  const testBattles = await Battle.find({
    $or: testPatterns.map(pattern => ({ name: pattern }))
  });

  if (testBattles.length === 0) {
    console.log('✓ No test battles found');
    return false;
  }

  console.log(`Found ${testBattles.length} potential test battles:\n`);
  testBattles.forEach((battle, i) => {
    console.log(`  ${i + 1}. "${battle.name}" (${battle.status}) - ${battle.participants.length} participants`);
  });

  const confirm = await question('\n⚠️  Delete these battles? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Cleanup cancelled');
    return false;
  }

  const battleIds = testBattles.map(b => b._id);

  // Delete related data
  const streamCountResult = await StreamCount.deleteMany({ battleId: { $in: battleIds } });
  console.log(`✓ Deleted ${streamCountResult.deletedCount} stream counts`);

  const teamResult = await Team.deleteMany({ battleId: { $in: battleIds } });
  console.log(`✓ Deleted ${teamResult.deletedCount} teams`);

  const battleResult = await Battle.deleteMany({ _id: { $in: battleIds } });
  console.log(`✓ Deleted ${battleResult.deletedCount} battles`);

  console.log('\n✅ Test battle cleanup complete!');
  return true;
}

async function cleanupOldEndedBattles() {
  console.log('\n🗑️  OLD ENDED BATTLE CLEANUP');
  console.log('============================\n');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

  const oldBattles = await Battle.find({
    status: 'ended',
    endedAt: { $lt: cutoffDate }
  });

  if (oldBattles.length === 0) {
    console.log('✓ No old ended battles found (>30 days old)');
    return false;
  }

  console.log(`Found ${oldBattles.length} ended battles older than 30 days:\n`);
  oldBattles.forEach((battle, i) => {
    const daysOld = Math.floor((Date.now() - battle.endedAt) / (1000 * 60 * 60 * 24));
    console.log(`  ${i + 1}. "${battle.name}" - ended ${daysOld} days ago`);
  });

  const confirm = await question('\n⚠️  Delete these battles? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Cleanup cancelled');
    return false;
  }

  const battleIds = oldBattles.map(b => b._id);

  const streamCountResult = await StreamCount.deleteMany({ battleId: { $in: battleIds } });
  console.log(`✓ Deleted ${streamCountResult.deletedCount} stream counts`);

  const teamResult = await Team.deleteMany({ battleId: { $in: battleIds } });
  console.log(`✓ Deleted ${teamResult.deletedCount} teams`);

  const battleResult = await Battle.deleteMany({ _id: { $in: battleIds } });
  console.log(`✓ Deleted ${battleResult.deletedCount} battles`);

  console.log('\n✅ Old battle cleanup complete!');
  return true;
}

async function cleanupOrphanedData() {
  console.log('\n🗑️  ORPHANED DATA CLEANUP');
  console.log('========================\n');

  // Find all valid battle IDs
  const validBattleIds = (await Battle.find({}, '_id')).map(b => b._id);

  // Find orphaned stream counts
  const orphanedStreamCounts = await StreamCount.countDocuments({
    battleId: { $nin: validBattleIds }
  });

  // Find orphaned teams
  const orphanedTeams = await Team.countDocuments({
    battleId: { $nin: validBattleIds }
  });

  if (orphanedStreamCounts === 0 && orphanedTeams === 0) {
    console.log('✓ No orphaned data found');
    return false;
  }

  console.log(`Found orphaned data:`);
  console.log(`  Stream Counts: ${orphanedStreamCounts}`);
  console.log(`  Teams: ${orphanedTeams}`);

  const confirm = await question('\n⚠️  Delete orphaned data? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Cleanup cancelled');
    return false;
  }

  const streamCountResult = await StreamCount.deleteMany({
    battleId: { $nin: validBattleIds }
  });
  console.log(`✓ Deleted ${streamCountResult.deletedCount} orphaned stream counts`);

  const teamResult = await Team.deleteMany({
    battleId: { $nin: validBattleIds }
  });
  console.log(`✓ Deleted ${teamResult.deletedCount} orphaned teams`);

  console.log('\n✅ Orphaned data cleanup complete!');
  return true;
}

async function cleanupInactiveUsers() {
  console.log('\n🗑️  INACTIVE USER CLEANUP');
  console.log('========================\n');

  // Find users not in any battles and with no admin privileges
  const usersInBattles = await Battle.distinct('participants');
  const usersHostingBattles = await Battle.distinct('host');
  const usersInTeams = await Team.distinct('members');

  const activeUserIds = [
    ...new Set([
      ...usersInBattles.map(id => id.toString()),
      ...usersHostingBattles.map(id => id.toString()),
      ...usersInTeams.map(id => id.toString())
    ])
  ].map(id => new mongoose.Types.ObjectId(id));

  const inactiveUsers = await User.find({
    _id: { $nin: activeUserIds },
    isAdmin: false
  });

  if (inactiveUsers.length === 0) {
    console.log('✓ No inactive users found');
    return false;
  }

  console.log(`Found ${inactiveUsers.length} inactive users (not in any battles):\n`);
  inactiveUsers.slice(0, 10).forEach((user, i) => {
    console.log(`  ${i + 1}. ${user.username} (${user.displayName || 'no display name'})`);
  });

  if (inactiveUsers.length > 10) {
    console.log(`  ... and ${inactiveUsers.length - 10} more`);
  }

  const confirm = await question('\n⚠️  Delete these users? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Cleanup cancelled');
    return false;
  }

  const userResult = await User.deleteMany({
    _id: { $nin: activeUserIds },
    isAdmin: false
  });
  console.log(`✓ Deleted ${userResult.deletedCount} inactive users`);

  console.log('\n✅ Inactive user cleanup complete!');
  return true;
}

async function showMenu() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   ARMY BATTLES DATABASE CLEANUP        ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log('Please select a cleanup option:\n');
  console.log('  1. Delete ALL data (full reset)');
  console.log('  2. Delete test/junk battles');
  console.log('  3. Delete old ended battles (>30 days)');
  console.log('  4. Delete orphaned data');
  console.log('  5. Delete inactive users');
  console.log('  6. Run all cleanup operations (2-5)');
  console.log('  0. Exit\n');

  const choice = await question('Enter your choice (0-6): ');
  return choice;
}

async function main() {
  try {
    await connectDB();

    let shouldContinue = true;

    while (shouldContinue) {
      const choice = await showMenu();

      switch (choice) {
        case '1':
          await cleanupAll();
          break;
        case '2':
          await cleanupTestBattles();
          break;
        case '3':
          await cleanupOldEndedBattles();
          break;
        case '4':
          await cleanupOrphanedData();
          break;
        case '5':
          await cleanupInactiveUsers();
          break;
        case '6':
          console.log('\n🔄 Running all cleanup operations...\n');
          await cleanupTestBattles();
          await cleanupOldEndedBattles();
          await cleanupOrphanedData();
          await cleanupInactiveUsers();
          break;
        case '0':
          shouldContinue = false;
          console.log('\n👋 Goodbye!');
          break;
        default:
          console.log('\n❌ Invalid choice. Please try again.');
      }

      if (shouldContinue && choice !== '0') {
        const again = await question('\nRun another cleanup operation? (yes/no): ');
        if (again.toLowerCase() !== 'yes') {
          shouldContinue = false;
          console.log('\n👋 Goodbye!');
        }
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

main();
