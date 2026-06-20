import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Plus, Save, Loader2, Sparkles, Trash2, Check, ChevronLeft, ChevronRight,
  CalendarClock, LogOut, AtSign, Eye, CalendarDays, MapPin, BadgeCheck,
  Palette, ImagePlus, X, GripVertical, Layout, Bell, BellOff, Smartphone, Search,
  ShieldCheck, Clock, Users, RefreshCw, Activity, BarChart3, TrendingUp,
  Zap, UserPlus, Globe, Link2, Settings, LayoutDashboard, FileText,
  ShoppingBag, MousePointerClick, ArrowUpRight, ArrowDownRight, Radio,
  Mail, Phone, Tag, Filter, Download, ChevronDown, Star, MessageSquare,
  Wifi, WifiOff, CircleDot, Layers, MessageCircle, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext.jsx';
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import PlatformCard from "@/components/dashboard/PlatformCard";
import AddPlatformDialog, { PLATFORMS } from "@/components/dashboard/AddPlatformDialog";
import QRCodeDisplay from "@/components/dashboard/QRCodeDisplay";
import ThemeColorPicker from "@/components/dashboard/ThemeColorPicker";
import StatsCard from "@/components/dashboard/StatsCard";
import ProfilePreview from "@/components/dashboard/ProfilePreview";
import MarketplacePanel from "@/components/dashboard/MarketplacePanel";
import DocumentsPanel from "@/components/dashboard/DocumentsPanel";
import AutomationsPanel from "@/components/dashboard/AutomationsPanel";
import IntegrationsPanel from "@/components/dashboard/IntegrationsPanel";
import MobileNav from "@/components/dashboard/MobileNav";
import EventManager from "@/components/dashboard/EventManager";
import UserSettingsPanel from "@/components/dashboard/UserSettingsPanel";
import WhatsappCRMPanel from "@/components/dashboard/WhatsappCRMPanel";
import { useTranslation } from "react-i18next";
import PromotionsDashboard from "@/components/dashboard/PromotionsDashboard";
import { BioAIGenerator, CampaignAIGenerator, PlatformAISuggestions } from "@/components/dashboard/AIPanels"
import AdminFormsPanel from "@/components/forms/AdminFormsPanel";

// ── Imports optionnels (commentez si les fichiers n'existent pas encore) ───────
let BoostPanel = null;
let MetaIntegrationPanel = null;
let BoostAnalyticsPanel = null;
try { BoostPanel = require("@/components/dashboard/BoostPanel").default; } catch {}
try { MetaIntegrationPanel = require("@/components/dashboard/MetaIntegrationPanel").default; } catch {}
try { BoostAnalyticsPanel = require("@/components/dashboard/BoostAnalyticsPanel").default; } catch {}

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    let frame;
    const handler = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setWidth(window.innerWidth)); };
    window.addEventListener('resize', handler);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', handler); };
  }, []);
  return width;
}

// ─── DB ───────────────────────────────────────────────────────────────────────
const db = {
  list: async () => {
    const { data, error } = await supabase.from('link_profiles').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  create: async (data) => {
    const { data: created, error } = await supabase.from('link_profiles').insert([data]).select().maybeSingle();
    if (error) throw error;
    return created;
  },
  update: async (id, data) => {
    const { data: updated, error } = await supabase.from('link_profiles').update(data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return updated;
  },
  delete: async (id) => {
    const { error } = await supabase.from('link_profiles').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
};

// ─── Constants ────────────────────────────────────────────────────────────────
const LINKS_PER_PAGE    = 10;
const PROFILES_PER_PAGE = 10;
const MAX_SIZE_KB       = 2000;

const SIDEBAR_NAV = [
  { id: 'overview',        label: 'Dashboard',        icon: LayoutDashboard, group: 'main' },
  { id: 'realtime',        label: 'Temps réel',        icon: Radio,           group: 'main', badge: 'LIVE' },
  { id: 'analytics',       label: 'Analytics',         icon: BarChart3,       group: 'main' },
  { id: 'leads',           label: 'Leads / CRM',       icon: UserPlus,        group: 'crm' },
  { id: 'whatsapp-crm',    label: 'WhatsApp CRM',      icon: MessageCircle,   group: 'crm' },
  { id: 'automations',     label: 'Automatisations',   icon: Zap,             group: 'crm' },
  { id: 'integrations',    label: 'Intégrations',      icon: Sparkles,        group: 'crm' },
  { id: 'meta',            label: 'Connexion Meta',    icon: Zap,             group: 'crm' },
  { id: 'boost',           label: 'Boost',             icon: Sparkles,        group: 'crm' },
  { id: 'boost-analytics', label: 'Analytics Boost',  icon: BarChart3,       group: 'crm' },
  { id: 'promotions', label: 'Promotions', icon: Zap, group: 'crm', badge: 'NEW' },
  { id: 'profiles',        label: 'Mes profils',        icon: Layers,          group: 'content' },
  { id: 'platforms',       label: 'Plateformes',        icon: Link2,           group: 'content' },
  { id: 'event',           label: 'Événement',          icon: CalendarDays,    group: 'content' },
  { id: 'eventmanager',    label: 'Event Manager',      icon: CalendarDays,    group: 'content', badge: 'NEW' },
  { id: 'marketplace',     label: 'Marketplace',        icon: ShoppingBag,     group: 'content' },
  { id: 'documents',       label: 'Documents',          icon: FileText,        group: 'content' },
  { id: 'forms', label: 'Formulaires', icon: FileText, group: 'content' },
  { id: 'accounts',        label: 'Comptes',            icon: Users,           group: 'admin' },
  { id: 'settings',        label: 'Paramètres',         icon: Settings,        group: 'admin' },
];

const GROUPS = [
  { id: 'main',    label: 'Dashboard' },
  { id: 'crm',     label: 'CRM' },
  { id: 'content', label: 'Contenu' },
  { id: 'admin',   label: 'Administration' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseColors = (themeColor) => {
  if (themeColor && themeColor.includes('|')) {
    const parts = themeColor.split('|');
    return { bg1: parts[0], bg2: parts[1] };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

const EVENT_COLOR_PRESETS = [
  { label: 'Coucher de soleil', c1: '#ff6b35', c2: '#f7c948' },
  { label: 'Océan',             c1: '#0ea5e9', c2: '#6366f1' },
  { label: 'Forêt',             c1: '#10b981', c2: '#065f46' },
  { label: 'Rose',              c1: '#ec4899', c2: '#8b5cf6' },
  { label: 'Nuit',              c1: '#1e1b4b', c2: '#312e81' },
  { label: 'Rouge',             c1: '#ef4444', c2: '#b91c1c' },
];

const PROFILE_TEMPLATES = [
  { id: 'artiste',   label: 'Artiste',   emoji: '🎨', desc: 'Instagram, TikTok, YouTube, Spotify',       theme_color: '#7c3aed|#db2777', bio: 'Artiste & créateur de contenu ✨',             platformKeys: ['instagram','tiktok','youtube','spotify'] },
  { id: 'business',  label: 'Business',  emoji: '💼', desc: 'LinkedIn, Calendly, Email, Site web',       theme_color: '#0f172a|#1e40af', bio: 'Entrepreneur & consultant professionnel',      platformKeys: ['linkedin','calendly','email','website'] },
  { id: 'createur',  label: 'Créateur',  emoji: '📱', desc: 'YouTube, TikTok, Instagram, X',            theme_color: '#0f0a1e|#2d1b69', bio: 'Créateur de contenu | Suivez mon aventure 🚀', platformKeys: ['youtube','tiktok','instagram','twitter'] },
  { id: 'evenement', label: 'Événement', emoji: '🎉', desc: 'Mode événement activé + compte à rebours', theme_color: '#1a0a00|#7c2d12', bio: 'Rejoins-nous pour un événement exceptionnel !', platformKeys: ['instagram','facebook','whatsapp'], is_event: true, event_color1: '#ff6b35', event_color2: '#f7c948' },
  { id: 'musique',   label: 'Musique',   emoji: '🎵', desc: 'Spotify, Apple Music, SoundCloud',         theme_color: '#064e3b|#065f46', bio: 'Musicien | Écoutez mes derniers titres 🎶',    platformKeys: ['spotify','applemusic','soundcloud','youtube'] },
  { id: 'gaming',    label: 'Gaming',    emoji: '🎮', desc: 'Twitch, Discord, TikTok, YouTube',         theme_color: '#0d0221|#4a0e8f', bio: "Gamer & streamer 🎮 | Let's play together",   platformKeys: ['twitch','discord','tiktok','youtube'] },
];

// ─── Composant placeholder pour modules optionnels ───────────────────────────
function ComingSoon({ label }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'360px', gap:'12px', textAlign:'center', padding:'40px' }}>
      <div style={{ width:'64px', height:'64px', borderRadius:'18px', background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px' }}>🚧</div>
      <p style={{ color:'white', fontSize:'18px', fontWeight:700, margin:0 }}>{label}</p>
      <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'13px', margin:0 }}>Ce module sera bientôt disponible.</p>
    </div>
  );
}

// ─── MiniStat ─────────────────────────────────────────────────────────────────
function MiniStat({ label, value, icon: Icon, color, trend, trendUp }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'11px', fontWeight:500 }}>{label}</span>
        <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:color+'22', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={13} color={color}/>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <span style={{ color:'white', fontSize:'22px', fontWeight:800, lineHeight:1 }}>{value}</span>
        {trend && (
          <div style={{ display:'flex', alignItems:'center', gap:'3px', color:trendUp?'#22c55e':'#ef4444', fontSize:'11px', fontWeight:600 }}>
            {trendUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}{trend}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RealtimePanel ────────────────────────────────────────────────────────────
function RealtimePanel({ profileId }) {
  const [visitors, setVisitors]         = useState([]);
  const [connected, setConnected]       = useState(false);
  const [totalToday, setTotalToday]     = useState(0);
  const [recentClicks, setRecentClicks] = useState([]);

  useEffect(() => {
    if (!profileId) return;
    const today = new Date(); today.setHours(0,0,0,0);
    supabase.from('profile_stats').select('id',{count:'exact',head:true}).eq('profile_id',profileId).eq('event_type','view').gte('created_at',today.toISOString()).then(({count})=>{ if(count) setTotalToday(count); });
    const channel = supabase.channel('realtime-admin-'+profileId)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'profile_stats'},(payload)=>{
        const ev=payload.new;
        if(ev.profile_id!==profileId) return;
        if(ev.event_type==='view'){
          setTotalToday(p=>p+1);
          setVisitors(prev=>[{id:ev.id||Date.now(),country:ev.country_name||ev.country||'?',device:ev.device||'desktop',time:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),referrer:ev.referrer||'direct'},...prev].slice(0,20));
        }
        if(ev.event_type==='click') setRecentClicks(prev=>[{id:Date.now(),platform:ev.platform||'lien',time:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})},...prev].slice(0,10));
      }).subscribe((status)=>setConnected(status==='SUBSCRIBED'));
    return ()=>{ supabase.removeChannel(channel); setConnected(false); };
  },[profileId]);

  const flagEmoji=(code)=>{ try{ return code&&code.length===2?String.fromCodePoint(...[...code.toUpperCase()].map(c=>c.charCodeAt(0)+127397)):'🌐'; }catch{ return '🌐'; }};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',background:connected?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',border:'1px solid '+(connected?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'),borderRadius:'20px',padding:'5px 12px'}}>
          <span style={{width:'7px',height:'7px',borderRadius:'50%',background:connected?'#22c55e':'#ef4444',display:'inline-block'}}/>
          <span style={{color:connected?'#22c55e':'#ef4444',fontSize:'12px',fontWeight:600}}>{connected?'Connecté':'Connexion…'}</span>
        </div>
        <span style={{color:'rgba(255,255,255,0.35)',fontSize:'12px'}}>Flux en direct — profil actif</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
        <MiniStat label="Vues aujourd'hui" value={totalToday} icon={Eye} color="#6366f1"/>
        <MiniStat label="Visiteurs live" value={visitors.length} icon={Activity} color="#22c55e"/>
        <MiniStat label="Clics récents" value={recentClicks.length} icon={MousePointerClick} color="#f59e0b"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',overflow:'hidden'}}>
          <div style={{padding:'12px 14px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:'8px'}}>
            <CircleDot size={13} color="#22c55e"/><span style={{color:'white',fontSize:'12px',fontWeight:700}}>Flux visiteurs</span>
          </div>
          <div style={{maxHeight:'280px',overflowY:'auto'}}>
            {visitors.length===0?(<div style={{padding:'28px 16px',textAlign:'center'}}><Wifi size={20} color="rgba(255,255,255,0.15)" style={{margin:'0 auto 8px'}}/><p style={{color:'rgba(255,255,255,0.25)',fontSize:'12px',margin:0}}>En attente de visiteurs…</p></div>)
            :visitors.map(v=>(
              <motion.div key={v.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 14px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <span style={{fontSize:'16px',width:'20px',flexShrink:0}}>{flagEmoji(v.country)}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color:'white',fontSize:'11px',fontWeight:600,margin:0}}>{v.country}</p>
                  <p style={{color:'rgba(255,255,255,0.35)',fontSize:'10px',margin:0}}>{v.device} · {v.referrer}</p>
                </div>
                <span style={{color:'rgba(255,255,255,0.3)',fontSize:'10px',flexShrink:0}}>{v.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',overflow:'hidden'}}>
          <div style={{padding:'12px 14px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:'8px'}}>
            <MousePointerClick size={13} color="#f59e0b"/><span style={{color:'white',fontSize:'12px',fontWeight:700}}>Clics plateformes</span>
          </div>
          <div style={{maxHeight:'280px',overflowY:'auto'}}>
            {recentClicks.length===0?(<div style={{padding:'28px 16px',textAlign:'center'}}><MousePointerClick size={20} color="rgba(255,255,255,0.15)" style={{margin:'0 auto 8px'}}/><p style={{color:'rgba(255,255,255,0.25)',fontSize:'12px',margin:0}}>Aucun clic récent</p></div>)
            :recentClicks.map(c=>(
              <motion.div key={c.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 14px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <div style={{width:'26px',height:'26px',borderRadius:'8px',background:'rgba(245,158,11,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><MousePointerClick size={12} color="#f59e0b"/></div>
                <div style={{flex:1}}><p style={{color:'white',fontSize:'11px',fontWeight:600,margin:0,textTransform:'capitalize'}}>{c.platform}</p></div>
                <span style={{color:'rgba(255,255,255,0.3)',fontSize:'10px'}}>{c.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AnalyticsPanel ───────────────────────────────────────────────────────────
function AnalyticsPanel({ profileId }) {
  const [period, setPeriod]   = useState('7d');
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [geoData, setGeoData] = useState([]);
  const [topLinks, setTopLinks] = useState([]);

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      setLoading(true);
      const days = period==='7d'?7:period==='30d'?30:90;
      const from = new Date(); from.setDate(from.getDate()-days);
      const {data:viewsData} = await supabase.from('profile_stats').select('created_at,country,country_name,platform').eq('profile_id',profileId).gte('created_at',from.toISOString());
      const {data:prevData}  = await supabase.from('profile_stats').select('id').eq('profile_id',profileId).eq('event_type','view').gte('created_at',new Date(from.getTime()-days*86400000).toISOString()).lt('created_at',from.toISOString());
      const views  = (viewsData||[]).filter(r=>!r.platform);
      const clicks = (viewsData||[]).filter(r=>r.platform);
      const prevCount = prevData?.length||0;
      const trend = prevCount>0?Math.round(((views.length-prevCount)/prevCount)*100):null;
      setStats({views:views.length,clicks:clicks.length,ctr:views.length>0?Math.round((clicks.length/views.length)*100):0,trend,trendUp:trend!==null?trend>=0:true});
      const geoMap={};
      views.forEach(r=>{ const k=r.country_name||r.country||'Inconnu'; geoMap[k]={count:(geoMap[k]?.count||0)+1,code:r.country}; });
      setGeoData(Object.entries(geoMap).sort((a,b)=>b[1].count-a[1].count).slice(0,6));
      const clickMap={};
      clicks.forEach(r=>{ clickMap[r.platform]=(clickMap[r.platform]||0)+1; });
      setTopLinks(Object.entries(clickMap).sort((a,b)=>b[1]-a[1]).slice(0,6));
      setLoading(false);
    })();
  },[profileId,period]);

  const flagEmoji=(code)=>{ try{ return code&&code.length===2?String.fromCodePoint(...[...code.toUpperCase()].map(c=>c.charCodeAt(0)+127397)):'🌐'; }catch{ return '🌐'; }};
  const maxGeo  = geoData[0]?.[1]?.count||1;
  const maxLink = topLinks[0]?.[1]||1;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
        <div>
          <h2 style={{color:'white',fontSize:'18px',fontWeight:800,margin:0}}>Analytics</h2>
          <p style={{color:'rgba(255,255,255,0.35)',fontSize:'12px',margin:'3px 0 0'}}>Vue d'ensemble des performances</p>
        </div>
        <div style={{display:'flex',gap:'4px',background:'rgba(255,255,255,0.06)',borderRadius:'12px',padding:'4px'}}>
          {['7d','30d','90d'].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{padding:'6px 14px',borderRadius:'8px',border:'none',background:period===p?'rgba(99,102,241,0.4)':'transparent',color:period===p?'white':'rgba(255,255,255,0.45)',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>{p}</button>
          ))}
        </div>
      </div>
      {loading?(<div style={{display:'flex',justifyContent:'center',padding:'40px'}}><Loader2 size={24} className="animate-spin" color="rgba(99,102,241,0.6)"/></div>):(
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px'}}>
            <MiniStat label="Vues totales"  value={stats?.views||0}              icon={Eye}              color="#6366f1" trend={stats?.trend!==null?Math.abs(stats.trend)+'%':null} trendUp={stats?.trendUp}/>
            <MiniStat label="Clics liens"   value={stats?.clicks||0}             icon={MousePointerClick} color="#f59e0b"/>
            <MiniStat label="Taux de clic"  value={(stats?.ctr||0)+'%'}          icon={TrendingUp}       color="#22c55e"/>
            <MiniStat label="Pays atteints" value={geoData.length}               icon={Globe}            color="#0ea5e9"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'18px',padding:'16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}><Globe size={14} color="#0ea5e9"/><h3 style={{color:'white',fontSize:'13px',fontWeight:700,margin:0}}>Top pays</h3></div>
              {geoData.length===0?<p style={{color:'rgba(255,255,255,0.25)',fontSize:'12px',textAlign:'center',padding:'16px 0'}}>Pas encore de données</p>
              :geoData.map(([country,{count,code}])=>(
                <div key={country} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                  <span style={{fontSize:'16px',width:'22px',flexShrink:0}}>{flagEmoji(code)}</span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                      <span style={{color:'rgba(255,255,255,0.8)',fontSize:'11px',fontWeight:500}}>{country}</span>
                      <span style={{color:'rgba(255,255,255,0.4)',fontSize:'11px'}}>{count}</span>
                    </div>
                    <div style={{height:'4px',background:'rgba(255,255,255,0.08)',borderRadius:'2px'}}>
                      <div style={{height:'100%',width:Math.round((count/maxGeo)*100)+'%',background:'linear-gradient(90deg,#0ea5e9,#6366f1)',borderRadius:'2px'}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'18px',padding:'16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}><MousePointerClick size={14} color="#f59e0b"/><h3 style={{color:'white',fontSize:'13px',fontWeight:700,margin:0}}>Liens les plus cliqués</h3></div>
              {topLinks.length===0?<p style={{color:'rgba(255,255,255,0.25)',fontSize:'12px',textAlign:'center',padding:'16px 0'}}>Pas encore de données</p>
              :topLinks.map(([platform,count])=>{
                const p=(PLATFORMS&&PLATFORMS[platform])||{label:platform,color:'#6366f1'};
                return(
                  <div key={platform} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                    <div style={{width:'22px',height:'22px',borderRadius:'6px',background:p.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {p.icon?React.cloneElement(p.icon,{width:11,height:11}):<span style={{color:'white',fontSize:'7px',fontWeight:'bold'}}>{(p.label||'?')[0]}</span>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                        <span style={{color:'rgba(255,255,255,0.8)',fontSize:'11px',fontWeight:500,textTransform:'capitalize'}}>{p.label||platform}</span>
                        <span style={{color:'rgba(255,255,255,0.4)',fontSize:'11px'}}>{count}</span>
                      </div>
                      <div style={{height:'4px',background:'rgba(255,255,255,0.08)',borderRadius:'2px'}}>
                        <div style={{height:'100%',width:Math.round((count/maxLink)*100)+'%',background:'linear-gradient(90deg,'+p.color+',rgba(255,255,255,0.3))',borderRadius:'2px'}}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── LeadsCRMPanel ────────────────────────────────────────────────────────────
function LeadsCRMPanel({ profileId }) {
  const [leads,        setLeads]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [showAddLead,  setShowAddLead]  = useState(false);
  const [newLead,      setNewLead]      = useState({ name:'', email:'', phone:'', tag:'prospect', notes:'' });

  const TAGS = [
    { id:'prospect', label:'Prospect',  color:'#6366f1' },
    { id:'chaud',    label:'🔥 Chaud',  color:'#ef4444' },
    { id:'client',   label:'✅ Client', color:'#22c55e' },
    { id:'froid',    label:'❄️ Froid',  color:'#0ea5e9' },
    { id:'perdu',    label:'Perdu',     color:'#6b7280' },
  ];

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('leads').select('*').eq('profile_id', profileId).order('created_at', { ascending: false });
      setLeads(data || []);
      setLoading(false);
    })();
  }, [profileId]);

  const addLead = async () => {
    if (!newLead.name.trim()) { toast.error('Nom requis'); return; }
    const { data, error } = await supabase.from('leads').insert([{ ...newLead, profile_id: profileId }]).select().maybeSingle();
    if (error) { toast.error('Erreur : ' + error.message); return; }
    setLeads(prev => [data, ...prev]);
    setNewLead({ name:'', email:'', phone:'', tag:'prospect', notes:'' });
    setShowAddLead(false);
    toast.success('Lead ajouté !');
  };

  const updateTag = async (id, tag) => {
    await supabase.from('leads').update({ tag }).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, tag } : l));
  };

  const deleteLead = async (id) => {
    if (!window.confirm('Supprimer ce lead ?')) return;
    await supabase.from('leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
    toast.success('Lead supprimé');
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return (!q || (l.name||'').toLowerCase().includes(q) || (l.email||'').toLowerCase().includes(q))
        && (filter === 'all' || l.tag === filter);
  });

  const tagCounts = TAGS.reduce((acc, t) => { acc[t.id] = leads.filter(l => l.tag === t.id).length; return acc; }, {});

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
        <div>
          <h2 style={{color:'white',fontSize:'18px',fontWeight:800,margin:0}}>Leads & CRM</h2>
          <p style={{color:'rgba(255,255,255,0.35)',fontSize:'12px',margin:'3px 0 0'}}>{leads.length} contact{leads.length>1?'s':''} dans votre pipeline</p>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={()=>{ const csv=['Nom,Email,Téléphone,Tag,Notes',...leads.map(l=>[l.name,l.email,l.phone,l.tag,l.notes].map(v=>'"'+(v||'')+'"').join(','))].join('\n'); const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv]));a.download='leads.csv';a.click(); }} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'10px',color:'rgba(255,255,255,0.7)',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>
            <Download size={13}/> Export CSV
          </button>
          <button onClick={()=>setShowAddLead(v=>!v)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'10px',color:'white',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>
            <Plus size={13}/> Ajouter lead
          </button>
        </div>
      </div>
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
        {TAGS.map(t=>(
          <button key={t.id} onClick={()=>setFilter(filter===t.id?'all':t.id)}
            style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'20px',border:'1px solid '+(filter===t.id?t.color:'rgba(255,255,255,0.1)'),background:filter===t.id?t.color+'22':'rgba(255,255,255,0.04)',color:filter===t.id?'white':'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:600,cursor:'pointer'}}>
            <span style={{width:'7px',height:'7px',borderRadius:'50%',background:t.color,flexShrink:0}}/>{t.label}
            <span style={{background:'rgba(255,255,255,0.15)',borderRadius:'4px',padding:'0 5px',fontSize:'10px'}}>{tagCounts[t.id]||0}</span>
          </button>
        ))}
      </div>
      <AnimatePresence>
        {showAddLead&&(
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
            style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:'18px',padding:'16px',overflow:'hidden'}}>
            <h3 style={{color:'white',fontSize:'13px',fontWeight:700,margin:'0 0 12px'}}>Nouveau lead</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
              {[['name','Nom *'],['email','Email'],['phone','Téléphone']].map(([key,placeholder])=>(
                <input key={key} type="text" placeholder={placeholder} value={newLead[key]} onChange={e=>setNewLead(p=>({...p,[key]:e.target.value}))}
                  style={{padding:'9px 12px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'10px',color:'white',fontSize:'12px',outline:'none'}}/>
              ))}
              <select value={newLead.tag} onChange={e=>setNewLead(p=>({...p,tag:e.target.value}))}
                style={{padding:'9px 12px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'10px',color:'white',fontSize:'12px',outline:'none'}}>
                {TAGS.map(t=><option key={t.id} value={t.id} style={{background:'#0a0817'}}>{t.label}</option>)}
              </select>
            </div>
            <textarea placeholder="Notes..." value={newLead.notes} onChange={e=>setNewLead(p=>({...p,notes:e.target.value}))} rows={2}
              style={{width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'10px',color:'white',fontSize:'12px',outline:'none',resize:'none',boxSizing:'border-box',marginBottom:'10px'}}/>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={addLead} style={{flex:1,padding:'9px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'10px',color:'white',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Enregistrer</button>
              <button onClick={()=>setShowAddLead(false)} style={{padding:'9px 16px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.6)',fontSize:'12px',cursor:'pointer'}}>Annuler</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{position:'relative'}}>
        <Search size={13} style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.3)',pointerEvents:'none'}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un lead..." style={{width:'100%',boxSizing:'border-box',padding:'10px 12px 10px 32px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',color:'white',fontSize:'12px',outline:'none'}}/>
      </div>
      {loading?(<div style={{textAlign:'center',padding:'32px'}}><Loader2 size={20} className="animate-spin" color="rgba(99,102,241,0.6)"/></div>)
      :filtered.length===0?(<div style={{textAlign:'center',padding:'40px',background:'rgba(255,255,255,0.03)',border:'1px dashed rgba(255,255,255,0.1)',borderRadius:'16px'}}><UserPlus size={24} color="rgba(255,255,255,0.15)" style={{margin:'0 auto 10px'}}/><p style={{color:'rgba(255,255,255,0.3)',fontSize:'13px',margin:0}}>Aucun lead pour l'instant</p></div>)
      :(<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {filtered.map(lead=>{
          const tag=TAGS.find(t=>t.id===lead.tag)||TAGS[0];
          return(
            <motion.div key={lead.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
              style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'14px'}}>
              <div style={{width:'36px',height:'36px',borderRadius:'10px',background:tag.color+'22',border:'1px solid '+tag.color+'44',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:800,color:tag.color,flexShrink:0}}>
                {(lead.name||'?')[0].toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:'white',fontSize:'13px',fontWeight:700,margin:0}}>{lead.name}</p>
                <div style={{display:'flex',gap:'10px',marginTop:'2px',flexWrap:'wrap'}}>
                  {lead.email&&<span style={{color:'rgba(255,255,255,0.4)',fontSize:'11px',display:'flex',alignItems:'center',gap:'4px'}}><Mail size={10}/>{lead.email}</span>}
                  {lead.phone&&<span style={{color:'rgba(255,255,255,0.4)',fontSize:'11px',display:'flex',alignItems:'center',gap:'4px'}}><Phone size={10}/>{lead.phone}</span>}
                </div>
              </div>
              <select value={lead.tag} onChange={e=>updateTag(lead.id,e.target.value)}
                style={{padding:'5px 8px',background:tag.color+'22',border:'1px solid '+tag.color+'55',borderRadius:'8px',color:tag.color,fontSize:'11px',fontWeight:600,cursor:'pointer',outline:'none',flexShrink:0}}>
                {TAGS.map(t=><option key={t.id} value={t.id} style={{background:'#0a0817',color:'white'}}>{t.label}</option>)}
              </select>
              <button onClick={()=>deleteLead(lead.id)} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                <Trash2 size={11}/>
              </button>
            </motion.div>
          );
        })}
      </div>)}
    </div>
  );
}

// ─── OverviewPanel ────────────────────────────────────────────────────────────
function OverviewPanel({ profile, onNavigate, onUpdate, onSave, hasChanges, saving }) {
  const windowWidth = useWindowWidth();
  const isMob = windowWidth < 768;
  const navCards = [
    { section:'platforms',  label:'Plateformes', icon:Link2,       color:'#818cf8', bg:'rgba(99,102,241,0.18)',  sub:(profile?.links?.length||0)+' lien(s)' },
    { section:'event',      label:'Événement',   icon:CalendarDays,color:'#facc15', bg:'rgba(234,179,8,0.18)',  sub:profile?.is_event?'Activé':'Désactivé' },
    { section:'analytics',  label:'Analytics',   icon:BarChart3,   color:'#c084fc', bg:'rgba(139,92,246,0.18)', sub:'Actifs' },
    { section:'marketplace',label:'Marketplace', icon:ShoppingBag, color:'#4ade80', bg:'rgba(34,197,94,0.18)',  sub:'∞ produits max' },
    { section:'leads',      label:'CRM',         icon:UserPlus,    color:'#f472b6', bg:'rgba(236,72,153,0.18)', sub:'Actif' },
    { section:'documents',  label:'Documents',   icon:FileText,    color:'#9ca3af', bg:'rgba(107,114,128,0.25)',sub:'10 doc(s) max' },
  ];
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
      <div>
        <h2 style={{color:'white',fontSize:'20px',fontWeight:800,margin:0}}>Dashboard</h2>
        <p style={{color:'rgba(255,255,255,0.35)',fontSize:'13px',margin:'4px 0 0'}}>Bienvenue sur votre dashboard SocialApp</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'repeat(3,1fr)',gap:'16px',alignItems:'start'}}>
        <div style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'20px',overflow:'hidden'}}>
          <ProfileHeader profile={profile} onUpdate={onUpdate}/>
          <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',padding:'11px 14px',display:'flex',alignItems:'center',gap:'10px'}}>
            <AtSign size={13} color="rgba(255,255,255,0.4)"/>
            <span style={{color:'rgba(255,255,255,0.45)',fontSize:'12px',flexShrink:0}}>@</span>
            <input type="text" value={profile?.username||''} onChange={e=>onUpdate({username:e.target.value})} placeholder="username" style={{background:'transparent',border:'none',color:'white',fontSize:'12px',outline:'none',flex:1,minWidth:0}}/>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',padding:'11px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <BadgeCheck size={13} color="rgba(255,255,255,0.4)"/>
              <span style={{color:'rgba(255,255,255,0.6)',fontSize:'12px'}}>Badge vérifié</span>
            </div>
            <button onClick={()=>onUpdate({is_verified:!profile?.is_verified})} style={{width:'38px',height:'20px',borderRadius:'100px',background:profile?.is_verified?'#22c55e':'rgba(255,255,255,0.1)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.3s',flexShrink:0}}>
              <div style={{width:'14px',height:'14px',borderRadius:'50%',background:'white',position:'absolute',top:'3px',left:profile?.is_verified?'21px':'3px',transition:'left 0.3s'}}/>
            </button>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',padding:'11px 14px',display:'flex',alignItems:'center',gap:'8px'}}>
            <CalendarClock size={13} color="rgba(255,255,255,0.4)"/>
            <span style={{color:'rgba(255,255,255,0.45)',fontSize:'12px',flexShrink:0}}>Exp. :</span>
            <input type="date" value={profile?.expiry_date||''} onChange={e=>onUpdate({expiry_date:e.target.value})} style={{background:'transparent',border:'none',color:'white',fontSize:'12px',outline:'none',flex:1,minWidth:0}}/>
          </div>
          {hasChanges&&(
            <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',padding:'10px 14px'}}>
              <button onClick={onSave} disabled={saving} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',width:'100%',padding:'8px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'10px',color:'white',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
                {saving?<Loader2 size={12} className="animate-spin"/>:<Save size={12}/>} Sauvegarder
              </button>
            </div>
          )}
        </div>
        <div><QRCodeDisplay profileId={profile?.id} username={profile?.username} isActive={profile?.is_activated}/></div>
        <div><StatsCard profileId={profile?.id}/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:isMob?'repeat(2,1fr)':'repeat(3,1fr)',gap:'12px'}}>
        {navCards.map(card=>(
          <button key={card.section} onClick={()=>onNavigate(card.section)}
            style={{display:'flex',flexDirection:'column',gap:'14px',padding:'20px 18px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'16px',cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.transform='translateY(0)';}}>
            <div style={{width:'40px',height:'40px',borderRadius:'11px',background:card.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <card.icon size={18} color={card.color}/>
            </div>
            <div>
              <p style={{color:'white',fontSize:'14px',fontWeight:700,margin:0}}>{card.label}</p>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:'12px',margin:'4px 0 0'}}>{card.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ activeSection, onNavigate, profiles, activeProfileId, collapsed, onToggle, isMobile }) {
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const [search, setSearch] = useState('');
  const filteredNav = SIDEBAR_NAV.filter(n => !search || n.label.toLowerCase().includes(search.toLowerCase()));
  const handleNav = (id) => { onNavigate(id); if (isMobile) onToggle(); };
  const desktopWidth = collapsed ? 64 : 220;
  const sidebarStyle = isMobile
    ? { position:'fixed', top:0, left:0, width:'260px', height:'100vh', transform:collapsed?'translateX(-100%)':'translateX(0)', transition:'transform 0.25s ease', zIndex:20 }
    : { position:'sticky', top:0, width:desktopWidth+'px', minWidth:desktopWidth+'px', height:'100vh', transition:'width 0.25s ease, min-width 0.25s ease', zIndex:20, flexShrink:0 };

  return (
    <>
      {isMobile && !collapsed && <div onClick={onToggle} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:19}}/>}
      <div style={{...sidebarStyle,background:'rgba(6,4,18,0.97)',backdropFilter:'blur(24px)',borderRight:'1px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:isMobile&&!collapsed?'8px 0 40px rgba(0,0,0,0.7)':'none'}}>
        <div style={{padding:collapsed&&!isMobile?'18px 0':'16px',display:'flex',alignItems:'center',gap:'10px',borderBottom:'1px solid rgba(255,255,255,0.06)',justifyContent:collapsed&&!isMobile?'center':'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',overflow:'hidden'}}>
            <img src="/Logo_SocialApp.png" alt="" style={{width:'30px',height:'30px',borderRadius:'9px',objectFit:'cover',flexShrink:0}}/>
            {(!collapsed||isMobile)&&<div style={{overflow:'hidden'}}><span style={{color:'white',fontSize:'14px',fontWeight:800,display:'block',lineHeight:1,whiteSpace:'nowrap'}}>SocialApp</span><span style={{color:'rgba(255,255,255,0.3)',fontSize:'9px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase'}}>Admin</span></div>}
          </div>
          <button onClick={onToggle} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {collapsed&&!isMobile?<ChevronRight size={13} color="rgba(255,255,255,0.6)"/>:<ChevronLeft size={13} color="rgba(255,255,255,0.6)"/>}
          </button>
        </div>
        {(!collapsed||isMobile)&&activeProfile&&(
          <div style={{padding:'12px 14px',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:0}}>
            <div onClick={()=>handleNav('profiles')} style={{background:'rgba(255,255,255,0.06)',borderRadius:'12px',padding:'10px 12px',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer'}}>
              <div style={{width:'32px',height:'32px',borderRadius:'9px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'white',flexShrink:0,overflow:'hidden'}}>
                {activeProfile.avatar_url?<img src={activeProfile.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(activeProfile.display_name?.[0]?.toUpperCase()||'?')}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:'white',fontSize:'12px',fontWeight:700,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{activeProfile.display_name||'Mon profil'}</p>
                {activeProfile.username&&<p style={{color:'rgba(255,255,255,0.4)',fontSize:'10px',margin:0}}>@{activeProfile.username}</p>}
              </div>
              <ChevronRight size={13} color="rgba(255,255,255,0.3)"/>
            </div>
          </div>
        )}
        {(!collapsed||isMobile)&&(
          <div style={{padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',background:'rgba(255,255,255,0.06)',borderRadius:'9px',padding:'7px 10px',border:'1px solid rgba(255,255,255,0.08)'}}>
              <Search size={12} color="rgba(255,255,255,0.3)"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{background:'none',border:'none',outline:'none',color:'white',fontSize:'12px',flex:1,minWidth:0}}/>
              {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',display:'flex',padding:0}}><X size={11}/></button>}
            </div>
          </div>
        )}
        <div style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'8px'}}>
          {GROUPS.map(group=>{
            const items=(search?filteredNav:SIDEBAR_NAV).filter(n=>n.group===group.id);
            if(!items.length) return null;
            return(
              <div key={group.id} style={{marginBottom:'4px'}}>
                {collapsed&&!isMobile?<div style={{height:'1px',background:'rgba(255,255,255,0.06)',margin:'6px 4px 8px'}}/>
                :<p style={{color:'rgba(255,255,255,0.2)',fontSize:'9px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',padding:'8px 10px 4px',margin:0}}>{group.label}</p>}
                {items.map(item=>{
                  const isActive=activeSection===item.id;
                  return(
                    <button key={item.id} onClick={()=>handleNav(item.id)} title={collapsed&&!isMobile?item.label:''}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:collapsed&&!isMobile?0:'10px',padding:collapsed&&!isMobile?'10px 0':'9px 10px',borderRadius:'11px',border:'none',background:isActive?'rgba(99,102,241,0.18)':'transparent',cursor:'pointer',transition:'background 0.12s',justifyContent:collapsed&&!isMobile?'center':'flex-start',position:'relative',marginBottom:'2px'}}>
                      {isActive&&<div style={{position:'absolute',left:0,top:'50%',transform:'translateY(-50%)',width:'3px',height:'20px',background:'linear-gradient(180deg,#6366f1,#8b5cf6)',borderRadius:'0 3px 3px 0'}}/>}
                      <div style={{width:'30px',height:'30px',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:isActive?'rgba(99,102,241,0.25)':'transparent'}}>
                        <item.icon size={15} color={isActive?'#a78bfa':'rgba(255,255,255,0.45)'}/>
                      </div>
                      {(!collapsed||isMobile)&&(
                        <>
                          <span style={{color:isActive?'white':'rgba(255,255,255,0.6)',fontSize:'12.5px',fontWeight:isActive?700:500,flex:1,textAlign:'left',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.label}</span>
                          {item.badge&&<span style={{background:'#22c55e',borderRadius:'5px',padding:'1px 6px',fontSize:'9px',color:'white',fontWeight:700,flexShrink:0}}>{item.badge}</span>}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        {(!collapsed||isMobile)&&(
          <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.06)',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#22c55e',flexShrink:0}}/>
              <span style={{color:'rgba(255,255,255,0.25)',fontSize:'10px'}}>SocialApp Admin · v2.0</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── UserActivationPanel ──────────────────────────────────────────────────────
const PLAN_OPTIONS = [
  { id: 'basic',    label: 'Basic',    color: '#9ca3af' },
  { id: 'pro',      label: 'Pro',      color: '#f97316' },
  { id: 'business', label: 'Business', color: '#a855f7' },
];

function UserActivationPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pending');
  const { data: allProfiles=[], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminAllProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('link_profiles').select('id,display_name,username,is_activated,plan,expiry_date,user_id,created_at').order('created_at',{ascending:false});
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
  const activateMutation = useMutation({
    mutationFn: async (id) => { const {data,error}=await supabase.from('link_profiles').update({is_activated:true}).eq('id',id).select().maybeSingle(); if(error) throw error; return data; },
    onSuccess: (updated) => { queryClient.setQueryData(['adminAllProfiles'],(old)=>old.map(p=>p.id===updated.id?{...p,is_activated:true}:p)); toast.success('✅ Compte activé !'); },
  });
  const deactivateMutation = useMutation({
    mutationFn: async (id) => { const {data,error}=await supabase.from('link_profiles').update({is_activated:false}).eq('id',id).select().maybeSingle(); if(error) throw error; return data; },
    onSuccess: (updated) => { queryClient.setQueryData(['adminAllProfiles'],(old)=>old.map(p=>p.id===updated.id?{...p,is_activated:false}:p)); toast.success('Compte désactivé'); },
  });
  const planMutation = useMutation({
    mutationFn: async ({ id, plan }) => { const {data,error}=await supabase.from('link_profiles').update({plan}).eq('id',id).select().maybeSingle(); if(error) throw error; return data; },
    onSuccess: (updated) => {
      queryClient.setQueryData(['adminAllProfiles'],(old)=>old.map(p=>p.id===updated.id?{...p,plan:updated.plan}:p));
      const label = PLAN_OPTIONS.find(o=>o.id===updated.plan)?.label || updated.plan;
      toast.success('Plan mis à jour : ' + label);
    },
    onError: (error) => toast.error('Erreur : ' + error.message),
  });
  const filtered = allProfiles.filter(p=>{
    const q=search.toLowerCase();
    return (!q||(p.display_name||'').toLowerCase().includes(q)||(p.username||'').toLowerCase().includes(q))
        && (filter==='all'||(filter==='pending'&&!p.is_activated)||(filter==='active'&&p.is_activated));
  });
  const pendingCount=allProfiles.filter(p=>!p.is_activated).length;
  const activeCount=allProfiles.filter(p=>p.is_activated).length;
  const proCount=allProfiles.filter(p=>p.plan==='pro'||p.plan==='business').length;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h2 style={{color:'white',fontSize:'18px',fontWeight:800,margin:0}}>Gestion des comptes</h2>
          <p style={{color:'rgba(255,255,255,0.35)',fontSize:'12px',margin:'4px 0 0'}}>{allProfiles.length} profils · {pendingCount} en attente</p>
        </div>
        <button onClick={()=>refetch()} style={{width:'32px',height:'32px',borderRadius:'9px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <RefreshCw size={13} color="rgba(255,255,255,0.5)" className={isFetching?'animate-spin':''}/>
        </button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
        <MiniStat label="Total"      value={allProfiles.length} icon={Users}       color="#a78bfa"/>
        <MiniStat label="Activés"    value={activeCount}        icon={ShieldCheck} color="#22c55e"/>
        <MiniStat label="En attente" value={pendingCount}       icon={Clock}       color="#f97316"/>
        <MiniStat label="Pro/Business" value={proCount}         icon={Crown}       color="#facc15"/>
      </div>
      <div style={{display:'flex',gap:'8px'}}>
        <div style={{position:'relative',flex:1}}>
          <Search size={12} style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.3)',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." style={{width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 10px 8px 28px',color:'white',fontSize:'12px',outline:'none'}}/>
        </div>
        {[['pending','⏳ Attente'],['active','✓ Actifs'],['all','Tous']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:'8px 12px',borderRadius:'10px',border:'1px solid '+(filter===v?'rgba(99,102,241,0.5)':'rgba(255,255,255,0.1)'),background:filter===v?'rgba(99,102,241,0.15)':'transparent',color:filter===v?'#a78bfa':'rgba(255,255,255,0.4)',fontSize:'11px',cursor:'pointer',fontWeight:filter===v?600:400,whiteSpace:'nowrap'}}>{l}</button>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'6px',maxHeight:'460px',overflowY:'auto'}}>
        {isLoading?(<div style={{textAlign:'center',padding:'24px'}}><Loader2 size={16} className="animate-spin" color="rgba(255,255,255,0.3)"/></div>)
        :filtered.length===0?(<p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',textAlign:'center',padding:'24px'}}>{filter==='pending'?'🎉 Aucun compte en attente':'Aucun résultat'}</p>)
        :filtered.map(p=>{
          const currentPlan = PLAN_OPTIONS.find(o=>o.id===p.plan) || PLAN_OPTIONS[0];
          return(
          <div key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:'rgba(255,255,255,0.04)',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.07)',flexWrap:'wrap'}}>
            <div style={{width:'34px',height:'34px',borderRadius:'9px',background:p.is_activated?'linear-gradient(135deg,#22c55e,#16a34a)':'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'white',flexShrink:0}}>{(p.display_name||'?')[0].toUpperCase()}</div>
            <div style={{flex:1,minWidth:'120px'}}>
              <p style={{color:'white',fontSize:'12px',fontWeight:600,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.display_name||'Sans nom'}</p>
              <p style={{color:'rgba(255,255,255,0.35)',fontSize:'10px',margin:0}}>{p.username?'@'+p.username:'Sans username'}</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
              <Crown size={11} color={currentPlan.color}/>
              <select
                value={p.plan || 'basic'}
                onChange={e=>planMutation.mutate({ id: p.id, plan: e.target.value })}
                disabled={planMutation.isPending}
                style={{padding:'5px 8px',borderRadius:'8px',border:'1px solid '+currentPlan.color+'55',background:currentPlan.color+'1a',color:currentPlan.color,fontSize:'11px',fontWeight:700,cursor:'pointer',outline:'none'}}>
                {PLAN_OPTIONS.map(o=><option key={o.id} value={o.id} style={{background:'#0a0817',color:'white'}}>{o.label}</option>)}
              </select>
            </div>
            {p.is_activated
              ?<button onClick={()=>deactivateMutation.mutate(p.id)} style={{padding:'5px 10px',borderRadius:'8px',border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.1)',color:'#f87171',fontSize:'11px',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',flexShrink:0}}><X size={10}/>Désact.</button>
              :<button onClick={()=>activateMutation.mutate(p.id)} style={{padding:'5px 10px',borderRadius:'8px',border:'1px solid rgba(34,197,94,0.35)',background:'rgba(34,197,94,0.12)',color:'#22c55e',fontSize:'11px',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',flexShrink:0}}><Check size={10}/>Activer</button>}
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PlatformsPanel ───────────────────────────────────────────────────────────
function PlatformsPanel({ localProfile, updateLocal, showAddDialog, setShowAddDialog }) {
  const [linksPage, setLinksPage]     = useState(0);
  const dragIndexRef                  = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const links      = localProfile?.links || [];
  const pagedLinks = links.slice(linksPage * LINKS_PER_PAGE, (linksPage + 1) * LINKS_PER_PAGE);
  const totalLinkPages = Math.ceil(links.length / LINKS_PER_PAGE);

  const handleDragStart = useCallback((e,idx)=>{ dragIndexRef.current=idx; e.dataTransfer.effectAllowed='move'; setTimeout(()=>{ if(e.currentTarget) e.currentTarget.style.opacity='0.4'; },0); },[]);
  const handleDragEnd   = useCallback((e)=>{ e.currentTarget.style.opacity='1'; dragIndexRef.current=null; setDragOverIndex(null); },[]);
  const handleDragOver  = useCallback((e,idx)=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; setDragOverIndex(idx); },[]);
  const handleDragLeave = useCallback(()=>setDragOverIndex(null),[]);
  const handleDrop = useCallback((e,toIdx)=>{
    e.preventDefault();
    const fromIdx=dragIndexRef.current;
    if(fromIdx===null||fromIdx===toIdx){ setDragOverIndex(null); return; }
    const newLinks=[...(localProfile?.links||[])];
    const [moved]=newLinks.splice(fromIdx,1);
    newLinks.splice(toIdx,0,moved);
    updateLocal({links:newLinks});
    setDragOverIndex(null); dragIndexRef.current=null;
  },[localProfile,updateLocal]);

  const handleUpdateLink = useCallback((index,updated)=>{ const l=[...(localProfile?.links||[])]; l[index]=updated; updateLocal({links:l}); },[localProfile,updateLocal]);
  const handleRemoveLink = useCallback((index)=>{ const l=(localProfile?.links||[]).filter((_,i)=>i!==index); updateLocal({links:l}); setLinksPage(p=>Math.min(p,Math.max(0,Math.ceil(l.length/LINKS_PER_PAGE)-1))); },[localProfile,updateLocal]);
  const handleAddPlatform=(key)=>{ updateLocal({links:[...(localProfile?.links||[]),{id:crypto.randomUUID(),platform:key,url:'',label:'',enabled:true}]}); setShowAddDialog(false); };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h2 style={{color:'white',fontSize:'18px',fontWeight:800,margin:0}}>Mes plateformes</h2>
          <p style={{color:'rgba(255,255,255,0.35)',fontSize:'12px',margin:'4px 0 0'}}>{links.length} lien(s) configuré(s)</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={()=>setShowAddDialog(true)}><Plus className="w-3.5 h-3.5"/> Ajouter</Button>
      </div>
      {links.length===0?(
        <div style={{background:'rgba(255,255,255,0.03)',border:'2px dashed rgba(255,255,255,0.12)',borderRadius:'18px',padding:'48px 24px',textAlign:'center'}}>
          <Link2 size={28} color="rgba(255,255,255,0.15)" style={{margin:'0 auto 10px'}}/>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:'14px',margin:0}}>Aucune plateforme configurée</p>
        </div>
      ):(
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'10px'}}>
            {pagedLinks.map((link,i)=>{
              const absoluteIndex=linksPage*LINKS_PER_PAGE+i;
              const isDragOver=dragOverIndex===absoluteIndex;
              return(
                <div key={link.id||link.platform+'-'+absoluteIndex}
                  draggable onDragStart={e=>handleDragStart(e,absoluteIndex)} onDragEnd={handleDragEnd}
                  onDragOver={e=>handleDragOver(e,absoluteIndex)} onDragLeave={handleDragLeave} onDrop={e=>handleDrop(e,absoluteIndex)}
                  style={{position:'relative',transition:'transform 0.15s',transform:isDragOver?'scale(1.02)':'scale(1)',outline:isDragOver?'2px dashed rgba(255,255,255,0.5)':'2px solid transparent',borderRadius:'16px',cursor:'grab'}}>
                  {links.length>1&&<div style={{position:'absolute',top:'50%',left:'8px',transform:'translateY(-50%)',zIndex:2,color:'rgba(255,255,255,0.25)',pointerEvents:'none'}}><GripVertical size={14}/></div>}
                  <PlatformCard link={link} index={absoluteIndex} onUpdate={u=>handleUpdateLink(absoluteIndex,u)} onRemove={()=>handleRemoveLink(absoluteIndex)}/>
                </div>
              );
            })}
          </div>
          {totalLinkPages>1&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 0'}}>
              <button disabled={linksPage===0} onClick={()=>setLinksPage(p=>p-1)} style={{padding:'6px 12px',borderRadius:'8px',background:'rgba(255,255,255,0.1)',border:'none',color:'white',fontSize:'12px',cursor:'pointer',opacity:linksPage===0?0.3:1}}>Précédent</button>
              <span style={{color:'rgba(255,255,255,0.4)',fontSize:'12px'}}>{linksPage+1} / {totalLinkPages}</span>
              <button disabled={linksPage>=totalLinkPages-1} onClick={()=>setLinksPage(p=>p+1)} style={{padding:'6px 12px',borderRadius:'8px',background:'rgba(255,255,255,0.1)',border:'none',color:'white',fontSize:'12px',cursor:'pointer',opacity:linksPage>=totalLinkPages-1?0.3:1}}>Suivant</button>
            </div>
          )}
        </>
      )}
      <AddPlatformDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSelect={handleAddPlatform} existingPlatforms={links.map(l=>l.platform)}/>
    </div>
  );
}

// ─── ProfilesPanel ────────────────────────────────────────────────────────────
function ProfilesPanel({ profiles, activeProfileId, onSwitch, onCreate, onDelete }) {
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(0);
  const filtered   = profiles.filter(p=>!search||(p.display_name||'').toLowerCase().includes(search.toLowerCase())||(p.username||'').toLowerCase().includes(search.toLowerCase()));
  const paged      = filtered.slice(page*PROFILES_PER_PAGE,(page+1)*PROFILES_PER_PAGE);
  const totalPages = Math.ceil(filtered.length/PROFILES_PER_PAGE);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px',maxWidth:'640px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h2 style={{color:'white',fontSize:'18px',fontWeight:800,margin:0}}>Mes profils</h2>
          <p style={{color:'rgba(255,255,255,0.35)',fontSize:'12px',margin:'4px 0 0'}}>{profiles.length} profil(s) créé(s)</p>
        </div>
        <button onClick={onCreate} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'10px',color:'white',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>
          <Plus size={13}/> Nouveau profil
        </button>
      </div>
      <div style={{position:'relative'}}>
        <Search size={13} style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.3)',pointerEvents:'none'}}/>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Rechercher un profil..." style={{width:'100%',boxSizing:'border-box',padding:'10px 12px 10px 32px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',color:'white',fontSize:'12px',outline:'none'}}/>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {paged.map(p=>{
          const isActive=p.id===activeProfileId;
          return(
            <div key={p.id} onClick={()=>onSwitch(p)} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',background:isActive?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.04)',border:'1px solid '+(isActive?'rgba(99,102,241,0.35)':'rgba(255,255,255,0.07)'),borderRadius:'14px',cursor:'pointer'}}>
              <div style={{width:'38px',height:'38px',borderRadius:'10px',background:isActive?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:700,color:'white',flexShrink:0,overflow:'hidden'}}>
                {p.avatar_url?<img src={p.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(p.display_name?.[0]?.toUpperCase()||'?')}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <span style={{color:'white',fontSize:'13px',fontWeight:isActive?700:500}}>{p.display_name||'Sans nom'}</span>
                  {p.is_verified&&<span style={{color:'#22c55e',fontSize:'11px'}}>✓</span>}
                  {p.is_activated&&<span style={{background:'rgba(34,197,94,0.15)',color:'#22c55e',padding:'1px 5px',borderRadius:'4px',fontSize:'9px',fontWeight:600}}>✅</span>}
                </div>
                {p.username&&<span style={{color:'rgba(255,255,255,0.35)',fontSize:'11px'}}>@{p.username}</span>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
                {isActive&&<Check size={14} color="#6366f1"/>}
                {profiles.length>1&&(
                  <button onClick={e=>{e.stopPropagation();onDelete(p);}} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                    <Trash2 size={11}/>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {totalPages>1&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <button disabled={page===0} onClick={()=>setPage(p=>p-1)} style={{padding:'6px 12px',borderRadius:'8px',background:'rgba(255,255,255,0.08)',border:'none',color:'white',fontSize:'12px',cursor:'pointer',opacity:page===0?0.3:1}}><ChevronLeft size={14}/></button>
          <span style={{color:'rgba(255,255,255,0.35)',fontSize:'12px'}}>{page+1} / {totalPages}</span>
          <button disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)} style={{padding:'6px 12px',borderRadius:'8px',background:'rgba(255,255,255,0.08)',border:'none',color:'white',fontSize:'12px',cursor:'pointer',opacity:page>=totalPages-1?0.3:1}}><ChevronRight size={14}/></button>
        </div>
      )}
    </div>
  );
}

// ─── EventPanel ───────────────────────────────────────────────────────────────
function EventPanel({ localProfile, updateLocal }) {
  const [uploadingEventImages, setUploadingEventImages] = useState(false);
  const eventImages = Array.isArray(localProfile.event_images) ? localProfile.event_images : localProfile.event_image_url ? [localProfile.event_image_url] : [];

  const handleEventImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const oversized = files.find(f => f.size/1024 > MAX_SIZE_KB);
    if (oversized) { toast.error(oversized.name+' dépasse '+MAX_SIZE_KB+' Ko'); return; }
    setUploadingEventImages(true);
    try {
      const uploadedUrls = await Promise.all(files.map(async (file) => {
        const fileName='event-'+localProfile.id+'-'+Date.now()+'-'+Math.random().toString(36).slice(2)+'.'+file.name.split('.').pop();
        const {error}=await supabase.storage.from('avatars').upload(fileName,file,{upsert:true});
        if(error) throw error;
        const {data}=supabase.storage.from('avatars').getPublicUrl(fileName);
        return data.publicUrl;
      }));
      const existing=(localProfile.event_images||(localProfile.event_image_url?[localProfile.event_image_url]:[]));
      const merged=[...existing,...uploadedUrls];
      updateLocal({event_images:merged,event_image_url:merged[0]});
      toast.success(uploadedUrls.length+' image(s) ajoutée(s) !');
    } catch(err){ toast.error('Erreur upload : '+err.message); }
    finally{ setUploadingEventImages(false); e.target.value=''; }
  };

  const handleRemoveEventImage=(idx)=>{
    const current=localProfile.event_images||(localProfile.event_image_url?[localProfile.event_image_url]:[]);
    const updated=current.filter((_,i)=>i!==idx);
    updateLocal({event_images:updated,event_image_url:updated[0]||null});
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px',maxWidth:'680px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h2 style={{color:'white',fontSize:'18px',fontWeight:800,margin:0}}>Mode Événement</h2>
          <p style={{color:'rgba(255,255,255,0.35)',fontSize:'12px',margin:'4px 0 0'}}>Compte à rebours et détails de l'événement</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{color:localProfile.is_event?'#fbbf24':'rgba(255,255,255,0.4)',fontSize:'12px',fontWeight:600}}>{localProfile.is_event?'Activé':'Désactivé'}</span>
          <button onClick={()=>updateLocal({is_event:!localProfile.is_event})} style={{width:'44px',height:'24px',borderRadius:'100px',background:localProfile.is_event?'linear-gradient(135deg,#ff6b35,#f7c948)':'rgba(255,255,255,0.1)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.3s'}}>
            <div style={{width:'18px',height:'18px',borderRadius:'50%',background:'white',position:'absolute',top:'3px',left:localProfile.is_event?'23px':'3px',transition:'left 0.3s'}}/>
          </button>
        </div>
      </div>
      {localProfile.is_event&&(
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'18px',padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
            <input type="text" value={localProfile.event_name||''} onChange={e=>updateLocal({event_name:e.target.value})} placeholder="Nom de l'événement" style={{padding:'10px 12px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'white',fontSize:'13px',outline:'none'}}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'10px'}}>
              <input type="datetime-local" value={localProfile.event_date||''} onChange={e=>updateLocal({event_date:e.target.value})} style={{padding:'10px 12px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'white',fontSize:'13px',outline:'none',width:'100%',boxSizing:'border-box'}}/>
              <div style={{display:'flex',alignItems:'center',gap:'8px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',minWidth:0}}>
                <MapPin size={14} color="rgba(255,255,255,0.3)" style={{flexShrink:0}}/>
                <input type="text" value={localProfile.event_location||''} onChange={e=>updateLocal({event_location:e.target.value})} placeholder="Lieu" style={{background:'transparent',border:'none',color:'white',fontSize:'13px',outline:'none',flex:1,minWidth:0}}/>
              </div>
            </div>
            <textarea value={localProfile.event_description||''} onChange={e=>updateLocal({event_description:e.target.value})} placeholder="Description…" rows={3} style={{padding:'10px 12px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'white',fontSize:'13px',outline:'none',resize:'none'}}/>
            <div style={{display:'flex',alignItems:'center',gap:'8px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px'}}>
              <span style={{fontSize:'14px'}}>🎟️</span>
              <input type="url" value={localProfile.event_booking_url||''} onChange={e=>updateLocal({event_booking_url:e.target.value})} placeholder="Lien réservation" style={{background:'transparent',border:'none',color:'white',fontSize:'13px',outline:'none',flex:1}}/>
            </div>
          </div>
          <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'18px',padding:'16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}><Palette size={14} color="rgba(255,255,255,0.4)"/><span style={{color:'rgba(255,255,255,0.6)',fontSize:'12px',fontWeight:600}}>Couleurs de l'événement</span></div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {EVENT_COLOR_PRESETS.map(preset=>(
                <button key={preset.label} onClick={()=>updateLocal({event_color1:preset.c1,event_color2:preset.c2})} title={preset.label}
                  style={{width:'32px',height:'32px',borderRadius:'9px',background:'linear-gradient(135deg,'+preset.c1+','+preset.c2+')',border:localProfile.event_color1===preset.c1?'3px solid white':'3px solid transparent',cursor:'pointer',flexShrink:0}}/>
              ))}
            </div>
          </div>
          <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'18px',padding:'16px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}><ImagePlus size={14} color="rgba(255,255,255,0.4)"/><span style={{color:'rgba(255,255,255,0.6)',fontSize:'12px',fontWeight:600}}>Images {eventImages.length>0&&'('+eventImages.length+')'}</span></div>
              {eventImages.length>0&&(
                <label style={{display:'flex',alignItems:'center',gap:'4px',background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.35)',borderRadius:'8px',padding:'5px 10px',cursor:'pointer',color:'#a78bfa',fontSize:'12px',fontWeight:600}}>
                  {uploadingEventImages?<Loader2 size={12} className="animate-spin"/>:<Plus size={12}/>} Ajouter
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleEventImagesUpload} disabled={uploadingEventImages}/>
                </label>
              )}
            </div>
            {eventImages.length===0?(
              <label style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',background:'rgba(255,255,255,0.04)',border:'2px dashed rgba(255,255,255,0.15)',borderRadius:'14px',padding:'28px',cursor:'pointer'}}>
                {uploadingEventImages?<Loader2 size={20} color="rgba(99,102,241,0.8)" className="animate-spin"/>:<ImagePlus size={20} color="rgba(255,255,255,0.25)"/>}
                <span style={{color:'rgba(255,255,255,0.4)',fontSize:'13px'}}>{uploadingEventImages?'Upload…':'Ajouter des images'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleEventImagesUpload} disabled={uploadingEventImages}/>
              </label>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:'8px'}}>
                {eventImages.map((url,i)=>(
                  <div key={i} style={{position:'relative',aspectRatio:'16/9',borderRadius:'10px',overflow:'hidden'}}>
                    <img src={typeof url==='string'?url:url?.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    <button onClick={()=>handleRemoveEventImage(i)} style={{position:'absolute',top:'4px',right:'4px',width:'22px',height:'22px',borderRadius:'6px',background:'rgba(0,0,0,0.6)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={11} color="white"/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── TemplatesModal ───────────────────────────────────────────────────────────
function TemplatesModal({ onClose, onApply }) {
  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={onClose}>
      <motion.div initial={{opacity:0,scale:0.95,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} transition={{duration:0.2}}
        style={{background:'#0a0817',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px',width:'100%',maxWidth:'580px',maxHeight:'82vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 32px 80px rgba(0,0,0,0.8)'}}
        onClick={e=>e.stopPropagation()}>
        <div style={{padding:'22px 24px 14px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h2 style={{color:'white',fontSize:'18px',fontWeight:800,margin:0}}>Templates</h2>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:'12px',margin:'3px 0 0'}}>Configurez votre profil en un seul clic</p>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.07)',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.6)',width:'34px',height:'34px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={16}/></button>
        </div>
        <div style={{overflowY:'auto',padding:'16px 24px 24px',display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'12px'}}>
          {PROFILE_TEMPLATES.map(t=>{
            const [c1,c2]=t.theme_color.split('|');
            return(
              <button key={t.id} onClick={()=>onApply(t)} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'18px',padding:'16px',textAlign:'left',cursor:'pointer',transition:'all 0.15s'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                  <div style={{width:'44px',height:'44px',borderRadius:'13px',background:'linear-gradient(135deg,'+c1+','+c2+')',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>{t.emoji}</div>
                  <div>
                    <p style={{color:'white',fontWeight:800,fontSize:'14px',margin:0}}>{t.label}</p>
                    <p style={{color:'rgba(255,255,255,0.35)',fontSize:'10px',margin:0}}>{t.platformKeys.length} plateformes</p>
                  </div>
                </div>
                <p style={{color:'rgba(255,255,255,0.4)',fontSize:'10px',margin:0}}>{t.desc}</p>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const queryClient = useQueryClient();
  const { signOut, user, isAdmin } = useAuth();
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;
  const { t } = useTranslation();

  const [activeSection,    setActiveSection]    = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showAddDialog,    setShowAddDialog]    = useState(false);
  const [showPreview,      setShowPreview]      = useState(false);
  const [localProfile,     setLocalProfile]     = useState(null);
  const [hasChanges,       setHasChanges]       = useState(false);
  const [activeProfileId,  setActiveProfileId]  = useState(null);
  const [showTemplates,    setShowTemplates]    = useState(false);
  const [showNotifPanel,   setShowNotifPanel]   = useState(false);
  const notifPanelRef  = useRef(null);
  const notifCountRef  = useRef(0);
  const notifThreshold = (() => { try { return parseInt(localStorage.getItem('notif_threshold') || '10'); } catch { return 10; } })();

  const { data: profiles = [], isLoading } = useQuery({ queryKey: ['linkProfiles'], queryFn: db.list });

  useEffect(() => { setSidebarCollapsed(isMobile); }, [isMobile]);

  useEffect(() => {
    if (!profiles.length) return;
    const target = profiles.find(p => p.id === activeProfileId) || profiles[0];
    setLocalProfile(prev => (!prev || prev.id !== target.id) ? target : prev);
    setActiveProfileId(prev => prev || target.id);
  }, [profiles, activeProfileId]);

  useEffect(() => {
    if (!localProfile) return;
    const html = document.documentElement;
    const colors = parseColors(localProfile.theme_color);
    if (localProfile.bg_image_url) {
      html.style.backgroundImage = 'url(' + localProfile.bg_image_url + ')';
      html.style.backgroundSize = 'cover'; html.style.backgroundPosition = 'center'; html.style.backgroundAttachment = 'fixed'; html.style.background = '';
    } else {
      html.style.backgroundImage = 'none';
      html.style.background = 'linear-gradient(135deg,' + colors.bg1 + ' 0%,' + colors.bg2 + ' 100%)';
    }
    return () => { ['backgroundImage','backgroundSize','backgroundPosition','backgroundAttachment','background'].forEach(k => { html.style[k] = ''; }); };
  }, [localProfile?.theme_color, localProfile?.bg_image_url]);

  useEffect(() => {
    const handler = (e) => { if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) setShowNotifPanel(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!localProfile?.id || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const channel = supabase.channel('notif-' + localProfile.id)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'profile_stats', filter:'profile_id=eq.'+localProfile.id }, (payload) => {
        if (payload.new?.event_type === 'view') {
          notifCountRef.current += 1;
          if (notifCountRef.current >= notifThreshold) {
            new Notification('🔔 SocialApp — ' + (localProfile.display_name || 'Votre profil'), { body: notifCountRef.current + ' nouvelles visites !', icon: '/Logo_SocialApp.png' });
            notifCountRef.current = 0;
          }
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [localProfile?.id, notifThreshold]);

  const deleteMutation = useMutation({
    mutationFn: id => db.delete(id),
    onSuccess: (_, deletedId) => { queryClient.invalidateQueries({ queryKey: ['linkProfiles'] }); setActiveProfileId(prev => prev === deletedId ? null : prev); setLocalProfile(null); toast.success('Profil supprimé !'); },
  });

  const createMutation = useMutation({
    mutationFn: data => db.create(data),
    onSuccess: (created) => { queryClient.invalidateQueries({ queryKey: ['linkProfiles'] }); setActiveProfileId(created.id); setLocalProfile(created); setHasChanges(false); toast.success('Profil créé !'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.update(id, data),
    onSuccess: () => { setHasChanges(false); queryClient.invalidateQueries({ queryKey: ['linkProfiles'] }); toast.success('Modifications sauvegardées !'); },
    onError: (error) => toast.error('Erreur : ' + error.message),
  });

  const handleCreateProfile = () => {
    if (!user?.id) { toast.error('Utilisateur non connecté'); return; }
    const expiry = new Date(); expiry.setFullYear(expiry.getFullYear() + 1);
    createMutation.mutate({ user_id: user.id, display_name: 'Profil ' + ((profiles.length || 0) + 1), bio: '', links: [], theme_color: '#6366f1', expiry_date: expiry.toISOString().split('T')[0], is_verified: false, is_event: false });
  };

  const handleSwitchProfile = useCallback((p) => {
    if (hasChanges && !window.confirm('Des modifications non sauvegardées seront perdues. Continuer ?')) return;
    setActiveProfileId(p.id); setLocalProfile(p); setHasChanges(false);
  }, [hasChanges]);

  const handleDeleteProfile = useCallback((p) => {
    if (!window.confirm('Supprimer le profil "' + p.display_name + '" ?')) return;
    deleteMutation.mutate(p.id);
  }, [deleteMutation]);

  const updateLocal = useCallback((updates) => { setLocalProfile(prev => ({ ...prev, ...updates })); setHasChanges(true); }, []);

  const applyTemplate = useCallback((template) => {
    const newLinks = template.platformKeys.map(key => ({ id: crypto.randomUUID(), platform: key, url: '', label: '', enabled: true }));
    updateLocal({ theme_color: template.theme_color, bio: template.bio, links: newLinks, is_event: template.is_event || false, event_color1: template.event_color1 || null, event_color2: template.event_color2 || null });
    setShowTemplates(false);
    toast.success('Template "' + template.label + '" appliqué !');
  }, [updateLocal]);

  const handleSave = () => {
    if (!localProfile || updateMutation.isPending || !hasChanges) return;
    const rawImages = localProfile.event_images || (localProfile.event_image_url ? [localProfile.event_image_url] : []);
    const eventImagesArray = rawImages.map(img => typeof img === 'string' ? img : img?.url).filter(Boolean);
    updateMutation.mutate({ id: localProfile.id, data: {
      display_name: localProfile.display_name, bio: localProfile.bio, links: localProfile.links,
      theme_color: localProfile.theme_color, expiry_date: localProfile.expiry_date,
      username: localProfile.username ? localProfile.username.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') : null,
      is_verified: localProfile.is_verified || false, is_event: localProfile.is_event || false,
      event_name: localProfile.event_name || null, event_date: localProfile.event_date || null,
      event_location: localProfile.event_location || null, event_color1: localProfile.event_color1 || null,
      event_color2: localProfile.event_color2 || null, event_booking_url: localProfile.event_booking_url || null,
      event_description: localProfile.event_description || null,
      event_images: eventImagesArray, event_image_url: eventImagesArray[0] || null,
      bg_image_url: localProfile.bg_image_url || null,
    }});
  };

  const handleSignOut = async () => {
    if (hasChanges && !window.confirm('Modifications non sauvegardées. Se déconnecter quand même ?')) return;
    await signOut();
  };

  if (isLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#040210' }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color:'#6366f1' }} />
    </div>
  );

  if (!profiles.length && !createMutation.isPending) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#040210', padding:'24px' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', maxWidth:'360px' }}>
        <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width:'80px', height:'80px', borderRadius:'24px', objectFit:'cover', margin:'0 auto 24px', display:'block' }} />
        <h1 style={{ color:'white', fontSize:'24px', fontWeight:800, margin:'0 0 8px' }}>Bienvenue !</h1>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'14px', margin:'0 0 24px' }}>Créez votre page de liens unique et partagez-la via un seul QR code.</p>
        <Button onClick={handleCreateProfile} size="lg" className="rounded-xl gap-2"><Plus className="w-4 h-4"/> Créer mon profil</Button>
      </motion.div>
    </div>
  );

  if (!localProfile) return null;

  const notifGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
  const currentNav = SIDEBAR_NAV.find(n => n.id === activeSection);

  // ── renderSection : tous les cas couverts, pas de variable undefined ────────
  const renderSection = () => {
    switch (activeSection) {
      case 'overview':        return <OverviewPanel profile={localProfile} onNavigate={setActiveSection} onUpdate={updateLocal} onSave={handleSave} hasChanges={hasChanges} saving={updateMutation.isPending}/>;
      case 'realtime':        return <RealtimePanel profileId={localProfile.id}/>;
      case 'analytics':       return <AnalyticsPanel profileId={localProfile.id}/>;
      case 'leads':           return <LeadsCRMPanel profileId={localProfile.id}/>;
      case 'whatsapp-crm':    return <WhatsappCRMPanel profileId={localProfile.id}/>;
      case 'automations':     return <AutomationsPanel profileId={localProfile.id}/>;
      case 'integrations':    return <IntegrationsPanel profileId={localProfile.id}/>;
      // modules optionnels — affiche ComingSoon si non disponibles
      case 'boost':           return BoostPanel ? <BoostPanel profileId={localProfile.id} profile={localProfile}/> : <ComingSoon label="Boost"/>;
      case 'meta':            return MetaIntegrationPanel ? <MetaIntegrationPanel profile={localProfile}/> : <ComingSoon label="Connexion Meta"/>;
      case 'boost-analytics': return BoostAnalyticsPanel ? <BoostAnalyticsPanel profile={localProfile}/> : <ComingSoon label="Analytics Boost"/>;
      case 'promotions': return ( <PromotionsDashboard profile={localProfile} isAdmin={isAdmin} onUpdateProfile={updateLocal} /> );
      case 'profiles':        return <ProfilesPanel profiles={profiles} activeProfileId={activeProfileId} onSwitch={handleSwitchProfile} onCreate={handleCreateProfile} onDelete={handleDeleteProfile}/>;
      case 'platforms':       return <PlatformsPanel localProfile={localProfile} updateLocal={updateLocal} showAddDialog={showAddDialog} setShowAddDialog={setShowAddDialog}/>;
      case 'event':           return <EventPanel localProfile={localProfile} updateLocal={updateLocal}/>;
      case 'eventmanager':    return <EventManager profileId={localProfile.id}/>;
      case 'marketplace':     return <div style={{ maxWidth:'640px' }}><MarketplacePanel profileId={localProfile.id} userPlan="admin"/></div>;
      case 'documents':       return <div style={{ maxWidth:'640px' }}><DocumentsPanel profileId={localProfile.id} userPlan={localProfile.plan||'admin'}/></div>;
      case 'forms': return <div style={{ maxWidth:'1100px' }}><AdminFormsPanel profileId={localProfile.id} /></div>;
      case 'accounts':        return <UserActivationPanel/>;
      case 'settings':        return <UserSettingsPanel/>;
      default:                return null;
    }
  };

  return (
   <div style={{ height:'100dvh', minHeight:'100dvh', display:'flex', position:'relative', overflowX:'hidden', background:'#040210' }}>
      <div style={{ position:'relative', zIndex:10, flexShrink:0, width:isMobile?0:undefined }}>
        <Sidebar activeSection={activeSection} onNavigate={setActiveSection} profiles={profiles} activeProfileId={activeProfileId} collapsed={sidebarCollapsed} onToggle={()=>setSidebarCollapsed(v=>!v)} isMobile={isMobile}/>
      </div>

      <div style={{ flex:1, height:'100dvh', display:'flex', flexDirection:'column', minWidth:0, position:'relative', zIndex:1, overflowX:'hidden', overflowY:'hidden' }}>
        {/* Top bar */}
        <div style={{ flexShrink:0, position:'sticky', top:0, zIndex:15, background:'rgba(4,2,16,0.7)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:isMobile?'10px 14px':'10px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {isMobile && <img src="/Logo_SocialApp.png" alt="" style={{ width:'28px', height:'28px', borderRadius:'8px', objectFit:'cover', flexShrink:0 }}/>}
            <h2 style={{ color:'white', fontSize:'14px', fontWeight:700, margin:0 }}>{currentNav?.label || 'Dashboard'}</h2>
            {hasChanges && <span style={{ background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.3)', borderRadius:'6px', padding:'2px 8px', fontSize:'10px', color:'#fbbf24', fontWeight:600 }}>{t('unsaved')}</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <ThemeColorPicker profile={localProfile} onUpdate={updateLocal}/>
            <button onClick={()=>setShowPreview(true)} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'9px', color:'rgba(255,255,255,0.7)', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
              <Eye size={13}/>{!isMobile && t('preview')}
            </button>
            <div ref={notifPanelRef} style={{ position:'relative' }}>
              <button onClick={()=>setShowNotifPanel(v=>!v)} style={{ width:'34px', height:'34px', display:'flex', alignItems:'center', justifyContent:'center', background:notifGranted?'rgba(34,197,94,0.1)':'rgba(255,255,255,0.07)', border:'1px solid '+(notifGranted?'rgba(34,197,94,0.3)':'rgba(255,255,255,0.12)'), borderRadius:'9px', cursor:'pointer' }}>
                {notifGranted ? <Bell size={14} color="#22c55e"/> : <BellOff size={14} color="rgba(255,255,255,0.5)"/>}
              </button>
              <AnimatePresence>
                {showNotifPanel && (
                  <motion.div initial={{ opacity:0, y:-8, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.15 }}
                    style={{ position:'absolute', top:'calc(100% + 10px)', right:0, background:'rgba(10,8,25,0.97)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'18px', padding:'18px', minWidth:'260px', zIndex:50, boxShadow:'0 16px 48px rgba(0,0,0,0.6)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                      <span style={{ color:'white', fontSize:'13px', fontWeight:600 }}>Notifications push</span>
                      <button onClick={()=>setShowNotifPanel(false)} style={{ background:'rgba(255,255,255,0.08)', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', width:'24px', height:'24px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={13}/></button>
                    </div>
                    {!notifGranted
                      ? <button onClick={async()=>{ const p=await Notification.requestPermission(); if(p==='granted'){ toast.success('Notifications activées !'); setShowNotifPanel(false); }}} style={{ width:'100%', padding:'10px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:'10px', color:'white', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>🔔 Activer les notifications</button>
                      : <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', margin:0, textAlign:'center' }}>✅ Notifications actives</p>
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', background:hasChanges?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.07)', border:'1px solid '+(hasChanges?'transparent':'rgba(255,255,255,0.12)'), borderRadius:'9px', color:hasChanges?'white':'rgba(255,255,255,0.4)', fontSize:'11px', fontWeight:600, cursor:hasChanges?'pointer':'default', opacity:updateMutation.isPending?0.7:1 }}>
              {updateMutation.isPending ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}{!isMobile && t('save')}
            </button>
            <button onClick={handleSignOut} style={{ width:'34px', height:'34px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'9px', cursor:'pointer' }} title={user?.email}>
              <LogOut size={14} color="rgba(255,255,255,0.5)"/>
            </button>
          </div>
        </div>

        {/* Zone scrollable */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:isMobile?'16px':'24px', paddingBottom:isMobile?'100px':'24px' }}>
          <AnimatePresence>
            <motion.div key={activeSection} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.12 }}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {isMobile && <MobileNav activeSection={activeSection} onNavigate={setActiveSection} profile={localProfile}/>}
      {showPreview && <ProfilePreview profile={localProfile} onClose={()=>setShowPreview(false)}/>}
      <AnimatePresence>
        {showTemplates && <TemplatesModal onClose={()=>setShowTemplates(false)} onApply={applyTemplate}/>}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:0.3} }
        * { scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.1) transparent; }
        *::-webkit-scrollbar { width:5px; height:5px; }
        *::-webkit-scrollbar-track { background:transparent; }
        *::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:10px; }
      `}</style>
    </div>
  );
}