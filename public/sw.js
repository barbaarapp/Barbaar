const CACHE_NAME = 'barbaar-wellness-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/barbaar_icon.svg'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache our static app shell assets
        return cache.addAll(ASSETS).catch((err) => {
          console.warn('Service worker pre-caching bypassed some optional assets:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network First, falling back to cache)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and local/http/https origins (skip chrome extensions etc.)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If valid network response, cache it dynamically for offline usage
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline: try to serve from cache, otherwise fallback
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If fallback index is requested
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
