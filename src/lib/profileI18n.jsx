/**
 * profileI18n.jsx — Traduction FR ⇄ EN de la page profil publique
 * À placer dans : src/lib/profileI18n.jsx
 *
 * Principe
 *  · FR = contenu d'origine (aucun appel réseau, comportement actuel inchangé).
 *  · EN = textes de l'interface via le dictionnaire ci-dessous (instantané, gratuit)
 *         + contenu saisi par le propriétaire (bio, produits, événement, libellés
 *         de liens) traduit via l'Edge Function « translate-text », avec cache
 *         navigateur (localStorage) : un texte n'est traduit qu'une seule fois.
 *  · Le choix de langue est mémorisé (localStorage « pp_lang »).
 *
 * Exports : useProfileTranslation, LangProvider, useLang, LangToggle
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabase';

const LS_LANG   = 'pp_lang';
const LS_CACHE  = 'pp_tr_en_v1';
const MAX_CACHE = 400;
const BATCH     = 40;

// ─── Dictionnaire de l'interface (clés en minuscules) ─────────────────────
// Casse : si le texte source est entièrement en capitales, la traduction l'est aussi.
// ⚠️ Compléter avec les libellés de PLATFORMS (AddPlatformDialog) si besoin.
const EN = {
  'boutique': 'Shop',
  'article': 'item',
  'articles': 'items',
  'contactez le vendeur pour commander': 'Contact the seller to order',
  'documents': 'Documents',
  'fichier': 'file',
  'fichiers': 'files',
  'ko': 'KB',
  'mo': 'MB',
  'retrouvez-moi': 'Find me',
  'qr code': 'QR code',
  'en ligne ou sans internet': 'Online or offline',
  'mon qr code': 'My QR code',
  'profil en ligne': 'Online profile',
  'sans internet': 'Offline',
  'le scan affiche directement la fiche contact avec « ajouter un contact », sans connexion internet.':
    'Scanning opens the contact card with “Add contact”, no internet connection needed.',
  'le scan ouvre ce profil digital (connexion internet requise).':
    'Scanning opens this digital profile (internet connection required).',
  'impossible de charger le qr code. vérifiez votre connexion puis réessayez.':
    'Unable to load the QR code. Check your connection and try again.',
  'fermer': 'Close',
  'télécharger': 'Download',
  'télécharger la bannière': 'Download the banner',
  'bannière': 'Banner',
  'agrandir': 'Enlarge',
  "agrandir l'image": 'Enlarge image',
  'afficher': 'View',
  'description': 'Description',
  'indisponible': 'Unavailable',
  'en stock · disponible': 'In stock · Available',
  'rupture de stock': 'Out of stock',
  'économise': 'You save',
  'commander sur whatsapp': 'Order on WhatsApp',
  'article temporairement indisponible': 'Item temporarily unavailable',
  'paiement et livraison directement avec le vendeur': 'Payment and delivery directly with the seller',
  'voir +': 'See +',
  'créé avec socialapp': 'Made with SocialApp',
  'mode léger': 'Light mode',
  'ko chargés': 'KB loaded',
  'mode léger activé': 'Light mode on',
  'activer le mode léger': 'Enable light mode',
  'repasser en mode complet': 'Back to full mode',
  'jours': 'Days',
  'heures': 'Hours',
  'min': 'Min',
  'sec': 'Sec',
  'événement': 'Event',
  'réserver ma place': 'Book my spot',
  'partager ce profil': 'Share this profile',
  'copier': 'Copy',
  'téléphone': 'Phone',
  'téléphone fixe': 'Landline',
  'e-mail': 'Email',
  'email': 'Email',
  'site web': 'Website',
  'adresse': 'Address',
  'lien': 'Link',
};

function uiEn(s) {
  if (typeof s !== 'string') return s;
  const v = EN[s.trim().toLowerCase()];
  if (!v) return s;
  const letters = s.replace(/[^\p{L}]/gu, '');
  return letters.length > 1 && s === s.toUpperCase() ? v.toUpperCase() : v;
}

// ─── Cache des traductions dynamiques ─────────────────────────────────────
const hash = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h.toString(36) + '.' + s.length;
};
const loadCache = () => {
  try { return JSON.parse(localStorage.getItem(LS_CACHE) || '{}') || {}; } catch { return {}; }
};
const saveCache = (c) => {
  try {
    const keys = Object.keys(c);
    let out = c;
    if (keys.length > MAX_CACHE) {
      out = {};
      keys.slice(-MAX_CACHE).forEach((k) => { out[k] = c[k]; });
    }
    localStorage.setItem(LS_CACHE, JSON.stringify(out));
  } catch { /* stockage indisponible : on continue sans cache */ }
};
const readLang = () => {
  try { return localStorage.getItem(LS_LANG) === 'en' ? 'en' : 'fr'; } catch { return 'fr'; }
};

// Ignore ce qui n'a rien à traduire : sans lettres, URL, e-mail
const translatable = (s) =>
  typeof s === 'string' &&
  /\p{L}/u.test(s) &&
  !/^(https?:|mailto:|tel:|www\.)/i.test(s.trim()) &&
  !/^\S+@\S+\.\S+$/.test(s.trim());

// ─── Hook principal ───────────────────────────────────────────────────────
// texts : tableau des textes dynamiques de la page (bio, titres produits…).
export function useProfileTranslation(texts) {
  const [lang, setLang]       = useState(readLang);
  const [dyn, setDyn]         = useState(loadCache);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);
  const dynRef     = useRef(dyn);
  const inflight   = useRef(new Set());
  const pending    = useRef(0);
  const errTimer   = useRef(null);

  useEffect(() => () => { if (errTimer.current) clearTimeout(errTimer.current); }, []);

  // <html lang> suit la langue affichée
  useEffect(() => {
    document.documentElement.lang = lang;
    return () => { document.documentElement.lang = 'fr'; };
  }, [lang]);

  // Textes pas encore traduits (uniquement en mode EN)
  const todo = useMemo(() => {
    if (lang !== 'en') return [];
    const seen = new Set();
    const out = [];
    for (const raw of texts || []) {
      const s = typeof raw === 'string' ? raw.trim() : '';
      if (!translatable(s)) continue;
      const k = hash(s);
      if (dyn[k] !== undefined || seen.has(k)) continue;
      seen.add(k);
      out.push(s);
    }
    return out;
  }, [lang, texts, dyn]);

  useEffect(() => {
    if (!todo.length) return;
    const fresh = todo.filter((s) => !inflight.current.has(hash(s)));
    if (!fresh.length) return;
    fresh.forEach((s) => inflight.current.add(hash(s)));
    pending.current += 1;
    setLoading(true);

    (async () => {
      try {
        for (let i = 0; i < fresh.length; i += BATCH) {
          const chunk = fresh.slice(i, i + BATCH);
          const { data, error: err } = await supabase.functions.invoke('translate-text', {
            body: { texts: chunk, target: 'en' },
          });
          if (err || !Array.isArray(data?.translations) || data.translations.length !== chunk.length) {
            throw err || new Error('bad-response');
          }
          const add = {};
          chunk.forEach((s, j) => { add[hash(s)] = data.translations[j]; });
          dynRef.current = { ...dynRef.current, ...add };
          setDyn(dynRef.current);
          saveCache(dynRef.current);
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.error('[translate]', e);
        // Échec : on revient au français (contenu d'origine) et on prévient
        setLang('fr');
        try { localStorage.removeItem(LS_LANG); } catch {}
        setError(true);
        if (errTimer.current) clearTimeout(errTimer.current);
        errTimer.current = setTimeout(() => setError(false), 3500);
      } finally {
        fresh.forEach((s) => inflight.current.delete(hash(s)));
        pending.current = Math.max(0, pending.current - 1);
        if (pending.current === 0) setLoading(false);
      }
    })();
  }, [todo]);

  const toggle = useCallback(() => {
    const next = lang === 'en' ? 'fr' : 'en';
    setLang(next);
    setError(false);
    try {
      if (next === 'en') localStorage.setItem(LS_LANG, 'en');
      else localStorage.removeItem(LS_LANG);
    } catch {}
  }, [lang]);

  // t  : texte d'interface (clé = texte français)
  // tr : contenu saisi par le propriétaire (repli sur l'original tant que non traduit)
  const t  = useCallback((s) => (lang === 'en' ? uiEn(s) : s), [lang]);
  const tr = useCallback((s) => {
    if (lang !== 'en' || typeof s !== 'string' || !s.trim()) return s;
    const v = dynRef.current[hash(s.trim())];
    return v !== undefined ? v : s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, dyn]);

  return useMemo(() => ({ lang, toggle, loading, error, t, tr }), [lang, toggle, loading, error, t, tr]);
}

// ─── Contexte (les sous-composants et les portails y accèdent via useLang) ──
const DEFAULT_CTX = { lang: 'fr', t: (s) => s, tr: (s) => s };
const LangContext = createContext(DEFAULT_CTX);
export const useLang = () => useContext(LangContext);
export function LangProvider({ value, children }) {
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// Drapeaux en SVG intégré (aucune image à charger)
const FlagUK = () => (
  <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" style={{ display:'block' }}>
    <clipPath id="pp-uj-clip"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
    <rect width="60" height="30" fill="#012169" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" clipPath="url(#pp-uj-clip)" />
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
  </svg>
);
const FlagFR = () => (
  <svg viewBox="0 0 3 2" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true" style={{ display:'block' }}>
    <rect width="1" height="2" fill="#0055A4" />
    <rect x="1" width="1" height="2" fill="#fff" />
    <rect x="2" width="1" height="2" fill="#EF4135" />
  </svg>
);

export function LangToggle({ lang, onToggle, loading = false, error = false }) {
  const isFr = lang === 'fr';
  const txt = (active) => ({
    fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1,
    color: active ? '#3a1d0e' : 'rgba(58,29,14,0.35)', transition: 'color 0.2s',
  });

  // Interrupteur vertical : EN en haut, FR en bas ; le bouton rond se place
  // du côté de la langue active, sur le drapeau de l'autre langue.
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:'7px', padding:'10px 6px', borderRadius:'999px',
      width:'48px', boxSizing:'border-box',
      background:'rgba(255,255,255,0.94)', boxShadow:'0 6px 20px rgba(0,0,0,0.3)', fontFamily:'inherit',
    }}>
      <span style={txt(!isFr)}>EN</span>
      <button
        type="button"
        role="switch"
        aria-checked={isFr}
        aria-label="Changer de langue / Switch language"
        title={error ? 'Traduction indisponible' : undefined}
        disabled={loading}
        onClick={onToggle}
        style={{
          position:'relative', width:'32px', height:'58px', padding:0, border:'none', borderRadius:'999px',
          overflow:'hidden', background:'#fff', cursor: loading ? 'wait' : 'pointer', touchAction:'manipulation',
          opacity: loading ? 0.8 : 1, flexShrink:0,
          boxShadow: error ? '0 0 0 2px #ef4444' : 'inset 0 0 0 2px #2d2a3a',
        }}
      >
        <span style={{ position:'absolute', inset:0 }}>{isFr ? <FlagFR /> : <FlagUK />}</span>
        <span style={{
          position:'absolute', left:'3px', top: isFr ? 'calc(100% - 29px)' : '3px',
          width:'26px', height:'26px', borderRadius:'50%', background:'#fff',
          boxShadow:'0 1px 4px rgba(0,0,0,0.4), 0 0 0 2px #2d2a3a',
          transition:'top 0.25s ease', display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {loading && (
            <span style={{ width:'12px', height:'12px', border:'2px solid #6366f1', borderTopColor:'transparent', borderRadius:'50%', animation:'pp-spin 0.8s linear infinite' }} />
          )}
        </span>
      </button>
      <span style={txt(isFr)}>FR</span>
    </div>
  );
}