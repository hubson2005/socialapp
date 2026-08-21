import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Plus, Save, Loader2, Lock, CheckCircle, AlertCircle, Crown,
  CalendarClock, LogOut, AtSign, Eye, CalendarDays, BadgeCheck,
  ImagePlus, X, ChevronLeft, ChevronRight, Video, BarChart2,
  Link2, ShoppingBag, FileText, Palette, MapPin, Users, Image,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext.jsx';
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import PlatformCard from "@/components/dashboard/PlatformCard";
import AddPlatformDialog from "@/components/dashboard/AddPlatformDialog";
import QRCodeDisplay from "@/components/dashboard/QRCodeDisplay";
import ThemeColorPicker from "@/components/dashboard/ThemeColorPicker";
import StatsCard from "@/components/dashboard/StatsCard";
import ProfilePreview from "@/components/dashboard/ProfilePreview";
import MarketplacePanel from "@/components/dashboard/MarketplacePanel";
import DocumentsPanel from "@/components/dashboard/DocumentsPanel";
import MobileNav from "@/components/dashboard/MobileNav";
import RealtimePanel from "@/components/dashboard/RealtimePanel";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import AutomationsPanel from "@/components/dashboard/AutomationsPanel";
import IntegrationsPanel from "@/components/dashboard/IntegrationsPanel";
import LeadsCRMPanel from "@/components/dashboard/LeadsCRMPanel";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import UserSidebar, { USER_NAV, USER_GROUPS, PLAN_ORDER } from "@/components/dashboard/UserSidebar";
import OverviewPanel from "@/components/dashboard/OverviewPanel";
import EventPanel from "@/components/dashboard/EventPanel";
import { useTranslation } from 'react-i18next';
import WhatsappCRMPanel from "@/components/dashboard/WhatsappCRMPanel";
import BookingCalendarPanel from "@/components/dashboard/BookingCalendarPanel";
import BoostPanel from "@/components/dashboard/BoostPanel";
import MetaIntegrationPanel from "@/components/dashboard/MetaIntegrationPanel";
import BoostAnalyticsPanel from "@/components/dashboard/BoostAnalyticsPanel";
import PromotionsDashboard from "@/components/dashboard/PromotionsDashboard";
import { BioAIGenerator, CampaignAIGenerator, PlatformAISuggestions } from "@/components/dashboard/AIPanels";
import FormsPanel from "@/components/forms/FormsPanel";
import NotificationBell from './NotificationBell';
import WaveModal from "@/components/dashboard/WaveModal";
import FeatureUpgradeModal from "@/components/dashboard/FeatureUpgradeModal";
import InstallPrompt from "@/components/dashboard/InstallPrompt";

// ─── ErrorBoundary ────────────────────────────────────────────────────────────
class PanelErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[PanelErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'320px', gap:'16px', padding:'40px', textAlign:'center' }}>
          <div style={{ fontSize:'40px' }}>⚠️</div>
          <p style={{ color:'#1a1f36', fontSize:'16px', fontWeight:700, margin:0 }}>Ce panneau a rencontré une erreur</p>
          <p style={{ color:'#6b7280', fontSize:'13px', margin:0, maxWidth:'420px', lineHeight:1.6 }}>{this.state.error?.message || 'Erreur inconnue'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} style={{ padding:'8px 20px', background:'#eef0ff', border:'1px solid #c7cdfb', borderRadius:'10px', color:'#4338ca', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Réessayer</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Seuils de breakpoint : mobile < 768, tablette 768–1024, desktop > 1024.
// (iPad portrait ≈ 768–834, iPad landscape ≈ 1024–1194, la plupart des
// tablettes Android tombent dans la même plage.)
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    // orientationchange est nécessaire en plus de resize : sur iOS/Android,
    // certains navigateurs ne déclenchent pas resize de façon fiable lors
    // d'une rotation d'écran sur tablette.
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    window.addEventListener('orientationchange', h);
    return () => {
      window.removeEventListener('resize', h);
      window.removeEventListener('orientationchange', h);
    };
  }, []);
  return width;
}

const PLAN_LIMITS = {
  basic:      { maxLinks:3,  maxProfiles:1, hasStats:false, maxMarketplace:4,        maxDocs:1,  maxForms:1,        hasEvent:false, hasRealtime:false, hasCRM:false,  hasAutomations:false, hasIntegrations:false,      hasAdvancedAnalytics:false, qrType:'standard', colorCustom:'basic',    badge:false, label:'BASIC',      color:'#6366f1', emoji:'⚡',  price:'10 000 FCFA' },
  pro:        { maxLinks:8,  maxProfiles:1, hasStats:true,  maxMarketplace:10,       maxDocs:3,  maxForms:5,        hasEvent:true,  hasRealtime:true,  hasCRM:false,  hasAutomations:false, hasIntegrations:'partial',  hasAdvancedAnalytics:false, qrType:'premium',  colorCustom:'advanced', badge:true,  label:'PRO',        color:'#ff8c00', emoji:'🚀',  price:'15 000 FCFA' },
  business:   { maxLinks:17, maxProfiles:1, hasStats:true,  maxMarketplace:Infinity, maxDocs:10, maxForms:Infinity, hasEvent:true,  hasRealtime:true,  hasCRM:true,   hasAutomations:true,  hasIntegrations:true,       hasAdvancedAnalytics:true,  qrType:'dynamic',  colorCustom:'complete', badge:true,  label:'BUSINESS',   color:'#f7c948', emoji:'💼',  price:'25 000 FCFA' },
  événement:  { maxLinks:3,  maxProfiles:1, hasStats:false, maxMarketplace:0,        maxDocs:0,  hasEvent:true,     hasRealtime:false, hasCRM:false,   hasAutomations:false, hasIntegrations:false,      hasAdvancedAnalytics:false, qrType:'standard', colorCustom:'basic',    badge:false, label:'ÉVÉNEMENT',  color:'#22c55e', emoji:'🎉',  price:'' },
};

const isVideoUrl   = (url) => /\.(mp4|webm|ogg|mov|avi|mkv|quicktime)$/i.test(url || '');
const parseColors  = (themeColor) => {
  if (themeColor && themeColor.includes('|')) { const [bg1, bg2] = themeColor.split('|'); return { bg1, bg2 }; }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};
const MAX_SIZE_KB = 2000;

const db = {
  get:    async (userId) => { const { data, error } = await supabase.from('link_profiles').select('*').eq('user_id', userId).order('created_at', { ascending: true }); if (error) throw error; return data || []; },
  create: async (data)   => { const { data: created, error } = await supabase.from('link_profiles').insert([data]).select().maybeSingle(); if (error) throw error; return created; },
  update: async (id, data) => { const { data: updated, error } = await supabase.from('link_profiles').update(data).eq('id', id).select().maybeSingle(); if (error) throw error; return updated; },
};

function PlanModal({ onClose, onSelect }) {
  const plans = [
    { name:'BASIC', emoji:'⚡', price:'10 000', color:'#4f46e5', subtitle:'Particulier, petit commerce, entrepreneur débutant', bg:'#f5f6ff', border:'1px solid #d9dcfb', features:['1 profil · 3 liens sociaux','Page publique','QR Code standard','1 import PDF','Marketplace (4 produits)'] },
    { name:'PRO', emoji:'🚀', price:'15 000', color:'#d9591f', popular:true, subtitle:'Professionnels, influenceurs, restaurants, boutiques', bg:'#fff6ef', border:'2px solid #f3b183', features:['1 profil · 8 liens sociaux','1 Carte NFC ou PVC','Analytics & stats détaillées','Temps réel — visiteurs live','Mode Événement inclus','Marketplace (10 produits)','Support standard'] },
    { name:'BUSINESS', emoji:'💼', price:'25 000', color:'#b8860b', subtitle:'Grandes entreprises, agences com, marques établies', bg:'#fffaf0', border:'1px solid #f0dca3', features:['1 profil · 17 liens sociaux','1 Carte NFC ou PVC','CRM & Pipeline de leads','CRM WHATSAPP','Automatisations','Marketplace illimitée','Support VIP prioritaire'] },
  ];
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(15,17,30,.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <motion.div initial={{ opacity:0, scale:0.93, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.93 }} transition={{ type:'spring', stiffness:300, damping:25 }} onClick={e=>e.stopPropagation()}
        style={{ background:'#ffffff', border:'1px solid #e6e8f0', borderRadius:'28px', padding:'36px 28px', maxWidth:'900px', width:'100%', boxShadow:'0 30px 80px rgba(15,23,42,.25)', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:'16px', right:'16px', background:'#f1f2f7', border:'1px solid #e2e4ee', borderRadius:'50%', width:'32px', height:'32px', color:'#6b7280', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit', lineHeight:1 }}>×</button>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'#fff1e8', border:'1px solid #f3c8a8', borderRadius:'100px', padding:'5px 14px', fontSize:'11px', color:'#c2530f', fontWeight:'700', marginBottom:'12px' }}>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#c2530f' }} />Choisissez votre nouvelle offre
          </div>
          <h2 style={{ fontSize:'22px', fontWeight:'900', color:'#161a2e', margin:'0 0 6px', letterSpacing:'-0.5px' }}>Passez à la vitesse supérieure</h2>
          <p style={{ color:'#6b7280', fontSize:'13px', margin:0 }}>Paiement Mobile Money · Wave · Orange Money · Sans carte bancaire</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }} className="plan-modal-grid">
          {plans.map((p,i) => (
            <div key={i} onClick={()=>onSelect(p.name.toLowerCase())} className="plan-modal-card"
              style={{ background:p.bg, border:p.border, borderRadius:'20px', padding:p.popular?'32px 20px 20px':'20px', position:'relative', cursor:'pointer', transition:'transform .18s, box-shadow .18s', marginTop:p.popular?'14px':'0', boxShadow:'0 1px 3px rgba(15,23,42,.06)' }}>
              {p.popular && <div style={{ position:'absolute', top:'-13px', left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#ff8c42,#f7c948)', borderRadius:'100px', padding:'4px 14px', fontSize:'10px', fontWeight:'700', color:'#fff', whiteSpace:'nowrap', boxShadow:'0 4px 12px rgba(217,89,31,.3)' }}>⭐ Plus populaire</div>}
              <div style={{ fontSize:'10px', fontWeight:'700', color:p.color, letterSpacing:'2px', textTransform:'uppercase', marginBottom:'10px' }}>{p.emoji} {p.name}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:'3px', marginBottom:'3px' }}><span style={{ fontSize:'28px', fontWeight:'900', color:'#161a2e', letterSpacing:'-1px' }}>{p.price}</span><span style={{ fontSize:'12px', color:'#9095a5' }}>FCFA</span></div>
              <div style={{ fontSize:'10px', color:'#a2a7b5', marginBottom:'5px' }}>/ Paiement annuel</div>
              <div style={{ fontSize:'11px', color:'#5c6270', marginBottom:'14px', lineHeight:'1.5', minHeight:'28px' }}>{p.subtitle}</div>
              <hr style={{ border:'none', borderTop:'1px solid rgba(15,23,42,.08)', marginBottom:'12px' }} />
              {p.features.map((f,j) => <div key={j} style={{ display:'flex', gap:'6px', marginBottom:'6px', fontSize:'11px', color:'#454b5a', alignItems:'flex-start' }}><span style={{ color:p.color, flexShrink:0, marginTop:'1px' }}>✓</span>{f}</div>)}
              <button type="button" className="plan-modal-btn" style={{ display:'block', width:'100%', marginTop:'14px', padding:'11px', borderRadius:'11px', border:'none', background:p.popular?'linear-gradient(135deg,#ff8c42,#f7c948)':'#161a2e', color:'#fff', fontWeight:'700', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>Choisir {p.name} →</button>
            </div>
          ))}
        </div>
        <p style={{ textAlign:'center', color:'#a2a7b5', fontSize:'11px', marginTop:'20px' }}>💬 Besoin d'aide ? WhatsApp <strong style={{ color:'#5c6270' }}>+225 05 76 03 12 12</strong></p>
      </motion.div>
      <style>{`
        @media(max-width:1024px){.plan-modal-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:640px){.plan-modal-grid{grid-template-columns:1fr!important}}
        .plan-modal-card:hover{transform:translateY(-4px);box-shadow:0 14px 34px rgba(15,23,42,.12)}
        .plan-modal-btn:hover{opacity:.88}
        /* Cibles tactiles ≥44px sur mobile/tablette (iOS/Android) */
        @media(pointer:coarse){.plan-modal-btn{min-height:44px}}
      `}</style>
    </motion.div>
  );
}

// SUPPRIMÉ — l'ancienne fonction WaveModal locale faisait doublon avec
// l'import `WaveModal` depuis "@/components/dashboard/WaveModal" en haut
// de ce fichier (redéclaration = crash). Le composant est maintenant
// exclusivement celui du fichier séparé, qui reçoit `plan` pour afficher
// le montant dynamique et gère lui-même le blocage du scroll body.

function LockedFeaturePanel({ requiredPlan, featureName, icon: Icon, onUpgrade }) {
  const isPro = requiredPlan === 'pro';
  const color = isPro ? '#d9591f' : '#b8860b';
  const planLabel = isPro ? 'PRO' : 'BUSINESS';
  const price = isPro ? '15 000 FCFA / an' : '25 000 FCFA / an';
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'360px', gap:'20px', textAlign:'center', padding:'40px 32px', background:'#ffffff', border:'1px solid #e6e8f0', borderRadius:'20px' }}>
      <div style={{ position:'relative' }}>
        <div style={{ width:'80px', height:'80px', borderRadius:'24px', background:color+'14', border:'1px solid '+color+'40', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>{Icon && <Icon size={32} color={color} />}</div>
        <div style={{ position:'absolute', top:'-6px', right:'-6px', width:'28px', height:'28px', borderRadius:'50%', background:'#ffffff', border:'2px solid '+color+'55', boxShadow:'0 2px 6px rgba(15,23,42,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>🔒</div>
      </div>
      <div>
        <p style={{ color:'#161a2e', fontSize:'20px', fontWeight:800, margin:'0 0 8px' }}>{featureName}</p>
        <p style={{ color:'#6b7280', fontSize:'14px', margin:'0 0 6px', lineHeight:1.5 }}>Cette fonctionnalité est disponible à partir de l'offre</p>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:color+'14', border:'1px solid '+color+'40', borderRadius:'100px', padding:'5px 14px', marginBottom:'6px' }}>
          <span style={{ color, fontSize:'13px', fontWeight:700 }}>{planLabel}</span>
        </div>
        <p style={{ color:'#9095a5', fontSize:'12px', margin:'6px 0 0' }}>{price}</p>
      </div>
      <button type="button" onClick={onUpgrade} style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,'+color+','+color+'cc)', borderRadius:'14px', padding:'12px 28px', color:'white', fontSize:'14px', fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 20px '+color+'33' }}>
        <Crown size={15} /> Passer en {planLabel} — {price}
      </button>
    </motion.div>
  );
}

function EventMediaCarousel({ medias = [], onRemove, adminMode = false }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);
  const urls = medias.map(m => typeof m === 'string' ? m : m?.url).filter(Boolean);
  const currentUrl = urls[current];
  const isVid = isVideoUrl(currentUrl);
  useEffect(() => { setCurrent(0); }, [urls.length]);
  useEffect(() => {
    if (urls.length <= 1 || isVid) return;
    intervalRef.current = setInterval(() => setCurrent(p => (p + 1) % urls.length), 3500);
    return () => clearInterval(intervalRef.current);
  }, [urls.length, isVid]);
  const goTo = (idx) => { clearInterval(intervalRef.current); setCurrent(idx); if (!isVideoUrl(urls[idx])) intervalRef.current = setInterval(() => setCurrent(p => (p + 1) % urls.length), 3500); };
  if (!urls.length) return null;
  return (
    <div style={{ position:'relative', borderRadius:'12px', overflow:'hidden', background:'#000' }}>
      <AnimatePresence mode="wait">
        {isVid ? <motion.video key={current} src={currentUrl} controls muted loop playsInline initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }} style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', display:'block' }} />
               : <motion.img key={current} src={currentUrl} alt="" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }} style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', display:'block' }} />}
      </AnimatePresence>
      {urls.length > 1 && <div style={{ position:'absolute', top:'8px', right:adminMode?'44px':'8px', background:'rgba(0,0,0,0.55)', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', color:'white', fontWeight:600 }}>{current+1}/{urls.length}</div>}
      {adminMode && onRemove && <button type="button" onClick={()=>onRemove(current)} style={{ position:'absolute', top:'8px', right:'8px', width:'26px', height:'26px', borderRadius:'50%', background:'rgba(0,0,0,0.65)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={13} color="white" /></button>}
      {urls.length > 1 && <><button type="button" onClick={()=>goTo((current-1+urls.length)%urls.length)} style={{ position:'absolute', left:'6px', top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.45)', border:'none', borderRadius:'50%', width:'26px', height:'26px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><ChevronLeft size={15} color="white" /></button><button type="button" onClick={()=>goTo((current+1)%urls.length)} style={{ position:'absolute', right:adminMode?'40px':'6px', top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.45)', border:'none', borderRadius:'50%', width:'26px', height:'26px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><ChevronRight size={15} color="white" /></button></>}
      {urls.length > 1 && <div style={{ position:'absolute', bottom:'8px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'4px' }}>{urls.map((u,i) => <button key={i} type="button" onClick={()=>goTo(i)} style={{ width:i===current?'16px':'5px', height:'5px', borderRadius:'3px', background:isVideoUrl(u)?(i===current?'#a5b4fc':'rgba(165,180,252,0.4)'):(i===current?'white':'rgba(255,255,255,0.4)'), border:'none', cursor:'pointer', padding:0, transition:'all 0.3s' }} />)}</div>}
    </div>
  );
}

// Bannière de rappel d'abonnement SenePay — même emplacement/logique que
// <InstallPrompt /> (visible en haut du contenu, sur toutes les sections).
// Affichée uniquement si l'abonnement expire bientôt (≤ 7 jours) ou si le
// profil est désactivé faute de renouvellement (cf. process_senepay_expirations
// côté Supabase, qui met is_activated=false sans palier gratuit).
function SubscriptionRenewalBanner({ subscription, isActivated, onRenew, loading }) {
  if (!subscription) return null;
  const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;
  const isExpired = subscription.status === 'expired' || !isActivated;
  const daysLeft = expiresAt ? Math.ceil((expiresAt - new Date()) / 86400000) : null;
  const isExpiringSoon = !isExpired && daysLeft !== null && daysLeft <= 7;
  if (!isExpired && !isExpiringSoon) return null;

  const color = isExpired ? '#dc2626' : '#b45309';
  const bg = isExpired ? '#fef2f2' : '#fffbeb';
  const border = isExpired ? '#fecaca' : '#fde68a';
  return (
    <div style={{ background:bg, border:'1px solid '+border, borderRadius:'14px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', flexWrap:'wrap' }}>
      <span style={{ fontSize:'18px', flexShrink:0 }}>{isExpired ? '🔒' : '⏰'}</span>
      <p style={{ flex:1, minWidth:'200px', margin:0, color:'#3a3f52', fontSize:'13px', lineHeight:1.4 }}>
        {isExpired
          ? 'Votre abonnement a expiré et votre profil public est désactivé.'
          : `Votre abonnement expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''} (${expiresAt.toLocaleDateString('fr-FR')}).`}
      </p>
      <button onClick={onRenew} disabled={loading} type="button"
        style={{ padding:'8px 16px', borderRadius:'10px', border:'none', background:color, color:'#ffffff', fontWeight:700, fontSize:'12px', cursor:loading?'default':'pointer', whiteSpace:'nowrap', opacity:loading?0.7:1, flexShrink:0 }}>
        {loading ? 'Chargement…' : 'Renouveler maintenant'}
      </button>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, color }) {
  return (
    <div style={{ background:'#ffffff', border:'1px solid #e6e8f0', borderRadius:'16px', padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px', boxShadow:'0 1px 2px rgba(15,23,42,.04)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ color:'#6b7280', fontSize:'11px', fontWeight:500 }}>{label}</span>
        <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:color+'16', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={13} color={color} /></div>
      </div>
      <span style={{ color:'#161a2e', fontSize:'22px', fontWeight:800, lineHeight:1 }}>{value}</span>
    </div>
  );
}

function PlatformsPanel({ localProfile, updateLocal, limits, showAddDialog, setShowAddDialog, onUpgrade }) {
  const links = localProfile?.links || [];
  const atLimit = links.length >= limits.maxLinks;
  const handleUpdateLink = useCallback((index, updated) => { const l = [...(localProfile?.links || [])]; l[index] = updated; updateLocal({ links: l }); }, [localProfile, updateLocal]);
  const handleRemoveLink = useCallback((index) => { const l = (localProfile?.links || []).filter((_,i) => i !== index); updateLocal({ links: l }); }, [localProfile, updateLocal]);
  const handleAddPlatform = (key) => { if (atLimit) { toast.error(`Limite atteinte — offre ${limits.label} : ${limits.maxLinks} liens max`); return; } updateLocal({ links: [...links, { id: crypto.randomUUID(), platform: key, url: '', label: '', enabled: true }] }); setShowAddDialog(false); };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h2 style={{ color:'#161a2e', fontSize:'18px', fontWeight:800, margin:0 }}>Mes plateformes</h2><p style={{ color:'#8a90a2', fontSize:'12px', margin:'4px 0 0' }}>{links.length} / {limits.maxLinks} liens utilisés</p></div>
        <button onClick={()=>setShowAddDialog(true)} disabled={atLimit} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:atLimit?'#eef0f5':'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:'10px', color:atLimit?'#a2a7b5':'white', fontSize:'12px', fontWeight:600, cursor:atLimit?'not-allowed':'pointer' }}><Plus size={13} /> Ajouter</button>
      </div>
      <div style={{ background:atLimit?'#fef2f2':'#f6f7fb', border:'1px solid '+(atLimit?'#fecaca':'#e6e8f0'), borderRadius:'10px', padding:'8px 12px', display:'flex', alignItems:'center', gap:'8px' }}>
        {atLimit ? <AlertCircle size={13} color="#dc2626" /> : <Crown size={13} color="#9095a5" />}
        <span style={{ fontSize:'12px', color:atLimit?'#dc2626':'#6b7280' }}>{atLimit?`Limite atteinte — ${limits.maxLinks} liens max pour l'offre ${limits.label}`:`${links.length} / ${limits.maxLinks} liens utilisés`}</span>
        {atLimit && <button type="button" onClick={onUpgrade} style={{ marginLeft:'auto', fontSize:'11px', color:'#d9591f', fontWeight:600, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', padding:0, whiteSpace:'nowrap' }}>Upgrader →</button>}
      </div>
      {links.length === 0 ? (
        <div style={{ background:'#f9fafc', border:'2px dashed #dde0ea', borderRadius:'18px', padding:'48px 24px', textAlign:'center' }}>
          <Link2 size={28} color="#c3c8d6" style={{ margin:'0 auto 10px' }} />
          <p style={{ color:'#6b7280', fontSize:'14px', margin:'0 0 4px' }}>Aucune plateforme configurée</p>
          <p style={{ color:'#a2a7b5', fontSize:'12px', margin:0 }}>Cliquez sur Ajouter pour commencer</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'10px' }}>
          {links.map((link,i) => <PlatformCard key={link.id||i} link={link} index={i} onUpdate={u=>handleUpdateLink(i,u)} onRemove={()=>handleRemoveLink(i)} />)}
        </div>
      )}
      <AddPlatformDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSelect={handleAddPlatform} existingPlatforms={links.map(l=>l.platform)} />
    </div>
  );
}

function PaymentRequiredGate({ plan, onPay, loading, onChangePlan, onSignOut, userEmail }) {
  const info = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f5fa', padding:'24px' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', maxWidth:'380px', width:'100%', background:'#ffffff', border:'1px solid #e6e8f0', borderRadius:'24px', padding:'36px 28px', boxShadow:'0 20px 50px rgba(15,23,42,.08)' }}>
        <div style={{ fontSize:'44px', marginBottom:'16px' }}>{info.emoji}</div>
        <h1 style={{ color:'#161a2e', fontSize:'22px', fontWeight:800, margin:'0 0 8px' }}>Finalisez votre inscription</h1>
        <p style={{ color:'#6b7280', fontSize:'14px', margin:'0 0 24px', lineHeight:1.6 }}>
          Un dernier pas avant d'accéder à votre espace : réglez votre abonnement <strong style={{ color:info.color }}>{info.label}</strong> pour activer votre profil.
        </p>
        <div style={{ background:'#f6f7fb', border:'1px solid #e6e8f0', borderRadius:'16px', padding:'20px', marginBottom:'20px' }}>
          <p style={{ color:'#161a2e', fontSize:'30px', fontWeight:900, margin:'0 0 4px' }}>{info.price}</p>
          <p style={{ color:'#8a90a2', fontSize:'12px', margin:0 }}>Mobile Money · Wave · Orange Money</p>
        </div>
        <button onClick={onPay} disabled={loading} type="button" style={{ width:'100%', padding:'14px', borderRadius:'14px', border:'none', background:loading?'#e6e8f0':`linear-gradient(135deg,${info.color},${info.color}cc)`, color:'white', fontWeight:800, fontSize:'15px', cursor:loading?'default':'pointer', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:'inherit' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : `Payer ${info.price} →`}
        </button>
        <button onClick={onChangePlan} type="button" style={{ width:'100%', padding:'11px', background:'transparent', border:'1px solid #dde0ea', borderRadius:'12px', color:'#6b7280', fontSize:'13px', cursor:'pointer', marginBottom:'20px', fontFamily:'inherit' }}>
          Changer d'offre
        </button>
        <p style={{ color:'#a2a7b5', fontSize:'12px' }}>
          Connecté en tant que {userEmail}
          {' · '}
          <button onClick={onSignOut} type="button" style={{ background:'none', border:'none', color:'#6b7280', fontSize:'12px', cursor:'pointer', textDecoration:'underline', padding:0, fontFamily:'inherit' }}>Se déconnecter</button>
        </p>
      </motion.div>
    </div>
  );
}

// ─── Main UserDashboard ───────────────────────────────────────────────────────
export default function UserDashboard() {
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const isMobile  = windowWidth < MOBILE_BREAKPOINT;
  const isTablet  = windowWidth >= MOBILE_BREAKPOINT && windowWidth < TABLET_BREAKPOINT;
  const isDesktop = windowWidth >= TABLET_BREAKPOINT;
  const { t } = useTranslation();

  const [activeSection, setActiveSection]   = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showAddDialog, setShowAddDialog]   = useState(false);
  const [showPreview, setShowPreview]       = useState(false);
  const [showWaveModal, setShowWaveModal]   = useState(false);
  const [showPlanModal, setShowPlanModal]   = useState(false);
  // Modale d'upgrade ciblée par feature — null quand fermée, sinon
  // { featureName, requiredPlan } pour afficher le bon libellé/montant.
  const [featureUpgrade, setFeatureUpgrade] = useState(null);
  const [uploadingBg, setUploadingBg]       = useState(false);
  const [localProfile, setLocalProfile]     = useState(null);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [hasChanges, setHasChanges]         = useState(false);
  // Paiement SenePay en cours (bloque le double-clic sur "Choisir un plan" /
  // "Renouveler maintenant" pendant la création de la session de paiement).
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const rawPlan     = (localProfile?.plan || user?.user_metadata?.plan || 'basic').toLowerCase().trim();
  const isActivated = localProfile?.is_activated === true;
  // FIX — user_metadata.role vient du JWT émis à la connexion : s'il est
  // modifié après coup (ex. attribution du rôle admin), le client garde
  // l'ancienne valeur en cache tant que le token n'est pas rafraîchi. La
  // vraie source de vérité, protégée par RLS + trigger anti-duplication
  // (cf. audit sécurité), est la table public.user_roles. On la requête
  // directement plutôt que de faire confiance à user_metadata.
  const { data: userRole } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data?.role || null;
    },
    enabled: !!user?.id,
  });
  const isAdmin = userRole === 'admin';

  // FIX — jusqu'ici, isAdmin ne débloquait que la navigation (isNavLocked /
  // isCurrentSectionLocked) mais `limits` restait calculé sur le vrai
  // `rawPlan` du profil. Résultat : un admin dont le profil est resté en
  // "basic" pouvait naviguer partout mais restait plafonné à 3 liens,
  // 4 produits marketplace, 1 document, etc. `effectivePlan` force le
  // palier "business" pour l'admin, indépendamment de la valeur stockée
  // en base — plus besoin de retoucher le profil à chaque fois.
  const effectivePlan = isAdmin ? 'business' : rawPlan;
  const limits         = PLAN_LIMITS[effectivePlan] || PLAN_LIMITS.basic;

  // Point d'entrée unique pour toute demande d'upgrade dans le dashboard.
  // - Appelé SANS argument (limite de quota : liens, formulaires, docs…)
  //   → ouvre le comparatif complet des 3 offres (PlanModal).
  // - Appelé AVEC (featureName, requiredPlan) (fonctionnalité verrouillée
  //   par palier de plan : Analytics, Événement, CRM…) → ouvre une modale
  //   ciblée sur cette feature précise (FeatureUpgradeModal), plus direct
  //   que de renvoyer l'utilisateur vers le comparatif des 3 offres.
  const handleOpenUpgrade = (featureName, requiredPlan) => {
    if (featureName) setFeatureUpgrade({ featureName, requiredPlan: requiredPlan || 'pro' });
    else setShowPlanModal(true);
  };

  // Abonnement SenePay courant (table `subscriptions`, une ligne par user_id).
  // Alimente la bannière de rappel de renouvellement.
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Point d'entrée unique pour créer une session de paiement SenePay
  // (souscription initiale via PlanModal, ou renouvellement via la
  // bannière). Redirige vers le lien de paiement Wave/Orange Money/Free
  // Money renvoyé par la fonction Edge `senepay-checkout`.
  const startSenepayCheckout = async (planSlug, mode = 'new') => {
    if (!localProfile?.id || checkoutLoading) return;
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('senepay-checkout', {
        body: { profile_id: localProfile.id, plan: planSlug, mode },
      });
      if (error) throw error;
      if (!data?.checkoutUrl) throw new Error('Lien de paiement indisponible');
      window.location.href = data.checkoutUrl;
    } catch (err) {
      toast.error('Paiement indisponible pour le moment : ' + (err.message || 'réessaie plus tard'));
      setCheckoutLoading(false);
    }
  };

  const handlePlanSelect = (planSlug) => { setShowPlanModal(false); startSenepayCheckout(planSlug, 'new'); };

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['userProfiles', user?.id],
    queryFn:  () => db.get(user.id),
    enabled:  !!user?.id,
  });

  // Sur mobile la sidebar est masquée (MobileNav prend le relais).
  // Sur tablette on démarre repliée (icônes seules) pour laisser de la
  // place au contenu en portrait ; sur desktop elle démarre dépliée.
  useEffect(() => { setSidebarCollapsed(isMobile || isTablet); }, [isMobile, isTablet]);

  useEffect(() => {
    if (!profiles.length) return;
    const target = profiles.find(p => p.id === activeProfileId) || profiles[0];
    setLocalProfile(prev => (!prev || prev.id !== target.id) ? target : prev);
    setActiveProfileId(prev => prev || target.id);
  }, [profiles, activeProfileId]);

  // Sync temps-réel plan / is_activated depuis l'admin
  useEffect(() => {
    if (!localProfile?.id) return;
    const profileId = localProfile.id;
    const channel = supabase
      .channel('plan-sync-' + profileId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'link_profiles', filter: 'id=eq.' + profileId }, (payload) => {
        const newPlan = payload.new?.plan;
        const newActivated = payload.new?.is_activated;
        setLocalProfile(prev => {
          if (!prev || prev.id !== profileId) return prev;
          const planChanged = newPlan && newPlan !== prev.plan;
          const activationChanged = typeof newActivated === 'boolean' && newActivated !== prev.is_activated;
          if (!planChanged && !activationChanged) return prev;
          if (planChanged) toast.success('🎉 Votre offre a été mise à jour : ' + newPlan.toUpperCase());
          if (activationChanged && newActivated) toast.success('✅ Votre compte a été activé !');
          return { ...prev, ...(newPlan ? { plan: newPlan } : {}), ...(typeof newActivated === 'boolean' ? { is_activated: newActivated } : {}) };
        });
        queryClient.invalidateQueries({ queryKey: ['userProfiles', user?.id] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [localProfile?.id, user?.id, queryClient]);

  // FIX — fond du dashboard fixe : le thème ne s'applique PAS ici,
  // uniquement sur le profil public (PublicProfile.jsx).
  // L'ancien useEffect qui modifiait document.documentElement est supprimé.

  const createMutation = useMutation({
    mutationFn: data => db.create(data),
    onSuccess: created => {
      queryClient.invalidateQueries({ queryKey: ['userProfiles', user?.id] });
      setLocalProfile(created); setActiveProfileId(created.id); setHasChanges(false);
      toast.success('Profil créé !');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.update(id, data),
    onSuccess: updated => {
      setLocalProfile(updated); setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['userProfiles', user?.id] });
      toast.success('Modifications sauvegardées !');
    },
    onError: e => toast.error('Erreur : ' + e.message),
  });

  const handleCreateProfile = () => {
    if (profiles.length >= limits.maxProfiles) { toast.error(`Limite atteinte — offre ${limits.label} : ${limits.maxProfiles} profil(s) max`); return; }
    const expiry = new Date(); expiry.setFullYear(expiry.getFullYear() + 1);
    createMutation.mutate({ user_id: user.id, display_name: 'Mon Profil ' + (profiles.length + 1), bio: '', links: [], theme_color: '#6366f1', expiry_date: expiry.toISOString().split('T')[0], is_verified: false, is_event: false, is_activated: false, plan: rawPlan });
  };

  const updateLocal = useCallback((updates) => {
    setLocalProfile(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    if (!localProfile || updateMutation.isPending || !hasChanges) return;
    const sanitized = localProfile.username
      ? localProfile.username.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
      : null;

    // [FIX Q-ACTIVATION] Le username n'est persisté en base que si le compte
    // est activé (verrou anti-squattage de username avant paiement,
    // intentionnel — cf. handleCreateProfile : is_activated démarre à false,
    // activation manuelle depuis l'admin dashboard une fois le paiement
    // confirmé). Avant ce fix, toute tentative de changer/définir le
    // username avant activation était silencieusement ignorée à la
    // sauvegarde : le QR affiché (basé sur le state local, voir
    // QRCodeDisplay) encodait un lien qui n'existait pas en base, d'où
    // "Profil introuvable" au scan sans que l'utilisateur comprenne
    // pourquoi. On compare à la valeur RÉELLEMENT en base (la query
    // `profiles`, pas le state local mutable) pour n'avertir que si un
    // changement de username va effectivement être ignoré.
    const serverProfile = profiles.find(p => p.id === localProfile.id);
    const usernameWillBeIgnored = !isActivated && sanitized && sanitized !== (serverProfile?.username || null);
    if (usernameWillBeIgnored) {
      toast.warning("Nom d'utilisateur non enregistré : le compte doit d'abord être activé. Le QR code restera inactif jusqu'à l'activation.");
    }

    const rawMedias = localProfile.event_images || (localProfile.event_image_url ? [localProfile.event_image_url] : []);
    const eventImagesArray = rawMedias.map(m => typeof m === 'string' ? m : m?.url).filter(Boolean);
    updateMutation.mutate({ id: localProfile.id, data: {
      display_name: localProfile.display_name, bio: localProfile.bio, links: localProfile.links,
      theme_color: localProfile.theme_color, expiry_date: localProfile.expiry_date,
      ...(isActivated && sanitized ? { username: sanitized } : {}),
      is_verified: localProfile.is_verified||false, is_event: localProfile.is_event||false,
      event_name: localProfile.event_name||null, event_date: localProfile.event_date||null,
      event_location: localProfile.event_location||null, event_color1: localProfile.event_color1||null,
      event_color2: localProfile.event_color2||null, event_booking_url: localProfile.event_booking_url||null,
      event_description: localProfile.event_description||null, event_images: eventImagesArray,
      event_image_url: eventImagesArray[0]||null, bg_image_url: localProfile.bg_image_url||null,
    }});
  };

  // FIX — UserSidebar transmet l'event brut de l'input (onBgUpload={onBgUpload}
  // sur un <input onChange>), alors que MobileNav extrait lui-même le File et
  // appelle onBgUpload(file) (cf. son commentaire [C4]). Les deux composants
  // utilisaient donc la même prop `onBgUpload` avec des signatures différentes,
  // ce qui cassait silencieusement l'upload de fond sur mobile. On isole la
  // logique dans `uploadBgFile(file)` et on adapte l'un des deux appelants.
  const uploadBgFile = async (file) => {
    if (!file) return;
    if (file.size / 1024 > MAX_SIZE_KB) { toast.error('Image trop lourde ! Max 2 Mo'); return; }
    setUploadingBg(true);
    try {
      const name = 'bg-' + localProfile.id + '-' + Date.now() + '.' + file.name.split('.').pop();
      const { error } = await supabase.storage.from('avatars').upload(name, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(name);
      updateLocal({ bg_image_url: data.publicUrl });
      toast.success('Image de fond appliquée !');
    } catch (err) { toast.error('Erreur : ' + err.message); }
    finally { setUploadingBg(false); }
  };

  // Adaptateur pour UserSidebar, qui branche onBgUpload directement sur
  // l'onChange d'un <input type="file"> et transmet donc l'event, pas le File.
  const handleBgUpload = (e) => {
    const file = e.target.files?.[0];
    uploadBgFile(file);
    e.target.value = '';
  };

  // FIX logout — déplacé en bas du panel Paramètres (renderSection case 'settings')
  const handleSignOut = async () => {
    if (hasChanges && !window.confirm('Des modifications non sauvegardées seront perdues. Se déconnecter ?')) return;
    await signOut();
  };

  if (isLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f5fa' }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color:'#6366f1' }} />
    </div>
  );

  if (!profiles.length && !createMutation.isPending) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f5fa', padding:'24px' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', maxWidth:'360px', background:'#ffffff', border:'1px solid #e6e8f0', borderRadius:'24px', padding:'40px 32px', boxShadow:'0 20px 50px rgba(15,23,42,.08)' }}>
        <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width:'80px', height:'80px', borderRadius:'24px', objectFit:'cover', margin:'0 auto 24px', display:'block' }} />
        <h1 style={{ color:'#161a2e', fontSize:'24px', fontWeight:800, margin:'0 0 8px' }}>Bienvenue !</h1>
        <p style={{ color:'#6b7280', fontSize:'14px', margin:'0 0 24px' }}>{limits.maxLinks} liens · {limits.maxMarketplace === Infinity ? '∞' : limits.maxMarketplace} produits</p>
        <Button onClick={handleCreateProfile} size="lg" className="rounded-xl gap-2" disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer mon profil
        </Button>
      </motion.div>
    </div>
  );

  if (!localProfile) return null;

  const currentNav       = USER_NAV.find(n => n.id === activeSection);
  const currentPlanOrder = PLAN_ORDER[effectivePlan] ?? 0;

  const isCurrentSectionLocked = () => {
    if (isAdmin) return false; // FIX — l'admin ne doit jamais être bloqué par le plan
    const nav = USER_NAV.find(n => n.id === activeSection);
    if (!nav || !nav.locked) return false;
    return currentPlanOrder < (PLAN_ORDER[nav.locked] ?? 99);
  };

  // Compte jamais payé (pas de ligne dans `subscriptions`) : accès au
  // dashboard entièrement bloqué tant que le paiement n'est pas fait — on
  // ne se fie plus à `rawPlan` seul (qui accordait déjà les quotas de
  // l'offre choisie à l'inscription, avant tout paiement). Les comptes
  // dont l'abonnement est simplement EXPIRÉ (une ligne `subscription`
  // existe déjà) gardent le comportement actuel : bandeau de rappel,
  // dashboard toujours accessible.
// subscriptionLoading évite un flash de l'écran de paiement pour un
  // utilisateur déjà activé, le temps que la requête `subscription`
  // réponde (undefined pendant le chargement ≠ "pas d'abonnement").
  if (!isAdmin && !isActivated && !subscriptionLoading && !subscription) {
    return (
      <>
        <PaymentRequiredGate
          plan={rawPlan}
          onPay={() => startSenepayCheckout(rawPlan, 'new')}
          loading={checkoutLoading}
          onChangePlan={() => setShowPlanModal(true)}
          onSignOut={handleSignOut}
          userEmail={user?.email}
        />
        <AnimatePresence>{showPlanModal && <PlanModal onClose={()=>setShowPlanModal(false)} onSelect={handlePlanSelect} />}</AnimatePresence>
      </>
    );
  }
  const renderSection = () => {
    if (isCurrentSectionLocked()) {
      const nav = USER_NAV.find(n => n.id === activeSection);
      // Feature verrouillée par palier de plan → modale d'upgrade ciblée
      // sur CETTE feature précise (nav.label / nav.locked), plutôt que le
      // comparatif générique des 3 offres.
      return <LockedFeaturePanel requiredPlan={nav.locked} featureName={nav.label} icon={nav.icon} onUpgrade={()=>handleOpenUpgrade(nav.label, nav.locked)} />;
    }
    switch (activeSection) {
      // FIX — OverviewPanel reçoit désormais onUpgrade=handleOpenUpgrade :
      // le bouton "Upgrader → PRO" de la carte Statistiques (repli quand
      // limits.hasStats est false) ouvre la même modale de paiement Wave
      // (FeatureUpgradeModal) que les autres fonctionnalités verrouillées,
      // au lieu de rediriger vers "/". On lui passe explicitement le nom
      // de la feature ("Statistiques") et le palier requis ("pro").
      case 'overview':        return <OverviewPanel profile={localProfile} limits={limits} isActivated={isActivated} onNavigate={setActiveSection} onUpdate={updateLocal} onSave={handleSave} hasChanges={hasChanges} saving={updateMutation.isPending} plan={effectivePlan} onUpgrade={handleOpenUpgrade} />;
      case 'platforms':       return <PlatformsPanel localProfile={localProfile} updateLocal={updateLocal} limits={limits} showAddDialog={showAddDialog} setShowAddDialog={setShowAddDialog} onUpgrade={()=>handleOpenUpgrade()} />;
      case 'event':           return <EventPanel localProfile={localProfile} updateLocal={updateLocal} isActivated={isActivated} />;
      // FIX [DESKTOP-WIDTH] — l'ancien wrapper imposait `maxWidth:'640px'` en dur,
      // quelle que soit la largeur d'écran : c'est ce qui empêchait Marketplace
      // de profiter de l'espace disponible sur desktop, même après avoir élargi
      // .mp-container à l'intérieur de MarketplacePanel.jsx (un enfant ne peut
      // jamais dépasser la largeur que son parent lui laisse). Le plafond à
      // 640px reste utile en dessous de 1024px (tablette/mobile, lisibilité) ;
      // au-delà (desktop), on laisse MarketplacePanel gérer sa propre largeur
      // via son breakpoint interne (1400px+).
      case 'marketplace':     return ( <div style={isDesktop ? undefined : { maxWidth:'640px' }}>
          <MarketplacePanel profileId={localProfile.id} maxProducts={limits.maxMarketplace === Infinity ? 9999 : limits.maxMarketplace} />
        </div>
      );
      case 'documents':       return <div style={{ maxWidth:'640px' }}><DocumentsPanel profileId={localProfile.id} userPlan={effectivePlan} /></div>;
      case 'forms':           return <div style={{ maxWidth:'900px' }}><FormsPanel profileId={localProfile.id} maxForms={limits.maxForms} onUpgrade={()=>handleOpenUpgrade()} /></div>;
      case 'analytics':       return limits.hasStats    ? <AnalyticsPanel profileId={localProfile.id} /> : null;
      case 'realtime':        return limits.hasRealtime ? <RealtimePanel  profileId={localProfile.id} /> : null;
      case 'crm':             return limits.hasCRM      ? <LeadsCRMPanel  profileId={localProfile.id} /> : null;
      case 'whatsapp-crm':    return limits.hasCRM      ? <WhatsappCRMPanel profileId={localProfile.id} /> : null;
      case 'booking':         return <BookingCalendarPanel profileId={localProfile.id} />; 
      case 'automations':     return <AutomationsPanel     profileId={localProfile.id} />;
      case 'meta':            return <MetaIntegrationPanel profile={localProfile} isAdmin={isAdmin} />;
      case 'integrations':    return <IntegrationsPanel    profileId={localProfile.id} isAdmin={isAdmin} />;
      case 'boost':           return <BoostPanel           profile={localProfile}      isAdmin={isAdmin} />;
      case 'boost-analytics': return <BoostAnalyticsPanel  profile={localProfile} />;
      case 'promotions':      return <PromotionsDashboard  profile={localProfile} isAdmin={isAdmin} onUpdateProfile={updateLocal} />;

      // FIX — le bloc déconnexion (email + bouton) a été déplacé en bas de
      // la sidebar (UserSidebar.jsx / MobileNav) pour rester accessible
      // partout, pas seulement depuis Paramètres.
      case 'settings': return <SettingsPanel />;

      default: return null;
    }
  };
// Fond de la zone de contenu — gris-bleu très clair et neutre plutôt que
  // le noir/violet précédent. Lisible longtemps, laisse les cartes blanches
  // et les couleurs d'accent (indigo, orange, or) se détacher proprement.
  const DASHBOARD_BG = { background: '#f4f5fa' };

  // La sidebar (UserSidebar.jsx, fichier séparé) reste dans son bleu nuit
  // pour ancrer l'identité de marque ; la topbar, elle, rejoint désormais
  // le blanc de la zone de contenu pour un rendu "SaaS pro" cohérent —
  // plus de rupture violet/rose entre topbar et sidebar.
  const TOPBAR_BG = '#ffffff';

  return (
    <div style={{ ...DASHBOARD_BG, height:'100dvh', minHeight:'100dvh', overflow:'hidden', display:'flex', position:'relative', overflowX:'hidden' }}>

      {/* CONFIRMÉ par MobileNav.jsx : celui-ci gère son propre tiroir
          (état interne drawerOpen, onglet "Menu") totalement indépendant
          du collapsed/onToggle de UserSidebar. Le mode "tiroir mobile" de
          UserSidebar n'est donc jamais déclenché en pratique — on ne la
          monte que sur tablette/desktop pour éviter du code et des
          abonnements (upload de fond, etc.) inutiles sur mobile. */}
      {!isMobile && (
        <div style={{ position:'relative', zIndex:10, flexShrink:0 }}>
          <UserSidebar
            activeSection={activeSection} onNavigate={setActiveSection}
            profile={localProfile} plan={effectivePlan} limits={limits}
            collapsed={sidebarCollapsed} onToggle={()=>setSidebarCollapsed(v=>!v)}
            isMobile={false}
            isTablet={isTablet}
            isAdmin={isAdmin}
            onBgUpload={handleBgUpload} onBgRemove={()=>updateLocal({ bg_image_url:null })}
            bgImageUrl={localProfile?.bg_image_url} uploadingBg={uploadingBg}
            onUpgrade={()=>handleOpenUpgrade()}
            userEmail={user?.email} onSignOut={handleSignOut}
          />
        </div>
      )}

      <div style={{ flex:1, height:'100dvh', minHeight:'100dvh', overflowX:'hidden', overflowY:'auto', WebkitOverflowScrolling:'touch', display:'flex', flexDirection:'column', minWidth:0, position:'relative', zIndex:1 }}>

        {/* Topbar — blanc, alignée sur la zone de contenu claire.
            Le paddingTop additionnel via env(safe-area-inset-top) évite que
            le contenu passe sous l'encoche/la barre de statut sur iOS
            (nécessite <meta name="viewport" content="viewport-fit=cover">
            dans index.html pour être pris en compte). */}
        <div style={{ flexShrink:0, position:'sticky', top:0, zIndex:15, background:TOPBAR_BG, borderBottom:'1px solid #e6e8f0', boxShadow:'0 1px 2px rgba(15,23,42,.04)', padding:isMobile?'calc(10px + env(safe-area-inset-top)) 14px 10px':'10px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:0 }}>
            {isMobile && <img src="/Logo_SocialApp.png" alt="" style={{ width:'26px', height:'26px', borderRadius:'7px', objectFit:'cover', flexShrink:0 }} />}
            <h2 style={{ color:'#161a2e', fontSize:'14px', fontWeight:700, margin:0, whiteSpace:'nowrap' }}>{currentNav?.label || 'Dashboard'}</h2>
            <AnimatePresence>
              {hasChanges && (
                <motion.span initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.85 }} transition={{ duration:0.15 }}
                  style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'6px', padding:'2px 8px', fontSize:'10px', color:'#b45309', fontWeight:600, flexShrink:0 }}>
                  ● {t('unsaved')}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
            <ThemeColorPicker profile={localProfile} onUpdate={updateLocal} />
            <NotificationBell />
            <button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', background:hasChanges?'linear-gradient(135deg,#6366f1,#8b5cf6)':'#eef0f5', border:'1px solid '+(hasChanges?'transparent':'#dde0ea'), borderRadius:'9px', color:hasChanges?'white':'#a2a7b5', fontSize:'11px', fontWeight:600, cursor:hasChanges?'pointer':'default', opacity:updateMutation.isPending?0.7:1 }}
            >
              {updateMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {!isMobile && t('save')}
            </button>
          </div>
        </div>

        {/* paddingBottom additionnel = hauteur de la MobileNav + zone
            d'accueil du geste iOS (home indicator) / navigation Android. */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:isMobile?'16px':(isTablet?'20px':'24px'), paddingBottom:isMobile?'calc(100px + env(safe-area-inset-bottom))':'24px' }}>
          <PanelErrorBoundary>
            <div style={{ animation:'fadeIn 0.18s ease' }}>
              {/* Bannière d'installation PWA — affichée en haut du contenu,
                  sur toutes les sections, dès la connexion au dashboard. Le
                  composant gère lui-même sa visibilité (déjà installé,
                  fermé récemment, plateforme iOS vs Android/desktop). */}
              <InstallPrompt />
              <SubscriptionRenewalBanner
                subscription={subscription}
                isActivated={isActivated}
                loading={checkoutLoading}
                onRenew={() => startSenepayCheckout(effectivePlan, 'renewal')}
              />
              {renderSection()}
            </div>
          </PanelErrorBoundary>
        </div>

      </div>{/* ← ferme le div flex colonne */}

      {isMobile && (
        <MobileNav
          activeSection={activeSection} onNavigate={setActiveSection}
          profile={localProfile} plan={effectivePlan} limits={limits}
          isAdmin={isAdmin}
          onBgUpload={uploadBgFile} onBgRemove={()=>updateLocal({ bg_image_url:null })}
          bgImageUrl={localProfile?.bg_image_url} uploadingBg={uploadingBg}
          onUpgrade={()=>handleOpenUpgrade()}
          userEmail={user?.email} onSignOut={handleSignOut}
        />
      )}

      {showPreview && <ProfilePreview profile={localProfile} onClose={()=>setShowPreview(false)} />}

      {/* Modale d'activation de compte (Wave manuel) — DÉSACTIVÉE pour le
          moment : SenePay active désormais le compte automatiquement via
          le webhook (is_activated=true dès paiement confirmé). État et
          import conservés pour réactivation facile si besoin. */}
      {/* <AnimatePresence>{showWaveModal && <WaveModal onClose={()=>setShowWaveModal(false)} plan={effectivePlan} />}</AnimatePresence> */}

      {/* Modale d'upgrade ciblée sur UNE feature verrouillée (Analytics, Événement, CRM…) */}
      <AnimatePresence>
        {featureUpgrade && (
          <FeatureUpgradeModal
            onClose={()=>setFeatureUpgrade(null)}
            featureName={featureUpgrade.featureName}
            requiredPlan={featureUpgrade.requiredPlan}
            onUpgrade={() => startSenepayCheckout(featureUpgrade.requiredPlan, 'new')}
            loading={checkoutLoading}
          />
        )}
      </AnimatePresence>

      {/* Comparatif complet des 3 offres — limites de quota (liens, formulaires…) */}
      <AnimatePresence>{showPlanModal && <PlanModal onClose={()=>setShowPlanModal(false)} onSelect={handlePlanSelect} />}</AnimatePresence>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}
        *{scrollbar-width:thin;scrollbar-color:#c9cddb transparent}
        *::-webkit-scrollbar{width:5px;height:5px}
        *::-webkit-scrollbar-track{background:transparent}
        *::-webkit-scrollbar-thumb{background:#c9cddb;border-radius:10px}

        /* FIX iOS/Android — cibles tactiles ≥44x44px (Apple HIG / Material)
           sur les petits boutons icône (fermer, flèches de carrousel, etc.)
           qui ne mesuraient que 26–32px. On agrandit la zone cliquable via
           un pseudo-élément plutôt que la taille visuelle, pour ne pas
           casser le design sur desktop. */
        @media (pointer: coarse) {
          button { touch-action: manipulation; }
          button[style*="border-radius:50%"] { position: relative; }
          button[style*="border-radius:50%"]::after {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            width: max(44px, 100%);
            height: max(44px, 100%);
            transform: translate(-50%, -50%);
          }
        }

        /* Empêche le zoom involontaire iOS Safari sur les champs de
           formulaire dont la taille de police est < 16px. */
        @media (pointer: coarse) {
          input, select, textarea { font-size: max(16px, 1em); }
        }
      `}</style>

    </div>
  );
}
