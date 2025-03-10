import api from './api';

/**
 * Clock in the current user
 * @returns {Promise} Promise object with clock in data
 */
export const clockIn = async () => {
  const response = await api.post('/attendance/clock-in');
  return response.data;
};

/**
 * Clock out the current user
 * @returns {Promise} Promise object with clock out data
 */
export const clockOut = async () => {
  const response = await api.put('/attendance/clock-out');
  return response.data;
};

/**
 * Start a break for the current user
 * @returns {Promise} Promise object with break start data
 */
export const startBreak = async () => {
  const response = await api.post('/attendance/break/start');
  return response.data;
};

/**
 * End a break for the current user
 * @returns {Promise} Promise object with break end data
 */
export const endBreak = async () => {
  const response = await api.put('/attendance/break/end');
  return response.data;
};

/**
 * Get the current attendance status for the current user
 * @returns {Promise} Promise object with current status data
 */
export const getCurrentStatus = async () => {
  const response = await api.get('/attendance/current');
  return response.data;
};

/**
 * Get attendance history for the current user
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise} Promise object with attendance history data
 */
export const getAttendanceHistory = async (startDate, endDate) => {
  const response = await api.get('/attendance/history', {
    params: { startDate, endDate }
  });
  return response.data;
};

/**
 * Get attendance history for a specific user (admin/manager only)
 * @param {string} userId - User ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise} Promise object with user attendance history data
 */
export const getUserAttendance = async (userId, startDate, endDate) => {
  const response = await api.get(`/attendance/user/${userId}`, {
    params: { startDate, endDate }
  });
  return response.data;
};

/**
 * Create a manual attendance record (admin/manager only)
 * @param {Object} data - Attendance data
 * @returns {Promise} Promise object with created attendance data
 */
export const createManualAttendance = async (data) => {
  const response = await api.post('/attendance/manual', data);
  return response.data;
};

/**
 * Update an attendance record (admin/manager only)
 * @param {string} id - Attendance record ID
 * @param {Object} data - Updated attendance data
 * @returns {Promise} Promise object with updated attendance data
 */
export const updateAttendance = async (id, data) => {
  const response = await api.put(`/attendance/${id}`, data);
  return response.data;
};

/**
 * Delete an attendance record (admin/manager only)
 * @param {string} id - Attendance record ID
 * @returns {Promise} Promise object with deletion confirmation
 */
export const deleteAttendance = async (id) => {
  const response = await api.delete(`/attendance/${id}`);
  return response.data;
};

/**
 * Record an auto clock-out (system use)
 * @param {Object} data - Auto clock-out data
 * @returns {Promise} Promise object with auto clock-out confirmation
 */
export const recordAutoClockOut = async (data) => {
  const response = await api.post('/attendance/auto-clockout', data);
  return response.data;
};
