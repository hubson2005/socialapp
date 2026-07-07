import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Trash2, Mail, Phone, UserPlus,
  Loader2, Download, X,
  MessageCircle, Building2, Tag as TagIcon,
  Pencil, Check,
  Globe, List, Columns3,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
// [A4][A7][A8][A9][A10] Moteur d'automatisation — déclencheurs CRM
import { triggerNewLead }                    from '../../lib/triggers/newLead';
import { useBreakpoint }                     from '../../hooks/useBreakpoint';
import { triggerLeadStatusChanged }          from '../../lib/triggers/leadStatus';     // [A7]
import { triggerLeadTagged }                 from '../../lib/triggers/leadTagged';     // [A8]
import { triggerLeadScoreReachedIfThreshold } from '../../lib/triggers/leadScore';     // [A9]
import { triggerTaskCompleted }              from '../../lib/triggers/taskCompleted';  // [A10]

// ─── CORRECTIONS RESPONSIVE / BUGS (cette révision) ──────────────────────────
//  [FIX1] BUG BLOQUANT : commentaire JSX mal fermé dans la modale "Nouveau
//         lead" — `{/* [tablet] */>` au lieu de `{/* [tablet] */}` avant le
//         `>`. C'était une erreur de syntaxe qui empêchait le fichier de
//         compiler, sur TOUS les appareils.
//  [FIX2] BUG FONCTIONNEL MAJEUR (tablette/iOS/Android) : la vue Pipeline
//         utilisait l'API HTML5 drag-and-drop native (`draggable`,
//         `onDragStart`/`onDragOver`/`onDrop`). Cette API ne fonctionne PAS
//         sur écrans tactiles — Safari iOS ne la supporte pas du tout, et
//         Android Chrome seulement très partiellement. Résultat : impossible
//         de glisser une carte lead d'une colonne à l'autre sur tablette ou
//         téléphone. Réécrit avec Pointer Events (souris + tactile unifiés).
//  [FIX3] `height: 100vh` sur le tiroir latéral (LeadModal) → remplacé par
//         un pattern `100vh` puis `100dvh` (fallback CSS) pour éviter que la
//         barre d'adresse Safari iOS ne coupe le bas du panneau.
//  [FIX4] `maxHeight: 90vh` sur la modale "Nouveau lead" → même correction.
//  [FIX5] Cibles tactiles agrandies (Checkbox, bouton WhatsApp compact) sans
//         changer le rendu visuel.
//  [FIX6] `whileHover` de Framer Motion sur les lignes de la liste
//         désactivé sur appareils sans support du survol (tactile), pour
//         éviter un état "survolé" qui reste collé après un tap.

const STATUSES = [
  { id: 'prospect', label: 'Prospect',   color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  { id: 'chaud',    label: '🔥 Chaud',   color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  { id: 'client',   label: '✅ Client',  color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  { id: 'froid',    label: '❄️ Froid',   color: '#06b6d4', bg: 'rgba(6,182,212,0.15)'  },
  { id: 'perdu',    label: 'Perdu',      color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
];

const SOURCES = [
  { id: 'manuel',         label: 'Manuel'              },
  { id: 'qrcode',         label: 'QR Code'             },
  { id: 'socialapp',      label: 'Profil SocialApp'    },
  { id: 'rsvp',           label: 'RSVP'                },
  { id: 'marketplace',    label: 'Marketplace'         },
  { id: 'formulaire',     label: 'Formulaire'          },
  { id: 'automatisation', label: '🤖 Automatisation'   },
  { id: 'calendrier',     label: '📅 Calendly / RDV'   },
];

const ACTIVITY_ICONS = {
  created:  '🆕',
  edited:   '✏️',
  note:     '📝',
  whatsapp: '💬',
  status:   '🔄',
};

const normalizePhone = (phone = '') => phone.replace(/\D/g, '');

const EMPTY_LEAD = {
  name: '', phone: '', email: '', company: '',
  status: 'prospect', source: 'manuel', notes: '', score: 0,
};

const scoreLabel = (s) =>
  s <= 30  ? { label: 'Froid',    color: '#06b6d4', icon: '❄️'  } :
  s <= 60  ? { label: 'Tiède',    color: '#f59e0b', icon: '🌡️'  } :
  s <= 80  ? { label: 'Chaud',    color: '#f97316', icon: '🔥'  } :
             { label: 'Brûlant',  color: '#ef4444', icon: '🚀'  };

const TAG_PALETTE = ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24', '#34d399', '#fb7185', '#818cf8'];
const tagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
};

const inp = {
  width: '100%', background: '#2f2f2f',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
  padding: '11px 13px', color: 'white', outline: 'none',
  fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit',
};

// [FIX5] Zone de tap agrandie (padding + marge négative) sans changer
// l'apparence visuelle de la case à cocher (17x17).
function Checkbox({ checked, indeterminate, onChange, style = {} }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onChange(); }}
      style={{
        padding: 7, margin: -7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      <div style={{
        width: 17, height: 17, borderRadius: 5, flexShrink: 0,
        border: `1.5px solid ${checked || indeterminate ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
        background: checked ? '#6366f1' : indeterminate ? 'rgba(99,102,241,0.25)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .15s', ...style,
      }}>
        {checked && <Check size={10} color="white" strokeWidth={3} />}
        {!checked && indeterminate && <div style={{ width: 7, height: 2, background: '#818cf8', borderRadius: 1 }} />}
      </div>
    </div>
  );
}

function ScoreBar({ score, onChange }) {
  const { color, label, icon } = scoreLabel(score);
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Score prospect</span>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>{icon} {score} — {label}</span>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width .3s, background .3s' }} />
      </div>
      {onChange && (
        <input type="range" min={0} max={100} value={score}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '100%', marginTop: 6, accentColor: color, cursor: 'pointer' }} />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUSES.find(x => x.id === status) || STATUSES[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99,
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
      border: `1px solid ${s.color}44`,
    }}>{s.label}</span>
  );
}

function TagChips({ tags = [], onRemove, size = 'normal' }) {
  if (!tags.length) return null;
  const isSmall = size === 'small';
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {tags.map(tag => (
        <span key={tag} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: isSmall ? '1px 6px' : '2px 8px', borderRadius: 99,
          background: `${tagColor(tag)}1f`, border: `1px solid ${tagColor(tag)}44`,
          color: tagColor(tag), fontSize: isSmall ? 9.5 : 10.5, fontWeight: 700,
        }}>
          #{tag}
          {onRemove && <X size={isSmall ? 9 : 10} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onRemove(tag); }} />}
        </span>
      ))}
    </div>
  );
}

// [FIX5] Hauteur/largeur minimales relevées à 40px (compact et normal)
function WhatsAppBtn({ phone, leadId, onContact, compact = false }) {
  const hasPhone = !!phone?.trim();
  return (
    <button
      disabled={!hasPhone}
      onClick={e => {
        e.stopPropagation();
        if (!hasPhone) return;
        const cleanPhone = normalizePhone(phone);
        if (cleanPhone.length < 8) { toast.error('Numéro invalide'); return; }
        window.open(`https://wa.me/${cleanPhone}`, '_blank', 'noopener,noreferrer');
        onContact && onContact(leadId);
      }}
      title={hasPhone ? `WhatsApp: ${phone}` : 'Numéro manquant'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: compact ? 0 : 6,
        height: 40, width: compact ? 40 : 'auto', padding: compact ? 0 : '0 14px',
        borderRadius: 10, border: 'none', cursor: hasPhone ? 'pointer' : 'not-allowed',
        background: hasPhone ? 'rgba(37,211,102,0.15)' : 'rgba(255,255,255,0.05)',
        color: hasPhone ? '#25d366' : 'rgba(255,255,255,0.2)', fontWeight: 700, fontSize: 12, transition: 'all .2s',
        flexShrink: 0,
      }}
    >
      <MessageCircle size={14} />
      {!compact && 'WhatsApp'}
    </button>
  );
}

const actionBtn = (bg) => ({
  width: 36, height: 36, borderRadius: 10, border: 'none',
  background: typeof bg === 'string' && bg.startsWith('#') ? bg + '22' : bg,
  color: typeof bg === 'string' && bg.startsWith('#') ? bg : 'white',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
});

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h4 style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>{title}</h4>
      {children}
    </div>
  );
}

function Field({ icon, label, value, editing, onChange, type, options, valueRaw }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, width: 80, flexShrink: 0 }}>{label}</span>
      {editing ? (
        type === 'select'
          ? <select value={valueRaw} onChange={e => onChange(e.target.value)} style={{ ...inp, padding: '7px 10px' }}>
              {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          : <input value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...inp, padding: '7px 10px' }} />
      ) : (
        <span style={{ color: value ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)', fontSize: 13 }}>{value || '—'}</span>
      )}
    </div>
  );
}

function LeadModal({ lead, profileId, onClose, onUpdate, onDelete, onContact }) {
  const { isTablet } = useBreakpoint(); // [tablet]
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({ ...lead, score: lead?.score ?? 50 }));
  const [note, setNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [activities, setActivities]   = useState([]);
  const [loadingAct, setLoadingAct]   = useState(true);
  const [doneTasks, setDoneTasks]      = useState(new Set()); // [A10] IDs des tâches marquées faites

  useEffect(() => { loadActivities(); }, [lead.id]);

  const loadActivities = async () => {
    setLoadingAct(true);
    const { data } = await supabase.from('lead_activities').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false });
    setActivities(data || []);
    setLoadingAct(false);
  };

  // [A10] Marquer une tâche comme terminée
  const markTaskDone = async (activity) => {
    if (doneTasks.has(activity.id)) return;
    setDoneTasks(prev => new Set([...prev, activity.id]));
    await supabase.from('lead_activities').insert([{
      lead_id:     lead.id,
      type:        'task_done',
      description: `✅ Terminée : ${activity.description}`,
    }]);
    loadActivities();
    if (profileId) triggerTaskCompleted(profileId, {
      leadId:          lead.id,
      leadName:        lead.name,
      taskDescription: activity.description,
    });
  };

  const saveEdit = async () => {
    const { error } = await supabase.from('leads').update({
      name: form.name, phone: form.phone, email: form.email,
      company: form.company, status: form.status, source: form.source,
      notes: form.notes, score: form.score, updated_at: new Date().toISOString(),
    }).eq('id', lead.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from('lead_activities').insert([{ lead_id: lead.id, type: 'edited', description: 'Fiche modifiée' }]);
    onUpdate({ ...lead, ...form });
    setEditing(false);
    toast.success('Lead mis à jour');
    loadActivities();

    // [A9] Déclencher lead_score_reached si un seuil est franchi
    if (profileId && form.score !== (lead.score ?? 0)) {
      triggerLeadScoreReachedIfThreshold(profileId, {
        leadId:   lead.id,
        leadName: lead.name,
        oldScore: lead.score ?? 0,
        newScore: form.score,
      });
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await supabase.from('lead_activities').insert([{ lead_id: lead.id, type: 'note', description: note.trim() }]);
    setNote('');
    loadActivities();
    toast.success('Note ajoutée');
  };

  const handleStatusChange = async (newStatus) => {
    await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', lead.id);
    await supabase.from('lead_activities').insert([{
      lead_id: lead.id, type: 'status',
      description: `Statut → ${STATUSES.find(s => s.id === newStatus)?.label || newStatus}`,
    }]);
    onUpdate({ ...lead, status: newStatus });
    setForm(f => ({ ...f, status: newStatus }));
    loadActivities();

    // [A7] Déclencher lead_status_changed
    if (profileId) triggerLeadStatusChanged(profileId, {
      leadId:    lead.id,
      leadName:  lead.name,
      oldStatus: lead.status,
      newStatus,
    });
  };

  const addTag = async () => {
    const tag = newTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    const currentTags = lead.tags || [];
    if (currentTags.includes(tag)) { setNewTag(''); return; }
    const updatedTags = [...currentTags, tag];
    const { error } = await supabase.from('leads').update({ tags: updatedTags }).eq('id', lead.id);
    if (error) { toast.error(error.message); return; }
    onUpdate({ ...lead, tags: updatedTags });
    setNewTag('');

    // [A8] Déclencher lead_tagged
    if (profileId) triggerLeadTagged(profileId, {
      leadId:   lead.id,
      leadName: lead.name,
      tag,
    });
  };

  const removeTag = async (tag) => {
    const updatedTags = (lead.tags || []).filter(t => t !== tag);
    const { error } = await supabase.from('leads').update({ tags: updatedTags }).eq('id', lead.id);
    if (error) { toast.error(error.message); return; }
    onUpdate({ ...lead, tags: updatedTags });
  };

  const current = editing ? form : lead;
  const { color: sc } = scoreLabel(current.score || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
    >
      {/* [FIX3] classe crm-drawer : hauteur 100vh puis 100dvh (fallback CSS) */}
      <style>{`.crm-drawer{height:100vh;height:100dvh;}`}</style>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="crm-drawer"
        style={{ width: '100%', maxWidth: isTablet ? 580 : 460, background: '#0f0f1a', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: '20px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg, ${sc}44, ${sc}22)`, border: `2px solid ${sc}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: sc }}>
              {(current.name || '?')[0].toUpperCase()}
            </div>
            <div>
              {editing
                ? <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inp, padding: '6px 10px', fontSize: 15, fontWeight: 700, width: 180 }} />
                : <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 700 }}>{lead.name}</h3>
              }
              <StatusBadge status={current.status} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {editing
              ? <button onClick={saveEdit} style={actionBtn('#22c55e')}><Check size={14} /></button>
              : <button onClick={() => setEditing(true)} style={actionBtn('#6366f1')}><Pencil size={14} /></button>
            }
            <button onClick={onClose} style={actionBtn('rgba(255,255,255,0.15)')}><X size={14} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <WhatsAppBtn phone={current.phone} leadId={lead.id} onContact={async (id) => {
              await supabase.from('lead_activities').insert([{ lead_id: id, type: 'whatsapp', description: 'Contact WhatsApp effectué' }]);
              onContact && onContact();
              loadActivities();
            }} />
            {current.email && (
              <a href={`mailto:${current.email}`} onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 10, textDecoration: 'none', background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontWeight: 700, fontSize: 12, border: 'none' }}>
                <Mail size={14} /> Email
              </a>
            )}
            <button onClick={() => { if (window.confirm('Supprimer ce lead ?')) { onDelete(lead.id); onClose(); } }} style={{ ...actionBtn('#ef4444'), marginLeft: 'auto' }}>
              <Trash2 size={14} />
            </button>
          </div>

          <Section title="Informations">
            <Field icon={<Phone size={13} />} label="Téléphone" value={current.phone} editing={editing} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            <Field icon={<Mail size={13} />} label="Email" value={current.email} editing={editing} onChange={v => setForm(f => ({ ...f, email: v }))} />
            <Field icon={<Building2 size={13} />} label="Entreprise" value={current.company} editing={editing} onChange={v => setForm(f => ({ ...f, company: v }))} />
            <Field icon={<Globe size={13} />} label="Source" value={SOURCES.find(s => s.id === current.source)?.label || current.source} valueRaw={current.source} editing={editing} type="select" options={SOURCES} onChange={v => setForm(f => ({ ...f, source: v }))} />
          </Section>

          <Section title="Statut">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATUSES.map(s => (
                <button key={s.id} onClick={() => editing ? setForm(f => ({ ...f, status: s.id })) : handleStatusChange(s.id)} style={{
                  padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
                  border: `1px solid ${(editing ? form : lead).status === s.id ? s.color : 'rgba(255,255,255,0.08)'}`,
                  background: (editing ? form : lead).status === s.id ? s.bg : 'transparent',
                  color: (editing ? form : lead).status === s.id ? s.color : 'rgba(255,255,255,0.45)',
                  fontSize: 12, fontWeight: 600,
                }}>{s.label}</button>
              ))}
            </div>
          </Section>

          <Section title="Tags">
            <TagChips tags={lead.tags || []} onRemove={removeTag} />
            <div style={{ display: 'flex', gap: 8, marginTop: (lead.tags?.length ? 10 : 0) }}>
              <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Ajouter un tag (ex: vip, urgent)..." style={{ ...inp, flex: 1 }} onKeyDown={e => e.key === 'Enter' && addTag()} />
              <button onClick={addTag} style={{ ...actionBtn('#6366f1'), padding: '0 14px', borderRadius: 10, width: 'auto' }}><Plus size={14} /></button>
            </div>
          </Section>

          <Section title="Score commercial">
            <ScoreBar score={editing ? form.score : (lead.score ?? 0)} onChange={editing ? v => setForm(f => ({ ...f, score: v })) : null} />
          </Section>

          <Section title="Notes">
            {current.notes && (
              <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>
                {editing
                  ? <textarea value={form.notes} rows={3} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inp, resize: 'none' }} />
                  : current.notes
                }
              </p>
            )}
            {!editing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ajouter une note..." style={{ ...inp, flex: 1 }} onKeyDown={e => e.key === 'Enter' && addNote()} />
                <button onClick={addNote} style={{ ...actionBtn('#6366f1'), padding: '0 14px', borderRadius: 10, width: 'auto' }}><Plus size={14} /></button>
              </div>
            )}
          </Section>

          <Section title="Historique">
            {loadingAct
              ? <div style={{ textAlign: 'center', padding: 20 }}><Loader2 size={16} color="rgba(255,255,255,0.3)" className="animate-spin" /></div>
              : activities.length === 0
              ? <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>Aucune activité</p>
              : activities.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{ACTIVITY_ICONS[a.type] || '📌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 13, flex: 1 }}>{a.description}</p>
                      {/* [A10] Bouton "Fait" uniquement sur les tâches non terminées */}
                      {a.type === 'task' && !doneTasks.has(a.id) && (
                        <button
                          onClick={() => markTaskDone(a)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 7, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                        >
                          ✓ Fait
                        </button>
                      )}
                      {a.type === 'task' && doneTasks.has(a.id) && (
                        <span style={{ fontSize: 11, color: '#22c55e', opacity: 0.6 }}>✓ Terminée</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(a.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              ))
            }
          </Section>
        </div>
      </motion.div>
    </motion.div>
  );
}

// [tablet] useIsMobile remplacé par useBreakpoint (voir src/hooks/useBreakpoint.js)

// [FIX2] Carte pipeline pilotée par Pointer Events (souris + tactile unifiés).
// Un simple tap ouvre la fiche ; un déplacement au-delà d'un petit seuil
// démarre un drag, qui fonctionne aussi bien à la souris qu'au doigt sur
// iOS/Android — contrairement à l'ancienne API HTML5 drag-and-drop native.
function PipelineCard({ lead, isDragging, onOpen, onDragStart, onDragMove, onDragEnd }) {
  const { color: sc } = scoreLabel(lead.score || 0);
  const startRef = useRef({ x: 0, y: 0, dragging: false, pointerId: null });

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // clic gauche uniquement
    startRef.current = { x: e.clientX, y: e.clientY, dragging: false, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const s = startRef.current;
    if (s.pointerId !== e.pointerId) return;
    if (!s.dragging) {
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.hypot(dx, dy) < 6) return;
      s.dragging = true;
      onDragStart(lead.id);
    }
    e.preventDefault();
    onDragMove(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    const s = startRef.current;
    if (s.pointerId !== e.pointerId) return;
    if (s.dragging) {
      onDragEnd(e.clientX, e.clientY);
    } else {
      onOpen();
    }
    startRef.current = { x: 0, y: 0, dragging: false, pointerId: null };
  };

  const handlePointerCancel = (e) => {
    if (startRef.current.dragging) onDragEnd(null, null);
    startRef.current = { x: 0, y: 0, dragging: false, pointerId: null };
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
        padding: '10px 12px', cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', flexDirection: 'column', gap: 8,
        touchAction: 'none', userSelect: 'none',
        opacity: isDragging ? 0.45 : 1, transition: 'opacity .1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${sc}44, ${sc}22)`, border: `1.5px solid ${sc}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: sc }}>
          {(lead.name || '?')[0].toUpperCase()}
        </div>
        <span style={{ color: 'white', fontSize: 12.5, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</span>
      </div>
      {(lead.phone || lead.company) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {lead.phone && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={9} /> {lead.phone}</span>}
          {lead.company && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={9} /> {lead.company}</span>}
        </div>
      )}
      {!!lead.tags?.length && <TagChips tags={lead.tags} size="small" />}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${lead.score || 0}%`, background: sc, borderRadius: 99 }} />
      </div>
    </div>
  );
}

function PipelineView({ leads, onCardClick, onStatusChange }) {
  const { isTablet } = useBreakpoint(); // [tablet]
  const [draggedId, setDraggedId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const grouped = useMemo(() => {
    const map = {};
    STATUSES.forEach(s => { map[s.id] = []; });
    leads.forEach(l => { if (map[l.status]) map[l.status].push(l); });
    return map;
  }, [leads]);

  // [FIX2] Détecte la colonne survolée via elementFromPoint — fonctionne
  // identiquement pour un pointeur souris ou un doigt.
  const findColumnAt = (x, y) => {
    if (x == null || y == null) return null;
    const el = document.elementFromPoint(x, y);
    const col = el && el.closest('[data-status-col]');
    return col ? col.getAttribute('data-status-col') : null;
  };

  const handleDragStart = (id) => setDraggedId(id);
  const handleDragMove = (x, y) => setOverColumn(findColumnAt(x, y));
  const handleDragEnd = (x, y) => {
    const target = findColumnAt(x, y);
    if (target && draggedId) onStatusChange(draggedId, target);
    setDraggedId(null);
    setOverColumn(null);
  };

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
      {STATUSES.map(status => (
        <div key={status.id}
          data-status-col={status.id}
          style={{ minWidth: isTablet ? 260 : 230, width: isTablet ? 260 : 230, flexShrink: 0, background: overColumn === status.id ? 'rgba(255,255,255,0.04)' : 'transparent', border: overColumn === status.id ? `1.5px dashed ${status.color}66` : '1.5px dashed transparent', borderRadius: 14, padding: 6, transition: 'all .12s' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 10px' }}>
            <span style={{ color: status.color, fontSize: 12, fontWeight: 700 }}>{status.label}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.06)', borderRadius: 99, padding: '1px 7px' }}>{grouped[status.id].length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60 }}>
            {grouped[status.id].map(lead => (
              <PipelineCard
                key={lead.id}
                lead={lead}
                isDragging={draggedId === lead.id}
                onOpen={() => onCardClick(lead)}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              />
            ))}
            {grouped[status.id].length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>Aucun lead</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LeadsCRMPanel({ profileId }) {
  const { isMobile, isTablet } = useBreakpoint(); // [tablet]
  const [leads, setLeads]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState('list');
  const [filter, setFilter]             = useState('all');
  const [tagFilter, setTagFilter]       = useState(null);
  const [search, setSearch]             = useState('');
  const [showAdd, setShowAdd]           = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [newLead, setNewLead]           = useState({ ...EMPTY_LEAD });
  const [adding, setAdding]             = useState(false);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [bulkStatus, setBulkStatus]     = useState('');
  // [FIX6] Détecté une seule fois : évite un état "survolé" collé après un
  // tap sur les lignes de la liste, sur les appareils tactiles.
  const [canHover] = useState(() => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches);

  useEffect(() => {
    if (!profileId) return;
    loadLeads();
    const channel = supabase
      .channel(`leads-${profileId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `profile_id=eq.${profileId}` }, () => loadLeads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  useEffect(() => { setSelectedIds(new Set()); setBulkStatus(''); }, [view, filter, tagFilter, search]);

  const loadLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('leads').select('*').eq('profile_id', profileId).order('created_at', { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setLeads(data || []);
    setLoading(false);
  };

  // ── [A4] Ajout d'un lead avec déclencheur automatisation ─────────
  const addLead = async () => {
    if (!newLead.name.trim()) { toast.error('Nom requis'); return; }
    setAdding(true);
    const exists = leads.find(l => normalizePhone(l.phone) === normalizePhone(newLead.phone) && normalizePhone(newLead.phone).length > 0);
    if (exists) { toast.error('Ce numéro existe déjà'); setAdding(false); return; }
    const { data, error } = await supabase
      .from('leads')
      .insert([{ ...newLead, profile_id: profileId, score: 0 }])
      .select()
      .maybeSingle();
    if (error) { toast.error(error.message); setAdding(false); return; }
    await supabase.from('lead_activities').insert([{ lead_id: data.id, type: 'created', description: 'Lead créé' }]);

    // [A4] Déclencher les automatisations new_lead (fire-and-forget — ne bloque pas l'UI)
    triggerNewLead(profileId, {
      leadId: data.id,    // évite qu'une action create_lead crée un doublon
      name:   data.name,
      email:  data.email,
      phone:  data.phone,
      source: data.source,
    });

    setLeads(p => [data, ...p]);
    setNewLead({ ...EMPTY_LEAD });
    setShowAdd(false);
    setAdding(false);
    toast.success('Lead ajouté ✅');
  };

  const deleteLead = async (id) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setLeads(prev => prev.filter(l => l.id !== id));
    toast.success('Lead supprimé');
  };

  const updateLeadLocal = (updated) => setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));

  const handlePipelineStatusChange = async (leadId, newStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    const { error } = await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', leadId);
    if (error) { toast.error(error.message); setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: lead.status } : l)); return; }
    await supabase.from('lead_activities').insert([{ lead_id: leadId, type: 'status', description: `Statut → ${STATUSES.find(s => s.id === newStatus)?.label || newStatus} (glissé-déposé)` }]);
    toast.success(`${lead.name} → ${STATUSES.find(s => s.id === newStatus)?.label}`);

    // [A7] Déclencher lead_status_changed (pipeline drag-and-drop)
    triggerLeadStatusChanged(profileId, {
      leadId:    leadId,
      leadName:  lead.name,
      oldStatus: lead.status,
      newStatus,
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const bulkChangeStatus = async (newStatus) => {
    if (!newStatus) return;
    const ids = [...selectedIds];
    setLeads(prev => prev.map(l => selectedIds.has(l.id) ? { ...l, status: newStatus } : l));
    const { error } = await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).in('id', ids);
    if (error) { toast.error(error.message); loadLeads(); return; }
    await supabase.from('lead_activities').insert(ids.map(id => ({ lead_id: id, type: 'status', description: `Statut → ${STATUSES.find(s => s.id === newStatus)?.label} (action groupée)` })));
    setSelectedIds(new Set());
    setBulkStatus('');
    toast.success(`${ids.length} lead${ids.length > 1 ? 's' : ''} mis à jour`);
  };

  const bulkDelete = async () => {
    const ids = [...selectedIds];
    if (!window.confirm(`Supprimer définitivement ${ids.length} lead${ids.length > 1 ? 's' : ''} ?`)) return;
    const { error } = await supabase.from('leads').delete().in('id', ids);
    if (error) { toast.error(error.message); return; }
    setLeads(prev => prev.filter(l => !selectedIds.has(l.id)));
    setSelectedIds(new Set());
    toast.success(`${ids.length} lead${ids.length > 1 ? 's' : ''} supprimé${ids.length > 1 ? 's' : ''}`);
  };

  const buildCSV = (rows) => {
    const headers = ['Nom', 'Téléphone', 'Email', 'Entreprise', 'Statut', 'Source', 'Score', 'Tags', 'Notes', 'Créé le'];
    const data = rows.map(l => [
      l.name || '', l.phone || '', l.email || '', l.company || '',
      STATUSES.find(s => s.id === l.status)?.label || l.status,
      SOURCES.find(s => s.id === l.source)?.label || l.source,
      l.score ?? '', (l.tags || []).join('; '), (l.notes || '').replace(/\n/g, ' '),
      l.created_at ? new Date(l.created_at).toLocaleDateString('fr-FR') : '',
    ]);
    return [headers, ...data].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  const exportCSV = () => {
    if (!leads.length) { toast.error('Aucun lead à exporter'); return; }
    const blob = new Blob(['\uFEFF' + buildCSV(leads)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `leads-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const exportSelectedCSV = () => {
    const selected = leads.filter(l => selectedIds.has(l.id)); if (!selected.length) return;
    const blob = new Blob(['\uFEFF' + buildCSV(selected)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `leads-selection-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const allTags = useMemo(() => { const set = new Set(); leads.forEach(l => (l.tags || []).forEach(t => set.add(t))); return Array.from(set).sort(); }, [leads]);

  const filteredLeads = leads.filter(l => {
    const matchesFilter = filter === 'all' || l.status === filter;
    const matchesTag = !tagFilter || (l.tags || []).includes(tagFilter);
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || l.name?.toLowerCase().includes(q) || l.phone?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q) || (l.tags || []).some(t => t.toLowerCase().includes(q));
    return matchesFilter && matchesTag && matchesSearch;
  });

  const statusCounts = STATUSES.reduce((acc, s) => { acc[s.id] = leads.filter(l => l.status === s.id).length; return acc; }, {});
  const allSelected  = filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.has(l.id));
  const someSelected = filteredLeads.some(l => selectedIds.has(l.id));
  const toggleSelectAll = () => { if (allSelected) { setSelectedIds(new Set()); } else { setSelectedIds(new Set(filteredLeads.map(l => l.id))); } };

  if (!profileId) return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Sélectionnez un profil pour gérer vos leads.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* [FIX4] classe crm-modal : max-height 90vh puis 90dvh (fallback CSS) */}
      <style>{`.crm-modal{max-height:90vh;max-height:90dvh;}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ color: 'white', fontSize: 16, fontWeight: 800, margin: 0 }}>Leads CRM</h3>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '4px 0 0' }}>{leads.length} lead{leads.length !== 1 ? 's' : ''} au total</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 3 }}>
            <button onClick={() => setView('list')} title="Vue liste" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 9, border: 'none', background: view === 'list' ? 'rgba(99,102,241,0.25)' : 'transparent', color: view === 'list' ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <List size={13} /> {(!isMobile || isTablet) && 'Liste'}
            </button>
            <button onClick={() => setView('pipeline')} title="Vue pipeline" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 9, border: 'none', background: view === 'pipeline' ? 'rgba(99,102,241,0.25)' : 'transparent', color: view === 'pipeline' ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <Columns3 size={13} /> {(!isMobile || isTablet) && 'Pipeline'}
            </button>
          </div>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={13} /> {isMobile && !isTablet ? '' : 'Exporter CSV'}
          </button>
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <UserPlus size={13} /> {isMobile ? 'Ajouter' : 'Ajouter un lead'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un lead (nom, téléphone, email, entreprise, tag)..."
            style={{ ...inp, paddingLeft: 38 }} />
        </div>

        {view === 'list' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setFilter('all')} style={{ padding: '6px 12px', borderRadius: 99, cursor: 'pointer', border: `1px solid ${filter === 'all' ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, background: filter === 'all' ? 'rgba(99,102,241,0.15)' : 'transparent', color: filter === 'all' ? '#818cf8' : 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600 }}>
              Tous ({leads.length})
            </button>
            {STATUSES.map(s => (
              <button key={s.id} onClick={() => setFilter(s.id)} style={{ padding: '6px 12px', borderRadius: 99, cursor: 'pointer', border: `1px solid ${filter === s.id ? s.color : 'rgba(255,255,255,0.08)'}`, background: filter === s.id ? s.bg : 'transparent', color: filter === s.id ? s.color : 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600 }}>
                {s.label} ({statusCounts[s.id] || 0})
              </button>
            ))}
          </div>
        )}

        {allTags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><TagIcon size={11} /> Tags :</span>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setTagFilter(prev => prev === tag ? null : tag)} style={{ padding: '3px 9px', borderRadius: 99, cursor: 'pointer', border: `1px solid ${tagFilter === tag ? tagColor(tag) : 'rgba(255,255,255,0.08)'}`, background: tagFilter === tag ? `${tagColor(tag)}22` : 'transparent', color: tagFilter === tag ? tagColor(tag) : 'rgba(255,255,255,0.4)', fontSize: 10.5, fontWeight: 600 }}>
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedIds.size > 0 && view === 'list' && (
          <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -6, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 14 }}>
              <span style={{ background: 'rgba(99,102,241,0.25)', color: '#a78bfa', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
              </span>
              <button onClick={() => setSelectedIds(new Set())} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <X size={11} /> Désélectionner
              </button>
              <select value={bulkStatus} onChange={e => { setBulkStatus(e.target.value); bulkChangeStatus(e.target.value); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#1a1a2e', color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                <option value="">Changer le statut…</option>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button onClick={exportSelectedCSV} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <Download size={11} /> CSV
              </button>
              <button onClick={bulkDelete} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
                <Trash2 size={11} /> Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {view === 'pipeline' && (
        loading
          ? <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={20} color="rgba(255,255,255,0.3)" className="animate-spin" /></div>
          : <PipelineView leads={filteredLeads} onCardClick={setSelectedLead} onStatusChange={handlePipelineStatusChange} />
      )}

      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={20} color="rgba(255,255,255,0.3)" className="animate-spin" /></div>
          ) : filteredLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              {leads.length === 0 ? 'Aucun lead pour le moment.' : 'Aucun lead ne correspond à votre recherche.'}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleSelectAll} />
                <span style={{ cursor: 'pointer', userSelect: 'none' }} onClick={toggleSelectAll}>
                  {allSelected ? 'Tout désélectionner' : `Tout sélectionner (${filteredLeads.length})`}
                </span>
              </div>

              {filteredLeads.map(lead => {
                const { color: sc } = scoreLabel(lead.score || 0);
                const isSelected = selectedIds.has(lead.id);
                return (
                  <motion.div key={lead.id} layout onClick={() => setSelectedLead(lead)}
                    {...(canHover ? { whileHover: { background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.07)' } } : {})}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isSelected ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, cursor: 'pointer', transition: 'border-color .15s, background .15s' }}>
                    <Checkbox checked={isSelected} onChange={() => toggleSelect(lead.id)} />
                    <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${sc}44, ${sc}22)`, border: `2px solid ${sc}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: sc }}>
                      {(lead.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{lead.name}</span>
                        <StatusBadge status={lead.status} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, color: 'rgba(255,255,255,0.35)', fontSize: 12, flexWrap: 'wrap' }}>
                        {lead.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {lead.phone}</span>}
                        {lead.company && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={11} /> {lead.company}</span>}
                        {(isTablet || !isMobile) && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={11} /> {SOURCES.find(s => s.id === lead.source)?.label || lead.source}</span>}
                      </div>
                      {!!lead.tags?.length && <div style={{ marginTop: 6 }}><TagChips tags={lead.tags} size="small" /></div>}
                    </div>
                    {(isTablet || !isMobile) && <div style={{ width: isTablet ? 110 : 90, flexShrink: 0 }}><ScoreBar score={lead.score || 0} /></div>}
                    <WhatsAppBtn phone={lead.phone} leadId={lead.id} compact
                      onContact={async (id) => { await supabase.from('lead_activities').insert([{ lead_id: id, type: 'whatsapp', description: 'Contact WhatsApp effectué' }]); }} />
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            {/* [FIX1] BUG CORRIGÉ : l'ancien commentaire JSX mal fermé
                `{/* [tablet] *\/>` juste avant le `>` cassait la syntaxe et
                empêchait toute compilation. Il est simplement retiré ici ;
                la classe crm-modal gère désormais le [FIX4] (max-height). */}
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="crm-modal"
              style={{ width: '100%', maxWidth: isTablet ? 540 : 420, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: isTablet ? 28 : 24, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ color: 'white', fontSize: 16, fontWeight: 800, margin: 0 }}>Nouveau lead</h3>
                <button onClick={() => setShowAdd(false)} style={actionBtn('rgba(255,255,255,0.15)')}><X size={14} /></button>
              </div>
              {[
                { key: 'name',    label: 'Nom *',      ph: 'Nom complet'         },
                { key: 'phone',   label: 'Téléphone',  ph: 'Ex: 0700000000'      },
                { key: 'email',   label: 'Email',       ph: 'email@exemple.com'   },
                { key: 'company', label: 'Entreprise',  ph: "Nom de l'entreprise" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input value={newLead[f.key]} onChange={e => setNewLead(p => ({ ...p, [f.key]: e.target.value }))} style={inp} placeholder={f.ph} />
                </div>
              ))}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Source</label>
                <select value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))} style={inp}>
                  {SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Notes</label>
                <textarea value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inp, resize: 'none' }} placeholder="Notes additionnelles..." />
              </div>
              <button onClick={addLead} disabled={adding} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1, marginTop: 4 }}>
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Ajouter le lead
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLead && (
          <LeadModal lead={selectedLead} profileId={profileId} onClose={() => setSelectedLead(null)}
            onUpdate={updated => { updateLeadLocal(updated); setSelectedLead(updated); }}
            onDelete={deleteLead} />
        )}
      </AnimatePresence>
    </div>
  );
}