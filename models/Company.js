
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CompanySchema = new Schema({
  totalRevenue: { type: Number, default: 0 },
  totalPayouts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', CompanySchema);
