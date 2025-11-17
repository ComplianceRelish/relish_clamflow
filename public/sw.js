const CACHE_NAME = 'clamflow-v1.0.4';
const API_CACHE = 'clamflow-api-v1';

// Minimal static cache - only essential files
const STATIC_CACHE_URLS = [
  '/',
  '/login',
  '/dashboard'
];

// Install - cache minimal assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching core pages');
        return cache.addAll(STATIC_CACHE_URLS).catch((err) => {
          console.warn('Cache failed for some assets:', err);
        });
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated and claimed clients');
        return self.clients.claim();
      })
  );
});

// Fetch - Network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/auth/') || 
      url.pathname.startsWith('/health') ||
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/super-admin/') ||
      url.pathname.startsWith('/notifications/') ||
      url.pathname.startsWith('/audit/') ||
      url.hostname.includes('railway.app') ||
      url.hostname.includes('clamflowbackend')) {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('SW: Serving from cache (offline):', url.pathname);
              return cachedResponse;
            }
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Network unavailable. Please check your connection.' 
              }),
              { 
                status: 503, 
                headers: { 'Content-Type': 'application/json' } 
              }
            );
          });
        })
    );
    return;
  }

  // Next.js chunks and static files - Network first
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response('', { status: 503 });
          });
        })
    );
    return;
  }

  // Images and static assets - Cache first
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
        .catch(() => new Response('', { status: 404 }))
    );
    return;
  }

  // HTML navigation - Network first, cache fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches.match('/').then((home) => {
              if (home) return home;
              return new Response('Offline', { status: 503 });
            });
          });
        })
    );
    return;
  }

  // Everything else - Just fetch
  event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('SW: Background sync');
    event.waitUntil(Promise.resolve());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('SW: Push received');
  
  let data = {
    title: 'ClamFlow',
    body: 'New notification',
    icon: '/icons/icon-192x192.png'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/dashboard' }
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            return client.focus().then(() => client.navigate(url));
          }
        }
        return self.clients.openWindow(url);
      })
  );
});

console.log('SW: Loaded v1.0.4');