// service-worker.js
//
// [DL-SW0] Base inchangée : cache de l'app shell, navigation réseau-
// d'abord avec repli offline, notifications push — c'est le fichier
// existant du repo, non réécrit.
//
// [DL-SW1] AJOUT — cache dédié aux profils publics (StaleWhileRevalidate) :
// contrairement au reste du site (réseau d'abord, cache seulement en
// secours si offline), un profil déjà visité s'affiche désormais
// INSTANTANÉMENT depuis le cache, pendant qu'une requête réseau met à
// jour ce cache en arrière-plan pour la prochaine visite. Détecté par un
// pattern d'URL à un seul segment (/nomduprofil) qui exclut explicitement
// les routes connues de l'app (dashboard, login, etc.) pour ne jamais
// intercepter autre chose qu'un vrai profil public.
//
// [DL-SW2] AJOUT — cache dédié aux images Supabase Storage
// (CacheFirst + plafond) : évite de re-télécharger avatar/bannière/
// produits à chaque visite d'un profil déjà vu, avec une limite de
// 80 entrées (les plus anciennes sont évincées en premier) pour ne pas
// saturer indéfiniment le stockage du téléphone du visiteur.
//
// Le reste (assets JS/CSS, autres pages, requêtes API/écriture) continue
// de passer par la logique réseau-d'abord existante, inchangée.

const CACHE_NAME = 'socialapp-cache-v4'; // [DL-SW] bump v3 → v4 : nouvelle logique de fetch
const PROFILE_CACHE_NAME = 'socialapp-profiles-v1'; // [DL-SW1]
const IMAGE_CACHE_NAME   = 'socialapp-images-v1';   // [DL-SW2]
const IMAGE_CACHE_MAX_ENTRIES = 80; // [DL-SW2]

const CORE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/Logo_SocialApp.png',
  '/icon-192.png',
  '/icon-512.png',
];

// [DL-SW1] Routes de l'app à NE PAS traiter comme un profil public — tout
// premier segment d'URL absent de cette liste est considéré comme un
// éventuel username (/hubert, /ma-boutique, ...). À compléter si de
// nouvelles routes racine sont ajoutées à l'app.
const APP_ROOT_ROUTES = new Set([
  '', 'dashboard', 'login', 'contact', 'reset-password',
  'terms-of-service', 'privacy-policy', 'delete-account',
  'whatsapp-crm', 'manifest.json', 'offline.html', 'service-worker.js',
  'favicon-socialapp.png', 'icons.svg', 'og-image.png', 'robots.txt', 'sitemap.xml',
]);

function isPublicProfileRequest(url) {
  if (url.origin !== self.location.origin) return false;
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length !== 1) return false; // /username uniquement, pas /username/sous-route
  return !APP_ROOT_ROUTES.has(segments[0]);
}

function isSupabaseStorageImage(url) {
  return /\.supabase\.co$/.test(url.hostname) && url.pathname.includes('/storage/v1/object/public/');
}

// [DL-SW2] Évince les entrées les plus anciennes au-delà de maxEntries.
// Cache API n'a pas d'expiration native — on gère manuellement via
// l'ordre d'insertion (keys() retourne l'ordre d'ajout).
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

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
          // [DL-SW1][DL-SW2] Les deux nouveaux caches sont exclus du nettoyage
          // par nom exact (ils gèrent leur propre cycle de vie via trimCache).
          .filter((key) => key !== CACHE_NAME && key !== PROFILE_CACHE_NAME && key !== IMAGE_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin && !isSupabaseStorageImage(url)) return;

  // [DL-SW2] Images Supabase Storage — CacheFirst + plafond.
  if (isSupabaseStorageImage(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response.clone());
            trimCache(IMAGE_CACHE_NAME, IMAGE_CACHE_MAX_ENTRIES); // fire-and-forget
          }
          return response;
        } catch {
          return cached || new Response('', { status: 504, statusText: 'Offline (image)' });
        }
      })
    );
    return;
  }

  // [DL-SW1] Profils publics — StaleWhileRevalidate : le cache répond
  // immédiatement s'il existe, le réseau met à jour en arrière-plan pour
  // la prochaine visite. Sans entrée en cache (première visite), on
  // attend le réseau normalement, avec repli offline.html en échec.
  if (request.mode === 'navigate' && isPublicProfileRequest(url)) {
    event.respondWith(
      caches.open(PROFILE_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => null);

        if (cached) {
          networkFetch; // mise à jour en arrière-plan, pas attendue
          return cached;
        }
        const fresh = await networkFetch;
        return fresh || (await caches.match('/offline.html'));
      })
    );
    return;
  }

  // ── [DL-SW0] Logique existante, inchangée ─────────────────────────
  // Navigation requests (index.html / app shell) must ALWAYS go to the
  // network first and never be served stale — this is what was causing
  // old, since-deleted hashed chunk URLs to be requested after a deploy.
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