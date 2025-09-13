// PWA utility functions
import { Workbox } from 'workbox-window';

class PWAUtils {
  constructor() {
    this.workbox = null;
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showNotification('You are back online!', 'success');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNotification('You are offline. Some features may be limited.', 'warning');
    });

    // Listen for beforeunload to save any pending data
    window.addEventListener('beforeunload', () => {
      this.savePendingData();
    });
  }

  // Register service worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Register the service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);

        // Initialize Workbox
        this.workbox = new Workbox('/sw.js');
        await this.workbox.register();

        // Listen for service worker updates
        this.workbox.addEventListener('waiting', () => {
          this.showUpdateNotification();
        });

        // Listen for service worker controlling
        this.workbox.addEventListener('controlling', () => {
          window.location.reload();
        });

        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    } else {
      console.log('Service Worker not supported');
      return null;
    }
  }

  // Show update notification
  showUpdateNotification() {
    if (confirm('A new version of the app is available. Would you like to update?')) {
      this.workbox.messageSkipWaiting();
    }
  }

  // Show notification
  showNotification(message, type = 'info') {
    // Create a simple notification system
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-black' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Check if app is installable
  isInstallable() {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           window.matchMedia('(display-mode: standalone)').matches === false;
  }

  // Prompt user to install PWA
  promptInstall() {
    if (this.isInstallable()) {
      // This will be handled by the browser's install prompt
      // We can show a custom install button
      return true;
    }
    return false;
  }

  // Save pending data before app closes
  savePendingData() {
    try {
      // Save cart data, user preferences, etc.
      const cartData = localStorage.getItem('cart');
      const userData = localStorage.getItem('user');
      
      // You can implement additional offline storage here
      console.log('PWA: Saving pending data before app closes');
    } catch (error) {
      console.error('PWA: Error saving pending data', error);
    }
  }

  // Get app version
  async getAppVersion() {
    if (this.workbox) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.version);
        };
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        );
      });
    }
    return 'unknown';
  }

  // Check for updates
  async checkForUpdates() {
    if (this.workbox) {
      try {
        await this.workbox.update();
        console.log('PWA: Checked for updates');
      } catch (error) {
        console.error('PWA: Error checking for updates', error);
      }
    }
  }

  // Clear all caches (useful for development)
  async clearAllCaches() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('PWA: All caches cleared');
      return true;
    } catch (error) {
      console.error('PWA: Error clearing caches', error);
      return false;
    }
  }

  // Force update service worker
  async forceUpdate() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        
        // Clear all caches
        await this.clearAllCaches();
        
        // Reload the page
        window.location.reload();
        return true;
      }
      return false;
    } catch (error) {
      console.error('PWA: Error forcing update', error);
      return false;
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Send push notification
  async sendPushNotification(title, options = {}) {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body: options.body || 'New notification from Shalvi E-Commerce',
          icon: '/logo192.svg',
          badge: '/favicon.svg',
          ...options
        });
      } catch (error) {
        console.error('PWA: Error sending push notification', error);
      }
    }
  }
}

// Create singleton instance
const pwaUtils = new PWAUtils();

export default pwaUtils;
