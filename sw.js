const CACHE_NAME = "sarf-app-v6";
const urlsToCache = [
  ".",
  "index.html",
  "assets/js/main.js",
  "manifest.json",
  "assets/img/icon512.png",
  "assets/img/icon192.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  // تجاهل طلبات الـ API ولا تخزنها مؤقتاً
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('gold-api.com') ||
      event.request.url.includes('exchangerate')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 408 })));
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    self.clients.claim();
  }
});