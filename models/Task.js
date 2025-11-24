// models/Task.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskSchema = new Schema({
  title: String,
  description: String,
  rewardAmount: { type: Number, default: 0.5 },
  maxDailyPerUser: { type: Number, default: 5 },
  type: { type: String, default: "daily" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
