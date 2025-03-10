import React, { useState, useEffect } from 'react';
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
  alpha
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import {
  AccessTime as ClockIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import moment from 'moment';
import { useAuth } from '../contexts/AuthContext';
import { useAttendance } from '../contexts/AttendanceContext';
import { 
  clockIn, 
  clockOut, 
  getCurrentStatus, 
  getAttendanceHistory,
  recordAutoClockOut
} from '../services/attendanceService';

const Attendance = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const { currentStatus, updateStatus, fetchCurrentStatus } = useAttendance();
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // Update current time every minute and check for day change
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = moment();
      setCurrentTime(newTime);
      
      // Check if it's a new day and reset status if needed
      const lastClockInDay = currentStatus.clockInTime ? moment(currentStatus.clockInTime).format('YYYY-MM-DD') : null;
      const today = newTime.format('YYYY-MM-DD');
      
      if (lastClockInDay && lastClockInDay !== today && currentStatus.isClockedIn) {
        // Auto clock-out at the end of the previous day
        const yesterdayEndTime = moment(lastClockInDay).endOf('day').format();
        
        // Create new status with clock-out
        const newStatus = {
          isClockedIn: false,
          clockInTime: null,
          clockOutTime: null,
          onBreak: false,
          breakStartTime: null
        };
        
        updateStatus(newStatus);
        
        // Add record for auto clock out
        const newRecord = {
          id: Date.now(),
          date: lastClockInDay,
          clockIn: currentStatus.clockInTime,
          clockOut: yesterdayEndTime,
          status: 'Auto-completed',
          notes: 'System auto clock-out at end of day'
        };
        
        setAttendanceHistory(prev => [newRecord, ...prev]);
      }
    }, 60000);
    
    return () => clearInterval(timer);
  }, [currentStatus, updateStatus]);

  // Fetch attendance data on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get the current status from the API
      try {
        // Use fetchCurrentStatus from the AttendanceContext instead
        await fetchCurrentStatus();
      } catch (err) {
        // If API call fails, use the data from localStorage
        console.log('Using cached attendance status from localStorage');
      }
      
      // Get attendance history
      try {
        const startDate = selectedMonth.clone().startOf('month').format('YYYY-MM-DD');
        const endDate = selectedMonth.clone().endOf('month').format('YYYY-MM-DD');
        const historyData = await getAttendanceHistory(startDate, endDate);
        setAttendanceHistory(historyData);
      } catch (err) {
        console.error('Failed to fetch attendance history:', err);
        setAttendanceHistory([]);
      }
    } catch (err) {
      setError('Failed to load attendance data. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let clockInTime = moment().format();
      
      try {
        // Try to call the API
        const response = await clockIn();
        clockInTime = response.clockInTime || clockInTime;
        
        // Refresh the attendance status from the server
        await fetchCurrentStatus();
      } catch (err) {
        console.error('API call failed, using local time:', err);
        // Continue with local time if API fails
        
        // Update local status
        const newStatus = {
          ...currentStatus,
          isClockedIn: true,
          clockInTime: clockInTime
        };
        
        updateStatus(newStatus);
      }
    } catch (err) {
      setError('Failed to clock in. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let clockOutTime = moment().format();
      
      try {
        // Try to call the API
        const response = await clockOut();
        clockOutTime = response.clockOutTime || clockOutTime;
        
        // Refresh the attendance status from the server
        await fetchCurrentStatus();
      } catch (err) {
        console.error('API call failed, using local time:', err);
        // Continue with local time if API fails
        
        // Update local status
        const newStatus = {
          ...currentStatus,
          isClockedIn: false,
          onBreak: false,
          clockOutTime: clockOutTime
        };
        
        updateStatus(newStatus);
      }
    } catch (err) {
      setError('Failed to clock out. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate time elapsed since clock in
  const getElapsedTime = () => {
    if (!currentStatus.isClockedIn || !currentStatus.clockInTime) {
      return '00:00:00';
    }
    
    const clockInMoment = moment(currentStatus.clockInTime);
    const duration = moment.duration(currentTime.diff(clockInMoment));
    
    const hours = String(Math.floor(duration.asHours())).padStart(2, '0');
    const minutes = String(duration.minutes()).padStart(2, '0');
    const seconds = String(duration.seconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  };
  
  // Check if user has been clocked in for too long (more than 12 hours)
  const isLongShift = () => {
    if (!currentStatus.isClockedIn || !currentStatus.clockInTime) {
      return false;
    }
    
    const clockInMoment = moment(currentStatus.clockInTime);
    const duration = moment.duration(currentTime.diff(clockInMoment));
    
    return duration.asHours() >= 12;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Welcome Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ 
          fontWeight: 600,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(45deg, #64B5F6 30%, #81D4FA 90%)'
            : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Welcome, {user?.firstName}
        </Typography>
        <Typography variant="h6" color="textSecondary">
          {currentTime.format('dddd, MMMM D, YYYY')}
        </Typography>
        <Typography variant="h3" sx={{ fontFamily: 'monospace', mt: 2 }}>
          {currentTime.format('HH:mm')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {currentStatus.isClockedIn && isLongShift() && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have been clocked in for more than 12 hours. Please remember to clock out when your shift ends.
        </Alert>
      )}

      {/* Status Card */}
      <Card sx={{ 
        mb: 4, 
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
          : '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: 2, 
          background: currentStatus.isClockedIn 
            ? 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)'
            : 'linear-gradient(45deg, #F44336 30%, #E57373 90%)',
          color: 'white'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Current Status: {currentStatus.isClockedIn ? 'Clocked In' : 'Clocked Out'}
          </Typography>
        </Box>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
                <ClockIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {currentStatus.isClockedIn ? 'Clocked in at:' : 'Last clock out:'}
                  </Typography>
                  <Typography variant="h6">
                    {currentStatus.isClockedIn && currentStatus.clockInTime 
                      ? moment(currentStatus.clockInTime).format('hh:mm A')
                      : currentStatus.clockOutTime 
                        ? moment(currentStatus.clockOutTime).format('hh:mm A')
                        : 'Not available'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            {currentStatus.isClockedIn && (
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimerIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Time elapsed:
                    </Typography>
                    <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                      {getElapsedTime()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                {!currentStatus.isClockedIn ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<ClockIcon />}
                    onClick={handleClockIn}
                    disabled={loading}
                    sx={{ minWidth: 150 }}
                  >
                    Clock In
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    startIcon={<ClockIcon />}
                    onClick={handleClockOut}
                    disabled={loading}
                    sx={{ minWidth: 150 }}
                  >
                    Clock Out
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* History Section */}
      <Card sx={{ 
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(37, 37, 37, 0.9), rgba(30, 30, 30, 0.9))'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.9))',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Attendance History</Typography>
            <DatePicker
              views={['month', 'year']}
              value={selectedMonth}
              onChange={(newValue) => setSelectedMonth(newValue)}
              slotProps={{ textField: { size: 'small' } }}
            />
          </Box>
          
          <TableContainer component={Paper} sx={{ 
            background: 'transparent',
            boxShadow: 'none'
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{moment(record.date).format('MMM D, YYYY')}</TableCell>
                    <TableCell>{moment(record.clockIn).format('HH:mm')}</TableCell>
                    <TableCell>
                      {record.clockOut ? moment(record.clockOut).format('HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      {record.clockOut 
                        ? moment.duration(moment(record.clockOut).diff(record.clockIn)).asHours().toFixed(2)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={
                          record.status === 'Present' ? 'success' :
                          record.status === 'Late' ? 'warning' :
                          'error'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Attendance; 