import connectDB from '../../../utils/db';
import Battle from '../../../models/Battle';
import { extractPlaylistId, getPlaylistTracks } from '../../../utils/spotify';
import { createHandler, withCors, withRateLimit, withAuth, withValidation } from '../../../lib/middleware';
import { createBattleSchema } from '../../../lib/schemas';
import { logger } from '../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { name, spotifyPlaylist, startTime, endTime } = req.validatedBody;

    const start = new Date(startTime);
    const end = new Date(endTime);

    const playlistId = extractPlaylistId(spotifyPlaylist);
    
    logger.info('Fetching Spotify playlist tracks', { playlistId });
    const playlistTracks = await getPlaylistTracks(playlistId);

    if (playlistTracks.length === 0) {
      return res.status(400).json({ error: 'No tracks found in playlist' });
    }

    const battle = await Battle.create({
      host: req.userId,
      name,
      spotifyPlaylist: playlistId,
      playlistTracks,
      startTime: start,
      endTime: end,
      participants: [],
      status: 'upcoming',
    });

    logger.info('Battle created successfully', { 
      battleId: battle._id, 
      name: battle.name, 
      trackCount: playlistTracks.length 
    });

    res.status(201).json({
      message: 'Battle created successfully',
      battle: {
        id: battle._id,
        name: battle.name,
        spotifyPlaylist: battle.spotifyPlaylist,
        startTime: battle.startTime,
        endTime: battle.endTime,
        trackCount: battle.playlistTracks.length,
        status: battle.status,
      },
    });
  } catch (error) {
    logger.error('Battle creation error', { error: error.message });
    res.status(500).json({ error: 'Server error creating battle' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(5, 60000),
  withAuth(),
  withValidation(createBattleSchema),
]);
