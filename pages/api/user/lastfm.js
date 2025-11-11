import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { createHandler, withCors, withRateLimit, withAuth, withValidation } from '../../../lib/middleware';
import { lastfmSchema } from '../../../lib/schemas';
import { logger } from '../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { lastfmUsername } = req.validatedBody;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { lastfmUsername },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info('Last.fm username updated', { userId: user._id, lastfmUsername });

    res.status(200).json({
      message: 'Last.fm username updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastfmUsername: user.lastfmUsername,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    logger.error('Last.fm update error', { error: error.message });
    res.status(500).json({ error: 'Server error updating Last.fm username' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
  withAuth(),
  withValidation(lastfmSchema),
]);
