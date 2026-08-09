const CACHE_NAME = "mycarplus-v6-7";
const CORE = ["./", "./index.html", "./style.css?v=6.7", "./app.js?v=6.7", "./manifest.json"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  const req = event.request;
  if(req.mode === "navigate"){
    event.respondWith(fetch(req).then(res => {
      const copy=res.clone(); caches.open(CACHE_NAME).then(c=>c.put("./index.html",copy)); return res;
    }).catch(()=>caches.match("./index.html")));
    return;
  }
  event.respondWith(fetch(req).then(res => {
    const copy=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req,copy)); return res;
  }).catch(()=>caches.match(req)));
});
