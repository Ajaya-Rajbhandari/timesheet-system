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
import ImageUpload from '../components/ImageUpload';
import axios from 'axios';

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
  // Add a new tab for Profile Picture
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
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.post('/api/profile/upload', formData, config);
      setProfileImage(data.profileImage);
      setSuccessMessage('Profile image updated successfully!');
      setSuccess(true);
    } catch (error) {
      console.error('Image upload failed:', error);
      setError('Failed to upload image. Please try again.');
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
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Summary Card */}
        <Grid item xs={12} md={4}>
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

        {/* Profile Details Tabs */}
        <Grid item xs={12} md={8}>
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
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Personal Information</Typography>
                    <Button
                      startIcon={editMode ? <CancelIcon /> : <EditIcon />}
                      color={editMode ? "error" : "primary"}
                      onClick={() => setEditMode(!editMode)}
                    >
                      {editMode ? "Cancel" : "Edit"}
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
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

                    <Grid item xs={12} sm={6}>
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

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={profileData?.email || ""}
                        onChange={handleChange}
                        disabled={!editMode}
                        margin="normal"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phoneNumber"
                        value={profileData?.phoneNumber || ""}
                        onChange={handleChange}
                        disabled={!editMode}
                        margin="normal"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Position"
                        value={profileData?.position || ""}
                        disabled
                        margin="normal"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <WorkIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Department"
                        value={profileData?.department?.name || "Loading..."}
                        disabled
                        margin="normal"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <WorkIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  {editMode && (
                    <Box
                      sx={{
                        mt: 3,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Emergency Contact Tab */}
              {tabValue === 1 && (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Emergency Contact</Typography>
                    <Button
                      startIcon={editMode ? <CancelIcon /> : <EditIcon />}
                      color={editMode ? "error" : "primary"}
                      onClick={() => setEditMode(!editMode)}
                    >
                      {editMode ? "Cancel" : "Edit"}
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
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

                    <Grid item xs={12} sm={6}>
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

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phoneNumber"
                        value={emergencyContact?.phoneNumber || ""}
                        onChange={handleEmergencyContactChange}
                        disabled={!editMode}
                        margin="normal"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  {editMode && (
                    <Box
                      sx={{
                        mt: 3,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Security Tab */}
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>

                  {passwordError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {passwordError}
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        name="currentPassword"
                        type={showPassword.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        margin="normal"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() =>
                                  togglePasswordVisibility("current")
                                }
                                edge="end"
                              >
                                {showPassword.current ? (
                                  <VisibilityOffIcon />
                                ) : (
                                  <VisibilityIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type={showPassword.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        margin="normal"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility("new")}
                                edge="end"
                              >
                                {showPassword.new ? (
                                  <VisibilityOffIcon />
                                ) : (
                                  <VisibilityIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirmPassword"
                        type={showPassword.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        margin="normal"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() =>
                                  togglePasswordVisibility("confirm")
                                }
                                edge="end"
                              >
                                {showPassword.confirm ? (
                                  <VisibilityOffIcon />
                                ) : (
                                  <VisibilityIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handlePasswordUpdate}
                      disabled={
                        loading ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword ||
                        !passwordData.confirmPassword
                      }
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                  </Box>
                </Box>
              )}
              
              {/* Profile Picture Tab - New Tab */}
              {tabValue === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Profile Picture
                  </Typography>
                  
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          mb: 2, 
                          p: 1, 
                          border: '1px solid #e0e0e0', 
                          borderRadius: '50%',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        <img
                          src={profileImage || '/uploads/profile-images/default-profile.png'}
                          alt="Profile"
                          style={{ 
                            width: 220, 
                            height: 220, 
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" align="center">
                        Current Profile Picture
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Upload New Picture
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Select a new profile picture to upload. For best results:
                        </Typography>
                        <Box sx={{ pl: 2, mb: 3 }}>
                          <Typography variant="body2" color="text.secondary" component="li">
                            Use a square image (1:1 ratio)
                          </Typography>
                          <Typography variant="body2" color="text.secondary" component="li">
                            Minimum size: 200×200 pixels
                          </Typography>
                          <Typography variant="body2" color="text.secondary" component="li">
                            Maximum file size: 2MB
                          </Typography>
                          <Typography variant="body2" color="text.secondary" component="li">
                            Supported formats: JPEG, PNG, GIF
                          </Typography>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="profile-image-upload"
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('profileImage', file);
                                handleImageUpload(formData);
                              }
                            }}
                          />
                          <label htmlFor="profile-image-upload">
                            <Button
                              variant="contained"
                              component="span"
                              fullWidth
                              disabled={loading}
                              sx={{ py: 1.5 }}
                            >
                              {loading ? <CircularProgress size={24} /> : 'Choose File & Upload'}
                            </Button>
                          </label>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
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
