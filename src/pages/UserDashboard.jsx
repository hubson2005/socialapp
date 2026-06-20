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
import LeadsCRMPanel from "@/components/dashboard/LeadsCRMPanel";
import AutomationsPanel from "@/components/dashboard/AutomationsPanel";
import IntegrationsPanel from "@/components/dashboard/IntegrationsPanel";
import UserSettingsPanel from "@/components/dashboard/UserSettingsPanel";
import UserSidebar, { USER_NAV, USER_GROUPS, PLAN_ORDER } from "@/components/dashboard/UserSidebar";
import OverviewPanel from "@/components/dashboard/OverviewPanel";
import EventPanel from "@/components/dashboard/EventPanel";
import { useTranslation } from 'react-i18next';
import WhatsappCRMPanel from "@/components/dashboard/WhatsappCRMPanel";
import BoostPanel from "@/components/dashboard/BoostPanel";
import MetaIntegrationPanel from "@/components/dashboard/MetaIntegrationPanel";
import BoostAnalyticsPanel from "@/components/dashboard/BoostAnalyticsPanel";
import PromotionsDashboard from "@/components/dashboard/PromotionsDashboard";
import { BioAIGenerator, CampaignAIGenerator, PlatformAISuggestions } from "@/components/dashboard/AIPanels"
import FormsPanel from "@/components/forms/FormsPanel";

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
          <p style={{ color:'white', fontSize:'16px', fontWeight:700, margin:0 }}>Ce panneau a rencontré une erreur</p>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', margin:0, maxWidth:'420px', lineHeight:1.6 }}>{this.state.error?.message || 'Erreur inconnue'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} style={{ padding:'8px 20px', background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.4)', borderRadius:'10px', color:'#a78bfa', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Réessayer</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return width;
}

const PLAN_LIMITS = {
  basic: { maxLinks:3, maxProfiles:1, hasStats:false, maxMarketplace:4, maxDocs:1, maxForms:1, hasEvent:false, hasRealtime:false, hasCRM:false, hasAutomations:false, hasIntegrations:false, hasAdvancedAnalytics:false, qrType:'standard', colorCustom:'basic', badge:false, label:'BASIC', color:'#6366f1', emoji:'⚡', price:'10 000 FCFA' },
  pro: { maxLinks:8, maxProfiles:1, hasStats:true, maxMarketplace:10, maxDocs:3, maxForms:5, hasEvent:true, hasRealtime:true, hasCRM:false, hasAutomations:false, hasIntegrations:'partial', hasAdvancedAnalytics:false, qrType:'premium', colorCustom:'advanced', badge:true, label:'PRO', color:'#ff8c00', emoji:'🚀', price:'15 000 FCFA' },
  business: { maxLinks:17, maxProfiles:1, hasStats:true, maxMarketplace:Infinity, maxDocs:10, maxForms:Infinity, hasEvent:true, hasRealtime:true, hasCRM:true, hasAutomations:true, hasIntegrations:true, hasAdvancedAnalytics:true, qrType:'dynamic', colorCustom:'complete', badge:true, label:'BUSINESS', color:'#f7c948', emoji:'💼', price:'25 000 FCFA' },
  événement: { maxLinks:3, maxProfiles:1, hasStats:false, maxMarketplace:0, maxDocs:0, hasEvent:true, hasRealtime:false, hasCRM:false, hasAutomations:false, hasIntegrations:false, hasAdvancedAnalytics:false, qrType:'standard', colorCustom:'basic', badge:false, label:'ÉVÉNEMENT', color:'#22c55e', emoji:'🎉', price:'' },
};

const isVideoUrl = (url) => /\.(mp4|webm|ogg|mov|avi|mkv|quicktime)$/i.test(url || '');
const parseColors = (themeColor) => {
  if (themeColor && themeColor.includes('|')) { const [bg1, bg2] = themeColor.split('|'); return { bg1, bg2 }; }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};
const MAX_SIZE_KB = 2000;

const db = {
  get: async (userId) => { const { data, error } = await supabase.from('link_profiles').select('*').eq('user_id', userId).order('created_at', { ascending: true }); if (error) throw error; return data || []; },
  create: async (data) => { const { data: created, error } = await supabase.from('link_profiles').insert([data]).select().maybeSingle(); if (error) throw error; return created; },
  update: async (id, data) => { const { data: updated, error } = await supabase.from('link_profiles').update(data).eq('id', id).select().maybeSingle(); if (error) throw error; return updated; },
};

function PlanModal({ onClose, onSelect }) {
  const plans = [
    { name:'BASIC', emoji:'⚡', price:'10 000', color:'#a78bfa', subtitle:'Particulier, petit commerce, entrepreneur débutant', bg:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.25)', features:['1 profil · 3 liens sociaux','Page publique','QR Code standard','1 import PDF','Marketplace (4 produits)'] },
    { name:'PRO', emoji:'🚀', price:'15 000', color:'#ff6b35', popular:true, subtitle:'Professionnels, influenceurs, restaurants, boutiques', bg:'rgba(255,107,53,.1)', border:'2px solid rgba(255,107,53,.55)', features:['1 profil · 8 liens sociaux','1 Carte NFC ou PVC','Analytics & stats détaillées','Temps réel — visiteurs live','Mode Événement inclus','Marketplace (10 produits)','Support standard'] },
    { name:'BUSINESS', emoji:'💼', price:'25 000', color:'#f7c948', subtitle:'Grandes entreprises, agences com, marques établies', bg:'rgba(247,201,72,.06)', border:'1px solid rgba(247,201,72,.28)', features:['1 profil · 17 liens sociaux','1 Carte NFC ou PVC','CRM & Pipeline de leads','CRM WHATSAPP','Automatisations','Marketplace illimitée','Support VIP prioritaire'] },
  ];
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,.80)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <motion.div initial={{ opacity:0, scale:0.93, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.93 }} transition={{ type:'spring', stiffness:300, damping:25 }} onClick={e=>e.stopPropagation()}
        style={{ background:'#0a0818', border:'1px solid rgba(255,255,255,.12)', borderRadius:'28px', padding:'36px 28px', maxWidth:'900px', width:'100%', boxShadow:'0 40px 120px rgba(0,0,0,.9)', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:'16px', right:'16px', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:'50%', width:'32px', height:'32px', color:'rgba(255,255,255,.6)', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit', lineHeight:1 }}>×</button>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'rgba(255,107,53,.1)', border:'1px solid rgba(255,107,53,.3)', borderRadius:'100px', padding:'5px 14px', fontSize:'11px', color:'#ff6b35', fontWeight:'700', marginBottom:'12px' }}>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#ff6b35' }} />Choisissez votre nouvelle offre
          </div>
          <h2 style={{ fontSize:'22px', fontWeight:'900', color:'#fff', margin:'0 0 6px', letterSpacing:'-0.5px' }}>Passez à la vitesse supérieure</h2>
          <p style={{ color:'rgba(255,255,255,.4)', fontSize:'13px', margin:0 }}>Paiement Mobile Money · Wave · Orange Money · Sans carte bancaire</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }} className="plan-modal-grid">
          {plans.map((p,i) => (
            <div key={i} onClick={()=>onSelect(p.name.toLowerCase())} className="plan-modal-card"
              style={{ background:p.bg, border:p.border, borderRadius:'20px', padding:p.popular?'32px 20px 20px':'20px', position:'relative', cursor:'pointer', transition:'transform .18s, box-shadow .18s', marginTop:p.popular?'14px':'0' }}>
              {p.popular && <div style={{ position:'absolute', top:'-13px', left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#ff6b35,#f7c948)', borderRadius:'100px', padding:'4px 14px', fontSize:'10px', fontWeight:'700', color:'#fff', whiteSpace:'nowrap', boxShadow:'0 4px 12px rgba(255,107,53,.4)' }}>⭐ Plus populaire</div>}
              <div style={{ fontSize:'10px', fontWeight:'700', color:p.color, letterSpacing:'2px', textTransform:'uppercase', marginBottom:'10px' }}>{p.emoji} {p.name}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:'3px', marginBottom:'3px' }}><span style={{ fontSize:'28px', fontWeight:'900', color:'#fff', letterSpacing:'-1px' }}>{p.price}</span><span style={{ fontSize:'12px', color:'rgba(255,255,255,.35)' }}>FCFA</span></div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,.25)', marginBottom:'5px' }}>/ Paiement annuel</div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,.4)', marginBottom:'14px', lineHeight:'1.5', minHeight:'28px' }}>{p.subtitle}</div>
              <hr style={{ border:'none', borderTop:'1px solid rgba(255,255,255,.08)', marginBottom:'12px' }} />
              {p.features.map((f,j) => <div key={j} style={{ display:'flex', gap:'6px', marginBottom:'6px', fontSize:'11px', color:'rgba(255,255,255,.65)', alignItems:'flex-start' }}><span style={{ color:p.color, flexShrink:0, marginTop:'1px' }}>✓</span>{f}</div>)}
              <button type="button" className="plan-modal-btn" style={{ display:'block', width:'100%', marginTop:'14px', padding:'11px', borderRadius:'11px', border:'none', background:p.popular?'linear-gradient(135deg,#ff6b35,#f7c948)':'rgba(255,255,255,.1)', color:'#fff', fontWeight:'700', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>Choisir {p.name} →</button>
            </div>
          ))}
        </div>
        <p style={{ textAlign:'center', color:'rgba(255,255,255,.2)', fontSize:'11px', marginTop:'20px' }}>💬 Besoin d'aide ? WhatsApp <strong style={{ color:'rgba(255,255,255,.45)' }}>+225 05 76 03 12 12</strong></p>
      </motion.div>
      <style>{`@media(max-width:640px){.plan-modal-grid{grid-template-columns:1fr!important}}.plan-modal-card:hover{transform:translateY(-4px);box-shadow:0 14px 40px rgba(0,0,0,.5)}.plan-modal-btn:hover{opacity:.88}`}</style>
    </motion.div>
  );
}

function WaveModal({ onClose }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.93, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.93 }} transition={{ type:'spring', stiffness:300, damping:25 }} onClick={e=>e.stopPropagation()} style={{ background:'#0f0a1e', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'24px', padding:'28px 24px', maxWidth:'360px', width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.7)', textAlign:'center' }}>
        <h3 style={{ color:'white', fontSize:'18px', fontWeight:800, marginBottom:'6px' }}>🔓 Débloquer cette fonctionnalité</h3>
        <div style={{ background:'rgba(0,87,255,0.1)', border:'1px solid rgba(0,87,255,0.3)', borderRadius:'14px', padding:'16px', marginBottom:'14px' }}>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', marginBottom:'8px' }}>Envoyez votre paiement via <strong style={{ color:'#60a5fa' }}>Wave CI</strong> au numéro :</p>
          <p style={{ color:'white', fontSize:'26px', fontWeight:800, margin:'0 0 4px' }}>+225 05 76 03 12 12</p>
        </div>
        <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'13px', background:'#25D366', borderRadius:'12px', color:'white', fontSize:'14px', fontWeight:700, textDecoration:'none', marginBottom:'10px' }}>WhatsApp — Envoyer la preuve</a>
        <button type="button" onClick={onClose} style={{ width:'100%', padding:'11px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', color:'rgba(255,255,255,0.5)', fontSize:'13px', cursor:'pointer' }}>Fermer</button>
      </motion.div>
    </motion.div>
  );
}

function LockedFeaturePanel({ requiredPlan, featureName, icon: Icon, onUpgrade }) {
  const isPro = requiredPlan === 'pro';
  const color = isPro ? '#ff8c00' : '#f7c948';
  const planLabel = isPro ? 'PRO' : 'BUSINESS';
  const price = isPro ? '15 000 FCFA / an' : '25 000 FCFA / an';
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'360px', gap:'20px', textAlign:'center', padding:'40px 32px' }}>
      <div style={{ position:'relative' }}>
        <div style={{ width:'80px', height:'80px', borderRadius:'24px', background:color+'18', border:'1px solid '+color+'44', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>{Icon && <Icon size={32} color={color+'99'} />}</div>
        <div style={{ position:'absolute', top:'-6px', right:'-6px', width:'28px', height:'28px', borderRadius:'50%', background:'rgba(0,0,0,0.9)', border:'2px solid '+color+'66', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>🔒</div>
      </div>
      <div>
        <p style={{ color:'white', fontSize:'20px', fontWeight:800, margin:'0 0 8px' }}>{featureName}</p>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'14px', margin:'0 0 6px', lineHeight:1.5 }}>Cette fonctionnalité est disponible à partir de l'offre</p>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:color+'18', border:'1px solid '+color+'44', borderRadius:'100px', padding:'5px 14px', marginBottom:'6px' }}>
          <span style={{ color, fontSize:'13px', fontWeight:700 }}>{planLabel}</span>
        </div>
        <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'12px', margin:'6px 0 0' }}>{price}</p>
      </div>
      <button type="button" onClick={onUpgrade} style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,'+color+','+color+'aa)', borderRadius:'14px', padding:'12px 28px', color:'white', fontSize:'14px', fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 24px '+color+'33' }}>
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

function MiniStat({ label, value, icon: Icon, color }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'11px', fontWeight:500 }}>{label}</span>
        <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:color+'22', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={13} color={color} /></div>
      </div>
      <span style={{ color:'white', fontSize:'22px', fontWeight:800, lineHeight:1 }}>{value}</span>
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
        <div><h2 style={{ color:'white', fontSize:'18px', fontWeight:800, margin:0 }}>Mes plateformes</h2><p style={{ color:'rgba(255,255,255,0.35)', fontSize:'12px', margin:'4px 0 0' }}>{links.length} / {limits.maxLinks} liens utilisés</p></div>
        <button onClick={()=>setShowAddDialog(true)} disabled={atLimit} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:atLimit?'rgba(255,255,255,0.05)':'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:'10px', color:atLimit?'rgba(255,255,255,0.3)':'white', fontSize:'12px', fontWeight:600, cursor:atLimit?'not-allowed':'pointer' }}><Plus size={13} /> Ajouter</button>
      </div>
      <div style={{ background:atLimit?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.05)', border:'1px solid '+(atLimit?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.1)'), borderRadius:'10px', padding:'8px 12px', display:'flex', alignItems:'center', gap:'8px' }}>
        {atLimit ? <AlertCircle size={13} color="#f87171" /> : <Crown size={13} color="rgba(255,255,255,0.3)" />}
        <span style={{ fontSize:'12px', color:atLimit?'#f87171':'rgba(255,255,255,0.45)' }}>{atLimit?`Limite atteinte — ${limits.maxLinks} liens max pour l'offre ${limits.label}`:`${links.length} / ${limits.maxLinks} liens utilisés`}</span>
        {atLimit && <button type="button" onClick={onUpgrade} style={{ marginLeft:'auto', fontSize:'11px', color:'#ff8c00', fontWeight:600, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', padding:0, whiteSpace:'nowrap' }}>Upgrader →</button>}
      </div>
      {links.length === 0 ? (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'2px dashed rgba(255,255,255,0.12)', borderRadius:'18px', padding:'48px 24px', textAlign:'center' }}>
          <Link2 size={28} color="rgba(255,255,255,0.15)" style={{ margin:'0 auto 10px' }} />
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'14px', margin:'0 0 4px' }}>Aucune plateforme configurée</p>
          <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'12px', margin:0 }}>Cliquez sur Ajouter pour commencer</p>
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

// ─── Main UserDashboard ───────────────────────────────────────────────────────
export default function UserDashboard() {
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;
  const { t } = useTranslation();

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showWaveModal, setShowWaveModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [localProfile, setLocalProfile] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // ✅ Source de vérité : la colonne `plan` de link_profiles. C'est elle que
  // modifie le Dashboard admin (activation manuelle) et, plus tard, tout
  // système de paiement automatisé. user_metadata.plan ne sert que de repli
  // tant que le profil n'existe pas encore (ex: juste après l'inscription,
  // avant la création du premier profil dans link_profiles).
  const rawPlan     = (localProfile?.plan || user?.user_metadata?.plan || 'basic').toLowerCase().trim();
  const limits      = PLAN_LIMITS[rawPlan] || PLAN_LIMITS.basic;
  const isActivated = localProfile?.is_activated === true;
  // FIX: isAdmin défini ici pour tous les panels qui en ont besoin
  const isAdmin     = user?.user_metadata?.role === 'admin' || false;

  const handleOpenUpgrade = () => setShowPlanModal(true);
  const handlePlanSelect  = (planSlug) => { setShowPlanModal(false); navigate(`/login?plan=${encodeURIComponent(planSlug)}`); };

  const { data: profiles = [], isLoading } = useQuery({ queryKey: ['userProfiles', user?.id], queryFn: () => db.get(user.id), enabled: !!user?.id });

  useEffect(() => { setSidebarCollapsed(isMobile); }, [isMobile]);

  useEffect(() => {
    if (!profiles.length) return;
    const target = profiles.find(p => p.id === activeProfileId) || profiles[0];
    setLocalProfile(prev => (!prev || prev.id !== target.id) ? target : prev);
    setActiveProfileId(prev => prev || target.id);
  }, [profiles, activeProfileId]);

  // ✅ Synchronisation en temps réel : si l'admin change le plan (ou active
  // le compte) depuis le Dashboard admin, ce profil le reflète instantanément
  // ici, sans rechargement de page. On ne touche qu'aux champs plan/is_activated
  // pour ne jamais écraser des modifications locales non sauvegardées (hasChanges).
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

  // FIX background: fond appliqué sur html ET calculé pour le root div
  useEffect(() => {
    if (!localProfile) return;
    const html = document.documentElement;
    if (localProfile.bg_image_url) {
      Object.assign(html.style, { backgroundImage:`url(${localProfile.bg_image_url})`, backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat', backgroundAttachment:'fixed' });
    } else {
      const { bg1, bg2 } = parseColors(localProfile.theme_color);
      html.style.backgroundImage = 'none';
      html.style.background = `linear-gradient(160deg,${bg1},${bg2})`;
    }
    return () => { ['backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat','backgroundAttachment','background'].forEach(k => { html.style[k] = ''; }); };
  }, [localProfile]);

  const createMutation = useMutation({ mutationFn: data => db.create(data), onSuccess: created => { queryClient.invalidateQueries({ queryKey: ['userProfiles', user?.id] }); setLocalProfile(created); setActiveProfileId(created.id); setHasChanges(false); toast.success('Profil créé !'); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => db.update(id, data), onSuccess: updated => { setLocalProfile(updated); setHasChanges(false); queryClient.invalidateQueries({ queryKey: ['userProfiles', user?.id] }); toast.success('Modifications sauvegardées !'); }, onError: e => toast.error('Erreur : ' + e.message) });

  const handleCreateProfile = () => {
    if (profiles.length >= limits.maxProfiles) { toast.error(`Limite atteinte — offre ${limits.label} : ${limits.maxProfiles} profil(s) max`); return; }
    const expiry = new Date(); expiry.setFullYear(expiry.getFullYear() + 1);
    createMutation.mutate({ user_id: user.id, display_name: 'Mon Profil ' + (profiles.length + 1), bio: '', links: [], theme_color: '#6366f1', expiry_date: expiry.toISOString().split('T')[0], is_verified: false, is_event: false, is_activated: false, plan: rawPlan });
  };

  const updateLocal = useCallback((updates) => { setLocalProfile(prev => ({ ...prev, ...updates })); setHasChanges(true); }, []);

  const handleSave = () => {
    if (!localProfile || updateMutation.isPending || !hasChanges) return;
    const sanitized = localProfile.username ? localProfile.username.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') : null;
    const rawMedias = localProfile.event_images || (localProfile.event_image_url ? [localProfile.event_image_url] : []);
    const eventImagesArray = rawMedias.map(m => typeof m === 'string' ? m : m?.url).filter(Boolean);
    updateMutation.mutate({ id: localProfile.id, data: { display_name: localProfile.display_name, bio: localProfile.bio, links: localProfile.links, theme_color: localProfile.theme_color, expiry_date: localProfile.expiry_date, ...(isActivated && sanitized ? { username: sanitized } : {}), is_verified: localProfile.is_verified||false, is_event: localProfile.is_event||false, event_name: localProfile.event_name||null, event_date: localProfile.event_date||null, event_location: localProfile.event_location||null, event_color1: localProfile.event_color1||null, event_color2: localProfile.event_color2||null, event_booking_url: localProfile.event_booking_url||null, event_description: localProfile.event_description||null, event_images: eventImagesArray, event_image_url: eventImagesArray[0]||null, bg_image_url: localProfile.bg_image_url||null } });
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size / 1024 > MAX_SIZE_KB) { toast.error('Image trop lourde ! Max 2 Mo'); return; }
    setUploadingBg(true);
    try {
      const name = 'bg-' + localProfile.id + '-' + Date.now() + '.' + file.name.split('.').pop();
      const { error } = await supabase.storage.from('avatars').upload(name, file, { upsert: true }); if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(name);
      updateLocal({ bg_image_url: data.publicUrl }); toast.success('Image de fond appliquée !');
    } catch (err) { toast.error('Erreur : ' + err.message); }
    finally { setUploadingBg(false); e.target.value = ''; }
  };

  const handleSignOut = async () => { if (hasChanges && !window.confirm('Des modifications non sauvegardées seront perdues. Se déconnecter ?')) return; await signOut(); };

  if (isLoading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#040210' }}><Loader2 className="w-6 h-6 animate-spin" style={{ color:'#6366f1' }} /></div>;

  if (!profiles.length && !createMutation.isPending) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0f0a1e,#2d1b69)', padding:'24px' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', maxWidth:'360px' }}>
        <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width:'80px', height:'80px', borderRadius:'24px', objectFit:'cover', margin:'0 auto 24px', display:'block' }} />
        <h1 style={{ color:'white', fontSize:'24px', fontWeight:800, margin:'0 0 8px' }}>Bienvenue !</h1>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:'0 0 24px' }}>{limits.maxLinks} liens · {limits.maxMarketplace === Infinity ? '∞' : limits.maxMarketplace} produits</p>
        <Button onClick={handleCreateProfile} size="lg" className="rounded-xl gap-2" disabled={createMutation.isPending}>{createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer mon profil</Button>
      </motion.div>
    </div>
  );

  if (!localProfile) return null;

  const currentNav       = USER_NAV.find(n => n.id === activeSection);
  const currentPlanOrder = PLAN_ORDER[rawPlan] ?? 0;

  const isCurrentSectionLocked = () => { const nav = USER_NAV.find(n => n.id === activeSection); if (!nav || !nav.locked) return false; return currentPlanOrder < (PLAN_ORDER[nav.locked] ?? 99); };

  const renderSection = () => {
    if (isCurrentSectionLocked()) { const nav = USER_NAV.find(n => n.id === activeSection); return <LockedFeaturePanel requiredPlan={nav.locked} featureName={nav.label} icon={nav.icon} onUpgrade={handleOpenUpgrade} />; }
    switch (activeSection) {
      case 'overview':        return <OverviewPanel profile={localProfile} limits={limits} isActivated={isActivated} onNavigate={setActiveSection} onUpdate={updateLocal} onSave={handleSave} hasChanges={hasChanges} saving={updateMutation.isPending} plan={rawPlan} />;
      case 'platforms':       return <PlatformsPanel localProfile={localProfile} updateLocal={updateLocal} limits={limits} showAddDialog={showAddDialog} setShowAddDialog={setShowAddDialog} onUpgrade={handleOpenUpgrade} />;
      case 'event':           return <EventPanel localProfile={localProfile} updateLocal={updateLocal} isActivated={isActivated} />;
      case 'marketplace':     return <div style={{ maxWidth:'640px' }}><MarketplacePanel profileId={localProfile.id} maxProducts={limits.maxMarketplace === Infinity ? 9999 : limits.maxMarketplace} /></div>;
      case 'documents':       return <div style={{ maxWidth:'640px' }}><DocumentsPanel profileId={localProfile.id} userPlan={rawPlan} /></div>;
      case 'forms': return <div style={{ maxWidth:'900px' }}><FormsPanel profileId={localProfile.id} maxForms={limits.maxForms} onUpgrade={handleOpenUpgrade} /></div>;
      case 'analytics':       return limits.hasStats    ? <AnalyticsPanel profileId={localProfile.id} /> : null;
      case 'realtime':        return limits.hasRealtime ? <RealtimePanel  profileId={localProfile.id} /> : null;
      case 'crm':             return limits.hasCRM      ? <LeadsCRMPanel  profileId={localProfile.id} /> : null;
      case 'automations':     return <AutomationsPanel     profileId={localProfile.id} />;
      case 'meta':            return <MetaIntegrationPanel profile={localProfile} isAdmin={isAdmin} />;
      case 'integrations':    return <IntegrationsPanel    profileId={localProfile.id} isAdmin={isAdmin} />;
      case 'boost':           return <BoostPanel           profile={localProfile}      isAdmin={isAdmin} />;
      case 'boost-analytics': return <BoostAnalyticsPanel  profile={localProfile} />;
      case 'promotions': return ( <PromotionsDashboard profile={localProfile} isAdmin={isAdmin} onUpdateProfile={updateLocal} /> );
      case 'settings':        return <UserSettingsPanel />; default: return null;
    }
  };

  // FIX background blanc: fond appliqué directement sur le root div (double sécurité)
  const getRootBg = () => {
    if (!localProfile) return { background: 'linear-gradient(160deg,#0f0a1e,#2d1b69)' };
    if (localProfile.bg_image_url) return { backgroundImage:`url(${localProfile.bg_image_url})`, backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat' };
    const { bg1, bg2 } = parseColors(localProfile.theme_color);
    return { background: `linear-gradient(160deg,${bg1},${bg2})` };
  };

  return (
    <div style={{ ...getRootBg(), height:'100dvh', minHeight:'100dvh', overflow:'hidden', display:'flex', position:'relative', overflowX:'hidden' }}>

      <div style={{ position:'relative', zIndex:10, flexShrink:0, width:isMobile?0:undefined }}>
        <UserSidebar activeSection={activeSection} onNavigate={setActiveSection} profile={localProfile} plan={rawPlan} limits={limits} collapsed={sidebarCollapsed} onToggle={()=>setSidebarCollapsed(v=>!v)} isMobile={isMobile} onBgUpload={handleBgUpload} onBgRemove={()=>updateLocal({ bg_image_url:null })} bgImageUrl={localProfile?.bg_image_url} uploadingBg={uploadingBg} onUpgrade={handleOpenUpgrade} />
      </div>

      <div style={{ flex:1, height:'100dvh', minHeight:'100dvh', overflowX:'hidden', overflowY:'auto', WebkitOverflowScrolling:'touch', display:'flex', flexDirection:'column', minWidth:0, position:'relative', zIndex:1 }}>

        <div style={{ flexShrink:0, position:'sticky', top:0, zIndex:15, background:'rgba(4,2,16,0.7)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:isMobile?'10px 14px':'10px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:0 }}>
            {isMobile && <img src="/Logo_SocialApp.png" alt="" style={{ width:'26px', height:'26px', borderRadius:'7px', objectFit:'cover', flexShrink:0 }} />}
            <h2 style={{ color:'white', fontSize:'14px', fontWeight:700, margin:0, whiteSpace:'nowrap' }}>{currentNav?.label || 'Dashboard'}</h2>
            <AnimatePresence>{hasChanges && <motion.span initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.85 }} transition={{ duration:0.15 }} style={{ background:'rgba(251,191,36,0.15)', border:'1px solid rgba(251,191,36,0.4)', borderRadius:'6px', padding:'2px 8px', fontSize:'10px', color:'#fbbf24', fontWeight:600, flexShrink:0 }}>● {t('unsaved')}</motion.span>}</AnimatePresence>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
            <ThemeColorPicker profile={localProfile} onUpdate={updateLocal} />
            <button onClick={handleSave} disabled={!hasChanges||updateMutation.isPending} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', background:hasChanges?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.07)', border:'1px solid '+(hasChanges?'transparent':'rgba(255,255,255,0.12)'), borderRadius:'9px', color:hasChanges?'white':'rgba(255,255,255,0.4)', fontSize:'11px', fontWeight:600, cursor:hasChanges?'pointer':'default', opacity:updateMutation.isPending?0.7:1 }}>
              {updateMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}{!isMobile && t('save')}
            </button>
            <button onClick={handleSignOut} title={user?.email} style={{ width:'34px', height:'34px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'9px', cursor:'pointer' }}><LogOut size={14} color="rgba(255,255,255,0.5)" /></button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:isMobile?'16px':'24px', paddingBottom:isMobile?'100px':'24px' }}>
          <PanelErrorBoundary key={activeSection}>
            <AnimatePresence mode="wait">
              <motion.div key={activeSection} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.18 }}>
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </PanelErrorBoundary>
        </div>
      </div>

      {isMobile && <MobileNav activeSection={activeSection} onNavigate={setActiveSection} profile={localProfile} plan={rawPlan} limits={limits} onBgUpload={handleBgUpload} onBgRemove={()=>updateLocal({ bg_image_url:null })} bgImageUrl={localProfile?.bg_image_url} uploadingBg={uploadingBg} />}

      {showPreview && <ProfilePreview profile={localProfile} onClose={()=>setShowPreview(false)} />}
      <AnimatePresence>{showWaveModal && <WaveModal onClose={()=>setShowWaveModal(false)} />}</AnimatePresence>
      <AnimatePresence>{showPlanModal && <PlanModal onClose={()=>setShowPlanModal(false)} onSelect={handlePlanSelect} />}</AnimatePresence>

      <style>{`
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}
        *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.1) transparent}
        *::-webkit-scrollbar{width:5px;height:5px}
        *::-webkit-scrollbar-track{background:transparent}
        *::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px}
      `}</style>
    </div>
  );
}