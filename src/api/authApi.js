// Authentication API service functions
import { apiPost, apiGet } from '../services/api';

export const login = async (credentials) => {
  try {
    const response = await apiPost('/auth/login', credentials);
    return response;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await apiPost('/auth/register', userData);
    return response;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiGet('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await apiPost('/auth/logout', {});
    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await apiPut('/auth/profile', profileData);
    return response;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const updateActivity = async (deviceInfo = {}) => {
  try {
    const response = await apiPost('/auth/is-active', {
      sessionId: localStorage.getItem('session_id'),
      device: {
        platform: 'web',
        deviceId: navigator.userAgent,
        appVersion: '1.0.0',
        ...deviceInfo
      }
    });
    return response;
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
};

