const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
    {
        title: { type: String, },
        message: { type: String, },
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
