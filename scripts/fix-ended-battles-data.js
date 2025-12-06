// Migration script to fix ended battles with incomplete finalLeaderboard data
// Run this with: node scripts/fix-ended-battles-data.js

import connectDB from '../utils/db.js';
import Battle from '../models/Battle.js';
import StreamCount from '../models/StreamCount.js';
import Team from '../models/Team.js';
import User from '../models/User.js';

async function fixEndedBattlesData() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find all ended battles
    const endedBattles = await Battle.find({ status: 'ended' });
    console.log(`Found ${endedBattles.length} ended battles`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const battle of endedBattles) {
      console.log(`\nProcessing battle: ${battle.name} (${battle._id})`);

      // Check if finalLeaderboard exists and has data
      if (!battle.finalLeaderboard || battle.finalLeaderboard.length === 0) {
        console.log('  ⚠️  No finalLeaderboard found, rebuilding from StreamCount...');

        // Rebuild finalLeaderboard from StreamCount
        const streamCounts = await StreamCount.find({ battleId: battle._id })
          .populate('userId', 'username displayName avatarUrl')
          .populate('teamId', 'name members');

        if (streamCounts.length === 0) {
          console.log('  ⚠️  No stream counts found, skipping...');
          skippedCount++;
          continue;
        }

        // Build final leaderboard with team support
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
                members: [],
              });
            }

            const teamData = teamScoresMap.get(teamIdStr);
            teamData.totalScore += sc.count;
            if (sc.isCheater) {
              teamData.isCheater = true;
            }

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

        const teams = Array.from(teamScoresMap.values());
        const combinedLeaderboard = [...teams, ...soloPlayers];

        const finalLeaderboard = combinedLeaderboard.sort((a, b) => {
          const scoreA = a.type === 'team' ? a.totalScore : a.count;
          const scoreB = b.type === 'team' ? b.totalScore : b.count;
          return scoreB - scoreA;
        });

        battle.finalLeaderboard = finalLeaderboard;
        await battle.save();

        console.log(`  ✅ Rebuilt finalLeaderboard with ${finalLeaderboard.length} entries`);
        fixedCount++;
      } else {
        // finalLeaderboard exists, check if it has complete data
        let needsUpdate = false;

        for (let i = 0; i < battle.finalLeaderboard.length; i++) {
          const entry = battle.finalLeaderboard[i];

          if (entry.type === 'solo' || !entry.type) {
            // Check solo players for missing data
            if (entry.userId && (!entry.username || !entry.displayName)) {
              const user = await User.findById(entry.userId, 'username displayName avatarUrl');
              if (user) {
                battle.finalLeaderboard[i].username = user.username;
                battle.finalLeaderboard[i].displayName = user.displayName;
                battle.finalLeaderboard[i].avatarUrl = user.avatarUrl;
                battle.finalLeaderboard[i].type = 'solo';
                needsUpdate = true;
                console.log(`  🔧 Updated solo player data for user ${user.username}`);
              }
            }
          } else if (entry.type === 'team') {
            // Check teams for missing data
            if (entry.teamId && (!entry.teamName || !entry.members || entry.members.length === 0)) {
              const team = await Team.findById(entry.teamId);
              if (team) {
                battle.finalLeaderboard[i].teamName = team.name;
                battle.finalLeaderboard[i].memberCount = team.members.length;

                // Fetch individual team member scores from StreamCount
                const teamStreamCounts = await StreamCount.find({
                  battleId: battle._id,
                  teamId: entry.teamId
                }).populate('userId', 'username displayName');

                battle.finalLeaderboard[i].members = teamStreamCounts.map(sc => ({
                  userId: sc.userId._id,
                  username: sc.userId.username,
                  displayName: sc.userId.displayName,
                  count: sc.count,
                  isCheater: sc.isCheater || false,
                }));

                needsUpdate = true;
                console.log(`  🔧 Updated team data for team ${team.name} with ${teamStreamCounts.length} members`);
              }
            }
          }
        }

        if (needsUpdate) {
          await battle.save();
          console.log(`  ✅ Updated finalLeaderboard with complete data`);
          fixedCount++;
        } else {
          console.log(`  ✓ finalLeaderboard already has complete data`);
          skippedCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration complete!');
    console.log(`Total battles: ${endedBattles.length}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Skipped (already correct): ${skippedCount}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

fixEndedBattlesData();
