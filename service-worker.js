// Service Worker v2.1.0
// Network first strategy for better performance with offline support

const CACHE_NAME = 'papeleta-cache-v2.1.5';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/img/lpsolutionsblack.webp'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Caching assets for v2.1.5');
            return cache.addAll(URLS_TO_CACHE).catch(err => {
                console.log('[Service Worker] Partial cache - some assets unavailable offline');
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        // Try network first
        fetch(event.request)
            .then(response => {
                // Check if valid response
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Clone and cache successful responses
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });

                return response;
            })
            .catch(() => {
                // Fallback to cache when network fails
                return caches.match(event.request)
                    .then(response => {
                        if (response) {
                            console.log('[Service Worker] Serving from cache:', event.request.url);
                            return response;
                        }
                        // Return offline page if available, or error
                        return new Response('Offline - Resource not available', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

console.log('[Service Worker] v2.1.0 loaded with network-first strategy');
