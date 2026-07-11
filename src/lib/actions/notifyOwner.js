/**
 * actions/notifyOwner.js
 * ─────────────────────────────────────────────────────────────────
 * Envoie une notification au propriétaire du profil.
 * Insère dans la table `notifications` (utilisée par NotificationBell).
 * Si la table n'existe pas encore, crée un log de console discret.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from '../../supabase';

/**
 * @param {Object} params
 * @param {Object} params.config      - { message, notifTitle }
 * @param {number} params.profileId
 * @param {Object} params.automation  - La ligne automations complète
 * @param {Object} params.context
 * @returns {Object|null}
 */
export async function notifyOwnerAction({ config, profileId, automation, context }) {
  const title   = config.notifTitle || config.title || `Automatisation : ${automation.name}`;
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
  // ⚠️ Les colonnes doivent correspondre EXACTEMENT au schéma réel de la table `notifications` :
  // id, user_id, title, message, type, is_read, link, created_at
  // (il n'y a PAS de colonne `profile_id`, et la colonne s'appelle `is_read`, pas `read`)
  //
  // ⚠️ IMPORTANT : pas de .select() après l'insert.
  // L'appelant (visiteur anonyme ou utilisateur authentifié différent du
  // propriétaire) n'a pas le droit de RELIRE la notification qu'il vient
  // de créer (policy SELECT : auth.uid() = user_id). Or `.insert().select()`
  // génère un seul `INSERT ... RETURNING *` côté PostgREST : si le RETURNING
  // échoue à cause du RLS, TOUT l'insert est annulé — la ligne n'est jamais
  // écrite, sans qu'aucune erreur claire ne remonte facilement.
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: profile.user_id,
      type:    'info',
      title,
      message,
      is_read: false,
    });

  if (error) {
    // Erreur remontée clairement au lieu d'être avalée silencieusement
    console.error('[Action:notifyOwner] Échec de l\'insertion de la notification :', error.message);
    return null;
  }

  console.log(`[Action:notifyOwner] Notification créée → user=${profile.user_id}`);
  return { user_id: profile.user_id };
}