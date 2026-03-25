import axios from 'axios';

const STATSFM_API_BASE_URL = 'https://api.stats.fm/api/v1';
const STATSFM_DEFAULT_TIMEOUT = 5000;
const STATSFM_PAGE_SIZE = 100;
const STATSFM_TRACK_BATCH_SIZE = 50;

const statsfmApi = axios.create({
  baseURL: STATSFM_API_BASE_URL,
  timeout: STATSFM_DEFAULT_TIMEOUT,
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeStatsfmUsername(username) {
  return username ? String(username).trim().toLowerCase() : null;
}

function buildStatsfmProfileUrl(identifier) {
  return `https://stats.fm/user/${encodeURIComponent(identifier)}`;
}

function formatAxiosError(error) {
  return error.response?.data?.message || error.response?.data || error.message;
}

function chunkArray(items, chunkSize) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

export async function getStatsfmProfile(identifier, options = {}) {
  if (!identifier) {
    return null;
  }

  try {
    const response = await statsfmApi.get(`/users/${encodeURIComponent(identifier)}`, {
      timeout: options.timeout || STATSFM_DEFAULT_TIMEOUT,
    });

    const item = response.data?.item;
    if (!item) {
      return null;
    }

    const canonicalIdentifier = item.customId || item.id;

    return {
      userId: item.id,
      username: normalizeStatsfmUsername(canonicalIdentifier),
      displayName: item.displayName || null,
      avatarUrl: item.image || item.spotifyAuth?.image || null,
      profileUrl: buildStatsfmProfileUrl(canonicalIdentifier),
      privacySettings: item.privacySettings || null,
      raw: item,
    };
  } catch (error) {
    return null;
  }
}

async function getStatsfmTrackMetadata(trackIds, options = {}) {
  const timeout = options.timeout || STATSFM_DEFAULT_TIMEOUT;
  const delayBetweenRequests = options.delayBetweenRequests ?? 50;
  const trackMap = new Map();
  let hadError = false;
  let errorMessage = null;

  const chunks = chunkArray(trackIds, STATSFM_TRACK_BATCH_SIZE);

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];

    try {
      const response = await statsfmApi.get('/tracks/list', {
        params: {
          ids: chunk.join(','),
        },
        timeout,
      });

      const items = Array.isArray(response.data?.items) ? response.data.items : [];

      items.forEach(track => {
        trackMap.set(String(track.id), {
          name: track.name || null,
          artist: track.artists?.[0]?.name || null,
        });
      });
    } catch (error) {
      hadError = true;
      errorMessage = errorMessage || formatAxiosError(error);
    }

    if (index < chunks.length - 1 && delayBetweenRequests > 0) {
      await sleep(delayBetweenRequests);
    }
  }

  return {
    trackMap,
    hadError,
    errorMessage,
  };
}

export async function getStatsfmRecentTracks(identifier, fromTimestamp, toTimestamp, options = {}) {
  const {
    maxPages = null,
    delayBetweenRequests = 200,
    timeout = STATSFM_DEFAULT_TIMEOUT,
    includeMeta = false,
    pageSize = STATSFM_PAGE_SIZE,
  } = options;

  const allStreams = [];
  const allTracks = [];
  let cursor = toTimestamp + 1;
  let currentPage = 1;
  let pagesFetched = 0;
  let hitMaxPages = false;
  let hadError = false;
  let errorMessage = null;
  let errorPage = null;

  try {
    while (true) {
      const response = await statsfmApi.get(`/users/${encodeURIComponent(identifier)}/streams`, {
        params: {
          limit: pageSize,
          before: cursor,
        },
        timeout,
      });

      const items = Array.isArray(response.data?.items) ? response.data.items : [];

      if (items.length === 0) {
        break;
      }

      allStreams.push(...items);
      pagesFetched = currentPage;

      const oldestTimestamp = Math.min(
        ...items
          .map(item => new Date(item.endTime).getTime())
          .filter(Number.isFinite)
      );

      const hasOlderStreams = Number.isFinite(oldestTimestamp) && oldestTimestamp > fromTimestamp;
      const reachedMaxPages = maxPages !== null && currentPage >= maxPages;

      if (reachedMaxPages) {
        if (hasOlderStreams) {
          hitMaxPages = true;
        }
        break;
      }

      if (!hasOlderStreams) {
        break;
      }

      cursor = oldestTimestamp - 1;
      currentPage += 1;

      if (delayBetweenRequests > 0) {
        await sleep(delayBetweenRequests);
      }
    }

    const filteredStreams = allStreams.filter(stream => {
      const timestamp = new Date(stream.endTime).getTime();

      return Number.isFinite(timestamp) && timestamp >= fromTimestamp && timestamp <= toTimestamp;
    });

    const trackIds = Array.from(
      new Set(
        filteredStreams
          .map(stream => stream.trackId)
          .filter(trackId => trackId !== null && trackId !== undefined)
      )
    );

    const { trackMap, hadError: metadataHadError, errorMessage: metadataError } = await getStatsfmTrackMetadata(trackIds, {
      timeout,
      delayBetweenRequests: Math.min(delayBetweenRequests, 100),
    });

    if (metadataHadError) {
      hadError = true;
      errorMessage = errorMessage || metadataError || 'Failed to enrich Stats.fm track metadata';
    }

    filteredStreams.forEach(stream => {
      const timestamp = new Date(stream.endTime).getTime();
      const metadata = trackMap.get(String(stream.trackId));

      if (!Number.isFinite(timestamp) || !metadata?.artist) {
        hadError = true;
        errorMessage = errorMessage || 'Incomplete Stats.fm track metadata';
        return;
      }

      allTracks.push({
        name: metadata.name || stream.trackName,
        artist: metadata.artist,
        timestamp,
      });
    });
  } catch (error) {
    hadError = true;
    errorMessage = formatAxiosError(error);
    errorPage = currentPage;
    console.error(`Error fetching Stats.fm streams for ${identifier}:`, errorMessage);
  }

  const uniqueTracks = Array.from(
    new Map(allTracks.map(track => [track.timestamp, track])).values()
  );

  const meta = {
    complete: !hadError && !hitMaxPages,
    partial: hadError || hitMaxPages,
    hadError,
    hitMaxPages,
    fetchedPages: pagesFetched,
    totalPages: null,
    error: errorMessage,
    errorPage,
  };

  if (includeMeta) {
    return { tracks: uniqueTracks, meta };
  }

  return uniqueTracks;
}
