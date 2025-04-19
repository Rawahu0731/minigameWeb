// Cache name
const CACHE_NAME = 'othello-game-cache-v5';
// Cache targets
const urlsToCache = [
  '',
  'code/Othello.html',
  'images/970_mo_h.png',
  'manifest.json'
];

// キャッシュの内容を確認する関数
async function inspectCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  console.log('現在のキャッシュ内容:');
  for (const request of keys) {
    console.log('- ', request.url);
  }
}

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Cache opened, adding files...');
        await cache.addAll(urlsToCache);
        console.log('All files cached successfully');
        await inspectCache();
      })
      .catch((err) => {
        console.error('Cache installation failed:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      inspectCache()
    ]).then(() => {
      console.log('Service Worker activated and controlling the page');
    })
  );
});

self.addEventListener('fetch', (event) => {
  console.log('Fetch request for:', event.request.url);
  
  event.respondWith(
    caches.match(event.request)
      .then(async (response) => {
        if (response) {
          console.log('Found in cache:', event.request.url);
          return response;
        }
        
        console.log('Not found in cache, fetching:', event.request.url);
        try {
          const fetchResponse = await fetch(event.request);
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }

          const responseToCache = fetchResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          console.log('Caching new resource:', event.request.url);
          await cache.put(event.request, responseToCache);
          await inspectCache();
          
          return fetchResponse;
        } catch (err) {
          console.error('Fetch failed:', err);
          const fallbackResponse = await caches.match('code/Othello.html');
          if (fallbackResponse) {
            console.log('Using fallback from cache');
            return fallbackResponse;
          }
          return new Response('オフラインです。再度オンライン時にアクセスしてください。', {
            headers: { 'Content-Type': 'text/html;charset=utf-8' }
          });
        }
      })
  );
});
