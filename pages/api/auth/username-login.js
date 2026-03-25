import { createHandler, withCors, withRateLimit, withValidation } from '../../../lib/middleware';
import connectDB from '../../../utils/db';
import User from '../../../models/User';
import {
  generateSessionToken,
  getSessionExpiryDate,
  setSessionCookie,
} from '../../../utils/auth';
import { getTrackingServiceLabel, normalizeTrackingService } from '../../../lib/tracking-services';
import { resolveTrackingIdentity, serializeUserForClient } from '../../../utils/tracking';
import { z } from 'zod';

const loginSchema = z.object({
  service: z.enum(['lastfm', 'statsfm']).optional(),
  username: z.string().optional(),
  profileUrl: z.string().optional(),
});

async function generateUniqueAppUsername(baseUsername, service, existingUserId = null) {
  const normalizedBase = String(baseUsername || service || 'user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'user';

  const candidates = [
    normalizedBase,
    `${normalizedBase}-${service}`,
  ];

  for (const candidate of candidates) {
    const existingUser = await User.findOne({ username: candidate });
    if (!existingUser || existingUser._id.toString() === existingUserId) {
      return candidate;
    }
  }

  let suffix = 2;
  while (suffix < 1000) {
    const candidate = `${normalizedBase}-${service}-${suffix}`;
    const existingUser = await User.findOne({ username: candidate });

    if (!existingUser || existingUser._id.toString() === existingUserId) {
      return candidate;
    }

    suffix += 1;
  }

  throw new Error('Failed to allocate a unique username');
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const service = normalizeTrackingService(req.body.service);
    const serviceLabel = getTrackingServiceLabel(service);
    const { username, profileUrl } = req.body;

    if (!username && !profileUrl) {
      return res.status(400).json({
        error: `Please provide either a ${serviceLabel} username or profile URL`
      });
    }

    const trackingIdentity = await resolveTrackingIdentity({
      service,
      username,
      profileUrl,
    });

    if (!trackingIdentity) {
      return res.status(404).json({
        error: `${serviceLabel} user not found. Please check your username.`
      });
    }

    await connectDB();

    let user = await User.findOne({ lastfmUsername: trackingIdentity.accountKey });

    if (user) {
      user.trackingService = trackingIdentity.service;
      user.trackingUsername = trackingIdentity.trackingUsername;
      user.trackingUserId = trackingIdentity.trackingUserId;
      user.trackingProfileUrl = trackingIdentity.trackingProfileUrl;
      user.displayName = trackingIdentity.displayName;
      user.avatarUrl = trackingIdentity.avatarUrl;
      user.lastfmProfileUrl = trackingIdentity.service === 'lastfm' ? trackingIdentity.trackingProfileUrl : null;
    } else {
      const publicUsername = await generateUniqueAppUsername(
        trackingIdentity.trackingUsername || trackingIdentity.displayName || service,
        trackingIdentity.service
      );

      user = new User({
        username: publicUsername,
        lastfmUsername: trackingIdentity.accountKey,
        trackingService: trackingIdentity.service,
        trackingUsername: trackingIdentity.trackingUsername,
        trackingUserId: trackingIdentity.trackingUserId,
        displayName: trackingIdentity.displayName,
        avatarUrl: trackingIdentity.avatarUrl,
        lastfmProfileUrl: trackingIdentity.service === 'lastfm' ? trackingIdentity.trackingProfileUrl : null,
        trackingProfileUrl: trackingIdentity.trackingProfileUrl,
      });
    }

    const sessionToken = generateSessionToken();
    const sessionExpiresAt = getSessionExpiryDate();

    user.sessionToken = sessionToken;
    user.sessionExpiresAt = sessionExpiresAt;

    await user.save();

    setSessionCookie(res, sessionToken, sessionExpiresAt);

    return res.status(200).json({
      success: true,
      user: serializeUserForClient(user),
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
