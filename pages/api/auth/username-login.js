import { createHandler, withCors, withRateLimit, withValidation } from '../../../lib/middleware';
import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { getLastfmProfile } from '../../../utils/lastfm';
import {
  generateSessionToken,
  getSessionExpiryDate,
  setSessionCookie,
} from '../../../utils/auth';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Last.fm username is required').trim(),
});

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username: lastfmUsername } = req.body;

    // Verify the Last.fm username exists by fetching profile
    // OPTIMIZATION: Single Last.fm API call instead of duplicate (Netlify optimization)
    const profile = await getLastfmProfile(lastfmUsername);

    if (!profile) {
      // If getLastfmProfile returns null, it means the API call failed or user doesn't exist
      return res.status(404).json({
        error: 'Last.fm user not found. Please check your username.'
      });
    }

    // Extract profile data from the utility function result
    const displayName = profile.displayName || null;
    const avatarUrl = profile.avatarUrl || null;

    // Connect to database
    await connectDB();

    // Find or create user
    let user = await User.findOne({ lastfmUsername: lastfmUsername.toLowerCase() });

    if (user) {
      // Update existing user's profile data
      user.displayName = displayName;
      user.avatarUrl = avatarUrl;
    } else {
      // Create new user
      user = new User({
        username: lastfmUsername.toLowerCase(),
        lastfmUsername: lastfmUsername.toLowerCase(),
        displayName,
        avatarUrl,
      });
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    const sessionExpiresAt = getSessionExpiryDate();

    user.sessionToken = sessionToken;
    user.sessionExpiresAt = sessionExpiresAt;

    await user.save();

    // Set session cookie
    setSessionCookie(res, sessionToken, sessionExpiresAt);

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        lastfmUsername: user.lastfmUsername,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isAdmin: user.isAdmin,
      },
      token: sessionToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Failed to login. Please try again.'
    });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
  withValidation(loginSchema),
]);
