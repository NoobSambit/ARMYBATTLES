import mongoose from 'mongoose';

/**
 * SyncLog model - Tracks when sync/verification workflows complete
 */
const SyncLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['github_action', 'manual_sync', 'quick_sync', 'full_sync'],
    required: true
  },
  completedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  battleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Battle',
    // null for global syncs (github action that syncs all battles)
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    required: true
  },
  details: {
    battlesProcessed: Number,
    scrobblesVerified: Number,
    errors: [String]
  }
}, {
  timestamps: true
});

// Index for quick lookup of latest sync
SyncLogSchema.index({ completedAt: -1 });
SyncLogSchema.index({ battleId: 1, completedAt: -1 });

export default mongoose.models.SyncLog || mongoose.model('SyncLog', SyncLogSchema);
