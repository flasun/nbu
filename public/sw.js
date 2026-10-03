// Next Bus Up service worker.
// The board must open at the lot with no signal, and open fast on a weak one.
// - Install saves the page, its scripts and styles, and the fonts the styles use.
// - The page tries the network for NAV_TIMEOUT_MS, then falls back to the saved copy.
// - Hashed /assets/ files never change, so they come from the cache first.
// - A saved page is only replaced once every file it points at is saved too.

const CACHE = "nbu-v3";
const SHELL = "/";
const NAV_TIMEOUT_MS = 2500;
/** Assets referenced by the last saved page, so the one before it keeps working. */
const KEEP_KEY = "/__sw/assets.json";
const ASSET_RE = /\/assets\/[A-Za-z0-9_.-]+\.(?:js|css|woff2)/g;
const STATIC_RE = /\.(?:png|svg|ico|jpg|webp|webmanifest)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE);
        const res = await fetch(SHELL, { cache: "no-store" });
        if (res.ok) await saveShell(cache, res);
      } catch {
        // Offline during install. The next page load fills the cache.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    if (url.pathname === SHELL) event.respondWith(page(event));
    return;
  }
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(event));
    return;
  }
  if (STATIC_RE.test(url.pathname)) event.respondWith(staleWhileRevalidate(event));
});

async function page(event) {
  const cache = await caches.open(CACHE);
  let saving = Promise.resolve();
  const network = fetch(event.request).then((res) => {
    if (res.ok) saving = saveShell(cache, res.clone()).catch(() => {});
    return res;
  });
  event.waitUntil(network.then(() => saving).catch(() => {}));

  const saved = await cache.match(SHELL, { ignoreVary: true });
  if (!saved) return network.catch(() => Response.error());
  const fromNetwork = network.then(
    (res) => (res.status >= 500 ? saved : res),
    () => saved,
  );
  const timeout = new Promise((resolve) => setTimeout(() => resolve(saved), NAV_TIMEOUT_MS));
  return Promise.race([fromNetwork, timeout]);
}

async function cacheFirst(event) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(event.request, { ignoreVary: true });
  if (hit) return hit;
  try {
    const res = await fetch(event.request);
    if (res.ok) event.waitUntil(cache.put(event.request, res.clone()).catch(() => {}));
    return res;
  } catch {
    // Never answer a script or font with the page; that breaks the app harder.
    return Response.error();
  }
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(event.request, { ignoreVary: true });
  const refresh = fetch(event.request).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      return cache.put(event.request, copy).then(
        () => res,
        () => res,
      );
    }
    return res;
  });
  if (hit) {
    event.waitUntil(refresh.catch(() => {}));
    return hit;
  }
  return refresh.catch(() => Response.error());
}

/** Save the page last, after everything it loads, so a saved page is never missing a file. */
async function saveShell(cache, res) {
  const html = await res.clone().text();
  const assets = new Set(html.match(ASSET_RE) ?? []);
  for (const css of [...assets].filter((path) => path.endsWith(".css"))) {
    const sheet = await saveAsset(cache, css);
    if (!sheet) return;
    for (const font of (await sheet.text()).match(ASSET_RE) ?? []) assets.add(font);
  }
  const saved = await Promise.all([...assets].map((path) => saveAsset(cache, path)));
  if (saved.some((hit) => !hit)) return;
  await cache.put(SHELL, res);
  await prune(cache, assets);
}

/** Cached copy if there is one, otherwise fetch and cache it. Null on failure. */
async function saveAsset(cache, path) {
  const hit = await cache.match(path, { ignoreVary: true });
  if (hit) return hit;
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    await cache.put(path, res.clone());
    return res;
  } catch {
    return null;
  }
}

/** Drop hashed files that neither the current page nor the one before it uses. */
async function prune(cache, current) {
  const prev = await cache.match(KEEP_KEY);
  const previous = prev ? await prev.json().catch(() => []) : [];
  const keep = new Set([...current, ...previous]);
  for (const req of await cache.keys()) {
    const path = new URL(req.url).pathname;
    if (path.startsWith("/assets/") && !keep.has(path)) await cache.delete(req);
  }
  await cache.put(
    KEEP_KEY,
    new Response(JSON.stringify([...current]), { headers: { "content-type": "application/json" } }),
  );
}
