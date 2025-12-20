import connectDB from '../../../utils/db';
import Battle from '../../../models/Battle';
import StreamCount from '../../../models/StreamCount';
import BattleStats from '../../../models/BattleStats';
import User from '../../../models/User';
import { getRecentTracks, matchTrack } from '../../../utils/lastfm';
import { updateStatsWithScrobble } from '../../../utils/btsStats';
import { createHandler, withCors } from '../../../lib/middleware';

/**
 * Admin endpoint to backfill BattleStats from existing StreamCount data
 * Can process a single battle or all battles
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { battleId, all } = req.body;

    // Get battles to process
    let battlesToProcess = [];

    if (all) {
      // Process all battles
      battlesToProcess = await Battle.find({});
      console.log(`Processing all ${battlesToProcess.length} battles...`);
    } else if (battleId) {
      // Process single battle
      const battle = await Battle.findById(battleId);
      if (!battle) {
        return res.status(404).json({ error: 'Battle not found' });
      }
      battlesToProcess = [battle];
    } else {
      return res.status(400).json({ error: 'Either battleId or all:true is required' });
    }

    const results = [];
    let totalBattlesProcessed = 0;
    let totalBattlesFailed = 0;

    // Process each battle
    for (const battle of battlesToProcess) {
      try {
        console.log(`\n=== Processing: ${battle.name} ===`);

        // Get or create BattleStats
        let battleStats = await BattleStats.findOne({ battleId: battle._id });

        if (!battleStats) {
          battleStats = await BattleStats.create({
            battleId: battle._id,
            totalBTSStreams: 0,
            memberStats: {
              RM: 0,
              Jin: 0,
              Suga: 0,
              'J-Hope': 0,
              Jimin: 0,
              V: 0,
              'Jung Kook': 0
            },
            topTracks: []
          });
        } else {
          // Reset stats to recalculate from scratch
          battleStats.totalBTSStreams = 0;
          battleStats.memberStats = {
            RM: 0,
            Jin: 0,
            Suga: 0,
            'J-Hope': 0,
            Jimin: 0,
            V: 0,
            'Jung Kook': 0
          };
          battleStats.topTracks = [];
        }

        // Get all StreamCounts for this battle (including from users who left)
        const streamCounts = await StreamCount.find({ battleId: battle._id });

        console.log(`Found ${streamCounts.length} StreamCount records`);

        let totalScrobblesProcessed = 0;
        let usersProcessed = 0;

        // Process each user's scrobbles
        for (const streamCount of streamCounts) {
          try {
            const user = await User.findById(streamCount.userId);

            if (!user || !user.lastfmUsername) {
              console.log(`Skipping user ${streamCount.userId} - no Last.fm username`);
              continue;
            }

            console.log(`Processing ${user.username} (${user.lastfmUsername})...`);

            // Fetch their scrobbles for the battle period
            const recentTracks = await getRecentTracks(
              user.lastfmUsername,
              Math.max(battle.startTime.getTime(), streamCount.createdAt.getTime()),
              battle.endTime.getTime(),
              { maxPages: 10, delayBetweenRequests: 200 }
            );

            // Match tracks against playlist
            const matchedTracks = recentTracks.filter(scrobble => {
              const isInTimeRange =
                scrobble.timestamp >= Math.max(battle.startTime.getTime(), streamCount.createdAt.getTime()) &&
                scrobble.timestamp <= battle.endTime.getTime();

              return isInTimeRange && matchTrack(scrobble, battle.playlistTracks);
            });

            console.log(`  - Found ${matchedTracks.length} matched scrobbles`);

            // Process each scrobble for stats
            for (const scrobble of matchedTracks) {
              updateStatsWithScrobble(battleStats, scrobble);
            }

            totalScrobblesProcessed += matchedTracks.length;
            usersProcessed++;

          } catch (error) {
            console.error(`Error processing user ${streamCount.userId}:`, error.message);
            // Continue with next user
          }
        }

        // Save the stats
        await battleStats.save();

        console.log(`Battle complete: ${totalScrobblesProcessed} scrobbles from ${usersProcessed} users`);

        results.push({
          battleId: battle._id,
          battleName: battle.name,
          usersProcessed,
          totalScrobblesProcessed,
          stats: {
            totalBTSStreams: battleStats.totalBTSStreams,
            memberStats: battleStats.memberStats,
            topTracksCount: battleStats.topTracks.length
          }
        });

        totalBattlesProcessed++;

      } catch (error) {
        console.error(`Error processing battle ${battle.name}:`, error.message);
        totalBattlesFailed++;
        results.push({
          battleId: battle._id,
          battleName: battle.name,
          error: error.message
        });
      }
    }

    console.log(`\n=== BACKFILL COMPLETE ===`);
    console.log(`Total battles processed: ${totalBattlesProcessed}`);
    console.log(`Total battles failed: ${totalBattlesFailed}`);

    return res.status(200).json({
      success: true,
      message: `Stats backfilled for ${totalBattlesProcessed} battles`,
      totalBattlesProcessed,
      totalBattlesFailed,
      results
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

export default createHandler(handler, [withCors]);
