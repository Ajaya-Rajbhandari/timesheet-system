import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Badge as BadgeIcon,
  CalendarMonth as CalendarMonthIcon,
  ContactEmergency as ContactEmergencyIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import {
  updateUser,
  fetchUserById,
  updatePassword,
} from "../services/userService";
import moment from "moment";
import ImageUpload from "../components/ImageUpload";
import axios from "axios";

const Profile = () => {
  const { user, checkAuthStatus } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    "Profile updated successfully!",
  );
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [profileImage, setProfileImage] = useState(user.profileImage);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState(null);

  // Emergency contact state
  const [emergencyContact, setEmergencyContact] = useState({
    name: "",
    relationship: "",
    phoneNumber: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user || !user._id) {
          console.log("No user ID found in auth context");
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Use _id for consistency with MongoDB
        const userData = await fetchUserById(user._id);
        if (!userData) {
          throw new Error("Failed to fetch user data");
        }

        setProfileData(userData);

        // Initialize emergency contact if it exists
        if (userData.emergencyContact) {
          setEmergencyContact(userData.emergencyContact);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Error fetching user profile. Please try again.");
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setEmergencyContact((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare data for update
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber,
        emergencyContact: emergencyContact,
        profileImage: profileImage,
      };

      // Update user profile using _id
      await updateUser(user._id, updateData);

      // Refresh auth context to get updated user data
      await checkAuthStatus();

      setSuccessMessage("Profile updated successfully!");
      setSuccess(true);
      setEditMode(false);
      setLoading(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Error updating user profile. Please try again.");
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    // Reset errors
    setPasswordError(null);

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      // Call the API to update the password
      await updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );

      // Reset form and show success message
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccessMessage("Password updated successfully!");
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error("Error updating password:", err);
      setPasswordError("Error updating password. Please try again.");
      setLoading(false);
    }
  };

  const handleImageUpload = async (formData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
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
      setProfileImage(data.profileImage);
      setSuccessMessage("Profile image updated successfully!");
      setSuccess(true);
    } catch (error) {
      console.error("Image upload failed:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  if (loading && !profileData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !profileData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Summary Card - fixed to desktop layout */}
        <Grid item xs={4}>
          <Card sx={{ height: "100%", boxShadow: 3 }}>
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                p: 3,
              }}
            >
              <Box sx={{ mb: 2 }}>
                <img
                  src={profileImage}
                  alt="Profile Image"
                  style={{ width: 120, height: 120, borderRadius: "50%" }}
                />
              </Box>

              <Typography variant="h5" gutterBottom>
                {profileData?.firstName} {profileData?.lastName}
              </Typography>

              <Typography variant="body1" color="text.secondary" gutterBottom>
                {profileData?.position}
              </Typography>

              <Chip
                label={profileData?.role.toUpperCase()}
                color={
                  profileData?.role === "admin"
                    ? "error"
                    : profileData?.role === "manager"
                      ? "warning"
                      : "primary"
                }
                sx={{ mt: 1, mb: 2 }}
              />

              <Divider sx={{ width: "100%", my: 2 }} />

              <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <BadgeIcon sx={{ mr: 2, color: "text.secondary" }} />
                  <Typography variant="body2">
                    Employee ID: <strong>{profileData?.employeeId}</strong>
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CalendarMonthIcon sx={{ mr: 2, color: "text.secondary" }} />
                  <Typography variant="body2">
                    Joined:{" "}
                    <strong>
                      {moment(profileData?.hireDate).format("MMM DD, YYYY")}
                    </strong>
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <EmailIcon sx={{ mr: 2, color: "text.secondary" }} />
                  <Typography variant="body2" noWrap>
                    {profileData?.email}
                  </Typography>
                </Box>

                {profileData?.phoneNumber && (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PhoneIcon sx={{ mr: 2, color: "text.secondary" }} />
                    <Typography variant="body2">
                      {profileData.phoneNumber}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details Tabs - fixed to desktop layout */}
        <Grid item xs={8}>
          <Paper sx={{ boxShadow: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Personal Information" />
              <Tab label="Emergency Contact" />
              <Tab label="Security" />
              <Tab label="Profile Picture" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Personal Information Tab */}
              {tabValue === 0 && (
                <Box>
                  {/* ... existing content ... */}
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={profileData?.firstName || ""}
                        onChange={handleChange}
                        disabled={!editMode}
                        margin="normal"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={profileData?.lastName || ""}
                        onChange={handleChange}
                        disabled={!editMode}
                        margin="normal"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    {/* ... other form fields with xs={6} instead of xs={12} sm={6} ... */}
                  </Grid>
                  {/* ... existing buttons ... */}
                </Box>
              )}

              {/* Emergency Contact Tab */}
              {tabValue === 1 && (
                <Box>
                  {/* ... existing content ... */}
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Contact Name"
                        name="name"
                        value={emergencyContact?.name || ""}
                        onChange={handleEmergencyContactChange}
                        disabled={!editMode}
                        margin="normal"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ContactEmergencyIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Relationship"
                        name="relationship"
                        value={emergencyContact?.relationship || ""}
                        onChange={handleEmergencyContactChange}
                        disabled={!editMode}
                        margin="normal"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    {/* ... other form fields ... */}
                  </Grid>
                  {/* ... existing buttons ... */}
                </Box>
              )}

              {/* Profile Picture Tab */}
              {tabValue === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Profile Picture
                  </Typography>

                  <Grid container spacing={3} alignItems="center">
                    <Grid
                      item
                      xs={6}
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {/* ... existing content ... */}
                    </Grid>

                    <Grid item xs={6}>
                      {/* ... existing content ... */}
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* ... other tabs ... */}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
