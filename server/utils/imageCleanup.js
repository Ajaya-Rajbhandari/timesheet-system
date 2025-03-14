const fs = require("fs").promises;
const path = require("path");

class ImageCleanup {
  static async cleanupOldProfileImage(userId, oldImagePath) {
    try {
      if (!oldImagePath || oldImagePath.includes("default-profile.png")) {
        return;
      }

      const fullPath = path.join(__dirname, "../uploads/profile", oldImagePath);
      await fs.access(fullPath);
      await fs.unlink(fullPath);

      console.log(`Cleaned up old profile image: ${oldImagePath}`);
    } catch (error) {
      console.error("Error cleaning up old profile image:", error);
    }
  }
}

module.exports = ImageCleanup;
