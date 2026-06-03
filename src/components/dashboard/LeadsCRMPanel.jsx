import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Trash2, Mail, Phone, UserPlus,
  Loader2, Download, X, ChevronRight, Star,
  MessageCircle, Building2, Clock, Tag,
  Pencil, Check, Activity, SlidersHorizontal,
  Flame, Snowflake, TrendingUp, Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';

// ─── Constants ────────────────────────────────────────────────
const STATUSES = [
  { id: 'prospect', label: 'Prospect',  color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  { id: 'chaud',    label: '🔥 Chaud',  color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
  { id: 'client',   label: '✅ Client', color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  { id: 'froid',    label: '❄️ Froid',  color: '#06b6d4', bg: 'rgba(6,182,212,0.15)'  },
  { id: 'perdu',    label: 'Perdu',     color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
];

const SOURCES = [
  { id: 'manuel',     label: 'Manuel'          },
  { id: 'qrcode',     label: 'QR Code'         },
  { id: 'socialapp',  label: 'Profil SocialApp' },
  { id: 'rsvp',       label: 'RSVP'            },
  { id: 'marketplace',label: 'Marketplace'     },
  { id: 'formulaire', label: 'Formulaire'      },
];

const ACTIVITY_ICONS = {
  created:  '🆕',
  status:   '🔄',
  note:     '📝',
  whatsapp: '💬',
  edited:   '✏️',
};

const EMPTY_LEAD = {
  name: '', phone: '', email: '',
  company: '', status: 'prospect',
  source: 'manuel', notes: '', score: 50,
};

// Score helpers
const scoreLabel = (s) =>
  s <= 30 ? { label: 'Froid', color: '#06b6d4', icon: '❄️' }
  : s <= 70 ? { label: 'Tiède', color: '#f59e0b', icon: '🌡️' }
  : { label: 'Chaud', color: '#ef4444', icon: '🔥' };

// ─── Shared input style ────────────────────────────────────────
const inp = {
  width: '100%', background: '#2f2f2f', // gris foncé
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
  padding: '11px 13px', color: 'white', outline: 'none',
  fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit',
};

// ─── Sub-components ────────────────────────────────────────────
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

function WhatsAppBtn({ phone, leadId, onContact, compact = false }) {
  const hasPhone = !!phone?.trim();
  return (
    <button
      disabled={!hasPhone}
      onClick={e => {
        e.stopPropagation();
        if (!hasPhone) return;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
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

// ─── Lead Detail Modal ─────────────────────────────────────────
function LeadModal({ lead, onClose, onUpdate, onDelete, onContact }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...lead });
  const [note, setNote] = useState('');
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
    onUpdate({ ...lead, ...form });
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

          {/* Score */}
          <Section title="Score commercial">
            <ScoreBar score={editing ? form.score : (lead.score || 0)}
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
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{ACTIVITY_ICONS[a.type] || '📌'}</span>
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

// ─── Main Component ────────────────────────────────────────────
export default function LeadsCRMPanel({ profileId }) {
  const [leads, setLeads]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [newLead, setNewLead]       = useState({ ...EMPTY_LEAD });
  const [adding, setAdding]         = useState(false);

  useEffect(() => { if (profileId) loadLeads(); }, [profileId]);

  const loadLeads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('leads').select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    setLeads(data || []);
    setLoading(false);
  };

  const addLead = async () => {
    if (!newLead.name.trim()) { toast.error('Nom requis'); return; }
    setAdding(true);
    const { data, error } = await supabase.from('leads')
      .insert([{ ...newLead, profile_id: profileId }])
      .select().single();
    if (error) { toast.error(error.message); setAdding(false); return; }
    // Log activity
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
    await supabase.from('lead_activities').delete().eq('lead_id', id);
    await supabase.from('leads').delete().eq('id', id);
    setLeads(p => p.filter(l => l.id !== id));
    toast.success('Lead supprimé');
  };

  const updateLead = (updated) => {
    setLeads(p => p.map(l => l.id === updated.id ? updated : l));
    if (selectedLead?.id === updated.id) setSelectedLead(updated);
  };

  const exportCSV = () => {
    const rows = [
      'Nom,Téléphone,Email,Entreprise,Source,Statut,Score,Notes',
      ...leads.map(l =>
        [l.name, l.phone, l.email, l.company, l.source, l.status, l.score, l.notes]
          .map(v => `"${(v || '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = 'leads.csv';
    a.click();
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q) ||
      (l.company || '').toLowerCase().includes(q);
    const matchFilter = filter === 'all' || l.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = STATUSES.reduce((a, s) => {
    a[s.id] = leads.filter(l => l.status === s.id).length;
    return a;
  }, {});

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
              Leads & CRM
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '4px 0 0' }}>
              {leads.length} contact{leads.length > 1 ? 's' : ''} dans votre pipeline
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={exportCSV} style={ghostBtn}>
              <Download size={14} /> Export CSV
            </button>
            <button onClick={() => setShowAdd(v => !v)} style={primaryBtn}>
              <Plus size={14} /> Ajouter lead
            </button>
          </div>
        </div>

        {/* ── Status filters ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('all')} style={pillBtn(filter === 'all', '#fff')}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: filter === 'all' ? 'white' : 'rgba(255,255,255,0.3)' }} />
            Tous
            <span style={countBadge}>{leads.length}</span>
          </button>
          {STATUSES.map(s => (
            <button key={s.id} onClick={() => setFilter(filter === s.id ? 'all' : s.id)}
              style={pillBtn(filter === s.id, s.color)}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
              {s.label}
              <span style={countBadge}>{counts[s.id] || 0}</span>
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div style={{ position: 'relative' }}>
          <Search size={15} color="rgba(255,255,255,0.3)"
            style={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input placeholder="Nom, email, téléphone, entreprise…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, height: 44, paddingLeft: 42 }} />
        </div>

        {/* ── Add lead form ── */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: 20, backdropFilter: 'blur(12px)',
              }}>
              <h4 style={{ color: 'white', margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Nouveau lead</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Nom *', 'name', 'text'],
                  ['Téléphone', 'phone', 'tel'],
                  ['Email', 'email', 'email'],
                  ['Entreprise', 'company', 'text'],
                ].map(([ph, key, type]) => (
                  <input key={key} type={type} placeholder={ph} value={newLead[key]}
                    onChange={e => setNewLead(p => ({ ...p, [key]: e.target.value }))}
                    style={inp} />
                ))}
                <select value={newLead.status} onChange={e => setNewLead(p => ({ ...p, status: e.target.value }))} style={inp}>
                  {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <select value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))} style={inp}>
                  {SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ marginTop: 12 }}>
                <ScoreBar score={newLead.score} onChange={v => setNewLead(p => ({ ...p, score: v }))} />
              </div>
              <textarea rows={3} placeholder="Notes…" value={newLead.notes}
                onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))}
                style={{ ...inp, marginTop: 10, resize: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button onClick={() => setShowAdd(false)} style={ghostBtn}>Annuler</button>
                <button onClick={addLead} disabled={adding} style={primaryBtn}>
                  {adding ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Ajouter le lead
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Leads table ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, overflow: 'hidden',
          minHeight: 280,
        }}>
          {/* Table header */}
          {!loading && filtered.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1.3fr 1.5fr 1fr 1fr 80px 120px',
              padding: '10px 18px', background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {['Nom', 'Téléphone', 'Email', 'Source', 'Statut', 'Score', 'Actions'].map(h => (
                <span key={h} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {h}
                </span>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={22} color="white" className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
              <UserPlus size={28} />
              <p style={{ marginTop: 12, marginBottom: 4, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                {search || filter !== 'all' ? 'Aucun résultat' : 'Aucun lead pour l\'instant'}
              </p>
              <span style={{ fontSize: 12 }}>
                {search || filter !== 'all' ? 'Essayez un autre filtre' : 'Ajoutez vos premiers contacts'}
              </span>
            </div>
          ) : (
            filtered.map((lead, i) => {
              const src = SOURCES.find(s => s.id === lead.source);
              const sc = scoreLabel(lead.score || 0);
              return (
                <motion.div key={lead.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedLead(lead)}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.3fr 1.5fr 1fr 1fr 80px 120px',
                    padding: '14px 18px', alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer', transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${sc.color}33, ${sc.color}11)`,
                      border: `1.5px solid ${sc.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: sc.color, fontSize: 13, fontWeight: 800,
                    }}>
                      {(lead.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, color: 'white', fontSize: 13, fontWeight: 600 }}>{lead.name}</p>
                      {lead.company && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{lead.company}</span>}
                    </div>
                  </div>

                  {/* Phone */}
                  <span style={{ color: lead.phone ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                    {lead.phone || '—'}
                  </span>

                  {/* Email */}
                  <span style={{ color: lead.email ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', fontSize: 12,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.email || '—'}
                  </span>

                  {/* Source */}
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                    {src?.label || lead.source || '—'}
                  </span>

                  {/* Status */}
                  <StatusBadge status={lead.status} />

                  {/* Score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 30, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${lead.score || 0}%`, background: sc.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ color: sc.color, fontSize: 11, fontWeight: 700 }}>{lead.score || 0}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                    <WhatsAppBtn phone={lead.phone} leadId={lead.id} compact onContact={async (id) => {
                      await supabase.from('lead_activities').insert([{
                        lead_id: id, type: 'whatsapp', description: 'Contact WhatsApp effectué',
                      }]);
                    }} />
                    <button onClick={() => deleteLead(lead.id)} style={{ ...actionBtn('#ef4444'), flexShrink: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'right', margin: 0 }}>
            {filtered.length} lead{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Lead Detail Drawer ── */}
      <AnimatePresence>
        {selectedLead && (
          <LeadModal
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={updateLead}
            onDelete={deleteLead}
            onContact={loadLeads}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Button styles ──────────────────────────────────────────────
const primaryBtn = {
  height: 42, padding: '0 18px', borderRadius: 12, border: 'none',
  background: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
  color: 'white', fontSize: 13, fontWeight: 700,
  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
};

const ghostBtn = {
  height: 42, padding: '0 16px', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: 'white', fontSize: 13, fontWeight: 600,
  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
};

const pillBtn = (active, color) => ({
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
  border: `1px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
  background: active ? color + '18' : 'rgba(255,255,255,0.04)',
  color: active ? 'white' : 'rgba(255,255,255,0.55)',
  fontSize: 12, fontWeight: 600, transition: 'all .15s',
});

const countBadge = {
  background: 'rgba(255,255,255,0.08)', borderRadius: 6,
  padding: '1px 6px', fontSize: 10,
};