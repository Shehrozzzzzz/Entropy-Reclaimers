const CACHE_NAME = 'entropy-v4';

self.addEventListener('install', (event) => {
  console.log('Service Worker v4 installed');
  // Force this new SW to activate immediately (don't wait for old tabs)
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker v4 activated');
  // Delete ALL old caches to force fresh content
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('Deleting old cache:', k);
        return caches.delete(k);
      })
    )).then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // ALWAYS fetch HTML fresh from network (never serve stale HTML)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then(cached => {
          return cached || new Response('Offline — please reconnect', {
            status: 503, headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
    );
    return;
  }

  // For other assets: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          return cached || new Response('Offline', { status: 503 });
        });
      })
  );
});
