const Announcement = require("../models/Announcement");
const User = require("../models/User");

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
// Helper function to send push notifications via Expo
const sendExpoNotification = async (messages) => {
    try {
        const resp = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messages),
        });

        const data = await resp.json();
        console.log("Expo push response:", data);
    } catch (err) {
        console.error("Error sending push notification:", err);
    }
};

// Create a new announcement AND send push notification
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, message } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: "Title and message are required" });
        }

        // Create announcement in DB
        const newAnnouncement = await Announcement.create({ title, message });

        // Fetch all users with a push token
        const users = await User.find({ expoPushToken: { $ne: null } }).lean();
        const tokens = users.map(u => u.expoPushToken).filter(Boolean);

        if (tokens.length) {
            // Prepare notification messages
            const messages = tokens.map(token => ({
                to: token,
                sound: "default",
                title: `New Announcement: ${title}`,
                body: message,
                data: { screen: "announcement", announcementId: newAnnouncement._id },
            }));

            // Send in batches of 100 (Expo recommended)
            const BATCH_SIZE = 100;
            for (let i = 0; i < messages.length; i += BATCH_SIZE) {
                const chunk = messages.slice(i, i + BATCH_SIZE);
                await sendExpoNotification(chunk);
            }
        }

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


// Delete an announcement
exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) return res.status(404).json({ error: "Not found" });
        res.status(200).json({ message: "Deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};
