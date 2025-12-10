const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskSchema = new Schema({
  title: String,
  description: String,

  rewardAmount: { type: Number, default: 0.5 },
  maxDailyPerUser: { type: Number, default: 5 },

  type: { type: String, default: "daily" },

  action: {
    type: String,
    enum: [
      "youtube_subscribe",
      "instagram_follow",
      "facebook_follow",
      "tiktok_follow",
      "whatsapp_join",
      "telegram_join",
      "website_visit",
      "custom",
      null
    ],
    default: null
  },

  targetUrl: { type: String },
  targetId: { type: String },
  active: { type: Boolean, default: true },

  // 🔥 New field: array of users who completed this task
  usersCompleted: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
