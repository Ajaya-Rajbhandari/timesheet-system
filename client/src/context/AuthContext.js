import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: true,
    error: null,
  });

  // Set axios default headers
  useEffect(() => {
    if (authState.token) {
      axiosInstance.defaults.headers.common['x-auth-token'] = authState.token;
    } else {
      delete axiosInstance.defaults.headers.common['x-auth-token'];
    }
  }, [authState.token]);

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!authState.token) {
        setAuthState((prevAuthState) => ({ ...prevAuthState, loading: false }));
        return;
      }

      try {
        const res = await axiosInstance.get('/auth/user');
        setAuthState((prevAuthState) => ({ ...prevAuthState, user: res.data, loading: false }));
      } catch (err) {
        console.error('Error loading user:', err);
        setAuthState((prevAuthState) => ({ ...prevAuthState, error: 'Failed to authenticate user', loading: false }));
        logout();
      }
    };

    loadUser();
  }, [authState.token]);

  // Register user
  const register = async (formData) => {
    try {
      const res = await axiosInstance.post('/auth/register', formData);
      const { token, user } = res.data;

      // Set auth state
      setAuthState({
        token,
        user,
        isAuthenticated: true,
        error: null,
      });

      // Set local storage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Set axios headers
      axiosInstance.defaults.headers.common['x-auth-token'] = token;

      return { user, token };
    } catch (err) {
      console.error('Registration error:', err.response?.data?.message || err.message);
      setAuthState((prevAuthState) => ({ ...prevAuthState, error: err.response?.data?.message || 'Registration failed' }));
      throw err;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Set auth state
      setAuthState({
        token,
        user,
        isAuthenticated: true,
        error: null,
      });

      // Set local storage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Set axios headers
      axiosInstance.defaults.headers.common['x-auth-token'] = token;

      return true;
    } catch (err) {
      console.error('Login error:', err.response?.data?.message || err.message);
      setAuthState((prevAuthState) => ({ ...prevAuthState, error: err.response?.data?.message || 'Invalid credentials' }));
      return false;
    }
  };

  // Logout user
  const logout = () => {
    // Clear auth state
    setAuthState({
      token: '',
      user: null,
      isAuthenticated: false,
      error: null,
    });

    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Remove axios headers
    delete axiosInstance.defaults.headers.common['x-auth-token'];
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await axiosInstance.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setAuthState((prevAuthState) => ({ ...prevAuthState, error: null }));
      return res.data;
    } catch (err) {
      console.error('Change password error:', err);
      setAuthState((prevAuthState) => ({ ...prevAuthState, error: err.response?.data?.message || 'Failed to change password' }));
      throw err;
    }
  };

  // Update user profile
  const updateProfile = async (userId, userData) => {
    try {
      const res = await axiosInstance.put(`/users/${userId}`, userData);
      if (authState.user && authState.user.id === userId) {
        setAuthState((prevAuthState) => ({ ...prevAuthState, user: { ...prevAuthState.user, ...res.data } }));
      }
      setAuthState((prevAuthState) => ({ ...prevAuthState, error: null }));
      return res.data;
    } catch (err) {
      console.error('Update profile error:', err);
      setAuthState((prevAuthState) => ({ ...prevAuthState, error: err.response?.data?.message || 'Failed to update profile' }));
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        register,
        changePassword,
        updateProfile,
        isAdmin: authState.user?.role === 'admin',
        isManager: authState.user?.role === 'manager' || authState.user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
