/**
 * actions/notifyOwner.js
 * ─────────────────────────────────────────────────────────────────
 * Envoie une notification au propriétaire du profil.
 * Insère dans la table `notifications` (utilisée par NotificationBell).
 * Si la table n'existe pas encore, crée un log de console discret.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from "../../supabase";

/**
 * @param {Object} params
 * @param {Object} params.config      - { message, notifTitle }
 * @param {number} params.profileId
 * @param {Object} params.automation  - La ligne automations complète
 * @param {Object} params.context
 * @returns {Object|null}
 */
export async function notifyOwnerAction({ config, profileId, automation, context }) {
  const title   = config.notifTitle || `Automatisation : ${automation.name}`;
  const message =
    config.message ||
    `Déclencheur activé : ${automation.name}` +
    (context.visitorName ? ` par ${context.visitorName}` : '');

  // Récupérer le user_id du propriétaire depuis link_profiles
  const { data: profile, error: profileError } = await supabase
    .from('link_profiles')
    .select('user_id')
    .eq('id', profileId)
    .single();

  if (profileError || !profile?.user_id) {
    console.warn('[Action:notifyOwner] Impossible de récupérer user_id pour le profil', profileId);
    return null;
  }

  // Insérer la notification
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id:    profile.user_id,
      profile_id: profileId,
      type:       'automation',
      title,
      message,
      read:       false,
    })
    .select()
    .single();

  if (error) {
    // La table notifications peut ne pas encore exister → log discret uniquement
    console.warn('[Action:notifyOwner] Impossible d\'insérer la notification :', error.message);
    return null;
  }

  console.log(`[Action:notifyOwner] Notification créée → user=${profile.user_id}`);
  return data;
}