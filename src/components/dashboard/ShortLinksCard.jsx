import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Plus, Copy, Check, ExternalLink, Trash2, Loader2, Shuffle, Lock, MousePointerClick, BarChart2, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import { SHORTLINK_BASE_URL } from '../../hooks/shortlinkConfig';
import ShortLinkResultDisplay from './ShortLinkResultDisplay';

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
  clickEvents: async (shortlinkId, sinceDays = 14) => {
    const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
    const { data, error } = await supabase
      .from('shortlink_clicks').select('clicked_at, referrer')
      .eq('shortlink_id', shortlinkId)
      .gte('clicked_at', since);
    if (error) throw error;
    return data || [];
  },
};

// Regroupe les événements bruts en points quotidiens pour le sparkline, et
// calcule la source la plus fréquente (domaine du referrer, "Direct" si vide).
const summarizeClickEvents = (events, days = 14) => {
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); d.setHours(0, 0, 0, 0);
    return { date: d, count: 0 };
  });
  const refCounts = {};
  events.forEach(ev => {
    const t = new Date(ev.clicked_at); t.setHours(0, 0, 0, 0);
    const bucket = buckets.find(b => b.date.getTime() === t.getTime());
    if (bucket) bucket.count += 1;
    let source = 'Direct';
    if (ev.referrer) {
      try { source = new URL(ev.referrer).hostname.replace(/^www\./, ''); } catch { source = 'Direct'; }
    }
    refCounts[source] = (refCounts[source] || 0) + 1;
  });
  const topSource = Object.entries(refCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return { buckets, topSource, total: events.length };
};

const isUniqueViolation = (err) => err?.code === '23505' || /duplicate key/i.test(err?.message || '');

// Temps relatif compact façon Bitly ("2j", "3h", "à l'instant") — pas de
// dépendance externe, juste des seuils simples.
const relativeTime = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} j`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} mois`;
  return `${Math.floor(mo / 12)} an(s)`;
};

// Couleur de badge dérivée du slug — déterministe, pas de state ni de calcul
// serveur, juste pour distinguer visuellement les liens dans une liste dense.
const BADGE_HUES = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f97316', '#14b8a6'];
const badgeColor = (slug) => {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return BADGE_HUES[hash % BADGE_HUES.length];
};

// Copie robuste en 2 paliers, avec état visuel "copié" au lieu d'un simple toast.
const copyToClipboard = async (text, onDone) => {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); onDone(true); return; }
    catch (err) { console.warn('[ShortLinksCard] clipboard API a échoué :', err); }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (!ok) throw new Error('execCommand a échoué');
    onDone(true);
  } catch (err) {
    console.warn('[ShortLinksCard] execCommand fallback a échoué :', err);
    onDone(false);
  }
};

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ width: '55%', height: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ width: '35%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  );
}

function Sparkline({ buckets }) {
  const max = Math.max(1, ...buckets.map(b => b.count));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '32px' }}>
      {buckets.map((b, i) => (
        <div key={i} title={`${b.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} — ${b.count} clic(s)`}
          style={{
            flex: 1, minWidth: '3px', borderRadius: '2px',
            height: `${Math.max(3, (b.count / max) * 32)}px`,
            background: b.count > 0 ? 'linear-gradient(180deg,#a78bfa,#6366f1)' : 'rgba(255,255,255,0.08)',
          }} />
      ))}
    </div>
  );
}

function AnalyticsPanel({ linkId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['shortlink-clicks', linkId],
    queryFn: () => db.clickEvents(linkId, 14),
  });
  const summary = useMemo(() => summarizeClickEvents(data || [], 14), [data]);

  if (isLoading) {
    return <div style={{ padding: '10px 2px', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Chargement des statistiques…</div>;
  }

  if (summary.total === 0) {
    return <div style={{ padding: '10px 2px', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Aucun clic sur les 14 derniers jours</div>;
  }

  return (
    <div style={{ padding: '10px 2px 4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Sparkline buckets={summary.buckets} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>14 derniers jours</span>
        {summary.topSource && (
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10.5px' }}>
            Principale source : <strong style={{ color: '#c4b5fd' }}>{summary.topSource}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

function LinkRow({ link, domain, onDelete, deleting }) {
  const [copied, setCopied]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const shortUrl = `${domain}/${link.slug}`;
  const hue = useMemo(() => badgeColor(link.slug), [link.slug]);

  const handleCopy = () => {
    copyToClipboard(shortUrl, (ok) => {
      if (ok) {
        setCopied(true);
        toast.success('Lien copié !');
        setTimeout(() => setCopied(false), 1600);
      } else {
        toast.error('Copie automatique bloquée — sélectionnez le lien manuellement');
      }
    });
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 10px 10px 12px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
          background: `${hue}22`, border: `1px solid ${hue}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: hue, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase',
        }}>
          {link.slug.charAt(0)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px', overflow: 'hidden' }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12.5px', flexShrink: 0 }}>{domain.replace(/^https?:\/\//, '')}/</span>
            <span style={{ color: 'white', fontSize: '12.5px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.slug}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.3)', fontSize: '10.5px' }}>
              <MousePointerClick size={10} /> {link.clicks || 0}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10.5px' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10.5px' }}>{relativeTime(link.created_at)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          <button onClick={() => setExpanded(v => !v)} title="Statistiques" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: expanded ? 'rgba(139,92,246,0.15)' : 'none', border: 'none', borderRadius: '8px', color: expanded ? '#a78bfa' : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
            {expanded ? <ChevronDown size={14} /> : <BarChart2 size={13} />}
          </button>
          <button onClick={handleCopy} title="Copier" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: copied ? 'rgba(34,197,94,0.15)' : 'none', border: 'none', borderRadius: '8px', color: copied ? '#4ade80' : 'rgba(255,255,255,0.45)', cursor: 'pointer', transition: 'background 0.15s' }}>
            {copied ? <Check size={14} /> : <Copy size={13} />}
          </button>
          <a href={shortUrl} target="_blank" rel="noopener noreferrer" title="Ouvrir" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)', borderRadius: '8px' }}>
            <ExternalLink size={13} />
          </a>
          <button onClick={onDelete} disabled={deleting} title="Supprimer" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: '8px', color: 'rgba(248,113,113,0.7)', cursor: 'pointer' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 12px' }}>
          <AnalyticsPanel linkId={link.id} />
        </div>
      )}
    </div>
  );
}

export default function ShortLinksCard({ profileId, isActivated, profileUsername }) {
  const queryClient = useQueryClient();
  const [customSlug, setCustomSlug] = useState('');
  const [creating, setCreating]     = useState(false);
  const [focused, setFocused]       = useState(false);
  const [justCreated, setJustCreated] = useState(null);

  const domain = SHORTLINK_BASE_URL;

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

  const totalClicks = useMemo(() => links.reduce((sum, l) => sum + (l.clicks || 0), 0), [links]);

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
      setJustCreated(created);
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
      {/* Header avec compteur total de clics — signal "pro" façon dashboard Bitly */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Link2 size={13} color="#a78bfa" />
          </div>
          <p style={{ color: 'white', fontSize: '13.5px', fontWeight: 800, margin: 0 }}>Raccourcis de lien</p>
        </div>
        {links.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 600 }}>
            <MousePointerClick size={11} /> {totalClicks} clic(s) au total
          </span>
        )}
      </div>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '0 0 14px' }}>
        Créez des liens courts personnalisés vers votre profil public.
      </p>

      {/* Création — préfixe domaine visible façon "bit.ly/" pour ancrer le contexte */}
      <div style={{ display: 'flex', gap: '7px', marginBottom: '14px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: focused ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (focused ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.09)'), borderRadius: '10px', padding: '0 10px', transition: 'background 0.15s ease, border-color 0.15s ease' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', whiteSpace: 'nowrap' }}>{domain.replace(/^https?:\/\//, '')}/</span>
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

      {/* Confirmation forte après création — remplace le simple toast par un
          affichage façon urls.fr, avec le lien d'origine pour contexte. */}
      {justCreated && (
        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px', padding: '12px', marginBottom: '14px', position: 'relative' }}>
          <button
            onClick={() => setJustCreated(null)}
            title="Fermer"
            style={{ position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}
          >
            <X size={13} />
          </button>
          <ShortLinkResultDisplay
            originalUrl={profileUsername ? `${window.location.origin}/${profileUsername}` : window.location.origin}
            shortUrl={`${SHORTLINK_BASE_URL}/${justCreated.slug}`}
          />
        </div>
      )}

      {/* Liste des raccourcis existants */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <SkeletonRow /><SkeletonRow />
        </div>
      ) : links.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '18px 0' }}>
          <Link2 size={20} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 6px' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11.5px', margin: 0 }}>
            Aucun raccourci pour l'instant — créez-en un ci-dessus
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {links.map(link => (
            <LinkRow
              key={link.id}
              link={link}
              domain={domain}
              deleting={deleteMutation.isPending && deleteMutation.variables === link.id}
              onDelete={() => handleDelete(link)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

