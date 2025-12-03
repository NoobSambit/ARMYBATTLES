import connectDB from '../../../utils/db';
import Battle from '../../../models/Battle';
import mongoose from 'mongoose';
import { createHandler, withCors } from '../../../lib/middleware';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { battleId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(battleId)) {
      return res.status(400).json({ error: 'Invalid battle ID' });
    }

    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    // Clear the finalLeaderboard to force regeneration
    await Battle.findByIdAndUpdate(battleId, {
      $unset: { finalLeaderboard: 1 }
    });

    res.status(200).json({
      message: 'Final leaderboard cleared successfully. The leaderboard will be rebuilt from live data.',
      battleId,
    });
  } catch (error) {
    console.error('Error clearing final leaderboard:', error);
    res.status(500).json({ error: 'Server error clearing leaderboard' });
  }
}

export default createHandler(handler, [withCors]);
