// Service worker: la app abre aunque el wifi del resort esté caído,
// y muestra lo último que se cargó (agenda, info, fotos ya vistas).
const CACHE = 'viaje-v3';
// Si la red tarda más que esto y hay algo guardado, se muestra lo guardado
// (el wifi "conectado pero sin internet" es el peor caso).
const ESPERA_RED_MS = 4000;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
  return res;
}

async function networkFirst(req, fallback) {
  const cache = await caches.open(CACHE);
  const red = fetch(req).then((res) => {
    if (res.ok && !res.redirected) cache.put(req, res.clone());
    return res;
  });
  red.catch(() => {});

  try {
    const guardado = await cache.match(req);
    if (!guardado) return await red;
    const espera = new Promise((_, rej) => setTimeout(() => rej(new Error('lento')), ESPERA_RED_MS));
    return await Promise.race([red, espera]);
  } catch {
    return (await cache.match(req)) || (fallback && (await cache.match(fallback))) || Response.error();
  }
}

// Descarga páginas + sus JS/CSS/fuentes para que funcionen sin señal.
async function precache(urls) {
  const cache = await caches.open(CACHE);
  const assets = new Set();
  for (const u of urls) {
    try {
      const res = await fetch(u, { credentials: 'same-origin' });
      if (!res.ok || res.redirected) continue;
      const html = await res.clone().text();
      await cache.put(u, res);
      for (const a of html.match(/\/_next\/static\/[^"'\s)\\]+/g) || []) assets.add(a);
    } catch {}
  }
  for (const a of assets) {
    try {
      if (await cache.match(a)) continue;
      const r = await fetch(a);
      if (r.ok) await cache.put(a, r);
    } catch {}
  }
}

self.addEventListener('message', (e) => {
  if (e.data?.tipo === 'precache' && Array.isArray(e.data.urls)) {
    e.waitUntil(precache(e.data.urls));
  }
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fotos de Supabase Storage: no cambian, cache primero
  if (url.pathname.includes('/storage/v1/object/public/')) {
    e.respondWith(cacheFirst(req));
    return;
  }
  // Datos de Supabase: red primero, si no hay señal lo último guardado
  if (url.pathname.includes('/rest/v1/')) {
    e.respondWith(networkFirst(req));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(cacheFirst(req));
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req, '/'));
  }
});
