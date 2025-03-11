import axios from 'axios';

// Create axios instance with base URL
const instance = axios.create({
  baseURL: '/api', // Use relative path since we have proxy in package.json
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Use x-auth-token header instead of Authorization Bearer
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (Unauthorized) - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    // Handle 403 (Forbidden) - not enough permissions
    else if (error.response?.status === 403) {
      throw new Error('You do not have permission to perform this action');
    }
    // Handle other errors
    throw error.response?.data?.message || error.message || 'An error occurred';
  }
);

export default instance;