/* Service worker: the app ships ~3MB of JavaScript, nearly all of it the trait bank,
   and every visit re-downloaded the lot. Network-first with an offline precache, with a version
   stamp so a deploy invalidates it. The app works fine without this — registration
   is best-effort and every handler falls back to the network.

   BUILD_ID below is rewritten to the commit SHA by the deploy workflow. It was
   previously the literal "v1" and nothing bumped it, which made the activate-time
   purge below dead code and left returning users on stale JS; the stale-while-revalidate
   path covered for it, one load late, every time.

   The stamp is a named constant rather than being spliced into the cache name in
   place, for two reasons. The workflow's `sed` had to match the whole literal
   `character-voice-v1`, so a harmless rename of the cache prefix would silently stop
   the substitution from applying (the `grep -q` guard catches it, but only in CI).
   And a local file:// open or a self-hosted deploy never runs the workflow at all, so
   BUILD_ID stays 'dev' there — which is now a visible, self-describing state ("this
   build was never stamped") rather than a stamp that looks real and isn't. Bump it by
   hand when testing the purge path locally. */
const BUILD_ID = 'dev';   // ← rewritten to the commit SHA by .github/workflows/deploy.yml
const CACHE = 'character-voice-' + BUILD_ID;
/* Must list EVERY same-origin script and stylesheet index.html loads, in load order.
   traits-balance.js and traits-tails2.js were missing: the lazy runtime-cache path in
   the fetch handler covered for them on a warm load, so nothing ever looked wrong, but
   a cold offline install shipped a trait bank two data files short. These are also the
   two files most likely to grow, so the list drifts by default — tests/run.js now
   asserts this array against index.html's own tags, and CI fails on a mismatch rather
   than a user discovering it offline. */
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data/traits-core.js',
  './js/data/traits-supplement.js',
  './js/data/traits-situational.js',
  './js/data/traits-tails.js',
  './js/data/traits-depth.js',
  './js/data/traits-balance.js',
  './js/data/traits-tails2.js',
  './js/data/traits-cells.js',
  './js/data/traits-polarity.js',
  './js/data/traits-life.js',
  './js/data/traits-gaps.js',
  './js/engine.js',
  './js/generate.js',
  './js/render.js',
  './js/mechanics.js',
  './js/app.js',
];

/* Everything this app owns lives under one name prefix, and ONLY caches under that
   prefix are ever deleted. CacheStorage is origin-wide: on GitHub Pages this app can
   share an origin with every other project the same account publishes, and the old
   activate handler deleted every cache whose name was not this one — wiping a sibling
   app's offline data even though its service worker has a different path scope. */
const CACHE_PREFIX = 'character-voice-';

/* Install must be all-or-nothing. It used to `.catch(()=>{})` a failed precache and
   then resolve, so the worker activated claiming to hold a complete shell while
   holding a partial one — and a cold offline load found the trait bank short. Let the
   rejection propagate: a failed install means no activation, the previous worker stays
   in charge, and the next visit tries again. */
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>
    Promise.all(keys
      .filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE)   // OURS, and obsolete
      .map(k => caches.delete(k)))
  ).then(()=>self.clients.claim()));
});

/* NETWORK-FIRST, for everything same-origin (B10). This was cache-first with a
   background refresh, which had three faults: every deploy showed up one load late; the
   refresh replaced files one at a time, so a page could run a new app.js against an old
   engine.js (a mixed build); and with BUILD_ID left at 'dev' outside CI the cache never
   busted at all. Now the network is always asked first — with `cache: 'no-cache'`, so the
   HTTP cache revalidates and an unchanged 3 MB trait bank costs a 304, not a download —
   and the cache is only the offline fallback. Online, every file comes from the same
   deploy; offline, every file comes from the same precache. */
self.addEventListener('fetch', (e)=>{
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // fonts etc. keep their own caching
  const isNav = e.request.mode === 'navigate' || (e.request.headers.get('accept')||'').includes('text/html');
  const netReq = isNav ? e.request : new Request(e.request, {cache: 'no-cache'});
  e.respondWith(
    fetch(netReq).then(res=>{
      if (res && res.ok && (isNav || url.pathname.match(/\.(html|css|js)$/))){
        const copy = res.clone();
        const write = caches.open(CACHE).then(c=>c.put(isNav ? './index.html' : e.request, copy));
        // Keep the worker alive until the write lands, or the cache can be left half-written.
        if (e.waitUntil) e.waitUntil(write.catch(()=>{}));
      }
      return res;
    }).catch(()=>
      caches.match(e.request, {ignoreSearch: isNav}).then(hit=>{
        if (hit) return hit;
        /* The index.html fallback is for NAVIGATIONS only. Applied to everything, a
           failed script fetch was answered with a page of HTML, which the browser then
           tried to parse as JavaScript. Anything else fails as what it is. */
        if (isNav) return caches.match('./index.html');
        return Response.error();
      })
    )
  );
});

/* The SKIP_WAITING message handler that used to be here was dead code: nothing ever
   posted it, and install already calls skipWaiting(). The page now watches for a new
   worker itself (see watchForUpdates in app.js) and offers a reload. */
