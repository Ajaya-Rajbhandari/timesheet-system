import api from './api';

/**
 * Get all shift swaps for the current user
 * @returns {Promise} Promise object with shift swaps data
 */
export const getMyShiftSwaps = async () => {
  const response = await api.get('/shift-swaps');
  return response.data;
};

/**
 * Get all shift swaps for a department (managers only)
 * @param {string} departmentId - Department ID
 * @returns {Promise} Promise object with shift swaps data
 */
export const getDepartmentShiftSwaps = async (departmentId) => {
  const response = await api.get(`/shift-swaps/department/${departmentId}`);
  return response.data;
};

/**
 * Request a shift swap
 * @param {Object} swapData - Shift swap data
 * @param {string} swapData.targetUserId - Target user ID
 * @param {string} swapData.requestingScheduleId - Requesting schedule ID
 * @param {string} swapData.targetScheduleId - Target schedule ID
 * @param {string} swapData.reason - Reason for swap
 * @returns {Promise} Promise object with created shift swap
 */
export const requestShiftSwap = async (swapData) => {
  const response = await api.post('/shift-swaps/request', swapData);
  return response.data;
};

/**
 * Respond to a shift swap request
 * @param {string} swapId - Shift swap ID
 * @param {Object} responseData - Response data
 * @param {string} responseData.status - Response status (approved/rejected)
 * @param {string} responseData.notes - Response notes
 * @returns {Promise} Promise object with updated shift swap
 */
export const respondToShiftSwap = async (swapId, responseData) => {
  const response = await api.put(`/shift-swaps/${swapId}/respond`, responseData);
  return response.data;
};

/**
 * Manager approval for a shift swap
 * @param {string} swapId - Shift swap ID
 * @param {Object} approvalData - Approval data
 * @param {boolean} approvalData.approved - Whether the swap is approved
 * @param {string} approvalData.notes - Approval notes
 * @returns {Promise} Promise object with updated shift swap
 */
export const approveShiftSwap = async (swapId, approvalData) => {
  const response = await api.put(`/shift-swaps/${swapId}/manager-approval`, approvalData);
  return response.data;
}; 