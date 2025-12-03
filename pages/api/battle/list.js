import connectDB from '../../../utils/db';
import Battle from '../../../models/Battle';
import { createHandler, withCors } from '../../../lib/middleware';
import { logger } from '../../../utils/logger';

// Cache for battle list (60 second TTL)
const cache = {
  data: null,
  timestamp: 0
};
const CACHE_TTL = 60000; // 60 seconds

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check cache first
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
      logger.info('Battle list served from cache');
      return res.status(200).json(cache.data);
    }

    await connectDB();

    const battles = await Battle.find()
      .populate('host', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    const battlesData = battles.map(battle => ({
      id: battle._id,
      name: battle.name,
      host: battle.host.username,
      startTime: battle.startTime,
      endTime: battle.endTime,
      status: battle.status,
      participantCount: battle.participants.length,
      trackCount: battle.playlistTracks.length,
    }));

    // Update cache
    const response = { battles: battlesData };
    cache.data = response;
    cache.timestamp = now;

    res.status(200).json(response);
  } catch (error) {
    logger.error('Battle list error', { error: error.message });
    res.status(500).json({ error: 'Server error fetching battles' });
  }
}

export default createHandler(handler, [withCors]);
