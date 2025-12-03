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
  allowTeams: {
    type: Boolean,
    default: true
  },
  finalLeaderboard: [{
    userId: mongoose.Schema.Types.ObjectId,
    username: String,
    count: Number,
    isCheater: Boolean
  }],
  endedAt: Date,
  removedParticipants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    removedAt: Date,
    removedBy: mongoose.Schema.Types.ObjectId,
    scoreAtRemoval: Number,
    reason: String
  }],
  extensionHistory: [{
    extendedBy: mongoose.Schema.Types.ObjectId,
    extendedAt: Date,
    previousEndTime: Date,
    newEndTime: Date,
    reason: String
  }],
  originalEndTime: Date
}, {
  timestamps: true
});

export default mongoose.models.Battle || mongoose.model('Battle', BattleSchema);
