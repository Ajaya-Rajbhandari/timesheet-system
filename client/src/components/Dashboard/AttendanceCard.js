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
import { clockIn, clockOut, startBreak, endBreak } from '../../services/attendanceService';
import { useAttendance } from '../../contexts/AttendanceContext';
import moment from 'moment';

const AttendanceCard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  
  const { currentStatus, updateStatus, fetchCurrentStatus } = useAttendance();

  // Update current time and calculate elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = moment();
      setCurrentTime(now);
      
      if (currentStatus.isClockedIn && currentStatus.clockInTime) {
        const clockInMoment = moment(currentStatus.clockInTime);
        const duration = moment.duration(now.diff(clockInMoment));
        
        const hours = String(Math.floor(duration.asHours())).padStart(2, '0');
        const minutes = String(duration.minutes()).padStart(2, '0');
        const seconds = String(duration.seconds()).padStart(2, '0');
        
        setElapsedTime(`${hours}:${minutes}:${seconds}`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentStatus]);

  const handleClockIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await clockIn();
      await fetchCurrentStatus();
    } catch (err) {
      console.error('Error clocking in:', err);
      setError('Failed to clock in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await clockOut();
      await fetchCurrentStatus();
    } catch (err) {
      console.error('Error clocking out:', err);
      setError('Failed to clock out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await startBreak();
      await fetchCurrentStatus();
    } catch (err) {
      console.error('Error starting break:', err);
      setError('Failed to start break. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await endBreak();
      await fetchCurrentStatus();
    } catch (err) {
      console.error('Error ending break:', err);
      setError('Failed to end break. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = () => {
    if (currentStatus.onBreak) {
      return <Chip 
        label="On Break" 
        color="warning" 
        size="small" 
        icon={<FreeBreakfastIcon />} 
      />;
    } else if (currentStatus.isClockedIn) {
      return <Chip 
        label="Clocked In" 
        color="success" 
        size="small" 
        icon={<AccessTimeIcon />} 
      />;
    } else {
      return <Chip 
        label="Clocked Out" 
        color="error" 
        size="small" 
        icon={<TimerOffIcon />} 
      />;
    }
  };

  if (loading && !currentStatus) {
    return (
      <Card sx={{ minWidth: 275, mb: 2 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error && !currentStatus) {
    return (
      <Card sx={{ minWidth: 275, mb: 2 }}>
        <CardContent>
          <Typography color="error">{error}</Typography>
          <Button onClick={fetchCurrentStatus} sx={{ mt: 2 }}>
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
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Today: {currentTime.format('MMMM D, YYYY')}
          </Typography>
          
          {currentStatus && currentStatus.isClockedIn && (
            <Typography variant="body2" color="text.secondary">
              Elapsed Time: {elapsedTime}
            </Typography>
          )}
          
          {currentStatus && currentStatus.isClockedIn && (
            <Typography variant="body2" color="text.secondary">
              Clock In: {moment(currentStatus.clockInTime).format('h:mm:ss a')}
            </Typography>
          )}
          
          {currentStatus && currentStatus.clockOutTime && (
            <Typography variant="body2" color="text.secondary">
              Clock Out: {moment(currentStatus.clockOutTime).format('h:mm:ss a')}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!currentStatus?.isClockedIn && (
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
          
          {currentStatus?.isClockedIn && !currentStatus?.onBreak && (
            <>
              <Button 
                variant="contained" 
                color="error" 
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
          
          {currentStatus?.onBreak && (
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
