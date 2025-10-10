import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdByIp: {
    type: String
  },
  revokedAt: {
    type: Date
  },
  revokedByIp: {
    type: String
  },
  replacedByToken: {
    type: String
  }
}, {
  timestamps: true
});

// TTL Index - remove exactly at expiresAt
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual: Check if token expired
refreshTokenSchema.virtual('isExpired').get(function() {
  return Date.now() >= this.expiresAt;
});

// Virtual: Check if token is active
refreshTokenSchema.virtual('isActive').get(function() {
  return !this.revokedAt && !this.isExpired;
});

// Method: Revoke token
refreshTokenSchema.methods.revoke = function(ipAddress, replacedByToken) {
  this.revokedAt = Date.now();
  this.revokedByIp = ipAddress;
  if (replacedByToken) {
    this.replacedByToken = replacedByToken;
  }
};

export default mongoose.model('RefreshToken', refreshTokenSchema);