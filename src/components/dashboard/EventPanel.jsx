import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';
import { makeSlug } from '../../lib/eventDraft';

const TYPES = [
  { id: 'mariage', label: 'Mariage / soirée' },
  { id: 'custom', label: 'Personnalisé' },
  { id: 'expo_temp', label: 'Carte exposant' },
];

const THEMES = [
  { c1: '#ff6b35', c2: '#f7c948' },
  { c1: '#6366f1', c2: '#a5b4fc' },
  { c1: '#0f6e56', c2: '#5dcaa5' },
];

const emptyForm = {
  type: 'mariage',
  title: '',
  location: '',
  description: '',
  eventDate: '',
  whatsapp: '',
  bookingUrl: '',
  editionId: '',
  standNumber: '',
  products: '',
  images: [],
  color1: THEMES[0].c1,
  color2: THEMES[0].c2,
};

export default function EventPanel({ eventId }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [editions, setEditions] = useState([]);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(!!eventId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // ── Charger les éditions de salons actives (pour le type expo_temp) ──
  useEffect(() => {
    supabase
      .from('event_editions')
      .select('id, name, starts_at, ends_at')
      .eq('active', true)
      .order('starts_at')
      .then(({ data }) => setEditions(data || []));
  }, []);

  // ── Charger l'événement existant, le cas échéant ──
  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    supabase.from('events').select('*').eq('id', eventId).single()
      .then(({ data, error: fetchError }) => {
        setLoading(false);
        if (fetchError || !data) { setError("Impossible de charger l'événement."); return; }
        setForm({
          type: data.type,
          title: data.title || '',
          location: data.location || '',
          description: data.description || '',
          eventDate: data.event_date ? data.event_date.slice(0, 16) : '',
          whatsapp: data.whatsapp || '',
          bookingUrl: data.booking_url || '',
          editionId: data.edition_id || '',
          standNumber: data.stand_number || '',
          products: data.products || '',
          images: data.images || [],
          color1: data.color1 || THEMES[0].c1,
          color2: data.color2 || THEMES[0].c2,
        });
        setExpiresAt(data.expires_at);
      });
  }, [eventId]);

  // ── Ajout d'une image (upload direct vers le bucket public 'event-media') ──
  const handleAddImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `events/${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('socialapp-assets').upload(path, file);
    if (uploadError) { setError("Échec de l'envoi de l'image."); return; }
    const { data: pub } = supabase.storage.from('socialapp-assets').getPublicUrl(path);
    set({ images: [...form.images, pub.publicUrl] });
  };

  const validate = () => {
    if (!form.title.trim()) return 'Ajoutez au moins un titre.';
    if (form.type === 'expo_temp' && !form.editionId) return 'Choisissez une édition de salon.';
    return '';
  };

  const handleSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setError('');
    setSaving(true);

    const payload = {
      type: form.type,
      title: form.title,
      location: form.location || null,
      description: form.description || null,
      images: form.images,
      color1: form.color1,
      color2: form.color2,
      event_date: form.type !== 'expo_temp' && form.eventDate ? new Date(form.eventDate).toISOString() : null,
      whatsapp: form.whatsapp || null,
      booking_url: form.type !== 'expo_temp' ? (form.bookingUrl || null) : null,
      edition_id: form.type === 'expo_temp' ? (form.editionId || null) : null,
      stand_number: form.type === 'expo_temp' ? (form.standNumber || null) : null,
      products: form.type === 'expo_temp' ? (form.products || null) : null,
    };

    let result;
    if (eventId) {
      result = await supabase.from('events').update(payload).eq('id', eventId).select().single();
    } else {
      result = await supabase.from('events').insert({
        ...payload,
        owner_user_id: user.id,
        slug: makeSlug(form.title),
      }).select().single();
    }

    setSaving(false);
    if (result.error) { setError('Une erreur est survenue, réessayez.'); return; }
    navigate(`/dashboard/events/${result.data.id}`);
  };

  if (loading) return <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Chargement...</p>;

  const showExpiryLine = form.type === 'expo_temp' && expiresAt;

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 12, border: '0.5px solid var(--border)', padding: '1.25rem', maxWidth: 520 }}>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => set({ type: t.id })}
            style={{
              flex: 1, height: 32, fontSize: 12, borderRadius: 'var(--radius)',
              border: `0.5px solid ${form.type === t.id ? 'var(--border-accent)' : 'var(--border)'}`,
              background: form.type === t.id ? 'var(--bg-accent)' : 'transparent',
              color: form.type === t.id ? 'var(--text-accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Field label="Titre">
        <input type="text" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Mariage Awa & Yves" style={inputStyle} />
      </Field>

      <Field label="Lieu">
        <input type="text" value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="Sofitel Abidjan Hôtel Ivoire" style={inputStyle} />
      </Field>

      <Field label="Description">
        <textarea rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Quelques mots sur l'événement..." style={{ ...inputStyle, resize: 'none', height: 'auto', padding: '8px 12px' }} />
      </Field>

      {form.type !== 'expo_temp' ? (
        <>
          <Field label="Date et heure">
            <input type="datetime-local" value={form.eventDate} onChange={(e) => set({ eventDate: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Numéro WhatsApp (RSVP)">
            <input type="text" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+225 07 00 00 00 00" style={inputStyle} />
          </Field>
          <Field label="Lien de réservation externe">
            <input type="text" value={form.bookingUrl} onChange={(e) => set({ bookingUrl: e.target.value })} placeholder="https://..." style={inputStyle} />
          </Field>
        </>
      ) : (
        <>
          <Field label="Édition du salon">
            <select value={form.editionId} onChange={(e) => set({ editionId: e.target.value })} style={inputStyle}>
              <option value="">Sélectionner...</option>
              {editions.map((ed) => (
                <option key={ed.id} value={ed.id}>{ed.name} — {formatRange(ed.starts_at, ed.ends_at)}</option>
              ))}
            </select>
          </Field>
          <Field label="Numéro de stand">
            <input type="text" value={form.standNumber} onChange={(e) => set({ standNumber: e.target.value })} placeholder="Hall 3, stand B-12" style={inputStyle} />
          </Field>
          <Field label="Produits / services présentés">
            <textarea rows={2} value={form.products} onChange={(e) => set({ products: e.target.value })} placeholder="Mobilier bois massif, agencement sur-mesure..." style={{ ...inputStyle, resize: 'none', height: 'auto', padding: '8px 12px' }} />
          </Field>
          <Field label="Numéro WhatsApp (contact)">
            <input type="text" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+225 07 00 00 00 00" style={inputStyle} />
          </Field>

          {showExpiryLine && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Carte active jusqu'au</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>
                {new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </>
      )}

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 6px' }}>Galerie médias</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {form.images.map((src, i) => (
          <img key={i} src={src} alt="" style={{ width: 56, height: 56, borderRadius: 'var(--radius)', objectFit: 'cover' }} />
        ))}
        <label style={{ width: 56, height: 56, borderRadius: 'var(--radius)', border: '0.5px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
          +
          <input type="file" accept="image/*" onChange={handleAddImage} style={{ display: 'none' }} />
        </label>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 6px' }}>Thème</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {THEMES.map((t) => (
          <button
            key={t.c1}
            type="button"
            onClick={() => set({ color1: t.c1, color2: t.c2 })}
            style={{
              width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
              background: `linear-gradient(135deg, ${t.c1}, ${t.c2})`,
              border: form.color1 === t.c1 ? '2px solid var(--border-accent)' : '0.5px solid var(--border)',
            }}
          />
        ))}
      </div>

      {error && <p style={{ color: 'var(--text-danger)', fontSize: 12, margin: '0 0 12px' }}>{error}</p>}

      <button type="button" onClick={handleSave} disabled={saving} style={{ width: '100%', height: 36, borderRadius: 'var(--radius)', border: '0.5px solid var(--border-strong)', background: 'var(--fill-secondary)', fontSize: 13, cursor: 'pointer' }}>
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{label}</p>
      {children}
    </>
  );
}

function formatRange(start, end) {
  const opts = { day: 'numeric', month: 'short' };
  const s = new Date(start).toLocaleDateString('fr-FR', opts);
  const e = new Date(end).toLocaleDateString('fr-FR', opts);
  return `${s} au ${e}`;
}

const inputStyle = {
  width: '100%',
  height: 36,
  borderRadius: 'var(--radius)',
  border: '0.5px solid var(--border)',
  background: 'var(--surface-1)',
  color: 'var(--text-primary)',
  padding: '0 12px',
  marginBottom: 14,
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};