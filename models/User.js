import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  lastfmUsername: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    default: null,
    trim: true
  },
  avatarUrl: {
    type: String,
    default: null
  },
  sessionToken: {
    type: String,
    default: null,
    index: true
  },
  sessionExpiresAt: {
    type: Date,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
