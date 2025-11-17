import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { createHandler, withCors, withRateLimit } from '../../../lib/middleware';
import {
  clearRequestTokenCookie,
  generateSessionToken,
  getRequestTokenFromRequest,
  getSessionExpiryDate,
  setSessionCookie,
} from '../../../utils/auth';
import { exchangeTokenForSession, getLastfmProfile } from '../../../utils/lastfm';
import { logger } from '../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body || {};

  try {
    const storedToken = getRequestTokenFromRequest(req);
    const tokenToUse = token || storedToken;

    if (!storedToken || !tokenToUse) {
      return res.status(400).json({ error: 'Invalid or expired Last.fm login token' });
    }

    if (token && storedToken !== token) {
      return res.status(400).json({ error: 'Invalid or expired Last.fm login token' });
    }

    const session = await exchangeTokenForSession(tokenToUse);
    const profile = await getLastfmProfile(session.username);

    await connectDB();

    let user = await User.findOne({ lastfmUsername: session.username });

    const sessionToken = generateSessionToken();
    const sessionExpiresAt = getSessionExpiryDate();

    if (!user) {
      user = await User.create({
        username: session.username,
        lastfmUsername: session.username,
        lastfmSessionKey: session.sessionKey,
        displayName: profile?.displayName || null,
        avatarUrl: profile?.avatarUrl || null,
        sessionToken,
        sessionExpiresAt,
      });
    } else {
      user.lastfmSessionKey = session.sessionKey;
      user.displayName = profile?.displayName || user.displayName;
      user.avatarUrl = profile?.avatarUrl || user.avatarUrl;
      user.sessionToken = sessionToken;
      user.sessionExpiresAt = sessionExpiresAt;
      await user.save();
    }

    setSessionCookie(res, sessionToken, sessionExpiresAt);
    clearRequestTokenCookie(res);

    logger.info('User authenticated via Last.fm', { userId: user._id, username: user.username });

    res.status(200).json({
      message: 'Login successful',
      token: sessionToken,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        lastfmUsername: user.lastfmUsername,
        avatarUrl: user.avatarUrl,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    logger.error('Last.fm login failed', { error: error.message });
    res.status(500).json({ error: 'Failed to complete Last.fm login' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
]);
