import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../supabase';

/**
 * ContactTimeline
 * ─────────────────────────────────────────────────────────────────
 * Fiche contact unique : résumé + timeline de TOUS les événements d'un
 * lead (activités, réservations, formulaires, messages, événements,
 * billets, WhatsApp), via la RPC `crm_contact_timeline` (rapprochement
 * par téléphone normalisé ou e-mail, contrôle de propriété côté SQL).
 *
 * <ContactTimeline leadId={lead.id} createdAt={lead.created_at}
 *                  refreshKey={…} />
 *
 * `refreshKey` : changez-le pour recharger (ex. après l'ajout d'une note).
 * ─────────────────────────────────────────────────────────────────
 */

const KIND = {
  created:         { icon: '🆕', group: 'suivi'     },
  status:          { icon: '🔄', group: 'suivi'     },
  edited:          { icon: '✏️', group: 'suivi'     },
  task:            { icon: '📋', group: 'suivi'     },
  task_created:    { icon: '📋', group: 'suivi'     },
  task_done:       { icon: '✅', group: 'suivi'     },
  note:            { icon: '📝', group: 'echanges'  },
  whatsapp:        { icon: '💬', group: 'echanges'  },
  wa_in:           { icon: '📥', group: 'echanges'  },
  wa_out:          { icon: '📤', group: 'echanges'  },
  contact_message: { icon: '✉️', group: 'echanges'  },
  booking:         { icon: '📅', group: 'activite'  },
  form:            { icon: '🧾', group: 'activite'  },
  event_lead:      { icon: '🎟️', group: 'activite'  },
  event_rsvp:      { icon: '🎟️', group: 'activite'  },
  ticket:          { icon: '🎫', group: 'activite'  },
};

const FILTERS = [
  { id: 'all',      label: 'Tout' },
  { id: 'echanges', label: 'Échanges' },
  { id: 'activite', label: 'Réservations & achats' },
  { id: 'suivi',    label: 'Suivi' },
];

const THEMES = {
  // Thème clair = modales du CRM ([T2] : texte #161a2e, bordures #eef0f5, accent indigo)
  light: { text: '#161a2e', muted: '#6b7280', faint: '#9095a5', line: '#eef0f5', box: '#f6f7fb', chipBorder: '#dde0ea', chipText: '#6b7280', activeBg: 'rgba(99,102,241,0.12)', activeText: '#4f46e5' },
  dark:  { text: 'rgba(255,255,255,0.85)', muted: 'rgba(255,255,255,0.5)', faint: 'rgba(255,255,255,0.3)', line: 'rgba(255,255,255,0.06)', box: 'rgba(255,255,255,0.04)', chipBorder: 'rgba(255,255,255,0.14)', chipText: 'rgba(255,255,255,0.65)', activeBg: 'rgba(99,102,241,0.28)', activeText: '#c7d2fe' },
};

const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function dayLabel(iso) {
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Aujourd’hui';
  if (diff === 1) return 'Hier';
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// « Il y a 3 jours » : lisible d'un coup d'œil pour décider d'une relance
function ago(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'aujourd’hui';
  if (days === 1) return 'hier';
  if (days < 30) return `il y a ${days} jours`;
  const months = Math.floor(days / 30);
  return months < 12 ? `il y a ${months} mois` : `il y a ${Math.floor(months / 12)} an(s)`;
}

export default function ContactTimeline({ leadId, createdAt, refreshKey = 0, dark = false }) {
  const t = dark ? THEMES.dark : THEMES.light;
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: e } = await supabase.rpc('crm_contact_timeline', { p_lead_id: leadId, p_limit: 200 });
      if (cancelled) return;
      if (e) { setError('Impossible de charger l’historique.'); setEvents([]); }
      else   { setEvents(data || []); }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [leadId, refreshKey]);

  // Résumé : on ne compte comme « échange » que ce qui vient du contact ou de la relation
  // (pas les changements de statut / modifications / tâches, qui sont du suivi interne).
  const summary = useMemo(() => {
    const real = events.filter(ev => ['echanges', 'activite'].includes(KIND[ev.kind]?.group));
    return {
      total: real.length,
      last:  real[0]?.event_at || null, // events est trié du plus récent au plus ancien
      first: createdAt || events[events.length - 1]?.event_at || null,
    };
  }, [events, createdAt]);

  const visible = useMemo(
    () => (filter === 'all' ? events : events.filter(ev => (KIND[ev.kind]?.group || 'suivi') === filter)),
    [events, filter],
  );

  const days = useMemo(() => {
    const map = new Map();
    for (const ev of visible) {
      const key = dayLabel(ev.event_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return [...map.entries()];
  }, [visible]);

  const stat = (label, value) => (
    <div style={{ flex: 1, minWidth: 96, background: t.box, borderRadius: 10, padding: '8px 10px' }}>
      <p style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, color: t.faint, fontWeight: 700 }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: t.text }}>{value}</p>
    </div>
  );

  return (
    <div>
      {/* ── Résumé ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {stat('Premier contact', summary.first ? fmtDate(summary.first) : '—')}
        {stat('Dernier échange', summary.last ? ago(summary.last) : 'Aucun')}
        {stat('Interactions', summary.total)}
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {FILTERS.map(f => {
          const active = filter === f.id;
          return (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)}
              style={{ padding: '6px 11px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                       border: `1px solid ${active ? '#6366f1' : t.chipBorder}`,
                       background: active ? t.activeBg : 'transparent', color: active ? t.activeText : t.chipText }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}><Loader2 size={16} color={t.faint} className="animate-spin" /></div>
      ) : error ? (
        <p style={{ color: '#dc2626', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>{error}</p>
      ) : visible.length === 0 ? (
        <p style={{ color: t.faint, fontSize: 12, textAlign: 'center', padding: '12px 0' }}>Aucun événement</p>
      ) : (
        days.map(([label, list]) => (
          <div key={label} style={{ marginTop: 10 }}>
            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: t.faint, textTransform: 'capitalize' }}>{label}</p>
            {list.map((ev, i) => (
              <div key={`${ev.event_at}-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px solid ${t.line}` }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{KIND[ev.kind]?.icon || '📌'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.text }}>{ev.title}</p>
                  {ev.detail && (
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: t.muted, lineHeight: 1.5, wordBreak: 'break-word' }}>{ev.detail}</p>
                  )}
                </div>
                <span style={{ fontSize: 11, color: t.faint, flexShrink: 0 }}>{fmtTime(ev.event_at)}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
