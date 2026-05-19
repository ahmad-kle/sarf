// sw.js - service worker لتطبيق صرافتي

const CACHE_NAME = "exchange-app-v6";
const urlsToCache = [
  "/sarf/",
  "/sarf/index.html",
  "/sarf/style.css",
  "/sarf/script.js",
  "/sarf/login.html",
  "/sarf/admin.html",
  "/sarf/manifest.json",
  "sarf/assets/img/icon.png"
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// جلب الملفات: أولاً من الشبكة، وإذا فشلت من الكاش
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// حذف الكاش القديم عند تحديث الـ SW
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});