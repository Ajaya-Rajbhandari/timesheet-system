import api from './api';

// Get all users (admin only)
export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting users';
  }
};

// Get user by ID
export const getUserById = async (id) => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting user';
  }
};

// Create new user (admin only)
export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error creating user';
  }
};

// Update user (admin only)
export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error updating user';
  }
};

// Delete user (admin only)
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error deleting user';
  }
};

// Get users by department (admin/manager)
export const getUsersByDepartment = async (department) => {
  try {
    const response = await api.get(`/users/department/${department}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting department users';
  }
};
