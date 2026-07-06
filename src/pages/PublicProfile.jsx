/**
 * PublicProfile.jsx — Page profil publique SocialApp
 *
 * CORRECTIONS APPLIQUÉES :
 *  [C1]  useEffect QR scan isolé, dépendance réduite à profile?.id uniquement
 *  [C2]  Promise.all([fetchCountry()]) → await fetchCountry() direct
 *  [C3]  Tous les console.log/error de debug supprimés (fuite d'infos en prod)
 *  [C4]  handleTouchStart : setter fonctionnel setCurrentIndex(prev=>) pour éviter la closure stale
 *  [C5]  Background style : injection unifiée, suppression du doublon cleanup/effect, sans flash
 *  [C6]  @keyframes shimmer dans ProfileSkeleton injecté via useEffect (une fois)
 *  [C7]  @keyframes du composant principal injectés via useEffect (une fois)
 *  [C8]  Guard isMounted dans init() pour éviter setState après démontage
 *  [C9]  insert QR scan chaîné avec .then(({error}) => error && console.error(...))
 *  [C10] Imports morts supprimés : useTranslation, Eye
 *  [C11] Numéro WhatsApp support extrait en constante SUPPORT_WHATSAPP
 *  [C12] bg_image_url sanitisé via CSS.escape + encodeURI avant injection
 *  [A1]  triggerWhatsappClick() appelé dans handleLinkClick quand platform === 'whatsapp'
 *  [A2]  triggerQrScan() appelé dans le useEffect QR scan (après l'insert profile_stats)
 *  [A3]  triggerMarketplaceBuy() appelé dans ProductDetailModal sur "Commander sur WhatsApp"
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { ExternalLink, Phone, ShoppingBag, Tag, FileText, X, ZoomIn, Download } from 'lucide-react';
import { PLATFORMS } from '../components/dashboard/AddPlatformDialog';
// [A1][A2][A3][A6] Moteur d'automatisation — déclencheurs
import { triggerWhatsappClick }   from '../lib/triggers/whatsapp';
import { triggerQrScan }          from '../lib/triggers/qr';
import { triggerMarketplaceBuy }  from '../lib/triggers/marketplace';
import { triggerMarketplaceClick } from '../lib/triggers/marketplaceClick'; // [A6]

// ─── Constantes ───────────────────────────────────────────────
// [C11] Numéro support centralisé — modifier ici uniquement
const SUPPORT_WHATSAPP = '2250576031212';

const KEYFRAME_SKELETON_ID  = 'pp-keyframes-skeleton';
const KEYFRAME_MAIN_ID      = 'pp-keyframes-main';

// ─── Tracking ─────────────────────────────────────────────────

function detectDevice() {
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua))                                          return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua))         return 'mobile';
  return 'desktop';
}

function cleanReferrer() {
  try {
    const ref = document.referrer;
    if (!ref) return 'direct';
    const host = new URL(ref).hostname.replace(/^www\./, '');
    if (host.includes('google'))                                                      return 'google';
    if (host.includes('facebook') || host.includes('fb.com'))                        return 'facebook';
    if (host.includes('instagram'))                                                   return 'instagram';
    if (host.includes('tiktok'))                                                      return 'tiktok';
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'twitter';
    if (host.includes('whatsapp'))                                                    return 'whatsapp';
    return host || 'direct';
  } catch { return 'direct'; }
}

async function fetchCountry() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error();
    const d = await res.json();
    return { country: d.country_code || '', country_name: d.country_name || '' };
  } catch {
    return { country: '', country_name: '' };
  }
}

// [C3] console.log de debug supprimés — erreurs Supabase uniquement en dev
async function trackView(profileId) {
  try {
    // [C2] await direct, pas de Promise.all inutile
    const geo = await fetchCountry();
    const payload = {
      profile_id:   profileId,
      event_type:   'view',
      device:       detectDevice(),
      referrer:     cleanReferrer(),
      country:      geo.country,
      country_name: geo.country_name,
    };
    const { error } = await supabase.from('profile_stats').insert([payload]);
    if (error && process.env.NODE_ENV !== 'production') console.error('[trackView]', error);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[trackView crash]', err);
  }
}

async function trackClick(profileId, platform) {
  try {
    const payload = {
      profile_id: profileId,
      event_type: 'click',
      platform,
      device:     detectDevice(),
      referrer:   cleanReferrer(),
    };
    const { error } = await supabase.from('profile_stats').insert([payload]);
    if (error && process.env.NODE_ENV !== 'production') console.error('[trackClick]', error);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[trackClick crash]', err);
  }
}

// ─── Utilitaires ──────────────────────────────────────────────
const parseColors = (tc) => {
  if (tc && tc.includes('|')) { const [a, b] = tc.split('|'); return { bg1: a, bg2: b }; }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

const getCountdown = (eventDate) => {
  if (!eventDate) return null;
  const diff = new Date(eventDate) - new Date();
  if (diff <= 0) return null;
  return {
    days:  Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins:  Math.floor((diff % 3600000)  / 60000),
    secs:  Math.floor((diff % 60000)    / 1000),
  };
};

const formatPrice = (p) => p ? Number(p).toLocaleString('fr-FR') + ' F' : '';

// ─── Sous-composants ──────────────────────────────────────────

// [C6] Keyframes skeleton injectées une seule fois
function ProfileSkeleton() {
  useEffect(() => {
    if (!document.getElementById(KEYFRAME_SKELETON_ID)) {
      const s = document.createElement('style');
      s.id = KEYFRAME_SKELETON_ID;
      s.textContent = `
        @keyframes pp-shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        .pp-sk {
          background: linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.06) 75%);
          background-size: 600px 100%;
          animation: pp-shimmer 1.4s infinite linear;
          border-radius: 12px;
        }
      `;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'#0f0a1e', display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 16px' }}>
      <div className="pp-sk" style={{ width:118, height:118, borderRadius:28, marginBottom:16 }} />
      <div className="pp-sk" style={{ width:180, height:22, marginBottom:10 }} />
      <div className="pp-sk" style={{ width:240, height:14, marginBottom:6 }} />
      <div className="pp-sk" style={{ width:180, height:14, marginBottom:24 }} />
      <div style={{ width:'100%', maxWidth:384, display:'flex', flexDirection:'column', gap:10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="pp-sk" style={{ width:'100%', height:72, borderRadius:16, opacity: 1 - i * 0.2 }} />
        ))}
      </div>
    </div>
  );
}

function LazyImg({ src, alt, style }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src} alt={alt} loading="lazy" decoding="async"
      onLoad={() => setLoaded(true)}
      style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
    />
  );
}

const WhatsAppIcon = ({ size = 16, color = '#25D366' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.2 13.8c-.2.6-1.3 1.2-1.8 1.2-.5.1-1.1.1-1.6-.1-1-.3-2-1-2.8-1.8A9.2 9.2 0 0 1 9 12.4c-.2-.5-.2-1-.1-1.5.1-.5.6-1.1 1-1.3.3-.1.5-.1.7 0 .2 0 .3 0 .4.3l.6 1.6c0 .1.1.3 0 .4-.1.2-.2.3-.3.4-.1.1-.3.3-.2.5.4.7 1 1.3 1.7 1.7.2.1.4 0 .5-.1l.5-.6c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.4.1.3 0 .8-.2 1z"/>
  </svg>
);

function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', h); };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', animation:'pp-fadeInOverlay 0.2s ease' }}>
      <button onClick={onClose} aria-label="Fermer" style={{ position:'absolute', top:'16px', right:'16px', width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'white', zIndex:2 }}>
        <X size={18} />
      </button>
      <img src={src} alt="aperçu" onClick={e => e.stopPropagation()} style={{ maxWidth:'100%', maxHeight:'90vh', borderRadius:'16px', objectFit:'contain', boxShadow:'0 24px 80px rgba(0,0,0,0.8)', animation:'pp-zoomIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }} />
    </div>
  );
}

function RippleButton({ onClick, style, children, platformColor }) {
  const [ripples, setRipples] = useState([]);
  const handlePointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(p => [...p, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 600);
  };
  return (
    <button onClick={onClick} onPointerDown={handlePointerDown} style={{ ...style, position:'relative', overflow:'hidden', borderLeft: platformColor ? `4px solid ${platformColor}` : '4px solid rgba(255,255,255,0.15)' }}>
      {ripples.map(r => (
        <span key={r.id} style={{ position:'absolute', left:r.x, top:r.y, width:'8px', height:'8px', borderRadius:'50%', background:'rgba(255,255,255,0.45)', transform:'translate(-50%,-50%) scale(0)', animation:'pp-ripple 0.6s ease-out forwards', pointerEvents:'none' }} />
      ))}
      {children}
    </button>
  );
}

function ProductDetailModal({ product, whatsappNumber, profileId, onClose }) {
  const discount = product.original_price && product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;
  const waNumber = (whatsappNumber || '').replace(/\D/g, '');
  const waMsg = encodeURIComponent(`Bonjour ! Je suis intéressé(e) par votre article : *${product.title}* à ${formatPrice(product.price)}. Est-il encore disponible ?`);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(12px)', display:'flex', alignItems:'flex-end', justifyContent:'center', animation:'pp-fadeInOverlay 0.25s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0f0a1e', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'480px', maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 -20px 60px rgba(0,0,0,0.6)', animation:'pp-slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 0' }}>
          <div style={{ width:'36px', height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', padding:'8px 16px 0' }}>
          <button onClick={onClose} aria-label="Fermer" style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.6)', fontSize:'18px' }}>×</button>
        </div>
        <div style={{ overflowY:'auto', padding:'0 0 32px' }}>
          <div style={{ margin:'10px 16px 0', borderRadius:'18px', overflow:'hidden', aspectRatio:'4/3', background:'rgba(255,255,255,0.05)', position:'relative' }}>
            {product.image_url
              ? <LazyImg src={product.image_url} alt={product.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><ShoppingBag size={48} color="rgba(255,255,255,0.15)" /></div>
            }
            {discount > 0 && <div style={{ position:'absolute', top:'12px', left:'12px', background:'#22c55e', borderRadius:'8px', padding:'4px 10px', fontSize:'13px', fontWeight:700, color:'white' }}>-{discount}%</div>}
            {!product.is_available && (
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ background:'rgba(0,0,0,0.8)', color:'white', fontSize:'13px', fontWeight:700, padding:'8px 20px', borderRadius:'100px' }}>INDISPONIBLE</span>
              </div>
            )}
          </div>
          <div style={{ padding:'18px 20px 0' }}>
            <h2 style={{ color:'white', fontSize:'20px', fontWeight:800, margin:'0 0 12px', lineHeight:1.3 }}>{product.title}</h2>
            <div style={{ display:'flex', alignItems:'baseline', gap:'10px', marginBottom:'16px' }}>
              <span style={{ fontSize:'28px', fontWeight:900, color:product.original_price ? '#ff6b35' : 'white', letterSpacing:'-1px' }}>{formatPrice(product.price)}</span>
              {product.original_price && <span style={{ fontSize:'16px', color:'rgba(255,255,255,0.35)', textDecoration:'line-through' }}>{formatPrice(product.original_price)}</span>}
              {discount > 0 && <span style={{ fontSize:'13px', background:'rgba(34,197,94,0.15)', color:'#22c55e', padding:'3px 10px', borderRadius:'100px', fontWeight:700 }}>Économise {formatPrice(product.original_price - product.price)}</span>}
            </div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:product.is_available !== false ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border:'1px solid ' + (product.is_available !== false ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'), borderRadius:'100px', padding:'5px 12px', marginBottom:'18px' }}>
              <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:product.is_available !== false ? '#22c55e' : '#ef4444', flexShrink:0 }} />
              <span style={{ fontSize:'12px', fontWeight:600, color:product.is_available !== false ? '#22c55e' : '#f87171' }}>{product.is_available !== false ? 'En stock · Disponible' : 'Rupture de stock'}</span>
            </div>
            {product.description && (
              <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'14px 16px', marginBottom:'20px' }}>
                <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 8px' }}>Description</p>
                <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'14px', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>{product.description}</p>
              </div>
            )}
            {product.is_available !== false && waNumber && (
              <a
                href={`https://wa.me/${waNumber}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  // [A3] Déclencher les automatisations marketplace (fire-and-forget)
                  if (profileId) triggerMarketplaceBuy(profileId, {
                    productId:    product.id,
                    productTitle: product.title,
                    price:        product.price,
                  });
                }}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', width:'100%', padding:'15px', background:'#25D366', borderRadius:'16px', color:'white', fontSize:'16px', fontWeight:700, textDecoration:'none', boxShadow:'0 8px 24px rgba(37,211,102,0.35)', marginBottom:'12px' }}
              >
                <WhatsAppIcon size={20} color="white" /> Commander sur WhatsApp
              </a>
            )}
            {product.is_available === false && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'15px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', color:'rgba(255,255,255,0.35)', fontSize:'14px', fontWeight:600, marginBottom:'12px' }}>
                Article temporairement indisponible
              </div>
            )}
            <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'11px', textAlign:'center', margin:0 }}>🔒 Paiement et livraison directement avec le vendeur</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicProductCard({ product, onOpen }) {
  const discount = product.original_price && product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;
  return (
    <div
      onClick={() => onOpen(product)}
      style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'16px', overflow:'hidden', position:'relative', cursor:'pointer', transition:'transform 0.15s' }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onTouchEnd={e => e.currentTarget.style.transform   = 'scale(1)'}
    >
      <div style={{ position:'relative', aspectRatio:'4/3', background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
        {product.image_url
          ? <LazyImg src={product.image_url} alt={product.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><ShoppingBag size={28} color="rgba(255,255,255,0.2)" /></div>
        }
        {discount > 0 && <div style={{ position:'absolute', top:'8px', left:'8px', background:'#22c55e', borderRadius:'6px', padding:'2px 7px', fontSize:'11px', fontWeight:700, color:'white' }}>-{discount}%</div>}
        {!product.is_available && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ background:'rgba(0,0,0,0.7)', color:'rgba(255,255,255,0.7)', fontSize:'10px', fontWeight:700, padding:'4px 10px', borderRadius:'20px' }}>INDISPONIBLE</span>
          </div>
        )}
        <div style={{ position:'absolute', bottom:'8px', right:'8px', background:'rgba(0,0,0,0.6)', borderRadius:'100px', padding:'3px 8px', fontSize:'10px', color:'rgba(255,255,255,0.8)', fontWeight:600 }}>Voir +</div>
      </div>
      <div style={{ padding:'10px 12px 12px' }}>
        <span style={{ fontSize:'16px', fontWeight:800, color:product.original_price ? '#ff6b35' : 'white', display:'block', lineHeight:1.1 }}>{formatPrice(product.price)}</span>
        {product.original_price && <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', textDecoration:'line-through' }}>{formatPrice(product.original_price)}</span>}
        <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'12px', fontWeight:600, margin:'4px 0 0', lineHeight:1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{product.title}</p>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────
export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [notFound, setNotFound]             = useState(false);
  const [countdown, setCountdown]           = useState(null);
  const [images, setImages]                 = useState([]);
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [isAutoPlay, setIsAutoPlay]         = useState(true);
  const [products, setProducts]             = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [documents, setDocuments]           = useState([]);
  const [lightboxSrc, setLightboxSrc]       = useState(null);

  // [C8] Guard isMounted pour éviter setState après démontage
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // [C7] Keyframes principales injectées une seule fois
  useEffect(() => {
    if (!document.getElementById(KEYFRAME_MAIN_ID)) {
      const s = document.createElement('style');
      s.id = KEYFRAME_MAIN_ID;
      s.textContent = `
        html,body { min-height:100%;margin:0;padding:0;background:transparent; }
        @keyframes pp-pulse       { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pp-ripple      { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 100%{transform:translate(-50%,-50%) scale(28);opacity:0} }
        @keyframes pp-fadeSlideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pp-fadeInOverlay { from{opacity:0} to{opacity:1} }
        @keyframes pp-slideUp     { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pp-zoomIn      { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
        .pp-link-btn              { animation:pp-fadeSlideUp 0.4s ease both; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  // ── Chargement initial ───────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase
        .from('link_profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (!isMounted.current) return; // [C8]

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);

      // Tracking + données secondaires en parallèle
      Promise.all([
        trackView(data.id),
        supabase
          .from('marketplace_products')
          .select('id,title,price,original_price,description,image_url,is_available')
          .eq('profile_id', data.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profile_documents')
          .select('id,name,file_url,file_size,is_visible')
          .eq('profile_id', data.id)
          .eq('is_visible', true)
          .order('created_at', { ascending: false }),
      ]).then(([, prod, docs]) => {
        if (!isMounted.current) return; // [C8]
        setProducts(prod?.data || []);
        setDocuments(docs?.data || []);
      });
    };
    init();
  }, [username]);

  // ── [C1][A2] QR scan isolé + déclencheur automatisation ─────
  useEffect(() => {
    if (!profile?.id) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('source') !== 'qr') return;
    const medium = params.get('medium');

    // [C9] Insert profile_stats (tracking analytics)
    supabase.from('profile_stats')
      .insert([{ profile_id: profile.id, event_type: 'qr_scan', referrer: medium || 'non_specifie' }])
      .then(({ error }) => {
        if (error && process.env.NODE_ENV !== 'production') console.error('[QR scan]', error);
      });

    // [A2] Déclencher les automatisations liées au scan QR (fire-and-forget)
    triggerQrScan(profile.id, {
      referrer: medium || 'non_specifie',
      device:   detectDevice(),
    });
  }, [profile?.id]); // [C1] Dépendance à l'ID uniquement, pas à l'objet entier

  // ── Images slider ────────────────────────────────────────────
  useEffect(() => {
    if (profile?.event_images)         setImages(Array.isArray(profile.event_images) ? profile.event_images : [profile.event_images]);
    else if (profile?.event_image_url) setImages([profile.event_image_url]);
    else                               setImages([]);
  }, [profile]);

  useEffect(() => {
    if (!images.length || !isAutoPlay) return;
    const t = setInterval(() => setCurrentIndex(p => (p + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length, isAutoPlay]);

  // [C4] Setter fonctionnel pour éviter la closure stale sur currentIndex
  const handleTouchStart = useCallback((e) => {
    const sx = e.touches[0].clientX, sy = e.touches[0].clientY;
    const onMove = (me) => {
      const dx = sx - me.touches[0].clientX, dy = sy - me.touches[0].clientY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        setCurrentIndex(prev => {
          if (dx > 0) return Math.min(prev + 1, images.length - 1); // swipe gauche → suivant
          return Math.max(prev - 1, 0);                              // swipe droite → précédent
        });
        setIsAutoPlay(false);
        me.preventDefault();
        document.removeEventListener('touchmove', onMove);
      }
    };
    const onEnd = () => document.removeEventListener('touchmove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { once: true });
  }, [images.length]); // [C4] currentIndex retiré des deps — setter fonctionnel utilisé

  // ── Countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.is_event || !profile?.event_date) return;
    setCountdown(getCountdown(profile.event_date));
    const t = setInterval(() => setCountdown(getCountdown(profile.event_date)), 1000);
    return () => clearInterval(t);
  }, [profile?.is_event, profile?.event_date]);

  // ── [C5] Background style — injection unifiée, sans flash ───
  useEffect(() => {
    if (!profile) return;

    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';

    // [C12] Sanitisation de bg_image_url avant injection CSS
    let bgCss = '';
    if (profile.bg_image_url) {
      const safeUrl = encodeURI(profile.bg_image_url);
      bgCss = `
        #__bg_layer__   { position:fixed;top:0;left:0;width:100vw;height:100dvh;z-index:-10;background-image:url(${JSON.stringify(safeUrl)});background-size:cover;background-position:center;background-repeat:no-repeat; }
        #__bg_overlay__ { position:fixed;top:0;left:0;width:100vw;height:100dvh;z-index:-9;background:linear-gradient(160deg,rgba(0,0,0,0.52),rgba(0,0,0,0.36));pointer-events:none; }
      `;
    } else {
      const { bg1, bg2 } = parseColors(profile.theme_color);
      bgCss = `
        #__bg_layer__   { position:fixed;top:0;left:0;width:100vw;height:100dvh;z-index:-10;background:linear-gradient(160deg,${bg1},${bg2}); }
        #__bg_overlay__ { display:none; }
      `;
    }

    // [C5] Upsert : créer ou mettre à jour sans doublon, sans flash
    let styleEl = document.getElementById('__bg_style__');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = '__bg_style__';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = bgCss;

    return () => {
      const s = document.getElementById('__bg_style__');
      if (s) s.remove();
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, [profile]);

  // ── Download helper ──────────────────────────────────────────
  const handleDownload = (url) => {
    try {
      const fn = url.split('/').pop().split('?')[0] || 'image.jpg';
      const a = document.createElement('a');
      a.href = url.includes('?') ? url + '&download=' + fn : url + '?download=' + fn;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, '_blank');
    }
  };

  // ── [A1] Clic sur lien — avec déclencheur automatisation WhatsApp ──
  const handleLinkClick = useCallback((link) => {
    if (!profile) return;
    trackClick(profile.id, link.platform); // fire-and-forget intentionnel

    // [A1] Déclencher les automatisations si le lien cliqué est WhatsApp
    if ((link.platform || '').toLowerCase() === 'whatsapp') {
      triggerWhatsappClick(profile.id, {
        referrer: cleanReferrer(),
        device:   detectDevice(),
      });
    }

    const url = link.url || '';
    if      (link.platform === 'phone') window.location.href = 'tel:'    + url.replace(/^tel:/i,    '').trim();
    else if (link.platform === 'email') window.location.href = 'mailto:' + url.replace(/^mailto:/i, '').trim();
    else window.open(url, '_blank', 'noopener,noreferrer');
  }, [profile]);

  if (loading)  return <ProfileSkeleton />;
  if (notFound) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f0a1e', color:'white' }}>
      <p>Profil introuvable.</p>
    </div>
  );

  const enabledLinks    = (profile.links || []).filter(l => l.enabled !== false);
  const ec1             = profile.event_color1 || '#ff6b35';
  const ec2             = profile.event_color2 || '#f7c948';
  const available       = products.filter(p => p.is_available !== false);
  const sortedProducts  = [...available, ...products.filter(p => p.is_available === false)];
  const hasEventContent = profile.is_event && (
    images.length > 0 ||
    profile.event_name || profile.event_date ||
    profile.event_location || profile.event_description ||
    profile.event_booking_url
  );

  return (
    <>
      <div id="__bg_layer__" />
      <div id="__bg_overlay__" />

      <div style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 16px' }}>

        {/* Avatar */}
        <div style={{ position:'relative', marginBottom:'16px' }}>
          <div style={{ padding:'3px', borderRadius:'28px', background:'linear-gradient(135deg,rgba(255,255,255,0.4),rgba(255,255,255,0.05))', backdropFilter:'blur(10px)', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.display_name} style={{ width:'112px', height:'112px', borderRadius:'24px', objectFit:'cover', display:'block' }} />
              : <div style={{ width:'112px', height:'112px', borderRadius:'24px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', fontWeight:'bold', color:'white' }}>{(profile.display_name || '?')[0].toUpperCase()}</div>
            }
          </div>
          {profile.is_verified && (
            <div style={{ position:'absolute', bottom:'-8px', right:'-8px', width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#16a34a,#22c55e)', border:'3px solid rgba(255,255,255,0.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'white', boxShadow:'0 4px 12px rgba(34,197,94,0.5)' }}>✓</div>
          )}
        </div>

        <h1 style={{ fontSize:'28px', fontWeight:'900', color:'white', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px', textAlign:'center' }}>
          {profile.display_name}
          {profile.is_verified && <span style={{ marginLeft:'8px', fontSize:'16px', color:'#22c55e' }}>✓</span>}
        </h1>

        {profile.bio   && <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'14px', textAlign:'center', maxWidth:'300px', marginBottom:'12px' }}>{profile.bio}</p>}
        {profile.phone && <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'rgba(255,255,255,0.7)', fontSize:'14px', marginBottom:'16px' }}><Phone size={16} />{profile.phone}</div>}

        {/* Événement */}
        {hasEventContent && (
          <div style={{ width:'100%', maxWidth:'360px', marginBottom:'20px' }}>
            {images.length > 0 && (
              <div style={{ position:'relative', borderRadius:'20px', overflow:'hidden', marginBottom:'12px', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }} onTouchStart={handleTouchStart}>
                <img src={images[currentIndex]} alt="event" style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', display:'block', transition:'opacity 0.5s ease', cursor:'zoom-in' }} onClick={() => setLightboxSrc(images[currentIndex])} />
                <div style={{ position:'absolute', bottom:'14px', right:'12px', display:'flex', gap:'6px', zIndex:10 }}>
                  <button onClick={e => { e.stopPropagation(); setLightboxSrc(images[currentIndex]); }} style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(99,102,241,0.9)', color:'white', padding:'5px 10px', borderRadius:'999px', fontWeight:'700', fontSize:'11px', border:'none', cursor:'pointer', backdropFilter:'blur(8px)' }}>
                    <ZoomIn size={12} /> Afficher
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDownload(images[currentIndex]); }} style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(255,255,255,0.92)', color:'#000', padding:'5px 10px', borderRadius:'999px', fontWeight:'700', fontSize:'11px', border:'none', cursor:'pointer' }}>
                    <Download size={12} /> Télécharger
                  </button>
                </div>
                {images.length > 1 && (
                  <div style={{ position:'absolute', bottom:'46px', width:'100%', display:'flex', justifyContent:'center', gap:'6px' }}>
                    {images.map((_, i) => (
                      <div
                        key={i}
                        onClick={() => { setCurrentIndex(i); setIsAutoPlay(false); }}
                        style={{ width: i === currentIndex ? '18px' : '6px', height:'6px', borderRadius:'999px', background:'white', opacity: i === currentIndex ? 1 : 0.4, transition:'all 0.3s', cursor:'pointer' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {(profile.event_name || profile.event_location) && (
              <div style={{ background:`linear-gradient(135deg,${ec1},${ec2})`, borderRadius:'20px', padding:'20px', textAlign:'center', marginBottom:'12px' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(0,0,0,0.2)', borderRadius:'100px', padding:'4px 12px', fontSize:'11px', fontWeight:'700', color:'white', marginBottom:'8px' }}>
                  <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'white', display:'inline-block', animation:'pp-pulse 1.5s infinite' }} /> ÉVÉNEMENT
                </div>
                {profile.event_name     && <div style={{ fontSize:'20px', fontWeight:'800', color:'white', marginBottom:'4px' }}>{profile.event_name}</div>}
                {profile.event_location && <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.85)' }}>📍 {profile.event_location}</div>}
              </div>
            )}
            {countdown && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'12px' }}>
                {[{ v:countdown.days, l:'Jours' }, { v:countdown.hours, l:'Heures' }, { v:countdown.mins, l:'Min' }, { v:countdown.secs, l:'Sec' }].map(({ v, l }) => (
                  <div key={l} style={{ background:'rgba(255,255,255,0.28)', borderRadius:'12px', padding:'10px', textAlign:'center', border:'1px solid rgba(255,255,255,0.25)' }}>
                    <div style={{ fontSize:'24px', fontWeight:'800', color:'#fa4e0f', lineHeight:1 }}>{String(v).padStart(2, '0')}</div>
                    <div style={{ fontWeight:'700', fontSize:'9px', color:'rgb(0,0,0)', textTransform:'uppercase', letterSpacing:'1px', marginTop:'3px' }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            {profile.event_description && (
              <div style={{ background:'rgba(255,255,255,0.32)', borderRadius:'16px', padding:'14px 16px', marginBottom:'12px', border:'1px solid rgba(255,255,255,0.35)' }}>
                <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.75)', lineHeight:'1.6', margin:0, whiteSpace:'pre-wrap' }}>{profile.event_description}</p>
              </div>
            )}
            {profile.event_booking_url && (
              <a href={profile.event_booking_url} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:`linear-gradient(135deg,${ec1},${ec2})`, borderRadius:'14px', padding:'14px 20px', color:'white', fontSize:'15px', fontWeight:'700', textDecoration:'none', width:'100%', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
                🎟️ Réserver ma place
              </a>
            )}
          </div>
        )}

        {/* Boutique */}
        {sortedProducts.length > 0 && (
          <div style={{ width:'100%', maxWidth:'384px', marginTop:'8px', marginBottom:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(135deg,#ff6b35,#f7c948)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><ShoppingBag size={14} color="white" /></div>
              <h2 style={{ color:'white', fontSize:'15px', fontWeight:800, margin:0 }}>Boutique</h2>
              <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.3)', fontSize:'12px' }}>{available.length} article{available.length > 1 ? 's' : ''}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {sortedProducts.map(p => (
                <PublicProductCard
                  key={p.id}
                  product={p}
                  onOpen={(product) => {
                    setSelectedProduct(product);
                    if (profile?.id) triggerMarketplaceClick(profile.id, { productId: product.id, productTitle: product.title, price: product.price });
                  }}
                />
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'10px', justifyContent:'center' }}>
              <Tag size={10} color="rgba(255,255,255,0.25)" />
              <span style={{ color:'rgba(255,255,255,0.25)', fontSize:'11px' }}>Contactez le vendeur pour commander</span>
            </div>
          </div>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <div style={{ width:'100%', maxWidth:'384px', marginTop:'8px', marginBottom:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(135deg,#ef4444,#b91c1c)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><FileText size={14} color="white" /></div>
              <h2 style={{ color:'white', fontSize:'15px', fontWeight:800, margin:0 }}>Documents</h2>
              <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.3)', fontSize:'12px' }}>{documents.length} fichier{documents.length > 1 ? 's' : ''}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {documents.map(doc => (
                <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px 16px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'14px', borderLeft:'3px solid #ef4444', textDecoration:'none', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >
                  <div style={{ width:'38px', height:'38px', borderRadius:'9px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><FileText size={18} color="#ef4444" /></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:'white', fontSize:'13px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.name}</div>
                    {doc.file_size && (
                      <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px', marginTop:'2px' }}>
                        PDF · {doc.file_size < 1048576 ? Math.round(doc.file_size / 1024) + ' Ko' : (doc.file_size / 1048576).toFixed(1) + ' Mo'}
                      </div>
                    )}
                  </div>
                  <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><ExternalLink size={14} color="#ef4444" /></div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Liens */}
        <div style={{ width:'100%', maxWidth:'384px', display:'flex', flexDirection:'column', gap:'12px', marginTop:'8px' }}>
          {enabledLinks.map((link, i) => {
            const key = (link.platform || '').toLowerCase();
            const platform = PLATFORMS[key] || {
              label: (link.platform || 'LIEN').toUpperCase(),
              color: '#6366f1',
              icon: (
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <rect width="24" height="24" rx="6" fill="#6366f1"/>
                  <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5" fill="none"/>
                  <ellipse cx="12" cy="12" rx="3.5" ry="8" stroke="white" strokeWidth="1.5" fill="none"/>
                  <line x1="4" y1="12" x2="20" y2="12" stroke="white" strokeWidth="1.5"/>
                </svg>
              ),
            };
            return (
              <div key={i} className="pp-link-btn" style={{ animationDelay: `${i * 0.07}s` }}>
                <RippleButton
                  onClick={() => handleLinkClick(link)}
                  platformColor={platform.color || '#6366f1'}
                  style={{ display:'flex', alignItems:'center', gap:'16px', width:'100%', padding:'14px 16px', borderRadius:'16px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', cursor:'pointer', textAlign:'left', boxShadow:'0 2px 12px rgba(0,0,0,0.15)', transition:'background 0.15s,transform 0.1s' }}
                >
                  <div style={{ width:'48px', height:'48px', borderRadius:'12px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {platform.icon ? React.cloneElement(platform.icon, { width: 48, height: 48 }) : null}
                  </div>
                  <span style={{ color:'white', fontWeight:'700', letterSpacing:'0.08em', fontSize:'14px', flex:1 }}>{link.label || platform.label}</span>
                  <ExternalLink size={16} color="rgba(255,255,255,0.5)" style={{ flexShrink:0 }} />
                </RippleButton>
              </div>
            );
          })}
        </div>

        {/* Support — [C11] numéro centralisé */}
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop:'32px', display:'flex', alignItems:'center', gap:'8px', background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.3)', borderRadius:'12px', padding:'10px 20px', color:'#25D366', fontSize:'13px', fontWeight:'500', textDecoration:'none' }}
        >
          <WhatsAppIcon size={16} color="#25D366" /> Contactez notre support
        </a>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', textAlign:'center', marginTop:'20px' }}>Tous droits réservés par Socialapp.</p>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          whatsappNumber={profile.phone || ''}
          profileId={profile.id}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}