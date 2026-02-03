const CONFIG = {
  CACHE_NAME: 'easymanual-offline-v6',
  STATIC_ASSETS: [
    '/css/style.css',
    '/css/responsive.css',
    '/js/app.js',
    '/js/index.js',
    '/js/add.js',
    '/js/map.js',
    '/js/login.js',
    '/js/details.js',
    '/manifest.json'
  ],
  DOCUMENT_EXTENSIONS: ['.html', '.json'],
  OFFLINE_PAGE: '/offline.html'
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CONFIG.CACHE_NAME).then((cache) => {
      // Кэшируем только статические ассеты при установке, не документы
      return Promise.all(
        CONFIG.STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn(`Failed to cache ${url}:`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== CONFIG.CACHE_NAME ? caches.delete(k) : null))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isDocument = CONFIG.DOCUMENT_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
  const isAsset = url.pathname.includes('/css/') || url.pathname.includes('/js/');

  // Стратегия для документов: network-first (сначала сеть)
  if (isDocument) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return caches.match(request)
              .then(cached => cached || caches.match(CONFIG.OFFLINE_PAGE))
              .then(res => res || new Response('Offline', { status: 503 }));
          }
          const responseToCache = response.clone();
          caches.open(CONFIG.CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cached => cached || caches.match(CONFIG.OFFLINE_PAGE))
            .then(res => res || new Response('Offline', { status: 503 }));
        })
    );
    return;
  }

  // Стратегия для ассетов: cache-first (сначала кэш)
  if (isAsset) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) return cached;
          
          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200) {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CONFIG.CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
              return response;
            })
            .catch(() => {
              return new Response('Asset not found', { status: 404 });
            });
        })
    );
    return;
  }

  // Для остального: network-first с fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CONFIG.CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(cached => cached || caches.match(CONFIG.OFFLINE_PAGE))
          .then(res => res || new Response('Offline', { status: 503 }));
      })
  );
});
