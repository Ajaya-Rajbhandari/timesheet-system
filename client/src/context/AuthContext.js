import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axiosInstance.get('/auth/user');
        setUser(res.data);
        setError(null);
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Failed to authenticate user');
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (formData) => {
    try {
      const res = await axiosInstance.post('/auth/register', formData);
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setError(null);
      
      return { user: userData, token: newToken };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, hasPassword: !!password });
      
      const res = await axiosInstance.post('/auth/login', { email, password });
      console.log('Login response:', res.data);
      
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setError(null);
      
      return { user: userData, token: newToken };
    } catch (err) {
      console.error('Login error details:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.message
      });
      setError(err.response?.data?.message || 'Invalid credentials');
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await axiosInstance.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setError(null);
      return res.data;
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.response?.data?.message || 'Failed to change password');
      throw err;
    }
  };

  // Update user profile
  const updateProfile = async (userId, userData) => {
    try {
      const res = await axiosInstance.put(`/users/${userId}`, userData);
      if (user && user.id === userId) {
        setUser({ ...user, ...res.data });
      }
      setError(null);
      return res.data;
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        changePassword,
        updateProfile,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager' || user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
