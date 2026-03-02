require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const serverRoutes = require("./routes/serverRoutes");
const messageRoutes = require("./routes/messageRoutes");

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"],
    },
});

// Voice Presence & Signaling
const voiceUsers = {}; // { roomId: [ { socketId, userId, username, avatar } ] }

io.on("connection", (socket) => {
    console.log("Joined:", socket.id);

    // --- TEXT CHAT EVENTS ---
    socket.on("join-channel", (channelId) => {
        socket.join(channelId);
        console.log(`Socket ${socket.id} joined channel ${channelId}`);
    });

    socket.on("send-message", (message) => {
        io.to(message.channelId).emit("new-message", message);
    });

    socket.on("delete-message", ({ messageId, channelId }) => {
        io.to(channelId).emit("message-deleted", messageId);
    });

    // --- VOICE CHAT EVENTS ---

    socket.on("join-voice", ({ roomId, user }) => {
        socket.join(roomId);

        if (!voiceUsers[roomId]) {
            voiceUsers[roomId] = [];
        }

        const userData = {
            socketId: socket.id,
            userId: user._id,
            username: user.username,
            avatar: user.avatar,
        };

        voiceUsers[roomId].push(userData);

        // Notify others in the room for WebRTC
        socket.to(roomId).emit("user-joined", userData);

        // Send current participants to the new user for WebRTC
        socket.emit("all-participants", voiceUsers[roomId].filter(u => u.socketId !== socket.id));

        // BROADCAST GLOBAL STATE for sidebar presence
        io.emit("voice-state-update", voiceUsers);
    });

    socket.on("signal", ({ to, from, signal }) => {
        io.to(to).emit("signal", { from, signal });
    });

    socket.on("update-state", ({ roomId, state }) => {
        if (voiceUsers[roomId]) {
            const user = voiceUsers[roomId].find(u => u.socketId === socket.id);
            if (user) {
                Object.assign(user, state);
                socket.to(roomId).emit("participant-state-changed", { socketId: socket.id, state });
                io.emit("voice-state-update", voiceUsers);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);

        for (const roomId in voiceUsers) {
            const index = voiceUsers[roomId].findIndex(u => u.socketId === socket.id);
            if (index !== -1) {
                const user = voiceUsers[roomId][index];
                voiceUsers[roomId].splice(index, 1);
                io.to(roomId).emit("user-left", { socketId: socket.id, userId: user.userId });

                // BROADCAST GLOBAL STATE update
                io.emit("voice-state-update", voiceUsers);
                break;
            }
        }
    });
});

// Middleware (Increased limits for base64 avatars and CORS preflight handle)
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/messages", messageRoutes);

// Root point
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Database Connection and Server Start
const PORT = process.env.PORT || 5000;

// Start Server Immediately (So frontend can connect even if DB is slow/fails)
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔗 API Endpoint: http://127.0.0.1:${PORT}/api/auth`);
});

// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ Successfully connected to MongoDB");
    })
    .catch((err) => {
        console.error("❌ Critical Error: Could not connect to MongoDB.");
        console.error("Error Message:", err.message);
        console.error("--- ACTION REQUIRED ---");
        console.error("Please ensure your IP is whitelisted in MongoDB Atlas:");
        console.error("https://www.mongodb.com/docs/atlas/security-whitelist/");
        console.error("------------------------");
    });
