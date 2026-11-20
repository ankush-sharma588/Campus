const mongoose = require('mongoose');

const OtpChallengeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  purpose: {
    type: String,
    enum: ['signup', 'login', 'password_reset'],
    required: true,
  },
  otpHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

OtpChallengeSchema.index({ email: 1, purpose: 1 }, { unique: true });
OtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpChallenge', OtpChallengeSchema);
