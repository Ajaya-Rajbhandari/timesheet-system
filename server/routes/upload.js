const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { auth } = require("../middleware/auth");
const upload = require("../utils/fileUpload");
const User = require("../models/User");

/**
 * @route   POST api/upload/profile
 * @desc    Upload profile image
 * @access  Private
 */
router.post(
  "/profile",
  auth,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get the filename
      const filename = req.file.filename;

      // Update user's profile image in database
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profileImage: filename },
        { new: true },
      ).select("-password");

      // If user had a previous profile image that wasn't the default, delete it
      if (
        req.body.previousImage &&
        req.body.previousImage !== "default-profile.png"
      ) {
        const previousImagePath = path.join(
          __dirname,
          "../uploads/profile",
          req.body.previousImage,
        );
        if (fs.existsSync(previousImagePath)) {
          fs.unlinkSync(previousImagePath);
        }
      }

      res.json({
        message: "Profile image uploaded successfully",
        user: user,
      });
    } catch (err) {
      console.error("Error uploading profile image:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/**
 * @route   GET api/upload/profile/:filename
 * @desc    Get profile image
 * @access  Public
 */
router.get("/profile/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "../uploads/profile",
    req.params.filename,
  );

  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Send default image if requested image doesn't exist
    const defaultPath = path.join(
      __dirname,
      "../uploads/profile/default-profile.png",
    );
    if (fs.existsSync(defaultPath)) {
      res.sendFile(defaultPath);
    } else {
      res.status(404).json({ message: "Image not found" });
    }
  }
});

module.exports = router;
