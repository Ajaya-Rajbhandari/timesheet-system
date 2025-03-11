import axios from '../utils/axios';

// Get all users (admin/manager only)
export const fetchUsers = async () => {
  try {
    const response = await axios.get('/users');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching users';
  }
};

// Get user by ID (admin/manager or self only)
export const fetchUserById = async (id) => {
  try {
    const response = await axios.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching user';
  }
};

// Create new user (admin/manager only)
export const createUser = async (userData) => {
  try {
    const response = await axios.post('/users', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error creating user';
  }
};

// Update user (admin/manager or self only)
export const updateUser = async (id, userData) => {
  try {
    const response = await axios.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error updating user';
  }
};

// Update user password
export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const response = await axios.put('/users/password', { currentPassword, newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error updating password';
  }
};

// Delete user (admin only)
export const deleteUser = async (id) => {
  try {
    const response = await axios.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error deleting user';
  }
};

// Get users by department (admin/manager only)
export const fetchUsersByDepartment = async (department) => {
  try {
    const response = await axios.get(`/users/department/${department}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching department users';
  }
};
