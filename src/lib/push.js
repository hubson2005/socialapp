import { supabase } from '../supabase';

// Clé publique VAPID — sûre à exposer côté client (la clé privée reste uniquement
// dans les secrets de l'Edge Function Supabase).
export const VAPID_PUBLIC_KEY = 'BD2OlfxfIHX7qez1oJtasA8UIXY0n1YSesYkLknVx2aqy6Ds_NbInBPdsGCSXxhdYJA4b1YSUzkz3WWsXo_rIq4';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Enregistre le service worker (idempotent — ne réenregistre pas s'il l'est déjà).
 */
export async function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.error('Échec enregistrement service worker :', err);
    return null;
  }
}

/**
 * Demande la permission de notification, enregistre le service worker, crée un
 * abonnement push, et le sauvegarde dans Supabase (table push_subscriptions)
 * pour l'utilisateur et le profil donnés.
 *
 * Retourne true si l'abonnement a réussi, false sinon.
 */
export async function subscribeToPush(profileId) {
  if (typeof window === 'undefined' || !('PushManager' in window)) {
    console.warn('Push non supporté sur ce navigateur.');
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const registration = await registerServiceWorker();
  if (!registration) return false;

  // Attendre que le SW soit prêt (important sur mobile/PWA)
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const subJson = subscription.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      profile_id: profileId || null,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
    },
    { onConflict: 'endpoint' }
  );

  if (error) {
    console.error('Erreur sauvegarde abonnement push :', error.message);
    return false;
  }

  return true;
}

/**
 * À appeler au chargement de l'app : si la permission de notification est déjà
 * accordée (cas d'un utilisateur ayant accepté avant la mise en place du push),
 * s'assure qu'un abonnement push existe bien et est synchronisé en base.
 * Ne déclenche AUCUNE popup de permission (silencieux).
 */
export async function ensurePushSubscription(profileId) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  if (typeof window === 'undefined' || !('PushManager' in window)) return false;
  return subscribeToPush(profileId);
}

/**
 * Désabonne l'utilisateur des notifications push (local + Supabase).
 */
export async function unsubscribeFromPush() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    await subscription.unsubscribe();
  }
}