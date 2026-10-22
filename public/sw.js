// Service worker minimal : l'application s'ouvre hors ligne ; les médias restent sur le disque.
const V = 'memories-reader-v1'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())))
self.addEventListener('fetch', e => {
  const r = e.request
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return
  e.respondWith((async () => {
    const c = await caches.open(V), hit = await c.match(r)
    if (r.mode === 'navigate') { // page : réseau d'abord, cache en secours
      try { const res = await fetch(r); c.put(r, res.clone()); return res } catch { return hit || (await c.match('./')) || Response.error() }
    }
    if (hit) return hit // fichiers hachés par Vite : cache d'abord
    const res = await fetch(r)
    if (res.ok) c.put(r, res.clone())
    return res
  })())
})
