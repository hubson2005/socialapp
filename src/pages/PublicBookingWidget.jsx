import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase'; // même chemin que PublicProfile.jsx
import { triggerNewBooking, triggerNewEventRegistration } from '../lib/triggers/booking';

// Palette "glass" alignée sur le style réel de PublicProfile.jsx : cartes
// translucides + backdrop-filter par-dessus le fond dynamique (image ou
// dégradé de thème), plutôt que des cartes solides comme dans le dashboard.
const COLORS = {
  glass: 'rgba(255,255,255,0.10)',
  glassAlt: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.15)',
  accent: '#a78bfa', accent2: '#6c63ff',
  text: '#ffffff', textMuted: 'rgba(255,255,255,0.55)',
  success: '#22c55e', danger: '#f87171',
};

const s = {
  wrap: {
    background: COLORS.glass, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 20, color: COLORS.text,
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  title: { fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: '#fff' },
  subtitle: { color: COLORS.textMuted, fontSize: 13, margin: '0 0 16px' },
  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: (active) => ({
    flex: 1, textAlign: 'center', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
    background: active ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})` : COLORS.glassAlt,
    color: active ? '#fff' : COLORS.textMuted, touchAction: 'manipulation',
  }),
  item: {
    background: COLORS.glassAlt, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer', touchAction: 'manipulation',
  },
  itemSelected: { border: `1px solid ${COLORS.accent}`, boxShadow: `0 0 0 1px ${COLORS.accent}` },
  input: {
    width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.25)', border: `1px solid ${COLORS.border}`, borderRadius: 10,
    padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 10,
  },
  btn: {
    width: '100%', background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`, color: '#fff', border: 'none',
    borderRadius: 14, padding: '14px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', touchAction: 'manipulation',
    boxShadow: '0 4px 20px rgba(167,139,250,0.35)',
  },
  btnGhost: { background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', touchAction: 'manipulation' },
  slotGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 8, marginBottom: 16 },
  slot: (selected) => ({
    padding: '10px 6px', textAlign: 'center', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: selected ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})` : COLORS.glassAlt,
    color: selected ? '#fff' : '#fff', border: `1px solid ${selected ? 'transparent' : COLORS.border}`, touchAction: 'manipulation',
  }),
  empty: { textAlign: 'center', color: COLORS.textMuted, fontSize: 13, padding: 20 },
  success: { textAlign: 'center', padding: 30 },
};

const DATE_RANGE_DAYS = 30;

export default function PublicBookingWidget({ profileId }) {
  const [mode, setMode] = useState('services'); // 'services' | 'events'
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [svc, evt] = await Promise.all([
        supabase.from('booking_services').select('*').eq('profile_id', profileId).eq('is_active', true).order('position'),
        supabase.from('booking_events_public').select('*').eq('profile_id', profileId).order('event_date'),
      ]);
      setServices(svc.data || []);
      setEvents(evt.data || []);
      setLoading(false);
    })();
  }, [profileId]);

  if (loading) return <div style={s.wrap}><div style={s.empty}>Chargement du calendrier…</div></div>;
  if (services.length === 0 && events.length === 0) return null; // rien à réserver, on n'affiche pas le widget

  return (
    <div style={s.wrap}>
      <h3 style={s.title}>📅 Prendre rendez-vous</h3>
      <p style={s.subtitle}>Réserve directement un créneau ou une place.</p>

      {services.length > 0 && events.length > 0 && (
        <div style={s.tabs}>
          <div style={s.tab(mode === 'services')} onClick={() => setMode('services')}>Rendez-vous</div>
          <div style={s.tab(mode === 'events')} onClick={() => setMode('events')}>Événements</div>
        </div>
      )}

      {mode === 'services' && services.length > 0 && <ServiceBookingFlow profileId={profileId} services={services} />}
      {mode === 'events' && events.length > 0 && <EventBookingFlow profileId={profileId} events={events} />}
    </div>
  );
}

// ============================================================
// RÉSERVATION DE SERVICE (créneaux)
// ============================================================
function ServiceBookingFlow({ profileId, services }) {
  const [step, setStep] = useState(1); // 1: service, 2: date+heure, 3: form, 4: succès
  const [service, setService] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ client_name: '', client_phone: '', client_email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const dateOptions = Array.from({ length: DATE_RANGE_DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const pickService = (svc) => { setService(svc); setStep(2); };

  const pickDate = useCallback(async (d) => {
    setDate(d);
    setSlot(null);
    setLoadingSlots(true);
    const { data, error } = await supabase.rpc('get_available_slots', {
      p_profile_id: profileId, p_service_id: service.id, p_date: d,
    });
    setSlots(error ? [] : data || []);
    setLoadingSlots(false);
  }, [profileId, service]);

  const submit = async () => {
    if (!form.client_name.trim() || !form.client_phone.trim()) {
      setErrorMsg('Ton nom et ton téléphone sont requis.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    const { error } = await supabase.rpc('create_public_booking', {
      p_profile_id: profileId,
      p_service_id: service.id,
      p_date: date,
      p_start_time: slot.slot_start,
      p_client_name: form.client_name.trim(),
      p_client_phone: form.client_phone.trim(),
      p_client_email: form.client_email.trim() || null,
      p_notes: form.notes.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setErrorMsg(error.message || 'Ce créneau vient d\'être pris, choisis-en un autre.');
      pickDate(date); // rafraîchit les créneaux dispo
      setStep(2);
      return;
    }

    // Fire-and-forget : déclenche les automatisations éventuelles (WhatsApp,
    // tag, score…) en plus de la notification déjà créée par la RPC.
    triggerNewBooking(profileId, {
      name: form.client_name.trim(),
      phone: form.client_phone.trim(),
      email: form.client_email.trim() || null,
      serviceName: service.name,
      bookingDate: date,
      startTime: slot.slot_start,
      notes: form.notes.trim() || null,
    });

    setStep(4);
  };

  if (step === 4) {
    return (
      <div style={s.success}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
        <strong>Réservation confirmée !</strong>
        <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6 }}>
          {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {slot.slot_start.slice(0, 5)}
        </p>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div>
        {services.map((svc) => (
          <div key={svc.id} style={s.item} onClick={() => pickService(svc)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{svc.name}</strong>
              <span style={{ color: COLORS.accent, fontWeight: 700 }}>{svc.price > 0 ? `${svc.price.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}</span>
            </div>
            <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>{svc.duration_minutes} min{svc.description ? ` · ${svc.description}` : ''}</div>
          </div>
        ))}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <button style={{ ...s.btnGhost, marginBottom: 12 }} onClick={() => setStep(1)}>← {service.name}</button>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
          {dateOptions.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            const active = date === iso;
            return (
              <div key={iso} onClick={() => pickDate(iso)} style={{
                flex: '0 0 auto', minWidth: 56, textAlign: 'center', padding: '8px 6px', borderRadius: 10, cursor: 'pointer',
                background: active ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})` : COLORS.cardAlt,
                color: active ? '#fff' : COLORS.text, border: `1px solid ${active ? 'transparent' : COLORS.border}`,
              }}>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                <div style={{ fontWeight: 700 }}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>

        {date && loadingSlots && <div style={s.empty}>Recherche des créneaux…</div>}
        {date && !loadingSlots && slots.length === 0 && <div style={s.empty}>Aucun créneau disponible ce jour-là.</div>}
        {date && !loadingSlots && slots.length > 0 && (
          <>
            <div style={s.slotGrid}>
              {slots.map((sl) => (
                <div key={sl.slot_start} style={s.slot(slot?.slot_start === sl.slot_start)} onClick={() => setSlot(sl)}>
                  {sl.slot_start.slice(0, 5)}
                </div>
              ))}
            </div>
            <button style={s.btn} disabled={!slot} onClick={() => setStep(3)}>Continuer</button>
          </>
        )}
      </div>
    );
  }

  // step === 3
  return (
    <div>
      <button style={{ ...s.btnGhost, marginBottom: 12 }} onClick={() => setStep(2)}>← Modifier le créneau</button>
      <div style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 12 }}>
        {service.name} · {new Date(date).toLocaleDateString('fr-FR')} à {slot.slot_start.slice(0, 5)}
      </div>
      <input style={s.input} placeholder="Nom complet *" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
      <input style={s.input} placeholder="Téléphone *" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
      <input style={s.input} placeholder="Email (optionnel)" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
      <input style={s.input} placeholder="Message (optionnel)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      {errorMsg && <div style={{ color: COLORS.danger, fontSize: 13, marginBottom: 10 }}>{errorMsg}</div>}
      <button style={s.btn} disabled={submitting} onClick={submit}>{submitting ? 'Réservation…' : 'Confirmer la réservation'}</button>
    </div>
  );
}

// ============================================================
// INSCRIPTION À UN ÉVÉNEMENT
// ============================================================
function EventBookingFlow({ profileId, events }) {
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState({ client_name: '', client_phone: '', client_email: '', party_size: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!form.client_name.trim() || !form.client_phone.trim()) {
      setErrorMsg('Ton nom et ton téléphone sont requis.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    const { error } = await supabase.rpc('book_public_event', {
      p_profile_id: profileId,
      p_event_id: event.id,
      p_client_name: form.client_name.trim(),
      p_client_phone: form.client_phone.trim(),
      p_client_email: form.client_email.trim() || null,
      p_party_size: Number(form.party_size) || 1,
    });
    setSubmitting(false);
    if (error) { setErrorMsg(error.message || 'Une erreur est survenue.'); return; }

    // Fire-and-forget : déclenche les automatisations éventuelles.
    triggerNewEventRegistration(profileId, {
      name: form.client_name.trim(),
      phone: form.client_phone.trim(),
      email: form.client_email.trim() || null,
      eventTitle: event.title,
      eventDate: event.event_date,
      partySize: Number(form.party_size) || 1,
    });

    setDone(true);
  };

  if (done) {
    return (
      <div style={s.success}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
        <strong>Inscription confirmée !</strong>
        <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6 }}>{event.title}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        {events.map((ev) => (
          <div key={ev.id} style={s.item} onClick={() => ev.spots_remaining > 0 && setEvent(ev)}>
            <strong>{ev.title}</strong>
            <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>
              {new Date(ev.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {ev.start_time?.slice(0, 5)}
              {ev.location ? ` · ${ev.location}` : ''}
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: ev.spots_remaining > 0 ? COLORS.success : COLORS.danger, fontWeight: 700 }}>
              {ev.spots_remaining > 0 ? `${ev.spots_remaining} place(s) restante(s)` : 'Complet'}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <button style={{ ...s.btnGhost, marginBottom: 12 }} onClick={() => setEvent(null)}>← {event.title}</button>
      <input style={s.input} placeholder="Nom complet *" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
      <input style={s.input} placeholder="Téléphone *" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
      <input style={s.input} placeholder="Email (optionnel)" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
      <label style={{ fontSize: 12, color: COLORS.textMuted, display: 'block', marginBottom: 4 }}>Nombre de places</label>
      <input style={s.input} type="number" min="1" max={event.spots_remaining} value={form.party_size} onChange={(e) => setForm({ ...form, party_size: e.target.value })} />
      {errorMsg && <div style={{ color: COLORS.danger, fontSize: 13, marginBottom: 10 }}>{errorMsg}</div>}
      <button style={s.btn} disabled={submitting} onClick={submit}>{submitting ? 'Inscription…' : "S'inscrire"}</button>
    </div>
  );
}