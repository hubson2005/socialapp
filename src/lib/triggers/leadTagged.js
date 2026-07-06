/**
 * triggers/leadTagged.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : tag ajouté à un lead.
 *
 * Branché dans LeadModal → fonction addTag().
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/**
 * @param {number} profileId
 * @param {Object} context - { leadId, leadName, tag }
 */
export async function triggerLeadTagged(profileId, context = {}) {
  await runAutomations({
    trigger:   'lead_tagged',
    profileId,
    context: {
      source:      'lead_tagged',
      leadId:      context.leadId,
      visitorName: context.leadName,
      tag:         context.tag,
      ...context,
    },
  });
}