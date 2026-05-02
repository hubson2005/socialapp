import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Plus, Save, Loader2, Sparkles, Trash2, Check, ChevronLeft, ChevronRight,
  CalendarClock, LogOut, AtSign, Eye, CalendarDays, MapPin, BadgeCheck,
  Palette, ImagePlus, X, GripVertical, Layout, Bell, BellOff, Smartphone, Search,
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

// ─────────────────────────────────────────────────────────────────────────────
// DB helpers
// ─────────────────────────────────────────────────────────────────────────────
const db = {
  list: async () => {
    const { data, error } = await supabase.from('link_profiles').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data;
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
  delete: async (id) => {
    const { error } = await supabase.from('link_profiles').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
};

const LINKS_PER_PAGE = 10;
const PROFILES_PER_PAGE = 10;
const MAX_SIZE_KB = 2000;

const getExpiryStatus = (expiry_date) => {
  if (!expiry_date) return null;
  const now = new Date();
  const exp = new Date(expiry_date);
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expiré', color: 'text-destructive', bg: 'bg-destructive/10' };
  if (diffDays <= 30) return { label: diffDays + 'j', color: 'text-orange-500', bg: 'bg-orange-500/10' };
  return { label: exp.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }), color: 'text-green-600', bg: 'bg-green-500/10' };
};

const parseColors = (themeColor) => {
  if (themeColor && themeColor.includes('|')) {
    const parts = themeColor.split('|');
    return { bg1: parts[0], bg2: parts[1] };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

const EVENT_COLOR_PRESETS = [
  { label: 'Coucher de soleil', c1: '#ff6b35', c2: '#f7c948' },
  { label: 'Océan', c1: '#0ea5e9', c2: '#6366f1' },
  { label: 'Forêt', c1: '#10b981', c2: '#065f46' },
  { label: 'Rose', c1: '#ec4899', c2: '#8b5cf6' },
  { label: 'Nuit', c1: '#1e1b4b', c2: '#312e81' },
  { label: 'Rouge', c1: '#ef4444', c2: '#b91c1c' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Feature 3 — Templates
// ─────────────────────────────────────────────────────────────────────────────
const PROFILE_TEMPLATES = [
  { id: 'artiste',   label: 'Artiste',    emoji: '🎨', desc: 'Instagram, TikTok, YouTube, Spotify',    theme_color: '#7c3aed|#db2777', bio: 'Artiste & créateur de contenu ✨',          platformKeys: ['instagram','tiktok','youtube','spotify'] },
  { id: 'business',  label: 'Business',   emoji: '💼', desc: 'LinkedIn, Calendly, Email, Site web',    theme_color: '#0f172a|#1e40af', bio: 'Entrepreneur & consultant professionnel',   platformKeys: ['linkedin','calendly','email','website'] },
  { id: 'createur',  label: 'Créateur',   emoji: '📱', desc: 'YouTube, TikTok, Instagram, X',         theme_color: '#0f0a1e|#2d1b69', bio: 'Créateur de contenu | Suivez mon aventure 🚀', platformKeys: ['youtube','tiktok','instagram','twitter'] },
  { id: 'evenement', label: 'Événement',  emoji: '🎉', desc: 'Mode événement activé + compte à rebours', theme_color: '#1a0a00|#7c2d12', bio: 'Rejoins-nous pour un événement exceptionnel !', platformKeys: ['instagram','facebook','whatsapp'], is_event: true, event_color1: '#ff6b35', event_color2: '#f7c948' },
  { id: 'musique',   label: 'Musique',    emoji: '🎵', desc: 'Spotify, Apple Music, SoundCloud',      theme_color: '#064e3b|#065f46', bio: 'Musicien | Écoutez mes derniers titres 🎶',  platformKeys: ['spotify','applemusic','soundcloud','youtube'] },
  { id: 'gaming',    label: 'Gaming',     emoji: '🎮', desc: 'Twitch, Discord, TikTok, YouTube',      theme_color: '#0d0221|#4a0e8f', bio: "Gamer & streamer 🎮 | Let's play together", platformKeys: ['twitch','discord','tiktok','youtube'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Feature 2 — Live Preview (mini phone)
// ─────────────────────────────────────────────────────────────────────────────
function MiniProfilePreview({ profile }) {
  const { bg1, bg2 } = parseColors(profile.theme_color);
  const links = (profile.links || []).filter(l => l.enabled !== false);
  const bgStyle = profile.bg_image_url
    ? { backgroundImage: 'url(' + profile.bg_image_url + ')', backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(160deg, ' + bg1 + ', ' + bg2 + ')' };

  return (
    <div style={{ width: '240px', height: '480px', borderRadius: '32px', overflow: 'hidden', border: '6px solid #111', position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', ...bgStyle }}>
      <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', width: '56px', height: '5px', background: '#111', borderRadius: '3px', zIndex: 10 }} />
      {profile.bg_image_url && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', pointerEvents: 'none' }} />}
      <div style={{ overflowY: 'auto', height: '100%', padding: '26px 12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0, marginBottom: '7px', border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile.display_name?.[0]?.toUpperCase() || '?')}
        </div>
        <p style={{ color: 'white', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px', textAlign: 'center' }}>
          {profile.display_name || 'Votre nom'}
          {profile.is_verified && <span style={{ color: '#22c55e', marginLeft: '4px', fontSize: '9px' }}>✓</span>}
        </p>
        {profile.bio && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '8px', textAlign: 'center', margin: '0 0 8px', maxWidth: '200px', lineHeight: 1.4 }}>{profile.bio}</p>}
        {profile.is_event && profile.event_name && (
          <div style={{ background: 'linear-gradient(135deg,' + (profile.event_color1||'#ff6b35') + ',' + (profile.event_color2||'#f7c948') + ')', borderRadius: '9px', padding: '5px 9px', marginBottom: '7px', width: '100%', textAlign: 'center' }}>
            <p style={{ color: 'white', fontSize: '9px', fontWeight: 800, margin: 0 }}>🎉 {profile.event_name}</p>
          </div>
        )}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
          {links.slice(0, 5).map((link, i) => {
            const key = link.platform?.toLowerCase() || '';
            const platform = PLATFORMS[key] || { label: link.platform || 'LIEN', color: '#6366f1', icon: null };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.18)', borderRadius: '8px', padding: '5px 8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: platform.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {platform.icon ? React.cloneElement(platform.icon, { width: 13, height: 13 }) : <span style={{ color: 'white', fontSize: '7px', fontWeight: 'bold' }}>{(platform.label||'?')[0]}</span>}
                </div>
                <span style={{ color: 'white', fontSize: '8px', fontWeight: 700, letterSpacing: '0.04em', flex: 1 }}>{link.label || platform.label}</span>
              </div>
            );
          })}
          {links.length > 5 && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '8px', textAlign: 'center', margin: '2px 0 0' }}>+{links.length - 5} autres</p>}
          {links.length === 0 && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '8px', textAlign: 'center', padding: '8px 0' }}>Aucun lien ajouté</p>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature 3 — Templates modal
// ─────────────────────────────────────────────────────────────────────────────
function TemplatesModal({ onClose, onApply }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
        style={{ background: '#0a0817', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '580px', maxHeight: '82vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '22px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Templates</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '3px 0 0' }}>Configurez votre profil en un seul clic</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        <div style={{ margin: '12px 24px 0', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
          <p style={{ color: 'rgba(251,191,36,0.85)', fontSize: '11px', margin: 0, lineHeight: 1.5 }}>Appliquer un template <strong>remplacera</strong> votre thème, bio et liens actuels.</p>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {PROFILE_TEMPLATES.map(t => {
            const [c1, c2] = t.theme_color.split('|');
            return (
              <button key={t.id} onClick={() => onApply(t)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.transform = 'scale(1.01)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(135deg,' + c1 + ',' + c2 + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{t.emoji}</div>
                  <div>
                    <p style={{ color: 'white', fontWeight: 800, fontSize: '14px', margin: 0 }}>{t.label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>{t.platformKeys.length} plateformes</p>
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: '0 0 5px', lineHeight: 1.4 }}>{t.desc}</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>"{t.bio}"</p>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature 4 — Carte géographique
// ─────────────────────────────────────────────────────────────────────────────
function GeoStatsPanel({ profileId }) {
  const [geoData, setGeoData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('profile_stats').select('country_name, country').eq('profile_id', profileId).eq('event_type', 'view').not('country', 'is', null);
      if (data && data.length > 0) {
        const counts = data.reduce((acc, row) => {
          const key = row.country_name || row.country || 'Inconnu';
          acc[key] = { count: (acc[key]?.count || 0) + 1, code: row.country };
          return acc;
        }, {});
        setGeoData(Object.entries(counts).sort((a, b) => b[1].count - a[1].count).slice(0, 6));
      }
      setLoading(false);
    })();
  }, [profileId]);

  const max = geoData[0]?.[1]?.count || 1;
  const flagEmoji = (code) => {
    try { return code ? String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397)) : '🌐'; }
    catch { return '🌐'; }
  };

  return (
    <div className="bg-white/10 rounded-2xl border border-white/15 p-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '15px' }}>🌍</span>
        <h3 className="font-bold text-sm text-white">Visiteurs par pays</h3>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}><Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)', margin: '0 auto' }} /></div>
      ) : geoData.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', padding: '8px 0', lineHeight: 1.5 }}>
          Pas encore de données.<br /><span style={{ fontSize: '10px', opacity: 0.7 }}>Elles s'accumulent au fil des visites.</span>
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {geoData.map(([country, { count, code }]) => (
            <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', width: '24px', flexShrink: 0, lineHeight: 1 }}>{flagEmoji(code)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 600 }}>{country}</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{count}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: Math.round((count / max) * 100) + '%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '2px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature 6 — Notifications Panel
// ─────────────────────────────────────────────────────────────────────────────
function NotificationPanel({ onClose, profile }) {
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const [threshold, setThreshold] = useState(() => parseInt(localStorage.getItem('notif_threshold') || '10'));

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') { toast.error('Notifications non supportées'); return; }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === 'granted') {
      toast.success('Notifications activées !');
      new Notification('🔔 SocialApp', { body: 'Alerte tous les ' + threshold + ' visiteurs sur "' + (profile.display_name || 'votre profil') + '"', icon: '/Logo_SocialApp.png' });
    } else {
      toast.error('Permission refusée. Vérifiez les paramètres du navigateur.');
    }
  };

  const saveThreshold = (val) => {
    setThreshold(val);
    localStorage.setItem('notif_threshold', String(val));
    if (permission === 'granted') toast.success('Seuil : ' + val + ' vues');
  };

  return (
    <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
      style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: 'rgba(10,8,25,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px', padding: '18px', minWidth: '280px', zIndex: 50, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={13} color="white" /></div>
          <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>Notifications push</span>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
      </div>
      <div style={{ background: permission === 'granted' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (permission === 'granted' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'), borderRadius: '10px', padding: '10px 12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{permission === 'granted' ? '✅' : permission === 'denied' ? '🚫' : '🔔'}</span>
        <div>
          <p style={{ color: 'white', fontSize: '12px', fontW