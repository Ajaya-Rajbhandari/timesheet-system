import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Info as InfoIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { getDepartmentShiftSwaps, approveShiftSwap } from '../services/shiftSwapService';

const ApprovalDialog = ({ open, onClose, swap, onApprove }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApproval = async (approved) => {
    setLoading(true);
    setError('');
    try {
      await onApprove(swap._id, approved, notes);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Review Shift Swap Request
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Swap Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">
                      Requesting Employee
                    </Typography>
                    <Typography gutterBottom>
                      {swap?.requestingUser.firstName} {swap?.requestingUser.lastName}
                    </Typography>
                    <Typography variant="subtitle2">
                      Original Schedule
                    </Typography>
                    <Typography>
                      {new Date(swap?.requestingSchedule.startDate).toLocaleDateString()} - 
                      {new Date(swap?.requestingSchedule.endDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">
                      Target Employee
                    </Typography>
                    <Typography gutterBottom>
                      {swap?.targetUser.firstName} {swap?.targetUser.lastName}
                    </Typography>
                    <Typography variant="subtitle2">
                      Target Schedule
                    </Typography>
                    <Typography>
                      {new Date(swap?.targetSchedule.startDate).toLocaleDateString()} - 
                      {new Date(swap?.targetSchedule.endDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Reason for Swap
            </Typography>
            <Typography color="textSecondary" paragraph>
              {swap?.reason}
            </Typography>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">
                {error}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Manager Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or comments about this swap approval"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={() => handleApproval(false)}
          color="error"
          disabled={loading}
          startIcon={<RejectIcon />}
        >
          Reject
        </Button>
        <Button
          onClick={() => handleApproval(true)}
          color="success"
          variant="contained"
          disabled={loading}
          startIcon={<ApproveIcon />}
        >
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ManagerSwapApproval = () => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected

  useEffect(() => {
    if (!['admin', 'manager'].includes(user.role)) {
      setError('Unauthorized access');
      return;
    }
    fetchSwaps();
  }, [user.role]);

  const fetchSwaps = async () => {
    try {
      // Get swaps for the department
      if (!user || !user.department || !user.department._id) {
        console.error('User department information is missing');
        setError('Department information is missing');
        setLoading(false);
        return;
      }
      
      const departmentId = user.department._id || user.department;
      const data = await getDepartmentShiftSwaps(departmentId);
      setSwaps(data);
    } catch (err) {
      console.error('Error fetching shift swaps:', err);
      setError('Failed to load shift swaps');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (swapId, approved, notes) => {
    try {
      await approveShiftSwap(swapId, {
        approved,
        notes
      });
      await fetchSwaps();
    } catch (err) {
      throw err;
    }
  };

  const filteredSwaps = swaps.filter(swap => {
    switch (filter) {
      case 'pending':
        return swap.status === 'approved' && !swap.managerApproval;
      case 'approved':
        return swap.managerApproval?.approved === true;
      case 'rejected':
        return swap.managerApproval?.approved === false;
      default:
        return true;
    }
  });

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Shift Swap Approvals
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant={filter === 'pending' ? 'contained' : 'outlined'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'approved' ? 'contained' : 'outlined'}
            onClick={() => setFilter('approved')}
          >
            Approved
          </Button>
          <Button
            variant={filter === 'rejected' ? 'contained' : 'outlined'}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {filteredSwaps.map((swap) => (
          <Grid item xs={12} key={swap._id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Shift Swap Request
                  </Typography>
                  <Chip
                    label={swap.managerApproval ? 
                      (swap.managerApproval.approved ? 'APPROVED' : 'REJECTED') : 
                      'PENDING APPROVAL'}
                    color={swap.managerApproval ? 
                      (swap.managerApproval.approved ? 'success' : 'error') : 
                      'warning'}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">
                      From: {swap.requestingUser.firstName} {swap.requestingUser.lastName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Schedule: {new Date(swap.requestingSchedule.startDate).toLocaleDateString()} - 
                      {new Date(swap.requestingSchedule.endDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">
                      To: {swap.targetUser.firstName} {swap.targetUser.lastName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Schedule: {new Date(swap.targetSchedule.startDate).toLocaleDateString()} - 
                      {new Date(swap.targetSchedule.endDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Reason for Swap:
                </Typography>
                <Typography color="textSecondary" paragraph>
                  {swap.reason}
                </Typography>

                {!swap.managerApproval && (
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        setSelectedSwap(swap);
                        setApprovalDialogOpen(true);
                      }}
                    >
                      Review Request
                    </Button>
                  </Box>
                )}

                {swap.managerApproval && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Manager Notes:
                    </Typography>
                    <Typography color="textSecondary">
                      {swap.managerApproval.notes || 'No notes provided'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mt={1}>
                      Reviewed by: {swap.managerApproval.approvedBy.firstName} {swap.managerApproval.approvedBy.lastName}
                      <br />
                      Date: {new Date(swap.managerApproval.approvalDate).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}

        {filteredSwaps.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              No shift swap requests {filter === 'pending' ? 'pending approval' : `${filter}`} at this time.
            </Alert>
          </Grid>
        )}
      </Grid>

      {selectedSwap && (
        <ApprovalDialog
          open={approvalDialogOpen}
          onClose={() => {
            setApprovalDialogOpen(false);
            setSelectedSwap(null);
          }}
          swap={selectedSwap}
          onApprove={handleApprove}
        />
      )}
    </Box>
  );
};

export default ManagerSwapApproval; 