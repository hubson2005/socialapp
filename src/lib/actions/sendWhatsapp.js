/**
 * actions/sendWhatsapp.js
 * ─────────────────────────────────────────────────────────────────
 * Déclenche l'envoi d'un message WhatsApp via l'Edge Function
 * `webhooks` (qui gère déjà le canal WhatsApp).
 *
 * En attendant une intégration API WhatsApp Business complète,
 * cette action :
 *   1. Appelle l'Edge Function avec l'action 'send_whatsapp'
 *   2. Enregistre l'activité dans lead_activities si un lead existe
 *      (uniquement si l'envoi a réussi)
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from "../../supabase";

/**
 * @param {Object} params
 * @param {Object} params.config    - { message, phone }
 * @param {number} params.profileId
 * @param {Object} params.context   - { phone, leadId }
 * @returns {Object|null}
 */
export async function sendWhatsappAction({ config, profileId, context }) {
  const phone   = context.phone   || config.phone;
  const message = config.message  || 'Bonjour ! Merci de votre intérêt. 👋';

  if (!phone) {
    console.warn('[Action:sendWhatsapp] Aucun numéro de téléphone disponible.');
    return null;
  }

  if (!profileId) {
    console.warn('[Action:sendWhatsapp] Aucun profileId disponible — l\'Edge Function va rejeter la requête.');
  }

  // Appel à l'Edge Function webhooks (action whatsapp)
  const { error: fnError } = await supabase.functions.invoke('webhooks', {
    body: {
      action:     'send_whatsapp',
      profile_id: profileId, // ✅ snake_case attendu par l'Edge Function
      phone,
      message,
    },
  });

  if (fnError) {
    // On log mais on ne bloque pas les autres actions.
    // Pas de trace dans la timeline : le message n'a pas été envoyé.
    console.error('[Action:sendWhatsapp] Erreur Edge Function :', fnError.message);
    return { phone, sent: false };
  }

  // Enregistrer dans les activités du lead si disponible
  const leadId = context.leadId || context.create_lead_id;
  if (leadId) {
    const { error: actErr } = await supabase.from('lead_activities').insert({
      lead_id:     leadId,
      type:        'whatsapp',
      description: `Message WhatsApp envoyé : "${message.slice(0, 80)}${message.length > 80 ? '…' : ''}"`,
    });
    if (actErr) console.warn('[Action:sendWhatsapp] activité non tracée :', actErr.message);
  }

  console.log(`[Action:sendWhatsapp] Message envoyé → ${phone}`);
  return { phone, sent: true };
}