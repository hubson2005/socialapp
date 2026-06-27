/**
 * logger.js
 * ─────────────────────────────────────────────────────────────────
 * Insère une ligne dans `automation_logs` après chaque exécution.
 * Appelé exclusivement par automationEngine.js.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from "../supabase";

/**
 * @param {Object} params
 * @param {string}      params.automationId   - UUID de l'automatisation
 * @param {number}      params.profileId      - bigint (link_profiles.id)
 * @param {string}      params.automationName
 * @param {string}      params.triggerLabel   - Libellé du déclencheur
 * @param {'ok'|'err'} params.status
 * @param {string|null} params.errorMessage
 * @param {string|null} params.entityId       - ID de l'entité créée (lead, etc.)
 */
export async function logAutomation({
  automationId,
  profileId,
  automationName,
  triggerLabel,
  status       = 'ok',
  errorMessage = null,
  entityId     = null,
}) {
  const { error } = await supabase.from('automation_logs').insert({
    automation_id:   automationId,
    profile_id:      profileId,
    automation_name: automationName,
    trigger_label:   triggerLabel,
    status,
    error_message:   errorMessage,
    entity_id:       entityId,
  });

  if (error) {
    // Ne jamais laisser une erreur de log casser l'expérience utilisateur
    console.error('[AutomationLogger] Échec de lenregistrement du log :', error);
  }
}
