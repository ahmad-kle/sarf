const CACHE_NAME = "sarf-app-v2";
const urlsToCache = [
  "/sarf/",
  "/sarf/index.html",
  "/sarf/assets/css/style.css",
  "/sarf/assets/js/main.js",
  "/sarf/manifest.json",
  "/sarf/assets/img/icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});