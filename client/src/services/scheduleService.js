import axios from '../utils/axios';

// Get all schedules (admin/manager)
export const fetchAllSchedules = async (startDate, endDate) => {
  if (!startDate || !endDate) {
    throw 'Start date and end date are required';
  }
  try {
    const response = await axios.get('/schedules', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw 'Please log in to view all schedules';
    }
    if (error.response?.status === 403) {
      throw 'Only managers and administrators can view all schedules';
    }
    throw error.response?.data?.message || 'Error getting schedules';
  }
};

// Get current user's schedules
export const getMySchedules = async (startDate, endDate) => {
  if (!startDate || !endDate) {
    throw 'Start date and end date are required';
  }
  try {
    const response = await axios.get('/schedules/my-schedule', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw 'Please log in to view your schedules';
    }
    throw error.response?.data?.message || 'Error getting your schedules';
  }
};

// Get schedules for a specific user (admin/manager only)
export const fetchUserSchedules = async (userId, startDate, endDate) => {
  if (!userId) {
    throw 'User ID is required';
  }
  if (!startDate || !endDate) {
    throw 'Start date and end date are required';
  }
  try {
    const response = await axios.get(`/schedules/user/${userId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw 'Please log in to view user schedules';
    }
    if (error.response?.status === 403) {
      throw 'You do not have permission to view this user\'s schedules';
    }
    throw error.response?.data?.message || 'Error getting user schedules';
  }
};

// Get schedules by department (admin/manager only)
export const fetchDepartmentSchedules = async (department, startDate, endDate) => {
  if (!department) {
    throw 'Department is required';
  }
  if (!startDate || !endDate) {
    throw 'Start date and end date are required';
  }
  try {
    const response = await axios.get(`/schedules/department/${department}`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw 'Please log in to view department schedules';
    }
    if (error.response?.status === 403) {
      throw 'You do not have permission to view department schedules';
    }
    throw error.response?.data?.message || 'Error fetching department schedules';
  }
};

// Create a new schedule (admin/manager only)
export const createSchedule = async (scheduleData) => {
  if (!scheduleData) {
    throw 'Schedule data is required';
  }
  try {
    const response = await axios.post('/schedules', scheduleData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw 'Please log in to create a schedule';
    }
    if (error.response?.status === 403) {
      throw 'Only managers and administrators can create schedules';
    }
    throw error.response?.data?.message || 'Error creating schedule';
  }
};

// Update an existing schedule (admin/manager only)
export const updateSchedule = async (id, scheduleData) => {
  if (!id) {
    throw 'Schedule ID is required';
  }
  if (!scheduleData) {
    throw 'Schedule data is required';
  }
  try {
    const response = await axios.put(`/schedules/${id}`, scheduleData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw 'Please log in to update a schedule';
    }
    if (error.response?.status === 403) {
      throw 'Only managers and administrators can update schedules';
    }
    throw error.response?.data?.message || 'Error updating schedule';
  }
};

// Delete a schedule (admin/manager only)
export const deleteSchedule = async (id) => {
  if (!id) {
    throw 'Schedule ID is required';
  }
  try {
    await axios.delete(`/schedules/${id}`);
  } catch (error) {
    if (error.response?.status === 401) {
      throw 'Please log in to delete a schedule';
    }
    if (error.response?.status === 403) {
      throw 'Only managers and administrators can delete schedules';
    }
    throw error.response?.data?.message || 'Error deleting schedule';
  }
};

// Get schedule by ID
export const getScheduleById = async (id) => {
  if (!id) {
    throw 'Schedule ID is required';
  }
  try {
    const response = await axios.get(`/schedules/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw 'Please log in to view schedule';
    }
    if (error.response?.status === 403) {
      throw 'You do not have permission to view this schedule';
    }
    throw error.response?.data?.message || 'Error getting schedule';
  }
};
