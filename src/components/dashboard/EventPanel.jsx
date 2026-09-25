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
  editionName: '',
  standNumber: '',
  products: '',
  images: [],
  bgImage: '',
  color1: THEMES[0].c1,
  color2: THEMES[0].c2,
};

const inputClass =
  'w-full bg-[#22252c] border border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder:text-zinc-500 focus:border-orange-500/50 transition';
const labelClass = 'text-sm text-zinc-400 mb-2 block';

function editionLabel(ed) {
  return `${ed.name} — ${formatRange(ed.starts_at, ed.ends_at)}`;
}

export default function EventPanel({ eventId, onChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [editions, setEditions] = useState([]);
  const [editionQuery, setEditionQuery] = useState('');
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
          editionName: data.edition_name || '',
          standNumber: data.stand_number || '',
          products: data.products || '',
          images: data.images || [],
          bgImage: data.bg_image || '',
          color1: data.color1 || THEMES[0].c1,
          color2: data.color2 || THEMES[0].c2,
        };
        setForm(loaded);
        onChange?.(loaded);
        setExpiresAt(data.expires_at);
        // Si l'édition est liée à une entrée existante, son libellé sera calculé
        // une fois `editions` chargé (effet ci-dessous). Sinon on affiche direct
        // le texte libre déjà enregistré.
        if (!data.edition_id && data.edition_name) setEditionQuery(data.edition_name);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Une fois les éditions chargées, affiche le libellé de l'édition déjà sélectionnée
  useEffect(() => {
    if (!form.editionId || editions.length === 0) return;
    const match = editions.find((ed) => ed.id === form.editionId);
    if (match) setEditionQuery(editionLabel(match));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.editionId, editions]);

  const handleEditionInput = (value) => {
    setEditionQuery(value);
    const match = editions.find((ed) => editionLabel(ed) === value || ed.name === value);
    if (match) {
      // Correspond à une édition existante : on utilise la relation officielle (edition_id)
      set({ editionId: match.id, editionName: '' });
    } else {
      // Saisie libre : jamais stockée dans edition_id (qui reste une clé étrangère valide
      // ou vide), toujours dans edition_name pour ne jamais casser la relation.
      set({ editionId: '', editionName: value });
    }
  };

  const uploadAsset = async (file) => {
    const path = `${user.id}/events/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('socialapp-assets').upload(path, file);
    if (uploadError) throw uploadError;
    const { data: pub } = supabase.storage.from('socialapp-assets').getPublicUrl(path);
    return pub.publicUrl;
  };

  const removeAsset = async (url) => {
    const marker = '/socialapp-assets/';
    const markerIndex = url.indexOf(marker);
    if (markerIndex === -1) return;
    const path = decodeURIComponent(url.slice(markerIndex + marker.length));
    await supabase.storage.from('socialapp-assets').remove([path]);
  };

  const handleAddImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const url = await uploadAsset(file);
      set({ images: [...form.images, url] });
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setError("Échec de l'envoi de l'image.");
    }
  };

  const handleRemoveImage = async (index) => {
    const url = form.images[index];
    try {
      await removeAsset(url);
    } catch (removeError) {
      console.error('Remove error:', removeError);
      setError("Échec de la suppression de l'image.");
      return;
    }
    set({ images: form.images.filter((_, i) => i !== index) });
  };

  const handleAddBanner = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const url = await uploadAsset(file);
      set({ bgImage: url });
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setError("Échec de l'envoi de la bannière.");
    }
  };

  const handleRemoveBanner = async () => {
    if (!form.bgImage) return;
    try {
      await removeAsset(form.bgImage);
    } catch (removeError) {
      console.error('Remove error:', removeError);
      setError('Échec de la suppression de la bannière.');
      return;
    }
    set({ bgImage: '' });
  };

  const validate = () => {
    if (!form.title.trim()) return 'Ajoutez au moins un titre.';
    if (form.type === 'expo_temp' && !form.editionId && !form.editionName.trim()) {
      return 'Choisissez ou saisissez une édition de salon.';
    }
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
      bg_image: form.bgImage || null,
      color1: form.color1,
      color2: form.color2,
      event_date: form.type !== 'expo_temp' && form.eventDate ? new Date(form.eventDate).toISOString() : null,
      whatsapp: form.whatsapp || null,
      booking_url: form.type !== 'expo_temp' ? (form.bookingUrl || null) : null,
      edition_id: form.type === 'expo_temp' ? (form.editionId || null) : null,
      edition_name: form.type === 'expo_temp' ? (form.editionId ? null : (form.editionName || null)) : null,
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
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 mt-4">
            <div>
              <label className={labelClass}>Édition du salon</label>
              <input
                className={inputClass}
                list="editions-options"
                value={editionQuery}
                onChange={(e) => handleEditionInput(e.target.value)}
                placeholder="Sélectionner ou saisir une édition..."
              />
              <datalist id="editions-options">
                {editions.map((ed) => (
                  <option key={ed.id} value={editionLabel(ed)} />
                ))}
              </datalist>
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

      <div className="mt-6">
        <label className={labelClass}>Bannière (image de fond de l'en-tête)</label>
        {form.bgImage ? (
          <div className="relative rounded-xl overflow-hidden border border-white/10 h-28">
            <div
              className="absolute inset-0"
              style={{ backgroundImage: `url(${form.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${form.color1}cc, ${form.color2}cc)`, opacity: 0.78, mixBlendMode: 'multiply' }}
            />
            <button
              type="button"
              onClick={handleRemoveBanner}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-xs font-bold text-white transition"
              aria-label="Supprimer la bannière"
            >
              ×
            </button>
            <p className="absolute bottom-2 left-3 text-[11px] text-white/70" style={{ textShadow: '0 1px 3px rgba(0,0,0,.8)' }}>
              Aperçu tel qu'affiché en filigrane sur la page publique
            </p>
          </div>
        ) : (
          <label className="flex items-center justify-center h-28 rounded-xl border border-dashed border-white/20 text-zinc-500 text-sm cursor-pointer hover:border-orange-500/50 transition">
            + Ajouter une image de bannière
            <input type="file" accept="image/*" onChange={handleAddBanner} hidden />
          </label>
        )}
        <p className="text-[11px] text-zinc-500 mt-2">
          Si aucune bannière n'est ajoutée, la première image de la galerie sera utilisée en filigrane.
        </p>
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