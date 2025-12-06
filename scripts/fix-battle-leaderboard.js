// Script to fix the finalLeaderboard for an ended battle
// Usage: node scripts/fix-battle-leaderboard.js <battleId>

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file manually
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

// Import models
import Battle from '../models/Battle.js';
import StreamCount from '../models/StreamCount.js';
import User from '../models/User.js';
import Team from '../models/Team.js';

async function fixBattleLeaderboard(battleId) {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI not found in environment');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Validate battleId
    if (!mongoose.Types.ObjectId.isValid(battleId)) {
      throw new Error('Invalid battle ID');
    }

    // Find the battle
    const battle = await Battle.findById(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    console.log(`Found battle: ${battle.name} (${battle.status})`);

    // Fetch stream counts with populated data
    const streamCounts = await StreamCount.find({ battleId })
      .populate('userId', 'username displayName avatarUrl')
      .populate('teamId', 'name members');

    console.log(`Found ${streamCounts.length} stream counts`);

    // Build leaderboard with team support
    const teamScoresMap = new Map();
    const soloPlayers = [];

    for (const sc of streamCounts) {
      if (sc.teamId) {
        // Team member
        const teamIdStr = sc.teamId._id.toString();
        if (!teamScoresMap.has(teamIdStr)) {
          teamScoresMap.set(teamIdStr, {
            type: 'team',
            teamId: sc.teamId._id,
            teamName: sc.teamId.name,
            memberCount: sc.teamId.members.length,
            totalScore: 0,
            isCheater: false,
            members: [], // Store individual team member scores
          });
        }

        const teamData = teamScoresMap.get(teamIdStr);
        teamData.totalScore += sc.count;
        if (sc.isCheater) {
          teamData.isCheater = true;
        }

        // Add individual team member data
        teamData.members.push({
          userId: sc.userId._id,
          username: sc.userId.username,
          displayName: sc.userId.displayName,
          count: sc.count,
          isCheater: sc.isCheater || false,
        });
      } else {
        // Solo player
        soloPlayers.push({
          type: 'solo',
          userId: sc.userId._id,
          username: sc.userId.username,
          displayName: sc.userId.displayName,
          avatarUrl: sc.userId.avatarUrl,
          count: sc.count,
          isCheater: sc.isCheater || false,
        });
      }
    }

    // Combine teams and solo players
    const teams = Array.from(teamScoresMap.values());
    const combinedLeaderboard = [...teams, ...soloPlayers];

    // Sort by score
    const finalLeaderboard = combinedLeaderboard.sort((a, b) => {
      const scoreA = a.type === 'team' ? a.totalScore : a.count;
      const scoreB = b.type === 'team' ? b.totalScore : b.count;
      return scoreB - scoreA;
    });

    console.log('\nFixed leaderboard:');
    finalLeaderboard.forEach((entry, i) => {
      if (entry.type === 'team') {
        console.log(`${i + 1}. Team: ${entry.teamName} - ${entry.totalScore} scrobbles`);
      } else {
        console.log(`${i + 1}. Solo: ${entry.username} - ${entry.count} scrobbles`);
      }
    });

    // Update battle
    await Battle.findByIdAndUpdate(battleId, {
      finalLeaderboard,
      updatedAt: new Date(),
    });

    console.log('\n✅ Battle leaderboard fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get battleId from command line args
const battleId = process.argv[2];
if (!battleId) {
  console.error('Usage: node scripts/fix-battle-leaderboard.js <battleId>');
  process.exit(1);
}

fixBattleLeaderboard(battleId);
