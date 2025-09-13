// Base API service with authentication support
import axios from 'axios';
import { APP_CONSTANTS } from '../constants';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: APP_CONSTANTS.API_BASE_URL,
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

export default api;
