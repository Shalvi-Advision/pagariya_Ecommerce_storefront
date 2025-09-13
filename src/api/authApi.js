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
    // This endpoint might not exist in the provided API, but we can try
    const response = await apiGet('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    // Note: The provided API doesn't have a logout endpoint
    // We'll handle logout on the client side only
    return { success: true };
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

