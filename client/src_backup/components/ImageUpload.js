import React, { useState } from 'react';
import { Button, Box, Typography, CircularProgress, Avatar } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ImageUpload = ({ defaultImage }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(defaultImage || '');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setSuccess(false);
  };

  const handleUpload = () => {
    setError('Image upload functionality is currently disabled.');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
      <Avatar
        src={previewUrl}
        sx={{ width: 120, height: 120, mb: 2 }}
      />

      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        id="image-upload"
        onChange={handleFileChange}
      />
      <label htmlFor="image-upload">
        <Button
          variant="contained"
          component="span"
          startIcon={<CloudUploadIcon />}
          disabled={uploading}
        >
          Choose Image
        </Button>
      </label>

      {selectedFile && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Selected: {selectedFile.name}
        </Typography>
      )}

      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={uploading}
      >
        Disable Upload
        {uploading ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Uploading...
          </>
        ) : (
          'Upload'
        )}
      </Button>
    </Box>
  );
};

export default ImageUpload;
