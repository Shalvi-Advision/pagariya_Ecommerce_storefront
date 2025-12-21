// Firebase Cloud Messaging helper functions
import { messaging, getToken, onMessage } from './firebase';
import { FIREBASE_VAPID_KEY } from './constants';

/**
 * Request notification permission from the browser
 * @returns {Promise<void>}
 */
export const requestNotificationPermission = async () => {
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        console.warn('Notification permission denied');
        throw new Error('Notification permission not granted');
    }

    console.log('Notification permission granted');
};

/**
 * Get FCM registration token for this device
 * @returns {Promise<string|null>} FCM token or null if failed
 */
export const getFcmToken = async () => {
    try {
        // Check if we're in a secure context (HTTPS or localhost)
        const isSecureContext = window.isSecureContext;
        const currentUrl = window.location.href;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isHttps = window.location.protocol === 'https:';

        console.log('🔍 FCM Debug Info:');
        console.log('  Current URL:', currentUrl);
        console.log('  Is Secure Context:', isSecureContext);
        console.log('  Is HTTPS:', isHttps);
        console.log('  Is Localhost:', isLocalhost);

        if (!isSecureContext) {
            console.warn('⚠️ FCM: Push notifications require HTTPS or localhost.');
            console.warn('Current location:', currentUrl);
            return null;
        }

        // Get the service worker registration for FCM
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');

        if (!registration) {
            console.error('❌ FCM service worker not registered at /firebase-messaging-sw.js');
            console.error('Available service workers:', await navigator.serviceWorker.getRegistrations());
            return null;
        }

        console.log('✅ FCM service worker found:', registration.scope);

        const token = await getToken(messaging, {
            vapidKey: FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (token) {
            console.log('✅ FCM token obtained successfully');
            console.log('FCM token:', token);
            return token;
        } else {
            console.warn('⚠️ No FCM token available. Permission may have been denied.');
            return null;
        }
    } catch (err) {
        console.error('❌ FCM: Error getting token');
        console.error('Error details:', err);
        console.error('Error code:', err.code);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);

        // Handle specific error types with helpful messages
        if (err.code === 'messaging/failed-service-worker-registration') {
            console.error('💡 The FCM service worker failed to register.');
            console.error('   Check that /firebase-messaging-sw.js exists and is valid.');
        } else if (err.name === 'AbortError' || err.message?.includes('push service')) {
            console.error('💡 Push service registration failed.');
            console.error('   This can happen due to:');
            console.error('   1. Browser blocking push notifications');
            console.error('   2. Invalid VAPID key');
            console.error('   3. Firebase configuration mismatch');
            console.error('   4. Service worker scope issues');
            console.error('');
            console.error('🔧 Troubleshooting steps:');
            console.error('   1. Check browser console for service worker errors');
            console.error('   2. Verify VAPID key matches Firebase Console');
            console.error('   3. Clear browser cache and reload');
            console.error('   4. Check if notifications are blocked in browser settings');
        } else if (err.code === 'messaging/permission-blocked') {
            console.error('💡 Notification permission was blocked by user.');
            console.error('   User needs to enable notifications in browser settings.');
        } else {
            console.error('💡 Unknown FCM error. Check error details above.');
        }

        return null;
    }
};

/**
 * Subscribe to foreground messages (when app is open and active)
 * @param {Function} callback - Function to call when a message is received
 */
export const subscribeForegroundMessages = (callback) => {
    onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);

        // Call the provided callback with the payload
        if (callback) {
            callback(payload);
        }

        // You can show custom in-app notification here
        // Example: Show a toast or custom notification UI
    });
};

/**
 * Listen for token refresh events
 * Note: Tokens can be rotated by FCM for security reasons
 * @param {Function} callback - Function to call when token is refreshed
 */
export const onTokenRefresh = (callback) => {
    // Monitor for token refresh
    messaging.onTokenRefresh = async () => {
        try {
            const newToken = await getFcmToken();
            if (newToken && callback) {
                callback(newToken);
            }
        } catch (err) {
            console.error('Error refreshing FCM token:', err);
        }
    };
};
