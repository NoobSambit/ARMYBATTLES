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
  description: {
    type: String,
    trim: true,
    default: ''
  },
  goal: {
    type: Number,
    required: true,
    min: 1
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
    type: {
      type: String,
      enum: ['solo', 'team'],
      default: 'solo'
    },
    // Solo player fields
    userId: mongoose.Schema.Types.ObjectId,
    username: String,
    displayName: String,
    count: Number,
    isCheater: Boolean,
    // Team fields
    teamId: mongoose.Schema.Types.ObjectId,
    teamName: String,
    totalScore: Number,
    memberCount: Number,
    // Team member details - stores individual contributions
    members: [{
      userId: mongoose.Schema.Types.ObjectId,
      username: String,
      displayName: String,
      count: Number,
      isCheater: Boolean
    }]
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
