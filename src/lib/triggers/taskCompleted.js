/**
 * triggers/taskCompleted.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : tâche marquée comme terminée dans la fiche lead.
 *
 * Branché dans LeadModal → bouton "✓ Fait" sur les activités
 * de type 'task'.
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/**
 * @param {number} profileId
 * @param {Object} context - { leadId, leadName, taskDescription }
 */
export async function triggerTaskCompleted(profileId, context = {}) {
  await runAutomations({
    trigger:   'task_completed',
    profileId,
    context: {
      source:      'task_completed',
      leadId:      context.leadId,
      visitorName: context.leadName,
      ...context,
    },
  });
}