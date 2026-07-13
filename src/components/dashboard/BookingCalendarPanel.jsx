import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "../../supabase";

// ============================================================
// STYLES (cohérents avec le thème dark de SocialApp)
// ============================================================
const COLORS = {
  bg: '#060412',
  card: '#0c0d1a',
  cardAlt: '#12101f',
  border: 'rgba(167,139,250,0.15)',
  accent: '#a78bfa',
  accent2: '#6c63ff',
  text: '#f1f0f7',
  textMuted: '#8a8798',
  danger: '#f87171',
  success: '#4ade80',
  warning: '#fbbf24',
};

const s = {
  wrap: { background: COLORS.bg, color: COLORS.text, borderRadius: 16, padding: 20, fontFamily: 'inherit' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tab: (active) => ({
    padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
    background: active ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})` : COLORS.card,
    color: active ? '#fff' : COLORS.textMuted, border: `1px solid ${active ? 'transparent' : COLORS.border}`,
    transition: 'all .15s',
  }),
  card: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18, marginBottom: 14 },
  row: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  input: {
    background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px',
    color: COLORS.text, fontSize: 14, outline: 'none', flex: '1 1 160px',
  },
  label: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4, display: 'block', fontWeight: 600 },
  btn: {
    background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`, color: '#fff', border: 'none',
    borderRadius: 8, padding: '10px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
  },
  btnGhost: {
    background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`,
    borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer',
  },
  btnDanger: {
    background: 'rgba(248,113,113,0.12)', color: COLORS.danger, border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer',
  },
  badge: (color) => ({
    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
    background: `${color}22`, color, textTransform: 'uppercase', letterSpacing: 0.3,
  }),
  empty: { textAlign: 'center', padding: 40, color: COLORS.textMuted, fontSize: 14 },
  errorBox: {
    background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
    color: COLORS.danger, borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12,
  },
};

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const STATUS_COLORS = { pending: COLORS.warning, confirmed: COLORS.success, cancelled: COLORS.danger, completed: COLORS.accent, no_show: COLORS.textMuted };
const STATUS_LABELS = { pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé', completed: 'Terminé', no_show: 'Absent' };

// Valide un format "HH:MM" complet avant d'envoyer à Postgres (colonne type `time`)
const isValidTime = (val) => typeof val === 'string' && /^\d{2}:\d{2}$/.test(val);

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function BookingCalendarPanel({ profileId }) {
  const [tab, setTab] = useState('services');

  return (
    <div style={s.wrap}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>📅 Calendrier de réservation</h2>
        <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: 14 }}>
          Gère tes créneaux de RDV, tes disponibilités et tes événements.
        </p>
      </div>

      <div style={s.tabs}>
        {[
          ['services', 'Services'],
          ['availability', 'Disponibilités'],
          ['events', 'Événements'],
          ['bookings', 'Réservations'],
        ].map(([key, label]) => (
          <div key={key} style={s.tab(tab === key)} onClick={() => setTab(key)}>{label}</div>
        ))}
      </div>

      {tab === 'services' && <ServicesTab profileId={profileId} />}
      {tab === 'availability' && <AvailabilityTab profileId={profileId} />}
      {tab === 'events' && <EventsTab profileId={profileId} />}
      {tab === 'bookings' && <BookingsTab profileId={profileId} />}
    </div>
  );
}

// ============================================================
// SERVICES
// ============================================================
function ServicesTab({ profileId }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null = fermé, {} = nouveau, {...} = édition

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('booking_services')
      .select('*')
      .eq('profile_id', profileId)
      .order('position', { ascending: true });
    if (!error) setServices(data || []);
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const payload = {
      profile_id: profileId,
      name: form.name?.trim(),
      description: form.description?.trim() || null,
      duration_minutes: Number(form.duration_minutes) || 30,
      price: Number(form.price) || 0,
      buffer_before_minutes: Number(form.buffer_before_minutes) || 0,
      buffer_after_minutes: Number(form.buffer_after_minutes) || 0,
      color: form.color || '#a78bfa',
      is_active: form.is_active ?? true,
    };
    if (!payload.name) return alert('Le nom du service est requis.');

    if (form.id) {
      await supabase.from('booking_services').update(payload).eq('id', form.id);
    } else {
      await supabase.from('booking_services').insert(payload);
    }
    setForm(null);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce service ?')) return;
    await supabase.from('booking_services').delete().eq('id', id);
    load();
  };

  const toggleActive = async (svc) => {
    await supabase.from('booking_services').update({ is_active: !svc.is_active }).eq('id', svc.id);
    load();
  };

  if (loading) return <div style={s.empty}>Chargement…</div>;

  return (
    <div>
      <div style={{ ...s.row, justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ color: COLORS.textMuted, fontSize: 13 }}>{services.length} service(s)</span>
        <button style={s.btn} onClick={() => setForm({ is_active: true, color: '#a78bfa' })}>+ Nouveau service</button>
      </div>

      {form && (
        <div style={s.card}>
          <div style={s.row}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={s.label}>Nom du service *</label>
              <input style={s.input} placeholder="Ex: Consultation 30 min" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={s.label}>Durée (min)</label>
              <input style={s.input} type="number" min="5" step="5" value={form.duration_minutes || 30} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={s.label}>Prix (FCFA)</label>
              <input style={s.input} type="number" min="0" value={form.price || 0} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <div style={{ ...s.row, marginTop: 10 }}>
            <div style={{ flex: '1 1 100%' }}>
              <label style={s.label}>Description (optionnel)</label>
              <input style={s.input} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div style={{ ...s.row, marginTop: 10 }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={s.label}>Tampon avant (min)</label>
              <input style={s.input} type="number" min="0" value={form.buffer_before_minutes || 0} onChange={(e) => setForm({ ...form, buffer_before_minutes: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={s.label}>Tampon après (min)</label>
              <input style={s.input} type="number" min="0" value={form.buffer_after_minutes || 0} onChange={(e) => setForm({ ...form, buffer_after_minutes: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={s.label}>Couleur</label>
              <input style={{ ...s.input, padding: 4, height: 40 }} type="color" value={form.color || '#a78bfa'} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
          </div>
          <div style={{ ...s.row, marginTop: 14, justifyContent: 'flex-end' }}>
            <button style={s.btnGhost} onClick={() => setForm(null)}>Annuler</button>
            <button style={s.btn} onClick={save}>Enregistrer</button>
          </div>
        </div>
      )}

      {services.length === 0 && !form && <div style={s.empty}>Aucun service. Crée ton premier type de RDV pour commencer.</div>}

      {services.map((svc) => (
        <div key={svc.id} style={s.card}>
          <div style={{ ...s.row, justifyContent: 'space-between' }}>
            <div style={s.row}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: svc.color, display: 'inline-block' }} />
              <strong>{svc.name}</strong>
              <span style={s.badge(svc.is_active ? COLORS.success : COLORS.textMuted)}>{svc.is_active ? 'Actif' : 'Inactif'}</span>
            </div>
            <div style={s.row}>
              <button style={s.btnGhost} onClick={() => toggleActive(svc)}>{svc.is_active ? 'Désactiver' : 'Activer'}</button>
              <button style={s.btnGhost} onClick={() => setForm(svc)}>Modifier</button>
              <button style={s.btnDanger} onClick={() => remove(svc.id)}>Supprimer</button>
            </div>
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 8 }}>
            {svc.duration_minutes} min · {svc.price > 0 ? `${svc.price.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}
            {svc.description ? ` · ${svc.description}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// DISPONIBILITÉS
// ============================================================
function AvailabilityTab({ profileId }) {
  const [slots, setSlots] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBlock, setNewBlock] = useState({ blocked_date: '', reason: '' });
  const [error, setError] = useState(null);

  // Valeurs locales des inputs time, tenues séparément des données Supabase.
  // Cela évite d'envoyer un PATCH à chaque frappe (et notamment les valeurs
  // vides/incomplètes que le navigateur peut émettre pendant la saisie),
  // qui causaient les erreurs 400 Bad Request.
  const [localTimes, setLocalTimes] = useState({}); // { [slotId]: { start_time, end_time } }

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      supabase.from('booking_availability').select('*').eq('profile_id', profileId).order('day_of_week'),
      supabase.from('booking_blocked_dates').select('*').eq('profile_id', profileId).order('blocked_date'),
    ]);
    setSlots(a.data || []);
    setBlocked(b.data || []);
    setLoading(false);

    // Réinitialise les valeurs locales à partir des données fraîches
    const times = {};
    (a.data || []).forEach((sl) => {
      times[sl.id] = {
        start_time: sl.start_time?.slice(0, 5) || '',
        end_time: sl.end_time?.slice(0, 5) || '',
      };
    });
    setLocalTimes(times);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const slotsByDay = (day) => slots.filter((sl) => sl.day_of_week === day);

  const addSlot = async (day) => {
    setError(null);
    const { error: err } = await supabase.from('booking_availability').insert({
      profile_id: profileId, day_of_week: day, start_time: '09:00', end_time: '17:00', is_active: true,
    });
    if (err) { setError(err.message); return; }
    load();
  };

  // Met à jour uniquement l'état local pendant la saisie (pas d'appel réseau)
  const handleLocalTimeChange = (slotId, field, value) => {
    setLocalTimes((prev) => ({
      ...prev,
      [slotId]: { ...prev[slotId], [field]: value },
    }));
  };

  // Envoie le PATCH uniquement quand le champ perd le focus, et seulement
  // si la valeur est un HH:MM complet et différente de l'originale.
  const commitTime = async (slot, field) => {
    const value = localTimes[slot.id]?.[field];

    if (!isValidTime(value)) {
      // Valeur incomplète/invalide : on revient à la valeur d'origine sans appeler l'API
      setLocalTimes((prev) => ({
        ...prev,
        [slot.id]: { ...prev[slot.id], [field]: slot[field]?.slice(0, 5) || '' },
      }));
      return;
    }

    const original = slot[field]?.slice(0, 5) || '';
    if (value === original) return; // rien n'a changé, pas besoin de PATCH

    setError(null);
    const { error: err } = await supabase.from('booking_availability').update({ [field]: value }).eq('id', slot.id);
    if (err) {
      setError(err.message);
      return;
    }
    load();
  };

  const removeSlot = async (id) => {
    setError(null);
    const { error: err } = await supabase.from('booking_availability').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    load();
  };

  const addBlock = async () => {
    if (!newBlock.blocked_date) return alert('Choisis une date.');
    setError(null);
    const { error: err } = await supabase.from('booking_blocked_dates').insert({ profile_id: profileId, ...newBlock });
    if (err) { setError(err.message); return; }
    setNewBlock({ blocked_date: '', reason: '' });
    load();
  };

  const removeBlock = async (id) => {
    setError(null);
    const { error: err } = await supabase.from('booking_blocked_dates').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    load();
  };

  if (loading) return <div style={s.empty}>Chargement…</div>;

  return (
    <div>
      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      <div style={s.card}>
        <strong style={{ display: 'block', marginBottom: 12 }}>Planning hebdomadaire récurrent</strong>
        {DAYS.map((label, day) => (
          <div key={day} style={{ borderTop: day > 0 ? `1px solid ${COLORS.border}` : 'none', padding: '10px 0' }}>
            <div style={{ ...s.row, justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, width: 100 }}>{label}</span>
              <button style={s.btnGhost} onClick={() => addSlot(day)}>+ Ajouter un créneau</button>
            </div>
            {slotsByDay(day).length === 0 && <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Fermé</div>}
            {slotsByDay(day).map((sl) => (
              <div key={sl.id} style={{ ...s.row, marginBottom: 6 }}>
                <input
                  style={{ ...s.input, flex: '0 1 110px' }}
                  type="time"
                  value={localTimes[sl.id]?.start_time ?? sl.start_time?.slice(0, 5) ?? ''}
                  onChange={(e) => handleLocalTimeChange(sl.id, 'start_time', e.target.value)}
                  onBlur={() => commitTime(sl, 'start_time')}
                />
                <span style={{ color: COLORS.textMuted }}>à</span>
                <input
                  style={{ ...s.input, flex: '0 1 110px' }}
                  type="time"
                  value={localTimes[sl.id]?.end_time ?? sl.end_time?.slice(0, 5) ?? ''}
                  onChange={(e) => handleLocalTimeChange(sl.id, 'end_time', e.target.value)}
                  onBlur={() => commitTime(sl, 'end_time')}
                />
                <button style={s.btnDanger} onClick={() => removeSlot(sl.id)}>✕</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={s.card}>
        <strong style={{ display: 'block', marginBottom: 12 }}>Jours bloqués / congés</strong>
        <div style={s.row}>
          <input style={s.input} type="date" value={newBlock.blocked_date} onChange={(e) => setNewBlock({ ...newBlock, blocked_date: e.target.value })} />
          <input style={s.input} placeholder="Raison (optionnel)" value={newBlock.reason} onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })} />
          <button style={s.btn} onClick={addBlock}>Bloquer ce jour</button>
        </div>
        {blocked.length === 0 && <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 10 }}>Aucun jour bloqué.</div>}
        {blocked.map((b) => (
          <div key={b.id} style={{ ...s.row, justifyContent: 'space-between', marginTop: 10 }}>
            <span>{new Date(b.blocked_date).toLocaleDateString('fr-FR')} {b.reason ? `— ${b.reason}` : ''}</span>
            <button style={s.btnDanger} onClick={() => removeBlock(b.id)}>Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ÉVÉNEMENTS
// ============================================================
function EventsTab({ profileId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('booking_events').select('*').eq('profile_id', profileId).order('event_date');
    setEvents(data || []);
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const payload = {
      profile_id: profileId,
      title: form.title?.trim(),
      description: form.description?.trim() || null,
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time || null,
      location: form.location?.trim() || null,
      capacity: Number(form.capacity) || 20,
      price: Number(form.price) || 0,
      is_active: form.is_active ?? true,
    };
    if (!payload.title || !payload.event_date || !payload.start_time) return alert('Titre, date et heure de début sont requis.');

    if (form.id) {
      await supabase.from('booking_events').update(payload).eq('id', form.id);
    } else {
      await supabase.from('booking_events').insert(payload);
    }
    setForm(null);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    await supabase.from('booking_events').delete().eq('id', id);
    load();
  };

  if (loading) return <div style={s.empty}>Chargement…</div>;

  return (
    <div>
      <div style={{ ...s.row, justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ color: COLORS.textMuted, fontSize: 13 }}>{events.length} événement(s)</span>
        <button style={s.btn} onClick={() => setForm({ is_active: true, capacity: 20 })}>+ Nouvel événement</button>
      </div>

      {form && (
        <div style={s.card}>
          <div style={s.row}>
            <div style={{ flex: '1 1 100%' }}>
              <label style={s.label}>Titre *</label>
              <input style={s.input} value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
          </div>
          <div style={{ ...s.row, marginTop: 10 }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={s.label}>Date *</label>
              <input style={s.input} type="date" value={form.event_date || ''} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 110px' }}>
              <label style={s.label}>Heure début *</label>
              <input style={s.input} type="time" value={form.start_time || ''} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 110px' }}>
              <label style={s.label}>Heure fin</label>
              <input style={s.input} type="time" value={form.end_time || ''} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div style={{ ...s.row, marginTop: 10 }}>
            <div style={{ flex: '1 1 160px' }}>
              <label style={s.label}>Lieu</label>
              <input style={s.input} value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={s.label}>Capacité *</label>
              <input style={s.input} type="number" min="1" value={form.capacity || 20} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={s.label}>Prix (FCFA)</label>
              <input style={s.input} type="number" min="0" value={form.price || 0} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <div style={{ ...s.row, marginTop: 10 }}>
            <div style={{ flex: '1 1 100%' }}>
              <label style={s.label}>Description</label>
              <input style={s.input} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div style={{ ...s.row, marginTop: 14, justifyContent: 'flex-end' }}>
            <button style={s.btnGhost} onClick={() => setForm(null)}>Annuler</button>
            <button style={s.btn} onClick={save}>Enregistrer</button>
          </div>
        </div>
      )}

      {events.length === 0 && !form && <div style={s.empty}>Aucun événement programmé.</div>}

      {events.map((ev) => (
        <div key={ev.id} style={s.card}>
          <div style={{ ...s.row, justifyContent: 'space-between' }}>
            <strong>{ev.title}</strong>
            <div style={s.row}>
              <button style={s.btnGhost} onClick={() => setForm(ev)}>Modifier</button>
              <button style={s.btnDanger} onClick={() => remove(ev.id)}>Supprimer</button>
            </div>
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6 }}>
            {new Date(ev.event_date).toLocaleDateString('fr-FR')} à {ev.start_time?.slice(0, 5)}
            {ev.location ? ` · ${ev.location}` : ''} · {ev.capacity} places · {ev.price > 0 ? `${ev.price.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// RÉSERVATIONS (liste + gestion statut)
// ============================================================
function BookingsTab({ profileId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*, booking_services(name, color), booking_events(title)')
      .eq('profile_id', profileId)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(200);
    setBookings(data || []);
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    load();
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) return <div style={s.empty}>Chargement…</div>;

  return (
    <div>
      <div style={{ ...s.tabs, marginBottom: 14 }}>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map((f) => (
          <div key={f} style={s.tab(filter === f)} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Toutes' : STATUS_LABELS[f]}
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div style={s.empty}>Aucune réservation.</div>}

      {filtered.map((b) => (
        <div key={b.id} style={s.card}>
          <div style={{ ...s.row, justifyContent: 'space-between' }}>
            <div>
              <strong>{b.client_name}</strong>{' '}
              <span style={s.badge(STATUS_COLORS[b.status])}>{STATUS_LABELS[b.status]}</span>
            </div>
            <span style={{ color: COLORS.textMuted, fontSize: 13 }}>
              {new Date(b.booking_date).toLocaleDateString('fr-FR')} · {b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)}
            </span>
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6 }}>
            {b.booking_services?.name || b.booking_events?.title}
            {b.event_id && b.party_size > 1 ? ` · ${b.party_size} places` : ''}
            {b.client_phone ? ` · ${b.client_phone}` : ''}
            {b.client_email ? ` · ${b.client_email}` : ''}
          </div>
          {b.notes && <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>« {b.notes} »</div>}
          {(b.status === 'pending' || b.status === 'confirmed') && (
            <div style={{ ...s.row, marginTop: 10 }}>
              {b.status === 'pending' && <button style={s.btnGhost} onClick={() => setStatus(b.id, 'confirmed')}>Confirmer</button>}
              <button style={s.btnGhost} onClick={() => setStatus(b.id, 'completed')}>Marquer terminé</button>
              <button style={s.btnGhost} onClick={() => setStatus(b.id, 'no_show')}>Absent</button>
              <button style={s.btnDanger} onClick={() => setStatus(b.id, 'cancelled')}>Annuler</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}