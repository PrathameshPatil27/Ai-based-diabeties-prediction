import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      console.error('Network error:', error);
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    
    // Handle server errors
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw new Error('Something went wrong. Please try again.');
  }
);

export default api;