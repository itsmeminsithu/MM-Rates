const SHELL = "mmrates-shell-v8";
const DATA = "mmrates-data-v2";
const ASSETS = ["/", "/app.css", "/app.js", "/manifest.webmanifest", "/privacy.html", "/methodology.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => ![SHELL, DATA].includes(key)).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

function jsonUnavailable() {
  return new Response(JSON.stringify({ error: "offline", message: "Network unavailable and no saved response exists." }), {
    status: 503,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function offlineCopy(response) {
  const headers = new Headers(response.headers);
  headers.set("x-mm-rates-offline", "1");
  return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers });
}

async function networkFirstData(request) {
  const cache = await caches.open(DATA);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ? offlineCopy(cached) : jsonUnavailable();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.method === "GET" && (url.pathname === "/v1/latest" || url.pathname === "/v1/history")) {
    event.respondWith(networkFirstData(request));
    return;
  }

  if (url.pathname.startsWith("/v1/")) {
    event.respondWith(fetch(request).catch(jsonUnavailable));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(request).then((hit) => hit || caches.match("/"))));
    return;
  }

  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
