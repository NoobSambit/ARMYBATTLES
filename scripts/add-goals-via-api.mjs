/**
 * Migration script to add goals to existing battles via direct database access
 * Run this with the dev server running: node scripts/add-goals-via-api.mjs
 */

import mongoose from 'mongoose';

// Read MONGO_URI from command line or environment
const MONGO_URI = process.env.MONGO_URI || process.argv[2];

if (!MONGO_URI) {
  console.error('❌ Please provide MONGO_URI as argument or environment variable');
  console.error('Usage: MONGO_URI="your_connection_string" node scripts/add-goals-via-api.mjs');
  console.error('   or: node scripts/add-goals-via-api.mjs "your_connection_string"');
  process.exit(1);
}

async function updateBattles() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the Battle model
    const Battle = mongoose.connection.collection('battles');

    // Find all battles without a goal
    const battlesWithoutGoal = await Battle.find({
      $or: [
        { goal: { $exists: false } },
        { goal: null }
      ]
    }).toArray();

    console.log(`📊 Found ${battlesWithoutGoal.length} battles without goals\n`);

    if (battlesWithoutGoal.length === 0) {
      console.log('✨ All battles already have goals!');
      await mongoose.connection.close();
      return;
    }

    // Update each battle
    let updated = 0;
    for (const battle of battlesWithoutGoal) {
      await Battle.updateOne(
        { _id: battle._id },
        {
          $set: {
            goal: 15000,
            description: battle.description || ''
          }
        }
      );
      updated++;
      console.log(`✓ Updated battle: ${battle.name} (ID: ${battle._id})`);
    }

    console.log(`\n✅ Successfully updated ${updated} battles with goal: 15000`);

    // Verify the update
    const battlesWithGoal = await Battle.countDocuments({ goal: { $exists: true, $ne: null } });
    const totalBattles = await Battle.countDocuments();
    console.log(`\n📈 Total battles: ${totalBattles}`);
    console.log(`📈 Battles with goals: ${battlesWithGoal}`);

    await mongoose.connection.close();
    console.log('\n🔚 Database connection closed');
  } catch (error) {
    console.error('❌ Error updating battles:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run the migration
updateBattles();
