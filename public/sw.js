// Service Worker for Shalvi E-Commerce PWA
const CACHE_NAME = 'shalvi-ecommerce-v' + Date.now();
const STATIC_CACHE = 'shalvi-static-v1';
const DYNAMIC_CACHE = 'shalvi-dynamic-v1';

// Development mode detection
const isDevelopment = self.location.hostname === 'localhost' || 
                     self.location.hostname === '127.0.0.1' ||
                     self.location.hostname.includes('dev') ||
                     self.location.hostname.includes('staging');

const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.svg',
  '/logo192.svg',
  '/logo512.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Error caching files', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Determine caching strategy based on request type
  const url = new URL(event.request.url);
  const isAPIRequest = url.pathname.startsWith('/api/');
  const isStaticAsset = url.pathname.includes('/static/') || 
                       url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
  const isHTMLRequest = event.request.destination === 'document';

  if (isDevelopment) {
    // In development, always try network first for everything
    event.respondWith(developmentStrategy(event.request));
  } else if (isAPIRequest) {
    // Network First strategy for API requests
    event.respondWith(networkFirstStrategy(event.request));
  } else if (isStaticAsset) {
    // Cache First strategy for static assets
    event.respondWith(cacheFirstStrategy(event.request));
  } else if (isHTMLRequest) {
    // Network First strategy for HTML pages
    event.respondWith(networkFirstStrategy(event.request));
  } else {
    // Default: Network First with cache fallback
    event.respondWith(networkFirstStrategy(event.request));
  }
});

// Development Strategy - Always try network first, minimal caching
async function developmentStrategy(request) {
  try {
    console.log('Service Worker: Development mode - Fetching from network', request.url);
    const networkResponse = await fetch(request);
    
    // In development, only cache static assets
    const url = new URL(request.url);
    const isStaticAsset = url.pathname.includes('/static/') || 
                         url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
    
    if (isStaticAsset && networkResponse && networkResponse.status === 200) {
      // Only cache static assets in development
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Development mode - Network failed, trying cache', request.url);
    
    // Try to get from cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Development mode - Serving from cache', request.url);
      return cachedResponse;
    }
    
    // If it's a document request and no cache, return offline page
    if (request.destination === 'document') {
      return caches.match('/');
    }
    
    // Return offline response for other requests
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Network First Strategy - Try network first, fallback to cache
async function networkFirstStrategy(request) {
  try {
    console.log('Service Worker: Fetching from network', request.url);
    const networkResponse = await fetch(request);
    
    // Check if valid response
    if (networkResponse && networkResponse.status === 200) {
      // Clone the response for caching
      const responseToCache = networkResponse.clone();
      
      // Cache the response for future use
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, responseToCache);
      
      return networkResponse;
    }
    
    throw new Error('Invalid network response');
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', request.url);
    
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache', request.url);
      return cachedResponse;
    }
    
    // If it's a document request and no cache, return offline page
    if (request.destination === 'document') {
      return caches.match('/');
    }
    
    // Return offline response for other requests
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Cache First Strategy - Try cache first, fallback to network
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('Service Worker: Serving from cache', request.url);
    return cachedResponse;
  }
  
  try {
    console.log('Service Worker: Fetching from network', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // Cache the response for future use
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Fetch failed', error);
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks here
      // For example: sync cart data, user preferences, etc.
      syncOfflineData()
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/logo192.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/logo192.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Shalvi E-Commerce', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function for background sync
async function syncOfflineData() {
  try {
    // Implement your offline data sync logic here
    console.log('Service Worker: Syncing offline data');
    
    // Example: Sync cart data, user preferences, etc.
    // This would typically involve sending data to your backend
    
    return Promise.resolve();
  } catch (error) {
    console.error('Service Worker: Error syncing offline data', error);
    return Promise.reject(error);
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
