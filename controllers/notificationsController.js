// controllers/notificationsController.js
const User = require("../models/User");

// Save expo push token for currently authenticated user
exports.savePushToken = async (req, res) => {
    try {
        const { expoPushToken } = req.body;
        if (!expoPushToken)
            return res.status(400).json({ error: "expoPushToken required" });

        await User.findByIdAndUpdate(req.user._id, { expoPushToken }, { new: true });
        return res.json({ success: true });
    } catch (err) {
        console.error("savePushToken error:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

// Admin sends a notification to all saved tokens (with batching)
exports.sendNotification = async (req, res) => {
    try {
        const { title, body, data } = req.body;
        if (!title || !body)
            return res.status(400).json({ error: "title & body required" });

        // fetch all users with a token
        const users = await User.find({ expoPushToken: { $ne: null } }).lean();
        const tokens = users.map((u) => u.expoPushToken).filter(Boolean);

        if (!tokens.length) return res.json({ success: true, sent: 0 });

        // Expo recommends batching: max ~100 per request
        const BATCH_SIZE = 100;
        const chunks = [];
        for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
            chunks.push(tokens.slice(i, i + BATCH_SIZE));
        }

        // send batches sequentially
        let sent = 0;
        for (const chunk of chunks) {
            const messages = chunk.map((token) => ({
                to: token,
                sound: "default",
                title,
                body,
                data: data || { screen: "announcement" }, // data for click handling
            }));

            const resp = await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messages),
            });

            if (!resp.ok) {
                const text = await resp.text();
                console.error("Expo push error:", text);
            }

            sent += chunk.length;
        }

        return res.json({ success: true, sent });
    } catch (err) {
        console.error("sendNotification error:", err);
        return res.status(500).json({ error: "Failed to send notifications" });
    }
};
