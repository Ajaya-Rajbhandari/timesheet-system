import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor to include auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['x-auth-token'] = token;
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url} (authenticated)`);
    } else {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url} (unauthenticated)`);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`API Error: ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response.data);
      
      // Handle 401 Unauthorized errors (token expired or invalid)
      if (error.response.status === 401) {
        console.warn('Authentication token expired or invalid, redirecting to login');
        localStorage.removeItem('token');
        
        // Use a small timeout to allow the current code to complete before redirecting
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
      
      // Handle 403 Forbidden errors
      if (error.response.status === 403) {
        console.error('Access denied:', error.response.data.message);
      }
      
      // Handle 500 Server errors
      if (error.response.status === 500) {
        console.error('Server error:', error.response.data.message);
      }
    } else if (error.request) {
      // Handle network errors
      console.error('Network error - no response received:', error.message);
    } else {
      // Handle other errors
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to check if token exists
api.isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Helper function to get current auth token
api.getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to set auth token
api.setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export default api;
