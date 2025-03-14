const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const multer = require("multer");
const User = require("../models/User");
const fs = require("fs");

const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/profile-images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, "test-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"), false);
    }
    cb(null, true);
  },
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Mock auth routes
app.post("/api/auth/register", async (req, res) => {
  try {
    // Check if user with email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const user = await User.create(req.body);
    const token = user.generateAuthToken();

    res.status(201).json({
      token,
      userId: user._id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = user.generateAuthToken();
    res.json({
      token,
      email: user.email,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/auth/user", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  // For testing purposes, we'll just check if the token exists
  res.json({
    user: {
      id: "test-user-id",
      email: "test@example.com",
      role: "employee",
    },
  });
});

// Mock profile upload route with multer middleware
app.post(
  "/api/users/profile/upload",
  upload.single("profileImage"),
  (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      message: "Profile image uploaded successfully",
      profileImage: `/uploads/profile-images/${req.file.filename}`,
    });
  }
);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.message === "Invalid file type") {
    return res.status(400).json({ error: err.message });
  }

  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
