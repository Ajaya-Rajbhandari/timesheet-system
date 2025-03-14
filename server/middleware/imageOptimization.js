const sharp = require("sharp");
const path = require("path");

const optimizeImage = async (req, file, next) => {
  try {
    if (!file) return next();

    const optimizedImage = await sharp(file.path)
      .resize(800, 800, {
        // Max dimensions
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 }) // Compress and convert to JPEG
      .toBuffer();

    // Save optimized image
    await sharp(optimizedImage).toFile(file.path);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = optimizeImage;
