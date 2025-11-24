
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PurchaseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  bundle: { type: String },
  amount: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Purchase', PurchaseSchema);
