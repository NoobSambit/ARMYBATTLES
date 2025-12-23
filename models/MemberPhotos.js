import mongoose from 'mongoose';

/**
 * MemberPhotos model - Stores cached artist photos from Last.fm/Spotify
 */
const MemberPhotosSchema = new mongoose.Schema({
  artistName: {
    type: String,
    required: true,
    unique: true
  },
  photoUrl: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['lastfm', 'spotify', 'manual'],
    default: 'lastfm'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

MemberPhotosSchema.index({ artistName: 1 });

export default mongoose.models.MemberPhotos || mongoose.model('MemberPhotos', MemberPhotosSchema);
