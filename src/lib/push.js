import { supabase } from "../supabase";

// Clé publique VAPID
export const VAPID_PUBLIC_KEY =
  "BD2OlfxfIHX7qez1oJtasA8UIXY0n1YSesYkLknVx2aqy6Ds_NbInBPdsGCSXxhdYJA4b1YSUzkz3WWsXo_rIq4";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);

  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Enregistre le Service Worker
 */
export async function registerServiceWorker() {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    console.error("Erreur Service Worker :", err);
    return null;
  }
}

/**
 * Souscription aux notifications Push
 */
export async function subscribeToPush(profileId = null) {
  try {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("PushManager" in window)
    ) {
      console.warn("Notifications Push non supportées.");
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("Permission refusée.");
      return false;
    }

    const registration = await registerServiceWorker();

    if (!registration) return false;

    await navigator.serviceWorker.ready;

    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
    }

    const subJson = subscription.toJSON();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Utilisateur non connecté.");
      return false;
    }

    const payload = {
      user_id: user.id,
      profile_id: profileId,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh ?? null,
      auth: subJson.keys?.auth ?? null,
    };

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(payload, {
        onConflict: "endpoint",
      });

    if (error) {
      console.error(
        "Erreur enregistrement abonnement :",
        error
      );
      return false;
    }

    console.log("Notifications Push activées.");

    return true;
  } catch (err) {
    console.error("Erreur Push :", err);
    return false;
  }
}

/**
 * Vérifie automatiquement si un abonnement existe
 */
export async function ensurePushSubscription(profileId = null) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window)
  ) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  return subscribeToPush(profileId);
}

/**
 * Désabonnement
 */
export async function unsubscribeFromPush() {
  try {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const registration =
      await navigator.serviceWorker.getRegistration();

    if (!registration) return;

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) return;

    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", subscription.endpoint);

    await subscription.unsubscribe();

    console.log("Notifications désactivées.");
  } catch (err) {
    console.error("Erreur désabonnement :", err);
  }
}