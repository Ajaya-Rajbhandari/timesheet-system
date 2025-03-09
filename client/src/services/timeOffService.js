import api from './api';

// Create time-off request
export const createTimeOffRequest = async (data) => {
  try {
    const response = await api.post('/timeoff', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error creating time-off request';
  }
};

// Get current user's time-off requests
export const getMyTimeOffRequests = async (status, year) => {
  try {
    const response = await api.get('/timeoff/my-requests', {
      params: { status, year }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting your time-off requests';
  }
};

// Get time-off requests (admin/manager)
export const getTimeOffRequests = async (status, startDate, endDate) => {
  try {
    const response = await api.get('/timeoff', {
      params: { status, startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting time-off requests';
  }
};

// Get all time-off requests (admin/manager)
export const getAllTimeOffRequests = async (status, startDate, endDate) => {
  try {
    const response = await api.get('/timeoff', {
      params: { status, startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting time-off requests';
  }
};

// Get time-off request by ID
export const getTimeOffRequestById = async (id) => {
  try {
    const response = await api.get(`/timeoff/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting time-off request';
  }
};

// Update time-off request (only if pending)
export const updateTimeOffRequest = async (id, data) => {
  try {
    const response = await api.put(`/timeoff/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error updating time-off request';
  }
};

// Approve/reject time-off request (admin/manager)
export const updateTimeOffStatus = async (id, status, comment) => {
  try {
    const response = await api.put(`/timeoff/${id}/status`, { status, comment });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error updating time-off status';
  }
};

// Cancel time-off request
export const cancelTimeOffRequest = async (id) => {
  try {
    const response = await api.put(`/timeoff/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error canceling time-off request';
  }
};

// Add comment to time-off request
export const addTimeOffComment = async (id, text) => {
  try {
    const response = await api.post(`/timeoff/${id}/comment`, { text });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error adding comment';
  }
};

// Get time-off requests for a specific user
export const getUserTimeOffRequests = async (userId, status, year) => {
  try {
    const response = await api.get(`/timeoff/user/${userId}`, {
      params: { status, year }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting user time-off requests';
  }
};
