import mongoose from 'mongoose';

const BattleActivityLogSchema = new mongoose.Schema({
  battleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Battle',
    required: true,
    index: true
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorUsername: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: [
      'battle_created',
      'participant_joined',
      'participant_kicked',
      'team_created',
      'team_joined',
      'team_left',
      'scrobble_verified',
      'battle_extended',
      'battle_ended',
      'battle_started'
    ],
    required: true,
    index: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetUsername: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
BattleActivityLogSchema.index({ battleId: 1, timestamp: -1 });
BattleActivityLogSchema.index({ battleId: 1, action: 1 });

export default mongoose.models.BattleActivityLog || mongoose.model('BattleActivityLog', BattleActivityLogSchema);
