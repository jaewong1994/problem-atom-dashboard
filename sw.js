const CACHE_PREFIX = "problem-atom-";
const CACHE_NAME = `${CACHE_PREFIX}shell-v5`;
const SHELL = [
  "./",
  "./index.html",
  "./entry.css",
  "./entry.js",
  "./dashboard.html",
  "./styles.css",
  "./grouped.css",
  "./season.css",
  "./app.js",
  "./realtime-config.js",
  "./realtime.js",
  "./season-config.json",
  "./vision.html",
  "./vision.css",
  "./vision.js",
  "./asset-library.html",
  "./asset-library.css",
  "./ontology-boundary.css",
  "./asset-library.js",
  "./pwa-install.css",
  "./pwa-install.js",
  "./manifest.webmanifest",
  "./assets/pwa/icon-192.png",
  "./assets/pwa/icon-512.png",
  "./assets/pwa/icon-maskable-512.png",
  "./assets/pwa/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" || url.pathname.endsWith("dashboard-data.json") || url.pathname.endsWith("progress-summary.json") || url.pathname.endsWith("asset-library.json") || url.pathname.endsWith("realtime-config.js")) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (_error) {
    return (await cache.match(request)) || (await cache.match("./index.html"));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const refreshed = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || refreshed;
}
