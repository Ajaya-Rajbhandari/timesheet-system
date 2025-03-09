import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  CircularProgress,
  Chip
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';
import { getCurrentStatus, clockIn, clockOut, startBreak, endBreak } from '../../services/attendanceService';
import moment from 'moment';

const AttendanceCard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Fetch current attendance status
  const fetchAttendanceStatus = async () => {
    try {
      setLoading(true);
      const data = await getCurrentStatus();
      setAttendanceStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching attendance status:', err);
      setError('Failed to load attendance status');
    } finally {
      setLoading(false);
    }
  };

  // Handle clock in
  const handleClockIn = async () => {
    try {
      setLoading(true);
      await clockIn();
      fetchAttendanceStatus();
    } catch (err) {
      console.error('Error clocking in:', err);
      setError('Failed to clock in');
      setLoading(false);
    }
  };

  // Handle clock out
  const handleClockOut = async () => {
    try {
      setLoading(true);
      await clockOut();
      fetchAttendanceStatus();
    } catch (err) {
      console.error('Error clocking out:', err);
      setError('Failed to clock out');
      setLoading(false);
    }
  };

  // Handle start break
  const handleStartBreak = async () => {
    try {
      setLoading(true);
      await startBreak();
      fetchAttendanceStatus();
    } catch (err) {
      console.error('Error starting break:', err);
      setError('Failed to start break');
      setLoading(false);
    }
  };

  // Handle end break
  const handleEndBreak = async () => {
    try {
      setLoading(true);
      await endBreak();
      fetchAttendanceStatus();
    } catch (err) {
      console.error('Error ending break:', err);
      setError('Failed to end break');
      setLoading(false);
    }
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment());
      
      // Calculate elapsed time if clocked in
      if (attendanceStatus && attendanceStatus.isClockedIn && !attendanceStatus.isClockedOut) {
        const start = moment(attendanceStatus.clockIn);
        const duration = moment.duration(moment().diff(start));
        
        // Subtract break time if on break
        if (attendanceStatus.isOnBreak) {
          const breakStart = moment(attendanceStatus.breakStart);
          const breakDuration = moment.duration(moment().diff(breakStart));
          duration.subtract(breakDuration);
        }
        
        // Format as HH:MM:SS
        const hours = String(Math.floor(duration.asHours())).padStart(2, '0');
        const minutes = String(duration.minutes()).padStart(2, '0');
        const seconds = String(duration.seconds()).padStart(2, '0');
        
        setElapsedTime(`${hours}:${minutes}:${seconds}`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [attendanceStatus]);

  // Fetch attendance status on component mount
  useEffect(() => {
    fetchAttendanceStatus();
  }, []);

  // Get status chip color and label
  const getStatusChip = () => {
    if (!attendanceStatus) return null;
    
    if (attendanceStatus.isClockedOut) {
      return <Chip label="Clocked Out" color="error" />;
    }
    
    if (attendanceStatus.isOnBreak) {
      return <Chip label="On Break" color="warning" />;
    }
    
    if (attendanceStatus.isClockedIn) {
      return <Chip label="Clocked In" color="success" />;
    }
    
    return <Chip label="Not Clocked In" color="default" />;
  };

  if (loading && !attendanceStatus) {
    return (
      <Card sx={{ minWidth: 275, mb: 2 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error && !attendanceStatus) {
    return (
      <Card sx={{ minWidth: 275, mb: 2 }}>
        <CardContent>
          <Typography color="error">{error}</Typography>
          <Button onClick={fetchAttendanceStatus} sx={{ mt: 2 }}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Attendance
          </Typography>
          {getStatusChip()}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Current Time: {currentTime.format('MMMM Do YYYY, h:mm:ss a')}
          </Typography>
          
          {attendanceStatus && attendanceStatus.isClockedIn && !attendanceStatus.isClockedOut && (
            <Typography variant="body2" color="text.secondary">
              Elapsed Time: {elapsedTime}
            </Typography>
          )}
          
          {attendanceStatus && attendanceStatus.isClockedIn && (
            <Typography variant="body2" color="text.secondary">
              Clock In: {moment(attendanceStatus.clockIn).format('h:mm:ss a')}
            </Typography>
          )}
          
          {attendanceStatus && attendanceStatus.isClockedOut && (
            <Typography variant="body2" color="text.secondary">
              Clock Out: {moment(attendanceStatus.clockOut).format('h:mm:ss a')}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!attendanceStatus?.isClockedIn && (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AccessTimeIcon />}
              onClick={handleClockIn}
              disabled={loading}
            >
              Clock In
            </Button>
          )}
          
          {attendanceStatus?.isClockedIn && !attendanceStatus?.isClockedOut && !attendanceStatus?.isOnBreak && (
            <>
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<TimerOffIcon />}
                onClick={handleClockOut}
                disabled={loading}
              >
                Clock Out
              </Button>
              
              <Button 
                variant="outlined" 
                color="warning" 
                startIcon={<FreeBreakfastIcon />}
                onClick={handleStartBreak}
                disabled={loading}
              >
                Start Break
              </Button>
            </>
          )}
          
          {attendanceStatus?.isOnBreak && (
            <Button 
              variant="outlined" 
              color="warning" 
              startIcon={<FreeBreakfastIcon />}
              onClick={handleEndBreak}
              disabled={loading}
            >
              End Break
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AttendanceCard;
