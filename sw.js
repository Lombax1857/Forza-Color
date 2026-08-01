/* Forza Paint Archive — service worker.

   Chrome will not offer "Install" without a registered service worker that has
   a fetch handler, which is why a single HTML file can only ever be saved as a
   page. This provides that, and while it is here it may as well make the app
   work offline: the archive is a 486 KB self-contained file with no server
   dependency beyond two CDN scripts.

   Strategy is stale-while-revalidate. The app opens instantly from cache and
   quietly updates in the background, so a redeploy lands on the next launch
   rather than blocking this one. */

const VERSION = "paint-archive-2026-08-02.1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./env-forest.jpg",
  "./env-bunker.jpg",
  "./env-fuji.jpg",
  "./env-golden.jpg",
  "./env-overcast.jpg",
  "./env-tokyo.jpg",
  "./env-studio.jpg",
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION)
      /* Individually, so one unreachable CDN cannot fail the whole install. */
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;

  /* The shell is network-FIRST. Stale-while-revalidate served the previous
     build on the first load after a deploy, which makes a fix look like it did
     not land. Cache is the offline fallback only. */
  if(req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname)){
    e.respondWith(
      fetch(req)
        .then(r => {
          const copy = r.clone();
          caches.open(VERSION).then(c => c.put("./index.html", copy));
          return r;
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(r => {
        if(r && r.status === 200 && (r.type === "basic" || r.type === "cors")){
          const copy = r.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});

/* Lets the page ask for an immediate update rather than waiting a launch. */
self.addEventListener("message", e => {
  if(e.data === "skipWaiting") self.skipWaiting();
});
