const express = require("express");
const multer = require("multer");
const path = require("path");
const { auth } = require("../middleware/auth");
const User = require("../models/User");
const fs = require("fs");

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = "public/uploads/profile-images";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 2 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Error: Images Only!"));
  }
}

// @route   POST /profile/upload
// @desc    Upload profile image
// @access  Private
router.post(
  "/upload",
  auth,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const profileImage = `/uploads/profile-images/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profileImage },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ profileImage });
    } catch (err) {
      console.error("Profile image upload error:", err.message);

      if (err.message === "Error: Images Only!") {
        return res.status(400).json({ message: err.message });
      }
      res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;
