/*
 * INDTEC EXPO service worker — offline + static asset caching.
 * Registered by ServiceWorkerRegister in production only.
 */

const CACHE_VERSION = "indtec-static-v1";
const PRECACHE_URLS = ["/", "/images/brand/logo-light.svg"];
const NETWORK_TIMEOUT_MS = 4000;

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>INDTEC EXPO — Offline</title>
<style>
body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:#071427;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center}
.wrap{padding:32px;max-width:480px}
h1{font-size:1.5rem;margin:0 0 8px;letter-spacing:.04em}
p{color:#c2ccd9;line-height:1.6;margin:0 0 20px}
a{display:inline-block;background:#1f74dd;color:#fff;padding:12px 22px;text-decoration:none;font-weight:600}
</style>
</head>
<body><div class="wrap">
<h1>You are offline</h1>
<p>The page you are looking for is not available without a connection. Please check your network and try again.</p>
<a href="/">Retry</a>
</div></body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(new Request(url, { cache: "reload" })).catch(() => null),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("indtec-") && key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/")
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("offline-timeout")), NETWORK_TIMEOUT_MS),
    );
    const response = await Promise.race([fetch(request), timeout]);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached =
      (await cache.match(request)) ||
      (await cache.match("/")) ||
      (await cache.match("/index.html"));
    if (cached) return cached;
    return new Response(OFFLINE_HTML, {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
