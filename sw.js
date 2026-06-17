const CACHE_NAME = 'gratitude-v3';
// Use relative paths that work on GitHub Pages subdirectory
const BASE = self.location.pathname.replace('/sw.js', '');
const ASSETS = [
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png'
];

// Install: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML (always get latest), cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.mode === 'navigate' || request.url.endsWith('.html')) {
    // Network-first for HTML — always try to get the latest version
    event.respondWith(
      fetch(request).then(response => {
        // Cache the fresh copy
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => caches.match(BASE + '/index.html'))
    );
  } else {
    // Cache-first for static assets (icons, manifest)
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
