import React, { useEffect, useRef, useState } from 'react';
import { Download, Copy, Check, X, Share2, Palette } from 'lucide-react';
import { supabase } from '../../supabase';

const BASE_URL = 'https://www.socialapp.work';

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const sanitizeFileName = (value) =>
  (value || 'user').toString().trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

// ─── Couleurs QR disponibles ──────────────────────────────────────────────────
const QR_COLOR_PRESETS = [
  { label: 'Noir',    dot: '#060412', bg: '#ffffff' },
  { label: 'Violet',  dot: '#6366f1', bg: '#ffffff' },
  { label: 'Bleu',    dot: '#0ea5e9', bg: '#ffffff' },
  { label: 'Vert',    dot: '#22c55e', bg: '#ffffff' },
  { label: 'Orange',  dot: '#f97316', bg: '#ffffff' },
  { label: 'Rose',    dot: '#ec4899', bg: '#ffffff' },
];

export default function QRCodeDisplay({ profileId, username, userLogo, isActive }) {
  const containerRef    = useRef(null);
  const qrInstanceRef   = useRef(null);
  const scriptLoadedRef = useRef(false);

  const [qrLoaded,        setQrLoaded]        = useState(false);
  const [copied,          setCopied]          = useState(false);
  const [downloading,     setDownloading]     = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [qrDataUrl,       setQrDataUrl]       = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [qrColor,         setQrColor]         = useState(QR_COLOR_PRESETS[0]);
  const [stats,           setStats]           = useState({ scans: 0, downloads: 0, shares: 0 });

  const profileUrl = username
    ? `${BASE_URL}/${username}`
    : `${BASE_URL}/profil/${profileId}`;

  // ── Chargement stats depuis Supabase ────────────────────────────────────────
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
            scans:     data.filter(r => r.event_type === 'view').length,
            downloads: data.filter(r => r.event_type === 'qr_download').length,
            shares:    data.filter(r => r.event_type === 'qr_share').length,
          });
        }
      } catch { /* silencieux */ }
    })();
  }, [profileId]);

  // ── Rendu QR ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setQrLoaded(false);
    loadLibraryAndRender();
  }, [profileId, username, userLogo, qrColor]);

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

  const renderStyledQR = () => {
    const container = containerRef.current;
    if (!container || !window.QRCodeStyling) return;
    container.innerHTML = '';
    qrInstanceRef.current = null;

    const qr = new window.QRCodeStyling({
      width:  130,
      height: 200,
      type:   'canvas',
      data:   profileUrl,
      dotsOptions:          { type: 'classy',        color: qrColor.dot },
      cornersSquareOptions: { type: 'extra-rounded', color: qrColor.dot },
      cornersDotOptions:    { type: 'dot',           color: qrColor.dot },
      backgroundOptions:    { color: qrColor.bg },
      ...(userLogo ? {
        image: userLogo,
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

  // ── Téléchargement ──────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!qrLoaded) return;
    setDownloading(true);
    try {
      const safeName = `qr-${sanitizeFileName(username || profileId)}`;

      // Log download stat
      if (profileId) supabase.from('profile_stats').insert([{ profile_id: profileId, event_type: 'qr_download' }]).then(() => {
        setStats(s => ({ ...s, downloads: s.downloads + 1 }));
      });

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
    } catch (err) {
      const dataUrl = getQrDataUrl();
      if (dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl; link.download = `qr-${sanitizeFileName(username || profileId)}.png`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }
    } finally { setDownloading(false); }
  };

  // ── Copier lien ─────────────────────────────────────────────────────────────
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

  // ── Partager ────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (profileId) supabase.from('profile_stats').insert([{ profile_id: profileId, event_type: 'qr_share' }]).then(() => {
      setStats(s => ({ ...s, shares: s.shares + 1 }));
    });

    if (navigator.share) {
      try {
        await navigator.share({ title: username || 'Mon profil SocialApp', url: profileUrl });
        return;
      } catch {}
    }
    // Fallback WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(profileUrl)}`, '_blank');
  };

  // ── Statut actif ─────────────────────────────────────────────────────────────
  // isActive peut être true/false/undefined — si undefined on considère actif par défaut
  const active = isActive !== false;

  return (
    <>
      {/* ── Modale mobile ──────────────────────────────────────────────────── */}
      {showMobileModal && qrDataUrl && (
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
        </div>
      )}

      {/* ── Sélecteur de couleur QR ─────────────────────────────────────────── */}
      {showColorPicker && (
        <div
          style={{ position:'fixed', inset:0, zIndex:998, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }}
          onClick={() => setShowColorPicker(false)}
        />
      )}

      {/* ── Carte principale ────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '18px',
        position: 'relative',
      }}>

        {/* ── En-tête : titre + statut ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <h3 style={{ color:'white', fontSize:'14px', fontWeight:700, margin:0 }}>Mon QR Code</h3>

          {/* Badge Actif / Inactif */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${active ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
            borderRadius: '100px', padding: '4px 10px',
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: active ? '#22c55e' : '#ef4444',
              display: 'inline-block',
              boxShadow: active ? '0 0 6px rgba(34,197,94,0.7)' : '0 0 6px rgba(239,68,68,0.7)',
              animation: active ? 'qr-pulse 2s infinite' : 'none',
            }} />
            <span style={{ color: active ? '#22c55e' : '#f87171', fontSize: '11px', fontWeight: 700 }}>
              {active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        {/* ── Corps : QR + boutons côte à côte ── */}
        <div style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>

          {/* QR Code */}
          <div style={{
            background: 'white',
            borderRadius: '18px',
            padding: '10px',
            flexShrink: 0,
            boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
            width: '140px',
            height: '140px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {!qrLoaded && (
              <div style={{ width:'100px', height:'100px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:'22px', height:'22px', border:'2px solid #6366f1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              </div>
            )}
            <div
              ref={containerRef}
              style={{
                width: '120px', height: '120px',
                display: qrLoaded ? 'flex' : 'none',
                alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}
            />
          </div>

          {/* Boutons action */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'8px' }}>

            {/* Télécharger */}
            <ActionButton
              icon={<Download size={14} />}
              label="Télécharger"
              sub="PNG HD"
              onClick={handleDownload}
              disabled={downloading || !qrLoaded}
            />

            {/* Copier le lien */}
            <ActionButton
              icon={copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
              label={copied ? 'Copié !' : 'Copier le lien'}
              sub={profileUrl.replace('https://', '')}
              onClick={handleCopyLink}
              accent={copied}
            />

            {/* Partager */}
            <ActionButton
              icon={<Share2 size={14} />}
              label="Partager"
              sub="WhatsApp, SMS…"
              onClick={handleShare}
            />

            {/* Personnaliser */}
            <div style={{ position:'relative' }}>
              <ActionButton
                icon={<Palette size={14} />}
                label="Personnaliser"
                sub="Couleur du QR"
                onClick={() => setShowColorPicker(v => !v)}
                orange
              />

              {/* Dropdown couleurs */}
              {showColorPicker && (
                <div style={{
                  position: 'absolute', right:0, bottom:'calc(100% + 6px)', zIndex:999,
                  background: 'rgba(10,8,25,0.97)', backdropFilter:'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius:'16px',
                  padding: '12px', display:'flex', flexDirection:'column', gap:'8px',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                  minWidth: '180px',
                }}>
                  <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Couleur du QR</p>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    {QR_COLOR_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        title={preset.label}
                        onClick={() => { setQrColor(preset); setShowColorPicker(false); }}
                        style={{
                          width:'28px', height:'28px', borderRadius:'8px',
                          background: preset.dot,
                          border: qrColor.dot === preset.dot ? '2px solid white' : '2px solid transparent',
                          cursor:'pointer', flexShrink:0, transition:'transform 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.15)'}
                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Statistiques ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: '8px', marginTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px',
        }}>
          <StatItem value={stats.scans}     label="Scans"       color="#f97316" />
          <StatItem value={stats.downloads} label="Téléchargés" color="#6366f1" />
          <StatItem value={stats.shares}    label="Partagés"    color="#22c55e" />
        </div>
      </div>

      <style>{`
        @keyframes qr-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </>
  );
}

// ─── Bouton action ────────────────────────────────────────────────────────────
function ActionButton({ icon, label, sub, onClick, disabled, accent, orange }) {
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
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', borderRadius: '12px',
        background: bg, border,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: '100%', textAlign: 'left',
        transition: 'background 0.15s, transform 0.1s',
        transform: hovered && !disabled ? 'translateX(2px)' : 'translateX(0)',
      }}
    >
      <div style={{ color: orange ? '#fb923c' : accent ? '#22c55e' : 'rgba(255,255,255,0.6)', flexShrink:0 }}>{icon}</div>
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ color: orange ? '#fb923c' : accent ? '#22c55e' : 'white', fontSize:'12px', fontWeight:700, lineHeight:1.2 }}>{label}</div>
        {sub && <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'9px', fontWeight:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'1px' }}>{sub}</div>}
      </div>
    </button>
  );
}

// ─── Stat item ────────────────────────────────────────────────────────────────
function StatItem({ value, label, color }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:'22px', fontWeight:900, color, lineHeight:1, letterSpacing:'-0.5px' }}>{value}</div>
      <div style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', fontWeight:500, marginTop:'3px' }}>{label}</div>
    </div>
  );
}