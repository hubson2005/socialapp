import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Trash2, Mail, Phone, UserPlus,
  Loader2, Download, X,
  MessageCircle, Building2, Tag as TagIcon,
  Pencil, Check,
  Globe, List, Columns3,
  GripVertical, Flame, Snowflake, CheckCircle2, Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import TasksCRMPanel  from './TasksCRMPanel';   // fiche contact : tâches
import ContactTimeline from './ContactTimeline'; // fiche contact : timeline unifiée
import FollowUpsPanel  from './FollowUpsPanel';  // [R1] panneau « À relancer »
import { supabase } from '../../supabase';
// [A4][A7][A8][A9][A10] Moteur d'automatisation — déclencheurs CRM
import { triggerNewLead }                    from '../../lib/triggers/newLead';
import { useBreakpoint }                     from '../../hooks/useBreakpoint';
import { triggerLeadStatusChanged }          from '../../lib/triggers/leadStatus';     // [A7]
import { triggerLeadTagged }                 from '../../lib/triggers/leadTagged';     // [A8]
import { triggerLeadScoreReachedIfThreshold } from '../../lib/triggers/leadScore';     // [A9]
import { triggerTaskCompleted }              from '../../lib/triggers/taskCompleted';  // [A10]
import { normalizePhone, isValidPhone, checkPhone } from '../../lib/phone';                   // [C2]


// ─── CORRECTIONS DU PLAN DU 2 OCTOBRE 2026 ────────────────────────────────────
//  [C2] normalizePhone/isValidPhone importés depuis lib/phone.js (format
//       ivoirien : +225 + 10 chiffres, le 0 est conservé). Bouton WhatsApp
//       corrigé. addLead gère le doublon renvoyé par la base (code 23505).
//  [C3] saveEdit et bulkChangeStatus déclenchent désormais
//       triggerLeadStatusChanged (statut en édition + action groupée).
//  [C4] Realtime : spinner uniquement au 1er chargement, événements
//       INSERT/UPDATE/DELETE appliqués localement (plus de rechargements).
//  [C5] Tâches : colonne done_at sur la tâche elle-même (plus de state
//       doneTasks). Icônes task / task_done ajoutées.
//  [C6] fetchAllLeads : chargement par lots de 1000 (plus de plafond).
//  [C7] Export CSV : protection contre l'injection de formules (csvCell).
//  [C8] 8a notes saisissables en édition ; 8b handleStatusChange contrôle
//       l'erreur ; 8c score initial `?? 0`.
//
// ─── TAGS / SEGMENTS (cette révision) ─────────────────────────────────────────
//  [TG1] normalizeTag : normalisation unique (minuscules, tirets, sans « # »,
//        30 caractères max) pour fiche, création et actions groupées.
//  [TG2] Fiche lead : suggestions de tags existants en un clic (addTag
//        accepte une valeur) + autocomplétion (datalist).
//  [TG3] « Nouveau lead » : champ Tags à la création (déclenche lead_tagged
//        pour chaque tag, comme l'ajout depuis la fiche).
//  [TG4] Actions groupées : « + Tag » / « − Tag » sur la sélection.
//  [TG5] Filtre par tag : compteurs, tri par fréquence, bouton Effacer,
//        export CSV du segment affiché ; le filtre se réinitialise si le tag
//        n'existe plus.
//  [TG6] Correctif : addTag appelé via onClick recevait l'événement comme
//        valeur ; remplacé par une fonction fléchée.
//
// ─── RAPPELS DE RELANCE (cette révision) ──────────────────────────────────────
//  [R1] Panneau « À relancer » (FollowUpsPanel) au-dessus des filtres : tâches
//       ouvertes de crm_tasks en retard / du jour / à venir (7 j), avec
//       WhatsApp, Reporter (+1/+3/+7 j) et Terminé. Les rappels eux-mêmes
//       (notification à l'échéance) restent envoyés par le cron
//       `crm-task-reminders` côté base.
//       « À relancer » se recharge aussi à la fermeture de la fiche lead (tâches
//       ajoutées / terminées via TasksCRMPanel).
//  [R2] Fiche lead : « Programmer une relance » en un clic (demain, 3 jours,
//       1 semaine, 2 semaines, ou date précise) → insère dans crm_tasks.
//
// ─── CORRECTIONS RESPONSIVE / BUGS ────────────────────────────────────────────
//  [FIX1] Commentaire JSX mal fermé dans la modale "Nouveau lead".
//  [FIX2] Pipeline en Pointer Events (souris + tactile) au lieu du
//         drag-and-drop HTML5 natif.
//  [FIX3] 100vh → 100dvh (fallback CSS) sur le tiroir latéral.
//  [FIX4] 90vh → 90dvh sur la modale "Nouveau lead".
//  [FIX5] Cibles tactiles agrandies (Checkbox, bouton WhatsApp compact).
//  [FIX6] `whileHover` désactivé sur appareils sans survol.
//  [FIX7] Champs de modale teintés indigo + halo au focus.
//  [FIX8] Vue Pipeline : colonnes toujours visibles, badge de comptage,
//         icône d'état vide, scroll interne.
//
// ─── GRILLE + PAGINATION VUE LISTE ────────────────────────────────────────────
//  [G1] Grille de cartes, 16 leads/page (LEADS_PAGE_SIZE).
//  [G2] Composant Pagination + getPageNumbers.
//  [G3] Composant LeadGridCard.
//  [G4] auto-fill/minmax(240px, 1fr) : 4 colonnes desktop, 2/1 sur mobile.
//  [G5] Reset de `page` au changement de vue/filtre/tag/recherche + garde-fou.
//
// ─── THÈME ────────────────────────────────────────────────────────────────────
//  [T1] Panneau principal en thème clair.
//  [T2] Modales (LeadModal, "Nouveau lead") passées en thème clair elles
//       aussi : tout le module suit désormais les tokens du dashboard
//       (carte #ffffff, bordures #e6e8f0, texte #161a2e / #6b7280, accent
//       indigo #6366f1). Overlay en voile sombre translucide. Couleurs de
//       statuts, scores, tags et WhatsApp assombries pour garder un bon
//       contraste en texte sur fond blanc. `inp` (recherche) / `inpModal`
//       (champs des modales).

const STATUSES = [
  { id: 'prospect', label: 'Prospect',   color: '#4f46e5', bg: 'rgba(99,102,241,0.12)', icon: UserPlus    },
  { id: 'chaud',    label: '🔥 Chaud',   color: '#ea580c', bg: 'rgba(249,115,22,0.13)', icon: Flame       },
  { id: 'client',   label: '✅ Client',  color: '#16a34a', bg: 'rgba(34,197,94,0.13)',  icon: CheckCircle2 },
  { id: 'froid',    label: '❄️ Froid',   color: '#0891b2', bg: 'rgba(6,182,212,0.13)',  icon: Snowflake   },
  { id: 'perdu',    label: 'Perdu',      color: '#6b7280', bg: 'rgba(107,114,128,0.13)', icon: Ban        },
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

// [C5] clés task et task_done ajoutées
const ACTIVITY_ICONS = {
  created:   '🆕',
  edited:    '✏️',
  note:      '📝',
  whatsapp:  '💬',
  status:    '🔄',
  task:      '📋',
  task_created: '📋',
  task_done: '✅',
};

// [TG3] tags: [] ajouté (tableau, jamais muté — mises à jour immuables)
const EMPTY_LEAD = {
  name: '', phone: '', email: '', company: '',
  status: 'prospect', source: 'manuel', notes: '', score: 0, tags: [],
};

// [G1] Pagination de la vue liste : 16 leads par page (4 colonnes x 4 lignes)
const LEADS_PAGE_SIZE = 16;

// [C6] Supabase renvoie max 1000 lignes par requête : on récupère par lots.
const BATCH = 1000;
const fetchAllLeads = async (profileId) => {
  let all = [], from = 0;
  while (true) {
    const { data, error } = await supabase.from('leads').select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false }).order('id')   // ordre stable
      .range(from, from + BATCH - 1);
    if (error) throw error;
    all = all.concat(data || []);
    if (!data || data.length < BATCH) break;
    from += BATCH;
  }
  return all;
};

// [C7] Neutralise l'injection de formules Excel (=, +, -, @, tab, CR) sauf
// pour les numéros de téléphone (pour que +225... reste lisible).
const csvCell = (v) => {
  let s = String(v ?? '');
  const looksLikePhone = /^\+?[\d\s().-]+$/.test(s);
  if (!looksLikePhone && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

// [TG1] Normalisation unique des tags : « #VIP Urgent » → « vip-urgent »
const normalizeTag = (s) =>
  String(s || '').trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-').slice(0, 30);

const scoreLabel = (s) =>
  s <= 30  ? { label: 'Froid',    color: '#0891b2', icon: '❄️'  } :
  s <= 60  ? { label: 'Tiède',    color: '#d97706', icon: '🌡️'  } :
  s <= 80  ? { label: 'Chaud',    color: '#ea580c', icon: '🔥'  } :
             { label: 'Brûlant',  color: '#dc2626', icon: '🚀'  };

// [T2] Palette assombrie : lisible en texte sur fond blanc.
const TAG_PALETTE = ['#7c3aed', '#0891b2', '#db2777', '#b45309', '#059669', '#e11d48', '#4f46e5'];
const tagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
};

// [G2] Génère une liste compacte de numéros de page avec "…" si besoin
function getPageNumbers(current, total) {
  const delta = 1;
  const range = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }
  const withDots = [];
  if (current - delta > 2) withDots.push(1, '…'); else withDots.push(1);
  withDots.push(...range);
  if (current + delta < total - 1) withDots.push('…', total);
  else if (total > 1) withDots.push(total);
  return withDots;
}

// [G2] Barre de pagination — thème clair.
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(page, totalPages);
  const btn = (active, disabled) => ({
    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
    border: `1px solid ${active ? '#6366f1' : '#e6e8f0'}`,
    background: active ? 'rgba(99,102,241,0.14)' : '#f6f7fb',
    color: disabled ? '#c3c8d6' : active ? '#4f46e5' : '#6b7280',
    fontSize: 12, fontWeight: 700,
  });
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} style={btn(false, page === 1)}>‹</button>
      {pages.map((p, i) => p === '…'
        ? <span key={`dots-${i}`} style={{ color: '#a2a7b5', fontSize: 12, padding: '0 4px' }}>…</span>
        : <button key={p} onClick={() => onChange(p)} style={btn(p === page, false)}>{p}</button>
      )}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={btn(false, page === totalPages)}>›</button>
    </div>
  );
}

// [T1] Champ clair — barre de recherche du panneau principal.
const inp = {
  width: '100%', background: '#f6f7fb',
  border: '1px solid #e6e8f0', borderRadius: '12px',
  padding: '11px 13px', color: '#161a2e', outline: 'none',
  fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color .15s, background .15s',
};

// [T2] Champ des modales — même thème clair (remplace l'ancien `inpDark`).
const inpModal = { ...inp };

// [T2] Bouton de fermeture clair (croix) pour les modales.
const closeBtn = {
  width: 36, height: 36, borderRadius: 10, border: '1px solid #e6e8f0',
  background: '#f6f7fb', color: '#6b7280', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

// [FIX5] Zone de tap agrandie sans changer l'apparence (17x17).
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
        border: `1.5px solid ${checked || indeterminate ? '#6366f1' : '#c3c8d6'}`,
        background: checked ? '#6366f1' : indeterminate ? 'rgba(99,102,241,0.25)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .15s', ...style,
      }}>
        {checked && <Check size={10} color="white" strokeWidth={3} />}
        {!checked && indeterminate && <div style={{ width: 7, height: 2, background: '#6366f1', borderRadius: 1 }} />}
      </div>
    </div>
  );
}

// Utilisé dans LeadGridCard et LeadModal.
function ScoreBar({ score, onChange }) {
  const { color, label, icon } = scoreLabel(score);
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: '#8a90a2', fontSize: 12 }}>Score prospect</span>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>{icon} {score} — {label}</span>
      </div>
      <div style={{ position: 'relative', height: 6, background: '#e6e8f0', borderRadius: 99 }}>
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
          background: `${tagColor(tag)}1a`, border: `1px solid ${tagColor(tag)}44`,
          color: tagColor(tag), fontSize: isSmall ? 9.5 : 10.5, fontWeight: 700,
        }}>
          #{tag}
          {onRemove && <X size={isSmall ? 9 : 10} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onRemove(tag); }} />}
        </span>
      ))}
    </div>
  );
}

// [FIX5] Hauteur/largeur minimales 40px. [C2] validation via isValidPhone,
// lien wa.me avec le numéro normalisé (225 + 10 chiffres).
function WhatsAppBtn({ phone, leadId, onContact, compact = false }) {
  const hasPhone = !!phone?.trim();
  return (
    <button
      disabled={!hasPhone}
      onClick={e => {
        e.stopPropagation();
        if (!hasPhone) return;
        if (!isValidPhone(phone)) { toast.error('Numéro invalide'); return; }
        window.open(`https://wa.me/${normalizePhone(phone)}`, '_blank', 'noopener,noreferrer');
        onContact && onContact(leadId);
      }}
      title={hasPhone ? `WhatsApp: ${phone}` : 'Numéro manquant'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: compact ? 0 : 6,
        height: 40, width: compact ? 40 : 'auto', padding: compact ? 0 : '0 14px',
        borderRadius: 10, border: 'none', cursor: hasPhone ? 'pointer' : 'not-allowed',
        background: hasPhone ? 'rgba(37,211,102,0.15)' : '#eef0f5',
        color: hasPhone ? '#15803d' : '#a2a7b5', fontWeight: 700, fontSize: 12, transition: 'all .2s',
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

// Utilisé uniquement dans LeadModal.
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h4 style={{ color: '#8a90a2', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>{title}</h4>
      {children}
    </div>
  );
}

// Utilisé uniquement dans LeadModal, utilise inpModal.
function Field({ icon, label, value, editing, onChange, type, options, valueRaw }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ color: '#9095a5', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: '#8a90a2', fontSize: 12, width: 80, flexShrink: 0 }}>{label}</span>
      {editing ? (
        type === 'select'
          ? <select value={valueRaw} onChange={e => onChange(e.target.value)} className="crm-field-light" style={{ ...inpModal, padding: '7px 10px' }}>
              {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          : <input value={value || ''} onChange={e => onChange(e.target.value)} className="crm-field-light" style={{ ...inpModal, padding: '7px 10px' }} />
      ) : (
        <span style={{ color: value ? '#161a2e' : '#a2a7b5', fontSize: 13 }}>{value || '—'}</span>
      )}
    </div>
  );
}

// ─── LeadModal — tiroir latéral, thème clair ─────────────────────────────────
// [TG2] `allTags` : tags existants, proposés en suggestions cliquables.
function LeadModal({ lead, profileId, allTags = [], onClose, onUpdate, onDelete, onContact, onTaskCreated }) {
  const { isTablet } = useBreakpoint(); // [tablet]
  const [editing, setEditing] = useState(false);
  // [C8c] score initial `?? 0` (avant : `?? 50`, qui faussait la 1re modif)
  const [form, setForm] = useState(() => ({ ...lead, score: lead?.score ?? 0 }));
  const [note, setNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [activities, setActivities]   = useState([]);
  const [loadingAct, setLoadingAct]   = useState(true);
  const [taskKey, setTaskKey]         = useState(0); // [R2] remonte TasksCRMPanel après création

  useEffect(() => { loadActivities(); }, [lead.id]);

  const loadActivities = async () => {
    setLoadingAct(true);
    const { data } = await supabase.from('lead_activities').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false });
    setActivities(data || []);
    setLoadingAct(false);
  };

  // [A10][C5] Marquer une tâche comme terminée : done_at sur la tâche elle-même
  const markTaskDone = async (activity) => {
    if (activity.done_at) return;
    const doneAt = new Date().toISOString();
    setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, done_at: doneAt } : a));
    const { error } = await supabase.from('lead_activities')
      .update({ done_at: doneAt }).eq('id', activity.id);
    if (error) { toast.error(error.message); loadActivities(); return; }
    if (profileId) triggerTaskCompleted(profileId, {           // [A10]
      leadId: lead.id, leadName: lead.name, taskDescription: activity.description,
    });
  };

  // [C3] saveEdit : déclenche aussi lead_status_changed ; [C2] doublon 23505
  const saveEdit = async () => {
    if (form.phone?.trim() && !checkPhone(form.phone).ok) { toast.error(checkPhone(form.phone).reason); return; }
    const statusChanged = form.status !== lead.status;
    const scoreChanged  = form.score  !== (lead.score ?? 0);
    const { error } = await supabase.from('leads').update({
      name: form.name, phone: form.phone, email: form.email,
      company: form.company, status: form.status, source: form.source,
      notes: form.notes, score: form.score, updated_at: new Date().toISOString(),
    }).eq('id', lead.id);
    if (error) {
      toast.error(error.code === '23505' ? 'Ce numéro existe déjà' : error.message);
      return;
    }
    const rows = [{ lead_id: lead.id, type: 'edited', description: 'Fiche modifiée' }];
    if (statusChanged) rows.push({
      lead_id: lead.id, type: 'status',
      description: `Statut → ${STATUSES.find(s => s.id === form.status)?.label || form.status}`,
    });
    await supabase.from('lead_activities').insert(rows);
    onUpdate({ ...lead, ...form });
    setEditing(false);
    toast.success('Lead mis à jour');
    loadActivities();

    if (profileId && statusChanged) triggerLeadStatusChanged(profileId, {   // [A7]
      leadId: lead.id, leadName: form.name, oldStatus: lead.status, newStatus: form.status,
    });
    if (profileId && scoreChanged) triggerLeadScoreReachedIfThreshold(profileId, {   // [A9]
      leadId: lead.id, leadName: form.name, oldScore: lead.score ?? 0, newScore: form.score,
    });
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await supabase.from('lead_activities').insert([{ lead_id: lead.id, type: 'note', description: note.trim() }]);
    setNote('');
    loadActivities();
    toast.success('Note ajoutée');
  };

  // [C8b] contrôle d'erreur avant d'afficher le nouveau statut
  const handleStatusChange = async (newStatus) => {
    if (newStatus === lead.status) return;
    const { error } = await supabase.from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', lead.id);
    if (error) { toast.error(error.message); return; }
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

  // [TG1][TG2] accepte une valeur (suggestion cliquée) ou, par défaut, le champ de saisie
  const addTag = async (value = newTag) => {
    const tag = normalizeTag(value);
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

  // [R2] Programme une relance : tâche ouverte dans crm_tasks, échéance 09:00.
  // Les colonnes priority/status/source gardent leurs valeurs par défaut.
  const scheduleFollowUp = async (when) => {
    const due = when instanceof Date ? new Date(when) : new Date();
    if (!(when instanceof Date)) due.setDate(due.getDate() + when);
    due.setHours(9, 0, 0, 0);
    const pid = profileId || lead.profile_id;
    if (!pid) { toast.error('Profil introuvable'); return; }
    const { error } = await supabase.from('crm_tasks').insert([{
      profile_id: pid, lead_id: lead.id, title: `Relancer ${lead.name}`, due_at: due.toISOString(),
    }]);
    if (error) { toast.error(error.message); return; }
    // Même trace que useCrmTasks.addTask : visible dans la timeline du lead
    supabase.from('lead_activities').insert([{ lead_id: lead.id, type: 'task_created', description: `Relancer ${lead.name}` }])
      .then(({ error: e }) => { if (e) console.warn('[relance] activité non tracée :', e.message); });
    toast.success(`Relance programmée le ${due.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`);
    setTaskKey(k => k + 1);
    onTaskCreated && onTaskCreated();
  };

  const current = editing ? form : lead;
  const { color: sc } = scoreLabel(current.score || 0);
  // [TG2] Tags existants pas encore sur ce lead (10 max)
  const tagSuggestions = allTags.filter(t => !(lead.tags || []).includes(t)).slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
    >
      {/* [FIX3] classe crm-drawer : hauteur 100vh puis 100dvh (fallback CSS) */}
      <style>{`.crm-drawer{height:100vh;height:100dvh;}`}</style>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="crm-drawer"
        style={{ width: '100%', maxWidth: isTablet ? 580 : 460, background: '#ffffff', borderLeft: '1px solid #e6e8f0', boxShadow: '-12px 0 40px rgba(15,23,42,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: '20px 24px 18px', borderBottom: '1px solid #e6e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg, ${sc}44, ${sc}22)`, border: `2px solid ${sc}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: sc }}>
              {(current.name || '?')[0].toUpperCase()}
            </div>
            <div>
              {editing
                ? <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="crm-field-light" style={{ ...inpModal, padding: '6px 10px', fontSize: 15, fontWeight: 700, width: 180 }} />
                : <h3 style={{ margin: 0, color: '#161a2e', fontSize: 16, fontWeight: 700 }}>{lead.name}</h3>
              }
              <StatusBadge status={current.status} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {editing
              ? <button onClick={saveEdit} style={actionBtn('#16a34a')}><Check size={14} /></button>
              : <button onClick={() => setEditing(true)} style={actionBtn('#6366f1')}><Pencil size={14} /></button>
            }
            <button onClick={onClose} style={closeBtn}><X size={14} /></button>
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
              <a href={`mailto:${current.email}`} onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 10, textDecoration: 'none', background: 'rgba(99,102,241,0.10)', color: '#4f46e5', fontWeight: 700, fontSize: 12, border: 'none' }}>
                <Mail size={14} /> Email
              </a>
            )}
            <button onClick={() => { if (window.confirm('Supprimer ce lead ?')) { onDelete(lead.id); onClose(); } }} style={{ ...actionBtn('#dc2626'), marginLeft: 'auto' }}>
              <Trash2 size={14} />
            </button>
          </div>

          <Section title="Informations">
            <Field icon={<Phone size={13} />} label="Téléphone" value={current.phone} editing={editing} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            {!editing && current.phone && !isValidPhone(current.phone) && (
              <p style={{ margin: '-4px 0 10px', fontSize: 12, color: '#b45309', lineHeight: 1.4 }}>⚠ {checkPhone(current.phone).reason}. Modifiez la fiche pour la corriger.</p>
            )}
            <Field icon={<Mail size={13} />} label="Email" value={current.email} editing={editing} onChange={v => setForm(f => ({ ...f, email: v }))} />
            <Field icon={<Building2 size={13} />} label="Entreprise" value={current.company} editing={editing} onChange={v => setForm(f => ({ ...f, company: v }))} />
            <Field icon={<Globe size={13} />} label="Source" value={SOURCES.find(s => s.id === current.source)?.label || current.source} valueRaw={current.source} editing={editing} type="select" options={SOURCES} onChange={v => setForm(f => ({ ...f, source: v }))} />
          </Section>

          <Section title="Statut">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATUSES.map(s => (
                <button key={s.id} onClick={() => editing ? setForm(f => ({ ...f, status: s.id })) : handleStatusChange(s.id)} style={{
                  padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
                  border: `1px solid ${(editing ? form : lead).status === s.id ? s.color : '#e6e8f0'}`,
                  background: (editing ? form : lead).status === s.id ? s.bg : 'transparent',
                  color: (editing ? form : lead).status === s.id ? s.color : '#6b7280',
                  fontSize: 12, fontWeight: 600,
                }}>{s.label}</button>
              ))}
            </div>
          </Section>

          <Section title="Tags">
            <TagChips tags={lead.tags || []} onRemove={removeTag} />
            <div style={{ display: 'flex', gap: 8, marginTop: (lead.tags?.length ? 10 : 0) }}>
              {/* [TG2] list="crm-tags-list" : autocomplétion avec les tags existants */}
              <input list="crm-tags-list" value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Ajouter un tag (ex: vip, urgent)..." className="crm-field-light" style={{ ...inpModal, flex: 1 }} onKeyDown={e => e.key === 'Enter' && addTag()} />
              {/* [TG6] fonction fléchée : sans elle, l'événement de clic serait pris pour le tag */}
              <button onClick={() => addTag()} style={{ ...actionBtn('#6366f1'), padding: '0 14px', borderRadius: 10, width: 'auto' }}><Plus size={14} /></button>
            </div>
            {tagSuggestions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                <span style={{ color: '#9095a5', fontSize: 11 }}>Existants :</span>
                {tagSuggestions.map(t => (
                  <button key={t} onClick={() => addTag(t)} style={{ padding: '3px 9px', borderRadius: 99, cursor: 'pointer', border: `1px dashed ${tagColor(t)}66`, background: 'transparent', color: tagColor(t), fontSize: 10.5, fontWeight: 600 }}>
                    + #{t}
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section title="Score commercial">
            <ScoreBar score={editing ? form.score : (lead.score ?? 0)} onChange={editing ? v => setForm(f => ({ ...f, score: v })) : null} />
          </Section>

          {/* [C8a] En édition, le champ texte apparaît même sans note existante */}
          <Section title="Notes">
            {editing ? (
              <textarea value={form.notes || ''} rows={3}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="crm-field-light" style={{ ...inpModal, resize: 'none' }} />
            ) : current.notes ? (
              <p style={{ margin: '0 0 8px', color: '#454b5a', fontSize: 13, lineHeight: 1.6 }}>
                {current.notes}
              </p>
            ) : null}
            {!editing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ajouter une note..." className="crm-field-light" style={{ ...inpModal, flex: 1 }} onKeyDown={e => e.key === 'Enter' && addNote()} />
                <button onClick={addNote} style={{ ...actionBtn('#6366f1'), padding: '0 14px', borderRadius: 10, width: 'auto' }}><Plus size={14} /></button>
              </div>
            )}
          </Section>

          <Section title="Tâches">
            {/* [R2] Relance en un clic */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ color: '#9095a5', fontSize: 11 }}>Programmer une relance :</span>
              {[['Demain', 1], ['3 jours', 3], ['1 semaine', 7], ['2 semaines', 14]].map(([label, n]) => (
                <button key={n} onClick={() => scheduleFollowUp(n)} style={{ padding: '4px 10px', borderRadius: 99, cursor: 'pointer', border: '1px solid #c7d2fe', background: 'rgba(99,102,241,0.08)', color: '#4f46e5', fontSize: 11, fontWeight: 700 }}>
                  {label}
                </button>
              ))}
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => { if (e.target.value) { scheduleFollowUp(new Date(`${e.target.value}T09:00:00`)); e.target.value = ''; } }}
                title="Choisir une date"
                className="crm-field-light"
                style={{ ...inpModal, width: 'auto', padding: '4px 8px', fontSize: 11 }}
              />
            </div>
            <TasksCRMPanel key={taskKey} profileId={profileId || lead.profile_id} leadId={lead.id} compact />
          </Section>

          <Section title="Historique complet">
            {/* refreshKey : se recharge quand une note / un statut est ajouté (loadActivities) */}
            <ContactTimeline
              leadId={lead.id}
              createdAt={lead.created_at}
              refreshKey={`${activities.length}:${activities[0]?.id || ''}`}
            />
          </Section>
        </div>
      </motion.div>
    </motion.div>
  );
}

// [FIX2] Carte pipeline pilotée par Pointer Events (souris + tactile).
// [FIX8] Poignée de drag visible. [T1] Carte blanche.
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

  const handlePointerCancel = () => {
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
        background: '#ffffff', border: '1px solid #e6e8f0', borderRadius: 10,
        boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
        padding: '10px 11px', cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', flexDirection: 'column', gap: 8,
        touchAction: 'none', userSelect: 'none',
        opacity: isDragging ? 0.45 : 1, transition: 'opacity .1s, border-color .15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${sc}44, ${sc}22)`, border: `1.5px solid ${sc}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: sc }}>
          {(lead.name || '?')[0].toUpperCase()}
        </div>
        <span style={{ color: '#161a2e', fontSize: 12.5, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</span>
        <GripVertical size={13} color="#c3c8d6" style={{ flexShrink: 0 }} />
      </div>
      {(lead.phone || lead.company) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {lead.phone && <span style={{ color: '#8a90a2', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={9} /> {lead.phone}{!isValidPhone(lead.phone) && <span title="Numéro à vérifier" style={{ color: '#f59e0b' }}>⚠</span>}</span>}
          {lead.company && <span style={{ color: '#8a90a2', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={9} /> {lead.company}</span>}
        </div>
      )}
      {!!lead.tags?.length && <TagChips tags={lead.tags} size="small" />}
      <div style={{ height: 3, background: '#eef0f5', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${lead.score || 0}%`, background: sc, borderRadius: 99 }} />
      </div>
    </div>
  );
}

// [FIX8] Colonnes toujours visibles, badge de comptage, état vide, scroll interne.
// [T1] Colonnes blanches.
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

  // [FIX2] Colonne survolée via elementFromPoint (souris ou doigt).
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

  const columnWidth = isTablet ? 260 : 230;

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
      {STATUSES.map(status => {
        const count = grouped[status.id].length;
        const isOver = overColumn === status.id;
        const StatusIcon = status.icon;
        return (
          <div key={status.id}
            data-status-col={status.id}
            style={{
              minWidth: columnWidth, width: columnWidth, flexShrink: 0,
              background: isOver ? `${status.color}14` : '#ffffff',
              border: `1px solid ${isOver ? status.color + '66' : '#e6e8f0'}`,
              borderRadius: 14, padding: 8, transition: 'background .12s, border-color .12s',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px 10px', flexShrink: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
              <span style={{ color: status.color, fontSize: 12, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{status.label}</span>
              <span style={{ color: count > 0 ? status.color : '#a2a7b5', fontSize: 11, fontWeight: 700, background: count > 0 ? `${status.color}22` : '#eef0f5', borderRadius: 99, padding: '1px 7px', flexShrink: 0 }}>{count}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 480, minHeight: 60, paddingRight: 2 }}>
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
              {count === 0 && (
                <div style={{ textAlign: 'center', padding: '26px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <StatusIcon size={19} color="#c3c8d6" />
                  <span style={{ color: '#a2a7b5', fontSize: 11 }}>Aucun lead ici</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// [G3] Carte compacte pour la vue liste en grille. [T1] Carte blanche.
function LeadGridCard({ lead, isSelected, onToggleSelect, onOpen, canHover }) {
  const { color: sc } = scoreLabel(lead.score || 0);
  return (
    <motion.div
      layout onClick={onOpen}
      {...(canHover ? { whileHover: { background: isSelected ? 'rgba(99,102,241,0.1)' : '#f6f7fb' } } : {})}
      style={{
        display: 'flex', flexDirection: 'column', gap: 10, padding: 14,
        background: isSelected ? 'rgba(99,102,241,0.06)' : '#ffffff',
        border: `1px solid ${isSelected ? 'rgba(99,102,241,0.35)' : '#e6e8f0'}`,
        borderRadius: 14, cursor: 'pointer', transition: 'border-color .15s, background .15s', minWidth: 0,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Checkbox checked={isSelected} onChange={onToggleSelect} />
        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${sc}44, ${sc}22)`, border: `2px solid ${sc}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: sc }}>
          {(lead.name || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#161a2e', fontSize: 13.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
          <div style={{ marginTop: 4 }}><StatusBadge status={lead.status} /></div>
        </div>
      </div>

      {(lead.phone || lead.company) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {lead.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8a90a2', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><Phone size={10} /> {lead.phone}{!isValidPhone(lead.phone) && <span title="Numéro à vérifier" style={{ color: '#f59e0b' }}>⚠</span>}</span>}
          {lead.company && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8a90a2', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><Building2 size={10} /> {lead.company}</span>}
        </div>
      )}

      {!!lead.tags?.length && <TagChips tags={lead.tags} size="small" />}

      <ScoreBar score={lead.score || 0} />

      <div onClick={e => e.stopPropagation()}>
        <WhatsAppBtn phone={lead.phone} leadId={lead.id}
          onContact={async (id) => { await supabase.from('lead_activities').insert([{ lead_id: id, type: 'whatsapp', description: 'Contact WhatsApp effectué' }]); }} />
      </div>
    </motion.div>
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
  const [newLeadTag, setNewLeadTag]     = useState('');   // [TG3]
  const [adding, setAdding]             = useState(false);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [bulkStatus, setBulkStatus]     = useState('');
  const [bulkTagInput, setBulkTagInput] = useState('');   // [TG4]
  const [page, setPage]                 = useState(1); // [G1]
  const [followRefresh, setFollowRefresh] = useState(0); // [R1] recharge « À relancer »
  // [FIX6] Détecté une seule fois (appareils tactiles : pas de hover collé).
  const [canHover] = useState(() => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches);

  // [C4][C6] Spinner uniquement au premier chargement ; `silent` pour les rechargements.
  const loadLeads = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try { setLeads(await fetchAllLeads(profileId)); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // [C4] Realtime : chaque événement met à jour l'état localement.
  useEffect(() => {
    if (!profileId) return;
    loadLeads();
    const channel = supabase
      .channel(`leads-${profileId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `profile_id=eq.${profileId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => prev.some(l => l.id === payload.new.id) ? prev : [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(l => l.id === payload.new.id ? { ...l, ...payload.new } : l));
            setSelectedLead(cur => cur && cur.id === payload.new.id ? { ...cur, ...payload.new } : cur);
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(l => l.id !== payload.old.id));
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  // [G5] Reset sélection + page au changement de vue/filtre/tag/recherche.
  useEffect(() => { setSelectedIds(new Set()); setBulkStatus(''); setBulkTagInput(''); setPage(1); }, [view, filter, tagFilter, search]);

  // [TG3] Ajout d'un tag dans la modale « Nouveau lead » (immuable)
  const addNewLeadTag = () => {
    const tag = normalizeTag(newLeadTag);
    if (!tag) return;
    setNewLead(p => (p.tags || []).includes(tag) ? p : { ...p, tags: [...(p.tags || []), tag] });
    setNewLeadTag('');
  };

  // ── [A4] Ajout d'un lead avec déclencheur automatisation ─────────
  const addLead = async () => {
    if (!newLead.name.trim()) { toast.error('Nom requis'); return; }
    if (newLead.phone?.trim() && !checkPhone(newLead.phone).ok) { toast.error(checkPhone(newLead.phone).reason); return; }
    setAdding(true);
    // Contrôle client (retour immédiat) — la base fait foi (index unique).
    const exists = leads.find(l => normalizePhone(l.phone) === normalizePhone(newLead.phone) && normalizePhone(newLead.phone).length > 0);
    if (exists) { toast.error('Ce numéro existe déjà'); setAdding(false); return; }
    // [C2] doublon renvoyé par la base (23505)
    // [TG3] un tag saisi mais pas encore validé (Entrée/+) est pris en compte
    const pendingTag = normalizeTag(newLeadTag);
    const tags = pendingTag && !(newLead.tags || []).includes(pendingTag)
      ? [...(newLead.tags || []), pendingTag]
      : (newLead.tags || []);
    const { data, error } = await supabase.from('leads')
      .insert([{ ...newLead, tags, profile_id: profileId, score: 0 }]).select().single();
    if (error) {
      toast.error(error.code === '23505' ? 'Ce numéro existe déjà' : error.message);
      setAdding(false); return;
    }
    await supabase.from('lead_activities').insert([{ lead_id: data.id, type: 'created', description: 'Lead créé' }]);

    // [A4] Automatisations new_lead (fire-and-forget)
    triggerNewLead(profileId, {
      leadId: data.id,    // évite qu'une action create_lead crée un doublon
      name:   data.name,
      email:  data.email,
      phone:  data.phone,
      source: data.source,
    });

    // [A8][TG3] lead_tagged pour chaque tag posé à la création
    (data.tags || []).forEach(tag => triggerLeadTagged(profileId, {
      leadId: data.id, leadName: data.name, tag,
    }));

    setLeads(p => p.some(l => l.id === data.id) ? p : [data, ...p]);
    setNewLead({ ...EMPTY_LEAD });
    setNewLeadTag('');
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

  // [C3] Action groupée : ne traite que les leads dont le statut change,
  // rollback en cas d'erreur, un déclenchement + une ligne d'historique par lead.
  const bulkChangeStatus = async (newStatus) => {
    if (!newStatus) return;
    const targets = leads.filter(l => selectedIds.has(l.id) && l.status !== newStatus);
    if (!targets.length) { setBulkStatus(''); return; }
    const ids = targets.map(l => l.id);
    const previous = new Map(targets.map(l => [l.id, l.status]));
    const label = STATUSES.find(s => s.id === newStatus)?.label || newStatus;

    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: newStatus } : l));
    const { error } = await supabase.from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() }).in('id', ids);
    if (error) { toast.error(error.message); loadLeads({ silent: true }); return; }

    await supabase.from('lead_activities').insert(ids.map(id => ({
      lead_id: id, type: 'status', description: `Statut → ${label} (action groupée)`,
    })));

    // [A7] un déclenchement par lead modifié
    targets.forEach(l => triggerLeadStatusChanged(profileId, {
      leadId: l.id, leadName: l.name, oldStatus: previous.get(l.id), newStatus,
    }));

    setSelectedIds(new Set());
    setBulkStatus('');
    toast.success(`${ids.length} lead${ids.length > 1 ? 's' : ''} mis à jour`);
  };

  // [TG4] Action groupée : ajouter ou retirer un tag sur la sélection.
  // Ne traite que les leads concernés, mise à jour optimiste, rechargement
  // silencieux en cas d'erreur, lead_tagged déclenché à l'ajout (comme [A8]).
  const bulkTag = async (mode) => {
    const tag = normalizeTag(bulkTagInput);
    if (!tag) { toast.error('Saisissez un tag'); return; }
    const targets = leads.filter(l =>
      selectedIds.has(l.id) && (l.tags || []).includes(tag) === (mode === 'remove'));
    if (!targets.length) {
      toast.info(mode === 'add' ? 'Tous les leads ont déjà ce tag' : 'Aucun lead sélectionné n\'a ce tag');
      return;
    }
    const nextTags = new Map(targets.map(l => [
      l.id,
      mode === 'add' ? [...(l.tags || []), tag] : (l.tags || []).filter(t => t !== tag),
    ]));

    setLeads(prev => prev.map(l => nextTags.has(l.id) ? { ...l, tags: nextTags.get(l.id) } : l));
    const results = await Promise.all(targets.map(l =>
      supabase.from('leads').update({ tags: nextTags.get(l.id) }).eq('id', l.id)));
    const failed = results.find(r => r.error);
    if (failed) { toast.error(failed.error.message); loadLeads({ silent: true }); return; }

    if (mode === 'add') targets.forEach(l => triggerLeadTagged(profileId, {
      leadId: l.id, leadName: l.name, tag,
    }));

    setBulkTagInput('');
    toast.success(`#${tag} ${mode === 'add' ? 'ajouté à' : 'retiré de'} ${targets.length} lead${targets.length > 1 ? 's' : ''}`);
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
    // [C7] csvCell neutralise l'injection de formules
    return [headers, ...data].map(r => r.map(csvCell).join(',')).join('\n');
  };

  // [TG5] Téléchargement mutualisé (export complet, sélection, segment)
  const downloadCSV = (rows, name) => {
    const blob = new Blob(['\uFEFF' + buildCSV(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!leads.length) { toast.error('Aucun lead à exporter'); return; }
    downloadCSV(leads, 'leads');
  };

  const exportSelectedCSV = () => {
    const selected = leads.filter(l => selectedIds.has(l.id)); if (!selected.length) return;
    downloadCSV(selected, 'leads-selection');
  };

  // [TG5] Export du segment affiché (tag actif + filtres en cours)
  const exportSegmentCSV = () => {
    if (!filteredLeads.length) { toast.error('Aucun lead à exporter'); return; }
    downloadCSV(filteredLeads, `leads-${tagFilter || 'segment'}`);
  };

  // [TG5] Compteurs par tag, tags triés par fréquence puis alphabétique
  const tagCounts = useMemo(() => {
    const m = new Map();
    leads.forEach(l => (l.tags || []).forEach(t => m.set(t, (m.get(t) || 0) + 1)));
    return m;
  }, [leads]);
  const allTags = useMemo(
    () => [...tagCounts.keys()].sort((a, b) => (tagCounts.get(b) - tagCounts.get(a)) || a.localeCompare(b)),
    [tagCounts]
  );

  const filteredLeads = leads.filter(l => {
    const matchesFilter = filter === 'all'
      || (filter === 'phone_check' ? (!!l.phone && !isValidPhone(l.phone)) : l.status === filter);
    const matchesTag = !tagFilter || (l.tags || []).includes(tagFilter);
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || l.name?.toLowerCase().includes(q) || l.phone?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q) || (l.tags || []).some(t => t.toLowerCase().includes(q));
    return matchesFilter && matchesTag && matchesSearch;
  });

  const invalidPhoneCount = leads.filter(l => l.phone && !isValidPhone(l.phone)).length;
  const statusCounts = STATUSES.reduce((acc, s) => { acc[s.id] = leads.filter(l => l.status === s.id).length; return acc; }, {});
  const allSelected  = filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.has(l.id));
  const someSelected = filteredLeads.some(l => selectedIds.has(l.id));
  const toggleSelectAll = () => { if (allSelected) { setSelectedIds(new Set()); } else { setSelectedIds(new Set(filteredLeads.map(l => l.id))); } };

  // [G1] Pagination : 16 leads (4x4) par page
  const totalPages     = Math.max(1, Math.ceil(filteredLeads.length / LEADS_PAGE_SIZE));
  const paginatedLeads  = filteredLeads.slice((page - 1) * LEADS_PAGE_SIZE, page * LEADS_PAGE_SIZE);

  // [G5] Garde-fou si la page courante n'existe plus.
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  // [TG5] Si le tag filtré n'existe plus (retiré de tous les leads), on réinitialise le filtre.
  useEffect(() => {
    if (tagFilter && !tagCounts.has(tagFilter)) setTagFilter(null);
  }, [tagFilter, tagCounts]);

  if (!profileId) return <div style={{ padding: 40, textAlign: 'center', color: '#a2a7b5', fontSize: 13 }}>Sélectionnez un profil pour gérer vos leads.</div>;

  // Style commun aux petits boutons de la barre d'actions groupées
  const bulkBtn = { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid #e6e8f0', background: '#f6f7fb', color: '#6b7280', fontSize: 11, fontWeight: 600, cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* [FIX4] crm-modal : 90vh puis 90dvh.
          [T2] crm-field-light : champs clairs (recherche + modales), halo indigo au focus. */}
      <style>{`
        .crm-modal{max-height:90vh;max-height:90dvh;}
        .crm-field-light:focus{border-color:#8b5cf6!important;background:#ffffff!important;box-shadow:0 0 0 3px rgba(99,102,241,0.12);}
        .crm-field-light::placeholder{color:#a2a7b5;}
      `}</style>

      {/* [TG2] Autocomplétion des tags existants (fiche, création, actions groupées) */}
      <datalist id="crm-tags-list">
        {allTags.map(t => <option key={t} value={t} />)}
      </datalist>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ color: '#161a2e', fontSize: 16, fontWeight: 800, margin: 0 }}>Leads CRM</h3>
          <p style={{ color: '#8a90a2', fontSize: 12, margin: '4px 0 0' }}>{leads.length} lead{leads.length !== 1 ? 's' : ''} au total</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f6f7fb', border: '1px solid #e6e8f0', borderRadius: 12, padding: 3 }}>
            <button onClick={() => setView('list')} title="Vue liste" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 9, border: 'none', background: view === 'list' ? '#ffffff' : 'transparent', boxShadow: view === 'list' ? '0 1px 3px rgba(15,23,42,0.1)' : 'none', color: view === 'list' ? '#4f46e5' : '#8a90a2', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <List size={13} /> {(!isMobile || isTablet) && 'Liste'}
            </button>
            <button onClick={() => setView('pipeline')} title="Vue pipeline" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 9, border: 'none', background: view === 'pipeline' ? '#ffffff' : 'transparent', boxShadow: view === 'pipeline' ? '0 1px 3px rgba(15,23,42,0.1)' : 'none', color: view === 'pipeline' ? '#4f46e5' : '#8a90a2', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <Columns3 size={13} /> {(!isMobile || isTablet) && 'Pipeline'}
            </button>
          </div>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#f6f7fb', border: '1px solid #e6e8f0', borderRadius: 12, color: '#454b5a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={13} /> {isMobile && !isTablet ? '' : 'Exporter CSV'}
          </button>
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <UserPlus size={13} /> {isMobile ? 'Ajouter' : 'Ajouter un lead'}
          </button>
        </div>
      </div>

      {/* [R1] À relancer : en retard / aujourd'hui / à venir */}
      <FollowUpsPanel
        profileId={profileId}
        leads={leads}
        onOpenLead={setSelectedLead}
        refreshKey={followRefresh}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="#9095a5" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un lead (nom, téléphone, email, entreprise, tag)..."
            className="crm-field-light" style={{ ...inp, paddingLeft: 38 }} />
        </div>

        {view === 'list' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setFilter('all')} style={{ padding: '6px 12px', borderRadius: 99, cursor: 'pointer', border: `1px solid ${filter === 'all' ? '#6366f1' : '#dde0ea'}`, background: filter === 'all' ? 'rgba(99,102,241,0.12)' : 'transparent', color: filter === 'all' ? '#4f46e5' : '#6b7280', fontSize: 12, fontWeight: 600 }}>
              Tous ({leads.length})
            </button>
            {STATUSES.map(s => (
              <button key={s.id} onClick={() => setFilter(s.id)} style={{ padding: '6px 12px', borderRadius: 99, cursor: 'pointer', border: `1px solid ${filter === s.id ? s.color : '#dde0ea'}`, background: filter === s.id ? s.bg : 'transparent', color: filter === s.id ? s.color : '#6b7280', fontSize: 12, fontWeight: 600 }}>
                {s.label} ({statusCounts[s.id] || 0})
              </button>
            ))}
            {invalidPhoneCount > 0 && (
              <button onClick={() => setFilter('phone_check')} title="Leads dont le numéro est incomplet ou invalide" style={{ padding: '6px 12px', borderRadius: 99, cursor: 'pointer', border: `1px solid ${filter === 'phone_check' ? '#f59e0b' : '#dde0ea'}`, background: filter === 'phone_check' ? 'rgba(245,158,11,0.12)' : 'transparent', color: filter === 'phone_check' ? '#b45309' : '#6b7280', fontSize: 12, fontWeight: 600 }}>
                ⚠ N° à vérifier ({invalidPhoneCount})
              </button>
            )}
          </div>
        )}

        {allTags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ color: '#9095a5', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><TagIcon size={11} /> Tags :</span>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setTagFilter(prev => prev === tag ? null : tag)} style={{ padding: '3px 9px', borderRadius: 99, cursor: 'pointer', border: `1px solid ${tagFilter === tag ? tagColor(tag) : '#dde0ea'}`, background: tagFilter === tag ? `${tagColor(tag)}22` : 'transparent', color: tagFilter === tag ? tagColor(tag) : '#8a90a2', fontSize: 10.5, fontWeight: 600 }}>
                #{tag} <span style={{ opacity: 0.7 }}>({tagCounts.get(tag)})</span>
              </button>
            ))}
            {/* [TG5] Effacer le filtre + exporter le segment affiché */}
            {tagFilter && (
              <>
                <button onClick={() => setTagFilter(null)} style={{ ...bulkBtn, padding: '3px 9px', borderRadius: 99, fontSize: 10.5 }}>
                  <X size={10} /> Effacer
                </button>
                <button onClick={exportSegmentCSV} style={{ ...bulkBtn, padding: '3px 9px', borderRadius: 99, fontSize: 10.5 }}>
                  <Download size={10} /> Exporter #{tagFilter} ({filteredLeads.length})
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedIds.size > 0 && view === 'list' && (
          <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -6, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14 }}>
              <span style={{ background: 'rgba(99,102,241,0.16)', color: '#4338ca', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
              </span>
              <button onClick={() => setSelectedIds(new Set())} style={bulkBtn}>
                <X size={11} /> Désélectionner
              </button>
              <select value={bulkStatus} onChange={e => { setBulkStatus(e.target.value); bulkChangeStatus(e.target.value); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e6e8f0', background: '#ffffff', color: '#454b5a', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                <option value="">Changer le statut…</option>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>

              {/* [TG4] Tags en action groupée */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input list="crm-tags-list" value={bulkTagInput} onChange={e => setBulkTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && bulkTag('add')}
                  placeholder="Tag…" maxLength={30}
                  style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e6e8f0', background: '#ffffff', color: '#454b5a', fontSize: 11, fontWeight: 600, outline: 'none', width: 110 }} />
                <button onClick={() => bulkTag('add')} style={bulkBtn} title="Ajouter ce tag à la sélection">
                  <Plus size={11} /> Tag
                </button>
                <button onClick={() => bulkTag('remove')} style={bulkBtn} title="Retirer ce tag de la sélection">
                  − Tag
                </button>
              </div>

              <button onClick={exportSelectedCSV} style={bulkBtn}>
                <Download size={11} /> CSV
              </button>
              <button onClick={bulkDelete} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
                <Trash2 size={11} /> Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {view === 'pipeline' && (
        loading
          ? <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={20} color="#a2a7b5" className="animate-spin" /></div>
          : <PipelineView leads={filteredLeads} onCardClick={setSelectedLead} onStatusChange={handlePipelineStatusChange} />
      )}

      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={20} color="#a2a7b5" className="animate-spin" /></div>
          ) : filteredLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#a2a7b5', fontSize: 13 }}>
              {leads.length === 0 ? 'Aucun lead pour le moment.' : 'Aucun lead ne correspond à votre recherche.'}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 16px', color: '#8a90a2', fontSize: 11 }}>
                <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleSelectAll} />
                <span style={{ cursor: 'pointer', userSelect: 'none' }} onClick={toggleSelectAll}>
                  {allSelected ? 'Tout désélectionner' : `Tout sélectionner (${filteredLeads.length})`}
                </span>
                {totalPages > 1 && (
                  <span style={{ marginLeft: 'auto', color: '#a2a7b5' }}>
                    Page {page}/{totalPages} — {filteredLeads.length} lead{filteredLeads.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* [G1][G3][G4] Grille de cartes — 16 leads/page */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {paginatedLeads.map(lead => (
                  <LeadGridCard
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedIds.has(lead.id)}
                    onToggleSelect={() => toggleSelect(lead.id)}
                    onOpen={() => setSelectedLead(lead)}
                    canHover={canHover}
                  />
                ))}
              </div>

              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="crm-modal"
              style={{ width: '100%', maxWidth: isTablet ? 540 : 420, background: '#ffffff', border: '1px solid #e6e8f0', boxShadow: '0 30px 80px rgba(15,23,42,0.25)', borderRadius: 20, padding: isTablet ? 28 : 24, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ color: '#161a2e', fontSize: 16, fontWeight: 800, margin: 0 }}>Nouveau lead</h3>
                <button onClick={() => setShowAdd(false)} style={closeBtn}><X size={14} /></button>
              </div>
              {[
                { key: 'name',    label: 'Nom *',      ph: 'Nom complet'         },
                { key: 'phone',   label: 'Téléphone',  ph: 'Ex: 0700000000'      },
                { key: 'email',   label: 'Email',       ph: 'email@exemple.com'   },
                { key: 'company', label: 'Entreprise',  ph: "Nom de l'entreprise" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input value={newLead[f.key]} onChange={e => setNewLead(p => ({ ...p, [f.key]: e.target.value }))} className="crm-field-light" style={inpModal} placeholder={f.ph} />
                </div>
              ))}
              <div>
                <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Source</label>
                <select value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))} className="crm-field-light" style={inpModal}>
                  {SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              {/* [TG3] Tags à la création */}
              <div>
                <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tags</label>
                <TagChips tags={newLead.tags || []} onRemove={t => setNewLead(p => ({ ...p, tags: (p.tags || []).filter(x => x !== t) }))} />
                <div style={{ display: 'flex', gap: 8, marginTop: (newLead.tags?.length ? 8 : 0) }}>
                  <input list="crm-tags-list" value={newLeadTag} onChange={e => setNewLeadTag(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewLeadTag(); } }}
                    className="crm-field-light" style={{ ...inpModal, flex: 1 }} placeholder="Ex: vip, urgent" maxLength={30} />
                  <button type="button" onClick={addNewLeadTag} style={{ ...actionBtn('#6366f1'), padding: '0 14px', borderRadius: 10, width: 'auto' }}><Plus size={14} /></button>
                </div>
              </div>

              <div>
                <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Notes</label>
                <textarea value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} rows={3} className="crm-field-light" style={{ ...inpModal, resize: 'none' }} placeholder="Notes additionnelles..." />
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
          <LeadModal lead={selectedLead} profileId={profileId} allTags={allTags} onClose={() => { setSelectedLead(null); setFollowRefresh(k => k + 1); }}
            onTaskCreated={() => setFollowRefresh(k => k + 1)}
            onUpdate={updated => { updateLeadLocal(updated); setSelectedLead(updated); }}
            onDelete={deleteLead} />
        )}
      </AnimatePresence>
    </div>
  );
}