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
  scrobbleTimestamps: [{
    type: Number
  }]
}, {
  timestamps: true
});

StreamCountSchema.index({ battleId: 1, userId: 1 }, { unique: true });

export default mongoose.models.StreamCount || mongoose.model('StreamCount', StreamCountSchema);
