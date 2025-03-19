const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const validateEnv = require("./utils/validateEnv");
// Remove this duplicate line ▼
// const userRoutes = require('./routes/userRoutes');

// Correct imports ▼
const attendanceRoutes = require("./routes/attendance");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const userRoutes = require("./routes/users"); // Single declaration
// Add with other route imports
const scheduleRoutes = require("./routes/schedules");
const timeOffRoutes = require("./routes/timeOff");

// 1. Initialize Express app first
const app = express();

// Add at the top with other imports
const cors = require("cors");

// Modify CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Add OPTIONS explicitly
    allowedHeaders: ["Content-Type", "Authorization", "Origin"], // Add Origin header
    optionsSuccessStatus: 204, // Force 204 status for OPTIONS
  }),
);

// Add these middlewares before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});

// Then mount your routes - remove duplicates and fix order
// Mount API routes first
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/timeoff", timeOffRoutes); // Add this line
app.use("/api/schedules", scheduleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/timeoff", timeOffRoutes);

// API 404 handler must come immediately after API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Then handle static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Production client handling (must come last)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, process.env.CLIENT_BUILD_PATH)));
  app.get("*", (req, res) => {
    res.sendFile(
      path.resolve(__dirname, process.env.CLIENT_BUILD_PATH, "index.html"),
    );
  });
}

// Import models
require("./models/User");
require("./models/Department");
require("./models/TimeOff");
require("./models/Attendance");
require("./models/Schedule");

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

// Import the configured app
// Remove this duplicate app creation

// Keep only this app initialization
// Remove duplicate app initialization since it's already declared above

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB (only if not in test environment)
    if (process.env.NODE_ENV !== "test") {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB successfully");

      const PORT = process.env.PORT || 5000;
      const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });

      // Handle server shutdown gracefully
      process.on("SIGTERM", async () => {
        console.log("SIGTERM signal received. Shutting down gracefully...");
        await server.close();
        console.log("Server closed");
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
      });

      process.on("SIGINT", async () => {
        console.log("SIGINT signal received. Shutting down gracefully...");
        await server.close();
        console.log("Server closed");
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
      });
    }
  } catch (error) {
    console.error(
      "Failed to start server due to database connection error:",
      error,
    );

    process.exit(1);
  }
};

// Start the server only if this file is being run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
