/* Minimal offline cache for NEON RUNNER */
const CACHE = "neon-runner-v2.0.8";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/main.js",
  "./src/main.js?v=2.0.8",
  "./src/game.js",
  "./src/simulation.js",
  "./src/render.js",
  "./src/level.js",
  "./src/audio.js",
  "./src/sectorTheme.js",
  "./src/story.js",
  "./src/meta.js",
  "./src/leaderboard.js",
  "./src/input.js",
  "./src/ui.js",
  "./src/state.js",
  "./src/physics.js",
  "./src/dom.js",
  "./src/constants.js",
  "./src/style.css",
  "./src/style.css?v=2.0.8",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/cyber-rex.png",
  "./assets/cyber-rex@2x.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.ok && new URL(req.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
