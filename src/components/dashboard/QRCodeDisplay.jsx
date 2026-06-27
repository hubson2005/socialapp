import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Copy, Check, X, Share2, Palette, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabase';

const BASE_URL = 'https://www.socialapp.work';

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const sanitizeFileName = (value) =>
  (value || 'user').toString().trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

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
};

// ─── Utilitaire luminosité ────────────────────────────────────────────────────
function isLight(hex) {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114)/1000 > 128;
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function QRCodeDisplay({ profileId, username, userLogo, isActive, onNavigate }) {
  const containerRef    = useRef(null);
  const qrInstanceRef   = useRef(null);
  const scriptLoadedRef = useRef(false);
  const logoFileRef     = useRef(null);

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

  // ── GUARD : username manquant → affiche un message clair ─────────────────
  if (!username) {
    return (
      <div style={{ width:'100%', minWidth:0, boxSizing:'border-box' }}>
        <div style={{
          background:'rgba(255,255,255,0.05)',
          border:'1px solid rgba(255,193,7,0.3)',
          borderRadius:'20px',
          padding:'24px 18px',
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          gap:'14px',
          textAlign:'center',
        }}>
          <div style={{
            width:'48px', height:'48px', borderRadius:'14px',
            background:'rgba(255,193,7,0.12)',
            border:'1px solid rgba(255,193,7,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <AlertTriangle size={22} color="#fbbf24" />
          </div>
          <div>
            <p style={{ color:'white', fontWeight:700, fontSize:'14px', margin:'0 0 6px' }}>
              Nom d'utilisateur requis
            </p>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'12px', margin:0, lineHeight:1.6 }}>
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

  const profileUrl = `${BASE_URL}/${username}`;
  const LS_KEY     = `qr_config_${profileId}`;

  const upd = (key, val) => setCustomization(c => ({ ...c, [key]: val }));

  // ── Chargement config QR (Supabase → localStorage → défaut) ─────────────
  useEffect(() => {
    if (!profileId) return;
    (async () => {
      try {
        // FIX: .maybeSingle() au lieu de .single() → évite l'erreur 406
        const { data } = await supabase
          .from('link_profiles')
          .select('qr_config')
          .eq('id', profileId)
          .maybeSingle();
        if (data?.qr_config) {
          const merged = { ...DEFAULT_CUSTOMIZATION, logo: userLogo || null, ...data.qr_config };
          setCustomization(merged);
          localStorage.setItem(LS_KEY, JSON.stringify(merged));
          return;
        }
      } catch { /* silencieux */ }
      // Fallback localStorage
      try {
        const cached = localStorage.getItem(LS_KEY);
        if (cached) setCustomization({ ...DEFAULT_CUSTOMIZATION, logo: userLogo || null, ...JSON.parse(cached) });
      } catch { /* silencieux */ }
    })();
  }, [profileId]);

  // ── Sauvegarde config QR ─────────────────────────────────────────────────
  const saveCustomization = async () => {
    setSaving(true);
    try {
      // On ne sauvegarde pas le logo en base (potentiellement très lourd en base64)
      const { logo, ...configToSave } = customization;
      await supabase
        .from('link_profiles')
        .update({ qr_config: configToSave })
        .eq('id', profileId);
      localStorage.setItem(LS_KEY, JSON.stringify(customization));
    } catch { /* silencieux */ } finally {
      setSaving(false);
    }
    setShowCustomizer(false);
  };

  // ── Réinitialisation ─────────────────────────────────────────────────────
  const resetCustomization = async () => {
    const def = { ...DEFAULT_CUSTOMIZATION, logo: userLogo || null };
    setCustomization(def);
    try {
      await supabase.from('link_profiles').update({ qr_config: null }).eq('id', profileId);
      localStorage.removeItem(LS_KEY);
    } catch { /* silencieux */ }
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
    setQrLoaded(false);
    loadLibraryAndRender();
  }, [profileId, username, customization]);

  useEffect(() => {
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      qrInstanceRef.current = null;
    };
  }, []);

  const loadLibraryAndRender = () => {
    if (window.QRCodeStyling) { renderStyledQR(); return; }
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;
    const existing = document.querySelector('script[data-qr-lib]');
    if (existing) { existing.addEventListener('load', renderStyledQR); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js';
    script.setAttribute('data-qr-lib', '1');
    script.onload  = () => { scriptLoadedRef.current = false; renderStyledQR(); };
    script.onerror = () => { scriptLoadedRef.current = false; };
    document.head.appendChild(script);
  };

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

    const gradient = buildGradient();
    const accentColor  = gradient ? customization.gradientColor1 : customization.dotColor;
    const accentColor2 = gradient ? customization.gradientColor2 : customization.dotColor;

    const qr = new window.QRCodeStyling({
      width:  110,
      height: 110,
      type:   'canvas',
      data:   `${profileUrl}?source=qr`,
      dotsOptions: {
        type: customization.dotStyle,
        ...(gradient ? { gradient } : { color: customization.dotColor }),
      },
      cornersSquareOptions: { type: customization.cornerSquareStyle, color: accentColor  },
      cornersDotOptions:    { type: customization.cornerDotStyle,    color: accentColor2 },
      backgroundOptions:    { color: customization.bgColor },
      ...(customization.logo ? {
        image: customization.logo,
        imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.22 },
      } : {}),
      qrOptions: { errorCorrectionLevel: 'H' },
    });

    qr.append(container);
    qrInstanceRef.current = qr;
    setTimeout(() => setQrLoaded(true), 350);
  };

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
      const safeName = `qr-${sanitizeFileName(username || profileId)}`;
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

  return (
    <div style={{ width:'100%', minWidth:0, boxSizing:'border-box', overflow:'hidden' }}>

      {/* ── Modale mobile ── */}
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

      {/* ── Modale personnalisation ── */}
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

      {/* ── Carte principale ──────────────────────────────────────────────── */}
      <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', padding:'18px', position:'relative', minWidth:0, overflow:'hidden', width:'100%', boxSizing:'border-box' }}>

        {/* En-tête */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'16px', minWidth:0 }}>
          <h3 style={{
            color:'white', fontSize:'14px', fontWeight:700, margin:0,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            flex:'1 1 0', minWidth:0,
          }}>Mon QR Code</h3>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0, background:active?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)', border:`1px solid ${active?'rgba(34,197,94,0.35)':'rgba(239,68,68,0.35)'}`, borderRadius:'100px', padding:'4px 10px' }}>
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:active?'#22c55e':'#ef4444', display:'inline-block', boxShadow:active?'0 0 6px rgba(34,197,94,0.7)':'0 0 6px rgba(239,68,68,0.7)', animation:active?'qr-pulse 2s infinite':'none', flexShrink:0 }} />
            <span style={{ color:active?'#22c55e':'#f87171', fontSize:'11px', fontWeight:700, whiteSpace:'nowrap' }}>{active?'Actif':'Inactif'}</span>
          </div>
        </div>

        {/* Corps : QR + boutons */}
        <div style={{ display:'flex', gap:'12px', alignItems:'flex-start', minWidth:0, width:'100%', boxSizing:'border-box' }}>

          {/* QR Code + cadre */}
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '8px',
              boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
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
            <ActionButton
              icon={copied?<Check size={14} color="#22c55e"/>:<Copy size={14}/>}
              label={copied?'Copié !':'Copier le lien'}
              sub={profileUrl.replace('https://','')}
              onClick={handleCopyLink}
              accent={copied}
            />
            <ActionButton icon={<Share2 size={14}/>} label="Partager" sub="WhatsApp, SMS…" onClick={handleShare} />
            <ActionButton
              icon={<Palette size={14}/>}
              label="Personnaliser"
              sub="5 options disponibles"
              onClick={() => setShowCustomizer(v => !v)}
              orange
            />
          </div>
        </div>

        {/* Statistiques */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginTop:'16px', borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'14px' }}>
          <StatItem value={stats.scans}     label="Scans"       color="#f97316" />
          <StatItem value={stats.downloads} label="Téléchargés" color="#6366f1" />
          <StatItem value={stats.shares}    label="Partagés"    color="#22c55e" />
        </div>
      </div>

      <style>{`
        @keyframes qr-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function OptionGroup({ label, children }) {
  return (
    <div>
      <div style={{ color:'rgba(255,255,255,0.38)', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>{label}</div>
      {children}
    </div>
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

function ActionButton({ icon, label, sub, onClick, disabled, accent, orange, rightIcon }) {
  const [hovered, setHovered] = useState(false);
  const bg = orange
    ? hovered ? 'rgba(251,146,60,0.2)' : 'rgba(251,146,60,0.12)'
    : accent
      ? 'rgba(34,197,94,0.12)'
      : hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)';
  const border = orange
    ? '1px solid rgba(251,146,60,0.35)'
    : accent
      ? '1px solid rgba(34,197,94,0.35)'
      : '1px solid rgba(255,255,255,0.08)';
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
      <div style={{ color:orange?'#fb923c':accent?'#22c55e':'rgba(255,255,255,0.6)', flexShrink:0 }}>{icon}</div>
      <div style={{ minWidth:0, flex:'1 1 0', overflow:'hidden' }}>
        <div style={{ color:orange?'#fb923c':accent?'#22c55e':'white', fontSize:'12px', fontWeight:700, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</div>
        {sub && <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'9px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'1px' }}>{sub}</div>}
      </div>
      {rightIcon && <div style={{ color:orange?'rgba(251,146,60,0.6)':'rgba(255,255,255,0.3)', flexShrink:0 }}>{rightIcon}</div>}
    </button>
  );
}

function StatItem({ value, label, color }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:'22px', fontWeight:900, color, lineHeight:1, letterSpacing:'-0.5px' }}>{value}</div>
      <div style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', fontWeight:500, marginTop:'3px' }}>{label}</div>
    </div>
  );
}