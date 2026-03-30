const express = require("express");
const router = express.Router();
const {
  createInvite,
  getInvite,
  joinByInvite,
} = require("../controllers/inviteController");

const { protect } = require("../middleware/authMiddleware");

// Create invite
router.post("/:serverId", protect, createInvite);

// Get invite info
router.get("/:code", protect, getInvite);

// Join server via invite
router.post("/join/:code", protect, joinByInvite);

module.exports = router;
