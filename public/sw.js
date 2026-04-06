const CACHE_NAME = 'autorepai-console-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Minimal passthrough service worker for PWA installability requirements
  event.respondWith(fetch(event.request).catch(() => new Response("Network error occurred.")));
});
