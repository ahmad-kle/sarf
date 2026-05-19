// sw.js - service worker لتطبيق صرافتي

const CACHE_NAME = "exchange-app-v3";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/login.html",
  "/admin.html",
  "/manifest.json",
  "assets/img/icon.png"
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