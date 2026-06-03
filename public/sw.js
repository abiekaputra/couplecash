// CoupleCash — basic service worker
// Caches the app shell (static assets) for offline use.
// Strategy: network-first for pages, cache-first for static assets.

const CACHE = "couplecash-v1";
const SHELL = ["/", "/login", "/manifest.webmanifest", "/icons/icon-192.svg", "/icons/icon-512.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, API, _next
  if (request.method !== "GET") return;
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  // Static assets: cache-first
  if (url.pathname.match(/\.(svg|png|ico|woff2|css|js)$/)) {
    e.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((r) => {
        const clone = r.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
        return r;
      }))
    );
    return;
  }

  // Pages: network-first, fall back to cached shell
  e.respondWith(
    fetch(request).catch(() => caches.match(request) || caches.match("/"))
  );
});
