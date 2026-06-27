/**
 * automationEngine.js
 * ─────────────────────────────────────────────────────────────────
 * Cœur du système d'automatisation de SocialApp.
 *
 * Usage :
 *   import { runAutomations } from '@/lib/automationEngine';
 *   await runAutomations({ trigger: 'whatsapp_click', profileId: 42 });
 *
 * Chaque automatisation active dont le déclencheur correspond sera
 * exécutée séquentiellement. Le contexte issu d'une action est
 * injecté dans les actions suivantes (ex : le lead_id créé par
 * create_lead est disponible pour create_task).
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from '../supabase';
import { executeAction } from './actions/index';
import { logAutomation } from './logger';
import { TRIGGER_LABELS } from './constants';

// Re-export pour les consommateurs qui importaient depuis ce fichier
export { TRIGGER_LABELS };

// ─── Point d'entrée public ─────────────────────────────────────────
/**
 * Lance toutes les automatisations actives correspondant à un
 * déclencheur pour un profil donné.
 *
 * @param {Object}  params
 * @param {string}  params.trigger   - Identifiant du déclencheur (ex: 'whatsapp_click')
 * @param {number}  params.profileId - link_profiles.id (bigint)
 * @param {Object}  [params.context] - Données contextuelles transmises aux actions
 *                                     (visitorName, phone, email, referrer, …)
 */
export async function runAutomations({ trigger, profileId, context = {} }) {
  if (!trigger || !profileId) {
    console.warn('[AutomationEngine] trigger et profileId sont requis.');
    return;
  }

  // 1 — Récupérer les automatisations actives pour ce profil + déclencheur
  const { data: automations, error } = await supabase
    .from('automations')
    .select('*')
    .eq('profile_id', profileId)
    .eq('trigger', trigger)
    .eq('active', true);

  if (error) {
    console.error('[AutomationEngine] Erreur de lecture Supabase :', error);
    return;
  }

  if (!automations?.length) return; // Aucune automatisation active → rien à faire

  // 2 — Exécuter chaque automatisation
  for (const automation of automations) {
    await _executeAutomation({ automation, trigger, profileId, context });
  }
}

// ─── Exécution d'une automatisation ───────────────────────────────
async function _executeAutomation({ automation, trigger, profileId, context }) {
  let status       = 'ok';
  let errorMessage = null;
  let entityId     = null;

  // Contexte enrichi au fil des actions (ex : create_lead → lead_id dispo pour create_task)
  let runningContext = { ...context };

  try {
    // Résoudre la liste d'actions (jsonb `actions[]` prioritaire sur le champ legacy `action`)
    const actionsList = _resolveActions(automation);

    for (const actionDef of actionsList) {
      const actionType = typeof actionDef === 'string' ? actionDef : actionDef.type;
      const actionConfig = {
        // Config de base de l'automatisation
        score: automation.score ?? null,
        tag:   automation.tag   ?? null,
        // Config spécifique à l'action (action_config ou actionDef.config)
        ...(automation.action_config || {}),
        ...(typeof actionDef === 'object' ? (actionDef.config || {}) : {}),
      };

      const result = await executeAction({
        actionType,
        config:    actionConfig,
        profileId,
        automation,
        context:   runningContext,
      });

      // Capture du premier entityId et enrichissement du contexte pour les actions suivantes
      if (result?.id) {
        if (!entityId) entityId = String(result.id);
        runningContext = {
          ...runningContext,
          lastEntityId: result.id,
          [`${actionType}_id`]: result.id,
          ...(actionType === 'create_lead' ? { leadId: result.id } : {}),
        };
      }
    }

    // 3 — Incrémenter runs + mettre à jour last_run
    await supabase
      .from('automations')
      .update({
        runs:       (automation.runs || 0) + 1,
        last_run:   new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', automation.id);

  } catch (err) {
    status       = 'error';
    errorMessage = err?.message || 'Erreur inconnue';
    console.error(`[AutomationEngine] Erreur dans "${automation.name}" :`, err);
  }

  // 4 — Enregistrer le log d'exécution
  await logAutomation({
    automationId:   automation.id,
    profileId,
    automationName: automation.name,
    triggerLabel:   TRIGGER_LABELS[trigger] || trigger,
    status,
    errorMessage,
    entityId,
  });
}

// ─── Résolution de la liste d'actions (compatibilité legacy) ──────
function _resolveActions(automation) {
  // Priorité 1 : tableau `actions` (jsonb, nouveau format)
  if (Array.isArray(automation.actions) && automation.actions.length > 0) {
    return automation.actions;
  }
  // Priorité 2 : champ `action` texte (legacy)
  if (automation.action) {
    return [{ type: automation.action, config: automation.action_config || {} }];
  }
  return [];
}