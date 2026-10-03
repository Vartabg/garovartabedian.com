/* A deliberately narrow worker: only the standalone reader is controlled. */
const SHELL = "scripture-reader-shell-20260905a";
const ROOT = "/scripture-reader/";
const FILES = [`${ROOT}index.html`, `${ROOT}reader.css`, `${ROOT}reader.js`, `${ROOT}store.js`, `${ROOT}manifest.webmanifest`, `${ROOT}icon.svg`, `${ROOT}icon-192.png`, `${ROOT}icon-512.png`];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(ROOT)) return;
  const key = event.request.mode === "navigate" ? `${ROOT}index.html` : url.pathname;
  if (!FILES.includes(key)) return;
  event.respondWith(caches.open(SHELL).then(async (cache) => {
    const saved = await cache.match(key);
    return saved ?? fetch(event.request);
  }));
});
