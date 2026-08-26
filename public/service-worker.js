const CACHE_NAME = 'socialapp-cache-v3'; // ⬅️ bump this on every deploy (or generate at build time)

const CORE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/Logo_SocialApp.png',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests (index.html / app shell) must ALWAYS go to the
  // network first and never be served stale — this is what was causing
  // old, since-deleted hashed chunk URLs to be requested after a deploy.
  // [FIX PWA] Si le cache de secours ('/') est lui-même absent (première
  // visite jamais mise en cache, ou navigation vers une page jamais
  // visitée) on affiche désormais /offline.html plutôt que rien.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () =>
        (await caches.match(request)) ||
        (await caches.match('/')) ||
        caches.match('/offline.html')
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // ⬅️ THE KEY FIX: only cache genuinely successful responses.
        // Previously a 403/404 response was cached forever, so even
        // after fixing the deploy, the browser kept re-serving the
        // cached failure for that URL.
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || new Response('Hors ligne', { status: 503, statusText: 'Offline' });
      })
  );
});

// --- Push notifications (unchanged) ---
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'SocialApp', {
      body: data.body || '',
      icon: '/Logo_SocialApp.png',
      badge: '/Logo_SocialApp.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});