import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const toUrl = (m) => (typeof m === 'string' ? m : m?.url);

export default function ProfilePreview({ profile, onClose, isMobile = false }) {
  const iframeRef = useRef(null);
  const [ready, setReady] = useState(false);
  // [PREVIEW-SCALE] La page est rendue a 390 px (largeur d'un vrai telephone)
  // puis reduite pour tenir dans le cadre : meme mise en page que sur mobile.
  const frameRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const VIEW_W = 390;
  const scale = isMobile || !box.w ? 1 : box.w / VIEW_W;

  // Le dashboard stocke parfois event_images sous forme d'objets {url} : on normalise
  const payload = useMemo(() => {
    if (!profile) return null;
    const imgs = (profile.event_images || (profile.event_image_url ? [profile.event_image_url] : []))
      .map(toUrl).filter(Boolean);
    return { ...profile, event_images: imgs.length ? imgs : null };
  }, [profile]);

  // Handshake : l'iframe signale qu'elle est prête
  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === 'PREVIEW_READY') setReady(true);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Envoi du brouillon à chaque modification (debounce 150 ms)
  useEffect(() => {
    if (!ready || !payload) return;
    const id = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'PREVIEW_UPDATE', payload },
        window.location.origin
      );
    }, 150);
    return () => clearTimeout(id);
  }, [payload, ready]);

  // Échap pour fermer
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <motion.aside
      initial={{ x: 440, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 440, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      style={{
        position:'fixed', top:0, right:0, bottom:0, zIndex:1000,
        width: isMobile ? '100%' : '400px', background:'#fff',
        borderLeft:'1px solid #e6e8f0', boxShadow:'-12px 0 40px rgba(15,23,42,.14)',
        display:'flex', flexDirection:'column', paddingTop:'env(safe-area-inset-top)',
      }}
    >
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #e6e8f0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', animation:'pulse-dot 2s infinite' }} />
          <strong style={{ fontSize:14, color:'#161a2e' }}>Aperçu en direct</strong>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {profile?.username && (
            <a href={`/${profile.username}`} target="_blank" rel="noreferrer" title="Ouvrir la vraie page" style={{ ...iconBtn, textDecoration:'none' }}>
              <ExternalLink size={14} />
            </a>
          )}
          <button type="button" onClick={onClose} title="Fermer" style={iconBtn}><X size={14} /></button>
        </div>
      </header>

      <div style={{ flex:1, minHeight:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f5fa', padding: isMobile ? 0 : 16 }}>
        <div style={{
          width: isMobile ? '100%' : 320, height: isMobile ? '100%' : '100%', maxHeight: isMobile ? 'none' : 660,
          borderRadius: isMobile ? 0 : 36, border: isMobile ? 'none' : '8px solid #161a2e',
          overflow:'hidden', background:'#0f0a1e', boxShadow: isMobile ? 'none' : '0 20px 50px rgba(15,23,42,.25)',
        }}>
          <div ref={frameRef} style={{ width:'100%', height:'100%', overflow:'hidden' }}>
            <iframe ref={iframeRef} src="/preview-profile" title="Aperçu du profil public"
              style={{
                width: scale === 1 ? '100%' : VIEW_W,
                height: scale === 1 ? '100%' : box.h / scale,
                border: 'none', display: 'block',
                transform: scale === 1 ? undefined : `scale(${scale})`,
                transformOrigin: 'top left',
              }} />
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

const iconBtn = {
  width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center',
  background:'#f1f2f7', border:'1px solid #e2e4ee', borderRadius:8, color:'#454b5a', cursor:'pointer',
};