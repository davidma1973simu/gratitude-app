const CACHE_NAME = 'gratitude-v18';
// Use relative paths that work on GitHub Pages subdirectory
const BASE = self.location.pathname.replace('/sw.js', '');
const ASSETS = [
  BASE + '/index.html',
  BASE + '/diary.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png'
];

// Install: clear ALL old caches first, then cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      // Delete every old cache before installing new one
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => {
      return caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS));
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches + claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML (always get latest), cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  if (request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')) {
    // Network-first for HTML — always try to get the latest version
    event.respondWith(
      fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => caches.match(BASE + '/index.html'))
    );
  } else if (url.includes('/images/') && (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.webp'))) {
    // Cache-first for diary images
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }))
    );
  } else {
    // Cache-first for other static assets
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
