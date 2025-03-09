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
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { mockAttendanceHistory, mockCurrentStatus } from '../services/mockData';

const Attendance = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [currentStatus, setCurrentStatus] = useState({
    isClockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    onBreak: false,
    breakStartTime: null
  });
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current status and attendance history
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Temporarily using mock data
        setCurrentStatus(mockCurrentStatus);
        setAttendanceHistory(mockAttendanceHistory);
        
        /* Commented out until backend is ready
        const [statusResponse, historyResponse] = await Promise.all([
          api.get('/attendance/status'),
          api.get('/attendance/history', {
            params: {
              month: selectedMonth.format('YYYY-MM')
            }
          })
        ]);
        
        setCurrentStatus(statusResponse.data);
        setAttendanceHistory(historyResponse.data);
        */
      } catch (err) {
        setError('Failed to load attendance data. Please try again.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  const handleClockIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Temporarily using mock data
      const mockResponse = {
        data: {
          clockInTime: moment().format()
        }
      };
      
      /* Commented out until backend is ready
      const response = await api.post('/attendance/clock-in');
      */
      
      setCurrentStatus({
        ...currentStatus,
        isClockedIn: true,
        clockInTime: mockResponse.data.clockInTime
      });
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
      
      // Temporarily using mock data
      const mockResponse = {
        data: {
          clockOutTime: moment().format()
        }
      };
      
      /* Commented out until backend is ready
      const response = await api.post('/attendance/clock-out');
      */
      
      setCurrentStatus({
        ...currentStatus,
        isClockedIn: false,
        clockOutTime: mockResponse.data.clockOutTime
      });

      // Add the completed attendance record to history
      setAttendanceHistory([
        {
          id: Date.now(),
          date: moment().format('YYYY-MM-DD'),
          clockIn: currentStatus.clockInTime,
          clockOut: mockResponse.data.clockOutTime,
          status: 'Present'
        },
        ...attendanceHistory
      ]);
    } catch (err) {
      setError('Failed to clock out. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
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

      {/* Status Card */}
      <Card sx={{
        mb: 4,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(37, 37, 37, 0.9), rgba(30, 30, 30, 0.9))'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.9))',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Chip
            icon={currentStatus.isClockedIn ? <CheckIcon /> : <CancelIcon />}
            label={currentStatus.isClockedIn ? 'Clocked In' : 'Clocked Out'}
            color={currentStatus.isClockedIn ? 'success' : 'error'}
            sx={{ mb: 3, px: 2, py: 3, fontSize: '1.1rem' }}
          />
          
          <Box sx={{ mt: 2 }}>
            {currentStatus.isClockedIn ? (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Clocked in at: {moment(currentStatus.clockInTime).format('HH:mm')}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<TimerIcon />}
                  onClick={handleClockOut}
                  disabled={loading}
                  sx={{ minWidth: 200 }}
                >
                  Clock Out
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Ready to start your day?
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ClockIcon />}
                  onClick={handleClockIn}
                  disabled={loading}
                  sx={{ minWidth: 200 }}
                >
                  Clock In
                </Button>
              </>
            )}
          </Box>
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