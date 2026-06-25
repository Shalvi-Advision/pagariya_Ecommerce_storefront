import axios from 'axios';
import { API_BASE_URL } from '../constants';

const API_URL = `${API_BASE_URL}/notifications`;

// Get headers directly from function to ensure latest token is used
const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

// Get user notifications
export const getUserNotifications = async (page = 1, limit = 20) => {
    try {
        const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}`, getHeaders());
        return response.data;
    } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || 'Failed to fetch notifications';
        const authError = new Error(message);
        authError.status = status;
        authError.isAuthError = status === 401;
        throw authError;
    }
};

// Mark notification as read
export const markNotificationRead = async (id) => {
    try {
        const response = await axios.put(`${API_URL}/${id}/read`, {}, getHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update notification';
    }
};

// Mark all notifications as read
export const markAllNotificationsRead = async () => {
    try {
        const response = await axios.put(`${API_URL}/read-all`, {}, getHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update notifications';
    }
};
