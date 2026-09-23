import axios from 'axios';
import store from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import { clearStoredAuth } from '../utils/auth';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Attach JWT token if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('employix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers?.delete) {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      }
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    console.log(`🚀 [API Request] ${config.method?.toUpperCase()} -> ${config.baseURL}${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Extract response data or format clean error message
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response Success] <-`, response.data);
    return response.data;
  },
  (error) => {
    console.error(`❌ [API Response Error] <-`, error.response?.data || error.message);
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      if (error.response.status === 401) {
        const reqUrl = error.config?.url || '';
        const isAuthAttempt = reqUrl.includes('/auth/login') || reqUrl.includes('/auth/verifyOtp');
        if (!isAuthAttempt) {
          clearStoredAuth();
          store.dispatch(logout());
          if (window.location.pathname !== '/login') {
            toast.error('Session expired. Please log in again.');
            window.location.href = '/login';
          }
        }
      }

      if (error.response.data && error.response.data.message) {
        message = error.response.data.message;
      } else if (typeof error.response.data === 'string') {
        message = error.response.data;
      }
    } else if (error.request) {
      message = 'Cannot connect to server. Please check backend on port 5000.';
    } else if (error.message) {
      message = error.message;
    }

    const err = new Error(message);
    err.response = error.response;
    err.status = error.response?.status;
    err.data = error.response?.data;
    return Promise.reject(err);
  }
);

export default axiosInstance;
