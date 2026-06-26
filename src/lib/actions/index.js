/**
 * actions/index.js
 * ─────────────────────────────────────────────────────────────────
 * Registre centralisé de toutes les actions disponibles.
 * Pour ajouter une nouvelle action :
 *   1. Créer son fichier dans ce dossier (ex: sendEmail.js)
 *   2. L'importer ici et l'ajouter à ACTION_REGISTRY
 * ─────────────────────────────────────────────────────────────────
 */

import { createLeadAction }   from './createLead';
import { createTaskAction }   from './createTask';
import { sendWhatsappAction } from './sendWhatsapp';
import { addScoreAction }     from './addScore';
import { addTagAction }       from './addTag';
import { notifyOwnerAction }  from './notifyOwner';

// Clés : valeurs possibles dans automations.action ou automations.actions[].type
const ACTION_REGISTRY = {
  create_lead:     createLeadAction,
  create_task:     createTaskAction,
  send_whatsapp:   sendWhatsappAction,
  add_score:       addScoreAction,
  add_tag:         addTagAction,
  notify_owner:    notifyOwnerAction,
};

/**
 * Dispatche l'exécution vers le bon handler.
 *
 * @param {Object} params
 * @param {string} params.actionType  - Clé du registre (ex: 'create_lead')
 * @param {Object} params.config      - Config fusionnée de l'automatisation
 * @param {number} params.profileId
 * @param {Object} params.automation  - Ligne complète de la table automations
 * @param {Object} params.context     - Contexte courant (enrichi au fil des actions)
 * @returns {Object|null}             - Entité créée ou null
 */
export async function executeAction({ actionType, config, profileId, automation, context }) {
  const handler = ACTION_REGISTRY[actionType];

  if (!handler) {
    console.warn(`[AutomationEngine] Action inconnue : "${actionType}". Actions disponibles : ${Object.keys(ACTION_REGISTRY).join(', ')}`);
    return null;
  }

  return handler({ config, profileId, automation, context });
}

import { ACTION_LABELS, ACTION_OPTIONS } from '../constants';

export { ACTION_LABELS, ACTION_OPTIONS };
export const AVAILABLE_ACTIONS = Object.keys(ACTION_REGISTRY);