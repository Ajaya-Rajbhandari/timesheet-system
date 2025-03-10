import React, { useState, useEffect, useCallback } from 'react';
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
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { useAuth } from '../contexts/AuthContext';
import { 
  createSchedule, 
  updateSchedule,
  fetchUserSchedules,
  fetchDepartmentSchedules,
  fetchAllSchedules,
  deleteSchedule,
  getMySchedules
} from '../services/scheduleService';
import { fetchUsers } from '../services/userService';
import { validateSchedule, suggestAlternativeSchedules } from '../utils/scheduleValidation';

const Schedule = () => {
  const theme = useTheme();
  const { user, isAdmin, isManager } = useAuth();
  const hasEditPermission = isAdmin || isManager;

  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    startDate: moment(),
    endDate: moment(),
    startTime: moment().set({ hour: 9, minute: 0 }),
    endTime: moment().set({ hour: 17, minute: 0 }),
    type: 'regular',
    notes: '',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  });
  const [validationErrors, setValidationErrors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewType, setViewType] = useState('my-schedule');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleNotificationClose = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);
    
    if (!hasEditPermission) {
      showNotification('Only managers and administrators can create or edit schedules', 'error');
      setOpenDialog(false);
      return;
    }

    try {
      setLoading(true);
      const formattedData = {
        startDate: formData.startDate.format('YYYY-MM-DD'),
        endDate: formData.endDate.format('YYYY-MM-DD'),
        startTime: formData.startTime.format('HH:mm'),
        endTime: formData.endTime.format('HH:mm'),
        type: formData.type,
        days: formData.days,
        notes: formData.notes
      };

      if (selectedSchedule) {
        await updateSchedule(selectedSchedule._id, formattedData);
        showNotification('Schedule updated successfully', 'success');
      } else {
        await createSchedule(formattedData);
        showNotification('Schedule created successfully', 'success');
      }

      await fetchScheduleData();
      setOpenDialog(false);
      setSelectedSchedule(null);
      resetForm();
    } catch (err) {
      console.error('Failed to save schedule:', err);
      showNotification(err.message || 'Failed to save schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      const startOfMonth = moment(selectedDate).startOf('month');
      const endOfMonth = moment(selectedDate).endOf('month');
      
      let data;
      switch (viewType) {
        case 'all':
          if (isAdmin || isManager) {
            data = await fetchAllSchedules(startOfMonth.format('YYYY-MM-DD'), endOfMonth.format('YYYY-MM-DD'));
          }
          break;
        case 'department':
          if ((isAdmin || isManager) && selectedDepartment) {
            data = await fetchDepartmentSchedules(selectedDepartment, startOfMonth.format('YYYY-MM-DD'), endOfMonth.format('YYYY-MM-DD'));
          }
          break;
        case 'user':
          if ((isAdmin || isManager) && selectedUser) {
            data = await fetchUserSchedules(selectedUser, startOfMonth.format('YYYY-MM-DD'), endOfMonth.format('YYYY-MM-DD'));
          }
          break;
        case 'my-schedule':
        default:
          // Use getMySchedules instead of fetchUserSchedules for current user
          data = await getMySchedules(startOfMonth.format('YYYY-MM-DD'), endOfMonth.format('YYYY-MM-DD'));
          break;
      }
      
      setSchedules(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.response?.data?.message || 'Failed to load schedules');
      showNotification(err.response?.data?.message || 'Failed to load schedules', 'error');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewType, selectedDepartment, selectedUser, isAdmin, isManager]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const handleDelete = async (id) => {
    if (!hasEditPermission) {
      showNotification('Only managers and administrators can delete schedules', 'error');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteSchedule(id);
        await fetchScheduleData();
        showNotification('Schedule deleted successfully', 'success');
      } catch (err) {
        showNotification('Failed to delete schedule', 'error');
        console.error('Error deleting schedule:', err);
      }
    }
  };

  const handleEdit = (schedule) => {
    if (!hasEditPermission) {
      showNotification('Only managers and administrators can edit schedules', 'error');
      return;
    }
    setSelectedSchedule(schedule);
    setFormData({
      startDate: moment(schedule.startDate),
      endDate: moment(schedule.endDate),
      startTime: moment(schedule.startTime, 'HH:mm'),
      endTime: moment(schedule.endTime, 'HH:mm'),
      type: schedule.type,
      notes: schedule.notes || '',
      days: schedule.days
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      startDate: moment(),
      endDate: moment(),
      startTime: moment().set({ hour: 9, minute: 0 }),
      endTime: moment().set({ hour: 17, minute: 0 }),
      type: 'regular',
      notes: '',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });
    setSelectedSchedule(null);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            bgcolor: theme.palette.background.default
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1">
              Schedule Management
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

          {/* Schedule Grid */}
          <Grid container spacing={3}>
            {loading ? (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Typography>Loading schedules...</Typography>
                </Box>
              </Grid>
            ) : schedules.length > 0 ? (
              schedules.map((schedule) => (
                <Grid item xs={12} sm={6} md={4} key={schedule._id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" gutterBottom>
                          {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} Schedule
                        </Typography>
                        {hasEditPermission && (
                          <Box>
                            <IconButton size="small" onClick={() => handleEdit(schedule)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(schedule._id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon fontSize="small" />
                          <Typography variant="body2">
                            {moment(schedule.startDate).format('MMM D')} - {moment(schedule.endDate).format('MMM D, YYYY')}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          Time: {schedule.startTime} - {schedule.endTime}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {schedule.days.map((day) => (
                            <Chip
                              key={day}
                              label={day.charAt(0).toUpperCase() + day.slice(1)}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                        {schedule.notes && (
                          <Typography variant="body2" color="text.secondary">
                            Notes: {schedule.notes}
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Typography>No schedules found</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>

      {/* Add/Edit Schedule Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedSchedule ? 'Edit Schedule' : 'Add New Schedule'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(newValue) => setFormData(prev => ({ ...prev, startDate: newValue }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={(newValue) => setFormData(prev => ({ ...prev, endDate: newValue }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <TimePicker
                    label="Start Time"
                    value={formData.startTime}
                    onChange={(newValue) => setFormData(prev => ({ ...prev, startTime: newValue }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <TimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={(newValue) => setFormData(prev => ({ ...prev, endTime: newValue }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Schedule Type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="regular">Regular</MenuItem>
                  <MenuItem value="overtime">Overtime</MenuItem>
                  <MenuItem value="flexible">Flexible</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Working Days"
                  value={formData.days}
                  onChange={(e) => setFormData(prev => ({ ...prev, days: e.target.value }))}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={value.charAt(0).toUpperCase() + value.slice(1)}
                            size="small"
                          />
                        ))}
                      </Box>
                    ),
                  }}
                >
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <MenuItem key={day} value={day}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {selectedSchedule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Schedule;
