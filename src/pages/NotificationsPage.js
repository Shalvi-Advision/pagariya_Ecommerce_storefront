import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notificationApi';
import { useToast } from '../context/ToastContext';
import ApiErrorBoundary from '../components/ApiErrorBoundary';

const NotificationItem = ({ notification, onRead }) => {
    const isRead = notification.isRead;

    return (
        <div
            className={`p-4 border-b border-gray-100 transition-colors ${!isRead ? 'bg-orange-50' : 'bg-white'}`}
            onClick={() => !isRead && onRead(notification._id)}
        >
            <div className="flex gap-3">
                <div className={`p-2 rounded-full h-fit flex-shrink-0 ${!isRead ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                    <BellIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-semibold text-sm ${!isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                        </h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-snug mb-2">
                        {notification.body}
                    </p>
                    {!isRead && (
                        <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-medium rounded-full">
                            New
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async (pageNum = 1, isRefresh = false) => {
        try {
            setLoading(true);
            const response = await getUserNotifications(pageNum, 20);

            if (isRefresh || pageNum === 1) {
                setNotifications(response.data);
            } else {
                setNotifications(prev => [...prev, ...response.data]);
            }

            setHasMore(response.data.length === 20); // If we got full page, assume more
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            showToast('Failed to load notifications', 'error');
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            showToast('All notifications marked as read', 'success');
        } catch (error) {
            showToast('Failed to mark all as read', 'error');
        }
    };

    const handleRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            // Fail silently for user experience, update UI anyway to feel responsive?
            // No, better to reflect server state.
            console.error('Failed to mark read', error);
        }
    };

    const handleScroll = (e) => {
        const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
        if (bottom && hasMore && !loading) {
            setPage(prev => prev + 1);
            fetchNotifications(page + 1);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 shadow-sm px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
                </div>

                {notifications.length > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-orange-600 text-sm font-medium hover:text-orange-700 flex items-center gap-1"
                    >
                        <CheckIcon className="w-4 h-4" /> Mark all read
                    </button>
                )}
            </div>

            {/* Content */}
            <div
                className="flex-1 overflow-y-auto"
                onScroll={handleScroll}
            >
                {loading && page === 1 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
                        <p className="text-gray-500">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <BellIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
                        <p className="text-gray-500 max-w-xs">
                            We'll let you know when we have updates, offers, or news for you.
                        </p>
                    </div>
                ) : (
                    <div className="pb-4">
                        {notifications.map(notification => (
                            <NotificationItem
                                key={notification._id}
                                notification={notification}
                                onRead={handleRead}
                            />
                        ))}

                        {loading && page > 1 && (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                Loading more...
                            </div>
                        )}

                        {!hasMore && notifications.length > 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No more notifications
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
