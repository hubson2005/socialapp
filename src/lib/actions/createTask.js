/**
 * actions/createTask.js
 * ─────────────────────────────────────────────────────────────────
 * Crée une tâche sous forme d'activité dans `lead_activities`
 * avec type = 'task'.
 *
 * La tâche est rattachée au lead créé juste avant dans la même
 * automatisation (context.leadId) ou au lead passé en contexte.
 * Si aucun lead n'est disponible, la tâche est ignorée avec un
 * avertissement — il faut toujours placer create_lead avant
 * create_task dans le tableau `actions`.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from '../../supabase';

/**
 * @param {Object} params
 * @param {Object} params.config    - { taskTitle, taskDescription }
 * @param {Object} params.context   - { leadId, create_lead_id, lastEntityId }
 * @returns {Object|null}
 */
export async function createTaskAction({ config, context }) {
  // Récupérer le lead_id depuis le contexte (injecté par createLead si exécuté avant)
  const leadId =
    context.leadId          ||
    context.create_lead_id  ||
    context.lastEntityId    ||
    config.leadId           ||
    null;

  if (!leadId) {
    console.warn('[Action:createTask] Aucun lead_id disponible — placez create_lead avant create_task dans la liste d\'actions.');
    return null;
  }

  const description =
    config.taskTitle     ||   // clé moteur courante
    config.task          ||   // clé legacy (ancienne UI)
    config.taskDescription ||
    'Tâche créée automatiquement';

  const { data, error } = await supabase
    .from('lead_activities')
    .insert({
      lead_id:     leadId,
      type:        'task',
      description,
    })
    .select()
    .single();

  if (error) throw new Error(`createTask : ${error.message}`);

  console.log(`[Action:createTask] Tâche créée → id=${data.id}, lead=${leadId}`);
  return data;
}