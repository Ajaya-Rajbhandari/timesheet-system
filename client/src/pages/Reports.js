import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  useTheme,
  alpha,
  Button,
  MenuItem,
  TextField,
  CircularProgress,
  Divider,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  IconButton,
  Menu,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  WorkOutline as WorkIcon,
  GetApp as DownloadIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import moment from 'moment';
import { getReportData, generateReport, exportReport } from '../services/reportService';
import { calculateWorkingHours } from '../utils/scheduleValidation';

const Reports = () => {
  const navigate = useNavigate();
  const baseTheme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [reportType, setReportType] = useState('summary');
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportSettings, setReportSettings] = useState({
    showCharts: true,
    showSummaryCards: true,
    includeNotes: true,
    groupByType: true,
    showTotalsOnly: false,
  });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: '/reports' } });
    }
  }, [navigate]);

  // Fetch report data based on date range and type
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        let startDate, endDate;

        switch (dateRange) {
          case 'week':
            startDate = moment().startOf('week');
            endDate = moment().endOf('week');
            break;
          case 'month':
            startDate = moment(selectedMonth).startOf('month');
            endDate = moment(selectedMonth).endOf('month');
            break;
          case 'quarter':
            startDate = moment().startOf('quarter');
            endDate = moment().endOf('quarter');
            break;
          case 'year':
            startDate = moment().startOf('year');
            endDate = moment().endOf('year');
            break;
          default:
            startDate = moment().startOf('month');
            endDate = moment().endOf('month');
        }

        const data = await generateReport(
          reportType,
          startDate.format('YYYY-MM-DD'),
          endDate.format('YYYY-MM-DD')
        );
        setReportData(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { state: { from: '/reports' } });
        } else {
          setError('Failed to fetch report data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [dateRange, selectedMonth, reportType, navigate]);

  // Export menu handlers
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = async (format) => {
    try {
      const startDate = moment(selectedMonth).startOf(dateRange).format('YYYY-MM-DD');
      const endDate = moment(selectedMonth).endOf(dateRange).format('YYYY-MM-DD');
      await exportReport(format, startDate, endDate, reportType);
      handleExportClose();
    } catch (error) {
      console.error('Error exporting report:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { state: { from: '/reports' } });
      } else {
        setError('Failed to export report. Please try again later.');
      }
    }
  };

  // Settings handlers
  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleSettingChange = (setting) => {
    setReportSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Calculate statistics based on report settings
  const stats = useMemo(() => {
    if (!reportData?.schedules) return null;

    const stats = {
      totalHours: 0,
      totalSchedules: reportData.schedules.length,
      workingDays: new Set(reportData.schedules.flatMap(s => s.days)).size,
      averageHours: 0,
      byType: {},
      byDay: {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0
      }
    };

    reportData.schedules.forEach(schedule => {
      const hours = calculateWorkingHours(schedule);
      stats.totalHours += hours;

      // Group by type
      if (reportSettings.groupByType) {
        stats.byType[schedule.type] = (stats.byType[schedule.type] || 0) + hours;
      }

      // Calculate hours by day
      schedule.days.forEach(day => {
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        stats.byDay[dayName] += hours / schedule.days.length;
      });
    });

    stats.averageHours = stats.totalHours / (stats.totalSchedules || 1);

    return stats;
  }, [reportData, reportSettings.groupByType]);

  const COLORS = ['#2196F3', '#F44336', '#FFC107', '#4CAF50'];

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          {/* Header */}
          <Card>
            <CardContent>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={2}
              >
                <Box>
                  <Typography variant="h4" gutterBottom>
                    Schedule Reports
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Analytics and Insights
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                  <TextField
                    select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="quarter">This Quarter</MenuItem>
                    <MenuItem value="year">This Year</MenuItem>
                  </TextField>
                  <TextField
                    select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="summary">Summary</MenuItem>
                    <MenuItem value="detailed">Detailed</MenuItem>
                  </TextField>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportClick}
                  >
                    Export
                  </Button>
                  <IconButton onClick={handleSettingsOpen}>
                    <SettingsIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Summary Cards */}
          {reportSettings.showSummaryCards && stats && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  sx={{ 
                    p: 2,
                    height: '100%',
                    background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                    color: 'white'
                  }}
                >
                  <Stack spacing={1}>
                    <TimeIcon />
                    <Typography variant="h4">
                      {Math.round(stats.totalHours)}
                    </Typography>
                    <Typography variant="subtitle2">
                      Total Working Hours
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  sx={{ 
                    p: 2,
                    height: '100%',
                    background: 'linear-gradient(135deg, #F44336 0%, #FF9800 100%)',
                    color: 'white'
                  }}
                >
                  <Stack spacing={1}>
                    <WorkIcon />
                    <Typography variant="h4">
                      {stats.totalSchedules}
                    </Typography>
                    <Typography variant="subtitle2">
                      Total Schedules
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  sx={{ 
                    p: 2,
                    height: '100%',
                    background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
                    color: 'white'
                  }}
                >
                  <Stack spacing={1}>
                    <GroupIcon />
                    <Typography variant="h4">
                      {stats.workingDays}
                    </Typography>
                    <Typography variant="subtitle2">
                      Working Days
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  sx={{ 
                    p: 2,
                    height: '100%',
                    background: 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)',
                    color: 'white'
                  }}
                >
                  <Stack spacing={1}>
                    <TrendingUpIcon />
                    <Typography variant="h4">
                      {Math.round(stats.averageHours)}
                    </Typography>
                    <Typography variant="subtitle2">
                      Avg Hours per Schedule
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Charts */}
          {reportSettings.showCharts && stats && (
            <Grid container spacing={2}>
              {/* Hours by Type Chart */}
              {reportSettings.groupByType && (
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Hours by Schedule Type
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(stats.byType).map(([type, hours]) => ({
                          name: type.charAt(0).toUpperCase() + type.slice(1),
                          hours: Math.round(hours * 10) / 10
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="hours" fill="#2196F3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Schedule Distribution Chart */}
              <Grid item xs={12} md={reportSettings.groupByType ? 6 : 12}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Hours by Day of Week
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(stats.byDay).map(([day, hours]) => ({
                        name: day,
                        hours: Math.round(hours * 10) / 10
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="hours" fill="#4CAF50" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Stack>
      </Container>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
      >
        <MenuItem onClick={() => handleExport('xlsx')}>Export to Excel</MenuItem>
        <MenuItem onClick={() => handleExport('pdf')}>Export to PDF</MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>Export to CSV</MenuItem>
      </Menu>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={handleSettingsClose}>
        <DialogTitle>
          Report Settings
          <IconButton
            aria-label="close"
            onClick={handleSettingsClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportSettings.showCharts}
                  onChange={() => handleSettingChange('showCharts')}
                />
              }
              label="Show Charts"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportSettings.showSummaryCards}
                  onChange={() => handleSettingChange('showSummaryCards')}
                />
              }
              label="Show Summary Cards"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportSettings.includeNotes}
                  onChange={() => handleSettingChange('includeNotes')}
                />
              }
              label="Include Notes"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportSettings.groupByType}
                  onChange={() => handleSettingChange('groupByType')}
                />
              }
              label="Group by Type"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportSettings.showTotalsOnly}
                  onChange={() => handleSettingChange('showTotalsOnly')}
                />
              }
              label="Show Totals Only"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
