/**
 * actions/createTask.js
 * ─────────────────────────────────────────────────────────────────
 * Crée une vraie tâche CRM dans `crm_tasks` (échéance, priorité,
 * rappel automatique via pg_cron) rattachée au lead du contexte.
 *
 * Config reconnue :
 *   taskTitle | task | taskDescription  → titre (clés legacy gérées)
 *   dueInHours | dueInDays              → échéance relative (optionnel)
 *   priority                            → 'low' | 'normal' | 'high'
 *
 * Il faut toujours placer create_lead avant create_task dans la
 * liste d'actions si le lead n'existe pas encore.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from '../../supabase';

const PRIORITIES = ['low', 'normal', 'high'];

export async function createTaskAction({ config, profileId, context }) {
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

  const title = (
    config.taskTitle      ||   // clé moteur courante
    config.task           ||   // clé legacy (ancienne UI)
    config.taskDescription ||
    'Tâche créée automatiquement'
  ).toString().trim().slice(0, 200);

  // Échéance relative : « relancer dans 2 jours », « rappeler dans 4 h »
  const hours = Number(config.dueInHours) || (Number(config.dueInDays) || 0) * 24;
  const dueAt = hours > 0 ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : null;

  const priority = PRIORITIES.includes(config.priority) ? config.priority : 'normal';

  const { data, error } = await supabase
    .from('crm_tasks')
    .insert({
      profile_id: profileId,
      lead_id:    leadId,
      title,
      due_at:     dueAt,
      priority,
      source:     'automation',
    })
    .select()
    .single();

  if (error) throw new Error(`createTask : ${error.message}`);

  // Trace dans la timeline du lead (non bloquant)
  await supabase.from('lead_activities')
    .insert({ lead_id: leadId, type: 'task_created', description: title })
    .then(({ error: e }) => { if (e) console.warn('[Action:createTask] activité non tracée :', e.message); });

  console.log(`[Action:createTask] Tâche créée → id=${data.id}, lead=${leadId}, échéance=${dueAt ?? 'aucune'}`);
  return data;
}