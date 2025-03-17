import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Alert,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import axios from "../utils/axios";
import api from "../services/api";
import { requestShiftSwap } from "../services/shiftSwapService";

const ShiftSwap = ({ schedule, onClose, open, embedded = false }) => {
  const { user } = useAuth();
  const [targetUser, setTargetUser] = useState("");
  const [targetSchedule, setTargetSchedule] = useState("");
  const [reason, setReason] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        if (!user) {
          setError("User information is missing");
          return;
        }

        // Use the dedicated endpoint for shift swap candidates
        const response = await api.get("/shift-swaps/department-users");
        setAvailableUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to fetch available users");
      }
    };

    if (open && schedule) {
      fetchAvailableUsers();
    }
  }, [open, user, schedule]);

  useEffect(() => {
    const fetchTargetSchedules = async () => {
      setAvailableSchedules([]);

      try {
        // Get schedules for the target user using the dedicated endpoint
        const response = await api.get(
          `/shift-swaps/user-schedules/${targetUser}`,
        );
        setAvailableSchedules(response.data);
      } catch (err) {
        console.error("Error fetching schedules:", err);
        setError("Failed to fetch available schedules");
      }
    };

    if (targetUser) {
      fetchTargetSchedules();
    }
  }, [targetUser]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    if (!schedule) {
      setError("No schedule selected");
      setLoading(false);
      return;
    }

    try {
      await requestShiftSwap({
        targetUserId: targetUser,
        requestingScheduleId: schedule._id,
        targetScheduleId: targetSchedule,
        reason,
      });

      onClose();
      // You might want to trigger a refresh of the schedule list here
    } catch (err) {
      console.error("Error requesting shift swap:", err);
      setError(err.response?.data?.message || "Failed to request shift swap");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      {!embedded ? (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle>Request Shift Swap</DialogTitle>
          <DialogContent>{renderContent()}</DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={!targetUser || !targetSchedule || !reason || loading}
            >
              Request Swap
            </Button>
          </DialogActions>
        </Dialog>
      ) : (
        <>
          {renderContent()}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={!targetUser || !targetSchedule || !reason || loading}
            >
              Request Swap
            </Button>
          </Box>
        </>
      )}
    </>
  );

  function renderContent() {
    if (!schedule) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          No schedule selected. Please select a schedule to swap.
        </Alert>
      );
    }

    return (
      <>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Your Schedule:
          </Typography>
          <Typography>
            {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Colleague</InputLabel>
          <Select
            value={targetUser}
            onChange={(e) => setTargetUser(e.target.value)}
            label="Select Colleague"
          >
            {availableUsers.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {user.firstName} {user.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {targetUser && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Their Schedule</InputLabel>
            <Select
              value={targetSchedule}
              onChange={(e) => setTargetSchedule(e.target.value)}
              label="Select Their Schedule"
            >
              {availableSchedules.map((schedule) => (
                <MenuItem key={schedule._id} value={schedule._id}>
                  {formatDate(schedule.startDate)} -{" "}
                  {formatDate(schedule.endDate)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Reason for Swap"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mb: 2 }}
        />
      </>
    );
  }
};

export default ShiftSwap;
