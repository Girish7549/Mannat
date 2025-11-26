const express = require("express");
const router = express.Router();
const { getAnnouncements, createAnnouncement, deactivateAnnouncement } = require("../controllers/announcementController");
const auth = require("../middleware/auth");

router.get("/", auth, getAnnouncements);
router.post("/create", createAnnouncement);
router.put("/:id/deactivate", auth, deactivateAnnouncement);

module.exports = router;
