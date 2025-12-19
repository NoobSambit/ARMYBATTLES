import mongoose from 'mongoose';

const StreamCountSchema = new mongoose.Schema({
  battleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Battle',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  isCheater: {
    type: Boolean,
    default: false
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  scrobbleTimestamps: [{
    type: Number
  }],
  lastSyncedAt: {
    type: Date,
    default: null
  },
  lastSyncType: {
    type: String,
    enum: ['quick', 'full', null],
    default: null
  },
  lastSyncedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

StreamCountSchema.index({ battleId: 1, userId: 1 }, { unique: true });
StreamCountSchema.index({ battleId: 1, teamId: 1 });

export default mongoose.models.StreamCount || mongoose.model('StreamCount', StreamCountSchema);
