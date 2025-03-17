import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import "./ProfileImageUploader.css";

const ProfileImageUploader = ({ currentImage, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { token } = useAuth();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      setIsUploading(true);
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.post(
        "/api/profile/upload",
        formData,
        config,
      );
      onUploadSuccess(data.profileImage);
      toast.success("Profile image updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="profile-image-uploader">
      <label htmlFor="profile-image-input">
        <img
          src={currentImage}
          alt="Profile"
          className={`profile-image ${isUploading ? "uploading" : ""}`}
        />
        <div className="upload-overlay">
          <span>{isUploading ? "Uploading..." : "Change Photo"}</span>
        </div>
      </label>
      <input
        id="profile-image-input"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={isUploading}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default ProfileImageUploader;
