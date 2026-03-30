const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Server",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Invite", inviteSchema);
