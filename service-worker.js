const CONFIG = {
  CACHE_NAME: 'easymanual-offline-v2',
  ASSETS: [
    './index.html',
    './add.html',
    './map.html',
    './login.html',
    './details.html',
    './offline.html',
    './css/style.css',
    './css/responsive.css',
    './js/app.js',
    './js/index.js',
    './js/add.js',
    './js/map.js',
    './js/login.js',
    './js/details.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
  ],
  OFFLINE_PAGE: './offline.html',
  DOCUMENT_EXTENSIONS: ['.html', '.json']
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CONFIG.CACHE_NAME).then((cache) => {
      // Кэширует все указанные файлы при установке Service Workera
      return cache.addAll(CONFIG.ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        // Удаляет старые версии кэша если изменится CACHE_NAME
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
  const isAsset = url.pathname.includes('/css/') || url.pathname.includes('/js/') || url.pathname.includes('/icons/');

  event.respondWith(
    caches.match(request).then((cached) => {
      // Быстрая стратегия для статических ресурсов - сначала кэш
      if (cached && (isAsset || isDocument)) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return cached || (isDocument ? caches.match(CONFIG.OFFLINE_PAGE) : response);
          }

          const responseToCache = response.clone();
          caches.open(CONFIG.CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache); // Обновляет кэш новыми данными
          });
          return response;
        })
        .catch(() => {
          // Если сеть недоступна - возвращает кэшированную версию или офлайн страницу
          if (cached) return cached;
          if (isDocument) return caches.match(CONFIG.OFFLINE_PAGE);
          throw new Error('Offline and no cache');
        });
    })
  );
});
