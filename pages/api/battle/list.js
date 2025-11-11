import connectDB from '../../../utils/db';
import Battle from '../../../models/Battle';
import { createHandler, withCors } from '../../../lib/middleware';
import { logger } from '../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    res.status(200).json({ battles: battlesData });
  } catch (error) {
    logger.error('Battle list error', { error: error.message });
    res.status(500).json({ error: 'Server error fetching battles' });
  }
}

export default createHandler(handler, [withCors]);
