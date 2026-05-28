import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Plus, Save, Loader2, Lock, CheckCircle, AlertCircle, Crown,
  CalendarClock, LogOut, AtSign, Eye, CalendarDays, BadgeCheck,
  ImagePlus, X, ChevronLeft, ChevronRight, Video, BarChart2,
  Link2, ShoppingBag, FileText, Palette, MapPin, Users, Image,
} from "lucide-react";
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

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return width;
}

// ─── Plan limits ─────────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  basic: {
    maxLinks: 3,
    maxProfiles: 1,
    hasStats: false,
    maxMarketplace: 4,
    maxDocs: 1,
    hasEvent: false,
    hasRealtime: false,
    hasCRM: false,
    hasAutomations: false,
    hasIntegrations: false,
    hasAdvancedAnalytics: false,
    qrType: 'standard',
    colorCustom: 'basic',
    badge: false,
    label: 'BASIC',
    color: '#6366f1',
    emoji: '⚡',
    price: '10 000 FCFA',
  },
  pro: {
    maxLinks: 8,
    maxProfiles: 1,
    hasStats: true,
    maxMarketplace: 10,
    maxDocs: 3,
    hasEvent: true,
    hasRealtime: true,
    hasCRM: false,
    hasAutomations: false,
    hasIntegrations: 'partial',
    hasAdvancedAnalytics: false,
    qrType: 'premium',
    colorCustom: 'advanced',
    badge: true,
    label: 'PRO',
    color: '#ff8c00',
    emoji: '🚀',
    price: '15 000 FCFA',
  },
  business: {
    maxLinks: 17,
    maxProfiles: 1,
    hasStats: true,
    maxMarketplace: Infinity,
    maxDocs: 10,
    hasEvent: true,
    hasRealtime: true,
    hasCRM: true,
    hasAutomations: true,
    hasIntegrations: true,
    hasAdvancedAnalytics: true,
    qrType: 'dynamic',
    colorCustom: 'complete',
    badge: true,
    label: 'BUSINESS',
    color: '#f7c948',
    emoji: '💼',
    price: '25 000 FCFA',
  },
  événement: {
    maxLinks: 3,
    maxProfiles: 1,
    hasStats: false,
    maxMarketplace: 0,
    maxDocs: 0,
    hasEvent: true,
    hasRealtime: false,
    hasCRM: false,
    hasAutomations: false,
    hasIntegrations: false,
    hasAdvancedAnalytics: false,
    qrType: 'standard',
    colorCustom: 'basic',
    badge: false,
    label: 'ÉVÉNEMENT',
    color: '#22c55e',
    emoji: '🎉',
    price: '',
  },
};

// Plan order — importé depuis UserSidebar

// USER_NAV, USER_GROUPS, PLAN_ORDER — importés depuis UserSidebar

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isVideoUrl = (url) => /\.(mp4|webm|ogg|mov|avi|mkv|quicktime)$/i.test(url || '');

const parseColors = (themeColor) => {
  if (themeColor && themeColor.includes('|')) {
    const [bg1, bg2] = themeColor.split('|');
    return { bg1, bg2 };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

const MAX_SIZE_KB       = 2000;
const MAX_VIDEO_SIZE_KB = 51200;
const LINKS_PER_PAGE    = 10;

// ─── DB ───────────────────────────────────────────────────────────────────────
const db = {
  get: async (userId) => {
    const { data, error } = await supabase.from('link_profiles').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  create: async (data) => {
    const { data: created, error } = await supabase.from('link_profiles').insert([data]).select().single();
    if (error) throw error;
    return created;
  },
  update: async (id, data) => {
    const { data: updated, error } = await supabase.from('link_profiles').update(data).eq('id', id).select().single();
    if (error) throw error;
    return updated;
  },
};

// ─── Wave Modal ───────────────────────────────────────────────────────────────
function WaveModal({ onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#0f0a1e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '28px 24px', maxWidth: '360px', width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg,#0057FF,#0099FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(0,87,255,0.4)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>
        </div>
        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>🔓 Débloquer cette fonctionnalité</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
          Le <strong style={{ color: 'rgba(255,255,255,0.8)' }}>username personnalisé</strong> est une fonctionnalité premium.
        </p>
        <div style={{ background: 'rgba(0,87,255,0.1)', border: '1px solid rgba(0,87,255,0.3)', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '8px' }}>Envoyez votre paiement via <strong style={{ color: '#60a5fa' }}>Wave CI</strong> au numéro :</p>
          <p style={{ color: 'white', fontSize: '26px', fontWeight: 800, margin: '0 0 4px' }}>+225 05 76 03 12 12</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Montant : à définir selon votre offre</p>
        </div>
        <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px', background: '#25D366', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 700, textDecoration: 'none', marginBottom: '10px' }}>
          WhatsApp — Envoyer la preuve
        </a>
        <button type="button" onClick={onClose}
          style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Locked Feature Panel ─────────────────────────────────────────────────────
function LockedFeaturePanel({ requiredPlan, featureName, icon: Icon }) {
  const isPro = requiredPlan === 'pro';
  const color = isPro ? '#ff8c00' : '#f7c948';
  const emoji = isPro ? '🚀' : '💼';
  const planLabel = isPro ? 'PRO' : 'BUSINESS';
  const price = isPro ? '15 000 FCFA / an' : '25 000 FCFA / an';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '360px', gap: '20px', textAlign: 'center', padding: '40px 32px' }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: color + '18', border: '1px solid ' + color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          {Icon && <Icon size={32} color={color + '99'} />}
        </div>
        <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.9)', border: '2px solid ' + color + '66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
          🔒
        </div>
      </div>

      <div>
        <p style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>{featureName}</p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: '0 0 6px', lineHeight: 1.5 }}>
          Cette fonctionnalité est disponible à partir de l'offre
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: color + '18', border: '1px solid ' + color + '44', borderRadius: '100px', padding: '5px 14px', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px' }}>{emoji}</span>
          <span style={{ color, fontSize: '13px', fontWeight: 700 }}>{planLabel}</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: '6px 0 0' }}>{price}</p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 20px', maxWidth: '320px', width: '100%' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
          {emoji} Inclus dans l'offre {planLabel}
        </p>
        {isPro ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {['8 liens sociaux', 'QR Code Premium', 'Analytics & Temps réel', 'Mode Événement', '10 produits Marketplace', '3 PDFs'].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                <CheckCircle size={12} color={color} /> {f}
              </li>
            ))}
          </ul>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {['17 liens sociaux', 'QR Code dynamique', 'Analytics avancés complets', 'CRM & Leads', 'Automatisations', 'Toutes les intégrations', 'Marketplace illimitée', 'Support VIP'].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                <CheckCircle size={12} color={color} /> {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,' + color + ',' + color + 'aa)', borderRadius: '14px', padding: '12px 28px', color: 'white', fontSize: '14px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px ' + color + '33' }}>
        <Crown size={15} /> Passer en {planLabel} — {price}
      </a>
    </motion.div>
  );
}

// ─── Event Media Carousel ─────────────────────────────────────────────────────
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

  const goTo = (idx) => {
    clearInterval(intervalRef.current);
    setCurrent(idx);
    if (!isVideoUrl(urls[idx]))
      intervalRef.current = setInterval(() => setCurrent(p => (p + 1) % urls.length), 3500);
  };

  if (!urls.length) return null;
  return (
    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
      <AnimatePresence mode="wait">
        {isVid
          ? <motion.video key={current} src={currentUrl} controls muted loop playsInline initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
          : <motion.img key={current} src={currentUrl} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
        }
      </AnimatePresence>
      {isVid && <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(99,102,241,0.85)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', color: 'white', fontWeight: 700 }}>▶ Vidéo</div>}
      {urls.length > 1 && <div style={{ position: 'absolute', top: '8px', right: adminMode ? '44px' : '8px', background: 'rgba(0,0,0,0.55)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', color: 'white', fontWeight: 600 }}>{current + 1}/{urls.length}</div>}
      {adminMode && onRemove && (
        <button type="button" onClick={() => onRemove(current)} style={{ position: 'absolute', top: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={13} color="white" />
        </button>
      )}
      {urls.length > 1 && (
        <>
          <button type="button" onClick={() => goTo((current - 1 + urls.length) % urls.length)} style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={15} color="white" /></button>
          <button type="button" onClick={() => goTo((current + 1) % urls.length)} style={{ position: 'absolute', right: adminMode ? '40px' : '6px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronRight size={15} color="white" /></button>
        </>
      )}
      {urls.length > 1 && (
        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
          {urls.map((u, i) => (
            <button key={i} type="button" onClick={() => goTo(i)} style={{ width: i === current ? '16px' : '5px', height: '5px', borderRadius: '3px', background: isVideoUrl(u) ? (i === current ? '#a5b4fc' : 'rgba(165,180,252,0.4)') : (i === current ? 'white' : 'rgba(255,255,255,0.4)'), border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MiniStat ─────────────────────────────────────────────────────────────────
function MiniStat({ label, value, icon: Icon, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 500 }}>{label}</span>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={color} />
        </div>
      </div>
      <span style={{ color: 'white', fontSize: '22px', fontWeight: 800, lineHeight: 1 }}>{value}</span>
    </div>
  );
}

// ─── Overview panel ───────────────────────────────────────────────────────────
function OverviewPanel({ profile, limits, isActivated, onNavigate, onUpdate, onSave, hasChanges, saving, plan }) {
  const isMob = useWindowWidth() < 768;
  const links = profile?.links || [];

  const quickActions = [
    { label: 'Plateformes',  icon: Link2,       color: '#0ea5e9', section: 'platforms',   desc: links.length + ' lien(s)', locked: false },
    { label: 'Événement',    icon: CalendarDays, color: '#f59e0b', section: 'event',       desc: limits.hasEvent ? (profile?.is_event ? 'Activé' : 'Désactivé') : 'PRO requis', locked: !limits.hasEvent },
    { label: 'Analytics',    icon: BarChart2,    color: '#a78bfa', section: 'analytics',   desc: limits.hasStats ? 'Actifs' : 'PRO requis', locked: !limits.hasStats },
    { label: 'Marketplace',  icon: ShoppingBag,  color: '#22c55e', section: 'marketplace', desc: (limits.maxMarketplace === Infinity ? '∞' : limits.maxMarketplace) + ' produits max', locked: false },
    { label: 'CRM',          icon: Users,        color: '#ec4899', section: 'crm',         desc: limits.hasCRM ? 'Actif' : 'BUSINESS requis', locked: !limits.hasCRM },
    { label: 'Documents',    icon: FileText,     color: '#64748b', section: 'documents',   desc: limits.maxDocs + ' doc(s) max', locked: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: 0 }}>Dashboard</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: '4px 0 0' }}>Bienvenue sur votre espace SocialApp</p>
      </div>

      {!isActivated && (
        <div style={{ background: 'rgba(0,87,255,0.1)', border: '1px solid rgba(0,87,255,0.3)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <AlertCircle size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ color: '#93c5fd', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>Compte en attente d'activation</p>
            <p style={{ color: 'rgba(147,197,253,0.6)', fontSize: '11px', margin: 0 }}>Certaines fonctionnalités sont verrouillées. Contactez le support pour activer votre compte.</p>
          </div>
          <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: 'auto', background: '#25D366', borderRadius: '8px', padding: '6px 12px', color: 'white', fontSize: '11px', fontWeight: 700, textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
            WhatsApp →
          </a>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr' : 'repeat(3,1fr)', gap: '16px', alignItems: 'start' }}>

        {/* Profil card */}
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', overflow: 'hidden' }}>
          <ProfileHeader profile={profile} onUpdate={onUpdate} />
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AtSign size={13} color="rgba(255,255,255,0.4)" />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', flexShrink: 0 }}>@</span>
            {isActivated
              ? <input type="text" value={profile?.username || ''} onChange={e => onUpdate({ username: e.target.value })} placeholder="username" style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '12px', outline: 'none', flex: 1, minWidth: 0 }} />
              : <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '5px 10px', border: '1px dashed rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.6 }}>
                  <Lock size={11} color="rgba(255,255,255,0.4)" />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>{profile?.username || 'verrouillé'}</span>
                </div>
                <span style={{ background: 'rgba(0,87,255,0.2)', border: '1px solid rgba(0,87,255,0.4)', borderRadius: '6px', padding: '3px 7px', fontSize: '9px', color: '#60a5fa', fontWeight: 700, flexShrink: 0 }}>Pro</span>
              </div>
            }
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BadgeCheck size={13} color="rgba(255,255,255,0.4)" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Badge vérifié</span>
              {!limits.badge && <span style={{ background: 'rgba(255,140,0,0.15)', border: '1px solid rgba(255,140,0,0.3)', borderRadius: '5px', padding: '1px 5px', fontSize: '9px', color: '#ff8c00', fontWeight: 700 }}>PRO</span>}
            </div>
            <button onClick={() => limits.badge && onUpdate({ is_verified: !profile?.is_verified })}
              style={{ width: '38px', height: '20px', borderRadius: '100px', background: profile?.is_verified ? '#22c55e' : 'rgba(255,255,255,0.1)', border: 'none', cursor: limits.badge ? 'pointer' : 'not-allowed', position: 'relative', transition: 'background 0.3s', flexShrink: 0, opacity: limits.badge ? 1 : 0.4 }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: profile?.is_verified ? '21px' : '3px', transition: 'left 0.3s' }} />
            </button>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarClock size={13} color="rgba(255,255,255,0.4)" />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', flexShrink: 0 }}>Exp. :</span>
            <span style={{ color: 'white', fontSize: '12px' }}>{profile?.expiry_date ? new Date(profile.expiry_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</span>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: isActivated ? 'rgba(34,197,94,0.2)' : 'rgba(0,87,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {isActivated ? <CheckCircle size={13} color="#22c55e" /> : <Lock size={13} color="#60a5fa" />}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{isActivated ? '✅ Compte activé' : '⏳ En attente d\'activation'}</span>
          </div>
          {hasChanges && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 14px' }}>
              <button onClick={onSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Sauvegarder
              </button>
            </div>
          )}
        </div>

        <div><QRCodeDisplay profileId={profile?.id} username={profile?.username} /></div>

        <div>
          {limits.hasStats
            ? <StatsCard profileId={profile?.id} />
            : <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '24px 16px', textAlign: 'center' }}>
              <BarChart2 size={28} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 10px' }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600, margin: '0 0 4px' }}>Statistiques</p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: '0 0 6px' }}>Disponible avec l'offre PRO</p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: '0 0 14px' }}>15 000 FCFA / an</p>
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,140,0,0.15)', border: '1px solid rgba(255,140,0,0.3)', borderRadius: '10px', padding: '7px 14px', color: '#ff8c00', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                <Crown size={12} /> Upgrader → PRO
              </a>
            </div>
          }
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr 1fr' : 'repeat(3,1fr)', gap: '10px' }}>
        {quickActions.map(a => (
          <button key={a.section} onClick={() => onNavigate(a.section)}
            style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', background: a.locked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (a.locked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'), borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', opacity: a.locked ? 0.55 : 1 }}
            onMouseEnter={e => { if (!a.locked) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = a.locked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: a.color + '22', border: '1px solid ' + a.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {a.locked ? <Lock size={15} color="rgba(255,255,255,0.25)" /> : <a.icon size={16} color={a.color} />}
              </div>
              {a.locked && (
                <span style={{ background: 'rgba(255,140,0,0.12)', border: '1px solid rgba(255,140,0,0.3)', borderRadius: '5px', padding: '2px 6px', fontSize: '8.5px', color: '#ff8c00', fontWeight: 700 }}>
                  {a.desc.includes('BUSINESS') ? '💼 BIZ' : '🚀 PRO'}
                </span>
              )}
            </div>
            <div>
              <p style={{ color: 'white', fontSize: '12px', fontWeight: 700, margin: '0 0 2px' }}>{a.label}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>{a.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Platforms panel ──────────────────────────────────────────────────────────
function PlatformsPanel({ localProfile, updateLocal, limits, showAddDialog, setShowAddDialog }) {
  const links = localProfile?.links || [];
  const atLimit = links.length >= limits.maxLinks;

  const handleUpdateLink = useCallback((index, updated) => {
    const l = [...(localProfile?.links || [])]; l[index] = updated;
    updateLocal({ links: l });
  }, [localProfile, updateLocal]);

  const handleRemoveLink = useCallback((index) => {
    const l = (localProfile?.links || []).filter((_, i) => i !== index);
    updateLocal({ links: l });
  }, [localProfile, updateLocal]);

  const handleAddPlatform = (key) => {
    if (atLimit) { toast.error(`Limite atteinte — offre ${limits.label} : ${limits.maxLinks} liens max`); return; }
    updateLocal({ links: [...links, { id: crypto.randomUUID(), platform: key, url: '', label: '', enabled: true }] });
    setShowAddDialog(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Mes plateformes</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>{links.length} / {limits.maxLinks} liens utilisés</p>
        </div>
        <button onClick={() => setShowAddDialog(true)} disabled={atLimit}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: atLimit ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: atLimit ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '12px', fontWeight: 600, cursor: atLimit ? 'not-allowed' : 'pointer' }}>
          <Plus size={13} /> Ajouter
        </button>
      </div>

      <div style={{ background: atLimit ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (atLimit ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)'), borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {atLimit ? <AlertCircle size={13} color="#f87171" /> : <Crown size={13} color="rgba(255,255,255,0.3)" />}
        <span style={{ fontSize: '12px', color: atLimit ? '#f87171' : 'rgba(255,255,255,0.45)' }}>
          {atLimit
            ? `Limite atteinte — ${limits.maxLinks} liens max pour l'offre ${limits.label}`
            : `${links.length} / ${limits.maxLinks} liens utilisés`
          }
        </span>
        {atLimit && <a href="/" style={{ marginLeft: 'auto', fontSize: '11px', color: '#ff8c00', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Upgrader →</a>}
      </div>

      {links.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.12)', borderRadius: '18px', padding: '48px 24px', textAlign: 'center' }}>
          <Link2 size={28} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 10px' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 4px' }}>Aucune plateforme configurée</p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', margin: 0 }}>Cliquez sur Ajouter pour commencer</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '10px' }}>
          {links.map((link, i) => (
            <PlatformCard key={link.id || i} link={link} index={i}
              onUpdate={u => handleUpdateLink(i, u)}
              onRemove={() => handleRemoveLink(i)} />
          ))}
        </div>
      )}
      <AddPlatformDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSelect={handleAddPlatform} existingPlatforms={links.map(l => l.platform)} />
    </div>
  );
}

// ─── Event panel ──────────────────────────────────────────────────────────────
function EventPanel({ localProfile, updateLocal, isActivated }) {
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [thumbIndex, setThumbIndex] = useState(0);
  const eventMedias = Array.isArray(localProfile.event_images) ? localProfile.event_images : localProfile.event_image_url ? [localProfile.event_image_url] : [];
  const videoCount = eventMedias.filter(u => isVideoUrl(typeof u === 'string' ? u : u?.url)).length;
  const imgCount = eventMedias.length - videoCount;

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    for (const file of files) {
      const isVid = file.type.startsWith('video/');
      if (file.size / 1024 > (isVid ? MAX_VIDEO_SIZE_KB : MAX_SIZE_KB)) {
        toast.error(`${file.name} dépasse ${isVid ? '50 Mo' : '2 Mo'}`); e.target.value = ''; return;
      }
    }
    setUploadingMedia(true);
    try {
      const urls = await Promise.all(files.map(async file => {
        const ext = file.name.split('.').pop();
        const pre = file.type.startsWith('video/') ? 'event-video' : 'event-img';
        const name = `${pre}-${localProfile.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('avatars').upload(name, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('avatars').getPublicUrl(name);
        return data.publicUrl;
      }));
      const merged = [...eventMedias, ...urls];
      updateLocal({ event_images: merged, event_image_url: merged[0] });
      toast.success(urls.length + ' fichier(s) ajouté(s) !');
    } catch (err) { toast.error('Erreur : ' + err.message); }
    finally { setUploadingMedia(false); e.target.value = ''; }
  };

  const handleRemoveMedia = (idx) => {
    const updated = eventMedias.filter((_, i) => i !== idx);
    updateLocal({ event_images: updated, event_image_url: updated[0] || null });
    setThumbIndex(prev => Math.min(prev, Math.max(0, updated.length - 1)));
  };

  const EVENT_COLOR_PRESETS = [
    { c1: '#ff6b35', c2: '#f7c948' }, { c1: '#0ea5e9', c2: '#6366f1' },
    { c1: '#10b981', c2: '#065f46' }, { c1: '#ec4899', c2: '#8b5cf6' },
    { c1: '#1e1b4b', c2: '#312e81' }, { c1: '#ef4444', c2: '#b91c1c' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '680px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Mode Événement</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>Ajoutez des images ou vidéos de votre événement</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: localProfile.is_event ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>{localProfile.is_event ? 'Activé' : 'Désactivé'}</span>
          <button onClick={() => updateLocal({ is_event: !localProfile.is_event })} style={{ width: '44px', height: '24px', borderRadius: '100px', background: localProfile.is_event ? 'linear-gradient(135deg,#ff6b35,#f7c948)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: localProfile.is_event ? '23px' : '3px', transition: 'left 0.3s' }} />
          </button>
        </div>
      </div>

      {localProfile.is_event && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isActivated ? (
              <>
                <input type="text" value={localProfile.event_name || ''} onChange={e => updateLocal({ event_name: e.target.value })} placeholder="Nom de l'événement" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '13px', outline: 'none' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="datetime-local" value={localProfile.event_date || ''} onChange={e => updateLocal({ event_date: e.target.value })} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '13px', outline: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px' }}>
                    <MapPin size={14} color="rgba(255,255,255,0.3)" />
                    <input type="text" value={localProfile.event_location || ''} onChange={e => updateLocal({ event_location: e.target.value })} placeholder="Lieu" style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '13px', outline: 'none', flex: 1 }} />
                  </div>
                </div>
                <textarea value={localProfile.event_description || ''} onChange={e => updateLocal({ event_description: e.target.value })} placeholder="Description…" rows={3} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '13px', outline: 'none', resize: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px' }}>
                  <span style={{ fontSize: '14px' }}>🎟️</span>
                  <input type="url" value={localProfile.event_booking_url || ''} onChange={e => updateLocal({ event_booking_url: e.target.value })} placeholder="Lien réservation" style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '13px', outline: 'none', flex: 1 }} />
                </div>
              </>
            ) : (
              <>
                {["Nom de l'événement", "Date & heure", "Lieu", "Description / programme", "Lien de réservation"].map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '10px 12px', border: '1px dashed rgba(255,255,255,0.1)', opacity: 0.55 }}>
                    <Lock size={12} color="rgba(255,255,255,0.3)" />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{label}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,87,255,0.08)', border: '1px solid rgba(0,87,255,0.2)', borderRadius: '10px', padding: '8px 12px' }}>
                  <Lock size={12} color="#60a5fa" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#93c5fd', fontSize: '11px' }}>Ces champs seront accessibles après activation de votre compte.</span>
                </div>
              </>
            )}
          </div>

          {isActivated && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Palette size={14} color="rgba(255,255,255,0.4)" /><span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>Couleurs</span></div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {EVENT_COLOR_PRESETS.map((p, i) => (
                  <button key={i} onClick={() => updateLocal({ event_color1: p.c1, event_color2: p.c2 })} style={{ width: '32px', height: '32px', borderRadius: '9px', background: `linear-gradient(135deg,${p.c1},${p.c2})`, border: localProfile.event_color1 === p.c1 ? '3px solid white' : '3px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
                ))}
              </div>
            </div>
          )}

          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '18px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImagePlus size={14} color="rgba(255,255,255,0.5)" />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>Médias</span>
                {imgCount > 0 && <span style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '6px', padding: '1px 6px', fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>🖼 {imgCount}</span>}
                {videoCount > 0 && <span style={{ background: 'rgba(99,102,241,0.3)', borderRadius: '6px', padding: '1px 6px', fontSize: '10px', color: '#a5b4fc', fontWeight: 600 }}>▶ {videoCount}</span>}
                <span style={{ color: '#a5b4fc', fontSize: '10px', fontWeight: 600 }}>— sans activation</span>
              </div>
              {eventMedias.length > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', color: 'rgba(180,170,255,0.9)', fontSize: '12px', fontWeight: 600 }}>
                  {uploadingMedia ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Ajouter
                  <input type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/mov,video/quicktime" multiple className="hidden" onChange={handleMediaUpload} disabled={uploadingMedia} />
                </label>
              )}
            </div>
            {eventMedias.length > 0 ? (
              <>
                <EventMediaCarousel medias={eventMedias} onRemove={handleRemoveMedia} adminMode />
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {eventMedias.map((m, i) => {
                    const url = typeof m === 'string' ? m : m?.url;
                    return (
                      <div key={i} onClick={() => setThumbIndex(i)} style={{ width: '46px', height: '36px', borderRadius: '7px', overflow: 'hidden', border: i === thumbIndex ? '2px solid white' : '2px solid transparent', cursor: 'pointer', flexShrink: 0, background: '#000' }}>
                        {isVideoUrl(url) ? (
                          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(99,102,241,0.35)', gap: '1px' }}>
                            <span style={{ fontSize: '10px', color: 'white' }}>▶</span>
                            <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>vidéo</span>
                          </div>
                        ) : <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '14px', padding: '28px', cursor: 'pointer' }}>
                {uploadingMedia ? <Loader2 size={20} color="rgba(99,102,241,0.8)" className="animate-spin" /> : (
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <ImagePlus size={15} color="rgba(255,255,255,0.4)" />
                    <Video size={15} color="rgba(99,102,241,0.7)" />
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>{uploadingMedia ? 'Upload en cours...' : 'Images ou vidéos'}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>Images &lt; 2 Mo · Vidéos &lt; 50 Mo</p>
                </div>
                <input type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/mov,video/quicktime" multiple className="hidden" onChange={handleMediaUpload} disabled={uploadingMedia} />
              </label>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main UserDashboard ───────────────────────────────────────────────────────
export default function UserDashboard() {
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showWaveModal, setShowWaveModal] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [localProfile, setLocalProfile] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const rawPlan   = (localProfile?.plan || user?.user_metadata?.plan || 'basic').toLowerCase().trim();
  const limits    = PLAN_LIMITS[rawPlan] || PLAN_LIMITS.basic;
  const isActivated = localProfile?.is_activated === true;

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['userProfiles', user?.id],
    queryFn: () => db.get(user.id),
    enabled: !!user?.id,
  });

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
    if (localProfile.bg_image_url) {
      Object.assign(html.style, { backgroundImage: `url(${localProfile.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' });
    } else {
      const { bg1, bg2 } = parseColors(localProfile.theme_color);
      html.style.backgroundImage = 'none';
      html.style.background = `linear-gradient(160deg,${bg1},${bg2})`;
    }
    return () => { ['backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'backgroundAttachment', 'background'].forEach(k => { html.style[k] = ''; }); };
  }, [localProfile]);

  const createMutation = useMutation({
    mutationFn: data => db.create(data),
    onSuccess: created => { queryClient.invalidateQueries({ queryKey: ['userProfiles', user?.id] }); setLocalProfile(created); setActiveProfileId(created.id); setHasChanges(false); toast.success('Profil créé !'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.update(id, data),
    onSuccess: updated => { setLocalProfile(updated); setHasChanges(false); queryClient.invalidateQueries({ queryKey: ['userProfiles', user?.id] }); toast.success('Modifications sauvegardées !'); },
    onError: e => toast.error('Erreur : ' + e.message),
  });

  const handleCreateProfile = () => {
    if (profiles.length >= limits.maxProfiles) { toast.error(`Limite atteinte — offre ${limits.label} : ${limits.maxProfiles} profil(s) max`); return; }
    const expiry = new Date(); expiry.setFullYear(expiry.getFullYear() + 1);
    createMutation.mutate({ user_id: user.id, display_name: 'Mon Profil ' + (profiles.length + 1), bio: '', links: [], theme_color: '#6366f1', expiry_date: expiry.toISOString().split('T')[0], is_verified: false, is_event: false, is_activated: false, plan: rawPlan });
  };

  const updateLocal = useCallback((updates) => { setLocalProfile(prev => ({ ...prev, ...updates })); setHasChanges(true); }, []);

  const handleSave = () => {
    if (!localProfile || updateMutation.isPending || !hasChanges) return;
    const sanitized = localProfile.username ? localProfile.username.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : null;
    const rawMedias = localProfile.event_images || (localProfile.event_image_url ? [localProfile.event_image_url] : []);
    const eventImagesArray = rawMedias.map(m => typeof m === 'string' ? m : m?.url).filter(Boolean);
    updateMutation.mutate({
      id: localProfile.id, data: {
        display_name: localProfile.display_name, bio: localProfile.bio, links: localProfile.links,
        theme_color: localProfile.theme_color, expiry_date: localProfile.expiry_date,
        ...(isActivated && sanitized ? { username: sanitized } : {}),
        is_verified: localProfile.is_verified || false, is_event: localProfile.is_event || false,
        event_name: localProfile.event_name || null, event_date: localProfile.event_date || null,
        event_location: localProfile.event_location || null, event_color1: localProfile.event_color1 || null,
        event_color2: localProfile.event_color2 || null, event_booking_url: localProfile.event_booking_url || null,
        event_description: localProfile.event_description || null,
        event_images: eventImagesArray, event_image_url: eventImagesArray[0] || null,
        bg_image_url: localProfile.bg_image_url || null,
      }
    });
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
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
    finally { setUploadingBg(false); e.target.value = ''; }
  };

  const handleSignOut = async () => {
    if (hasChanges && !window.confirm('Des modifications non sauvegardées seront perdues. Se déconnecter ?')) return;
    await signOut();
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#040210' }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6366f1' }} />
    </div>
  );

  if (!profiles.length && !createMutation.isPending) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0f0a1e,#2d1b69)', padding: '24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: '360px' }}>
        <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width: '80px', height: '80px', borderRadius: '24px', objectFit: 'cover', margin: '0 auto 24px', display: 'block' }} />
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, margin: '0 0 8px' }}>Bienvenue !</h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: limits.color + '20', border: '1px solid ' + limits.color + '40', borderRadius: '100px', padding: '4px 14px', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px' }}>{limits.emoji}</span>
          <span style={{ color: limits.color, fontSize: '12px', fontWeight: 700 }}>Offre {limits.label}</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 24px' }}>{limits.maxLinks} liens · {limits.maxMarketplace === Infinity ? '∞' : limits.maxMarketplace} produits · {limits.hasStats ? 'Stats incluses' : 'Sans stats'}</p>
        <Button onClick={handleCreateProfile} size="lg" className="rounded-xl gap-2" disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer mon profil
        </Button>
      </motion.div>
    </div>
  );

  if (!localProfile) return null;

  const currentNav = USER_NAV.find(n => n.id === activeSection);
  const atProfLimit = profiles.length >= limits.maxProfiles;
  const currentPlanOrder = PLAN_ORDER[rawPlan] ?? 0;

  const isCurrentSectionLocked = () => {
    const nav = USER_NAV.find(n => n.id === activeSection);
    if (!nav || !nav.locked) return false;
    return currentPlanOrder < (PLAN_ORDER[nav.locked] ?? 99);
  };

  const renderSection = () => {
    if (isCurrentSectionLocked()) {
      const nav = USER_NAV.find(n => n.id === activeSection);
      return (
        <LockedFeaturePanel
          requiredPlan={nav.locked}
          featureName={nav.label}
          icon={nav.icon}
        />
      );
    }

    switch (activeSection) {
      case 'overview':
        return <OverviewPanel profile={localProfile} limits={limits} isActivated={isActivated} onNavigate={setActiveSection} onUpdate={updateLocal} onSave={handleSave} hasChanges={hasChanges} saving={updateMutation.isPending} plan={rawPlan} />;
      case 'platforms': return <PlatformsPanel localProfile={localProfile} updateLocal={updateLocal} limits={limits} showAddDialog={showAddDialog} setShowAddDialog={setShowAddDialog} />;
      case 'event': return <EventPanel localProfile={localProfile} updateLocal={updateLocal} isActivated={isActivated} />;
      case 'marketplace': return <div style={{ maxWidth: '640px' }}><MarketplacePanel profileId={localProfile.id} maxProducts={limits.maxMarketplace === Infinity ? 9999 : limits.maxMarketplace} /></div>;
      case 'documents': return <div style={{ maxWidth: '640px' }}><DocumentsPanel profileId={localProfile.id} userPlan={rawPlan} /></div>;
      case 'analytics': return limits.hasStats ? <AnalyticsPanel profileId={localProfile.id} /> : null;
      case 'realtime': return limits.hasRealtime ? <RealtimePanel profileId={localProfile.id} /> : null;
      case 'crm': return limits.hasCRM ? <LeadsCRMPanel profileId={localProfile.id} /> : null;
      case 'automations': return <AutomationsPanel profileId={localProfile.id} /> ; null;
      case 'integrations':return <IntegrationsPanel profileId={localProfile.id} /> ; null;
      case 'settings': return <UserSettingsPanel profile={localProfile} onUpdate={updateLocal} onSave={handleSave} hasChanges={hasChanges} saving={updateMutation.isPending} isActivated={isActivated} limits={limits} profiles={profiles} activeProfileId={activeProfileId} onSwitchProfile={p => { setActiveProfileId(p.id); setLocalProfile(p); setHasChanges(false); }} onCreateProfile={handleCreateProfile} atProfileLimit={atProfLimit} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      {/* Sidebar */}
      <div style={{ position: 'relative', zIndex: 10, flexShrink: 0, width: isMobile ? 0 : undefined }}>
        <UserSidebar
          activeSection={activeSection}
          onNavigate={setActiveSection}
          profile={localProfile}
          plan={rawPlan}
          limits={limits}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
          isMobile={isMobile}
        />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1 }}>
        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(4,2,16,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: isMobile ? '10px 14px' : '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>

          {/* ── Gauche : logo + titre + badge plan ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            {isMobile && <img src="/Logo_SocialApp.png" alt="" style={{ width: '26px', height: '26px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} />}
            <h2 style={{ color: 'white', fontSize: '14px', fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
              {currentNav?.label || 'Dashboard'}
            </h2>
            {/* Badge "Non sauvegardé" — affiché ici à la place du cadre rouge */}
            <AnimatePresence>
              {hasChanges && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', color: '#fbbf24', fontWeight: 600, flexShrink: 0 }}
                >
                  ● Non sauvegardé
                </motion.span>
              )}
            </AnimatePresence>
            <span style={{ background: limits.color + '18', border: '1px solid ' + limits.color + '44', borderRadius: '6px', padding: '2px 7px', fontSize: '9px', color: limits.color, fontWeight: 700, letterSpacing: '0.06em', flexShrink: 0 }}>
              {limits.emoji} {limits.label}
            </span>
          </div>

          {/* ── Droite : actions ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <ThemeColorPicker profile={localProfile} onUpdate={updateLocal} />

            {/* Bouton image de fond */}
            <label
              title="Image de fond"
              style={{
                width: '34px', height: '34px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: localProfile?.bg_image_url ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.07)',
                border: '1px solid ' + (localProfile?.bg_image_url ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)'),
                borderRadius: '9px', cursor: 'pointer', flexShrink: 0,
                position: 'relative',
              }}
            >
              {uploadingBg
                ? <Loader2 size={14} color="#a78bfa" className="animate-spin" />
                : <Image size={14} color={localProfile?.bg_image_url ? '#a78bfa' : 'rgba(255,255,255,0.5)'} />
              }
              <input
                type="file"
                accept="image/*"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                onChange={handleBgUpload}
                disabled={uploadingBg}
              />
            </label>

            {/* Retirer image de fond si présente */}
            {localProfile?.bg_image_url && (
              <button
                onClick={() => updateLocal({ bg_image_url: null })}
                title="Retirer l'image de fond"
                style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '9px', cursor: 'pointer', flexShrink: 0 }}
              >
                <X size={13} color="#f87171" />
              </button>
            )}

            {/* Sauvegarder */}
            <button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: hasChanges ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)', border: '1px solid ' + (hasChanges ? 'transparent' : 'rgba(255,255,255,0.12)'), borderRadius: '9px', color: hasChanges ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, cursor: hasChanges ? 'pointer' : 'default', opacity: updateMutation.isPending ? 0.7 : 1 }}
            >
              {updateMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {!isMobile && 'Sauvegarder'}
            </button>

            {/* Déconnexion */}
            <button
              onClick={handleSignOut}
              style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '9px', cursor: 'pointer' }}
              title={user?.email}
            >
              <LogOut size={14} color="rgba(255,255,255,0.5)" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: isMobile ? '16px' : '24px', paddingBottom: isMobile ? '100px' : '24px', overflowY: 'auto', overflowX: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>

        {isMobile && (
          <MobileNav
            activeSection={activeSection}
            onNavigate={setActiveSection}
            profile={localProfile}
          />
        )}
      </div>

      {showPreview && <ProfilePreview profile={localProfile} onClose={() => setShowPreview(false)} />}
      <AnimatePresence>{showWaveModal && <WaveModal onClose={() => setShowWaveModal(false)} />}</AnimatePresence>

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