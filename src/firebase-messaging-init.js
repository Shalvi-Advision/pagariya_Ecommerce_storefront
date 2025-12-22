// Firebase Cloud Messaging helper functions
import { messaging, getToken, onMessage } from './firebase';
import { FIREBASE_VAPID_KEY } from './constants';

// FCM initialization state tracking
let fcmInitialized = false;
let fcmInitializationPromise = null;
let foregroundMessageUnsubscribe = null;
let tokenRefreshUnsubscribe = null;
const isDebugMode = process.env.NODE_ENV === 'development';

/**
 * Debug logging utility - only logs in development mode
 */
const debugLog = (type, ...args) => {
    if (!isDebugMode) return;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[FCM ${timestamp}]`, ...args);
};

const debugError = (type, ...args) => {
    if (!isDebugMode) return;
    const timestamp = new Date().toLocaleTimeString();
    console.error(`[FCM ERROR ${timestamp}]`, ...args);
};

/**
 * Check if FCM is supported in current environment
 */
const isFcmSupported = () => {
    return (
        'serviceWorker' in navigator &&
        'Notification' in window &&
        window.isSecureContext
    );
};

/**
 * Request notification permission from the browser with optimized retry logic
 * @returns {Promise<boolean>}
 */
export const requestNotificationPermission = async () => {
    try {
        // Check if permission already granted
        if (Notification.permission === 'granted') {
            debugLog('permission', 'Notification permission already granted');
            return true;
        }

        // Skip if user previously denied
        if (Notification.permission === 'denied') {
            debugLog('permission', 'Notification permission denied by user');
            return false;
        }

        debugLog('permission', 'Requesting notification permission...');
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            debugLog('permission', 'Notification permission granted');
            return true;
        } else {
            debugLog('permission', `Notification permission: ${permission}`);
            return false;
        }
    } catch (error) {
        debugError('permission', 'Error requesting permission:', error);
        return false;
    }
};

/**
 * Get FCM registration token with caching and error recovery
 * @returns {Promise<string|null>} FCM token or null if failed
 */
export const getFcmToken = async () => {
    try {
        // Validate secure context
        if (!window.isSecureContext) {
            debugError('token', 'Not in secure context (HTTPS/localhost required)');
            return null;
        }

        // Get the service worker registration for FCM
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');

        if (!registration) {
            debugError('token', 'FCM service worker not found at /firebase-messaging-sw.js');
            return null;
        }

        debugLog('token', 'FCM service worker found:', registration.scope);

        // Get FCM token with timeout to prevent hanging
        const tokenPromise = getToken(messaging, {
            vapidKey: FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        // Set a timeout for token retrieval
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('FCM token retrieval timeout')), 10000)
        );

        const token = await Promise.race([tokenPromise, timeoutPromise]);

        if (token) {
            debugLog('token', 'FCM token obtained successfully, length:', token.length);
            return token;
        } else {
            debugLog('token', 'No FCM token available');
            return null;
        }
    } catch (err) {
        debugError('token', 'Error getting FCM token:', err.message);
        return null;
    }
};

/**
 * Subscribe to foreground messages with proper cleanup
 * @param {Function} callback - Function to call when a message is received
 * @returns {Function} Unsubscribe function
 */
export const subscribeForegroundMessages = (callback) => {
    // Clean up previous subscription if exists
    if (foregroundMessageUnsubscribe) {
        foregroundMessageUnsubscribe();
    }

    foregroundMessageUnsubscribe = onMessage(messaging, (payload) => {
        debugLog('message', 'Foreground message received');

        // Call the provided callback with the payload
        if (callback && typeof callback === 'function') {
            try {
                callback(payload);
            } catch (error) {
                debugError('message', 'Error in foreground message callback:', error);
            }
        }
    });

    // Return unsubscribe function
    return foregroundMessageUnsubscribe;
};

/**
 * Listen for token refresh events with proper cleanup
 * @param {Function} callback - Function to call when token is refreshed
 * @returns {Function} Unsubscribe function
 */
export const onTokenRefresh = (callback) => {
    // Clean up previous subscription if exists
    if (tokenRefreshUnsubscribe) {
        tokenRefreshUnsubscribe();
    }

    const handleTokenRefresh = async () => {
        try {
            debugLog('token-refresh', 'Token refresh event triggered');
            const newToken = await getFcmToken();
            if (newToken && callback && typeof callback === 'function') {
                try {
                    callback(newToken);
                } catch (error) {
                    debugError('token-refresh', 'Error in token refresh callback:', error);
                }
            }
        } catch (err) {
            debugError('token-refresh', 'Error during token refresh:', err);
        }
    };

    messaging.onTokenRefresh = handleTokenRefresh;

    // Return cleanup function
    tokenRefreshUnsubscribe = () => {
        messaging.onTokenRefresh = null;
    };

    return tokenRefreshUnsubscribe;
};

/**
 * Initialize FCM with memoization - should be called only once
 * @returns {Promise<{supported: boolean, token: string|null}>}
 */
export const initializeFCM = async () => {
    // Return cached initialization promise if already in progress
    if (fcmInitializationPromise) {
        return fcmInitializationPromise;
    }

    // Return cached result if already initialized
    if (fcmInitialized) {
        return { supported: true, token: null };
    }

    // Create the initialization promise
    fcmInitializationPromise = (async () => {
        try {
            // Check if FCM is supported
            if (!isFcmSupported()) {
                debugLog('init', 'FCM not supported in this environment');
                return { supported: false, token: null };
            }

            debugLog('init', 'Starting FCM initialization');

            // Request notification permission
            const hasPermission = await requestNotificationPermission();
            if (!hasPermission) {
                debugLog('init', 'No notification permission');
                return { supported: true, token: null };
            }

            // Get FCM token
            const token = await getFcmToken();

            fcmInitialized = true;
            debugLog('init', 'FCM initialization complete');

            return { supported: true, token };
        } catch (error) {
            debugError('init', 'FCM initialization failed:', error);
            return { supported: false, token: null };
        }
    })();

    return fcmInitializationPromise;
};

/**
 * Clean up FCM resources
 */
export const cleanupFCM = () => {
    if (foregroundMessageUnsubscribe) {
        foregroundMessageUnsubscribe();
        foregroundMessageUnsubscribe = null;
    }
    if (tokenRefreshUnsubscribe) {
        tokenRefreshUnsubscribe();
        tokenRefreshUnsubscribe = null;
    }
};
