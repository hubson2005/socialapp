import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "../../supabase";

// ============================================================
// THEME — dark, cohérent avec le reste du dashboard SocialApp
// ============================================================
const COLORS = {
  bg: '#060412',
  panel: '#0c0d1a',
  card: '#11101f',
  cardAlt: '#161528',
  border: 'rgba(167,139,250,0.14)',
  borderStrong: 'rgba(167,139,250,0.28)',
  accent: '#a78bfa',
  accent2: '#6c63ff',
  text: '#f5f3ff',
  textMuted: '#8b87a0',
  danger: '#f87171',
  success: '#34d399',
  warning: '#fbbf24',
  blue: '#60a5fa',
};

const s = {
  wrap: { background: COLORS.bg, color: COLORS.text, borderRadius: 16, padding: 20, fontFamily: 'inherit' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  btn: {
    background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`, color: '#fff', border: 'none',
    borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(108,99,255,0.35)', display: 'flex', alignItems: 'center', gap: 8,
  },
  btnGhost: {
    background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`,
    borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer',
  },
  btnIcon: {
    background: COLORS.cardAlt, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`,
    borderRadius: 8, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 14,
  },
  btnDanger: {
    background: 'rgba(248,113,113,0.12)', color: COLORS.danger, border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: 8, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14,
  },
  // Les propriétés responsive (colonnes, wrap, overflow) vivent dans les
  // classes CSS injectées (bcp-stats / bcp-main / bcp-tabs) plutôt qu'ici,
  // car un style inline a toujours priorité sur une media query CSS.
  statsGrid: { gap: 14, marginBottom: 20 },
  statCard: { background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 18, display: 'flex', gap: 14, alignItems: 'center' },
  statIcon: (color) => ({
    width: 48, height: 48, borderRadius: 12, background: `${color}22`, color,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
  }),
  statValue: { fontSize: 26, fontWeight: 800, lineHeight: 1.1 },
  statLabel: { fontSize: 13, fontWeight: 600, marginTop: 2 },
  statSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  mainGrid: { gap: 18, alignItems: 'start' },
  tabs: { display: 'flex', gap: 8, marginBottom: 18 },
  tab: (active) => ({
    padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
    background: active ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})` : COLORS.panel,
    color: active ? '#fff' : COLORS.textMuted, border: `1px solid ${active ? 'transparent' : COLORS.border}`,
    transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6,
  }),
  card: { background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18, marginBottom: 14 },
  row: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  input: {
    background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px',
    color: COLORS.text, fontSize: 14, outline: 'none', flex: '1 1 160px',
  },
  label: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4, display: 'block', fontWeight: 600 },
  badge: (color) => ({
    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
    background: `${color}22`, color, textTransform: 'uppercase', letterSpacing: 0.3,
  }),
  empty: { textAlign: 'center', padding: 40, color: COLORS.textMuted, fontSize: 14 },
  sidebarCard: { background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 16, marginBottom: 16 },
};

const DAYS_MON_FIRST = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const STATUS_COLORS = { pending: COLORS.warning, confirmed: COLORS.success, cancelled: COLORS.danger, completed: COLORS.accent, no_show: COLORS.textMuted };
const STATUS_LABELS = { pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé', completed: 'Terminé', no_show: 'Absent' };
const SERVICE_ICON_COLORS = [COLORS.accent, COLORS.blue, COLORS.success, COLORS.warning];

// Media queries : mobile < 640px (Android/iPhone), tablette 640–1023px,
// desktop >= 1024px (iPad du mockup en landscape ≈ dashboard desktop).
// Injecté une seule fois ; les propriétés responsive ne sont PAS dupliquées
// en inline style ci-dessus pour laisser ces règles s'appliquer.
const RESPONSIVE_CSS = `
.bcp-stats { display: grid; grid-template-columns: repeat(4, 1fr); }
.bcp-main { display: grid; grid-template-columns: minmax(0,1fr) 320px; }
.bcp-tabs { overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.bcp-tabs::-webkit-scrollbar { display: none; }
.bcp-sidebar-desktop { display: block; }
.bcp-recent-mobile { display: none; }
.bcp-svc-actions { display: flex; }
.bcp-svc-chevron { display: none; }
@media (max-width: 1023px) {
  .bcp-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 899px) {
  .bcp-main { grid-template-columns: 1fr; }
  .bcp-sidebar-desktop { display: none; }
  .bcp-recent-mobile { display: block; }
}
@media (max-width: 639px) {
  .bcp-svc-actions { display: none; }
  .bcp-svc-chevron { display: inline-flex; }
}
`;

const dateKey = (d) => {
  const dt = (d instanceof Date) ? d : new Date(d);
  return dt.toISOString().slice(0, 10);
};
const fmtDateFr = (d) => (d instanceof Date ? d : new Date(d)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function BookingCalendarPanel({ profileId }) {
  const [tab, setTab] = useState('services');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [overview, setOverview] = useState({ services: [], bookings: [], loading: true });
  const [quickForm, setQuickForm] = useState(null); // formulaire "Nouveau rendez-vous"

  // Chargement léger (lecture seule) pour les stats, le calendrier et l'agenda.
  // Les onglets ci-dessous gèrent leurs propres opérations CRUD ; ils appellent
  // refreshOverview() après chaque création/modification/suppression pour que
  // les stats et le calendrier restent synchronisés instantanément.
  const loadOverview = useCallback(async () => {
    const [svcRes, bkRes] = await Promise.all([
      supabase.from('booking_services').select('id, is_active').eq('profile_id', profileId),
      supabase
        .from('bookings')
        .select('id, booking_date, start_time, end_time, status, client_name, party_size, service_id, event_id, booking_services(name,color), booking_events(title)')
        .eq('profile_id', profileId)
        .order('booking_date', { ascending: false })
        .limit(500),
    ]);
    setOverview({
      services: svcRes.data || [],
      bookings: bkRes.data || [],
      loading: false,
    });
  }, [profileId]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  // ---------- Stats ----------
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const activeServicesCount = overview.services.filter((sv) => sv.is_active).length;
  const monthBookings = overview.bookings.filter((b) => {
    const d = new Date(b.booking_date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const todayBookings = overview.bookings.filter((b) => dateKey(b.booking_date) === dateKey(today));
  const confirmationRate = monthBookings.length
    ? Math.round((monthBookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length / monthBookings.length) * 100)
    : 0;

  // ---------- Calendrier & agenda ----------
  const bookingsByDate = useMemo(() => {
    const map = {};
    overview.bookings.forEach((b) => {
      const k = dateKey(b.booking_date);
      if (!map[k]) map[k] = [];
      map[k].push(b);
    });
    return map;
  }, [overview.bookings]);

  const agendaForSelected = (bookingsByDate[dateKey(selectedDate)] || [])
    .slice()
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  const goToBookingsTab = () => setTab('bookings');

  return (
    <div style={s.wrap}>
      {/* HEADER */}
      <div style={s.headerRow}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            📅 Calendrier de réservation
          </h2>
          <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: 14 }}>
            Gère tes services, disponibilités et réservations en toute simplicité.
          </p>
        </div>
        <button style={s.btn} onClick={() => { setTab('bookings'); setQuickForm({ booking_date: dateKey(selectedDate) }); }}>
          + Nouveau rendez-vous
        </button>
      </div>

      {/* CSS responsive — mobile / tablette / desktop (voir mockups) */}
      <style>{RESPONSIVE_CSS}</style>

      {/* STATS */}
      <div className="bcp-stats" style={s.statsGrid}>
        <StatCard icon="📦" color={COLORS.accent} value={activeServicesCount} label="Services" sub="Actifs dans votre agenda" />
        <StatCard icon="📅" color={COLORS.blue} value={monthBookings.length} label="Réservations" sub="Ce mois-ci" />
        <StatCard icon="🕒" color={COLORS.success} value={todayBookings.length} label="Aujourd'hui" sub="Rendez-vous prévus" />
        <StatCard icon="📈" color={COLORS.warning} value={`${confirmationRate}%`} label="Confirmées" sub="Taux de confirmation" />
      </div>

      {/* CONTENU PRINCIPAL + SIDEBAR (sidebar masquée < 900px, remplacée par un flux "Réservations récentes") */}
      <div className="bcp-main" style={s.mainGrid}>
        <div>
          <div className="bcp-tabs" style={s.tabs}>
            {[
              ['services', '📦 Services'],
              ['availability', '🕒 Disponibilités'],
              ['events', '✨ Évènements'],
              ['bookings', '📅 Réservations'],
              ['stats', '📊 Statistiques'],
            ].map(([key, label]) => (
              <div key={key} style={s.tab(tab === key)} onClick={() => setTab(key)}>{label}</div>
            ))}
          </div>

          {tab === 'services' && <ServicesTab profileId={profileId} onDataChanged={loadOverview} />}
          {tab === 'availability' && <AvailabilityTab profileId={profileId} />}
          {tab === 'events' && <EventsTab profileId={profileId} onDataChanged={loadOverview} />}
          {tab === 'bookings' && (
            <BookingsTab
              profileId={profileId}
              services={overview.services}
              onDataChanged={loadOverview}
              quickForm={quickForm}
              setQuickForm={setQuickForm}
            />
          )}
          {tab === 'stats' && <StatsTab overview={overview} />}

          {/* Repli mobile : remplace la sidebar calendrier/agenda par un flux compact */}
          <div className="bcp-recent-mobile">
            <RecentBookingsCard bookings={overview.bookings} onSeeAll={goToBookingsTab} />
          </div>
        </div>

        <div className="bcp-sidebar-desktop">
          <MiniCalendar
            month={calendarMonth}
            setMonth={setCalendarMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            bookingsByDate={bookingsByDate}
          />
          <AgendaPanel selectedDate={selectedDate} bookings={agendaForSelected} onSeeAll={goToBookingsTab} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================
function StatCard({ icon, color, value, label, sub }) {
  return (
    <div style={s.statCard}>
      <div style={s.statIcon(color)}>{icon}</div>
      <div>
        <div style={s.statValue}>{value}</div>
        <div style={{ ...s.statLabel, color }}>{label}</div>
        <div style={s.statSub}>{sub}</div>
      </div>
    </div>
  );
}

// ============================================================
// MINI CALENDRIER (mois, sélection de jour, points de RDV)
// ============================================================
function MiniCalendar({ month, setMonth, selectedDate, setSelectedDate, bookingsByDate }) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstOfMonth = new Date(year, m, 1);
  // Grille lundi-first : décalage entre 0 (lundi) et 6 (dimanche)
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, m, 0).getDate();

  const cells = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, outside: true, date: new Date(year, m - 1, daysInPrevMonth - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, outside: false, date: new Date(year, m, d) });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const next = cells.length - (firstWeekday + daysInMonth) + 1;
    cells.push({ day: next, outside: true, date: new Date(year, m + 1, next) });
    if (cells.length >= 42) break;
  }

  const monthLabel = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div style={s.sidebarCard}>
      <div style={{ ...s.row, justifyContent: 'space-between', marginBottom: 14 }}>
        <strong style={{ textTransform: 'capitalize', fontSize: 15 }}>{monthLabel}</strong>
        <div style={s.row}>
          <div style={s.btnIcon} onClick={() => setMonth(new Date(year, m - 1, 1))}>‹</div>
          <div style={s.btnIcon} onClick={() => setMonth(new Date(year, m + 1, 1))}>›</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAYS_MON_FIRST.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((c, i) => {
          const key = dateKey(c.date);
          const hasBookings = !!bookingsByDate[key]?.length;
          const isSelected = dateKey(selectedDate) === key;
          const isToday = dateKey(new Date()) === key;
          return (
            <div
              key={i}
              onClick={() => setSelectedDate(c.date)}
              style={{
                textAlign: 'center', padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                color: c.outside ? 'rgba(139,135,160,0.4)' : (isSelected ? '#fff' : COLORS.text),
                background: isSelected ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})` : (isToday ? COLORS.cardAlt : 'transparent'),
                fontWeight: isToday || isSelected ? 700 : 500,
                position: 'relative',
              }}
            >
              {c.day}
              {hasBookings && !isSelected && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: COLORS.accent, margin: '2px auto 0' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// AGENDA DU JOUR SÉLECTIONNÉ
// ============================================================
function AgendaPanel({ selectedDate, bookings, onSeeAll }) {
  return (
    <div style={s.sidebarCard}>
      <strong style={{ display: 'block', marginBottom: 12, fontSize: 15 }}>
        Agenda du {fmtDateFr(selectedDate)}
      </strong>
      {bookings.length === 0 && <div style={{ ...s.empty, padding: 20 }}>Aucune réservation ce jour.</div>}
      {bookings.map((b) => {
        const color = b.booking_services?.color || COLORS.accent;
        const label = b.booking_services?.name || b.booking_events?.title || 'Réservation';
        return (
          <div key={b.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderTop: `1px solid ${COLORS.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>{b.start_time?.slice(0, 5)}{b.end_time ? `–${b.end_time.slice(0, 5)}` : ''}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>{b.client_name}</div>
            </div>
            <span style={s.badge(STATUS_COLORS[b.status])}>{STATUS_LABELS[b.status]}</span>
          </div>
        );
      })}
      <button style={{ ...s.btnGhost, width: '100%', textAlign: 'center', marginTop: 14, color: COLORS.accent, borderColor: COLORS.borderStrong }} onClick={onSeeAll}>
        Voir l'agenda complet →
      </button>
    </div>
  );
}

// ============================================================
// RÉSERVATIONS RÉCENTES (repli mobile quand la sidebar est masquée)
// ============================================================
function RecentBookingsCard({ bookings, onSeeAll }) {
  const recent = bookings
    .slice()
    .sort((a, b) => (b.booking_date + (b.start_time || '')).localeCompare(a.booking_date + (a.start_time || '')))
    .slice(0, 4);

  return (
    <div style={s.card}>
      <strong style={{ display: 'block', marginBottom: 12 }}>Réservations récentes</strong>
      {recent.length === 0 && <div style={{ ...s.empty, padding: 20 }}>Aucune réservation pour l'instant.</div>}
      {recent.map((b) => {
        const label = b.booking_services?.name || b.booking_events?.title || 'Réservation';
        return (
          <div key={b.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${COLORS.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{b.client_name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>{label}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                {new Date(b.booking_date).toLocaleDateString('fr-FR')} · {b.start_time?.slice(0, 5)}
              </div>
              <span style={s.badge(STATUS_COLORS[b.status])}>{STATUS_LABELS[b.status]}</span>
            </div>
          </div>
        );
      })}
      <button style={{ ...s.btnGhost, width: '100%', textAlign: 'center', marginTop: 14, color: COLORS.accent, borderColor: COLORS.borderStrong }} onClick={onSeeAll}>
        Voir toutes les réservations →
      </button>
    </div>
  );
}

// ============================================================
// SERVICES
// ============================================================
function ServicesTab({ profileId, onDataChanged }) {
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

  const refresh = () => { load(); onDataChanged?.(); };

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
    refresh();
  };

  const duplicate = async (svc) => {
    const { id, created_at, ...rest } = svc;
    await supabase.from('booking_services').insert({ ...rest, name: `${svc.name} (copie)` });
    refresh();
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce service ?')) return;
    await supabase.from('booking_services').delete().eq('id', id);
    refresh();
  };

  const toggleActive = async (svc) => {
    await supabase.from('booking_services').update({ is_active: !svc.is_active }).eq('id', svc.id);
    refresh();
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

      {services.map((svc, i) => (
        <div key={svc.id} style={s.card}>
          <div style={{ ...s.row, justifyContent: 'space-between' }}>
            <div style={s.row}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${svc.color || SERVICE_ICON_COLORS[i % 4]}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: svc.color || SERVICE_ICON_COLORS[i % 4], display: 'inline-block' }} />
              </div>
              <div>
                <strong>{svc.name}</strong>{' '}
                <span style={s.badge(svc.is_active ? COLORS.success : COLORS.textMuted)}>{svc.is_active ? 'Actif' : 'Inactif'}</span>
              </div>
            </div>
            <div className="bcp-svc-actions" style={s.row}>
              <button style={s.btnGhost} onClick={() => toggleActive(svc)}>{svc.is_active ? 'Désactiver' : 'Activer'}</button>
              <div style={s.btnIcon} title="Modifier" onClick={() => setForm(svc)}>✎</div>
              <div style={s.btnIcon} title="Dupliquer" onClick={(e) => { e.stopPropagation(); duplicate(svc); }}>⧉</div>
              <div style={s.btnDanger} title="Supprimer" onClick={(e) => { e.stopPropagation(); remove(svc.id); }}>🗑</div>
            </div>
            {/* Mobile (< 640px) : la ligne entière ouvre l'édition, remplace les icônes par un chevron */}
            <div
              className="bcp-svc-chevron"
              style={{ color: COLORS.textMuted, fontSize: 18, cursor: 'pointer' }}
              onClick={() => setForm(svc)}
            >
              ›
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

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      supabase.from('booking_availability').select('*').eq('profile_id', profileId).order('day_of_week'),
      supabase.from('booking_blocked_dates').select('*').eq('profile_id', profileId).order('blocked_date'),
    ]);
    setSlots(a.data || []);
    setBlocked(b.data || []);
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const slotsByDay = (day) => slots.filter((sl) => sl.day_of_week === day);

  const addSlot = async (day) => {
    await supabase.from('booking_availability').insert({
      profile_id: profileId, day_of_week: day, start_time: '09:00', end_time: '17:00', is_active: true,
    });
    load();
  };

  // On envoie toujours les deux champs (start_time + end_time) ensemble pour
  // éviter que la contrainte SQL CHECK (end_time > start_time) ne rejette
  // une mise à jour intermédiaire valide au final mais invalide ligne par ligne.
  const updateSlot = async (id, field, currentSlot, value) => {
    const next = { ...currentSlot, [field]: value };
    if (next.end_time && next.start_time && next.end_time <= next.start_time) {
      setSlots((prev) => prev.map((sl) => (sl.id === id ? next : sl)));
      return;
    }
    setSlots((prev) => prev.map((sl) => (sl.id === id ? next : sl)));
    const { error } = await supabase
      .from('booking_availability')
      .update({ start_time: next.start_time, end_time: next.end_time })
      .eq('id', id);
    if (error) {
      console.error('updateSlot error:', error);
      load();
    }
  };

  const removeSlot = async (id) => {
    await supabase.from('booking_availability').delete().eq('id', id);
    load();
  };

  const addBlock = async () => {
    if (!newBlock.blocked_date) return alert('Choisis une date.');
    await supabase.from('booking_blocked_dates').insert({ profile_id: profileId, ...newBlock });
    setNewBlock({ blocked_date: '', reason: '' });
    load();
  };

  const removeBlock = async (id) => {
    await supabase.from('booking_blocked_dates').delete().eq('id', id);
    load();
  };

  if (loading) return <div style={s.empty}>Chargement…</div>;

  return (
    <div>
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
                <input style={{ ...s.input, flex: '0 1 110px' }} type="time" value={sl.start_time?.slice(0, 5)} onChange={(e) => updateSlot(sl.id, 'start_time', sl, e.target.value)} />
                <span style={{ color: COLORS.textMuted }}>à</span>
                <input style={{ ...s.input, flex: '0 1 110px' }} type="time" value={sl.end_time?.slice(0, 5)} onChange={(e) => updateSlot(sl.id, 'end_time', sl, e.target.value)} />
                <div style={s.btnDanger} onClick={() => removeSlot(sl.id)}>✕</div>
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
function EventsTab({ profileId, onDataChanged }) {
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

  const refresh = () => { load(); onDataChanged?.(); };

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
    refresh();
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    await supabase.from('booking_events').delete().eq('id', id);
    refresh();
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
              <div style={s.btnIcon} title="Modifier" onClick={() => setForm(ev)}>✎</div>
              <div style={s.btnDanger} title="Supprimer" onClick={() => remove(ev.id)}>🗑</div>
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
// RÉSERVATIONS (liste + gestion statut + création manuelle rapide)
// ============================================================
function BookingsTab({ profileId, services, onDataChanged, quickForm, setQuickForm }) {
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

  const refresh = () => { load(); onDataChanged?.(); };

  const setStatus = async (id, status) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    refresh();
  };

  // Création manuelle depuis le bouton "+ Nouveau rendez-vous".
  // ⚠️ Hypothèse : la colonne de clé étrangère vers booking_services
  // s'appelle `service_id` (déduite de l'embed booking_services(...)).
  // Vérifie/ajuste ce nom si ta table utilise un autre nom de colonne.
  const saveQuickBooking = async () => {
    if (!quickForm?.client_name?.trim()) return alert('Le nom du client est requis.');
    if (!quickForm?.service_id) return alert('Choisis un service.');
    if (!quickForm?.booking_date || !quickForm?.start_time) return alert('Date et heure sont requises.');

    const svc = services.find((sv) => String(sv.id) === String(quickForm.service_id));
    let end_time = quickForm.end_time;
    if (!end_time && svc?.duration_minutes) {
      const [h, m] = quickForm.start_time.split(':').map(Number);
      const total = h * 60 + m + svc.duration_minutes;
      end_time = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    }

    const { error } = await supabase.from('bookings').insert({
      profile_id: profileId,
      service_id: quickForm.service_id,
      client_name: quickForm.client_name.trim(),
      client_phone: quickForm.client_phone?.trim() || null,
      client_email: quickForm.client_email?.trim() || null,
      booking_date: quickForm.booking_date,
      start_time: quickForm.start_time,
      end_time: end_time || null,
      status: 'confirmed',
    });
    if (error) {
      console.error(error);
      return alert("Erreur lors de la création. Vérifie le nom de la colonne service_id dans ta table `bookings`.");
    }
    setQuickForm(null);
    refresh();
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) return <div style={s.empty}>Chargement…</div>;

  return (
    <div>
      {quickForm && (
        <div style={s.card}>
          <strong style={{ display: 'block', marginBottom: 12 }}>Nouveau rendez-vous</strong>
          <div style={s.row}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={s.label}>Client *</label>
              <input style={s.input} value={quickForm.client_name || ''} onChange={(e) => setQuickForm({ ...quickForm, client_name: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={s.label}>Service *</label>
              <select style={{ ...s.input, appearance: 'auto' }} value={quickForm.service_id || ''} onChange={(e) => setQuickForm({ ...quickForm, service_id: e.target.value })}>
                <option value="">Choisir…</option>
                {services.map((sv) => <option key={sv.id} value={sv.id}>{sv.name || `Service #${sv.id}`}</option>)}
              </select>
            </div>
          </div>
          <div style={{ ...s.row, marginTop: 10 }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={s.label}>Date *</label>
              <input style={s.input} type="date" value={quickForm.booking_date || ''} onChange={(e) => setQuickForm({ ...quickForm, booking_date: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 110px' }}>
              <label style={s.label}>Heure *</label>
              <input style={s.input} type="time" value={quickForm.start_time || ''} onChange={(e) => setQuickForm({ ...quickForm, start_time: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={s.label}>Téléphone</label>
              <input style={s.input} value={quickForm.client_phone || ''} onChange={(e) => setQuickForm({ ...quickForm, client_phone: e.target.value })} />
            </div>
          </div>
          <div style={{ ...s.row, marginTop: 14, justifyContent: 'flex-end' }}>
            <button style={s.btnGhost} onClick={() => setQuickForm(null)}>Annuler</button>
            <button style={s.btn} onClick={saveQuickBooking}>Créer le rendez-vous</button>
          </div>
        </div>
      )}

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

// ============================================================
// STATISTIQUES
// ============================================================
function StatsTab({ overview }) {
  const bookings = overview.bookings;
  const total = bookings.length;

  const byStatus = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map((st) => ({
    st, count: bookings.filter((b) => b.status === st).length,
  }));

  const byService = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const name = b.booking_services?.name || b.booking_events?.title || 'Autre';
      const color = b.booking_services?.color || COLORS.accent;
      if (!map[name]) map[name] = { name, color, count: 0 };
      map[name].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [bookings]);

  const maxServiceCount = Math.max(1, ...byService.map((x) => x.count));

  return (
    <div>
      <div style={s.card}>
        <strong style={{ display: 'block', marginBottom: 14 }}>Répartition par statut ({total} réservation(s) au total)</strong>
        {byStatus.map(({ st, count }) => (
          <div key={st} style={{ marginBottom: 10 }}>
            <div style={{ ...s.row, justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>{STATUS_LABELS[st]}</span>
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>{count}</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: COLORS.cardAlt, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${total ? (count / total) * 100 : 0}%`,
                background: STATUS_COLORS[st], borderRadius: 999,
              }} />
            </div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <strong style={{ display: 'block', marginBottom: 14 }}>Services les plus réservés</strong>
        {byService.length === 0 && <div style={s.empty}>Pas encore de données.</div>}
        {byService.map((sv) => (
          <div key={sv.name} style={{ marginBottom: 10 }}>
            <div style={{ ...s.row, justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>{sv.name}</span>
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>{sv.count}</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: COLORS.cardAlt, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${(sv.count / maxServiceCount) * 100}%`,
                background: sv.color, borderRadius: 999,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}