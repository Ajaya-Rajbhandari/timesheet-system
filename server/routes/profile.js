const express = require("express");
const multer = require("multer");
const path = require("path");
const { auth } = require("../middleware/auth");
const User = require("../models/User");
const fs = require("fs");

const router = express.Router();

// Fix 1: Use absolute path for upload directory
const uploadDir = path.join(
  __dirname,
  "..",
  "public",
  "uploads",
  "profile-images",
);

// Ensure uploads directory exists with proper permissions
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
    mode: 0o755, // Explicit directory permissions
  });
}

// Fix 2: Improved file type validation
const checkFileType = (file, cb) => {
  const filetypes = /jpe?g|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Only images (JPEG, PNG, GIF) are allowed"));
};

// Fix 3: Simplified storage configuration
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user._id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 2 }, // 2MB
  fileFilter: (req, file, cb) => checkFileType(file, cb),
});

// Add this new middleware to serve static files
router.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "public", "uploads")),
);

router.post(
  "/upload",
  auth,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      // Update this path to use absolute URL
      const profileImage = `http://localhost:5000/uploads/profile-images/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profileImage },
        { new: true, runValidators: true },
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        profileImage: profileImage,
        user: user,
      });
    } catch (err) {
      console.error("Profile upload error:", err);
      const statusCode = err.name === "ValidationError" ? 400 : 500;
      res.status(statusCode).json({
        message: err.message || "Image upload failed",
      });
    }
  },
);

module.exports = router;
