import React, { useEffect, useState } from 'react';
import { Plus, Check, Trash2, RotateCcw, Loader2, AlarmClock, CalendarDays, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import { useCrmTasks, bucketTasks } from '../../hooks/useCrmTasks';

/**
 * TasksCRMPanel
 * ─────────────────────────────────────────────────────────────────
 * Vue globale :  <TasksCRMPanel profileId={id} />
 * Dans un lead : <TasksCRMPanel profileId={id} leadId={lead.id} compact />
 *
 * Même thème clair que LeadsCRMPanel ([T1]), mobile d'abord.
 * ─────────────────────────────────────────────────────────────────
 */

const PRIORITIES = [
  { id: 'low',    label: 'Basse',   color: '#64748b' },
  { id: 'normal', label: 'Normale', color: '#6366f1' },
  { id: 'high',   label: 'Haute',   color: '#ef4444' },
];

// Raccourcis d'échéance : le cas d'usage n°1 est « relancer dans X jours »
const QUICK_DUES = [
  { label: 'Aujourd’hui', days: 0, hour: 18 },
  { label: 'Demain',      days: 1, hour: 9  },
  { label: 'Dans 3 j',    days: 3, hour: 9  },
  { label: 'Dans 7 j',    days: 7, hour: 9  },
];

const toLocalInput = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const quickDate = ({ days, hour }) => {
  const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0);
  return toLocalInput(d);
};
const fmtDue = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const s = {
  card:  { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 14 },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', color: '#111827', minHeight: 44 },
  chip:  (active) => ({ padding: '8px 12px', borderRadius: 999, border: `1px solid ${active ? '#6366f1' : '#d1d5db'}`, background: active ? 'rgba(99,102,241,0.1)' : '#fff', color: active ? '#4f46e5' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 36 }),
  iconBtn: (color) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, border: `1px solid ${color}33`, background: `${color}14`, color, cursor: 'pointer', flexShrink: 0 }),
};

function TaskRow({ task, onDone, onReopen, onDelete, showLead, overdue }) {
  const isDone = task.status === 'done';
  const prio = PRIORITIES.find(p => p.id === task.priority) || PRIORITIES[1];
  return (
    <div style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderLeft: `4px solid ${isDone ? '#22c55e' : overdue ? '#ef4444' : prio.color}`, opacity: isDone ? 0.65 : 1 }}>
      <button
        aria-label={isDone ? 'Rouvrir la tâche' : 'Marquer comme faite'}
        onClick={() => (isDone ? onReopen(task) : onDone(task))}
        style={s.iconBtn(isDone ? '#64748b' : '#22c55e')}
      >
        {isDone ? <RotateCcw size={18} /> : <Check size={18} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827', textDecoration: isDone ? 'line-through' : 'none', wordBreak: 'break-word' }}>
          {task.title}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: overdue ? '#dc2626' : '#6b7280' }}>
          {task.due_at ? fmtDue(task.due_at) : 'Sans échéance'}
          {showLead && task.leads?.name ? ` · ${task.leads.name}` : ''}
          {task.source === 'automation' ? ' · 🤖' : ''}
        </p>
      </div>
      <button aria-label="Supprimer la tâche" onClick={() => onDelete(task)} style={s.iconBtn('#ef4444')}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function Group({ title, icon, tasks, tone, children }) {
  if (!tasks.length) return null;
  return (
    <section style={{ marginTop: 18 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: tone || '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}{title} <span style={{ fontWeight: 500, color: '#9ca3af' }}>({tasks.length})</span>
      </h3>
      <div style={{ display: 'grid', gap: 8 }}>{children}</div>
    </section>
  );
}

export default function TasksCRMPanel({ profileId, leadId = null, compact = false }) {
  const { open, done, loading, error, addTask, completeTask, reopenTask, deleteTask } =
    useCrmTasks({ profileId, leadId });

  const [leads, setLeads]     = useState([]);
  const [title, setTitle]     = useState('');
  const [dueAt, setDueAt]     = useState('');
  const [priority, setPriority] = useState('normal');
  const [formLead, setFormLead] = useState('');
  const [saving, setSaving]   = useState(false);
  const [showDone, setShowDone] = useState(false);

  // Liste de leads pour le sélecteur (vue globale uniquement)
  useEffect(() => {
    if (leadId || !profileId) return;
    supabase.from('leads').select('id, name')
      .eq('profile_id', profileId).order('name').limit(1000)
      .then(({ data }) => setLeads(data || []));
  }, [profileId, leadId]);

  const run = async (fn, okMsg) => {
    try { await fn(); if (okMsg) toast.success(okMsg); }
    catch (e) { toast.error(e.message || 'Une erreur est survenue'); }
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    await run(async () => {
      await addTask({ title, dueAt: dueAt || null, priority, leadId: leadId || formLead || null });
      setTitle(''); setDueAt(''); setPriority('normal'); setFormLead('');
    }, 'Tâche ajoutée');
    setSaving(false);
  };

  const { overdue, today, upcoming, undated } = bucketTasks(open);
  const rowProps = {
    onDone:   (t) => run(() => completeTask(t), 'Tâche terminée'),
    onReopen: (t) => run(() => reopenTask(t)),
    onDelete: (t) => run(() => deleteTask(t)),
    showLead: !leadId,
  };

  return (
    <div style={{ padding: compact ? 0 : 16, maxWidth: 760, margin: '0 auto' }}>
      {!compact && (
        <header style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#111827' }}>Tâches</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {open.length === 0 ? 'Rien à faire pour le moment.' : `${open.length} à faire · ${overdue.length} en retard`}
          </p>
        </header>
      )}

      {/* ── Ajout rapide ── */}
      <form onSubmit={submit} style={{ ...s.card, display: 'grid', gap: 10 }}>
        <input
          style={s.input}
          placeholder="Ex : Relancer pour le devis"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {QUICK_DUES.map(q => {
            const v = quickDate(q);
            return <button type="button" key={q.label} style={s.chip(dueAt === v)} onClick={() => setDueAt(v)}>{q.label}</button>;
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <input type="datetime-local" style={s.input} value={dueAt} onChange={(e) => setDueAt(e.target.value)} aria-label="Échéance" />
          <select style={s.input} value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priorité">
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>Priorité {p.label.toLowerCase()}</option>)}
          </select>
          {!leadId && (
            <select style={s.input} value={formLead} onChange={(e) => setFormLead(e.target.value)} aria-label="Contact lié">
              <option value="">Aucun contact lié</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          )}
        </div>
        <button
          type="submit"
          disabled={!title.trim() || saving}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: !title.trim() || saving ? 0.5 : 1 }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Ajouter la tâche
        </button>
      </form>

      {loading && <p style={{ textAlign: 'center', color: '#6b7280', marginTop: 24 }}><Loader2 size={18} className="animate-spin" /></p>}
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 16 }}>{error}</p>}

      {!loading && !error && open.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: 28 }}>
          <Inbox size={32} style={{ margin: '0 auto 6px' }} />
          <p style={{ margin: 0, fontSize: 13 }}>Aucune tâche ouverte. Ajoutez une relance ci-dessus.</p>
        </div>
      )}

      <Group title="En retard" tone="#dc2626" icon={<AlarmClock size={15} />} tasks={overdue}>
        {overdue.map(t => <TaskRow key={t.id} task={t} overdue {...rowProps} />)}
      </Group>
      <Group title="Aujourd’hui" icon={<CalendarDays size={15} />} tasks={today}>
        {today.map(t => <TaskRow key={t.id} task={t} {...rowProps} />)}
      </Group>
      <Group title="À venir" tasks={upcoming}>
        {upcoming.map(t => <TaskRow key={t.id} task={t} {...rowProps} />)}
      </Group>
      <Group title="Sans échéance" tasks={undated}>
        {undated.map(t => <TaskRow key={t.id} task={t} {...rowProps} />)}
      </Group>

      {done.length > 0 && (
        <section style={{ marginTop: 22 }}>
          <button type="button" onClick={() => setShowDone(v => !v)} style={{ ...s.chip(false), border: 'none', background: 'transparent', padding: 0, color: '#6b7280' }}>
            {showDone ? 'Masquer' : 'Voir'} les tâches terminées ({done.length})
          </button>
          {showDone && (
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {done.map(t => <TaskRow key={t.id} task={t} {...rowProps} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}