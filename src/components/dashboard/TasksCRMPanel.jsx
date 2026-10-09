import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Check, Trash2, RotateCcw, Loader2, AlarmClock, CalendarDays, Inbox, ChevronDown, Search, X, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import { useCrmTasks, bucketTasks } from '../../hooks/useCrmTasks';

/**
 * TasksCRMPanel
 * ─────────────────────────────────────────────────────────────────
 * Vue globale :  <TasksCRMPanel profileId={id} />
 * Dans un lead : <TasksCRMPanel profileId={id} leadId={lead.id} compact />
 *
 * Responsive : Android, iOS (iPhone/iPad), tablettes, desktop.
 *  - Le <select> natif est remplacé par un sélecteur de contact :
 *      < 640px  → feuille basse (bottom sheet) avec recherche
 *      ≥ 640px  → boîte de dialogue centrée avec recherche
 *  - Champs en 16px (évite le zoom automatique d'iOS)
 *  - Safe-areas (encoche / barre de geste), dvh, cibles tactiles ≥ 44px
 *  - Marge basse pour ne pas passer sous la barre de navigation flottante
 * ─────────────────────────────────────────────────────────────────
 */

const PRIORITIES = [
  { id: 'low',    label: 'Basse',   color: '#64748b' },
  { id: 'normal', label: 'Normale', color: '#6366f1' },
  { id: 'high',   label: 'Haute',   color: '#ef4444' },
];

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

/* ───────────────────────── Styles responsives ───────────────────────── */
const CSS = `
.tcp-root{
  box-sizing:border-box; width:100%; margin:0 auto; max-width:760px;
  padding:16px; padding-left:max(16px, env(safe-area-inset-left)); padding-right:max(16px, env(safe-area-inset-right));
  /* espace pour la barre de navigation flottante + zone de geste iOS/Android */
  padding-bottom:calc(120px + env(safe-area-inset-bottom));
  -webkit-text-size-adjust:100%; text-size-adjust:100%;
  -webkit-tap-highlight-color:transparent;
}
.tcp-root.tcp-compact{ padding:0; max-width:none; }
.tcp-root *, .tcp-root *::before, .tcp-root *::after{ box-sizing:border-box; }
.tcp-root button{ font-family:inherit; touch-action:manipulation; }

.tcp-card{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:14px; }
.tcp-form{ display:grid; gap:10px; }

/* Champs : 16px minimum = pas de zoom automatique sur iOS */
.tcp-input{
  width:100%; min-height:46px; padding:10px 12px; border-radius:10px;
  border:1px solid #d1d5db; background:#fff; color:#111827;
  font-size:16px; line-height:1.3; font-family:inherit;
  -webkit-appearance:none; appearance:none; outline:none;
}
.tcp-input:focus{ border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.15); }
select.tcp-input{
  padding-right:36px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 12px center;
}
/* iOS : datetime-local rendu comme un vrai champ (sinon hauteur/alignement cassés) */
input[type="datetime-local"].tcp-input{
  display:block; min-width:0; max-width:100%; text-align:left;
  min-height:46px; line-height:1.3;
}
input[type="datetime-local"].tcp-input::-webkit-date-and-time-value{ text-align:left; min-height:1.3em; }

.tcp-trigger{
  display:flex; align-items:center; gap:8px; text-align:left; cursor:pointer;
  justify-content:space-between;
}
.tcp-trigger > span{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tcp-trigger.tcp-placeholder > span{ color:#6b7280; }

.tcp-quick{ display:flex; flex-wrap:wrap; gap:6px; }
.tcp-chip{
  padding:8px 12px; border-radius:999px; border:1px solid #d1d5db; background:#fff;
  color:#374151; font-size:13px; font-weight:600; cursor:pointer; min-height:38px;
}
.tcp-chip.on{ border-color:#6366f1; background:rgba(99,102,241,.1); color:#4f46e5; }
.tcp-chip.link{ border:none; background:transparent; padding:0; color:#6b7280; min-height:44px; }

.tcp-fields{ display:grid; grid-template-columns:1fr; gap:8px; }

/* Priorité : boutons segmentés (aucun menu natif qui déborde) */
.tcp-seg{ display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; }
.tcp-seg button{
  min-height:46px; padding:8px 6px; border-radius:10px; border:1px solid #d1d5db;
  background:#fff; color:#374151; font-size:14px; font-weight:600; cursor:pointer;
}

.tcp-submit{
  display:flex; align-items:center; justify-content:center; gap:6px; min-height:48px;
  border-radius:10px; border:none; background:#6366f1; color:#fff; font-weight:700; font-size:15px; cursor:pointer;
}
.tcp-submit:disabled{ opacity:.5; cursor:not-allowed; }

.tcp-group{ margin-top:18px; }
.tcp-group h3{ margin:0 0 8px; font-size:14px; font-weight:700; display:flex; align-items:center; gap:6px; }
.tcp-list{ display:grid; gap:8px; grid-template-columns:1fr; }

.tcp-row{
  display:flex; align-items:center; gap:10px; padding:10px; min-width:0;
  background:#fff; border:1px solid #e5e7eb; border-radius:14px; border-left-width:4px;
}
.tcp-row.done{ opacity:.65; }
.tcp-row-body{ flex:1; min-width:0; }
.tcp-row-title{ margin:0; font-size:14px; font-weight:600; color:#111827; overflow-wrap:anywhere; }
.tcp-row-title.done{ text-decoration:line-through; }
.tcp-row-meta{ margin:2px 0 0; font-size:12px; color:#6b7280; overflow-wrap:anywhere; }
.tcp-row-meta.late{ color:#dc2626; }

.tcp-icon{
  display:flex; align-items:center; justify-content:center; width:44px; height:44px; flex-shrink:0;
  border-radius:10px; cursor:pointer; background:transparent; border:1px solid;
}

/* ───── Sélecteur de contact (portal) ───── */
.tcp-overlay{
  position:fixed; inset:0; z-index:100000; background:rgba(15,23,42,.5);
  display:flex; align-items:flex-end; justify-content:center;
  animation:tcpFade .15s ease-out;
}
.tcp-sheet{
  width:100%; max-width:560px; background:#fff; color:#111827;
  border-radius:18px 18px 0 0;
  max-height:85vh; max-height:85dvh; display:flex; flex-direction:column;
  padding-bottom:env(safe-area-inset-bottom);
  animation:tcpUp .2s ease-out;
}
.tcp-sheet-head{ display:flex; align-items:center; gap:8px; padding:14px 14px 8px; }
.tcp-sheet-head h4{ margin:0; flex:1; font-size:16px; }
.tcp-search{ position:relative; padding:0 14px 10px; }
.tcp-search svg{ position:absolute; left:26px; top:14px; color:#9ca3af; pointer-events:none; }
.tcp-search .tcp-input{ padding-left:38px; }
.tcp-options{ overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; padding:0 8px 10px; flex:1; }
.tcp-option{
  display:flex; align-items:center; gap:10px; width:100%; min-height:48px; padding:10px 12px;
  background:transparent; border:none; border-radius:10px; text-align:left;
  font-size:15px; color:#111827; cursor:pointer;
}
.tcp-option:hover, .tcp-option:focus-visible{ background:#f3f4f6; outline:none; }
.tcp-option.sel{ background:rgba(99,102,241,.1); color:#4f46e5; font-weight:700; }
.tcp-option span{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tcp-empty{ padding:20px; text-align:center; color:#9ca3af; font-size:14px; }

@keyframes tcpFade{ from{opacity:0} to{opacity:1} }
@keyframes tcpUp{ from{transform:translateY(24px);opacity:.6} to{transform:none;opacity:1} }

/* ───── Tablettes (iPad, tablettes Android) ───── */
@media (min-width:640px){
  .tcp-root{ max-width:900px; padding:20px; padding-bottom:calc(120px + env(safe-area-inset-bottom)); }
  .tcp-root.tcp-compact{ padding:0; }
  .tcp-fields{ grid-template-columns:1fr 1fr; }
  .tcp-fields .tcp-wide{ grid-column:1 / -1; }
  .tcp-list{ grid-template-columns:repeat(2, minmax(0,1fr)); }
  .tcp-overlay{ align-items:center; padding:24px; }
  .tcp-sheet{ border-radius:18px; max-height:70vh; max-height:70dvh; box-shadow:0 24px 60px rgba(0,0,0,.25); }
}
@media (min-width:1024px){
  .tcp-root{ max-width:1040px; }
  .tcp-fields{ grid-template-columns:repeat(3, minmax(0,1fr)); }
  .tcp-fields .tcp-wide{ grid-column:auto; }
}
/* Dans la fiche d'un lead (panneau étroit) : une seule colonne */
.tcp-compact .tcp-list{ grid-template-columns:1fr; }
.tcp-compact .tcp-fields{ grid-template-columns:1fr; }

/* Petits écrans (iPhone SE, Galaxy Fold replié) */
@media (max-width:360px){
  .tcp-root{ padding-left:max(12px, env(safe-area-inset-left)); padding-right:max(12px, env(safe-area-inset-right)); }
  .tcp-card{ padding:12px; }
  .tcp-chip{ padding:7px 10px; font-size:12px; }
}
/* Paysage téléphone : feuille moins haute */
@media (max-height:500px) and (orientation:landscape){
  .tcp-sheet{ max-height:94vh; max-height:94dvh; }
  .tcp-root{ padding-bottom:calc(90px + env(safe-area-inset-bottom)); }
}
@media (prefers-reduced-motion:reduce){
  .tcp-overlay, .tcp-sheet{ animation:none; }
}
`;

/* ───────────────────────── Sélecteur de contact ───────────────────────── */
function LeadPicker({ leads, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const searchRef = useRef(null);

  const selected = leads.find(l => String(l.id) === String(value));
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? leads.filter(l => (l.name || '').toLowerCase().includes(n)) : leads;
  }, [leads, q]);

  // Bloque le scroll de la page derrière + Échap pour fermer
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open]);

  const close = () => { setOpen(false); setQ(''); };
  const pick = (id) => { onChange(id); close(); };

  return (
    <>
      <button
        type="button"
        className={`tcp-input tcp-trigger ${selected ? '' : 'tcp-placeholder'}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Contact lié"
      >
        <span>{selected ? selected.name : 'Aucun contact lié'}</span>
        <ChevronDown size={16} color="#6b7280" />
      </button>

      {open && createPortal(
        <div className="tcp-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div className="tcp-sheet" role="dialog" aria-modal="true" aria-label="Choisir un contact">
            <div className="tcp-sheet-head">
              <h4>Contact lié</h4>
              <button type="button" className="tcp-icon" aria-label="Fermer" onClick={close} style={{ color: '#6b7280', borderColor: '#e5e7eb' }}>
                <X size={18} />
              </button>
            </div>

            {leads.length > 8 && (
              <div className="tcp-search">
                <Search size={16} />
                <input
                  ref={searchRef}
                  className="tcp-input"
                  placeholder="Rechercher un contact…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  inputMode="search"
                  autoComplete="off"
                />
              </div>
            )}

            <div className="tcp-options">
              <button type="button" className={`tcp-option ${!value ? 'sel' : ''}`} onClick={() => pick('')}>
                <UserRound size={16} /><span>Aucun contact lié</span>
                {!value && <Check size={16} />}
              </button>
              {filtered.map(l => (
                <button
                  type="button" key={l.id}
                  className={`tcp-option ${String(l.id) === String(value) ? 'sel' : ''}`}
                  onClick={() => pick(l.id)}
                >
                  <span>{l.name || 'Sans nom'}</span>
                  {String(l.id) === String(value) && <Check size={16} />}
                </button>
              ))}
              {filtered.length === 0 && <div className="tcp-empty">Aucun résultat</div>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ───────────────────────── Composants ───────────────────────── */
function TaskRow({ task, onDone, onReopen, onDelete, showLead, overdue }) {
  const isDone = task.status === 'done';
  const prio = PRIORITIES.find(p => p.id === task.priority) || PRIORITIES[1];
  const border = isDone ? '#22c55e' : overdue ? '#ef4444' : prio.color;
  const actionColor = isDone ? '#64748b' : '#22c55e';
  return (
    <div className={`tcp-row ${isDone ? 'done' : ''}`} style={{ borderLeftColor: border }}>
      <button
        type="button"
        className="tcp-icon"
        aria-label={isDone ? 'Rouvrir la tâche' : 'Marquer comme faite'}
        onClick={() => (isDone ? onReopen(task) : onDone(task))}
        style={{ color: actionColor, borderColor: `${actionColor}55`, background: `${actionColor}14` }}
      >
        {isDone ? <RotateCcw size={18} /> : <Check size={18} />}
      </button>
      <div className="tcp-row-body">
        <p className={`tcp-row-title ${isDone ? 'done' : ''}`}>{task.title}</p>
        <p className={`tcp-row-meta ${overdue ? 'late' : ''}`}>
          {task.due_at ? fmtDue(task.due_at) : 'Sans échéance'}
          {showLead && task.leads?.name ? ` · ${task.leads.name}` : ''}
          {task.source === 'automation' ? ' · 🤖' : ''}
        </p>
      </div>
      <button
        type="button"
        className="tcp-icon"
        aria-label="Supprimer la tâche"
        onClick={() => onDelete(task)}
        style={{ color: '#ef4444', borderColor: '#ef444455', background: '#ef444414' }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function Group({ title, icon, tasks, tone, children }) {
  if (!tasks.length) return null;
  return (
    <section className="tcp-group">
      <h3 style={{ color: tone || '#111827' }}>
        {icon}{title} <span style={{ fontWeight: 500, color: '#9ca3af' }}>({tasks.length})</span>
      </h3>
      <div className="tcp-list">{children}</div>
    </section>
  );
}

export default function TasksCRMPanel({ profileId, leadId = null, compact = false }) {
  const { open, done, loading, error, addTask, completeTask, reopenTask, deleteTask } =
    useCrmTasks({ profileId, leadId });

  const [leads, setLeads]       = useState([]);
  const [title, setTitle]       = useState('');
  const [dueAt, setDueAt]       = useState('');
  const [priority, setPriority] = useState('normal');
  const [formLead, setFormLead] = useState('');
  const [saving, setSaving]     = useState(false);
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
    <div className={`tcp-root ${compact ? 'tcp-compact' : ''}`}>
      <style>{CSS}</style>

      {!compact && (
        <header style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#111827' }}>Tâches</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {open.length === 0 ? 'Rien à faire pour le moment.' : `${open.length} à faire · ${overdue.length} en retard`}
          </p>
        </header>
      )}

      {/* ── Ajout rapide ── */}
      <form onSubmit={submit} className="tcp-card tcp-form">
        <input
          className="tcp-input"
          placeholder="Ex : Relancer pour le devis"
          value={title}
          maxLength={200}
          enterKeyHint="done"
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="tcp-quick">
          {QUICK_DUES.map(q => {
            const v = quickDate(q);
            return (
              <button type="button" key={q.label} className={`tcp-chip ${dueAt === v ? 'on' : ''}`} onClick={() => setDueAt(v)}>
                {q.label}
              </button>
            );
          })}
        </div>
        <div className="tcp-fields">
          <input type="datetime-local" className="tcp-input" value={dueAt} onChange={(e) => setDueAt(e.target.value)} aria-label="Échéance" />
          <div className="tcp-seg" role="radiogroup" aria-label="Priorité">
            {PRIORITIES.map(p => (
              <button
                type="button" key={p.id} role="radio" aria-checked={priority === p.id}
                className={priority === p.id ? 'on' : ''}
                style={priority === p.id ? { background: `${p.color}1a`, color: p.color, borderColor: p.color } : undefined}
                onClick={() => setPriority(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {!leadId && (
            <div className="tcp-wide">
              <LeadPicker leads={leads} value={formLead} onChange={setFormLead} />
            </div>
          )}
        </div>
        <button type="submit" className="tcp-submit" disabled={!title.trim() || saving}>
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
          <button type="button" className="tcp-chip link" onClick={() => setShowDone(v => !v)}>
            {showDone ? 'Masquer' : 'Voir'} les tâches terminées ({done.length})
          </button>
          {showDone && (
            <div className="tcp-list" style={{ marginTop: 8 }}>
              {done.map(t => <TaskRow key={t.id} task={t} {...rowProps} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}