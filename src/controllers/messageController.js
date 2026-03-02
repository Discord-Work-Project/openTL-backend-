const Message = require("../models/Message");

// @desc    Get messages for a channel
// @route   GET /api/messages/:channelId
// @access  Private
const getMessages = async (req, res) => {
    try {
        const { channelId } = req.params;
        const messages = await Message.find({ channelId })
            .populate("author", "username displayName avatar email")
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new message
// @route   POST /api/messages
// @access  Private
const createMessage = async (req, res) => {
    try {
        const { content, serverId, channelId } = req.body;

        if (!content || !serverId || !channelId) {
            return res.status(400).json({ message: "Content, serverId, and channelId are required" });
        }

        const message = await Message.create({
            content,
            author: req.user._id,
            serverId,
            channelId,
        });

        const populatedMessage = await message.populate("author", "username displayName avatar email");

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private (author only)
const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Only the author can delete their own message
        if (message.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorised to delete this message" });
        }

        await message.deleteOne();
        res.status(200).json({ deletedId: req.params.messageId, channelId: message.channelId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMessages,
    createMessage,
    deleteMessage,
};
