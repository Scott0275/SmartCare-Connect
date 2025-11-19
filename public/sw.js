const CACHE_NAME = 'smartcare-v3';
const STATIC_CACHE = [
  '/',
  '/login',
  '/offline.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Never cache API routes or Firebase calls
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('firestore') ||
      url.hostname.includes('firebase') ||
      request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }
  
  // Cache-first for static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});