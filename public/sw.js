// VersedUP Service Worker — cache-first with network fallback
const CACHE_NAME = 'versed-up-v8';
const APP_SHELL = [
  '/VersedUP/',
  '/VersedUP/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Network-first for Bible API calls (need live data)
  if (event.request.url.includes('bible-api.com')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('{"error":"Offline"}', {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Network-first for app shell (always get latest build)
  event.respondWith(
    fetch(event.request).then((response) => {
      if (!response || response.status !== 200 || response.type === 'opaque') {
        return response;
      }
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      return response;
    }).catch(() =>
      caches.match(event.request).then((cached) => cached || caches.match('/VersedUP/'))
    )
  );
});
