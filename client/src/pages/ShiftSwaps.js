import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import ShiftSwapHistory from "../components/ShiftSwapHistory";
import ManagerSwapApproval from "../components/ManagerSwapApproval";
import ShiftSwap from "../components/ShiftSwap";
import api from "../services/api";

const ShiftSwaps = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);

  useEffect(() => {
    if (user && user._id) {
      fetchUserSchedules();
    }
  }, [user]);

  const fetchUserSchedules = async () => {
    if (!user || !user._id) {
      setError("User information is not available");
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/schedules/user/${user._id}`);
      setSchedules(response.data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError("Failed to load your schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRequestSwap = (schedule) => {
    setSelectedSchedule(schedule);
    setSwapDialogOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 3 }}>
        Shift Swaps
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="My Schedules" />
          <Tab label="Swap History" />
          {(user.role === "admin" || user.role === "manager") && (
            <Tab label="Approval Requests" />
          )}
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tab 1: My Schedules */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Current Schedules
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Select a schedule to request a shift swap
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : schedules.length === 0 ? (
            <Alert severity="info">You don't have any scheduled shifts</Alert>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {schedules.map((schedule) => (
                <Paper
                  key={schedule._id}
                  elevation={2}
                  sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderLeft: "4px solid",
                    borderColor: "primary.main",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {schedule.title || "Shift"}
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(schedule.startDate)} -{" "}
                      {formatDate(schedule.endDate)}
                    </Typography>
                    {schedule.notes && (
                      <Typography variant="body2" color="textSecondary">
                        Notes: {schedule.notes}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleRequestSwap(schedule)}
                  >
                    Request Swap
                  </Button>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Tab 2: Swap History */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <ShiftSwapHistory />
        </Paper>
      )}

      {/* Tab 3: Approval Requests (Managers/Admins only) */}
      {tabValue === 2 && (user.role === "admin" || user.role === "manager") && (
        <Paper sx={{ p: 3 }}>
          <ManagerSwapApproval />
        </Paper>
      )}

      {/* Shift Swap Request Dialog */}
      <Dialog
        open={swapDialogOpen}
        onClose={() => setSwapDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Request Shift Swap</DialogTitle>
        <DialogContent>
          {selectedSchedule && (
            <Box sx={{ minHeight: "400px" }}>
              <Typography variant="subtitle1" gutterBottom>
                You are requesting to swap:
              </Typography>
              <Paper sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
                <Typography variant="subtitle2">
                  {selectedSchedule.title || "Shift"}
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedSchedule.startDate)} -{" "}
                  {formatDate(selectedSchedule.endDate)}
                </Typography>
              </Paper>

              <Divider sx={{ my: 2 }} />

              {selectedSchedule ? (
                <ShiftSwap
                  open={true}
                  schedule={selectedSchedule}
                  onClose={() => {}}
                  embedded={true}
                />
              ) : (
                <Alert severity="info">Please select a schedule to swap.</Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwapDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ShiftSwaps;
