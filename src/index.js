require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");

const app = express();

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

// Root point
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Database Connection and Server Start
const PORT = process.env.PORT || 5000;

// Start Server Immediately (So frontend can connect even if DB is slow/fails)
app.listen(PORT, () => {
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
