import mongoose from 'mongoose';

/**
 * BattleStats model - Tracks aggregate statistics for battles
 * Persists stats even when users leave battles
 */
const BattleStatsSchema = new mongoose.Schema({
  battleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Battle',
    required: true,
    unique: true
  },
  // Total streams for BTS (all members combined)
  totalBTSStreams: {
    type: Number,
    default: 0
  },
  // Individual member stream counts
  memberStats: {
    RM: { type: Number, default: 0 },
    Jin: { type: Number, default: 0 },
    Suga: { type: Number, default: 0 },
    'J-Hope': { type: Number, default: 0 },
    Jimin: { type: Number, default: 0 },
    V: { type: Number, default: 0 },
    'Jung Kook': { type: Number, default: 0 }
  },
  // Track most streamed songs
  topTracks: [{
    title: String,
    artist: String,
    count: Number
  }],
  // Last update timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

BattleStatsSchema.index({ battleId: 1 });

export default mongoose.models.BattleStats || mongoose.model('BattleStats', BattleStatsSchema);
