import axios from 'axios';

const MUSICAT_API_BASE_URL = 'https://api.musicat.fm';
const MUSICAT_DEFAULT_TIMEOUT = 5000;

const musicatApi = axios.create({
  baseURL: MUSICAT_API_BASE_URL,
  timeout: MUSICAT_DEFAULT_TIMEOUT,
});

function normalizeMusicatUsername(username) {
  if (!username) {
    return null;
  }

  return String(username).trim().replace(/^@/, '').toLowerCase();
}

function buildMusicatProfileUrl(username) {
  return `https://musicat.fm/@${encodeURIComponent(username)}`;
}

export async function getMusicatProfile(identifier, options = {}) {
  const normalizedIdentifier = normalizeMusicatUsername(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  try {
    const response = await musicatApi.get('/v1/users/search', {
      params: {
        query: normalizedIdentifier,
        history: false,
      },
      timeout: options.timeout || MUSICAT_DEFAULT_TIMEOUT,
    });

    const items = Array.isArray(response.data) ? response.data : [];
    const exactMatch = items.find(item => {
      const handle = normalizeMusicatUsername(item.secondaryText);
      const primaryText = normalizeMusicatUsername(item.primaryText);

      return handle === normalizedIdentifier || primaryText === normalizedIdentifier;
    });

    if (!exactMatch) {
      return null;
    }

    const username = normalizeMusicatUsername(exactMatch.secondaryText || normalizedIdentifier);

    return {
      userId: exactMatch.publicId || null,
      username,
      displayName: exactMatch.primaryText || null,
      avatarUrl: exactMatch.imageUrl || null,
      profileUrl: buildMusicatProfileUrl(username),
      raw: exactMatch,
    };
  } catch (error) {
    return null;
  }
}
