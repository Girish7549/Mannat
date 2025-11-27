// routes/notificationsRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // protect routes
const notifications = require("../controllers/notificationsController");

// Save token from user (public authenticated)
router.post("/save-token", auth, notifications.savePushToken);

// Admin send notification (admin-only middleware recommended)
router.post("/send", auth, notifications.sendNotification);

module.exports = router;
