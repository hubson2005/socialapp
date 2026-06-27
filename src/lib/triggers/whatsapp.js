/**
 * triggers/whatsapp.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : clic sur le bouton WhatsApp du profil public.
 *
 * Intégration dans le composant PublicProfile (ou équivalent) :
 *
 *   import { triggerWhatsappClick } from '@/lib/triggers/whatsapp';
 *
 *   const handleWhatsappClick = async () => {
 *     window.open(`https://wa.me/${profile.whatsapp_phone}`, '_blank');
 *     await triggerWhatsappClick(profile.id, { source: 'public_profile' });
 *   };
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/**
 * @param {number} profileId   - link_profiles.id (bigint)
 * @param {Object} [context]   - { visitorName, phone, email, referrer, … }
 */
export async function triggerWhatsappClick(profileId, context = {}) {
  await runAutomations({
    trigger:   'whatsapp_click',
    profileId,
    context: {
      source: 'automatisation',
      ...context,
    },
  });
}
