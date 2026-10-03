/**
 * hooks/useCrmTasks.js
 * ─────────────────────────────────────────────────────────────────
 * Tâches CRM (table crm_tasks) : échéance, priorité, rattachement
 * optionnel à un lead.
 *
 * Usage :
 *   const { open, done, loading, addTask, completeTask, reopenTask,
 *           deleteTask, reload } = useCrmTasks({ profileId });
 *   // Dans la fiche d'un lead : useCrmTasks({ profileId, leadId })
 *
 * - Mises à jour optimistes (pas de rechargement complet).
 * - Chaque création / complétion est tracée dans lead_activities
 *   (types 'task_created' / 'task_done') pour la timeline du lead.
 * - La complétion déclenche toujours l'automatisation task_completed.
 * ─────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { triggerTaskCompleted } from '../lib/triggers/taskCompleted';

const SELECT = '*, leads(id, name, phone)';
const DONE_LIMIT = 30;

export function useCrmTasks({ profileId, leadId = null } = {}) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const scoped = useCallback((q) => {
    q = q.eq('profile_id', profileId);
    return leadId ? q.eq('lead_id', leadId) : q;
  }, [profileId, leadId]);

  const reload = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const [openRes, doneRes] = await Promise.all([
        scoped(supabase.from('crm_tasks').select(SELECT).eq('status', 'open'))
          .order('due_at', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(1000),
        scoped(supabase.from('crm_tasks').select(SELECT).eq('status', 'done'))
          .order('completed_at', { ascending: false })
          .limit(DONE_LIMIT),
      ]);
      if (openRes.error) throw openRes.error;
      if (doneRes.error) throw doneRes.error;
      setTasks([...(openRes.data || []), ...(doneRes.data || [])]);
    } catch (e) {
      setError(e.message || 'Erreur de chargement des tâches');
    } finally {
      setLoading(false);
    }
  }, [profileId, scoped]);

  useEffect(() => { reload(); }, [reload]);

  const logActivity = (lead, type, description) => {
    if (!lead) return;
    // Trace non bloquante : une erreur ici ne doit pas casser la tâche
    supabase.from('lead_activities')
      .insert([{ lead_id: lead, type, description }])
      .then(({ error: e }) => { if (e) console.warn('[useCrmTasks] activité non tracée :', e.message); });
  };

  const addTask = async ({ title, dueAt = null, priority = 'normal', leadId: forLead = null, description = null }) => {
    const cleanTitle = (title || '').trim();
    if (!cleanTitle) throw new Error('Le titre de la tâche est obligatoire');
    const lead_id = forLead || leadId || null;

    const { data, error: e } = await supabase.from('crm_tasks')
      .insert([{
        profile_id: profileId,
        lead_id,
        title: cleanTitle,
        description,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        priority,
        source: 'manual',
      }])
      .select(SELECT)
      .single();
    if (e) throw e;

    setTasks(prev => [data, ...prev]);
    logActivity(lead_id, 'task_created', cleanTitle);
    return data;
  };

  const completeTask = async (task) => {
    if (task.status === 'done') return;
    const completedAt = new Date().toISOString();
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'done', completed_at: completedAt } : t));

    const { error: e } = await supabase.from('crm_tasks')
      .update({ status: 'done', completed_at: completedAt })
      .eq('id', task.id);
    if (e) { await reload(); throw e; }

    logActivity(task.lead_id, 'task_done', task.title);
    triggerTaskCompleted(profileId, {
      leadId: task.lead_id,
      leadName: task.leads?.name,
      taskDescription: task.title,
    });
  };

  const reopenTask = async (task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'open', completed_at: null } : t));
    const { error: e } = await supabase.from('crm_tasks')
      .update({ status: 'open', completed_at: null })
      .eq('id', task.id);
    if (e) { await reload(); throw e; }
  };

  const deleteTask = async (task) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    const { error: e } = await supabase.from('crm_tasks').delete().eq('id', task.id);
    if (e) { await reload(); throw e; }
  };

  const { open, done } = useMemo(() => ({
    open: tasks.filter(t => t.status === 'open'),
    done: tasks.filter(t => t.status === 'done'),
  }), [tasks]);

  return { tasks, open, done, loading, error, addTask, completeTask, reopenTask, deleteTask, reload };
}

/** Regroupe les tâches ouvertes : en retard / aujourd'hui / à venir / sans date. */
export function bucketTasks(openTasks, now = new Date()) {
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const endToday   = new Date(startToday); endToday.setDate(endToday.getDate() + 1);

  const out = { overdue: [], today: [], upcoming: [], undated: [] };
  for (const t of openTasks) {
    if (!t.due_at) { out.undated.push(t); continue; }
    const d = new Date(t.due_at);
    if (d < startToday)      out.overdue.push(t);
    else if (d < endToday)   out.today.push(t);
    else                     out.upcoming.push(t);
  }
  return out;
}