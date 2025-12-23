/**
 * Migration script to add goals to existing battles
 * Run this script with: node scripts/add-goals-to-battles.js
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = join(__dirname, '..', '.env.local');
try {
  const envFile = readFileSync(envPath, 'utf8');
  const envVars = envFile.split('\n').filter(line => line && !line.startsWith('#'));
  envVars.forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
  console.log('✅ Environment variables loaded from .env.local\n');
} catch (error) {
  console.error('❌ Error loading .env.local:', error.message);
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env.local');
  process.exit(1);
}

async function updateBattles() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Battle collection directly
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
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration
updateBattles();
