import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import axios from "../../utils/axios";

const ImageUpload = ({ currentImage, onImageUpdate, size = 120 }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match("image.*")) {
      setError("Please select an image file (jpg, jpeg, or png)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size should not exceed 5MB");
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Open dialog to confirm upload
    setOpenDialog(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("profileImage", selectedFile);

    // If there's a current image, send it to be deleted if needed
    if (currentImage && currentImage !== "default-profile.png") {
      formData.append("previousImage", currentImage);
    }

    try {
      const response = await axios.post("/upload/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Call the callback with the updated user data
      onImageUpdate(response.data.user);

      // Reset state
      setSelectedFile(null);
      setPreview(null);
      setOpenDialog(false);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(err.response?.data?.message || "Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setOpenDialog(false);
    setError(null);
  };

  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    return `${
      process.env.REACT_APP_API_URL || ""
    }/api/upload/profile/${imageName}`;
  };

  return (
    <Box>
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={preview || (currentImage ? getImageUrl(currentImage) : null)}
          sx={{
            width: size,
            height: size,
            fontSize: size / 2.5,
            bgcolor: "primary.main",
            boxShadow: 2,
          }}
        />

        <IconButton
          sx={{
            position: "absolute",
            bottom: 0,
            right: 0,
            bgcolor: "background.paper",
            boxShadow: 1,
            "&:hover": { bgcolor: "background.default" },
          }}
          component="label"
        >
          <input
            type="file"
            hidden
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileSelect}
          />
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>

      {error && (
        <Typography
          color="error"
          variant="caption"
          sx={{ mt: 1, display: "block" }}
        >
          {error}
        </Typography>
      )}

      <Dialog open={openDialog} onClose={handleCancel}>
        <DialogTitle>Upload Profile Picture</DialogTitle>
        <DialogContent>
          {preview && (
            <Box sx={{ textAlign: "center", my: 2 }}>
              <Avatar
                src={preview}
                sx={{
                  width: 150,
                  height: 150,
                  mx: "auto",
                  boxShadow: 2,
                }}
              />
            </Box>
          )}
          <Typography variant="body2">
            Are you sure you want to upload this image as your profile picture?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            color="primary"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <CloudUploadIcon />
            }
          >
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageUpload;
