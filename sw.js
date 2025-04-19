// Cache name
const CACHE_NAME = 'othello-game-cache-v3';
// Cache targets
const urlsToCache = [
  '',
  'code/Othello.html',
  'images/970_mo_h.png',
  'manifest.json',
  '.'
];

// 相対パスを絶対パスに変換する関数
function getAbsolutePath(url) {
  const base = self.registration.scope;
  return new URL(url, base).href;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // URLを絶対パスに変換してキャッシュ
        const urlsToCache_abs = urlsToCache.map(url => getAbsolutePath(url));
        return cache.addAll(urlsToCache_abs);
      })
      .catch((err) => {
        console.error('Cache installation failed:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  // 即座にコントロールを開始
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache)
                  .catch(err => {
                    console.error('Cache put failed:', err);
                  });
              });

            return response;
          })
          .catch(() => {
            // メインページへのフォールバック
            return caches.match('./code/Othello.html')
              .then(response => {
                return response || new Response('オフラインです。再度オンライン時にアクセスしてください。', {
                  headers: { 'Content-Type': 'text/html;charset=utf-8' }
                });
              });
          });
      })
  );
});
