// Base API service with authentication support
import axios from 'axios';
import { APP_CONSTANTS } from '../constants';

// OTP Authentication Configuration
const OTP_PROJECT_CODE = "RET90";
const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from storage
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearStoredToken();
      // You might want to redirect to login or dispatch logout action
      window.location.href = '/login';
    }

    // Log error for debugging
    console.error('API Error:', error.response?.data || error.message);

    return Promise.reject(error);
  }
);

// Token storage utilities
export const getStoredToken = () => {
  // Try localStorage first (web)
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('auth_token');
  }

  // For PWA/mobile, we'll use IndexedDB as fallback
  // This is a simplified version - in production you'd want more robust IndexedDB handling
  return null;
};

export const setStoredToken = async (token) => {
  // Store in localStorage for web
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('auth_token', token);
  }

  // For PWA compatibility, you could also store in IndexedDB
  // This ensures offline persistence
  if (typeof window !== 'undefined' && window.indexedDB) {
    try {
      const db = await openAuthDB();
      const transaction = db.transaction(['tokens'], 'readwrite');
      const store = transaction.objectStore('tokens');
      await store.put({ id: 'auth_token', value: token, timestamp: Date.now() });
      db.close();
    } catch (error) {
      console.warn('IndexedDB storage failed:', error);
    }
  }
};

export const clearStoredToken = () => {
  // Clear from localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('auth_token');
  }

  // Clear from IndexedDB
  if (typeof window !== 'undefined' && window.indexedDB) {
    clearIndexedDBToken();
  }
};

// IndexedDB utilities for PWA token persistence
const openAuthDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AuthDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens', { keyPath: 'id' });
      }
    };
  });
};

const clearIndexedDBToken = async () => {
  try {
    const db = await openAuthDB();
    const transaction = db.transaction(['tokens'], 'readwrite');
    const store = transaction.objectStore('tokens');
    await store.delete('auth_token');
    db.close();
  } catch (error) {
    console.warn('IndexedDB clear failed:', error);
  }
};

// Reusable API methods
export const apiPost = async (endpoint, data) => {
  try {
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// POST method that automatically includes project code
export const postWithProjectCode = async (endpoint, data) => {
  try {
    const dataWithProjectCode = {
      ...data,
      project_code: OTP_PROJECT_CODE
    };
    const response = await api.post(endpoint, dataWithProjectCode);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const apiGet = async (endpoint, params = {}) => {
  try {
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const apiPut = async (endpoint, data) => {
  try {
    const response = await api.put(endpoint, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const apiDelete = async (endpoint) => {
  try {
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// OTP Authentication API Methods
export const otpAuth = {
  // Get OTP for mobile number
  getOtp: async (mobileNo) => {
    try {
      return await postWithProjectCode('/auth/get_otp', {
        mobileNo: mobileNo.replace(/\s+/g, ''), // Remove spaces
      });
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Validate OTP and get token
  validateOtp: async (mobileNo, otp) => {
    try {
      return await postWithProjectCode('/auth/validate_otp', {
        mobileNo: mobileNo.replace(/\s+/g, ''), // Remove spaces
        otp: otp.replace(/\s+/g, ''), // Remove spaces
      });
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify token validity
  verifyToken: async (token) => {
    try {
      const response = await api.post('/auth/verify_token', {
        token
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Refresh token
  refreshToken: async (token) => {
    try {
      const response = await api.post('/auth/refresh_token', {
        token
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Centralized postAuth method that handles authentication automatically
export const postAuth = async (endpoint, data, useToken = true) => {
  try {
    const config = {};

    // Add authorization header if token exists and useToken is true
    if (useToken) {
      const token = getStoredToken();
      if (token) {
        config.headers = {
          Authorization: `Bearer ${token}`
        };
      }
    }

    const response = await api.post(endpoint, data, config);
    return response.data;
  } catch (error) {
    // Handle token expiration
    if (error.response?.status === 401 && useToken) {
      // Clear stored token on authentication error
      clearStoredToken();
      // Optionally redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw error.response?.data || error;
  }
};

export default api;
