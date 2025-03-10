import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  SwapHoriz as SwapIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Schedule as PendingIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from '../utils/axios';
import { getMyShiftSwaps, respondToShiftSwap } from '../services/shiftSwapService';

const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default'
};

const statusIcons = {
  pending: <PendingIcon />,
  approved: <ApproveIcon />,
  rejected: <RejectIcon />,
  cancelled: <CloseIcon />
};

const SwapResponseDialog = ({ open, onClose, swap, onRespond }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResponse = async (status) => {
    setLoading(true);
    setError('');
    try {
      await onRespond(swap._id, status, notes);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond to swap request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Respond to Shift Swap Request</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            From: {swap?.requestingUser.firstName} {swap?.requestingUser.lastName}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Requesting to swap:
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Their shift: {new Date(swap?.requestingSchedule.startDate).toLocaleDateString()} - 
            {new Date(swap?.requestingSchedule.endDate).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Your shift: {new Date(swap?.targetSchedule.startDate).toLocaleDateString()} - 
            {new Date(swap?.targetSchedule.endDate).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Reason: {swap?.reason}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Response Notes (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => handleResponse('rejected')}
          color="error"
          disabled={loading}
        >
          Reject
        </Button>
        <Button
          onClick={() => handleResponse('approved')}
          color="success"
          variant="contained"
          disabled={loading}
        >
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SwapHistoryTimeline = ({ swap }) => {
  return (
    <Timeline>
      <TimelineItem>
        <TimelineSeparator>
          <TimelineDot color="primary">
            <SwapIcon />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Typography variant="subtitle2">
            Request Created
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {new Date(swap.requestDate).toLocaleString()}
          </Typography>
        </TimelineContent>
      </TimelineItem>

      {swap.responseDate && (
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color={statusColors[swap.status]}>
              {statusIcons[swap.status]}
            </TimelineDot>
            {swap.managerApproval && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="subtitle2">
              {swap.status === 'approved' ? 'Approved' : 'Rejected'} by {swap.targetUser.firstName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {new Date(swap.responseDate).toLocaleString()}
            </Typography>
            {swap.notes && (
              <Typography variant="body2" color="textSecondary">
                Notes: {swap.notes}
              </Typography>
            )}
          </TimelineContent>
        </TimelineItem>
      )}

      {swap.managerApproval?.approvalDate && (
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color={swap.managerApproval.approved ? 'success' : 'error'}>
              {swap.managerApproval.approved ? <ApproveIcon /> : <RejectIcon />}
            </TimelineDot>
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="subtitle2">
              Manager {swap.managerApproval.approved ? 'Approved' : 'Rejected'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {new Date(swap.managerApproval.approvalDate).toLocaleString()}
            </Typography>
            {swap.managerApproval.notes && (
              <Typography variant="body2" color="textSecondary">
                Notes: {swap.managerApproval.notes}
              </Typography>
            )}
          </TimelineContent>
        </TimelineItem>
      )}
    </Timeline>
  );
};

const ShiftSwapHistory = () => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    try {
      const data = await getMyShiftSwaps();
      setSwaps(data);
    } catch (err) {
      console.error('Error fetching shift swaps:', err);
      setError('Failed to load shift swap history');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (swapId, status, notes) => {
    try {
      await respondToShiftSwap(swapId, { status, notes });
      await fetchSwaps();
    } catch (err) {
      throw err;
    }
  };

  const filterSwaps = (type) => {
    switch (type) {
      case 0: // All
        return swaps;
      case 1: // Outgoing
        return swaps.filter(swap => swap.requestingUser._id === user._id);
      case 2: // Incoming
        return swaps.filter(swap => swap.targetUser._id === user._id);
      default:
        return swaps;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{ mb: 2 }}
      >
        <Tab label="All Swaps" />
        <Tab label="Outgoing Requests" />
        <Tab label="Incoming Requests" />
      </Tabs>

      <Grid container spacing={2}>
        {filterSwaps(tabValue).map((swap) => (
          <Grid item xs={12} key={swap._id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Shift Swap Request
                  </Typography>
                  <Chip
                    label={swap.status.toUpperCase()}
                    color={statusColors[swap.status]}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">
                      From: {swap.requestingUser.firstName} {swap.requestingUser.lastName}
                    </Typography>
                    <Typography variant="subtitle2">
                      To: {swap.targetUser.firstName} {swap.targetUser.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      Requesting Schedule: {new Date(swap.requestingSchedule.startDate).toLocaleDateString()} - 
                      {new Date(swap.requestingSchedule.endDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      Target Schedule: {new Date(swap.targetSchedule.startDate).toLocaleDateString()} - 
                      {new Date(swap.targetSchedule.endDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />
                
                <SwapHistoryTimeline swap={swap} />

                {swap.targetUser._id === user._id && swap.status === 'pending' && (
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        setSelectedSwap(swap);
                        setResponseDialogOpen(true);
                      }}
                    >
                      Respond to Request
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedSwap && (
        <SwapResponseDialog
          open={responseDialogOpen}
          onClose={() => {
            setResponseDialogOpen(false);
            setSelectedSwap(null);
          }}
          swap={selectedSwap}
          onRespond={handleRespond}
        />
      )}
    </Box>
  );
};

export default ShiftSwapHistory; 