import axios from 'axios';
import crypto from 'crypto';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_SHARED_SECRET = process.env.LASTFM_SHARED_SECRET;

export function getLastfmAuthorizeUrl(token, callbackUrl) {
  const base = `https://www.last.fm/api/auth/?api_key=${LASTFM_API_KEY}&token=${token}`;
  if (callbackUrl) {
    return `${base}&cb=${encodeURIComponent(callbackUrl)}`;
  }
  return base;
}

export async function createLastfmAuthToken() {
  if (!LASTFM_API_KEY) {
    throw new Error('Missing Last.fm API configuration');
  }

  const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
    params: {
      method: 'auth.getToken',
      api_key: LASTFM_API_KEY,
      format: 'json',
    },
  });

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to obtain Last.fm auth token');
  }

  const token = response.data.token;

  if (!token) {
    throw new Error('Invalid Last.fm auth token response');
  }

  return token;
}

function buildSignature(params) {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys.map(key => `${key}${params[key]}`).join('') + LASTFM_SHARED_SECRET;
  return crypto.createHash('md5').update(signatureString, 'utf8').digest('hex');
}

export async function exchangeTokenForSession(token) {
  if (!token) {
    throw new Error('Missing Last.fm token');
  }

  if (!LASTFM_API_KEY || !LASTFM_SHARED_SECRET) {
    throw new Error('Missing Last.fm API configuration');
  }

  const params = {
    method: 'auth.getSession',
    api_key: LASTFM_API_KEY,
    token,
  };

  const api_sig = buildSignature(params);

  const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
    params: {
      ...params,
      api_sig,
      format: 'json',
    },
  });

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to retrieve Last.fm session');
  }

  if (!response.data.session) {
    throw new Error('Invalid Last.fm session response');
  }

  return {
    username: response.data.session.name,
    sessionKey: response.data.session.key,
  };
}

export async function getLastfmProfile(username) {
  if (!LASTFM_API_KEY) {
    throw new Error('Missing Last.fm API configuration');
  }

  if (!username) {
    return null;
  }

  try {
    const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'user.getInfo',
        user: username,
        api_key: LASTFM_API_KEY,
        format: 'json',
      },
    });

    if (!response.data.user) {
      return null;
    }

    const images = Array.isArray(response.data.user.image) ? response.data.user.image : [];
    const largeImage = images.reverse().find(img => img['#text']);

    return {
      displayName: response.data.user.realname || null,
      avatarUrl: largeImage ? largeImage['#text'] : null,
    };
  } catch (error) {
    return null;
  }
}

export async function getRecentTracks(username, fromTimestamp, toTimestamp) {
  try {
    const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'user.getrecenttracks',
        user: username,
        api_key: LASTFM_API_KEY,
        format: 'json',
        from: Math.floor(fromTimestamp / 1000),
        to: Math.floor(toTimestamp / 1000),
        limit: 200,
      },
    });

    if (!response.data.recenttracks || !response.data.recenttracks.track) {
      return [];
    }

    const tracks = Array.isArray(response.data.recenttracks.track)
      ? response.data.recenttracks.track
      : [response.data.recenttracks.track];

    return tracks
      .filter(track => track.date)
      .map(track => ({
        name: track.name,
        artist: track.artist['#text'] || track.artist.name || track.artist,
        timestamp: parseInt(track.date.uts) * 1000,
      }));
  } catch (error) {
    console.error(`Error fetching Last.fm tracks for ${username}:`, error.response?.data || error.message);
    return [];
  }
}

export function normalizeString(str) {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function matchTrack(scrobble, playlistTracks) {
  const scrobbleName = normalizeString(scrobble.name);
  const scrobbleArtist = normalizeString(scrobble.artist);

  return playlistTracks.some(track => {
    const trackName = track.normalizedTitle || normalizeString(track.title);
    const trackArtist = track.normalizedArtist || normalizeString(track.artist);
    return scrobbleName === trackName && scrobbleArtist === trackArtist;
  });
}
