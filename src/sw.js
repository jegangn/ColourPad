// src/sw.js
const CACHE = 'colorpad-v13';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css',
  './css/components.css',
  './css/screens.css',
  './js/app.js',
  './js/lib/util.js',
  './js/lib/render.js',
  './js/lib/router.js',
  './js/lib/storage.js',
  './js/lib/audio.js',
  './js/lib/voice.js',
  './js/lib/paint.js',
  './js/lib/photo-to-outline.js',
  './js/screens/home.js',
  './js/screens/picker.js',
  './js/screens/colour.js',
  './js/screens/gallery.js',
  './js/screens/parent.js',
  './js/screens/photo-upload.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/pictures/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Tolerate missing files (e.g. picture manifest before Task 16 runs)
    await Promise.allSettled(PRECACHE.map(url => cache.add(url)));
    try {
      const m = await fetch('./assets/pictures/manifest.json').then(r => r.json());
      await Promise.allSettled(m.map(p => cache.add('./assets/pictures/' + p.svg)));
    } catch {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    return cached || fetch(e.request);
  })());
});
