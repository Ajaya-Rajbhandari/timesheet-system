import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  Stack,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Paper,
  Grid,
  Snackbar,
  Alert,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { useAuth } from "../contexts/AuthContext";
import {
  createSchedule,
  updateSchedule,
  fetchUserSchedules,
  fetchDepartmentSchedules,
  fetchAllSchedules,
  deleteSchedule,
  getMySchedules,
} from "../services/scheduleService";
import { fetchUsers } from "../services/userService";
import {
  validateSchedule,
  suggestAlternativeSchedules,
} from "../utils/scheduleValidation";

const Schedule = () => {
  const theme = useTheme();
  const { user, isAdmin, isManager } = useAuth();
  const hasEditPermission = isAdmin || isManager;

  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [formData, setFormData] = useState({
    startDate: moment(),
    endDate: moment(),
    startTime: moment().startOf("day").add(9, "hours"),
    endTime: moment().startOf("day").add(17, "hours"),
    type: "regular",
    days: [],
    notes: "",
  });

  const showNotification = (message, severity = "info") => {
    setNotification({ open: true, message, severity });
  };

  const fetchScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      let fetchedSchedules;

      if (isAdmin || isManager) {
        fetchedSchedules = await fetchAllSchedules();
      } else {
        // Check if user exists and has an ID before making the API call
        if (!user || !user._id) {
          console.error("User information is not available");
          showNotification(
            "User information is not available. Please log in again.",
            "error",
          );
          setLoading(false);
          return;
        }
        fetchedSchedules = await getMySchedules();
      }

      setSchedules(fetchedSchedules);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      showNotification(err.message || "Failed to fetch schedules", "error");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isManager, user]);

  // Load users for manager/admin selection
  useEffect(() => {
    const loadUsers = async () => {
      if (hasEditPermission) {
        try {
          const fetchedUsers = await fetchUsers();
          console.log("Fetched users for schedule assignment:", fetchedUsers);
          setUsers(fetchedUsers);
        } catch (err) {
          console.error("Error loading users:", err);
          showNotification("Failed to load users. Please try again.", "error");
        }
      }
    };
    loadUsers();
  }, [hasEditPermission]);

  useEffect(() => {
    if (selectedUserId && users.length > 0) {
      const selectedUser = users.find((u) => u._id === selectedUserId);
      if (selectedUser) {
        setSelectedUserName(
          `${selectedUser.firstName} ${selectedUser.lastName}`,
        );
      }
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    // Only fetch schedule data if user is authenticated
    if (user) {
      fetchScheduleData();
    }
  }, [fetchScheduleData, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);

    if (!hasEditPermission) {
      showNotification(
        "Only managers and administrators can create or edit schedules",
        "error",
      );
      setOpenDialog(false);
      return;
    }

    // Validate user selection for managers/admins
    if (hasEditPermission && !selectedUserId) {
      showNotification("Please select an employee for the schedule", "error");
      return;
    }

    // Validate days selection
    if (!formData.days || formData.days.length === 0) {
      showNotification("Please select at least one working day", "error");
      return;
    }

    try {
      setLoading(true);
      const formattedData = {
        userId: selectedUserId || user._id,
        startDate: formData.startDate.format("YYYY-MM-DD"),
        endDate: formData.endDate.format("YYYY-MM-DD"),
        startTime: formData.startTime.format("HH:mm"), // Ensure 24-hour format with leading zeros
        endTime: formData.endTime.format("HH:mm"), // Ensure 24-hour format with leading zeros
        type: formData.type,
        days: formData.days.map((day) => day.toLowerCase()), // Ensure lowercase
        notes: formData.notes || "",
      };

      console.log("Creating schedule with data:", formattedData);

      if (selectedSchedule) {
        await updateSchedule(selectedSchedule._id, formattedData);
        showNotification("Schedule updated successfully", "success");
      } else {
        await createSchedule(formattedData);
        showNotification("Schedule created successfully", "success");
      }

      await fetchScheduleData();
      setOpenDialog(false);
      setSelectedSchedule(null);
      resetForm();
    } catch (err) {
      console.error("Failed to save schedule:", err);
      showNotification(err.message || "Failed to save schedule", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!hasEditPermission) {
      showNotification(
        "Only managers and administrators can delete schedules",
        "error",
      );
      return;
    }

    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteSchedule(id);
        await fetchScheduleData();
        showNotification("Schedule deleted successfully", "success");
      } catch (err) {
        showNotification("Failed to delete schedule", "error");
        console.error("Error deleting schedule:", err);
      }
    }
  };

  const handleEdit = (schedule) => {
    if (!hasEditPermission) {
      showNotification(
        "Only managers and administrators can edit schedules",
        "error",
      );
      return;
    }
    setSelectedSchedule(schedule);
    setFormData({
      startDate: moment(schedule.startDate),
      endDate: moment(schedule.endDate),
      startTime: moment(schedule.startTime, "HH:mm"),
      endTime: moment(schedule.endTime, "HH:mm"),
      type: schedule.type,
      notes: schedule.notes || "",
      days: schedule.days,
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      startDate: moment(),
      endDate: moment(),
      startTime: moment().startOf("day").add(9, "hours"),
      endTime: moment().startOf("day").add(17, "hours"),
      type: "regular",
      notes: "",
      days: [],
    });
    setSelectedSchedule(null);
  };

  const renderScheduleCard = (schedule) => (
    <Card
      key={schedule._id}
      sx={{
        mb: 2,
        backgroundColor: theme.palette.background.paper,
        "&:hover": {
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Box>
            <Typography variant="h6" component="div" gutterBottom>
              {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)}{" "}
              Schedule
            </Typography>
            {hasEditPermission && schedule.user && (
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Assigned to: {schedule.user.firstName} {schedule.user.lastName}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {moment(schedule.startDate).format("MMM DD, YYYY")} -{" "}
              {moment(schedule.endDate).format("MMM DD, YYYY")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {schedule.startTime} - {schedule.endTime}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {schedule.days.map((day) => (
                <Chip
                  key={day}
                  label={day.charAt(0).toUpperCase() + day.slice(1)}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>
            {schedule.notes && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Notes: {schedule.notes}
              </Typography>
            )}
          </Box>
          {hasEditPermission && (
            <Box>
              <Tooltip title="Edit Schedule">
                <IconButton
                  size="small"
                  onClick={() => handleEdit(schedule)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Schedule">
                <IconButton
                  size="small"
                  onClick={() => handleDelete(schedule._id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderDialogContent = () => (
    <DialogContent>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {hasEditPermission && (
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Select Employee"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                error={!selectedUserId && hasEditPermission}
                helperText={
                  !selectedUserId && hasEditPermission
                    ? "Please select an employee"
                    : ""
                }
              >
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} ({user.employeeId})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(newValue) =>
                  setFormData((prev) => ({ ...prev, startDate: newValue }))
                }
                renderInput={(params) => (
                  <TextField {...params} fullWidth required />
                )}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(newValue) =>
                  setFormData((prev) => ({ ...prev, endDate: newValue }))
                }
                renderInput={(params) => (
                  <TextField {...params} fullWidth required />
                )}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <TimePicker
                label="Start Time"
                value={formData.startTime}
                onChange={(newValue) =>
                  setFormData((prev) => ({ ...prev, startTime: newValue }))
                }
                renderInput={(params) => (
                  <TextField {...params} fullWidth required />
                )}
                ampm={false} // Use 24-hour format
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <TimePicker
                label="End Time"
                value={formData.endTime}
                onChange={(newValue) =>
                  setFormData((prev) => ({ ...prev, endTime: newValue }))
                }
                renderInput={(params) => (
                  <TextField {...params} fullWidth required />
                )}
                ampm={false} // Use 24-hour format
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Schedule Type"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              required
            >
              <MenuItem value="regular">Regular</MenuItem>
              <MenuItem value="overtime">Overtime</MenuItem>
              <MenuItem value="flexible">Flexible</MenuItem>
              <MenuItem value="remote">Remote</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <FormControl
              fullWidth
              required
              error={!formData.days || formData.days.length === 0}
            >
              <InputLabel>Working Days</InputLabel>
              <Select
                multiple
                value={formData.days}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, days: e.target.value }))
                }
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((day) => (
                      <Chip
                        key={day}
                        label={day.charAt(0).toUpperCase() + day.slice(1)}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {[
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ].map((day) => (
                  <MenuItem key={day} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </MenuItem>
                ))}
              </Select>
              {(!formData.days || formData.days.length === 0) && (
                <FormHelperText>
                  Please select at least one working day
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </Box>
    </DialogContent>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            bgcolor: theme.palette.background.default,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h5" component="h1">
              Schedules
            </Typography>
            {hasEditPermission && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetForm();
                  setOpenDialog(true);
                }}
              >
                Add Schedule
              </Button>
            )}
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Schedule Grid */}
          <Grid container spacing={3}>
            {loading ? (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <Typography>Loading schedules...</Typography>
                </Box>
              </Grid>
            ) : schedules.length > 0 ? (
              schedules.map((schedule) => renderScheduleCard(schedule))
            ) : (
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    p: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                    borderRadius: 1,
                  }}
                >
                  <CalendarIcon
                    sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Schedules Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No schedules found for the selected criteria.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>

      {/* Add/Edit Schedule Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedSchedule ? "Edit Schedule" : "Add New Schedule"}
        </DialogTitle>
        {renderDialogContent()}
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {selectedSchedule ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Schedule;
