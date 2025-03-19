import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles"; // Import styled for modern UI

import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Stack,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  AccessTime as ClockIcon,
  Event as EventIcon,
  Person as PersonIcon,
  WorkHistory as HistoryIcon,
  EventNote as ScheduleIcon,
  Timer as TimerIcon,
  HourglassEmpty as PendingIcon,
  CheckCircleOutline as CheckCircle,
  Cancel as RejectedIcon,
  ArrowForward as ArrowIcon,
  Notifications as NotificationIcon,
  CalendarMonth as CalendarIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import moment from "moment";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentStatus } from "../services/attendanceService";
import { getMyTimeOffRequests } from "../services/timeOffService";
import { getMySchedules } from "../services/scheduleService";
import { Link } from "react-router-dom";
import api from "../services/api";

const Dashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true); // Loading state for data fetching

  const [currentTime, setCurrentTime] = useState(moment());
  const [attendanceStatus, setAttendanceStatus] = useState({
    isClockedIn: false,
    clockInTime: null,
  }); // Attendance status

  const [schedules, setSchedules] = useState([]); // User schedules

  const [timeOffRequests, setTimeOffRequests] = useState([]); // Time off requests

  const [quickStats, setQuickStats] = useState({
    totalHours: 0,
    attendanceRate: 0,
    upcomingLeaves: 0,
    pendingRequests: 0,
  }); // Quick statistics

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data for dashboard

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get current month's date range
        const startDate = moment().startOf("month").format("YYYY-MM-DD");
        const endDate = moment().endOf("month").format("YYYY-MM-DD");

        // Fetch data in parallel
        const [statusRes, schedulesRes, timeOffRes, statsRes] =
          await Promise.all([
            getCurrentStatus(),
            getMySchedules(startDate, endDate),
            getMyTimeOffRequests(),
            api.get("/reports/user-stats", { params: { userId: user._id } }),
          ]);

        setAttendanceStatus({
          isClockedIn: statusRes.isClockedIn,
          clockInTime: statusRes.clockIn,
        });
        setSchedules(schedulesRes);
        setTimeOffRequests(timeOffRes);

        // Use real data from the API
        setQuickStats({
          totalHours: statsRes.data.totalHours || 0,
          attendanceRate: statsRes.data.attendanceRate || 0,
          upcomingLeaves: timeOffRes.filter((r) => r.status === "approved")
            .length,
          pendingRequests: timeOffRes.filter((r) => r.status === "pending")
            .length,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);

        // Fallback to calculated values if API fails
        setQuickStats({
          totalHours: 0,
          attendanceRate: 0,
          upcomingLeaves: timeOffRequests.filter((r) => r.status === "approved")
            .length,
          pendingRequests: timeOffRequests.filter((r) => r.status === "pending")
            .length,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <CircularProgress />
      </Box>
    ); // Loading spinner
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,rgb(54, 112, 199) 0%, #c3cfe2 100%)",
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2 },
      }}
      role="main"
      aria-label="Dashboard"
    >
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Welcome Header */}
        <Card
          sx={{
            mb: 4,
            background: "transparent",
            backdropFilter: "blur(10px)",
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            borderRadius: 4,
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{
              textAlign: "center",
              py: 4,
              background: `radial-gradient(circle at top right, ${alpha(
                theme.palette.primary.main,
                0.1,
              )} 0%, transparent 70%)`,
            }}
          >
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 600,
                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                backgroundClip: "text",
                textFillColor: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome back, {user?.firstName || "User"}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: "text.secondary", mb: 2 }}
            >
              {currentTime.format("dddd, MMMM D, YYYY")}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontFamily: "monospace",
                letterSpacing: 2,
                color: theme.palette.primary.main,
                textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {currentTime.format("hh:mm A")}
            </Typography>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Grid
          container
          spacing={2}
          sx={{ mb: 4, display: "flex", justifyContent: "space-between" }}
        >
          <Grid item xs={6} md={3}>
            <Card
              sx={{
                background: "transparent",
                backdropFilter: "blur(10px)",
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                borderRadius: 3,
                boxShadow: "0 4px 20px 0 rgba(31, 38, 135, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TimerIcon color="primary" sx={{ fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Total Hours
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {quickStats.totalHours}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This Month
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card
              sx={{
                background: "transparent",
                backdropFilter: "blur(10px)",
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                borderRadius: 3,
                boxShadow: "0 4px 20px 0 rgba(31, 38, 135, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircle color="success" sx={{ fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Attendance Rate
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {quickStats.attendanceRate > 0
                      ? quickStats.attendanceRate
                      : "No attendance data available."}
                    %
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={quickStats.attendanceRate}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      "& .MuiLinearProgress-bar": {
                        bgcolor: theme.palette.success.main,
                      },
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card
              sx={{
                background: "transparent",
                backdropFilter: "blur(10px)",
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                borderRadius: 3,
                boxShadow: "0 4px 20px 0 rgba(31, 38, 135, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EventIcon color="warning" sx={{ fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Upcoming Leaves
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {quickStats.upcomingLeaves > 0
                      ? quickStats.upcomingLeaves
                      : "No upcoming leaves."}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Next 30 Days
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card
              sx={{
                background: "transparent",
                backdropFilter: "blur(10px)",
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                borderRadius: 3,
                boxShadow: "0 4px 20px 0 rgba(31, 38, 135, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PendingIcon color="info" sx={{ fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Pending Requests
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {quickStats.pendingRequests > 0
                      ? quickStats.pendingRequests
                      : "No pending requests."}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Awaiting Approval
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {/* Current Status */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: "100%",
                background: "transparent",
                backdropFilter: "blur(10px)",
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                borderRadius: 4,
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent>
                <Stack spacing={3}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <TimerIcon color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Current Status
                      </Typography>
                    </Box>
                    <Tooltip title="View Attendance">
                      <IconButton
                        component={Link}
                        to="/attendance"
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                          },
                        }}
                      >
                        <ArrowIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Chip
                      icon={<ClockIcon />}
                      label={
                        attendanceStatus.isClockedIn
                          ? "Clocked In"
                          : "Clocked Out"
                      }
                      color={
                        attendanceStatus.isClockedIn ? "success" : "default"
                      }
                      sx={{
                        fontSize: "1rem",
                        py: 3,
                        px: 4,
                        borderRadius: 3,
                        "& .MuiChip-icon": { fontSize: "1.5rem" },
                      }}
                    />
                    {attendanceStatus.clockInTime && (
                      <Typography
                        variant="body2"
                        sx={{ mt: 2, color: "text.secondary" }}
                      >
                        Since{" "}
                        {moment(attendanceStatus.clockInTime).format("hh:mm A")}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Today's Schedule */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: "100%",
                background: "transparent",
                backdropFilter: "blur(10px)",
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                borderRadius: 4,
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent>
                <Stack spacing={3}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <ScheduleIcon color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Today's Schedule
                      </Typography>
                    </Box>
                    <Tooltip title="View Schedule">
                      <IconButton
                        component={Link}
                        to="/schedule"
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                          },
                        }}
                      >
                        <ArrowIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {schedules.length > 0 ? (
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.primary.main,
                          mb: 1,
                        }}
                      >
                        {schedules[0].startTime} - {schedules[0].endTime}
                      </Typography>
                      <Chip
                        icon={<WorkIcon />}
                        label={
                          schedules[0].type.charAt(0).toUpperCase() +
                          schedules[0].type.slice(1)
                        }
                        color={
                          schedules[0].type === "regular"
                            ? "primary"
                            : schedules[0].type === "overtime"
                              ? "error"
                              : schedules[0].type === "flexible"
                                ? "warning"
                                : "success"
                        }
                        sx={{ borderRadius: 2 }}
                      />
                      {schedules[0].notes && (
                        <Typography
                          variant="body2"
                          sx={{ mt: 2, color: "text.secondary" }}
                        >
                          {schedules[0].notes}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 2,
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                        borderRadius: 2,
                      }}
                    >
                      <CalendarIcon
                        sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                      />
                      <Typography color="text.secondary">
                        No schedule for today
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Time Off Requests */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: "100%",
                background: "transparent",
                backdropFilter: "blur(10px)",
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                borderRadius: 4,
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent>
                <Stack spacing={3}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <EventIcon color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Time Off Requests
                      </Typography>
                    </Box>
                    <Tooltip title="View Time Off">
                      <IconButton
                        component={Link}
                        to="/timeoff"
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                          },
                        }}
                      >
                        <ArrowIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Stack spacing={2}>
                    {timeOffRequests.length > 0 ? (
                      timeOffRequests.slice(0, 2).map((request) => (
                        <Paper
                          key={request._id}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.background.paper, 0.5),
                            transition: "transform 0.2s",
                            "&:hover": {
                              transform: "translateX(4px)",
                            },
                          }}
                        >
                          <Stack spacing={1}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600 }}
                              >
                                {request.type.charAt(0).toUpperCase() +
                                  request.type.slice(1)}{" "}
                                Leave
                              </Typography>
                              <Chip
                                label={request.status}
                                size="small"
                                color={
                                  request.status === "approved"
                                    ? "success"
                                    : request.status === "rejected"
                                      ? "error"
                                      : "warning"
                                }
                                sx={{ borderRadius: 1 }}
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {moment(request.startDate).format("MMM D")} -{" "}
                              {moment(request.endDate).format("MMM D, YYYY")}
                            </Typography>
                          </Stack>
                        </Paper>
                      ))
                    ) : (
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 2,
                          bgcolor: alpha(theme.palette.background.paper, 0.5),
                          borderRadius: 2,
                        }}
                      >
                        <NotificationIcon
                          sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                        />
                        <Typography color="text.secondary">
                          No pending requests
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;

const DashboardContent = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true); // Loading state for data fetching

  const [currentTime, setCurrentTime] = useState(moment());
  const [attendanceStatus, setAttendanceStatus] = useState({
    isClockedIn: false,
    clockInTime: null,
  }); // Attendance status

  const [schedules, setSchedules] = useState([]); // User schedules

  const [timeOffRequests, setTimeOffRequests] = useState([]); // Time off requests

  const [quickStats, setQuickStats] = useState({
    totalHours: 0,
    attendanceRate: 0,
    upcomingLeaves: 0,
    pendingRequests: 0,
  }); // Quick statistics

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data for dashboard

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get current month's date range
        const startDate = moment().startOf("month").format("YYYY-MM-DD");
        const endDate = moment().endOf("month").format("YYYY-MM-DD");

        // Fetch data in parallel
        const [statusRes, schedulesRes, timeOffRes, statsRes] =
          await Promise.all([
            getCurrentStatus(),
            getMySchedules(startDate, endDate),
            getMyTimeOffRequests(),
            api.get("/reports/user-stats", { params: { userId: user._id } }),
          ]);

        setAttendanceStatus({
          isClockedIn: statusRes.isClockedIn,
          clockInTime: statusRes.clockIn,
        });
        setSchedules(schedulesRes);
        setTimeOffRequests(timeOffRes);

        // Use real data from the API
        setQuickStats({
          totalHours: statsRes.data.totalHours || 0,
          attendanceRate: statsRes.data.attendanceRate || 0,
          upcomingLeaves: timeOffRes.filter((r) => r.status === "approved")
            .length,
          pendingRequests: timeOffRes.filter((r) => r.status === "pending")
            .length,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);

        // Fallback to calculated values if API fails
        setQuickStats({
          totalHours: 0,
          attendanceRate: 0,
          upcomingLeaves: timeOffRequests.filter((r) => r.status === "approved")
            .length,
          pendingRequests: timeOffRequests.filter((r) => r.status === "pending")
            .length,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <CircularProgress />
      </Box>
    ); // Loading spinner
  }

  return <Container maxWidth="xl">{/* JSX content */}</Container>;
};
