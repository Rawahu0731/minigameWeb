// Cache name
const CACHE_NAME = 'pwa-sample-caches-v1';
// Cache targets
const urlsToCache = [
  'code/index.html',
  'code/Othello.html',
  'images/970_mo_h.png',
  // 不要なキャッシュ対象を削除・コメントアウト
  // './',
  // './index.html',
  // './pages/a.html',
  // './pages/b.html',
  // './pages/c.html',
  // './css/style.css',
  // './images/a.jpg',
  // './images/b.jpg',
  // './images/c.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        // リクエストのクローンを作成
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // レスポンスが有効でない場合は、そのまま返す
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // レスポンスのクローンを作成
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});
