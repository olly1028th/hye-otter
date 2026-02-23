const CACHE_NAME = 'hyeotter-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/otter-svg.js',
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
  e.respondWith(
    caches.match(e.request).then((cached) => {
      // 캐시 우선, 네트워크 폴백
      return cached || fetch(e.request).then((response) => {
        // 성공 시 캐시에 저장
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
