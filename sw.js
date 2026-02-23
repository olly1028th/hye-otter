const CACHE_NAME = 'hyeotter-v2';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/otter-svg.js',
  './js/api.js',
  './js/tamagotchi.js',
  './js/timer.js',
  './js/mood.js',
  './js/todo.js',
  './js/share.js',
  './js/notification.js',
  './js/app.js',
  './share.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // API 요청은 캐시하지 않음 (실시간 공유 데이터)
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((response) => {
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
