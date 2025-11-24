const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentProofSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    utr: { type: String, required: true },
    senderUpi: { type: String },
    senderName: { type: String },
    paymentNote: { type: String },
    screenshot: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    paymentAccount: { type: Schema.Types.ObjectId, ref: 'PaymentMethod', default: null },
    reviewedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PaymentProof', PaymentProofSchema);
