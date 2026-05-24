// Karteia — static asset cache only.
// Do not cache authenticated pages or API responses.
const CACHE = "karteia-static-v2";
const OLD_CACHES = ["trendio-v1"];
const APP_SHELL = ["/", "/login"];
const PROTECTED_PREFIXES = [
  "/api/",
  "/admin",
  "/dashboard",
  "/comments",
  "/customers",
  "/settings",
  "/ai-content",
  "/portal-helix-2026",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE || OLD_CACHES.includes(k))
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

function isCacheable(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (PROTECTED_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p + "/") || url.pathname.startsWith(p))) {
    return false;
  }
  if (request.headers.has("authorization")) return false;
  if (request.headers.get("cookie")) return false;
  return (
    APP_SHELL.includes(url.pathname) ||
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:css|js|svg|png|jpg|jpeg|webp|ico|woff2?)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  if (!isCacheable(event.request)) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (!res.ok) return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request)),
  );
});
