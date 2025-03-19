import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Grid,
  Paper,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Menu,
  Divider,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  AccessTime as TimeIcon,
  Work as WorkIcon,
  Group as GroupIcon,
  DateRange as DateRangeIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  Timer as TimerIcon,
  HourglassEmpty as HourglassIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Chart colors
const CHART_COLORS = [
  "#2196f3",
  "#4caf50",
  "#f44336",
  "#ff9800",
  "#9c27b0",
  "#795548",
];

const Reports = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState("month");
  const [reportType, setReportType] = useState("summary");
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [reportSettings, setReportSettings] = useState({
    showCharts: true,
    showSummaryCards: true,
    groupByType: true,
    showTotalsOnly: false,
  });

  // Check authentication and permissions
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Regular users can only access their own stats
    if (!isAdmin && !isManager && reportType !== "user-stats") {
      setReportType("user-stats");
      setError("You only have access to your own statistics");
    }
  }, [isAuthenticated, isAdmin, isManager, reportType, navigate]);

  // Load departments and users
  useEffect(() => {
    const loadDepartmentsAndUsers = async () => {
      if (!isAuthenticated || (!isAdmin && !isManager)) return;

      try {
        // Load departments
        const deptResponse = await api.get("/departments");
        setDepartments(deptResponse.data);

        // Load users for the selected department
        if (selectedDepartment) {
          const userResponse = await api.get("/users", {
            params: { department: selectedDepartment },
          });
          setUsers(
            userResponse.data.filter(
              (user) => user.department === selectedDepartment,
            ),
          );
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("Error loading departments/users:", err);
        setError("Failed to load departments or users");
      }
    };

    loadDepartmentsAndUsers();
  }, [isAuthenticated, isAdmin, isManager, selectedDepartment]);

  // Function to fetch report data
  const fetchReportData = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = moment().startOf(dateRange).format("YYYY-MM-DD");
      const endDate = moment().endOf(dateRange).format("YYYY-MM-DD");

      let endpoint = `/reports/${reportType}`;
      let params = { startDate, endDate };

      // Add department filter for admin/manager
      if ((isAdmin || isManager) && selectedDepartment) {
        params.department = selectedDepartment;
      }

      // Add user filter for admin/manager
      if ((isAdmin || isManager) && selectedUserId) {
        params.userId = selectedUserId;
      }

      const response = await api.get(endpoint, { params });
      console.log("Report data:", response.data); // Debug log
      setReportData(response.data);
      setReportGenerated(true);
    } catch (err) {
      console.error("Error fetching report:", err);
      if (err.response?.status === 403) {
        setError("You do not have permission to access this report");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to fetch report data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle department change
  const handleDepartmentChange = async (e) => {
    const deptId = e.target.value;
    setSelectedDepartment(deptId);
    setSelectedUserId(""); // Reset selected user when department changes

    if (deptId && (isAdmin || isManager)) {
      try {
        const response = await api.get("/users", {
          params: { department: deptId },
        });
        setUsers(response.data.filter((user) => user.department === deptId));
      } catch (err) {
        console.error("Error loading users:", err);
        setError("Failed to load users for the selected department");
      }
    } else {
      setUsers([]);
    }
  };

  // Handle report export
  const handleExport = async (format) => {
    try {
      setLoading(true);
      const startDate = moment().startOf(dateRange).format("YYYY-MM-DD");
      const endDate = moment().endOf(dateRange).format("YYYY-MM-DD");

      const params = {
        startDate,
        endDate,
        format,
        ...(selectedDepartment && { department: selectedDepartment }),
        ...(selectedUserId && { userId: selectedUserId }),
      };

      const response = await api.get(`/reports/export/${reportType}`, {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${reportType}-${moment().format("YYYY-MM-DD")}.${format}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting report:", err);
      setError("Failed to export report. Please try again.");
    } finally {
      setLoading(false);
      setExportAnchorEl(null);
    }
  };

  // Available report types based on user role
  const availableReportTypes = useMemo(() => {
    const types = [{ value: "user-stats", label: "My Statistics" }];

    if (isAdmin || isManager) {
      types.push(
        { value: "summary", label: "Summary Report" },
        { value: "attendance-summary", label: "Attendance Summary" },
        { value: "detailed", label: "Detailed Report" },
      );
    }

    return types;
  }, [isAdmin, isManager]);

  // Function to render summary cards
  const renderSummaryCards = () => {
    if (
      !reportData ||
      !reportSettings.showSummaryCards ||
      !reportData.attendance
    )
      return null;

    const { attendance, period } = reportData;

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6" color="text.secondary">
                    Attendance
                  </Typography>
                  <GroupIcon color="primary" />
                </Stack>
                <Typography variant="h4">
                  {attendance.totalAttendance || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Out of {period?.totalWorkDays || 0} work days
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6" color="text.secondary">
                    Work Hours
                  </Typography>
                  <TimerIcon color="primary" />
                </Stack>
                <Typography variant="h4">
                  {(attendance.totalWorkHours || 0).toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total hours worked
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6" color="text.secondary">
                    On Time
                  </Typography>
                  <TimeIcon color="primary" />
                </Stack>
                <Typography variant="h4">
                  {attendance.totalAttendance
                    ? (
                        (attendance.onTimeCount / attendance.totalAttendance) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {attendance.onTimeCount || 0} out of{" "}
                  {attendance.totalAttendance || 0} days
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6" color="text.secondary">
                    Overtime
                  </Typography>
                  <HourglassIcon color="primary" />
                </Stack>
                <Typography variant="h4">
                  {(attendance.overtimeHours || 0).toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total overtime hours
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Function to render attendance chart
  const renderAttendanceChart = () => {
    if (!reportData || !reportSettings.showCharts || !reportData.attendance)
      return null;

    const { attendance } = reportData;
    const data = [
      { name: "On Time", value: attendance.onTimeCount || 0 },
      { name: "Late", value: attendance.lateCount || 0 },
    ];

    // Don't render if no data
    if (data.every((item) => item.value === 0)) return null;

    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Attendance Distribution
          </Typography>
          <Box sx={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Function to render time off chart
  const renderTimeOffChart = () => {
    if (!reportData || !reportSettings.showCharts || !reportData.timeOff)
      return null;

    const data = Object.entries(reportData.timeOff).map(([type, info]) => ({
      name: type,
      days: info.totalDays || 0,
    }));

    if (data.length === 0 || data.every((item) => item.days === 0)) return null;

    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Time Off Distribution
          </Typography>
          <Box sx={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="days" fill="#2196f3" name="Days" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Function to render schedule chart
  const renderScheduleChart = () => {
    if (!reportData || !reportSettings.showCharts || !reportData.schedules)
      return null;

    const data = Object.entries(reportData.schedules).map(([type, info]) => ({
      name: type,
      hours: info.totalHours || 0,
    }));

    if (data.length === 0 || data.every((item) => item.hours === 0))
      return null;

    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Schedule Hours by Type
          </Typography>
          <Box sx={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#4caf50" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Report Type"
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value);
                    setSelectedDepartment("");
                    setSelectedUserId("");
                    setUsers([]);
                  }}
                  disabled={loading}
                >
                  {availableReportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Date Range"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="quarter">This Quarter</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                </TextField>
              </Grid>

              {(isAdmin || isManager) && reportType !== "user-stats" && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Department"
                      value={selectedDepartment}
                      onChange={handleDepartmentChange}
                      disabled={loading}
                    >
                      <MenuItem value="">All Departments</MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="User"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      disabled={loading || !selectedDepartment}
                    >
                      <MenuItem value="">All Users</MenuItem>
                      {users.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                          {`${user.firstName} ${user.lastName}`}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              )}

              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={fetchReportData}
                    disabled={loading}
                    startIcon={
                      loading ? <CircularProgress size={20} /> : <RefreshIcon />
                    }
                  >
                    Generate
                  </Button>

                  <IconButton
                    onClick={(e) => setExportAnchorEl(e.currentTarget)}
                    disabled={!reportGenerated || loading}
                  >
                    <DownloadIcon />
                  </IconButton>

                  <IconButton
                    onClick={() => setSettingsOpen(true)}
                    disabled={loading}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Report Content */}
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          reportData && (
            <Box>
              {/* Report Title */}
              {reportType === "user-stats" ? (
                <Typography variant="h5" gutterBottom color="primary">
                  My Statistics
                </Typography>
              ) : reportData.period?.department?.name ? (
                <Typography variant="h5" gutterBottom color="primary">
                  {reportData.period.department.name} Department Report
                </Typography>
              ) : (
                <Typography variant="h5" gutterBottom color="primary">
                  {selectedUserId ? "User Report" : "Summary Report"}
                </Typography>
              )}

              {/* Date Range */}
              {reportData.period && (
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  color="text.secondary"
                >
                  {moment(reportData.period.startDate).format("MMM D, YYYY")} -{" "}
                  {moment(reportData.period.endDate).format("MMM D, YYYY")}
                </Typography>
              )}

              {renderSummaryCards()}
              {renderAttendanceChart()}
              {renderTimeOffChart()}
              {renderScheduleChart()}
            </Box>
          )
        )}
      </Stack>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={() => setExportAnchorEl(null)}
      >
        <MenuItem onClick={() => handleExport("pdf")}>Export as PDF</MenuItem>
        <MenuItem onClick={() => handleExport("xlsx")}>
          Export as Excel
        </MenuItem>
        <MenuItem onClick={() => handleExport("csv")}>Export as CSV</MenuItem>
      </Menu>

      {/* Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Report Settings
          <IconButton
            onClick={() => setSettingsOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportSettings.showCharts}
                  onChange={(e) =>
                    setReportSettings({
                      ...reportSettings,
                      showCharts: e.target.checked,
                    })
                  }
                />
              }
              label="Show Charts"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportSettings.showSummaryCards}
                  onChange={(e) =>
                    setReportSettings({
                      ...reportSettings,
                      showSummaryCards: e.target.checked,
                    })
                  }
                />
              }
              label="Show Summary Cards"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportSettings.groupByType}
                  onChange={(e) =>
                    setReportSettings({
                      ...reportSettings,
                      groupByType: e.target.checked,
                    })
                  }
                />
              }
              label="Group by Type"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportSettings.showTotalsOnly}
                  onChange={(e) =>
                    setReportSettings({
                      ...reportSettings,
                      showTotalsOnly: e.target.checked,
                    })
                  }
                />
              }
              label="Show Totals Only"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Reports;
