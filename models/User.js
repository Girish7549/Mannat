
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, default: null },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String },
  referralCode: { type: String, unique: true, index: true },
  referredBy: { type: String, default: null },
  parentId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  type: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },

  totalEarning: { type: Number, default: 0 },
  referralWallet: { type: Number, default: 0 },
  taskWallet: { type: Number, default: 0 },

  totalReferrals: { type: Number, default: 0 },
  totalReferralsPaid: { type: Number, default: 0 },

  kycStatus: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
  kycFiles: {
    fullName: { type: String },
    aadharNumber: { type: String },
    panNumber: { type: String },
    bankAccount: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
    upi: { type: String }
  },
  isKycVerified: { type: Boolean, default: false },
  level: { type: Number, default: 0 },
  hasPaid: { type: Boolean, default: false },
  expoPushToken: { type: String, default: null },
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('User', UserSchema);
