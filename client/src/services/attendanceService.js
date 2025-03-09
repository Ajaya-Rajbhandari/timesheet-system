import api from './api';

// Clock in
export const clockIn = async () => {
  try {
    const response = await api.post('/attendance/clock-in');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error clocking in';
  }
};

// Clock out
export const clockOut = async () => {
  try {
    const response = await api.put('/attendance/clock-out');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error clocking out';
  }
};

// Start break
export const startBreak = async () => {
  try {
    const response = await api.post('/attendance/break/start');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error starting break';
  }
};

// End break
export const endBreak = async () => {
  try {
    const response = await api.put('/attendance/break/end');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error ending break';
  }
};

// Get current attendance status
export const getCurrentStatus = async () => {
  try {
    const response = await api.get('/attendance/current');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting current status';
  }
};

// Get attendance history
export const getAttendanceHistory = async (startDate, endDate) => {
  try {
    const response = await api.get('/attendance/history', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting attendance history';
  }
};

// Get user attendance (admin/manager only)
export const getUserAttendance = async (userId, startDate, endDate) => {
  try {
    const response = await api.get(`/attendance/user/${userId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting user attendance';
  }
};

// Create manual attendance entry (admin/manager)
export const createManualAttendance = async (data) => {
  try {
    const response = await api.post('/attendance/manual', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error creating manual attendance';
  }
};

// Update attendance record (admin/manager)
export const updateAttendance = async (id, data) => {
  try {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error updating attendance';
  }
};

// Delete attendance record (admin/manager)
export const deleteAttendance = async (id) => {
  try {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error deleting attendance';
  }
};
