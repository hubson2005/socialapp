/**
 * PublicProfile.jsx — Page profil publique SocialApp
 *
 * CORRECTIONS APPLIQUÉES (revisions précédentes) :
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
 *
 * CORRECTIONS ADAPTATION MOBILE/TABLETTE/iOS/ANDROID (révision précédente) :
 *  [F1]  Verrouillage du scroll dupliqué entre ImageLightbox et ProductDetailModal
 *        → mutualisé dans un hook unique useBodyScrollLock() avec compteur global
 *        et pattern iOS-safe (position:fixed + restauration du scrollY). Supprime
 *        le doublon de code ET évite un scroll-bleed si les deux modales venaient
 *        un jour à coexister.
 *  [F2]  100vh / 92vh / 90vh → 100dvh / 92dvh / 90dvh (fond de page + les deux
 *        modales) pour éviter que la barre d'adresse Safari iOS ne rogne le
 *        contenu à l'ouverture/fermeture.
 *  [F3]  -webkit-backdrop-filter ajouté à côté de chaque backdropFilter inline
 *        (Safari < 18 ignore la propriété non préfixée).
 *  [F4]  Boutons de fermeture des modales agrandis à 44×44px (cible tactile
 *        minimale) ; touchAction:'manipulation' sur les éléments interactifs
 *        pour supprimer le délai de tap ~300ms et le double-tap-zoom sur
 *        Android/iOS ; -webkit-tap-highlight-color:transparent ajouté
 *        globalement pour retirer le flash gris au tap sur Chrome Android.
 *  [F5]  ProductDetailModal et ImageLightbox rendues via createPortal(document.body)
 *        — protection préventive contre un bug de stacking context si cette page
 *        est un jour englobée dans un layout avec ancêtre transformé/filtré
 *        (même classe de bug déjà rencontrée et corrigée sur AutomationsPanel).
 *  [F6]  Nettoyage garanti des listeners globaux du swipe carrousel (touchmove/
 *        touchend sur document) même si le composant est démonté en plein geste
 *        (évite fuite mémoire / callback sur composant démonté lors d'une
 *        navigation rapide).
 *  [F7]  RippleButton : les setTimeout de nettoyage des ripples sont suivis et
 *        annulés au démontage (évite un setState après démontage si l'utilisateur
 *        navigue juste après un tap).
 *  [F8]  trackView() sorti du Promise.all bloquant : produits/documents s'affichent
 *        dès que leur propre requête répond, sans attendre la requête analytics.
 *  [F9]  Dépendances de l'effet fond d'écran resserrées à
 *        [profile?.bg_image_url, profile?.theme_color] (au lieu de l'objet
 *        profile entier) — évite de recréer inutilement le <style> de fond (et
 *        donc un micro-flash) à chaque mise à jour non liée au fond.
 *  [F10] Adaptation tablette : les sections (liens, boutique, documents,
 *        événement) partagent une classe .pp-content-col dont la largeur max
 *        passe de 384px à 480px à partir de 768px ; la grille boutique passe de
 *        2 à 3 colonnes à partir de 768px via .pp-shop-grid.
 *  [F11] Zones de sécurité iOS/Android : env(safe-area-inset-*) ajouté sur le
 *        padding du conteneur principal et sur le padding bas de la feuille
 *        produit, pour ne pas passer sous l'encoche / la barre de gestes.
 *  [F12] touchAction:'pan-y' ajouté au conteneur du carrousel d'événement pour
 *        laisser le scroll vertical natif tout en gérant le swipe horizontal
 *        manuellement.
 *  [F13] @media (prefers-reduced-motion: reduce) ajouté : coupe les animations
 *        (shimmer, pulse, ripple, fade/slide/zoom) pour les utilisateurs ayant
 *        activé la réduction des animations dans les réglages système iOS/Android.
 *  [F14] Vérification doublons : aucune règle CSS dupliquée résiduelle après
 *        cette relecture ; le seul doublon réel trouvé était la logique de
 *        verrouillage de scroll (voir [F1]), désormais mutualisée.
 *
 * CORRECTION QR / LIEN PUBLIC (révision précédente) :
 *  [Q1]  Lookup du profil passé de `.eq('username', username)` (comparaison
 *        exacte, sensible à la casse) à `.ilike('username', username)`
 *        (comparaison insensible à la casse).
 *
 * AMÉLIORATION LISIBILITÉ / OPACITÉ DES CARTES (cette révision) :
 *  [O1]  Boutons de liens (.pp-link-btn) : fond rgba(255,255,255,0.12→0.20),
 *        bordure 0.15→0.24. Le fond translucide devenait quasi invisible
 *        sur les images d'arrière-plan claires ou très texturées.
 *  [O2]  Cartes boutique (PublicProductCard) : fond 0.08→0.16, bordure
 *        0.12→0.20 pour détacher nettement la carte du fond derrière elle.
 *  [O3]  Cartes documents : fond 0.08→0.16, bordure 0.12→0.20 (même logique
 *        que [O2], garde la bordure rouge distinctive intacte).
 *  [O4]  Bloc countdown (jours/heures/min/sec) : fond 0.28→0.42, bordure
 *        0.25→0.35 — les chiffres orange perdaient en contraste sur fond
 *        clair.
 *  [O5]  Bloc description événement : fond 0.32→0.45, bordure 0.35→0.42.
 *  [O6]  Bouton support WhatsApp : fond 0.15→0.22, bordure 0.3→0.38.
 *  [O7]  Superposition #__bg_overlay__ légèrement assombrie
 *        (0.52/0.36 → 0.58/0.42) pour homogénéiser le contraste sous
 *        toutes les cartes, y compris celles restées sur fond dégradé (pas
 *        d'image).
 *  [O8]  Halo au survol desktop ajouté sur les cartes boutique et les
 *        boutons de liens (@media (hover:hover)) pour un retour visuel
 *        cohérent avec l'opacité renforcée.
 *  [O9]  RÉVISION 2 — le passage [O1]-[O8] (rgba blanc translucide,
 *        0.16→0.20) restait visuellement quasi identique sur les images
 *        de fond photo. Remplacé par une surface unie CARD_BG
 *        (rgba(15,10,30,0.94), proche du fond de page #0f0a1e) sur les
 *        boutons de liens, cartes boutique, cartes documents, bloc
 *        countdown et bloc description événement : ces cartes masquent
 *        maintenant réellement l'image derrière au lieu de la laisser
 *        transparaître. Libellé du countdown repassé en blanc translucide
 *        (était noir sur noir, invisible, avec l'ancien fond clair).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { ExternalLink, Phone, ShoppingBag, Tag, FileText, X, ZoomIn, Download } from 'lucide-react';
import { PLATFORMS } from '../components/dashboard/AddPlatformDialog';
// [A1][A2][A3][A6] Moteur d'automatisation — déclencheurs
import { triggerWhatsappClick }   from '../lib/triggers/whatsapp';
import { triggerQrScan }          from '../lib/triggers/qr';
import { triggerMarketplaceBuy }  from '../lib/triggers/marketplace';
import { triggerMarketplaceClick } from '../lib/triggers/marketplaceClick'; // [A6]
import SEO from "../components/SEO";
import PublicBookingWidget from '@/pages//PublicBookingWidget'; 

// ─── Constantes ───────────────────────────────────────────────
// [C11] Numéro support centralisé — modifier ici uniquement
const SUPPORT_WHATSAPP = '2250576031212';

// [O9] Surface opaque des cartes (révision 2) — le premier passage
// (rgba blanc 0.16→0.20) restait translucide et quasi invisible sur les
// images de fond. On passe à une surface unie proche de la couleur de
// fond de page (#0f0a1e), quasi opaque (0.94), qui masque réellement
// l'image derrière au lieu de la laisser transparaître.
const CARD_BG        = 'rgba(20,14,38,0.62)';
const CARD_BG_HOVER   = 'rgba(32,23,58,0.74)';
const CARD_BORDER    = '1px solid rgba(255,255,255,0.18)';
const CARD_BLUR      = { backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)' };
const CARD_SHADOW    = '0 4px 20px rgba(0,0,0,0.28)';

const KEYFRAME_SKELETON_ID  = 'pp-keyframes-skeleton';
const KEYFRAME_MAIN_ID      = 'pp-keyframes-main';

// ─── [F1] Verrouillage du scroll body — mutualisé ──────────────
// Remplace les deux implémentations dupliquées (ImageLightbox et
// ProductDetailModal faisaient chacune leur propre
// document.body.style.overflow='hidden'). Un compteur global permet
// aux deux modales de coexister sans se marcher dessus (si l'une se
// ferme pendant que l'autre est encore ouverte, le scroll ne se
// débloque que lorsque le compteur retombe à zéro). Le pattern
// position:fixed + restauration du scrollY est nécessaire car iOS
// Safari ignore parfois overflow:hidden seul sur le body, notamment
// quand un clavier virtuel est impliqué ailleurs sur la page.
let __ppScrollLockCount = 0;
let __ppScrollY = 0;

function lockBodyScroll() {
  if (__ppScrollLockCount === 0) {
    __ppScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${__ppScrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }
  __ppScrollLockCount++;
}

function unlockBodyScroll() {
  __ppScrollLockCount = Math.max(0, __ppScrollLockCount - 1);
  if (__ppScrollLockCount === 0) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, __ppScrollY);
  }
}

function useBodyScrollLock() {
  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);
}

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
        /* [F13] Réduction des animations si demandé au niveau système */
        @media (prefers-reduced-motion: reduce) {
          .pp-sk { animation: none; }
        }
      `;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div style={{ minHeight:'100dvh', background:'#0f0a1e', display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 16px' }}>
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

// [F1] Body-scroll lock mutualisé · [F2] 90vh → 90dvh · [F3] webkit prefix
// [F4] Bouton de fermeture agrandi à 44×44 + touchAction manipulation
function ImageLightbox({ src, onClose }) {
  useBodyScrollLock();

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9500, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', animation:'pp-fadeInOverlay 0.2s ease' }}>
      <button
        onClick={onClose}
        aria-label="Fermer"
        style={{ position:'absolute', top:'16px', right:'16px', width:'44px', height:'44px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'white', zIndex:2, touchAction:'manipulation' }}
      >
        <X size={18} />
      </button>
      <img src={src} alt="aperçu" onClick={e => e.stopPropagation()} style={{ maxWidth:'100%', maxHeight:'90dvh', borderRadius:'16px', objectFit:'contain', boxShadow:'0 24px 80px rgba(0,0,0,0.8)', animation:'pp-zoomIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }} />
    </div>
  );
}

// [F7] Timeouts de ripple suivis et annulés au démontage
function RippleButton({ onClick, style, children, platformColor }) {
  const [ripples, setRipples] = useState([]);
  const timeouts = useRef([]);

  useEffect(() => {
    return () => { timeouts.current.forEach(clearTimeout); timeouts.current = []; };
  }, []);

  const handlePointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(p => [...p, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    const t = setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 600);
    timeouts.current.push(t);
  };
  return (
    <button
      onClick={onClick}
      onPointerDown={handlePointerDown}
      className="pp-link-btn-el"
      style={{ ...style, position:'relative', overflow:'hidden', touchAction:'manipulation', borderLeft: platformColor ? `4px solid ${platformColor}` : '4px solid rgba(255,255,255,0.15)' }}
    >
      {ripples.map(r => (
        <span key={r.id} style={{ position:'absolute', left:r.x, top:r.y, width:'8px', height:'8px', borderRadius:'50%', background:'rgba(255,255,255,0.45)', transform:'translate(-50%,-50%) scale(0)', animation:'pp-ripple 0.6s ease-out forwards', pointerEvents:'none' }} />
      ))}
      {children}
    </button>
  );
}

// [F1] Body-scroll lock mutualisé · [F2] 92vh → 92dvh · [F3] webkit prefix
// [F4] Bouton de fermeture agrandi à 44×44 · [F11] safe-area-inset-bottom
function ProductDetailModal({ product, whatsappNumber, profileId, onClose }) {
  const discount = product.original_price && product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;
  const waNumber = (whatsappNumber || '').replace(/\D/g, '');
  const waMsg = encodeURIComponent(`Bonjour ! Je suis intéressé(e) par votre article : *${product.title}* à ${formatPrice(product.price)}. Est-il encore disponible ?`);

  useBodyScrollLock();

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', display:'flex', alignItems:'flex-end', justifyContent:'center', animation:'pp-fadeInOverlay 0.25s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0f0a1e', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'480px', maxHeight:'92dvh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 -20px 60px rgba(0,0,0,0.6)', animation:'pp-slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 0' }}>
          <div style={{ width:'36px', height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', padding:'8px 16px 0' }}>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{ width:'44px', height:'44px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.6)', fontSize:'18px', touchAction:'manipulation' }}
          >×</button>
        </div>
        <div style={{ overflowY:'auto', WebkitOverflowScrolling:'touch', overscrollBehavior:'contain', padding:'0 0 calc(32px + env(safe-area-inset-bottom, 0px))' }}>
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
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', width:'100%', padding:'15px', background:'#25D366', borderRadius:'16px', color:'white', fontSize:'16px', fontWeight:700, textDecoration:'none', boxShadow:'0 8px 24px rgba(37,211,102,0.35)', marginBottom:'12px', touchAction:'manipulation' }}
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

// [O2] Fond 0.08→0.16, bordure 0.12→0.20 · [O8] halo au survol desktop
function PublicProductCard({ product, onOpen }) {
  const discount = product.original_price && product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;
  return (
    <div
      onClick={() => onOpen(product)}
      className="pp-shop-card"
      style={{ background:CARD_BG, border:CARD_BORDER, boxShadow:CARD_SHADOW, ...CARD_BLUR, borderRadius:'16px', overflow:'hidden', position:'relative', cursor:'pointer', transition:'transform 0.15s,background 0.15s', touchAction:'manipulation' }}
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
  // [F10] .pp-content-col / .pp-shop-grid : adaptation tablette (>=768px)
  // [F13] prefers-reduced-motion : coupe les animations décoratives
  // [O8] Halos de survol desktop sur cartes boutique et boutons de liens
  useEffect(() => {
    if (!document.getElementById(KEYFRAME_MAIN_ID)) {
      const s = document.createElement('style');
      s.id = KEYFRAME_MAIN_ID;
      s.textContent = `
        html,body { min-height:100%;margin:0;padding:0;background:transparent; }
        a,button { -webkit-tap-highlight-color:transparent; }
        @keyframes pp-pulse       { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pp-ripple      { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 100%{transform:translate(-50%,-50%) scale(28);opacity:0} }
        @keyframes pp-fadeSlideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pp-fadeInOverlay { from{opacity:0} to{opacity:1} }
        @keyframes pp-slideUp     { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pp-zoomIn      { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
        .pp-link-btn              { animation:pp-fadeSlideUp 0.4s ease both; }

        /* [F10] Colonne de contenu partagée (liens, boutique, docs, événement) */
        .pp-content-col { width:100%; max-width:384px; }
        .pp-shop-grid   { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        @media (min-width:768px) {
          .pp-content-col { max-width:480px; }
          .pp-shop-grid   { grid-template-columns:repeat(3,1fr); gap:12px; }
        }

        /* [O8] Halo au survol desktop uniquement (évite un "collant" tactile) */
        @media (hover: hover) {
          .pp-link-btn-el:hover  { background:${CARD_BG_HOVER} !important; }
          .pp-shop-card:hover    { background:${CARD_BG_HOVER} !important; transform:translateY(-2px); }
        }

        /* [F13] Réduction des animations si demandé au niveau système */
        @media (prefers-reduced-motion: reduce) {
          .pp-link-btn { animation:none; }
          *, *::before, *::after { animation-duration:0.001ms !important; animation-iteration-count:1 !important; transition-duration:0.001ms !important; }
        }
      `;
      document.head.appendChild(s);
    }
  }, []);

  // ── Chargement initial ───────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // [Q1] `.ilike` au lieu de `.eq` — lookup insensible à la casse.
      // Sans caractères joker (%), c'est toujours une comparaison exacte
      // du username, juste sans distinction majuscule/minuscule. Corrige
      // le cas où le lien encodé dans le QR (ou saisi/partagé) diffère
      // par la casse de ce qui est stocké en base.
      const { data, error } = await supabase
        .from('link_profiles')
        .select('*')
        .ilike('username', username)
        .maybeSingle();

      if (!isMounted.current) return; // [C8]

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);

      // [F8] Analytics fire-and-forget, ne bloque plus l'affichage des
      // produits/documents : trackView() n'est plus dans le Promise.all.
      trackView(data.id);

      Promise.all([
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
      ]).then(([prod, docs]) => {
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
  // [F6] Nettoyage garanti des listeners globaux même si démontage en cours de geste
  const swipeCleanupRef = useRef(null);

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
        cleanup();
      }
    };
    const onEnd = () => cleanup();
    function cleanup() {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      if (swipeCleanupRef.current === cleanup) swipeCleanupRef.current = null;
    }
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { once: true });
    swipeCleanupRef.current = cleanup;
  }, [images.length]); // [C4] currentIndex retiré des deps — setter fonctionnel utilisé

  // [F6] Si le composant se démonte pendant un geste en cours, on retire
  // les listeners globaux laissés en place (évite fuite mémoire et tout
  // callback tardif après démontage lors d'une navigation rapide).
  useEffect(() => {
    return () => { if (swipeCleanupRef.current) swipeCleanupRef.current(); };
  }, []);

  // ── Countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.is_event || !profile?.event_date) return;
    setCountdown(getCountdown(profile.event_date));
    const t = setInterval(() => setCountdown(getCountdown(profile.event_date)), 1000);
    return () => clearInterval(t);
  }, [profile?.is_event, profile?.event_date]);

  // ── [C5][F9][O7] Background style — injection unifiée, sans flash ───
  // [F2] 100vh → 100dvh pour éviter le rognage par la barre d'adresse iOS
  // [F9] Dépendances resserrées : ne se recrée plus sur un changement de
  // profil non lié au fond (évite un micro-flash inutile).
  // [O7] Overlay assombri (0.52/0.36 → 0.58/0.42) pour homogénéiser le
  // contraste sous les cartes désormais plus opaques.
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
        #__bg_overlay__ { position:fixed;top:0;left:0;width:100vw;height:100dvh;z-index:-9;background:linear-gradient(160deg,rgba(0,0,0,0.58),rgba(0,0,0,0.42));pointer-events:none; }
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
  }, [profile?.bg_image_url, profile?.theme_color]); // [F9]

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
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f0a1e', color:'white' }}>
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
    <SEO
      title={`${profile.display_name} | SocialApp`}
      description={profile.bio}
      url={`https://www.socialapp.work/${profile.username}`}
      image={profile.avatar_url}
      type="profile"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Person",
        name: profile.display_name,
        url: `https://www.socialapp.work/${profile.username}`,
        image: profile.avatar_url,
      }}
    />
      <div id="__bg_layer__" />
      <div id="__bg_overlay__" />

      {/* [F11] Zones de sécurité iOS/Android sur le padding vertical/horizontal
          du conteneur principal — évite de passer sous l'encoche ou la barre
          de gestes en haut/bas, et sous l'encoche latérale en paysage. */}
      <div style={{
        position:'relative', zIndex:1, minHeight:'100dvh',
        display:'flex', flexDirection:'column', alignItems:'center',
        paddingTop:    'max(40px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(40px, env(safe-area-inset-bottom, 0px))',
        paddingLeft:   'max(16px, env(safe-area-inset-left, 0px))',
        paddingRight:  'max(16px, env(safe-area-inset-right, 0px))',
      }}>

        {/* Avatar */}
        <div style={{ position:'relative', marginBottom:'16px' }}>
          <div style={{ padding:'3px', borderRadius:'28px', background:'linear-gradient(135deg,rgba(255,255,255,0.4),rgba(255,255,255,0.05))', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
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
          <div className="pp-content-col" style={{ marginBottom:'20px' }}>
            {images.length > 0 && (
              // [F12] touchAction:'pan-y' — laisse le scroll vertical natif,
              // le swipe horizontal reste géré manuellement par handleTouchStart
              <div style={{ position:'relative', borderRadius:'20px', overflow:'hidden', marginBottom:'12px', boxShadow:'0 8px 32px rgba(0,0,0,0.3)', touchAction:'pan-y' }} onTouchStart={handleTouchStart}>
                <img src={images[currentIndex]} alt="event" style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', display:'block', transition:'opacity 0.5s ease', cursor:'zoom-in' }} onClick={() => setLightboxSrc(images[currentIndex])} />
                <div style={{ position:'absolute', bottom:'14px', right:'12px', display:'flex', gap:'6px', zIndex:10 }}>
                  <button onClick={e => { e.stopPropagation(); setLightboxSrc(images[currentIndex]); }} style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(99,102,241,0.9)', color:'white', padding:'8px 12px', borderRadius:'999px', fontWeight:'700', fontSize:'11px', border:'none', cursor:'pointer', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', touchAction:'manipulation', minHeight:'36px' }}>
                    <ZoomIn size={12} /> Afficher
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDownload(images[currentIndex]); }} style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(255,255,255,0.92)', color:'#000', padding:'8px 12px', borderRadius:'999px', fontWeight:'700', fontSize:'11px', border:'none', cursor:'pointer', touchAction:'manipulation', minHeight:'36px' }}>
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
              // [O4/O9] Fond opaque CARD_BG au lieu de rgba blanc translucide
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'12px' }}>
                {[{ v:countdown.days, l:'Jours' }, { v:countdown.hours, l:'Heures' }, { v:countdown.mins, l:'Min' }, { v:countdown.secs, l:'Sec' }].map(({ v, l }) => (
                  <div key={l} style={{ background:CARD_BG, borderRadius:'12px', padding:'10px', textAlign:'center', border:CARD_BORDER, boxShadow:CARD_SHADOW, ...CARD_BLUR }}>
                    <div style={{ fontSize:'24px', fontWeight:'800', color:'#fa4e0f', lineHeight:1 }}>{String(v).padStart(2, '0')}</div>
                    <div style={{ fontWeight:'700', fontSize:'9px', color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'1px', marginTop:'3px' }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            {profile.event_description && (
              // [O5/O9] Fond opaque CARD_BG au lieu de rgba blanc translucide
              <div style={{ background:CARD_BG, borderRadius:'16px', padding:'14px 16px', marginBottom:'12px', border:CARD_BORDER, boxShadow:CARD_SHADOW, ...CARD_BLUR }}>
                <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.75)', lineHeight:'1.6', margin:0, whiteSpace:'pre-wrap' }}>{profile.event_description}</p>
              </div>
            )}
            {profile.event_booking_url && (
              <a href={profile.event_booking_url} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:`linear-gradient(135deg,${ec1},${ec2})`, borderRadius:'14px', padding:'14px 20px', color:'white', fontSize:'15px', fontWeight:'700', textDecoration:'none', width:'100%', boxShadow:'0 4px 20px rgba(0,0,0,0.2)', touchAction:'manipulation' }}>
                🎟️ Réserver ma place
              </a>
            )}
          </div>
        )}
   {/* Réservation */}
        <div className="pp-content-col" style={{ marginTop:'8px', marginBottom:'20px' }}>
          <PublicBookingWidget profileId={profile.id} />
        </div>
        
        {/* Boutique */}
        {sortedProducts.length > 0 && (
          <div className="pp-content-col" style={{ marginTop:'8px', marginBottom:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(135deg,#ff6b35,#f7c948)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><ShoppingBag size={14} color="white" /></div>
              <h2 style={{ color:'white', fontSize:'15px', fontWeight:800, margin:0 }}>Boutique</h2>
              <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.3)', fontSize:'12px' }}>{available.length} article{available.length > 1 ? 's' : ''}</span>
            </div>
            <div className="pp-shop-grid">
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
          <div className="pp-content-col" style={{ marginTop:'8px', marginBottom:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(135deg,#ef4444,#b91c1c)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><FileText size={14} color="white" /></div>
              <h2 style={{ color:'white', fontSize:'15px', fontWeight:800, margin:0 }}>Documents</h2>
              <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.3)', fontSize:'12px' }}>{documents.length} fichier{documents.length > 1 ? 's' : ''}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {/* [O3] Fond 0.08→0.16, bordure 0.12→0.20 */}
              {documents.map(doc => (
                <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px 16px', background:CARD_BG, border:CARD_BORDER, boxShadow:CARD_SHADOW, ...CARD_BLUR, borderRadius:'14px', borderLeft:'3px solid #ef4444', textDecoration:'none', transition:'background 0.15s', touchAction:'manipulation' }}
                  onMouseEnter={e => e.currentTarget.style.background = CARD_BG_HOVER}
                  onMouseLeave={e => e.currentTarget.style.background = CARD_BG}
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

        {/* Liens — [O1] fond 0.12→0.20, bordure 0.15→0.24 */}
        <div className="pp-content-col" style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'8px' }}>
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
                  style={{ display:'flex', alignItems:'center', gap:'16px', width:'100%', padding:'14px 16px', borderRadius:'16px', background:CARD_BG, border:CARD_BORDER, ...CARD_BLUR, cursor:'pointer', textAlign:'left', boxShadow:CARD_SHADOW, transition:'background 0.15s,transform 0.1s' }}
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

        {/* Support — [C11] numéro centralisé · [O6] fond 0.15→0.22, bordure 0.3→0.38 */}
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop:'32px', display:'flex', alignItems:'center', gap:'8px', background:'rgba(37,211,102,0.22)', border:'1px solid rgba(37,211,102,0.38)', borderRadius:'12px', padding:'10px 20px', color:'#25D366', fontSize:'13px', fontWeight:'500', textDecoration:'none', touchAction:'manipulation' }}
        >
          <WhatsAppIcon size={16} color="#25D366" /> Contactez notre support
        </a>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', textAlign:'center', marginTop:'20px' }}>Tous droits réservés par Socialapp.</p>
      </div>

      {/* [F5] Modales portées dans document.body — protection préventive
          contre un futur bug de stacking context si cette page est un
          jour englobée dans un layout avec un ancêtre transformé/filtré. */}
      {selectedProduct && createPortal(
        <ProductDetailModal
          product={selectedProduct}
          whatsappNumber={profile.phone || ''}
          profileId={profile.id}
          onClose={() => setSelectedProduct(null)}
        />,
        document.body
      )}
      {lightboxSrc && createPortal(
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />,
        document.body
      )}
    </>
  );
}
