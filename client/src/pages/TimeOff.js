import React, { useState, useEffect, useCallback } from 'react';
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
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Event as EventIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { useAuth } from '../contexts/AuthContext';
import { 
  createTimeOffRequest, 
  getMyTimeOffRequests, 
  cancelTimeOffRequest 
} from '../services/timeOffService';

const TimeOff = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [formData, setFormData] = useState({
    type: '',
    startDate: null,
    endDate: null,
    reason: ''
  });
  const [error, setError] = useState(null);

  const timeOffTypes = [
    { value: 'vacation', label: 'Vacation' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'other', label: 'Other' }
  ];

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyTimeOffRequests(null, selectedYear);
      setRequests(data);
      setError(null);
    } catch (err) {
      setError('Failed to load time off requests');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createTimeOffRequest(formData);
      await fetchRequests();
      setOpenDialog(false);
      setFormData({
        type: '',
        startDate: null,
        endDate: null,
        reason: ''
      });
      setError(null);
    } catch (err) {
      setError('Failed to submit time off request');
      console.error('Error submitting request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      setLoading(true);
      await cancelTimeOffRequest(id);
      await fetchRequests();
      setError(null);
    } catch (err) {
      setError('Failed to cancel time off request');
      console.error('Error canceling request:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 4
    }}>
      <Container maxWidth="lg">
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: theme => `0 4px 20px ${alpha(theme.palette.error.main, 0.1)}`
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Header */}
        <Card sx={{ 
          mb: 4,
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          borderRadius: 4,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}>
          <CardContent sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 3
          }}>
            <Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Time Off Requests
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1 }}>
                Manage your time off requests and view their status
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ 
                py: 1.5,
                px: 3,
                borderRadius: 3,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
            >
              New Request
            </Button>
          </CardContent>
        </Card>

        {/* Time Off Summary */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: '100%',
              background: 'transparent',
              backdropFilter: 'blur(10px)',
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              borderRadius: 4,
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.18)'
            }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TimeIcon color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Pending Requests
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ 
                    textAlign: 'center',
                    color: theme.palette.warning.main,
                    fontWeight: 700
                  }}>
                    {requests.filter(r => r.status === 'pending').length}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: '100%',
              background: 'transparent',
              backdropFilter: 'blur(10px)',
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              borderRadius: 4,
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.18)'
            }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarIcon color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Approved Requests
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ 
                    textAlign: 'center',
                    color: theme.palette.success.main,
                    fontWeight: 700
                  }}>
                    {requests.filter(r => r.status === 'approved').length}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: '100%',
              background: 'transparent',
              backdropFilter: 'blur(10px)',
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              borderRadius: 4,
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.18)'
            }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DescriptionIcon color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Total Requests
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ 
                    textAlign: 'center',
                    color: theme.palette.primary.main,
                    fontWeight: 700
                  }}>
                    {requests.length}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Requests Table */}
        <Card sx={{ 
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          borderRadius: 4,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  views={['year']}
                  label="Select Year"
                  value={moment().year(selectedYear)}
                  onChange={(newValue) => setSelectedYear(newValue.year())}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      sx={{ 
                        width: 200,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          bgcolor: 'background.paper'
                        }
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Box>

            <TableContainer sx={{ 
              borderRadius: 3,
              bgcolor: 'background.paper',
              boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)'
            }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request._id} hover>
                      <TableCell>
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </TableCell>
                      <TableCell>
                        {moment(request.startDate).format('MMM D, YYYY')}
                      </TableCell>
                      <TableCell>
                        {moment(request.endDate).format('MMM D, YYYY')}
                      </TableCell>
                      <TableCell>
                        {moment(request.endDate).diff(moment(request.startDate), 'days') + 1} days
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          color={
                            request.status === 'approved' ? 'success' :
                            request.status === 'pending' ? 'warning' : 'error'
                          }
                          size="small"
                          sx={{ borderRadius: 2 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={request.reason}>
                          <Typography noWrap sx={{ maxWidth: 200 }}>
                            {request.reason}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleCancel(request._id)}
                            sx={{ borderRadius: 2 }}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* New Request Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(10px)'
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              New Time Off Request
            </Typography>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pb: 2 }}>
              <Stack spacing={3}>
                <TextField
                  select
                  label="Type of Leave"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                >
                  {timeOffTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(newValue) => setFormData({ ...formData, startDate: newValue })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                      />
                    )}
                    minDate={moment()}
                  />
                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={(newValue) => setFormData({ ...formData, endDate: newValue })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                      />
                    )}
                    minDate={formData.startDate || moment()}
                  />
                </LocalizationProvider>

                <TextField
                  label="Reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  multiline
                  rows={4}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                onClick={() => setOpenDialog(false)}
                sx={{ 
                  borderRadius: 3,
                  px: 3
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="contained"
                sx={{ 
                  borderRadius: 3,
                  px: 3,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
                }}
              >
                Submit Request
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TimeOff;
