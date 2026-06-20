import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Trash2, Mail, Phone, UserPlus,
  Loader2, Download, X,
  MessageCircle, Building2, Tag,
  Pencil, Check,
  Globe, LayoutList, Columns3,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';

// ─── Constants ───────────────────────────────────────────────────
const STATUSES = [
  { id: 'prospect', label: 'Prospect',   color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  { id: 'chaud',     label: '🔥 Chaud',   color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  { id: 'client',   label: '✅ Client',  color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  { id: 'froid',    label: '❄️ Froid',   color: '#06b6d4', bg: 'rgba(6,182,212,0.15)'  },
  { id: 'perdu',    label: 'Perdu',      color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
];

const SOURCES = [
  { id: 'manuel',         label: 'Manuel'             },
  { id: 'qrcode',         label: 'QR Code'            },
  { id: 'socialapp',      label: 'Profil SocialApp'   },
  { id: 'rsvp',           label: 'RSVP'               },
  { id: 'marketplace',    label: 'Marketplace'        },
  { id: 'formulaire',     label: 'Formulaire'         },
  { id: 'automatisation', label: '🤖 Automatisation'  },
  { id: 'calendrier',     label: '📅 Calendly / RDV'  },
];

const ACTIVITY_ICONS = {
  created:  '🆕',
  edited:   '✏️',
  note:     '📝',
  whatsapp: '💬',
  status:   '🔄',
};

// Normalise un numéro pour comparaison (retire tout sauf les chiffres)
const normalizePhone = (phone = '') => phone.replace(/\D/g, '');

const EMPTY_LEAD = {
  name: '',
  phone: '',
  email: '',
  company: '',
  status: 'prospect',
  source: 'manuel',
  notes: '',
  score: 0,
};

// Score helpers
const scoreLabel = (s) =>
  s <= 30  ? { label: 'Froid',  color: '#06b6d4', icon: '❄️'  } :
  s <= 60  ? { label: 'Tiède',  color: '#f59e0b', icon: '🌡️'  } :
  s <= 80  ? { label: 'Chaud',  color: '#f97316', icon: '🔥'  } :
             { label: 'Brûlant',color: '#ef4444', icon: '🚀'  };

// Palette stable pour les tags (déterminée par hash du nom, pas aléatoire)
const TAG_COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#fb923c', '#22d3ee'];
function tagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// ─── Shared input style ──────────────────────────────────────────
const inp = {
  width: '100%', background: '#2f2f2f',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
  padding: '11px 13px', color: 'white', outline: 'none',
  fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit',
};

// ─── Sub-components ──────────────────────────────────────────────
function ScoreBar({ score, onChange }) {
  const { color, label, icon } = scoreLabel(score);
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Score prospect</span>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>{icon} {score} — {label}</span>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${score}%`, background: color,
          borderRadius: 99, transition: 'width .3s, background .3s',
        }} />
      </div>
      {onChange && (
        <input type="range" min={0} max={100} value={score}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '100%', marginTop: 6, accentColor: color, cursor: 'pointer' }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUSES.find(x => x.id === status) || STATUSES[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
      border: `1px solid ${s.color}44`,
    }}>{s.label}</span>
  );
}

function TagChip({ tag, onRemove, small = false }) {
  const color = tagColor(tag);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '1px 6px' : '3px 9px', borderRadius: 99,
      background: color + '1f', color, border: `1px solid ${color}44`,
      fontSize: small ? 9.5 : 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      #{tag}
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(tag); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color, display: 'flex', padding: 0, marginLeft: 1 }}>
          <X size={small ? 9 : 10} />
        </button>
      )}
    </span>
  );
}

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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: compact ? 0 : 6,
        height: compact ? 36 : 38, width: compact ? 36 : 'auto',
        padding: compact ? 0 : '0 14px',
        borderRadius: 10, border: 'none', cursor: hasPhone ? 'pointer' : 'not-allowed',
        background: hasPhone ? 'rgba(37,211,102,0.15)' : 'rgba(255,255,255,0.05)',
        color: hasPhone ? '#25d366' : 'rgba(255,255,255,0.2)',
        fontWeight: 700, fontSize: 12, transition: 'all .2s',
      }}
    >
      <MessageCircle size={14} />
      {!compact && 'WhatsApp'}
    </button>
  );
}

// ─── Lead Detail Modal ───────────────────────────────────────────
function LeadModal({ lead, onClose, onUpdate, onDelete, onContact }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({ ...lead, score: lead?.score ?? 50 }));
  const [note, setNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [activities, setActivities] = useState([]);
  const [loadingAct, setLoadingAct] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [lead.id]);

  const loadActivities = async () => {
    setLoadingAct(true);
    const { data } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false });
    setActivities(data || []);
    setLoadingAct(false);
  };

  const saveEdit = async () => {
    const { error } = await supabase.from('leads').update({
      name: form.name, phone: form.phone, email: form.email,
      company: form.company, status: form.status,
      source: form.source, notes: form.notes, score: form.score,
      updated_at: new Date().toISOString(),
    }).eq('id', lead.id);
    if (error) { toast.error(error.message); return; }

    await supabase.from('lead_activities').insert([{
      lead_id: lead.id, type: 'edited',
      description: 'Fiche modifiée',
    }]);
    const updatedLead = { ...lead, ...form };
    onUpdate(updatedLead);
    setEditing(false);
    toast.success('Lead mis à jour');
    loadActivities();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await supabase.from('lead_activities').insert([{
      lead_id: lead.id, type: 'note',
      description: note.trim(),
    }]);
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, height: '100vh',
          background: '#0f0f1a',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '20px 24px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%',
              background: `linear-gradient(135deg, ${sc}44, ${sc}22)`,
              border: `2px solid ${sc}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: sc,
            }}>
              {(current.name || '?')[0].toUpperCase()}
            </div>
            <div>
              {editing
                ? <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    style={{ ...inp, padding: '6px 10px', fontSize: 15, fontWeight: 700, width: 180 }} />
                : <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 700 }}>{lead.name}</h3>
              }
              <StatusBadge status={current.status} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {editing
              ? <button onClick={saveEdit} style={{ ...actionBtn('#22c55e') }}><Check size={14} /></button>
              : <button onClick={() => setEditing(true)} style={{ ...actionBtn('#6366f1') }}><Pencil size={14} /></button>
            }
            <button onClick={onClose} style={{ ...actionBtn('rgba(255,255,255,0.15)') }}><X size={14} /></button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <WhatsAppBtn phone={current.phone} leadId={lead.id} onContact={async (id) => {
              await supabase.from('lead_activities').insert([{
                lead_id: id, type: 'whatsapp', description: 'Contact WhatsApp effectué',
              }]);
              onContact && onContact();
              loadActivities();
            }} />
            {current.email && (
              <a href={`mailto:${current.email}`} onClick={e => e.stopPropagation()} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 38, padding: '0 14px', borderRadius: 10, textDecoration: 'none',
                background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                fontWeight: 700, fontSize: 12, border: 'none',
              }}>
                <Mail size={14} /> Email
              </a>
            )}
            <button onClick={() => { if (window.confirm('Supprimer ce lead ?')) { onDelete(lead.id); onClose(); } }}
              style={{ ...actionBtn('#ef4444'), marginLeft: 'auto' }}>
              <Trash2 size={14} />
            </button>
          </div>

          {/* Info fields */}
          <Section title="Informations">
            <Field icon={<Phone size={13} />} label="Téléphone"
              value={current.phone} editing={editing}
              onChange={v => setForm(f => ({ ...f, phone: v }))} />
            <Field icon={<Mail size={13} />} label="Email"
              value={current.email} editing={editing}
              onChange={v => setForm(f => ({ ...f, email: v }))} />
            <Field icon={<Building2 size={13} />} label="Entreprise"
              value={current.company} editing={editing}
              onChange={v => setForm(f => ({ ...f, company: v }))} />
            <Field icon={<Globe size={13} />} label="Source"
              value={SOURCES.find(s => s.id === current.source)?.label || current.source}
              valueRaw={current.source} editing={editing} type="select" options={SOURCES}
              onChange={v => setForm(f => ({ ...f, source: v }))} />
          </Section>

          {/* Status pills */}
          <Section title="Statut">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATUSES.map(s => (
                <button key={s.id} onClick={() => editing
                  ? setForm(f => ({ ...f, status: s.id }))
                  : handleStatusChange(s.id)
                } style={{
                  padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
                  border: `1px solid ${(editing ? form : lead).status === s.id ? s.color : 'rgba(255,255,255,0.08)'}`,
                  background: (editing ? form : lead).status === s.id ? s.bg : 'transparent',
                  color: (editing ? form : lead).status === s.id ? s.color : 'rgba(255,255,255,0.45)',
                  fontSize: 12, fontWeight: 600,
                }}>
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Tags */}
          <Section title="Tags">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {(lead.tags || []).length === 0 ? (
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Aucun tag</span>
              ) : (
                (lead.tags || []).map(tag => (
                  <TagChip key={tag} tag={tag} onRemove={removeTag} />
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newTag} onChange={e => setNewTag(e.target.value)}
                placeholder="Nouveau tag (ex: vip, urgent...)" style={{ ...inp, flex: 1 }}
                onKeyDown={e => e.key === 'Enter' && addTag()} />
              <button onClick={addTag} style={{ ...actionBtn('#6366f1'), padding: '0 14px', borderRadius: 10, width: 'auto' }}>
                <Plus size={14} />
              </button>
            </div>
          </Section>

          {/* Score */}
          <Section title="Score commercial">
            <ScoreBar score={editing ? form.score : (lead.score ?? 0)}
              onChange={editing ? v => setForm(f => ({ ...f, score: v })) : null} />
          </Section>

          {/* Notes */}
          <Section title="Notes">
            {current.notes && (
              <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>
                {editing
                  ? <textarea value={form.notes} rows={3}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      style={{ ...inp, resize: 'none' }} />
                  : current.notes
                }
              </p>
            )}
            {!editing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Ajouter une note..." style={{ ...inp, flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && addNote()} />
                <button onClick={addNote} style={{ ...actionBtn('#6366f1'), padding: '0 14px', borderRadius: 10, width: 'auto' }}>
                  <Plus size={14} />
                </button>
              </div>
            )}
          </Section>

          {/* Activity history */}
          <Section title="Historique">
            {loadingAct
              ? <div style={{ textAlign: 'center', padding: 20 }}><Loader2 size={16} color="rgba(255,255,255,0.3)" className="animate-spin" /></div>
              : activities.length === 0
              ? <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>Aucune activité</p>
              : activities.map((a) => (
                <div key={a.id} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                    {ACTIVITY_ICONS[a.type] || '📌'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{a.description}</p>
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

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h4 style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
        {title}
      </h4>
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
        <span style={{ color: value ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)', fontSize: 13 }}>
          {value || '—'}
        </span>
      )}
    </div>
  );
}

const actionBtn = (bg) => ({
  width: 36, height: 36, borderRadius: 10, border: 'none',
  background: typeof bg === 'string' && bg.startsWith('#') ? bg + '22' : bg,
  color: typeof bg === 'string' && bg.startsWith('#') ? bg : 'white',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
});

// ─── Responsive helper ───────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
};

// ─── Kanban : carte lead ──────────────────────────────────────────
function KanbanCard({ lead, onOpen, onDragStart, onDragEnd, isDragging }) {
  const { color: sc } = scoreLabel(lead.score || 0);
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(lead)}
      style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '10px 12px', cursor: 'grab', marginBottom: 8,
        opacity: isDragging ? 0.4 : 1, transition: 'opacity .15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${sc}44, ${sc}22)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: sc,
        }}>
          {(lead.name || '?')[0].toUpperCase()}
        </div>
        <span style={{ color: 'white', fontSize: 12.5, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.name}
        </span>
      </div>
      {lead.phone && (
        <p style={{ margin: '0 0 6px', color: 'rgba(255,255,255,0.4)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Phone size={10} /> {lead.phone}
        </p>
      )}
      {!!(lead.tags || []).length && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
          {(lead.tags || []).slice(0, 3).map(t => <TagChip key={t} tag={t} small />)}
        </div>
      )}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99, marginTop: 4 }}>
        <div style={{ height: '100%', width: `${lead.score || 0}%`, background: sc, borderRadius: 99 }} />
      </div>
    </div>
  );
}

// ─── Kanban : vue complète ────────────────────────────────────────
function KanbanView({ leads, onOpenLead, onStatusChange }) {
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => { setDraggedLead(null); setDragOverCol(null); };
  const handleDrop = (e, statusId) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedLead || draggedLead.status === statusId) return;
    onStatusChange(draggedLead, statusId);
    setDraggedLead(null);
  };

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
      {STATUSES.map(status => {
        const colLeads = leads.filter(l => l.status === status.id);
        const isOver = dragOverCol === status.id;
        return (
          <div
            key={status.id}
            onDragOver={e => { e.preventDefault(); setDragOverCol(status.id); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={e => handleDrop(e, status.id)}
            style={{
              minWidth: 240, width: 240, flexShrink: 0,
              background: isOver ? status.bg : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isOver ? status.color + '66' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 14, padding: 10, transition: 'all .12s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
              <span style={{ color: status.color, fontSize: 12, fontWeight: 700 }}>{status.label}</span>
              <span style={{ background: status.bg, color: status.color, borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                {colLeads.length}
              </span>
            </div>
            <div style={{ minHeight: 60 }}>
              {colLeads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>
                  Aucun lead
                </div>
              ) : (
                colLeads.map(lead => (
                  <KanbanCard key={lead.id} lead={lead} onOpen={onOpenLead}
                    onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                    isDragging={draggedLead?.id === lead.id} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeadsCRMPanel({ profileId }) {
  const isMobile = useIsMobile();
  const [leads, setLeads]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [tagFilter, setTagFilter]       = useState(null);
  const [search, setSearch]             = useState('');
  const [viewMode, setViewMode]         = useState('list'); // 'list' | 'kanban'
  const [showAdd, setShowAdd]           = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [newLead, setNewLead]           = useState({ ...EMPTY_LEAD });
  const [adding, setAdding]             = useState(false);

  useEffect(() => {
    if (!profileId) return;
    loadLeads();
    const channel = supabase
      .channel(`leads-${profileId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'leads',
        filter: `profile_id=eq.${profileId}`,
      }, () => { loadLeads(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  const loadLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads').select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setLeads(data || []);
    setLoading(false);
  };

  const addLead = async () => {
    if (!newLead.name.trim()) { toast.error('Nom requis'); return; }
    setAdding(true);
    const exists = leads.find(
      l => normalizePhone(l.phone) === normalizePhone(newLead.phone) &&
           normalizePhone(newLead.phone).length > 0
    );
    if (exists) { toast.error('Ce numéro existe déjà'); setAdding(false); return; }
    const { data, error } = await supabase.from('leads')
      .insert([{
        ...newLead,
        profile_id: profileId,
        score: 0,           // ← forcé à 0, quoi qu'il arrive
      }])
      .select().maybeSingle();
    if (error) { toast.error(error.message); setAdding(false); return; }
    await supabase.from('lead_activities').insert([{
      lead_id: data.id, type: 'created', description: 'Lead créé',
    }]);
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

  const updateLeadLocal = (updated) => {
    setLeads(prev => prev.map(l => (l.id === updated.id ? updated : l)));
  };

  // Changement de statut depuis le Kanban (drag & drop)
  const handleKanbanStatusChange = async (lead, newStatus) => {
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
    const { error } = await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', lead.id);
    if (error) {
      toast.error(error.message);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: lead.status } : l));
      return;
    }
    await supabase.from('lead_activities').insert([{
      lead_id: lead.id, type: 'status',
      description: `Statut → ${STATUSES.find(s => s.id === newStatus)?.label || newStatus}`,
    }]);
    toast.success(`${lead.name} → ${STATUSES.find(s => s.id === newStatus)?.label}`);
  };

  const exportCSV = () => {
    if (leads.length === 0) { toast.error('Aucun lead à exporter'); return; }
    const headers = ['Nom', 'Téléphone', 'Email', 'Entreprise', 'Statut', 'Source', 'Score', 'Tags', 'Notes', 'Créé le'];
    const rows = leads.map(l => [
      l.name || '', l.phone || '', l.email || '', l.company || '',
      STATUSES.find(s => s.id === l.status)?.label || l.status,
      SOURCES.find(s => s.id === l.source)?.label || l.source,
      l.score ?? '', (l.tags || []).join('; '), (l.notes || '').replace(/\n/g, ' '),
      l.created_at ? new Date(l.created_at).toLocaleDateString('fr-FR') : '',
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Tags uniques présents sur l'ensemble des leads (pour la barre de filtre)
  const allTags = Array.from(new Set(leads.flatMap(l => l.tags || []))).sort();

  const filteredLeads = leads.filter(l => {
    const matchesFilter = filter === 'all' || l.status === filter;
    const matchesTag = !tagFilter || (l.tags || []).includes(tagFilter);
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      l.name?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.company?.toLowerCase().includes(q);
    return matchesFilter && matchesTag && matchesSearch;
  });

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s.id] = leads.filter(l => l.status === s.id).length;
    return acc;
  }, {});

  if (!profileId) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        Sélectionnez un profil pour gérer vos leads.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ color: 'white', fontSize: 16, fontWeight: 800, margin: 0 }}>
            Leads CRM
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '4px 0 0' }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Toggle Liste / Kanban */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 3 }}>
            <button onClick={() => setViewMode('list')} title="Vue liste" style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 9,
              border: 'none', background: viewMode === 'list' ? 'rgba(99,102,241,0.3)' : 'transparent',
              color: viewMode === 'list' ? 'white' : 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <LayoutList size={13} /> {!isMobile && 'Liste'}
            </button>
            <button onClick={() => setViewMode('kanban')} title="Vue Kanban" style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 9,
              border: 'none', background: viewMode === 'kanban' ? 'rgba(99,102,241,0.3)' : 'transparent',
              color: viewMode === 'kanban' ? 'white' : 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <Columns3 size={13} /> {!isMobile && 'Kanban'}
            </button>
          </div>
          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={13} /> {!isMobile && 'Exporter CSV'}
          </button>
          <button onClick={() => setShowAdd(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none',
            borderRadius: 12, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            <UserPlus size={13} /> {!isMobile && 'Ajouter un lead'}
          </button>
        </div>
      </div>

      {/* Search + filters (masqués en vue Kanban — les colonnes remplacent le filtre statut) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un lead (nom, téléphone, email, entreprise)..."
            style={{ ...inp, paddingLeft: 38 }}
          />
        </div>

        {viewMode === 'list' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setFilter('all')} style={{
              padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
              border: `1px solid ${filter === 'all' ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
              background: filter === 'all' ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: filter === 'all' ? '#818cf8' : 'rgba(255,255,255,0.45)',
              fontSize: 12, fontWeight: 600,
            }}>
              Tous ({leads.length})
            </button>
            {STATUSES.map(s => (
              <button key={s.id} onClick={() => setFilter(s.id)} style={{
                padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
                border: `1px solid ${filter === s.id ? s.color : 'rgba(255,255,255,0.08)'}`,
                background: filter === s.id ? s.bg : 'transparent',
                color: filter === s.id ? s.color : 'rgba(255,255,255,0.45)',
                fontSize: 12, fontWeight: 600,
              }}>
                {s.label} ({statusCounts[s.id] || 0})
              </button>
            ))}
          </div>
        )}

        {/* Filtre par tag — affiché seulement si des tags existent */}
        {allTags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Tag size={12} color="rgba(255,255,255,0.3)" />
            {allTags.map(tag => (
              <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? null : tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 99,
                  background: tagFilter === tag ? tagColor(tag) + '33' : tagColor(tag) + '14',
                  color: tagColor(tag), border: `1px solid ${tagColor(tag)}${tagFilter === tag ? '88' : '33'}`,
                  fontSize: 11, fontWeight: 600,
                }}>#{tag}</span>
              </button>
            ))}
            {tagFilter && (
              <button onClick={() => setTagFilter(null)} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Effacer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contenu : Liste ou Kanban */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={20} color="rgba(255,255,255,0.3)" className="animate-spin" />
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanView leads={filteredLeads} onOpenLead={setSelectedLead} onStatusChange={handleKanbanStatusChange} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              {leads.length === 0 ? 'Aucun lead pour le moment.' : 'Aucun lead ne correspond à votre recherche.'}
            </div>
          ) : (
            filteredLeads.map(lead => {
              const { color: sc } = scoreLabel(lead.score || 0);
              return (
                <motion.div
                  key={lead.id}
                  layout
                  onClick={() => setSelectedLead(lead)}
                  whileHover={{ background: 'rgba(255,255,255,0.07)' }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${sc}44, ${sc}22)`,
                    border: `2px solid ${sc}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: sc,
                  }}>
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
                      {!isMobile && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Globe size={11} /> {SOURCES.find(s => s.id === lead.source)?.label || lead.source}
                        </span>
                      )}
                    </div>
                    {!!(lead.tags || []).length && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {lead.tags.slice(0, 4).map(t => <TagChip key={t} tag={t} small />)}
                        {lead.tags.length > 4 && (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, alignSelf: 'center' }}>+{lead.tags.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {!isMobile && (
                    <div style={{ width: 90, flexShrink: 0 }}>
                      <ScoreBar score={lead.score || 0} />
                    </div>
                  )}
                  <WhatsAppBtn
                    phone={lead.phone}
                    leadId={lead.id}
                    compact
                    onContact={async (id) => {
                      await supabase.from('lead_activities').insert([{
                        lead_id: id, type: 'whatsapp', description: 'Contact WhatsApp effectué',
                      }]);
                    }}
                  />
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Add lead modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 420, background: '#0f0f1a',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
                padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
                maxHeight: '90vh', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ color: 'white', fontSize: 16, fontWeight: 800, margin: 0 }}>Nouveau lead</h3>
                <button onClick={() => setShowAdd(false)} style={actionBtn('rgba(255,255,255,0.15)')}><X size={14} /></button>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nom *</label>
                <input value={newLead.name} onChange={e => setNewLead(f => ({ ...f, name: e.target.value }))} style={inp} placeholder="Nom complet" />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Téléphone</label>
                <input value={newLead.phone} onChange={e => setNewLead(f => ({ ...f, phone: e.target.value }))} style={inp} placeholder="Ex: 0700000000" />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
                <input value={newLead.email} onChange={e => setNewLead(f => ({ ...f, email: e.target.value }))} style={inp} placeholder="email@exemple.com" />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Entreprise</label>
                <input value={newLead.company} onChange={e => setNewLead(f => ({ ...f, company: e.target.value }))} style={inp} placeholder="Nom de l'entreprise" />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Source</label>
                <select value={newLead.source} onChange={e => setNewLead(f => ({ ...f, source: e.target.value }))} style={inp}>
                  {SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Notes</label>
                <textarea value={newLead.notes} onChange={e => setNewLead(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inp, resize: 'none' }} placeholder="Notes additionnelles..." />
              </div>

              <button onClick={addLead} disabled={adding} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: 13, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: 'none', borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 700,
                cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1, marginTop: 4,
              }}>
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Ajouter le lead
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead detail modal */}
      <AnimatePresence>
        {selectedLead && (
          <LeadModal
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={(updated) => { updateLeadLocal(updated); setSelectedLead(updated); }}
            onDelete={deleteLead}
          />
        )}
      </AnimatePresence>
    </div>
  );
}