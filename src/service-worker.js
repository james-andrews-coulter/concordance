// Simplified Service Worker - Cache only, no update notifications
const CACHE_VERSION = 'v1';
const CACHE_NAME = `shelf-${CACHE_VERSION}`;

// Derive base path from service worker location (works with any repo name)
const BASE = new URL('./', self.location.href).pathname;

// Assets to pre-cache
const PRECACHE_ASSETS = [
  BASE,
  `${BASE}index.html`,
  `${BASE}chunk.html`,
  `${BASE}tags.html`,
  `${BASE}data/metadata.json`,
  `${BASE}data/tags.json`
];

// Install: Cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('shelf-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache-first strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle root with query params (e.g., /?tag=anxiety)
  if (url.pathname === BASE && url.search) {
    event.respondWith(
      caches.match(`${BASE}index.html`)
        .then((response) => response || fetch(event.request))
    );
    return;
  }

  // Handle chunk.html with query params (e.g., /chunk.html?id=123)
  if (url.pathname === `${BASE}chunk.html` && url.search) {
    event.respondWith(
      caches.match(`${BASE}chunk.html`)
        .then((response) => response || fetch(event.request))
    );
    return;
  }

  // Cache-first for all other requests
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Return 404 response if offline and not cached
        return new Response('Not found', { status: 404 });
      });
    })
  );
});
