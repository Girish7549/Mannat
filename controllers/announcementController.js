const Announcement = require("../models/Announcement");

// Get all active announcements
exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find({ isActive: true }).sort({
            createdAt: -1,
        });
        res.status(200).json({ announcements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// Create a new announcement
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, message } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: "Title and message are required" });
        }

        const newAnnouncement = await Announcement.create({ title, message });
        res.status(201).json({ announcement: newAnnouncement });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// Deactivate an announcement
exports.deactivateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!announcement) {
            return res.status(404).json({ error: "Announcement not found" });
        }

        res.status(200).json({ message: "Announcement deactivated", announcement });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};
