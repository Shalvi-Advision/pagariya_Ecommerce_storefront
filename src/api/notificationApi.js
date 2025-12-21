import axios from 'axios';
import { API_BASE_URL } from '../constants';

const API_URL = `${API_BASE_URL}/notifications`;

// Get headers directly from function to ensure latest token is used
const getHeaders = () => {
    const token = localStorage.getItem('token');
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
        throw error.response?.data?.message || 'Failed to fetch notifications';
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
