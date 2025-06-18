// Smart service worker with environment-aware caching
const CACHE_VERSION = 'v2.1.0';
const CACHE_NAME = `poopalotzi-${CACHE_VERSION}`;

// Detect development environment
const isDev = self.location.hostname === 'localhost' || 
              self.location.hostname.includes('replit') ||
              self.location.hostname.includes('127.0.0.1') ||
              self.location.port !== '';

console.log(`Service Worker ${CACHE_VERSION} starting - Environment: ${isDev ? 'Development' : 'Production'}`);

// In development, disable all caching by self-destructing
if (isDev) {
  console.log('Development mode detected - Service Worker will not cache anything');
  self.addEventListener('install', () => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', () => {
    self.clients.claim();
    // Clear all caches in development
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    });
  });
  
  // Bypass all caching in development
  self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
  });
  
  // Exit early - don't register any other event listeners
  return;
}

// Install event - skip waiting in development
self.addEventListener('install', event => {
  console.log(`Service Worker ${CACHE_VERSION} installing`);
  
  if (isDev) {
    // In development, skip waiting and activate immediately
    self.skipWaiting();
    console.log('Development mode: Skipping waiting');
  } else {
    // In production, cache essential assets
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll([
          '/',
          '/manifest.json',
          '/logo192.png',
          '/logo512.png'
        ]).catch(err => {
          console.warn('Failed to cache some assets:', err);
        });
      })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log(`Service Worker ${CACHE_VERSION} activating`);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - network-first strategy with environment awareness
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Always bypass cache for API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // In development, always fetch from network
  if (isDev) {
    event.respondWith(
      fetch(request).catch(err => {
        console.warn('Network request failed in dev:', err);
        return new Response('Network error in development', { status: 503 });
      })
    );
    return;
  }
  
  // Production: Network-first strategy for HTML, cache-first for assets
  if (request.destination === 'document' || request.url.includes('.html')) {
    // Network-first for HTML documents
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  } else {
    // Cache-first for assets (CSS, JS, images)
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          // Update cache in background
          fetch(request).then(fetchResponse => {
            if (fetchResponse.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, fetchResponse);
              });
            }
          }).catch(() => {
            // Ignore network errors for background updates
          });
          return response;
        }
        
        return fetch(request).then(fetchResponse => {
          if (fetchResponse.ok) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return fetchResponse;
        });
      })
    );
  }
});

// Message handling for manual cache clearing
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});