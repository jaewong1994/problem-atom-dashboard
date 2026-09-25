const CACHE_PREFIX = "problem-atom-";
const CACHE_NAME = `${CACHE_PREFIX}shell-v50-problem-design`;
const SHELL = [
  "./creator.js?v=design1", "./creator.css?v=design1", "./problem-design.js?v=design1", "./math-policy.js?v=policy1",
  "./account-supabase.js?v=team2", "./account-client.js?v=setup6", "./account.css?v=team2",
  "./studio.html", "./connections.html", "./connections.css?v=io1", "./connections.js?v=names1", "./connection-engine.js?v=design2", "./connection-registry.json",
  "./curriculum-model.js?v=select2", "./unit-ui.js?v=stock2", "./units.css?v=unit1", "./judgment-bundles.js?v=names1", "./authoring-model.js?v=unit1", "./authoring-ui.js?v=stock2", "./authoring.css?v=select2", "./authoring-lessons.json",
  "./web-handoff.js?v=design1", "./production-io.js?v=team1", "./composition-graph.js?v=map1", "./box-copy.js?v=names1", "./box-examples.js?v=cards1", "./composition-planner.js?v=unit1", "./model-contract.js?v=design1", "./selection-model.js?v=map1", "./session-client.js?v=design1", "./model-provider.json",
  "./review-groups.json", "./group-review-ledger.json", "./group-review.js?v=names1", "./review-model.js?v=review1", "./review-client.js?v=team1", "./review-link.css?v=review1", "./review-catalog.json", "./sandbox.css",
  "./combination-examples.json", "./combination-examples.js",
  "./motif-library.html",
  "./motif-library.css",
  "./motif-library.js",
  "./motif-library.json",
  "./",
  "./index.html",
  "./entry.css?v=design1",
  "./entry.js?v=design1",
  "./site-shell.css?v=flow3",
  "./dashboard.html",
  "./styles.css",
  "./grouped.css",
  "./season.css",
  "./app.js?v=team1",
  "./realtime-config.js",
  "./realtime.js?v=team1",
  "./season-config.json",
  "./vision.html",
  "./vision.css",
  "./vision.js",
  "./asset-library.html",
  "./asset-library.css",
  "./ontology-boundary.css",
  "./asset-library.js?v=names1",
  "./promotion-board.html",
  "./promotion-board.css",
  "./promotion-board.js?v=review1",
  "./promotion-board.json",
  "./math-text.js",
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
  if (/\/seminar-structure-report\.(html|json|md|js|css)$/.test(url.pathname)) { event.respondWith(Promise.resolve(new Response("Not found", {status:404}))); return; }
  if (url.pathname.startsWith('/team/') || url.pathname.endsWith('/account-config.js') || url.pathname.startsWith('/session/') || url.hostname === '127.0.0.1' || url.hostname === 'localhost') return;

  if (request.mode === "navigate" || /\/(review-groups|review-catalog|group-review-ledger|combination-examples|connection-registry|connection-validation|model-provider)\.json$/.test(url.pathname) || url.pathname.endsWith("motif-library.json") || url.pathname.endsWith("dashboard-data.json") || url.pathname.endsWith("progress-summary.json") || url.pathname.endsWith("asset-library.json") || url.pathname.endsWith("promotion-board.json") || url.pathname.endsWith("realtime-config.js")) {
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
