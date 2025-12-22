/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker for background notifications
// This file handles push notifications when the PWA is closed or in background

// Import Firebase scripts (using compat version for service worker compatibility)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase configuration
// NOTE: Service workers cannot use ES6 imports, so values are hardcoded here
// These values are maintained in: src/constants/index.js as FIREBASE_CONFIG
firebase.initializeApp({
    apiKey: "AIzaSyDwp6-vtdtbLzgYpChpXcxrD6h9d6rkA6M",
    authDomain: "shalviecomweb.firebaseapp.com",
    projectId: "shalviecomweb",
    storageBucket: "shalviecomweb.firebasestorage.app",
    messagingSenderId: "1096736732418",
    appId: "1:1096736732418:web:5e0042db39062cad79fe1b",
});

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    // Customize notification here
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new message',
        icon: '/logo192.svg', // Use your PWA icon
        badge: '/logo192.svg',
        tag: payload.data?.tag || 'notification',
        requireInteraction: false,
        data: payload.data, // Custom data to pass to notification click handler
    };

    // Show the notification
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);

    event.notification.close();

    // Handle the click - open the app or navigate to a specific page
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Check if there's already a window/tab open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }

            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
