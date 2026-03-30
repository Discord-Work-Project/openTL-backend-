const Invite = require("../models/Invite");
const Server = require("../models/Server");
const { nanoid } = require("nanoid");

// Create Invite Link
const createInvite = async (req, res) => {
  try {
    const { serverId } = req.params;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }

    // Optional: only members can create invite
    if (!server.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const code = nanoid(6);

    const invite = await Invite.create({
      code,
      serverId,
      createdBy: req.user._id,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    res.json({
      code,
      link: `${frontendUrl}/invite/${code}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Invite Details
const getInvite = async (req, res) => {
  try {
    const invite = await Invite.findOne({ code: req.params.code });

    if (!invite) {
      return res.status(404).json({ message: "Invalid invite" });
    }

    res.json({ serverId: invite.serverId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Join via Invite
const joinByInvite = async (req, res) => {
  try {
    const invite = await Invite.findOne({ code: req.params.code });

    if (!invite) {
      return res.status(404).json({ message: "Invalid invite" });
    }

    const server = await Server.findById(invite.serverId);
    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }

    // FIX: ObjectId comparison
    const alreadyMember = server.members.some(
      m => m.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      return res.json({ message: "Already joined", server });
    }

    server.members.push(req.user._id);
    await server.save();

    res.json({ message: "Joined successfully", server });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createInvite,
  getInvite,
  joinByInvite,
};
