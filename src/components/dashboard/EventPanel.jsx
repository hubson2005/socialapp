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
  { c1: '#ff6b35', c2: '#f7c948' }, // orange -> jaune
  { c1: '#6366f1', c2: '#a5b4fc' }, // indigo -> lavande
  { c1: '#0f6e56', c2: '#5dcaa5' }, // vert foncé -> vert clair
  { c1: '#db2777', c2: '#f9a8d4' }, // rose -> rose pâle
  { c1: '#0ea5e9', c2: '#7dd3fc' }, // bleu ciel -> bleu clair
  { c1: '#7c3aed', c2: '#c4b5fd' }, // violet -> mauve
  { c1: '#dc2626', c2: '#fca5a5' }, // rouge -> rouge clair
  { c1: '#059669', c2: '#a7f3d0' }, // émeraude -> vert d'eau
  { c1: '#d97706', c2: '#fcd34d' }, // ambre -> jaune doré
  { c1: '#334155', c2: '#94a3b8' }, // ardoise -> gris bleuté
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

const inputClass =
  'w-full bg-[#22252c] border border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder:text-zinc-500 focus:border-orange-500/50 transition';
const labelClass = 'text-sm text-zinc-400 mb-2 block';

export default function EventPanel({ eventId, onChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [editions, setEditions] = useState([]);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(!!eventId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (patch) => setForm((f) => {
    const next = { ...f, ...patch };
    onChange?.(next);
    return next;
  });

  useEffect(() => {
    supabase
      .from('event_editions')
      .select('id, name, starts_at, ends_at')
      .eq('active', true)
      .order('starts_at')
      .then(({ data }) => setEditions(data || []));
  }, []);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    supabase.from('events').select('*').eq('id', eventId).single()
      .then(({ data, error: fetchError }) => {
        setLoading(false);
        if (fetchError || !data) { setError("Impossible de charger l'événement."); return; }
        const loaded = {
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
        };
        setForm(loaded);
        onChange?.(loaded);
        setExpiresAt(data.expires_at);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleAddImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // Le premier segment du chemin doit être user.id pour respecter la policy RLS
    // du bucket (storage.foldername(name))[1] = auth.uid()::text
    const path = `${user.id}/events/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('socialapp-assets').upload(path, file);
    if (uploadError) {
      console.error('Upload error:', uploadError);
      setError("Échec de l'envoi de l'image.");
      return;
    }
    const { data: pub } = supabase.storage.from('socialapp-assets').getPublicUrl(path);
    set({ images: [...form.images, pub.publicUrl] });
  };

  const handleRemoveImage = async (index) => {
  const url = form.images[index];
  const marker = '/socialapp-assets/';
  const markerIndex = url.indexOf(marker);
  if (markerIndex !== -1) {
    const path = decodeURIComponent(url.slice(markerIndex + marker.length));
    await supabase.storage.from('socialapp-assets').remove([path]);
  }
  set({ images: form.images.filter((_, i) => i !== index) });
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

  if (loading) return <p className="text-zinc-400 text-sm">Chargement...</p>;

  return (
    <div className="bg-[#1a1c21] border border-white/10 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-6">Informations événement</h2>

      <div className="flex gap-2 mb-6">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => set({ type: t.id })}
            className={`flex-1 h-9 rounded-xl text-xs font-semibold transition ${
              form.type === t.id
                ? 'bg-orange-500/15 border border-orange-500 text-orange-400'
                : 'bg-[#22252c] border border-white/10 text-zinc-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Titre</label>
          <input className={inputClass} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Mariage Awa & Yves" />
        </div>
        <div>
          <label className={labelClass}>Lieu</label>
          <input className={inputClass} value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="Sofitel Abidjan Hôtel Ivoire" />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClass}>Description</label>
        <textarea rows={3} className={`${inputClass} resize-none`} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Quelques mots sur l'événement..." />
      </div>

      {form.type !== 'expo_temp' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelClass}>Date et heure</label>
              <input type="datetime-local" className={inputClass} value={form.eventDate} onChange={(e) => set({ eventDate: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Numéro WhatsApp (RSVP)</label>
              <input className={inputClass} value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+225 07 00 00 00 00" />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Lien de réservation externe</label>
            <input className={inputClass} value={form.bookingUrl} onChange={(e) => set({ bookingUrl: e.target.value })} placeholder="https://..." />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelClass}>Édition du salon</label>
              <select className={inputClass} value={form.editionId} onChange={(e) => set({ editionId: e.target.value })}>
                <option value="">Sélectionner...</option>
                {editions.map((ed) => (
                  <option key={ed.id} value={ed.id}>{ed.name} — {formatRange(ed.starts_at, ed.ends_at)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Numéro de stand</label>
              <input className={inputClass} value={form.standNumber} onChange={(e) => set({ standNumber: e.target.value })} placeholder="Hall 3, stand B-12" />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Produits / services présentés</label>
            <textarea rows={2} className={`${inputClass} resize-none`} value={form.products} onChange={(e) => set({ products: e.target.value })} placeholder="Mobilier bois massif, agencement sur-mesure..." />
          </div>
          <div className="mt-4">
            <label className={labelClass}>Numéro WhatsApp (contact)</label>
            <input className={inputClass} value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+225 07 00 00 00 00" />
          </div>

          {expiresAt && (
            <div className="mt-4 flex items-center justify-between bg-[#22252c] border border-white/10 rounded-xl px-4 py-3">
              <span className="text-sm text-zinc-400">Carte active jusqu'au</span>
              <span className="text-sm font-semibold">
                {new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </>
      )}

      <div className="mt-6">
  <label className={labelClass}>Galerie médias</label>
  <div className="flex gap-3 flex-wrap">
    {form.images.map((src, i) => (
      <div key={i} className="relative w-16 h-16">
        <img src={src} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
        <button
          type="button"
          onClick={() => handleRemoveImage(i)}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-[11px] font-bold text-white transition"
          aria-label="Supprimer l'image"
        >
          ×
        </button>
      </div>
    ))}
    <label className="w-16 h-16 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-zinc-500 cursor-pointer hover:border-orange-500/50 transition">
      +
      <input type="file" accept="image/*" onChange={handleAddImage} hidden />
    </label>
  </div>
</div>

      <div className="mt-6">
        <label className={labelClass}>Thème</label>
        <div className="flex gap-3 flex-wrap">
          {THEMES.map((t) => (
            <button
              key={t.c1}
              type="button"
              onClick={() => set({ color1: t.c1, color2: t.c2 })}
              className="w-7 h-7 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${t.c1}, ${t.c2})`,
                boxShadow: form.color1 === t.c1 ? '0 0 0 2px #fff, 0 0 0 4px ' + t.c1 : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mt-4">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 bg-orange-500 hover:bg-orange-600 transition rounded-xl py-3 font-semibold text-sm"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  );
}

function formatRange(start, end) {
  const opts = { day: 'numeric', month: 'short' };
  const s = new Date(start).toLocaleDateString('fr-FR', opts);
  const e = new Date(end).toLocaleDateString('fr-FR', opts);
  return `${s} au ${e}`;
}