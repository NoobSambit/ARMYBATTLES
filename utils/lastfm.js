import axios from 'axios';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

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
