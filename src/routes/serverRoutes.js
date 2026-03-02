const express = require("express");
const router = express.Router();
const {
    getServers,
    createServer,
    getServerDetails,
    createChannel,
    joinServer,
    updateServer,
    deleteChannel,
} = require("../controllers/serverController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getServers).post(protect, createServer);
router.route("/:serverId").get(protect, getServerDetails).put(protect, updateServer);
router.route("/:serverId/channels").post(protect, createChannel);
router.route("/:serverId/channels/:channelId").delete(protect, deleteChannel);
router.route("/:serverId/join").post(protect, joinServer);

module.exports = router;
