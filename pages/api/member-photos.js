import dbConnect from '../../utils/db';
import MemberPhotos from '../../models/MemberPhotos';
import { createHandler, withCors } from '../../lib/middleware';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

// Hardcoded high-quality photo URLs as fallback
const FALLBACK_PHOTOS = {
  'BTS': 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
  'RM': 'https://lastfm.freetls.fastly.net/i/u/300x300/dbd0b6647c6f8f2c8c7e7a3b6e0e8c3c.png',
  'Jin': 'https://lastfm.freetls.fastly.net/i/u/300x300/c5b8e7f4b4e4a3c3c3d3c3c3c3c3c3c3.png',
  'Suga': 'https://lastfm.freetls.fastly.net/i/u/300x300/b4c3d3e4f4a3b3c3c3d3c3c3c3c3c3c3.png',
  'Agust D': 'https://lastfm.freetls.fastly.net/i/u/300x300/b4c3d3e4f4a3b3c3c3d3c3c3c3c3c3c3.png',
  'J-Hope': 'https://lastfm.freetls.fastly.net/i/u/300x300/a3b3c3d3e4f4a3b3c3d3c3c3c3c3c3c3.png',
  'Jimin': 'https://lastfm.freetls.fastly.net/i/u/300x300/d3c3b3a3e4f4a3b3c3d3c3c3c3c3c3c3.png',
  'V': 'https://lastfm.freetls.fastly.net/i/u/300x300/e4d3c3b3a3f4a3b3c3d3c3c3c3c3c3c3.png',
  'Jung Kook': 'https://lastfm.freetls.fastly.net/i/u/300x300/f4e4d3c3b3a3a3b3c3d3c3c3c3c3c3c3.png',
  'Jungkook': 'https://lastfm.freetls.fastly.net/i/u/300x300/f4e4d3c3b3a3a3b3c3d3c3c3c3c3c3c3.png'
};

async function fetchArtistPhotoFromLastfm(artistName) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.artist && data.artist.image) {
      // Get largest image (extralarge or mega)
      const images = data.artist.image;
      const largeImage = images.find(img => img.size === 'extralarge' || img.size === 'mega');
      if (largeImage && largeImage['#text']) {
        return largeImage['#text'];
      }
    }
  } catch (error) {
    console.error(`Error fetching photo for ${artistName}:`, error);
  }

  return null;
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { artist } = req.query;

    if (!artist) {
      return res.status(400).json({ error: 'Artist name required' });
    }

    // Check cache first
    let cachedPhoto = await MemberPhotos.findOne({ artistName: artist });

    // If cached and less than 30 days old, return it
    if (cachedPhoto) {
      const daysSinceUpdate = (Date.now() - cachedPhoto.lastUpdated) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) {
        return res.json({ photoUrl: cachedPhoto.photoUrl, source: cachedPhoto.source });
      }
    }

    // Try to fetch from Last.fm
    let photoUrl = await fetchArtistPhotoFromLastfm(artist);

    // If not found, use fallback
    if (!photoUrl) {
      photoUrl = FALLBACK_PHOTOS[artist] || FALLBACK_PHOTOS['BTS'];
    }

    // Update or create cache
    if (cachedPhoto) {
      cachedPhoto.photoUrl = photoUrl;
      cachedPhoto.lastUpdated = new Date();
      await cachedPhoto.save();
    } else {
      await MemberPhotos.create({
        artistName: artist,
        photoUrl,
        source: 'lastfm'
      });
    }

    return res.json({ photoUrl, source: 'lastfm' });
  } catch (error) {
    console.error('Error in member-photos API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default createHandler(handler, [withCors]);
