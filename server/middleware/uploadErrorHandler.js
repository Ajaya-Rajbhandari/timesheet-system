const uploadErrorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          message: "File is too large. Maximum size is 5MB",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          message: "Invalid upload request",
        });
      default:
        return res.status(400).json({
          message: "Error uploading file",
        });
    }
  }

  if (error.message.includes("Only .jpeg")) {
    return res.status(400).json({
      message: "Only JPEG, JPG and PNG files are allowed",
    });
  }

  next(error);
};

module.exports = uploadErrorHandler;
