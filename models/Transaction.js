
const mongoose = require('mongoose');
const PaymentProof = require('./PaymentProof');
const { Schema } = mongoose;

const TransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number },
  type: {
    type: String,
    enum: ["task", "referral", "purchase", "withdrawal", "deposit"],
    required: true
  },
  description: { type: String, default: "" },
  paymentProof: { type: Schema.Types.ObjectId, ref: 'PaymentProof' },

  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "completed"
  },
  source: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
