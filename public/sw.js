const CACHE_NAME = 'clamflow-v1.0.2';

// Only cache truly static assets
const STATIC_CACHE_URLS = [
  '/logo-relish.png',
  '/manifest.json'
];

// Install event - cache minimal static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return Promise.allSettled(
          STATIC_CACHE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service Worker install failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Activated and claimed clients');
    })
  );
});

// Fetch event - Network-first strategy with minimal caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip API calls - always use network
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/auth/') ||
      url.pathname.includes('clamflowbackend')) {
    return;
  }

  // Skip Next.js internal routes and chunks - always use network
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request).catch(err => {
        console.error('Failed to fetch Next.js resource:', url.pathname, err);
        // Return a basic response to prevent errors
        return new Response('', { status: 408, statusText: 'Request Timeout' });
      })
    );
    return;
  }

  // For static assets - try cache first, then network
  if (url.pathname.endsWith('.png') || 
      url.pathname.endsWith('.jpg') || 
      url.pathname.endsWith('.svg') ||
      url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request).then(fetchResponse => {
            // Cache valid responses
            if (fetchResponse && fetchResponse.status === 200) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseToCache);
              });
            }
            return fetchResponse;
          });
        })
        .catch(err => {
          console.warn('Failed to fetch static asset:', url.pathname, err);
          return new Response('', { status: 404, statusText: 'Not Found' });
        })
    );
    return;
  }

  // For HTML pages - network-first, fallback to cache
  if (request.mode === 'navigate' || 
      request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful HTML responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(err => {
          console.warn('Network failed for navigation:', url.pathname, err);
          // Try to return cached version
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page fallback
            return caches.match('/').catch(() => {
              return new Response('Offline - Please check your connection', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
          });
        })
    );
    return;
  }

  // For everything else - just use network, don't cache
  event.respondWith(
    fetch(request).catch(err => {
      console.warn('Fetch failed:', url.pathname, err);
      return new Response('', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(processOfflineQueue());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: 'ClamFlow',
    body: 'New notification',
    icon: '/logo-relish.png'
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/logo-relish.png',
    badge: '/logo-relish.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: notificationData.url || '/dashboard'
    }
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Helper function for offline queue processing
async function processOfflineQueue() {
  console.log('Service Worker: Processing offline queue');
  // Implement offline queue logic here if needed
  return Promise.resolve();
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker: Script loaded');