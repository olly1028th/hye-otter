const CACHE_NAME = 'hyeotter-v8';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/otter-svg.js',
  './js/api.js',
  './js/tamagotchi.js',
  './js/mood.js',
  './js/todo.js',
  './js/share.js',
  './js/notification.js',
  './js/app.js',
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

  // Stale-while-revalidate: 캐시된 버전을 즉시 반환하되, 백그라운드에서 새 버전을 가져옴
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(e.request).then((cached) => {
        const fetched = fetch(e.request).then((response) => {
          if (response.ok && e.request.method === 'GET') {
            cache.put(e.request, response.clone());
          }
          return response;
        });
        return cached || fetched;
      })
    )
  );
});
