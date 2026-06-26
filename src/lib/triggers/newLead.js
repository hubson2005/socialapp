/**
 * triggers/newLead.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : création d'un nouveau lead dans le CRM.
 *
 * Appeler depuis LeadsCRMPanel (ou hook useLeadsCRM) après
 * qu'un lead soit inséré en base :
 *
 *   import { triggerNewLead } from '@/lib/triggers/newLead';
 *
 *   // Après supabase.from('leads').insert(...)
 *   await triggerNewLead(profileId, {
 *     leadId:     newLead.id,
 *     name:       newLead.name,
 *     email:      newLead.email,
 *     phone:      newLead.phone,
 *     source:     newLead.source,
 *   });
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/**
 * @param {number} profileId
 * @param {Object} [context]  - { leadId, name, email, phone, source }
 */
export async function triggerNewLead(profileId, context = {}) {
  await runAutomations({
    trigger:   'new_lead',
    profileId,
    context: {
      source:      'new_lead',
      visitorName: context.name,
      leadId:      context.leadId, // lead déjà créé — évite un doublon create_lead
      ...context,
    },
  });
}