import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";

const Users = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee",
    department: "",
    position: "",
    createdBy: "",
  });
  const [departments, setDepartments] = useState([]);

  // Use the isAdmin and isManager flags from AuthContext for consistency
  const hasManagementAccess = isAdmin || isManager;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Error loading users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await fetch("/api/departments");
      if (!response.ok) throw new Error("Failed to fetch departments");
      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      console.error("Error loading departments:", err);
      setError("Failed to load departments. Please try again.");
    }
  }, []);

  useEffect(() => {
    // Only admin and managers can view users list (as per memory faa3516c)
    if (hasManagementAccess) {
      loadUsers();
      loadDepartments();
    }
  }, [loadUsers, loadDepartments, hasManagementAccess]);

  const resetForm = () => {
    setCurrentUser({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "employee",
      department: "",
      position: "",
      createdBy: "",
    });
    setError(null);
  };

  const handleDialogOpen = (userData = null) => {
    if (userData) {
      // When editing, preserve the MongoDB _id
      setCurrentUser({
        ...userData,
        password: "", // Clear password field for security
      });
      setEditMode(true);
    } else {
      resetForm();
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleUserChange = (e) => {
    setCurrentUser({ ...currentUser, [e.target.name]: e.target.value });
  };

  const handleSubmitUser = async () => {
    try {
      if (!hasManagementAccess) {
        setError("Only administrators and managers can manage users");
        return;
      }

      // Validate required fields
      const requiredFields = ["firstName", "lastName", "email", "position"];
      if (!editMode) {
        requiredFields.push("password");
      }

      const missingFields = requiredFields.filter(
        (field) => !currentUser[field],
      );
      if (missingFields.length > 0) {
        setError(
          `Please fill in all required fields: ${missingFields.join(", ")}`,
        );
        return;
      }

      // Validate password length for new users
      if (!editMode && currentUser.password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }

      setLoading(true);
      setError(null);

      if (editMode) {
        const { password, createdBy, ...updateData } = currentUser;
        await updateUser(currentUser._id, updateData);
      } else {
        // As per memory faa3516c, only admins/managers can create users
        await createUser(currentUser);
      }

      handleDialogClose();
      await loadUsers();
    } catch (err) {
      console.error("Error submitting user:", err);
      setError(
        err.response?.data?.message || "Error managing user. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!isAdmin) {
      setError("Only administrators can delete users");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteUser(userId);
      await loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Error deleting user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "error";
      case "manager":
        return "warning";
      default:
        return "info";
    }
  };

  if (!hasManagementAccess) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. Only administrators and managers can access user
          management.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Users Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen()}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && !users.length ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.position}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit User">
                      <IconButton
                        size="small"
                        onClick={() => handleDialogOpen(user)}
                        disabled={!hasManagementAccess}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {isAdmin && (
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={user._id === currentUser._id}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editMode ? "Edit User" : "Add New User"}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={currentUser.firstName}
                  onChange={handleUserChange}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={currentUser.lastName}
                  onChange={handleUserChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={currentUser.email}
                  onChange={handleUserChange}
                  required
                />
              </Grid>
              {!editMode && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={currentUser.password}
                    onChange={handleUserChange}
                    required
                    helperText="Password must be at least 6 characters long"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={currentUser.role}
                    onChange={handleUserChange}
                    label="Role"
                  >
                    <MenuItem value="employee">Employee</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                    {isAdmin && <MenuItem value="admin">Admin</MenuItem>}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Position"
                  name="position"
                  value={currentUser.position}
                  onChange={handleUserChange}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleSubmitUser}
            variant="contained"
            disabled={loading}
          >
            {loading ? "Saving..." : editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users;
