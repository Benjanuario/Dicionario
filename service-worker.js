// service-worker.js
const CACHE_NAME = 'emakhua-dictionary-v1';
const DB_CACHE_NAME = 'emakhua-db-cache';

// Arquivos para cache
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/sqlite-wasm.js',
  '/wasm/sql-wasm.wasm',
  '/data/dicionario.db',
  '/css/styles.css',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DB_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  // Para o arquivo do banco de dados, usar cache especial
  if (event.request.url.includes('/data/dicionario.db')) {
    event.respondWith(
      caches.open(DB_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // Para outros arquivos, estratégia cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(networkResponse => {
          // Não cachear requisições não-GET ou de API
          if (event.request.method !== 'GET' || 
              event.request.url.includes('/api/')) {
            return networkResponse;
          }
          
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return networkResponse;
        });
      })
  );
});
