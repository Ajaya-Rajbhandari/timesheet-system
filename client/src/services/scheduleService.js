import api from './api';

// Get all schedules (admin/manager)
export const getAllSchedules = async (startDate, endDate, department) => {
  try {
    const response = await api.get('/schedules', {
      params: { startDate, endDate, department }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting schedules';
  }
};

// Get schedules (admin/manager)
export const getSchedules = async (startDate, endDate) => {
  try {
    const response = await api.get('/schedules', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting schedules';
  }
};

// Get current user's schedules
export const getMySchedules = async (startDate, endDate) => {
  try {
    const response = await api.get('/schedules/my-schedule', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting your schedules';
  }
};

// Get schedules for a specific user
export const getUserSchedules = async (userId, startDate, endDate) => {
  try {
    const response = await api.get(`/schedules/user/${userId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting user schedules';
  }
};

// Get schedule by ID
export const getScheduleById = async (id) => {
  try {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting schedule';
  }
};

// Create new schedule (admin/manager)
export const createSchedule = async (data) => {
  try {
    const response = await api.post('/schedules', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error creating schedule';
  }
};

// Update schedule (admin/manager)
export const updateSchedule = async (id, data) => {
  try {
    const response = await api.put(`/schedules/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error updating schedule';
  }
};

// Delete schedule (admin/manager)
export const deleteSchedule = async (id) => {
  try {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error deleting schedule';
  }
};

// Get schedules by department (admin/manager)
export const getSchedulesByDepartment = async (department, startDate, endDate) => {
  try {
    const response = await api.get(`/schedules/department/${department}`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting department schedules';
  }
};
