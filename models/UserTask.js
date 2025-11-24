
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserTaskSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
  completedAt: { type: Date, default: Date.now },
  rewardAmount: { type: Number, default: 0 },
  meta: { type: Schema.Types.Mixed }
});

module.exports = mongoose.model('UserTask', UserTaskSchema);
