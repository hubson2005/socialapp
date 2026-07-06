/**
 * triggers/leadStatus.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : changement de statut d'un lead.
 *
 * Branché dans LeadsCRMPanel :
 *   • handleStatusChange (modal fiche lead)
 *   • handlePipelineStatusChange (glisser-déposer Kanban)
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/**
 * @param {number} profileId
 * @param {Object} context - { leadId, leadName, oldStatus, newStatus }
 */
export async function triggerLeadStatusChanged(profileId, context = {}) {
  await runAutomations({
    trigger:   'lead_status_changed',
    profileId,
    context: {
      source:    'lead_status_changed',
      leadId:    context.leadId,
      visitorName: context.leadName,
      ...context,
    },
  });
}