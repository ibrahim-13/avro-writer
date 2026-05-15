'use strict';

const CACHE_NAME = 'avro-writer-v1';

// All static assets that must be pre-cached for offline use.
// This list must be kept in sync whenever files are added, removed, or renamed.
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.json',
  './assets/favicon.ico',
  './assets/logo192.png',
  './assets/logo512.png',
  './assets/external-link.png',
  './assets/avro-keyboard-layout.png',
  './lib/avro.min.202102220019.js',
  './lib/avro.worker.202301052101.js',
  './lib/comlink.min.202301052101.js',
];

// Install: pre-cache all static assets.
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Take control immediately without waiting for old SW to become idle.
  self.skipWaiting();
});

// Activate: delete all caches that are not the current version.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  // Claim all existing clients so they immediately use the new SW.
  self.clients.claim();
});

// Fetch: cache-first strategy.
// 1. Check cache — return immediately if found.
// 2. If not in cache, fetch from network, cache the response, return it.
// 3. If both fail (offline + not cached), the request simply fails.
self.addEventListener('fetch', function (event) {
  // Only handle GET requests. Let POST etc. go directly to the network.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then(function (networkResponse) {
        // Cache successful responses for future use.
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});

// SKIP_WAITING message: allows the app to trigger an immediate SW update.
// Usage from main thread: navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
