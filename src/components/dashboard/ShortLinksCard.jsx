import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Plus, Copy, Trash2, ExternalLink, Loader2, Shuffle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';

// Alphabet sans caractères ambigus (pas de 0/O, 1/l/I) — plus lisible sur un
// flyer ou une affiche imprimée où le raccourci est retapé à la main.
const SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const SLUG_REGEX = /^[a-z0-9-]{3,30}$/;

const randomSlug = (len = 6) =>
  Array.from({ length: len }, () => SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)]).join('');

const db = {
  list: async (profileId) => {
    const { data, error } = await supabase
      .from('profile_shortlinks').select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  create: async (row) => {
    const { data, error } = await supabase.from('profile_shortlinks').insert([row]).select().maybeSingle();
    if (error) throw error;
    return data;
  },
  remove: async (id) => {
    const { error } = await supabase.from('profile_shortlinks').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
};

// Copie robuste en 2 paliers (même logique que dans FormsPanel, dupliquée ici
// car ce composant est volontairement autonome, sans dépendance croisée).
const copyToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); toast.success('Lien copié !'); return; }
    catch (err) { console.warn('[ShortLinksCard] clipboard API a échoué :', err); }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (!ok) throw new Error('execCommand a échoué');
    toast.success('Lien copié !');
  } catch (err) {
    console.warn('[ShortLinksCard] execCommand fallback a échoué :', err);
    toast.error('Copie automatique bloquée — sélectionnez le lien manuellement');
  }
};

const isUniqueViolation = (err) => err?.code === '23505' || /duplicate key/i.test(err?.message || '');

export default function ShortLinksCard({ profileId, isActivated }) {
  const queryClient = useQueryClient();
  const [customSlug, setCustomSlug] = useState('');
  const [creating, setCreating]     = useState(false);
  const [focused, setFocused]       = useState(false);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['shortlinks', profileId],
    queryFn: () => db.list(profileId),
    enabled: !!profileId && isActivated,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortlinks', profileId] });
      toast.success('Raccourci supprimé');
    },
    onError: (e) => toast.error('Erreur : ' + e.message),
  });

  const shortUrl = (slug) => `${window.location.origin}/s/${slug}`;

  const handleCreate = async (auto) => {
    if (!isActivated) { toast.error('Activez votre compte pour créer des raccourcis'); return; }
    const desired = auto ? '' : customSlug.trim().toLowerCase();
    if (!auto && !SLUG_REGEX.test(desired)) {
      toast.error('3 à 30 caractères : lettres minuscules, chiffres, tirets');
      return;
    }
    setCreating(true);
    try {
      let created = null;
      const maxAttempts = auto ? 5 : 1;
      for (let attempt = 0; attempt < maxAttempts && !created; attempt++) {
        const trySlug = auto ? randomSlug() : desired;
        try {
          created = await db.create({ profile_id: profileId, slug: trySlug });
        } catch (err) {
          if (isUniqueViolation(err)) {
            if (!auto) { toast.error('Ce raccourci est déjà pris, choisissez-en un autre'); setCreating(false); return; }
            continue; // auto-génération : on retente avec un autre slug aléatoire
          }
          throw err;
        }
      }
      if (!created) throw new Error('Impossible de générer un raccourci disponible, réessayez');
      queryClient.invalidateQueries({ queryKey: ['shortlinks', profileId] });
      setCustomSlug('');
      toast.success('Raccourci créé !');
    } catch (err) {
      toast.error('Erreur : ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (link) => {
    if (!window.confirm(`Supprimer le raccourci « /s/${link.slug} » ?`)) return;
    deleteMutation.mutate(link.id);
  };

  if (!isActivated) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px 16px', textAlign: 'center' }}>
        <Lock size={22} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 8px' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600, margin: '0 0 4px' }}>Raccourcis de lien</p>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11.5px', margin: 0 }}>Disponible une fois le compte activé</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Link2 size={13} color="#a78bfa" />
        </div>
        <p style={{ color: 'white', fontSize: '13.5px', fontWeight: 800, margin: 0 }}>Raccourcis de lien</p>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '0 0 14px' }}>
        Créez des liens courts personnalisés vers votre profil public.
      </p>

      {/* Création — alias personnalisé ou génération automatique */}
      <div style={{ display: 'flex', gap: '7px', marginBottom: '14px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: focused ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (focused ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.09)'), borderRadius: '10px', padding: '0 10px', transition: 'background 0.15s ease, border-color 0.15s ease' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', whiteSpace: 'nowrap' }}>/s/</span>
          <input
            type="text"
            value={customSlug}
            onChange={e => setCustomSlug(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(false); }}
            placeholder="mon-alias"
            disabled={creating}
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '13px', padding: '9px 6px' }}
          />
        </div>
        <button
          onClick={() => handleCreate(false)}
          disabled={creating || !customSlug.trim()}
          title="Créer avec cet alias"
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 12px', background: (creating || !customSlug.trim()) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: (creating || !customSlug.trim()) ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '12px', fontWeight: 700, cursor: (creating || !customSlug.trim()) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
        >
          {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        </button>
        <button
          onClick={() => handleCreate(true)}
          disabled={creating}
          title="Générer un alias aléatoire"
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
        >
          <Shuffle size={13} />
        </button>
      </div>

      {/* Liste des raccourcis existants */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '18px' }}>
          <Loader2 size={16} className="animate-spin" color="rgba(167,139,250,0.6)" />
        </div>
      ) : links.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11.5px', textAlign: 'center', padding: '10px 0', margin: 0 }}>
          Aucun raccourci pour l'instant
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {links.map(link => (
            <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '8px 10px' }}>
              <code style={{ flex: 1, minWidth: 0, color: '#c4b5fd', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                /s/{link.slug}
              </code>
              {link.clicks > 0 && (
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', flexShrink: 0 }}>{link.clicks} clic(s)</span>
              )}
              <button onClick={() => copyToClipboard(shortUrl(link.slug))} title="Copier" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                <Copy size={13} />
              </button>
              <a href={shortUrl(link.slug)} target="_blank" rel="noopener noreferrer" title="Ouvrir" style={{ color: 'rgba(255,255,255,0.45)', display: 'flex', flexShrink: 0 }}>
                <ExternalLink size={13} />
              </a>
              <button onClick={() => handleDelete(link)} disabled={deleteMutation.isPending} title="Supprimer" style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.7)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}