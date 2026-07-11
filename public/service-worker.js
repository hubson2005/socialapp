const CACHE_NAME = 'socialapp-cache-v1';

// Fichiers statiques essentiels mis en cache dès l'installation
const CORE_ASSETS = [
  '/',
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
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Stratégie : réseau d'abord, secours sur le cache si offline.
// On ne met en cache que le GET (les appels API Supabase en POST/PATCH ne
// sont jamais interceptés) et on ignore les requêtes vers d'autres domaines
// (ex: Supabase, WhatsApp) pour ne jamais servir une réponse API périmée.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        // Si ni le réseau ni le cache n'ont de réponse, on renvoie une
        // Response explicite (sinon respondWith(undefined) plante avec
        // "Failed to convert value to 'Response'").
        return cached || new Response('Hors ligne', { status: 503, statusText: 'Offline' });
      })
  );
});

// --- Notifications Web Push (existant) ---
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
  event.waitUntil(
    clients.openWindow('/')
  );
});