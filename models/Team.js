import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    battleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Battle',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      length: 8,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: unique team name per battle
teamSchema.index({ battleId: 1, name: 1 }, { unique: true });

// Index for finding user's team in a battle
teamSchema.index({ battleId: 1, members: 1 });

const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);

export default Team;
