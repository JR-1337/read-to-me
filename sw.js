const CACHE_NAME = 'rtm-shell-v2';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/app.js',
  './js/settings.js',
  './js/api.js',
  './js/chunker.js',
  './js/player.js',
  './js/media-session.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Never cache Google API calls
  if (event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request))
  );
});
