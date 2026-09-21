/* Service worker: the app ships ~3MB of JavaScript, nearly all of it the trait bank,
   and every visit re-downloaded the lot. Cache-first for the shell, with a version
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
  './js/engine.js',
  './js/generate.js',
  './js/render.js',
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

self.addEventListener('fetch', (e)=>{
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // fonts etc. keep their own caching
  e.respondWith(
    caches.match(e.request).then(hit=>{
      if (hit){
        /* Refresh in the background so a deploy is picked up on the next load rather
           than requiring a hard reload — but keep the event alive while it happens.
           Without waitUntil the browser is free to kill the worker mid-write, which is
           how a cache ends up holding half of one build and half of the next. */
        const refresh = fetch(e.request).then(res=>{
          if (res && res.ok) return caches.open(CACHE).then(c=>c.put(e.request, res.clone()));
        }).catch(()=>{});
        if (e.waitUntil) e.waitUntil(refresh);
        return hit;
      }
      return fetch(e.request).then(res=>{
        if (res && res.ok && url.pathname.match(/\.(html|css|js)$/)){
          const copy = res.clone();
          const write = caches.open(CACHE).then(c=>c.put(e.request, copy));
          if (e.waitUntil) e.waitUntil(write.catch(()=>{}));
        }
        return res;
      });
    }).catch(()=> {
      /* The index.html fallback is for NAVIGATIONS only. Applied to everything, a
         failed script or stylesheet fetch was answered with a page of HTML — which the
         browser then tried to parse as JavaScript or CSS, producing a syntax error
         that says nothing about the real problem (the network). Anything else fails as
         what it is. */
      if (e.request.mode === 'navigate' || (e.request.headers.get('accept')||'').includes('text/html')){
        return caches.match('./index.html');
      }
      return Response.error();
    })
  );
});

/* Let the page ask for the waiting worker to take over, so an update can be an
   explicit "reload for the new version" rather than a silent swap mid-session. */
self.addEventListener('message', (e)=>{
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
