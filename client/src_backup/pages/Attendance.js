import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Divider,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  AccessTime as ClockIcon,
  Timer as TimerIcon,
  LocalCafe as BreakIcon,
  ArrowForward as EndBreakIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import DatePicker from "@mui/lab/DatePicker";

import moment from "moment";
import { useAuth } from "../contexts/AuthContext";
import { useAttendance } from "../contexts/AttendanceContext";
import {
  getAttendanceHistory,
  getCurrentStatus,
} from "../services/attendanceService";

const Attendance = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const {
    currentStatus,
    refreshStatus,
    getStatusText,
    getStatusColor,
    clockIn: contextClockIn,
    clockOut: contextClockOut,
    startBreak: contextStartBreak,
    endBreak: contextEndBreak,
  } = useAttendance();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [groupedAttendance, setGroupedAttendance] = useState({});
  const [breakDialogOpen, setBreakDialogOpen] = useState(false);
  const [selectedBreaks, setSelectedBreaks] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  // Reference for the timer interval
  const timerRef = useRef(null);

  // Force refresh status when component mounts
  useEffect(() => {
    console.log("Attendance page mounted, forcing status refresh");

    // Only refresh if user is authenticated
    if (user && user._id) {
      refreshStatus(true);
    } else {
      console.log("User not authenticated yet, waiting for auth");
    }
  }, [refreshStatus, user]);

  // Update current time every second for dynamic time display
  useEffect(() => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Set up a timer that updates every second
    timerRef.current = setInterval(() => {
      const now = moment();
      setCurrentTime(now);

      // Check if day has changed and user is still clocked in
      if (currentStatus.isClockedIn && currentStatus.clockInTime) {
        const clockInDate = moment(currentStatus.clockInTime).format(
          "YYYY-MM-DD",
        );
        const currentDate = now.format("YYYY-MM-DD");

        if (clockInDate !== currentDate) {
          console.log("Day changed, auto clocking out user");

          // Auto clock out at midnight
          const clockOutTime = moment(clockInDate + "T23:59:59");

          // Update status directly
          contextClockOut();

          // Add record for auto clock out
          const newRecord = {
            date: clockInDate,
            clockIn: currentStatus.clockInTime,
            clockOut: clockOutTime,
            autoClockOut: true,
          };

          console.log("Adding auto clock out record:", newRecord);
          setAttendanceHistory((prev) => [...prev, newRecord]);
        }
      }
    }, 1000); // Update every second for smoother time display

    return () => {
      // Clean up interval on component unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentStatus, contextClockOut]);

  // Group attendance data by day when attendance history changes
  useEffect(() => {
    if (attendanceHistory && attendanceHistory.length > 0) {
      const grouped = attendanceHistory.reduce((acc, record) => {
        // Use date from clockIn as the grouping key
        const dateKey = moment(record.clockIn).format("YYYY-MM-DD");

        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }

        acc[dateKey].push(record);
        return acc;
      }, {});

      // Sort the records within each day
      Object.keys(grouped).forEach((date) => {
        grouped[date].sort((a, b) => moment(b.clockIn).diff(moment(a.clockIn)));
      });

      setGroupedAttendance(grouped);
    } else {
      setGroupedAttendance({});
    }
  }, [attendanceHistory]);

  // Fetch attendance data on component mount and when selectedMonth changes
  const fetchAttendanceHistory = useCallback(async () => {
    if (!selectedMonth) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = selectedMonth
        .clone()
        .startOf("month")
        .format("YYYY-MM-DD");
      const endDate = selectedMonth.clone().endOf("month").format("YYYY-MM-DD");
      const historyData = await getAttendanceHistory(startDate, endDate);
      setAttendanceHistory(historyData);
    } catch (err) {
      console.error("Failed to fetch attendance history:", err);
      setAttendanceHistory([]);
      setError("Failed to load attendance history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);

  // Handle clock in
  const handleClockIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await contextClockIn();
      console.log("Clock in successful");

      // Refresh history after status update
      fetchAttendanceHistory();
    } catch (err) {
      console.error("Clock in error:", err);
      setError(err.message || "Failed to clock in");
    } finally {
      setLoading(false);
    }
  };

  // Handle clock out
  const handleClockOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await contextClockOut();
      console.log("Clock out successful");

      // Refresh history after status update
      fetchAttendanceHistory();
    } catch (err) {
      console.error("Clock out error:", err);
      setError(err.message || "Failed to clock out");
    } finally {
      setLoading(false);
    }
  };

  // Handle start break
  const handleStartBreak = async () => {
    setLoading(true);
    setError(null);
    try {
      await contextStartBreak();
      console.log("Start break successful");
    } catch (err) {
      console.error("Start break error:", err);
      setError(err.message || "Failed to start break");
    } finally {
      setLoading(false);
    }
  };

  // Handle end break
  const handleEndBreak = async () => {
    setLoading(true);
    setError(null);
    try {
      await contextEndBreak();
      console.log("End break successful");
    } catch (err) {
      console.error("End break error:", err);
      setError(err.message || "Failed to end break");
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTime = (time) => {
    return time ? moment(time).format("hh:mm:ss A") : "";
  };

  const getElapsedTime = () => {
    if (!currentStatus.isClockedIn || !currentStatus.clockInTime) {
      return "00:00:00";
    }

    const clockInMoment = moment(currentStatus.clockInTime);
    const duration = moment.duration(currentTime.diff(clockInMoment));

    const hours = String(Math.floor(duration.asHours())).padStart(2, "0");
    const minutes = String(duration.minutes()).padStart(2, "0");
    const seconds = String(duration.seconds()).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  };

  const isLongShift = () => {
    if (!currentStatus.isClockedIn || !currentStatus.clockInTime) {
      return false;
    }

    const clockInMoment = moment(currentStatus.clockInTime);
    const duration = moment.duration(currentTime.diff(clockInMoment));

    return duration.asHours() >= 12;
  };

  const calculateTotalBreakTime = (breaks) => {
    if (!breaks || breaks.length === 0) return 0;

    let totalBreakTime = 0;
    breaks.forEach((breakItem) => {
      if (breakItem.startTime && breakItem.endTime) {
        totalBreakTime += moment
          .duration(moment(breakItem.endTime).diff(moment(breakItem.startTime)))
          .asMinutes();
      }
    });
    return Math.round(totalBreakTime);
  };

  const handleBreakDetailsClick = (record) => {
    if (record.breaks && record.breaks.length > 0) {
      setSelectedBreaks(record.breaks);
      setSelectedDate(moment(record.clockIn).format("MMMM D, YYYY"));
      setBreakDialogOpen(true);
    }
  };

  const handleCloseBreakDialog = () => {
    setBreakDialogOpen(false);
  };

  const formatBreakDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";

    const duration = moment.duration(moment(endTime).diff(moment(startTime)));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  // Calculate total hours for a day
  const calculateDailyTotalHours = (records) => {
    if (!records || records.length === 0) return "0.00";

    let totalMinutes = 0;

    records.forEach((record) => {
      if (record.clockIn && record.clockOut) {
        // Calculate duration excluding breaks
        let duration = moment.duration(
          moment(record.clockOut).diff(moment(record.clockIn)),
        );
        let durationMinutes = duration.asMinutes();

        // Subtract break times
        const breakMinutes = calculateTotalBreakTime(record.breaks);
        durationMinutes -= breakMinutes;

        totalMinutes += durationMinutes;
      }
    });

    // Convert minutes to hours with 2 decimal places
    return (totalMinutes / 60).toFixed(2);
  };

  if (loading || !currentStatus) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 600,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(45deg, #64B5F6 30%, #81D4FA 90%)"
                : "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Welcome, {user?.firstName}
        </Typography>
        <Typography variant="h6" color="textSecondary">
          {currentTime.format("dddd, MMMM D, YYYY")}
        </Typography>
        <Typography variant="h3" sx={{ fontFamily: "monospace", mt: 2 }}>
          {currentTime.format("HH:mm:ss")}
        </Typography>
      </Box>

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {currentStatus.isClockedIn && isLongShift() && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have been clocked in for more than 12 hours. Please remember to
          clock out when your shift ends.
        </Alert>
      )}

      <Card
        sx={{
          mb: 4,
          borderRadius: 2,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
              : "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 2,
            background: currentStatus.onBreak
              ? "linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)"
              : currentStatus.isClockedIn
                ? "linear-gradient(45deg, #4CAF50 30%, #81C784 90%)"
                : "linear-gradient(45deg, #F44336 30%, #E57373 90%)",
            color: "white",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Current Status: {getStatusText()}
          </Typography>
        </Box>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: { xs: 2, md: 0 },
                }}
              >
                <ClockIcon
                  sx={{ fontSize: 40, mr: 2, color: "primary.main" }}
                />
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {currentStatus.isClockedIn
                      ? "Clocked in at:"
                      : "Last clock out:"}
                  </Typography>
                  <Typography variant="h6">
                    {currentStatus.isClockedIn && currentStatus.clockInTime
                      ? formatTime(currentStatus.clockInTime)
                      : currentStatus.clockOutTime
                        ? formatTime(currentStatus.clockOutTime)
                        : "Not available"}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {currentStatus.isClockedIn && (
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TimerIcon
                    sx={{ fontSize: 40, mr: 2, color: "primary.main" }}
                  />
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Time elapsed:
                    </Typography>
                    <Typography variant="h6" sx={{ fontFamily: "monospace" }}>
                      {getElapsedTime()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}

            {currentStatus.onBreak && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mt: 1,
                  }}
                >
                  <Chip
                    icon={<BreakIcon />}
                    label={`On Break since ${formatTime(
                      currentStatus.breakStartTime,
                    )}`}
                    color="warning"
                    variant="outlined"
                    sx={{ fontSize: "1rem", py: 2 }}
                  />
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 2,
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {(loading || currentStatus.isLoading) && (
                  <CircularProgress sx={{ mb: 2 }} />
                )}

                {!currentStatus.isClockedIn ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<ClockIcon />}
                    onClick={handleClockIn}
                    disabled={loading || currentStatus.isLoading}
                    sx={{ minWidth: 150 }}
                  >
                    Clock In
                  </Button>
                ) : (
                  <>
                    <ButtonGroup
                      variant="contained"
                      size="large"
                      sx={{ mb: 2 }}
                    >
                      {!currentStatus.onBreak ? (
                        <Button
                          color="warning"
                          startIcon={<BreakIcon />}
                          onClick={handleStartBreak}
                          disabled={loading || currentStatus.isLoading}
                          sx={{ minWidth: 150 }}
                        >
                          Take a Break
                        </Button>
                      ) : (
                        <Button
                          color="info"
                          startIcon={<EndBreakIcon />}
                          onClick={handleEndBreak}
                          disabled={loading || currentStatus.isLoading}
                          sx={{ minWidth: 150 }}
                        >
                          End Break
                        </Button>
                      )}
                    </ButtonGroup>

                    <Button
                      variant="contained"
                      color="error"
                      size="large"
                      startIcon={<ClockIcon />}
                      onClick={handleClockOut}
                      disabled={loading || currentStatus.isLoading}
                      sx={{ minWidth: 150 }}
                    >
                      Clock Out
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card
        sx={{
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(37, 37, 37, 0.9), rgba(30, 30, 30, 0.9))"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.9))",
          backdropFilter: "blur(10px)",
          border: `1px solid ${
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)"
          }`,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6">Attendance History</Typography>
            <DatePicker
              views={["month", "year"]}
              value={selectedMonth}
              onChange={(newValue) => setSelectedMonth(newValue)}
              slotProps={{ textField: { size: "small" } }}
            />
          </Box>

          {Object.keys(groupedAttendance).length > 0 ? (
            Object.keys(groupedAttendance)
              .sort((a, b) => moment(b).diff(moment(a))) // Sort dates in descending order
              .map((date) => (
                <Accordion key={date} sx={{ mb: 2, boxShadow: 1 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`attendance-${date}-content`}
                    id={`attendance-${date}-header`}
                    sx={{
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CalendarIcon sx={{ mr: 1 }} />
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "bold" }}
                        >
                          {moment(date).format("dddd, MMMM D, YYYY")}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${calculateDailyTotalHours(
                          groupedAttendance[date],
                        )} hours`}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer
                      component={Paper}
                      sx={{
                        background: "transparent",
                        boxShadow: "none",
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Clock In</TableCell>
                            <TableCell>Clock Out</TableCell>
                            <TableCell>Total Hours</TableCell>
                            <TableCell>Breaks</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {groupedAttendance[date].map((record) => (
                            <TableRow key={record._id}>
                              <TableCell>
                                {moment(record.clockIn).format("HH:mm:ss")}
                              </TableCell>
                              <TableCell>
                                {record.clockOut
                                  ? moment(record.clockOut).format("HH:mm:ss")
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {record.clockOut
                                  ? (
                                      moment
                                        .duration(
                                          moment(record.clockOut).diff(
                                            moment(record.clockIn),
                                          ),
                                        )
                                        .asHours() -
                                      calculateTotalBreakTime(record.breaks) /
                                        60
                                    ).toFixed(2)
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {record.breaks && record.breaks.length > 0 ? (
                                  <Chip
                                    label={`${record.breaks.length} break${
                                      record.breaks.length > 1 ? "s" : ""
                                    } (${calculateTotalBreakTime(
                                      record.breaks,
                                    )} min)`}
                                    color="warning"
                                    size="small"
                                    onClick={() =>
                                      handleBreakDetailsClick(record)
                                    }
                                  />
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={
                                    record.status ||
                                    (record.clockOut ? "Completed" : "Active")
                                  }
                                  color={
                                    record.status === "Present" ||
                                    record.clockOut
                                      ? "success"
                                      : record.status === "Late"
                                        ? "warning"
                                        : "error"
                                  }
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="textSecondary">
                No attendance records found for the selected month.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Break Details Dialog */}
      <Dialog
        open={breakDialogOpen}
        onClose={handleCloseBreakDialog}
        aria-labelledby="break-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="break-dialog-title">
          Break Details - {selectedDate}
        </DialogTitle>
        <DialogContent dividers>
          {selectedBreaks.length > 0 ? (
            <List>
              {selectedBreaks.map((breakItem, index) => (
                <ListItem
                  key={index}
                  divider={index < selectedBreaks.length - 1}
                >
                  <ListItemText
                    primary={`Break #${index + 1}`}
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="textPrimary"
                        >
                          Start:{" "}
                          {moment(breakItem.startTime).format("HH:mm:ss")}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="textPrimary"
                        >
                          End:{" "}
                          {breakItem.endTime
                            ? moment(breakItem.endTime).format("HH:mm:ss")
                            : "Not ended"}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="textPrimary"
                        >
                          Duration:{" "}
                          {breakItem.endTime
                            ? formatBreakDuration(
                                breakItem.startTime,
                                breakItem.endTime,
                              )
                            : "In progress"}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1">No break details available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBreakDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Attendance;
