import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Copy, Check, X, Share2, Palette, Upload, Trash2, AlertTriangle, Maximize2, UserPen, FileDown } from 'lucide-react';
import { supabase } from '../../supabase';

const BASE_URL = 'https://www.socialapp.work';

// Taille interne du canvas du QR (affiché à 100px via CSS, mais téléchargé en HD)
const QR_SIZE = 300;

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const sanitizeFileName = (value) =>
  (value || 'user').toString().trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

// [FIX] Même règle de sanitisation que `handleSave` dans UserDashboard.jsx
// (minuscules, accents retirés, espaces → tirets, caractères interdits
// supprimés). Le champ username peut être modifié en direct dans
// OverviewPanel sans passer par cette sanitisation avant la sauvegarde —
// sans ce garde-fou ici, le QR pouvait encoder une valeur (casse, accent,
// espace) différente de celle réellement stockée en base, et le scan
// tombait alors sur "Profil introuvable" côté PublicProfile.jsx.
const sanitizeUsername = (value) =>
  (value || '').toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

// ─── vCard (mode "Sans internet") ─────────────────────────────────────────────
// Le QR contient directement la fiche contact (texte) : le téléphone qui scanne
// l'affiche et propose "Ajouter un contact" SANS aucune connexion.
const vcEsc = (v = '') =>
  String(v)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

// Numéro au format international. Hypothèse Côte d'Ivoire : un numéro local
// à 10 chiffres sans "+" reçoit le préfixe +225.
const normalizePhone = (raw = '') => {
  let p = String(raw).replace(/[^\d+]/g, '');
  if (!p) return '';
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!p.startsWith('+') && p.length === 12 && p.startsWith('225')) p = '+' + p;
  if (!p.startsWith('+') && p.length === 10) p = '+225' + p;
  return p;
};

const buildVCard = ({ fullName = '', title = '', company = '', phone = '', phone2 = '', email = '', website = '', linkedin = '', url = '' }) => {
  const name  = (fullName || '').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const last  = parts.length > 1 ? parts.pop() : '';
  const first = parts.join(' ');
  const tel   = normalizePhone(phone);
  const tel2  = normalizePhone(phone2);
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vcEsc(last)};${vcEsc(first)};;;`,
    `FN:${vcEsc(name)}`,
    company  && `ORG:${vcEsc(company)}`,
    title    && `TITLE:${vcEsc(title)}`,
    tel      && `TEL;TYPE=CELL:${tel}`,
    tel2     && tel2 !== tel && `TEL;TYPE=WORK:${tel2}`,
    email    && `EMAIL:${String(email).trim()}`,
    url      && `URL:${url}`,
    website  && `URL:${String(website).trim()}`,
    linkedin && `URL:${String(linkedin).trim()}`,
    'END:VCARD',
  ].filter(Boolean).join('\r\n');
};

// Lit la première colonne non vide parmi plusieurs noms possibles
// → adaptez la liste si vos colonnes link_profiles portent d'autres noms.
const pickField = (row, keys) => {
  if (!row) return '';
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
};

const EMPTY_CONTACT = { fullName: '', title: '', company: '', phone: '', email: '' };
// Champs repris automatiquement des liens du profil (non modifiables dans la modale)
const EMPTY_PROFILE_INFO = { ...EMPTY_CONTACT, phone2: '', website: '', linkedin: '' };
const CONTACT_KEYS = ['fullName', 'title', 'company', 'phone', 'email'];

// ─── Options de personnalisation ──────────────────────────────────────────────
const DOT_STYLES = [
  { id: 'classy',         label: 'Classique'  },
  { id: 'square',         label: 'Carré'      },
  { id: 'extra-rounded',  label: 'Rond'       },
  { id: 'dots',           label: 'Points'     },
  { id: 'rounded',        label: 'Arrondi'    },
  { id: 'classy-rounded', label: 'Élégant'    },
];
const CORNER_SQUARE_STYLES = [
  { id: 'extra-rounded', label: 'Rond'   },
  { id: 'square',        label: 'Carré'  },
  { id: 'dot',           label: 'Cercle' },
];
const CORNER_DOT_STYLES = [
  { id: 'dot',    label: 'Cercle' },
  { id: 'square', label: 'Carré'  },
];
const DOT_COLOR_PRESETS = [
  '#060412','#6366f1','#0ea5e9','#22c55e',
  '#f97316','#ec4899','#f59e0b','#a855f7',
  '#ef4444','#14b8a6',
];
const BG_COLOR_PRESETS = [
  '#ffffff','#f8fafc','#fef3c7','#eff6ff',
  '#f0fdf4','#fdf2f8','#1a1a2e','#0f172a',
  '#000000','#1e1b4b',
];
const GRADIENT_PRESETS = [
  { c1:'#6366f1', c2:'#ec4899', label:'Violet→Rose'   },
  { c1:'#0ea5e9', c2:'#22c55e', label:'Bleu→Vert'     },
  { c1:'#f97316', c2:'#ef4444', label:'Orange→Rouge'  },
  { c1:'#a855f7', c2:'#06b6d4', label:'Mauve→Cyan'    },
  { c1:'#fbbf24', c2:'#f97316', label:'Or→Orange'     },
  { c1:'#000000', c2:'#4b5563', label:'Noir→Gris'     },
];
const FRAME_STYLES = [
  { id: 'none',    label: 'Aucun'       },
  { id: 'simple',  label: 'Simple'      },
  { id: 'rounded', label: 'Arrondi'     },
  { id: 'glow',    label: 'Lueur'       },
  { id: 'badge',   label: 'Badge'       },
  { id: 'dots',    label: 'Pointillé'   },
];
const TABS = [
  { id: 'colors',   label: '🎨 Couleurs' },
  { id: 'patterns', label: '⬡ Motifs'    },
  { id: 'logo',     label: '🖼 Logo'      },
  { id: 'gradient', label: '✨ Dégradé'  },
  { id: 'frame',    label: '⬜ Cadre'     },
];
const DEFAULT_CUSTOMIZATION = {
  dotColor:          '#060412',
  bgColor:           '#ffffff',
  dotStyle:          'classy',
  cornerSquareStyle: 'extra-rounded',
  cornerDotStyle:    'dot',
  gradientEnabled:   false,
  gradientColor1:    '#6366f1',
  gradientColor2:    '#ec4899',
  gradientType:      'linear',
  gradientRotation:  45,
  logo:              null,
  frame:             'none',
  offlineContact:    { ...EMPTY_CONTACT },
};

// ─── Utilitaire luminosité ────────────────────────────────────────────────────
function isLight(hex) {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114)/1000 > 128;
}

// ─── Composant principal ──────────────────────────────────────────────────────
// [FIX Q-ACTIVATION] Ajout de la prop `isActivated`. Le username n'est
// persisté en base (voir handleSave dans UserDashboard.jsx) que si le
// compte est activé — c'est un verrou anti-squattage de username avant
// paiement, intentionnel et à conserver. Mais tant que le compte n'est
// pas activé, `username` reçu ici (state local du dashboard) ne
// correspond à RIEN en base : le QR généré encoderait donc un lien mort,
// qui affiche "Profil introuvable" une fois scanné. On bloque désormais
// l'affichage du QR dans ce cas précis, avec un message explicite, plutôt
// que de laisser l'utilisateur partager un lien qui ne fonctionnera pas.
//
// [FIX THÈME] La carte principale et les deux états de garde (username
// manquant / compte non activé) sont en thème clair (#f4f5fa). Les modales
// restent en overlay sombre plein écran.
//
// [NOUVEAU] Mode "Sans internet" : le QR peut encoder une vCard (fiche contact)
// au lieu du lien du profil. Le mode "Profil en ligne" reste le mode par défaut
// et fonctionne exactement comme avant (même URL, ?source=qr, stats de scan).
export default function QRCodeDisplay({ profileId, username, userLogo, isActive, isActivated, onNavigate }) {
  const containerRef    = useRef(null);
  const qrInstanceRef   = useRef(null);
  const scriptLoadedRef = useRef(false);
  const logoFileRef     = useRef(null);
  const renderRef       = useRef(null);

  const [qrLoaded,        setQrLoaded]        = useState(false);
  const [copied,          setCopied]          = useState(false);
  const [downloading,     setDownloading]     = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [qrDataUrl,       setQrDataUrl]       = useState(null);
  const [showCustomizer,  setShowCustomizer]  = useState(false);
  const [activeTab,       setActiveTab]       = useState('colors');
  const [customization,   setCustomization]   = useState({ ...DEFAULT_CUSTOMIZATION, logo: userLogo || null });
  const [stats,           setStats]           = useState({ scans: 0, downloads: 0, shares: 0 });
  const [saving,          setSaving]          = useState(false);

  // [NOUVEAU] Mode d'affichage du QR + fiche contact hors ligne
  const [mode,             setMode]             = useState('online'); // 'online' | 'offline'
  const [showZoom,         setShowZoom]         = useState(false);
  const [zoomDataUrl,      setZoomDataUrl]      = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactDraft,     setContactDraft]     = useState({ ...EMPTY_CONTACT });
  const [profileInfo,      setProfileInfo]      = useState({ ...EMPTY_PROFILE_INFO });

  // [FIX] Toujours sanitiser le username avant de construire le lien encodé
  // dans le QR — voir le commentaire sur `sanitizeUsername` ci-dessus.
  const profileUrl = username ? `${BASE_URL}/${sanitizeUsername(username)}` : '';
  const LS_KEY     = `qr_config_${profileId}`;

  const upd = (key, val) => setCustomization(c => ({ ...c, [key]: val }));

  // ── Contact effectif = saisie manuelle > données du profil > username ───
  const oc = customization.offlineContact || EMPTY_CONTACT;
  const contact = {
    fullName: oc.fullName || profileInfo.fullName || username || '',
    title:    oc.title    || profileInfo.title    || '',
    company:  oc.company  || profileInfo.company  || '',
    phone:    oc.phone    || profileInfo.phone    || '',
    email:    oc.email    || profileInfo.email    || '',
    phone2:   profileInfo.phone2,
    website:  profileInfo.website,
    linkedin: profileInfo.linkedin,
  };
  const vcard  = buildVCard({ ...contact, url: profileUrl });
  const qrData = mode === 'offline' ? vcard : `${profileUrl}?source=qr`;

  // ── Rendu du QR (défini AVANT les effets et les guards : évite une
  //    ReferenceError (TDZ) quand un guard retourne tôt) ───────────────────
  const buildGradient = () => {
    if (!customization.gradientEnabled) return undefined;
    return {
      type: customization.gradientType,
      rotation: customization.gradientRotation,
      colorStops: [
        { offset: 0, color: customization.gradientColor1 },
        { offset: 1, color: customization.gradientColor2 },
      ],
    };
  };

  const renderStyledQR = () => {
    const container = containerRef.current;
    if (!container || !window.QRCodeStyling) return;
    container.innerHTML = '';
    qrInstanceRef.current = null;

    const offline = mode === 'offline';
    const gradient = buildGradient();
    const accentColor  = gradient ? customization.gradientColor1 : customization.dotColor;
    const accentColor2 = gradient ? customization.gradientColor2 : customization.dotColor;

    const qr = new window.QRCodeStyling({
      width:  QR_SIZE,
      height: QR_SIZE,
      type:   'canvas',
      data:   qrData,
      // Mode hors ligne : marge plus large pour faciliter la lecture d'un QR dense
      ...(offline ? { margin: 12 } : {}),
      dotsOptions: {
        type: customization.dotStyle,
        ...(gradient ? { gradient } : { color: customization.dotColor }),
      },
      cornersSquareOptions: { type: customization.cornerSquareStyle, color: accentColor  },
      cornersDotOptions:    { type: customization.cornerDotStyle,    color: accentColor2 },
      backgroundOptions:    { color: customization.bgColor },
      // Pas de logo en mode hors ligne : le QR vCard est dense, le logo le rendrait illisible
      ...(customization.logo && !offline ? {
        image: customization.logo,
        imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.22 },
      } : {}),
      // Niveau M en hors ligne (moins de modules → plus lisible), H en ligne (comme avant)
      qrOptions: { errorCorrectionLevel: offline ? 'M' : 'H' },
    });

    qr.append(container);
    qrInstanceRef.current = qr;
    setTimeout(() => setQrLoaded(true), 350);
  };
  // Toujours la dernière version (évite un onload qui rendrait avec un état périmé)
  renderRef.current = renderStyledQR;

  const loadLibraryAndRender = () => {
    if (window.QRCodeStyling) { renderRef.current?.(); return; }
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;
    const existing = document.querySelector('script[data-qr-lib]');
    if (existing) { existing.addEventListener('load', () => renderRef.current?.()); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js';
    script.setAttribute('data-qr-lib', '1');
    script.onload  = () => { scriptLoadedRef.current = false; renderRef.current?.(); };
    script.onerror = () => { scriptLoadedRef.current = false; };
    document.head.appendChild(script);
  };

  // ── Chargement config QR + infos profil (Supabase → localStorage → défaut) ─
  useEffect(() => {
    if (!profileId) return;
    (async () => {
      try {
        // FIX: .maybeSingle() au lieu de .single() → évite l'erreur 406
        const { data } = await supabase
          .from('link_profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle();

        if (data) {
          // Pré-remplissage de la fiche contact depuis le profil.
          // Téléphone, e-mail, site web et LinkedIn viennent des liens activés
          // (link_profiles.links : { platform, url, enabled }).
          const links = Array.isArray(data.links)
            ? data.links.filter(l => l && l.enabled !== false && l.url)
            : [];
          const byPlatform = (p) => links.filter(l => l.platform === p).map(l => String(l.url).trim());
          const phones   = byPlatform('phone').map(u => u.replace(/^tel:/i, ''));
          const waDigits = (byPlatform('whatsapp')[0] || '').replace(/\D/g, '');
          setProfileInfo({
            fullName: pickField(data, ['display_name']),
            title:    '',
            company:  '',
            phone:    phones[0] || pickField(data, ['whatsapp_phone']) || (waDigits ? '+' + waDigits : ''),
            phone2:   phones[1] || '',
            email:    (byPlatform('email')[0] || '').replace(/^mailto:/i, ''),
            website:  byPlatform('website')[0] || '',
            linkedin: byPlatform('linkedin')[0] || '',
          });
        }

        if (data?.qr_config) {
          const merged = { ...DEFAULT_CUSTOMIZATION, logo: userLogo || null, ...data.qr_config };
          merged.offlineContact = { ...EMPTY_CONTACT, ...(data.qr_config.offlineContact || {}) };
          setCustomization(merged);
          localStorage.setItem(LS_KEY, JSON.stringify(merged));
          return;
        }
      } catch { /* silencieux */ }
      // Fallback localStorage
      try {
        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setCustomization({
            ...DEFAULT_CUSTOMIZATION,
            logo: userLogo || null,
            ...parsed,
            offlineContact: { ...EMPTY_CONTACT, ...(parsed.offlineContact || {}) },
          });
        }
      } catch { /* silencieux */ }
    })();
  }, [profileId]);

  // ── Sauvegarde config QR ─────────────────────────────────────────────────
  const persistConfig = async (cfg) => {
    // On ne sauvegarde pas le logo en base (potentiellement très lourd en base64)
    const { logo, ...configToSave } = cfg;
    await supabase
      .from('link_profiles')
      .update({ qr_config: configToSave })
      .eq('id', profileId);
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  };

  const saveCustomization = async () => {
    setSaving(true);
    try {
      await persistConfig(customization);
    } catch { /* silencieux */ } finally {
      setSaving(false);
    }
    setShowCustomizer(false);
  };

  // ── Réinitialisation ─────────────────────────────────────────────────────
  const resetCustomization = async () => {
    const def = { ...DEFAULT_CUSTOMIZATION, logo: userLogo || null, offlineContact: { ...EMPTY_CONTACT } };
    setCustomization(def);
    try {
      await supabase.from('link_profiles').update({ qr_config: null }).eq('id', profileId);
      localStorage.removeItem(LS_KEY);
    } catch { /* silencieux */ }
  };

  // ── Fiche contact hors ligne ─────────────────────────────────────────────
  const openContactModal = () => {
    // pré-rempli avec les valeurs effectives (5 champs modifiables)
    const d = {};
    CONTACT_KEYS.forEach(k => { d[k] = contact[k] || ''; });
    setContactDraft(d);
    setShowContactModal(true);
  };

  const saveContact = async () => {
    setSaving(true);
    // On ne mémorise que ce qui diffère du profil : le reste reste synchronisé avec les liens
    const stored = {};
    CONTACT_KEYS.forEach(k => { stored[k] = contactDraft[k] === (profileInfo[k] || '') ? '' : (contactDraft[k] || ''); });
    const next = { ...customization, offlineContact: stored };
    setCustomization(next);
    try { await persistConfig(next); } catch { /* silencieux */ } finally { setSaving(false); }
    setShowContactModal(false);
  };

  const draftVCard = buildVCard({
    ...contactDraft,
    phone2: profileInfo.phone2, website: profileInfo.website, linkedin: profileInfo.linkedin,
    url: profileUrl,
  });

  const downloadVcfFile = (content, name) => {
    const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${sanitizeFileName(name || username || 'contact')}.vcf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ── Stats Supabase ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!profileId) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('profile_stats')
          .select('event_type')
          .eq('profile_id', profileId);
        if (data) {
          setStats({
            scans:     data.filter(r => r.event_type === 'qr_scan').length,
            downloads: data.filter(r => r.event_type === 'qr_download').length,
            shares:    data.filter(r => r.event_type === 'qr_share').length,
          });
        }
      } catch { /* silencieux */ }
    })();
  }, [profileId]);

  // ── Rendu QR ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!username || isActivated === false) return; // pas de QR à rendre (guards plus bas)
    setQrLoaded(false);
    loadLibraryAndRender();
  }, [profileId, username, isActivated, customization, mode, qrData]);

  useEffect(() => {
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      qrInstanceRef.current = null;
    };
  }, []);

  // [FIX HOOKS] Les deux guards ci-dessous (username manquant / compte non
  // activé) sont placés APRÈS tous les Hooks : un `return` conditionnel avant
  // des Hooks fait varier leur nombre d'un rendu à l'autre et provoque un
  // crash React ("Rendered fewer hooks than expected").
  if (!username) {
    return (
      <div style={{ width:'100%', minWidth:0, boxSizing:'border-box' }}>
        <div style={{
          background:'#ffffff',
          border:'1px solid rgba(245,158,11,0.35)',
          borderRadius:'20px',
          padding:'24px 18px',
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          gap:'14px',
          textAlign:'center',
          boxShadow:'0 1px 2px rgba(15,23,42,0.04)',
        }}>
          <div style={{
            width:'48px', height:'48px', borderRadius:'14px',
            background:'rgba(245,158,11,0.1)',
            border:'1px solid rgba(245,158,11,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <AlertTriangle size={22} color="#d97706" />
          </div>
          <div>
            <p style={{ color:'#161a2e', fontWeight:700, fontSize:'14px', margin:'0 0 6px' }}>
              Nom d'utilisateur requis
            </p>
            <p style={{ color:'#8a90a2', fontSize:'12px', margin:0, lineHeight:1.6 }}>
              Définissez un nom d'utilisateur pour générer votre QR code et partager votre profil public.
            </p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              style={{
                padding:'10px 20px',
                borderRadius:'12px',
                background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border:'none',
                color:'white',
                fontSize:'13px',
                fontWeight:700,
                cursor:'pointer',
              }}
            >
              Configurer mon profil
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isActivated === false) {
    return (
      <div style={{ width:'100%', minWidth:0, boxSizing:'border-box' }}>
        <div style={{
          background:'#ffffff',
          border:'1px solid rgba(239,68,68,0.3)',
          borderRadius:'20px',
          padding:'24px 18px',
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          gap:'14px',
          textAlign:'center',
          boxShadow:'0 1px 2px rgba(15,23,42,0.04)',
        }}>
          <div style={{
            width:'48px', height:'48px', borderRadius:'14px',
            background:'rgba(239,68,68,0.1)',
            border:'1px solid rgba(239,68,68,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <AlertTriangle size={22} color="#dc2626" />
          </div>
          <div>
            <p style={{ color:'#161a2e', fontWeight:700, fontSize:'14px', margin:'0 0 6px' }}>
              Compte en attente d'activation
            </p>
            <p style={{ color:'#8a90a2', fontSize:'12px', margin:0, lineHeight:1.6 }}>
              Votre QR code sera généré une fois le paiement confirmé et votre compte activé. Le nom d'utilisateur choisi est réservé jusque-là.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getQrDataUrl = () => {
    const canvas = containerRef.current?.querySelector('canvas');
    return canvas ? canvas.toDataURL('image/png') : null;
  };

  // ── Logo upload ───────────────────────────────────────────────────────────
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => upd('logo', ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Téléchargement ────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!qrLoaded) return;
    setDownloading(true);
    try {
      const safeName = `${mode === 'offline' ? 'qr-contact' : 'qr'}-${sanitizeFileName(username || profileId)}`;
      if (profileId) supabase.from('profile_stats')
        .insert([{ profile_id: profileId, event_type: 'qr_download' }])
        .then(() => setStats(s => ({ ...s, downloads: s.downloads + 1 })));

      if (isMobile()) {
        const dataUrl = getQrDataUrl();
        if (dataUrl) { setQrDataUrl(dataUrl); setShowMobileModal(true); }
        return;
      }
      if (qrInstanceRef.current) {
        await qrInstanceRef.current.download({ name: safeName, extension: 'png' });
        return;
      }
      const dataUrl = getQrDataUrl();
      if (dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl; link.download = `${safeName}.png`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }
    } catch {
      const dataUrl = getQrDataUrl();
      if (dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl; link.download = `qr-${sanitizeFileName(username || profileId)}.png`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }
    } finally { setDownloading(false); }
  };

  // ── Agrandir (plein écran) — pratique pour scanner depuis l'écran ────────
  const handleZoom = () => {
    const dataUrl = getQrDataUrl();
    if (dataUrl) { setZoomDataUrl(dataUrl); setShowZoom(true); }
  };

  // ── Copier le lien ────────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(profileUrl); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = profileUrl;
      Object.assign(ta.style, { position:'fixed', opacity:'0', top:'0', left:'0' });
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Partager ──────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (profileId) supabase.from('profile_stats')
      .insert([{ profile_id: profileId, event_type: 'qr_share' }])
      .then(() => setStats(s => ({ ...s, shares: s.shares + 1 })));
    if (navigator.share) {
      try { await navigator.share({ title: username || 'Mon profil SocialApp', url: profileUrl }); return; }
      catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(profileUrl)}`, '_blank');
  };

  // ── Style de cadre ────────────────────────────────────────────────────────
  const getFrameStyle = () => {
    const c = customization.dotColor;
    switch (customization.frame) {
      case 'simple':  return { border: `3px solid ${c}`, borderRadius: '12px', padding: '4px' };
      case 'rounded': return { border: `3px solid ${c}`, borderRadius: '24px', padding: '6px' };
      case 'glow':    return { border: `2px solid ${c}`, borderRadius: '16px', padding: '4px', boxShadow: `0 0 20px ${c}66, 0 0 40px ${c}33` };
      case 'badge':   return { border: `3px solid ${c}`, borderRadius: '16px 16px 4px 4px', padding: '4px 4px 0 4px' };
      case 'dots':    return { border: `3px dashed ${c}`, borderRadius: '12px', padding: '4px' };
      default:        return {};
    }
  };

  const active = isActive !== false;
  const offline = mode === 'offline';
  const contactIncomplete = offline && !contact.phone && !contact.email;
  const vcardLen = vcard.length;

  return (
    <div style={{ width:'100%', minWidth:0, boxSizing:'border-box', overflow:'hidden' }}>

      {/* ── Modale mobile — overlay sombre volontaire ── */}
      {showMobileModal && qrDataUrl && createPortal(
        <div
          style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}
          onClick={() => setShowMobileModal(false)}
        >
          <div
            style={{ background:'#1a1a2e', borderRadius:'24px', padding:'24px', maxWidth:'320px', width:'100%', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 32px 80px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <p style={{ color:'white', fontWeight:700, fontSize:'15px', margin:0 }}>📱 Sauvegarder le QR Code</p>
              <button type="button" onClick={() => setShowMobileModal(false)} style={{ background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', borderRadius:'8px', padding:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.6)' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ background:'white', borderRadius:'16px', padding:'16px', textAlign:'center', marginBottom:'16px' }}>
              <img src={qrDataUrl} alt="QR Code" style={{ width:'200px', height:'200px', display:'block', margin:'0 auto', borderRadius:'8px' }} />
            </div>
            <div style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:'12px', padding:'12px', marginBottom:'16px' }}>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'12px', margin:0, lineHeight:1.6, textAlign:'center' }}>
                👆 <strong>Appuyez longuement</strong> sur l'image ci-dessus<br />puis choisissez <strong>"Enregistrer l'image"</strong>
              </p>
            </div>
            <button type="button" onClick={() => setShowMobileModal(false)} style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:'12px', color:'white', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
              Fermer
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modale agrandissement (mode sans internet) ── */}
      {showZoom && zoomDataUrl && createPortal(
        <div
          style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(10px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}
          onClick={() => setShowZoom(false)}
        >
          <div
            style={{ background:'white', borderRadius:'24px', padding:'16px', width:'min(88vw, 360px)', boxShadow:'0 32px 80px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}
          >
            <img src={zoomDataUrl} alt="QR Code contact" style={{ width:'100%', height:'auto', display:'block', borderRadius:'12px' }} />
          </div>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'12px', margin:'16px 0 0', textAlign:'center', lineHeight:1.6, maxWidth:'300px' }}>
            Scannez ce code : la fiche contact s'affiche directement, sans connexion internet.
          </p>
          <button type="button" onClick={() => setShowZoom(false)} style={{ marginTop:'16px', padding:'10px 24px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'12px', color:'white', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
            Fermer
          </button>
        </div>,
        document.body
      )}

      {/* ── Modale fiche contact (mode sans internet) ── */}
      {showContactModal && createPortal(
        <div
          style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px' }}
          onClick={() => setShowContactModal(false)}
        >
          <div
            style={{ background:'#0f0f1a', borderRadius:'20px', width:'100%', maxWidth:'440px', maxHeight:'90vh', display:'flex', flexDirection:'column', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 24px 80px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 0' }}>
              <p style={{ color:'white', fontWeight:700, fontSize:'15px', margin:0 }}>📇 Fiche contact (sans internet)</p>
              <button type="button" onClick={() => setShowContactModal(false)} style={{ background:'rgba(255,255,255,0.08)', border:'none', cursor:'pointer', borderRadius:'8px', padding:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.6)' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', WebkitOverflowScrolling:'touch', display:'flex', flexDirection:'column', gap:'12px' }}>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'11px', margin:0, lineHeight:1.6 }}>
                Ces informations sont stockées directement dans le QR. Plus elles sont courtes, plus le QR est facile à scanner.
              </p>
              <ContactField label="Nom complet"   value={contactDraft.fullName} onChange={v => setContactDraft(d => ({ ...d, fullName: v }))} placeholder="Isaac Kedohounsi" />
              <ContactField label="Fonction"      value={contactDraft.title}    onChange={v => setContactDraft(d => ({ ...d, title: v }))}    placeholder="Responsable Afrique" />
              <ContactField label="Entreprise"    value={contactDraft.company}  onChange={v => setContactDraft(d => ({ ...d, company: v }))}  placeholder="Kudu" />
              <ContactField label="Téléphone"     value={contactDraft.phone}    onChange={v => setContactDraft(d => ({ ...d, phone: v }))}    placeholder="+225 05 01 44 73 44" type="tel" />
              <ContactField label="E-mail"        value={contactDraft.email}    onChange={v => setContactDraft(d => ({ ...d, email: v }))}    placeholder="nom@exemple.com" type="email" />

              <div style={{ color: draftVCard.length > 450 ? '#fbbf24' : 'rgba(255,255,255,0.3)', fontSize:'10px', fontWeight:700 }}>
                {draftVCard.length} caractères{draftVCard.length > 450 ? ' — long : le QR sera dense, raccourcissez si possible' : ''}
              </div>
              <p style={{ color:'rgba(255,255,255,0.28)', fontSize:'10px', margin:0, lineHeight:1.6 }}>
                Le lien de votre profil, votre 2ᵉ téléphone, votre site web et LinkedIn (s'ils sont activés dans « Mes plateformes ») sont ajoutés automatiquement.
              </p>
            </div>

            <div style={{ padding:'12px 20px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:'10px' }}>
              <button
                type="button"
                onClick={() => downloadVcfFile(draftVCard, contactDraft.fullName)}
                style={{ flex:1, padding:'11px', borderRadius:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.55)', fontSize:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}
              ><FileDown size={14} /> .vcf</button>
              <button
                type="button"
                onClick={saveContact}
                disabled={saving}
                style={{ flex:2, padding:'11px', borderRadius:'12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'white', fontSize:'12px', fontWeight:700, cursor:saving?'default':'pointer', opacity:saving?0.7:1 }}
              >{saving ? 'Sauvegarde…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modale personnalisation — overlay sombre volontaire ── */}
      {showCustomizer && createPortal(
        <div
          style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px' }}
          onClick={() => setShowCustomizer(false)}
        >
          <div
            style={{ background:'#0f0f1a', borderRadius:'20px', width:'100%', maxWidth:'440px', maxHeight:'90vh', display:'flex', flexDirection:'column', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 24px 80px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ height:'8px' }} />

            {/* Header modale */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px 0' }}>
              <p style={{ color:'white', fontWeight:700, fontSize:'15px', margin:0 }}>🎨 Personnaliser le QR</p>
              <button type="button" onClick={() => setShowCustomizer(false)} style={{ background:'rgba(255,255,255,0.08)', border:'none', cursor:'pointer', borderRadius:'8px', padding:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.6)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Onglets */}
            <div style={{ display:'flex', gap:'4px', padding:'14px 20px 0', overflowX:'auto', WebkitOverflowScrolling:'touch', scrollbarWidth:'none', msOverflowStyle:'none' }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding:'6px 10px', borderRadius:'8px', border:'none', cursor:'pointer', flexShrink:0,
                    background: activeTab===tab.id ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                    color: activeTab===tab.id ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                    fontSize:'11px', fontWeight:700, whiteSpace:'nowrap',
                    outline: activeTab===tab.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    transition:'all 0.15s',
                  }}
                >{tab.label}</button>
              ))}
            </div>

            {/* Contenu scrollable */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', WebkitOverflowScrolling:'touch' }}>

              {/* ── Couleurs ── */}
              {activeTab === 'colors' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  <OptionGroup label="Couleur des points">
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
                      {DOT_COLOR_PRESETS.map(c => (
                        <ColorDot key={c} color={c} selected={customization.dotColor===c && !customization.gradientEnabled} onSelect={() => { upd('dotColor', c); upd('gradientEnabled', false); }} />
                      ))}
                      <ColorInputDot value={customization.dotColor} onChange={c => { upd('dotColor', c); upd('gradientEnabled', false); }} />
                    </div>
                  </OptionGroup>
                  <OptionGroup label="Couleur de fond">
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
                      {BG_COLOR_PRESETS.map(c => (
                        <ColorDot key={c} color={c} selected={customization.bgColor===c} onSelect={() => upd('bgColor', c)} hasBorder />
                      ))}
                      <ColorInputDot value={customization.bgColor} onChange={c => upd('bgColor', c)} />
                    </div>
                  </OptionGroup>
                </div>
              )}

              {/* ── Motifs ── */}
              {activeTab === 'patterns' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  <OptionGroup label="Style des points">
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                      {DOT_STYLES.map(s => <StyleChip key={s.id} label={s.label} selected={customization.dotStyle===s.id} onSelect={() => upd('dotStyle', s.id)} />)}
                    </div>
                  </OptionGroup>
                  <OptionGroup label="Coins extérieurs">
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                      {CORNER_SQUARE_STYLES.map(s => <StyleChip key={s.id} label={s.label} selected={customization.cornerSquareStyle===s.id} onSelect={() => upd('cornerSquareStyle', s.id)} />)}
                    </div>
                  </OptionGroup>
                  <OptionGroup label="Points des coins">
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                      {CORNER_DOT_STYLES.map(s => <StyleChip key={s.id} label={s.label} selected={customization.cornerDotStyle===s.id} onSelect={() => upd('cornerDotStyle', s.id)} />)}
                    </div>
                  </OptionGroup>
                </div>
              )}

              {/* ── Logo ── */}
              {activeTab === 'logo' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  <OptionGroup label="Logo au centre du QR">
                    <input ref={logoFileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogoUpload} />
                    <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
                      {customization.logo && (
                        <div style={{ width:'64px', height:'64px', borderRadius:'14px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.15)', background:'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <img src={customization.logo} alt="Logo" style={{ width:'54px', height:'54px', objectFit:'contain', borderRadius:'8px' }} />
                        </div>
                      )}
                      <button type="button" onClick={() => logoFileRef.current?.click()} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'5px', width:'64px', height:'64px', borderRadius:'14px', background:'rgba(99,102,241,0.1)', border:'1.5px dashed rgba(99,102,241,0.4)', cursor:'pointer', color:'#a5b4fc', flexShrink:0 }}>
                        <Upload size={18} />
                        <span style={{ fontSize:'9px', fontWeight:700 }}>Importer</span>
                      </button>
                      {customization.logo && (
                        <button type="button" onClick={() => upd('logo', null)} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'5px', width:'64px', height:'64px', borderRadius:'14px', background:'rgba(239,68,68,0.08)', border:'1.5px dashed rgba(239,68,68,0.35)', cursor:'pointer', color:'#f87171', flexShrink:0 }}>
                          <Trash2 size={18} />
                          <span style={{ fontSize:'9px', fontWeight:700 }}>Supprimer</span>
                        </button>
                      )}
                    </div>
                    <p style={{ color:'rgba(255,255,255,0.28)', fontSize:'10px', margin:'8px 0 0', lineHeight:1.6 }}>PNG ou SVG recommandé · Fond transparent idéal · Max 500 ko</p>
                    <p style={{ color:'rgba(255,255,255,0.28)', fontSize:'10px', margin:'6px 0 0', lineHeight:1.6 }}>Le logo n'est pas affiché dans le mode « Sans internet » (QR trop dense).</p>
                  </OptionGroup>
                </div>
              )}

              {/* ── Dégradé ── */}
              {activeTab === 'gradient' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  <OptionGroup label="Activer le dégradé">
                    <ToggleSwitch value={customization.gradientEnabled} onChange={v => upd('gradientEnabled', v)} label={customization.gradientEnabled ? 'Activé' : 'Désactivé'} />
                  </OptionGroup>
                  {customization.gradientEnabled && (
                    <>
                      <OptionGroup label="Présets">
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                          {GRADIENT_PRESETS.map(g => (
                            <button key={g.label} type="button" title={g.label} onClick={() => { upd('gradientColor1', g.c1); upd('gradientColor2', g.c2); }}
                              style={{ width:'36px', height:'36px', borderRadius:'10px', background:`linear-gradient(135deg, ${g.c1}, ${g.c2})`, border:(customization.gradientColor1===g.c1 && customization.gradientColor2===g.c2)?'2px solid white':'2px solid transparent', cursor:'pointer', transition:'transform 0.1s' }}
                              onMouseEnter={e => e.currentTarget.style.transform='scale(1.15)'}
                              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                            />
                          ))}
                        </div>
                      </OptionGroup>
                      <OptionGroup label="Couleurs personnalisées">
                        <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
                          <div>
                            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:'9px', fontWeight:700, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Début</div>
                            <div style={{ position:'relative', width:'40px', height:'40px' }}>
                              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:customization.gradientColor1, border:'2px solid rgba(255,255,255,0.2)', cursor:'pointer' }} />
                              <input type="color" value={customization.gradientColor1} onChange={e => upd('gradientColor1', e.target.value)} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }} />
                            </div>
                          </div>
                          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'16px', paddingBottom:'8px' }}>→</div>
                          <div>
                            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:'9px', fontWeight:700, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Fin</div>
                            <div style={{ position:'relative', width:'40px', height:'40px' }}>
                              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:customization.gradientColor2, border:'2px solid rgba(255,255,255,0.2)', cursor:'pointer' }} />
                              <input type="color" value={customization.gradientColor2} onChange={e => upd('gradientColor2', e.target.value)} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }} />
                            </div>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:'9px', fontWeight:700, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Aperçu</div>
                            <div style={{ height:'40px', borderRadius:'10px', background:`linear-gradient(${customization.gradientRotation}deg, ${customization.gradientColor1}, ${customization.gradientColor2})`, border:'1px solid rgba(255,255,255,0.1)' }} />
                          </div>
                        </div>
                      </OptionGroup>
                      <OptionGroup label="Type et angle">
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                          <StyleChip label="Linéaire" selected={customization.gradientType==='linear'} onSelect={() => upd('gradientType','linear')} />
                          <StyleChip label="Radial"   selected={customization.gradientType==='radial'}  onSelect={() => upd('gradientType','radial')} />
                          {customization.gradientType === 'linear' && (
                            <div style={{ display:'flex', alignItems:'center', gap:'8px', flex:1, minWidth:'100px' }}>
                              <span style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', fontWeight:700, flexShrink:0 }}>{customization.gradientRotation}°</span>
                              <input type="range" min={0} max={360} step={15} value={customization.gradientRotation} onChange={e => upd('gradientRotation', Number(e.target.value))} style={{ flex:1, accentColor:'#6366f1', cursor:'pointer' }} />
                            </div>
                          )}
                        </div>
                      </OptionGroup>
                    </>
                  )}
                </div>
              )}

              {/* ── Cadre ── */}
              {activeTab === 'frame' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  <OptionGroup label="Style de cadre">
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                      {FRAME_STYLES.map(f => (
                        <button key={f.id} type="button" onClick={() => upd('frame', f.id)}
                          style={{ padding:'7px 13px', borderRadius:'10px', border:'none', cursor:'pointer', background:customization.frame===f.id?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.05)', color:customization.frame===f.id?'#a5b4fc':'rgba(255,255,255,0.4)', fontSize:'11px', fontWeight:700, outline:customization.frame===f.id?'1px solid rgba(99,102,241,0.4)':'1px solid rgba(255,255,255,0.07)', transition:'all 0.15s' }}
                        >{f.label}</button>
                      ))}
                    </div>
                  </OptionGroup>
                  {customization.frame !== 'none' && (
                    <p style={{ color:'rgba(255,255,255,0.28)', fontSize:'10px', margin:0, lineHeight:1.6 }}>
                      💡 Le cadre reprend la couleur des points — changez-la dans l'onglet <strong style={{ color:'rgba(255,255,255,0.45)' }}>Couleurs</strong>.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer modale */}
            <div style={{ padding:'12px 20px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:'10px' }}>
              <button
                type="button"
                onClick={resetCustomization}
                style={{ flex:1, padding:'11px', borderRadius:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', fontSize:'12px', fontWeight:700, cursor:'pointer' }}
              >↺ Réinitialiser</button>
              <button
                type="button"
                onClick={saveCustomization}
                disabled={saving}
                style={{ flex:2, padding:'11px', borderRadius:'12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'white', fontSize:'12px', fontWeight:700, cursor:saving?'default':'pointer', opacity:saving?0.7:1 }}
              >{saving ? 'Sauvegarde…' : 'Appliquer'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Carte principale — thème clair, cohérent avec le fond #f4f5fa du dashboard ── */}
      <div style={{ background:'#ffffff', border:'1px solid #e6e8f0', borderRadius:'20px', padding:'18px', position:'relative', minWidth:0, overflow:'hidden', width:'100%', boxSizing:'border-box', boxShadow:'0 1px 2px rgba(15,23,42,0.04)' }}>

        {/* En-tête */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'14px', minWidth:0 }}>
          <h3 style={{
            color:'#161a2e', fontSize:'14px', fontWeight:700, margin:0,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            flex:'1 1 0', minWidth:0,
          }}>Mon QR Code</h3>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0, background:active?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', border:`1px solid ${active?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:'100px', padding:'4px 10px' }}>
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:active?'#22c55e':'#ef4444', display:'inline-block', boxShadow:active?'0 0 6px rgba(34,197,94,0.5)':'0 0 6px rgba(239,68,68,0.5)', animation:active?'qr-pulse 2s infinite':'none', flexShrink:0 }} />
            <span style={{ color:active?'#16a34a':'#dc2626', fontSize:'11px', fontWeight:700, whiteSpace:'nowrap' }}>{active?'Actif':'Inactif'}</span>
          </div>
        </div>

        {/* Sélecteur de mode : Profil en ligne (par défaut) / Sans internet */}
        <div style={{ display:'flex', gap:'3px', background:'#f1f3f9', borderRadius:'12px', padding:'3px', marginBottom:'16px' }}>
          {[
            { id:'online',  label:'🌐 Profil en ligne' },
            { id:'offline', label:'📴 Sans internet'   },
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              style={{
                flex:1, minWidth:0, padding:'8px 6px', border:'none', borderRadius:'10px', cursor:'pointer',
                background: mode===m.id ? '#ffffff' : 'transparent',
                color: mode===m.id ? '#161a2e' : '#8a90a2',
                boxShadow: mode===m.id ? '0 1px 4px rgba(15,23,42,0.12)' : 'none',
                fontSize:'11px', fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                transition:'all 0.15s',
              }}
            >{m.label}</button>
          ))}
        </div>

        {/* Corps : QR + boutons */}
        <div style={{ display:'flex', gap:'12px', alignItems:'flex-start', minWidth:0, width:'100%', boxSizing:'border-box' }}>

          {/* QR Code + cadre */}
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{
              background: 'white',
              border: '1px solid #eef0f5',
              borderRadius: '16px',
              padding: '8px',
              boxShadow: '0 6px 20px rgba(15,23,42,0.1)',
              width: '116px',
              height: '116px',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              boxSizing: 'border-box',
              ...getFrameStyle(),
            }}>
              {!qrLoaded && (
                <div style={{ width:'80px', height:'80px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:'20px', height:'20px', border:'2px solid #6366f1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                </div>
              )}
              <div
                ref={containerRef}
                className="qrd-canvas"
                style={{ width:'100px', height:'100px', display:qrLoaded?'flex':'none', alignItems:'center', justifyContent:'center', overflow:'hidden' }}
              />
            </div>
            {customization.frame === 'badge' && (
              <div style={{ background:customization.dotColor, borderRadius:'0 0 8px 8px', padding:'3px 12px', marginTop:'-2px' }}>
                <span style={{ color:isLight(customization.dotColor)?'#000':'#fff', fontSize:'9px', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase' }}>Scannez-moi</span>
              </div>
            )}
          </div>

          {/* Boutons action */}
          <div style={{ flex:'1 1 0', minWidth:0, display:'flex', flexDirection:'column', gap:'8px', overflow:'hidden' }}>
            <ActionButton icon={<Download size={14}/>} label="Télécharger" sub="PNG HD" onClick={handleDownload} disabled={downloading||!qrLoaded} />
            {!offline ? (
              <>
                <ActionButton
                  icon={copied?<Check size={14} color="#16a34a"/>:<Copy size={14}/>}
                  label={copied?'Copié !':'Copier le lien'}
                  sub={profileUrl.replace('https://','')}
                  onClick={handleCopyLink}
                  accent={copied}
                />
                <ActionButton icon={<Share2 size={14}/>} label="Partager" sub="WhatsApp, SMS…" onClick={handleShare} />
              </>
            ) : (
              <>
                <ActionButton icon={<Maximize2 size={14}/>} label="Agrandir" sub="Plein écran pour scanner" onClick={handleZoom} disabled={!qrLoaded} />
                <ActionButton icon={<UserPen size={14}/>} label="Ma fiche contact" sub="Nom, tél., e-mail…" onClick={openContactModal} />
              </>
            )}
            <ActionButton
              icon={<Palette size={14}/>}
              label="Personnaliser"
              sub="5 options disponibles"
              onClick={() => setShowCustomizer(v => !v)}
              orange
            />
          </div>
        </div>

        {/* Explication du mode */}
        <p style={{ color:'#8a90a2', fontSize:'11px', lineHeight:1.6, margin:'14px 0 0' }}>
          {!offline
            ? "Le scan ouvre votre profil digital (connexion internet requise)."
            : "Le scan affiche directement votre fiche contact avec « Ajouter un contact », sans connexion internet. Les scans hors ligne ne sont pas comptés dans les statistiques."}
        </p>
        {offline && contactIncomplete && (
          <p style={{ color:'#d97706', fontSize:'11px', lineHeight:1.6, margin:'6px 0 0', fontWeight:600 }}>
            ⚠️ Ajoutez un téléphone ou un e-mail dans « Ma fiche contact » pour que la fiche soit utile.
          </p>
        )}
        {offline && vcardLen > 450 && (
          <p style={{ color:'#d97706', fontSize:'11px', lineHeight:1.6, margin:'6px 0 0', fontWeight:600 }}>
            ⚠️ Fiche longue ({vcardLen} caractères) : le QR est dense. Raccourcissez-la si le scan est difficile.
          </p>
        )}

        {/* Statistiques */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginTop:'16px', borderTop:'1px solid #eef0f5', paddingTop:'14px' }}>
          <StatItem value={stats.scans}     label="Scans"       color="#f97316" />
          <StatItem value={stats.downloads} label="Téléchargés" color="#6366f1" />
          <StatItem value={stats.shares}    label="Partagés"    color="#22c55e" />
        </div>
      </div>

      <style>{`
        @keyframes qr-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        div::-webkit-scrollbar { display: none; }
        .qrd-canvas canvas { width:100% !important; height:100% !important; display:block; }
      `}</style>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────
// OptionGroup, ColorDot, ColorInputDot, StyleChip, ToggleSwitch et ContactField
// sont utilisés dans les modales (fond sombre #0f0f1a) — texte clair voulu.

function OptionGroup({ label, children }) {
  return (
    <div>
      <div style={{ color:'rgba(255,255,255,0.38)', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>{label}</div>
      {children}
    </div>
  );
}

function ContactField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label style={{ display:'block' }}>
      <div style={{ color:'rgba(255,255,255,0.38)', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' }}>{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:'10px',
          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
          color:'white', fontSize:'16px', outline:'none', // 16px : évite le zoom auto sur iOS
        }}
      />
    </label>
  );
}

function ColorDot({ color, selected, onSelect, hasBorder }) {
  return (
    <button
      type="button"
      title={color}
      onClick={onSelect}
      style={{
        width:'26px', height:'26px', borderRadius:'8px', background:color,
        border: selected ? '2px solid white' : hasBorder ? '1px solid rgba(255,255,255,0.2)' : '2px solid transparent',
        cursor:'pointer', flexShrink:0,
        boxShadow: selected ? '0 0 0 1px rgba(255,255,255,0.35)' : 'none',
        transition:'transform 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform='scale(1.2)'}
      onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
    />
  );
}

function ColorInputDot({ value, onChange }) {
  return (
    <div style={{ position:'relative', width:'26px', height:'26px', flexShrink:0 }}>
      <div style={{ width:'26px', height:'26px', borderRadius:'8px', background:'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)', border:'2px solid rgba(255,255,255,0.25)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px' }}>🖊</div>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }} />
    </div>
  );
}

function StyleChip({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        padding:'5px 11px', borderRadius:'8px', border:'none', cursor:'pointer',
        background: selected ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
        color: selected ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
        fontSize:'11px', fontWeight:700,
        outline: selected ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
        transition:'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function ToggleSwitch({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{ display:'flex', alignItems:'center', gap:'10px', background:'none', border:'none', cursor:'pointer', padding:0 }}
    >
      <div style={{ width:'40px', height:'22px', borderRadius:'11px', background:value?'#6366f1':'rgba(255,255,255,0.12)', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
        <div style={{ position:'absolute', top:'3px', left:value?'21px':'3px', width:'16px', height:'16px', borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>
      <span style={{ color:value?'#a5b4fc':'rgba(255,255,255,0.38)', fontSize:'12px', fontWeight:700 }}>{label}</span>
    </button>
  );
}

// ActionButton et StatItem sont utilisés dans la carte principale (thème clair).
function ActionButton({ icon, label, sub, onClick, disabled, accent, orange, rightIcon }) {
  const [hovered, setHovered] = useState(false);
  const bg = orange
    ? hovered ? 'rgba(251,146,60,0.16)' : 'rgba(251,146,60,0.1)'
    : accent
      ? 'rgba(34,197,94,0.1)'
      : hovered ? '#eef0f5' : '#f6f7fb';
  const border = orange
    ? '1px solid rgba(251,146,60,0.3)'
    : accent
      ? '1px solid rgba(34,197,94,0.3)'
      : '1px solid #e6e8f0';
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display:'flex', alignItems:'center', gap:'8px',
        padding:'9px 10px', borderRadius:'12px', background:bg, border,
        cursor:disabled?'default':'pointer', opacity:disabled?0.5:1,
        width:'100%', minWidth:0, maxWidth:'100%',
        textAlign:'left', transition:'background 0.15s, transform 0.1s',
        transform:hovered&&!disabled?'translateX(2px)':'translateX(0)',
        boxSizing:'border-box', overflow:'hidden',
      }}
    >
      <div style={{ color:orange?'#ea580c':accent?'#16a34a':'#6b7280', flexShrink:0 }}>{icon}</div>
      <div style={{ minWidth:0, flex:'1 1 0', overflow:'hidden' }}>
        <div style={{ color:orange?'#ea580c':accent?'#16a34a':'#161a2e', fontSize:'12px', fontWeight:700, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</div>
        {sub && <div style={{ color:'#9095a5', fontSize:'9px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'1px' }}>{sub}</div>}
      </div>
      {rightIcon && <div style={{ color:orange?'rgba(234,88,12,0.6)':'#a2a7b5', flexShrink:0 }}>{rightIcon}</div>}
    </button>
  );
}

function StatItem({ value, label, color }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:'22px', fontWeight:900, color, lineHeight:1, letterSpacing:'-0.5px' }}>{value}</div>
      <div style={{ color:'#9095a5', fontSize:'10px', fontWeight:500, marginTop:'3px' }}>{label}</div>
    </div>
  );
}