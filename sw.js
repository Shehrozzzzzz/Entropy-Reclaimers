/* © 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
const CACHE_NAME = 'entropy-v8';

self.addEventListener('install', (event) => {
  console.log('Service Worker v5 installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker v5 activated - Clearing old caches');
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch fresh from network for API and JS calls
  if (event.request.url.includes('/api/') || event.request.url.includes('/js/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
