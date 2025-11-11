import mongoose from 'mongoose';

const BattleSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  spotifyPlaylist: {
    type: String,
    required: true
  },
  playlistTracks: [{
    title: {
      type: String,
      required: true
    },
    artist: {
      type: String,
      required: true
    },
    normalizedTitle: String,
    normalizedArtist: String
  }],
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['upcoming', 'active', 'ended'],
    default: 'upcoming'
  },
  finalLeaderboard: [{
    userId: mongoose.Schema.Types.ObjectId,
    username: String,
    count: Number,
    isCheater: Boolean
  }],
  endedAt: Date
}, {
  timestamps: true
});

export default mongoose.models.Battle || mongoose.model('Battle', BattleSchema);
