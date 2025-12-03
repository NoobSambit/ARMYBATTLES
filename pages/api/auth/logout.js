import connectDB from '../../../utils/db';
import { createHandler, withCors, withRateLimit, withAuth } from '../../../lib/middleware';
import { clearSessionCookie } from '../../../utils/auth';
import { logger } from '../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const user = req.user;
    if (user) {
      user.sessionToken = null;
      user.sessionExpiresAt = null;
      await user.save();
      logger.info('User logged out', { userId: user._id, username: user.username });
    }

    clearSessionCookie(res);

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({ error: 'Server error during logout' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
  withAuth(),
]);
