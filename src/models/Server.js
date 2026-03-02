const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ["text", "voice"],
        default: "text",
    }
});

const serverSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide a server name"],
            trim: true,
        },
        icon: {
            type: String,
            required: true,
        },
        color: {
            type: String,
            default: "bg-red-600",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        channels: [channelSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Server", serverSchema);
