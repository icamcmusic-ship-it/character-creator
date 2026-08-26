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
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data/traits-core.js',
  './js/data/traits-supplement.js',
  './js/data/traits-situational.js',
  './js/data/traits-tails.js',
  './js/data/traits-depth.js',
  './js/engine.js',
  './js/generate.js',
  './js/render.js',
  './js/app.js',
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()).catch(()=>{}));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>
    Promise.all(keys.filter(k=>k !== CACHE).map(k=>caches.delete(k)))
  ).then(()=>self.clients.claim()));
});

self.addEventListener('fetch', (e)=>{
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // fonts etc. keep their own caching
  e.respondWith(
    caches.match(e.request).then(hit=>{
      if (hit){
        // Refresh in the background so a deploy is picked up on the next load
        // rather than requiring a hard reload.
        fetch(e.request).then(res=>{
          if (res && res.ok) caches.open(CACHE).then(c=>c.put(e.request, res.clone()));
        }).catch(()=>{});
        return hit;
      }
      return fetch(e.request).then(res=>{
        if (res && res.ok && url.pathname.match(/\.(html|css|js)$/)){
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put(e.request, copy));
        }
        return res;
      });
    }).catch(()=> caches.match('./index.html'))
  );
});
