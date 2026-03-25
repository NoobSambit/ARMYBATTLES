import {
  TRACKING_SERVICES,
  getTrackingServiceLabel,
  normalizeTrackingService,
  trackingServiceSupportsBattleVerification,
} from '../lib/tracking-services.js';
import { getLastfmProfile, getRecentTracks as getLastfmRecentTracks } from './lastfm.js';
import { getMusicatProfile } from './musicat.js';
import { getStatsfmProfile, getStatsfmRecentTracks } from './statsfm.js';

export { getTrackingServiceLabel } from '../lib/tracking-services.js';

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function normalizeTrackingUsername(service, username) {
  if (!username) {
    return null;
  }

  const trimmed = String(username).trim();

  if (service === TRACKING_SERVICES.MUSICAT) {
    return trimmed.replace(/^@/, '').toLowerCase();
  }

  return trimmed.toLowerCase();
}

export function buildTrackingAccountKey(service, stableIdentifier) {
  const normalizedService = normalizeTrackingService(service);
  const normalizedIdentifier = String(stableIdentifier || '').trim().toLowerCase();

  if (!normalizedIdentifier) {
    return null;
  }

  if (normalizedService === TRACKING_SERVICES.LASTFM) {
    return normalizedIdentifier;
  }

  return `${normalizedService}:${normalizedIdentifier}`;
}

export function getUserTrackingService(user) {
  return normalizeTrackingService(user?.trackingService);
}

export function getUserTrackingUsername(user) {
  const service = getUserTrackingService(user);

  if (user?.trackingUsername) {
    return user.trackingUsername;
  }

  if (service === TRACKING_SERVICES.LASTFM) {
    return user?.lastfmUsername || null;
  }

  return null;
}

export function getUserTrackingUserId(user) {
  return user?.trackingUserId || null;
}

export function getUserTrackingProfileUrl(user) {
  const service = getUserTrackingService(user);

  if (user?.trackingProfileUrl) {
    return user.trackingProfileUrl;
  }

  if (service === TRACKING_SERVICES.LASTFM) {
    return user?.lastfmProfileUrl || null;
  }

  return null;
}

export function getUserTrackingAccountKey(user) {
  return user?.lastfmUsername || null;
}

export function userSupportsBattleVerification(user) {
  return trackingServiceSupportsBattleVerification(getUserTrackingService(user));
}

export function getBattleVerificationUnavailableMessage(userOrService) {
  const service = typeof userOrService === 'string'
    ? normalizeTrackingService(userOrService)
    : getUserTrackingService(userOrService);

  if (service === TRACKING_SERVICES.MUSICAT) {
    return 'Musicat login is available, but battle verification is not supported yet because Musicat does not expose a stable public listening-history endpoint.';
  }

  return `${getTrackingServiceLabel(service)} battle verification is not available for this account.`;
}

export function extractTrackingUsernameFromProfileUrl(service, profileUrl) {
  if (!profileUrl) {
    return null;
  }

  try {
    const url = new URL(profileUrl);
    const segments = url.pathname.split('/').filter(Boolean).map(segment => safeDecodeURIComponent(segment));

    if (service === TRACKING_SERVICES.LASTFM) {
      if (url.hostname.toLowerCase().includes('last.fm') && segments[0] === 'user' && segments[1]) {
        return normalizeTrackingUsername(service, segments[1]);
      }
      return null;
    }

    if (service === TRACKING_SERVICES.STATSFM) {
      if (!url.hostname.toLowerCase().includes('stats.fm')) {
        return null;
      }

      if (segments[0] === 'user' && segments[1]) {
        return normalizeTrackingUsername(service, segments[1]);
      }

      if (segments[0]) {
        return normalizeTrackingUsername(service, segments[0]);
      }

      return null;
    }

    if (service === TRACKING_SERVICES.MUSICAT) {
      if (!url.hostname.toLowerCase().includes('musicat.fm')) {
        return null;
      }

      const firstSegment = segments[0];
      if (!firstSegment) {
        return null;
      }

      return normalizeTrackingUsername(service, firstSegment);
    }
  } catch (error) {
    return null;
  }

  return null;
}

function buildDefaultTrackingProfileUrl(service, username) {
  if (!username) {
    return null;
  }

  if (service === TRACKING_SERVICES.LASTFM) {
    return `https://www.last.fm/user/${encodeURIComponent(username)}`;
  }

  if (service === TRACKING_SERVICES.STATSFM) {
    return `https://stats.fm/user/${encodeURIComponent(username)}`;
  }

  if (service === TRACKING_SERVICES.MUSICAT) {
    return `https://musicat.fm/@${encodeURIComponent(username)}`;
  }

  return null;
}

export async function resolveTrackingIdentity({ service, username, profileUrl }) {
  const normalizedService = normalizeTrackingService(service);
  const normalizedUsername = normalizeTrackingUsername(normalizedService, username)
    || extractTrackingUsernameFromProfileUrl(normalizedService, profileUrl);

  if (!normalizedUsername) {
    return null;
  }

  if (normalizedService === TRACKING_SERVICES.LASTFM) {
    const profile = await getLastfmProfile(normalizedUsername);

    if (!profile) {
      return null;
    }

    return {
      service: normalizedService,
      trackingUsername: normalizedUsername,
      trackingUserId: null,
      trackingProfileUrl: buildDefaultTrackingProfileUrl(normalizedService, normalizedUsername),
      accountKey: buildTrackingAccountKey(normalizedService, normalizedUsername),
      displayName: profile.displayName || null,
      avatarUrl: profile.avatarUrl || null,
    };
  }

  if (normalizedService === TRACKING_SERVICES.STATSFM) {
    const profile = await getStatsfmProfile(normalizedUsername);

    if (!profile) {
      return null;
    }

    const trackingUsername = normalizeTrackingUsername(normalizedService, profile.username || normalizedUsername);
    const stableIdentifier = profile.userId || trackingUsername;

    return {
      service: normalizedService,
      trackingUsername,
      trackingUserId: profile.userId || null,
      trackingProfileUrl: profile.profileUrl || buildDefaultTrackingProfileUrl(normalizedService, trackingUsername),
      accountKey: buildTrackingAccountKey(normalizedService, stableIdentifier),
      displayName: profile.displayName || null,
      avatarUrl: profile.avatarUrl || null,
      privacySettings: profile.privacySettings || null,
    };
  }

  if (normalizedService === TRACKING_SERVICES.MUSICAT) {
    const profile = await getMusicatProfile(normalizedUsername);

    if (!profile) {
      return null;
    }

    const trackingUsername = normalizeTrackingUsername(normalizedService, profile.username || normalizedUsername);
    const stableIdentifier = profile.userId || trackingUsername;

    return {
      service: normalizedService,
      trackingUsername,
      trackingUserId: profile.userId || null,
      trackingProfileUrl: profile.profileUrl || buildDefaultTrackingProfileUrl(normalizedService, trackingUsername),
      accountKey: buildTrackingAccountKey(normalizedService, stableIdentifier),
      displayName: profile.displayName || null,
      avatarUrl: profile.avatarUrl || null,
    };
  }

  return null;
}

export async function getRecentTracksForUser(user, fromTimestamp, toTimestamp, options = {}) {
  const service = getUserTrackingService(user);

  if (!trackingServiceSupportsBattleVerification(service)) {
    throw new Error(getBattleVerificationUnavailableMessage(user));
  }

  if (service === TRACKING_SERVICES.LASTFM) {
    return getLastfmRecentTracks(getUserTrackingUsername(user), fromTimestamp, toTimestamp, options);
  }

  if (service === TRACKING_SERVICES.STATSFM) {
    return getStatsfmRecentTracks(
      getUserTrackingUserId(user) || getUserTrackingUsername(user),
      fromTimestamp,
      toTimestamp,
      options
    );
  }

  throw new Error(getBattleVerificationUnavailableMessage(user));
}

export function serializeUserForClient(user) {
  const trackingService = getUserTrackingService(user);
  const trackingUsername = getUserTrackingUsername(user);
  const trackingProfileUrl = getUserTrackingProfileUrl(user);
  const isLastfm = trackingService === TRACKING_SERVICES.LASTFM;

  return {
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin,
    trackingService,
    trackingServiceLabel: getTrackingServiceLabel(trackingService),
    trackingUsername,
    trackingUserId: getUserTrackingUserId(user),
    trackingProfileUrl,
    supportsBattleVerification: userSupportsBattleVerification(user),
    lastfmUsername: isLastfm ? trackingUsername : null,
    lastfmProfileUrl: isLastfm ? trackingProfileUrl : null,
  };
}
