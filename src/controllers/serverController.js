const Server = require("../models/Server");

// @desc    Get all servers for current user
// @route   GET /api/servers
// @access  Private
const getServers = async (req, res) => {
    try {
        const servers = await Server.find({
            members: req.user._id,
        });

        res.status(200).json(servers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new server
// @route   POST /api/servers
// @access  Private
const createServer = async (req, res) => {
    try {
        const { name, icon, color } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Please provide a server name" });
        }

        const server = await Server.create({
            name,
            icon,
            color: color || "bg-red-600",
            owner: req.user._id,
            members: [req.user._id],
            channels: [
                { name: "general", type: "text" },
                { name: "General Voice", type: "voice" }
            ]
        });

        res.status(201).json(server);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get server details
// @route   GET /api/servers/:id
// @access  Private
const getServerDetails = async (req, res) => {
    try {
        const server = await Server.findById(req.params.id);

        if (!server) {
            return res.status(404).json({ message: "Server not found" });
        }

        // Check if user is a member
        if (!server.members.some(m => m.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: "Not authorized to view this server" });
        }

        res.status(200).json(server);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new channel in a server
// @route   POST /api/servers/:serverId/channels
// @access  Private
const createChannel = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { name, type } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Please provide a channel name" });
        }

        const server = await Server.findById(serverId);

        if (!server) {
            return res.status(404).json({ message: "Server not found" });
        }

        // Check if user is owner (or member with permissions)
        if (server.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the owner can create channels" });
        }

        const newChannel = {
            name,
            type: type || "text",
        };

        server.channels.push(newChannel);
        await server.save();

        const addedChannel = server.channels[server.channels.length - 1];
        res.status(201).json(addedChannel);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Join a server
// @route   POST /api/servers/:serverId/join
// @access  Private
const joinServer = async (req, res) => {
    try {
        const { serverId } = req.params;
        const server = await Server.findById(serverId);

        if (!server) {
            return res.status(404).json({ message: "Server not found" });
        }

        // Check if user is already a member
        if (server.members.some(m => m.toString() === req.user._id.toString())) {
            return res.status(200).json({ message: "Already a member", server });
        }

        server.members.push(req.user._id);
        await server.save();

        res.status(200).json({ message: "Successfully joined server", server });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update server (name, icon, color)
// @route   PUT /api/servers/:serverId
// @access  Private (owner only)
const updateServer = async (req, res) => {
    try {
        const server = await Server.findById(req.params.serverId);
        if (!server) return res.status(404).json({ message: "Server not found" });
        if (server.owner.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Only the owner can edit this server" });

        const { name, icon, color } = req.body;
        if (name) server.name = name;
        if (icon) server.icon = icon;
        if (color) server.color = color;

        await server.save();
        res.status(200).json(server);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a channel from a server
// @route   DELETE /api/servers/:serverId/channels/:channelId
// @access  Private (owner only)
const deleteChannel = async (req, res) => {
    try {
        const { serverId, channelId } = req.params;
        const server = await Server.findById(serverId);
        if (!server) return res.status(404).json({ message: "Server not found" });
        if (server.owner.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Only the owner can delete channels" });

        server.channels = server.channels.filter(c => c._id.toString() !== channelId);
        await server.save();
        res.status(200).json({ deletedId: channelId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getServers,
    createServer,
    getServerDetails,
    createChannel,
    joinServer,
    updateServer,
    deleteChannel,
};
