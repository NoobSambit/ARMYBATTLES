import axios from 'axios';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  
  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
    return cachedToken;
  } catch (error) {
    console.error('Error getting Spotify token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Spotify');
  }
}

export function extractPlaylistId(playlistUrl) {
  const match = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : playlistUrl;
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export async function getPlaylistTracks(playlistId) {
  const token = await getSpotifyToken();
  const tracks = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

  try {
    while (url) {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          limit: 100,
          fields: 'items(track(name,artists(name))),next',
        },
      });

      const items = response.data.items || [];
      
      for (const item of items) {
        if (item.track && item.track.name && item.track.artists && item.track.artists.length > 0) {
          const title = item.track.name;
          const artist = item.track.artists[0].name;
          
          tracks.push({
            title,
            artist,
            normalizedTitle: normalizeText(title),
            normalizedArtist: normalizeText(artist),
          });
        }
      }

      url = response.data.next;
    }

    return tracks;
  } catch (error) {
    console.error('Error fetching playlist tracks:', error.response?.data || error.message);
    throw new Error('Failed to fetch playlist tracks from Spotify');
  }
}
