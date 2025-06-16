// Disable all caching to force fresh content
console.log('Service worker disabled for cache debugging');

// Unregister any existing service worker
self.addEventListener('install', event => {
  console.log('Service worker installing but doing nothing');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service worker activating and clearing all caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Always fetch from network, never cache
self.addEventListener('fetch', event => {
  console.log('Service worker bypassing cache for:', event.request.url);
  event.respondWith(fetch(event.request));
});