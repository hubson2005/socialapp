import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Plus, Save, Loader2, Sparkles, Trash2, Check, ChevronLeft, ChevronRight,
  CalendarClock, LogOut, AtSign, Eye, CalendarDays, MapPin, BadgeCheck,
  Palette, ImagePlus, X, GripVertical, Layout, Bell, BellOff, Smartphone, Search,
  ShieldCheck, Clock, Users, RefreshCw,
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

const PROFILE_TEMPLATES = [
  { id: 'artiste',   label: 'Artiste',    emoji: '🎨', desc: 'Instagram, TikTok, YouTube, Spotify',    theme_color: '#7c3aed|#db2777', bio: 'Artiste & créateur de contenu ✨',          platformKeys: ['instagram','tiktok','youtube','spotify'] },
  { id: 'business',  label: 'Business',   emoji: '💼', desc: 'LinkedIn, Calendly, Email, Site web',    theme_color: '#0f172a|#1e40af', bio: 'Entrepreneur & consultant professionnel',   platformKeys: ['linkedin','calendly','email','website'] },
  { id: 'createur',  label: 'Créateur',   emoji: '📱', desc: 'YouTube, TikTok, Instagram, X',         theme_color: '#0f0a1e|#2d1b69', bio: 'Créateur de contenu | Suivez mon aventure 🚀', platformKeys: ['youtube','tiktok','instagram','twitter'] },
  { id: 'evenement', label: 'Événement',  emoji: '🎉', desc: 'Mode événement activé + compte à rebours', theme_color: '#1a0a00|#7c2d12', bio: 'Rejoins-nous pour un événement exceptionnel !', platformKeys: ['instagram','facebook','whatsapp'], is_event: true, event_color1: '#ff6b35', event_color2: '#f7c948' },
  { id: 'musique',   label: 'Musique',    emoji: '🎵', desc: 'Spotify, Apple Music, SoundCloud',      theme_color: '#064e3b|#065f46', bio: 'Musicien | Écoutez mes derniers titres 🎶',  platformKeys: ['spotify','applemusic','soundcloud','youtube'] },
  { id: 'gaming',    label: 'Gaming',     emoji: '🎮', desc: 'Twitch, Discord, TikTok, YouTube',      theme_color: '#0d0221|#4a0e8f', bio: "Gamer & streamer 🎮 | Let's play together", platformKeys: ['twitch','discord','tiktok','youtube'] },
];

// ─── Carousel multi-images ────────────────────────────────────────────────────
function EventImageCarousel({ images = [], onRemove, adminMode = false }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);
  const urls = images.map(img => (typeof img === 'string' ? img : img?.url)).filter(Boolean);
  useEffect(() => { setCurrent(0); }, [urls.length]);
  useEffect(() => {
    if (urls.length <= 1) return;
    intervalRef.current = setInterval(() => { setCurrent(prev => (prev + 1) % urls.length); }, 3500);
    return () => clearInterval(intervalRef.current);
  }, [urls.length]);
  const goTo = (idx) => {
    clearInterval(intervalRef.current);
    setCurrent(idx);
    intervalRef.current = setInterval(() => { setCurrent(prev => (prev + 1) % urls.length); }, 3500);
  };
  if (urls.length === 0) return null;
  return (
    <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', background: '#000' }}>
      <AnimatePresence mode="wait">
        <motion.img key={current} src={urls[current]} alt={`event-${current}`} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
      </AnimatePresence>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', pointerEvents: 'none' }} />
      {urls.length > 1 && (
        <>
          <button onClick={() => goTo((current - 1 + urls.length) % urls.length)} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><ChevronLeft size={16} /></button>
          <button onClick={() => goTo((current + 1) % urls.length)} style={{ position: 'absolute', right: adminMode ? '44px' : '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><ChevronRight size={16} /></button>
        </>
      )}
      {adminMode && onRemove && (
        <button onClick={() => onRemove(current)} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} color="white" /></button>
      )}
      {urls.length > 1 && (
        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
          {urls.map((_, i) => (<button key={i} onClick={() => goTo(i)} style={{ width: i === current ? '18px' : '6px', height: '6px', borderRadius: '3px', background: i === current ? 'white' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />))}
        </div>
      )}
      {urls.length > 1 && (<div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '2px 7px', fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{current + 1} / {urls.length}</div>)}
    </div>
  );
}

function EventImageThumbs({ images = [], current, onSelect, onRemove }) {
  const urls = images.map(img => (typeof img === 'string' ? img : img?.url)).filter(Boolean);
  if (urls.length <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
      {urls.map((url, i) => (
        <div key={i} style={{ position: 'relative', width: '52px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: i === current ? '2px solid white' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }} onClick={() => onSelect(i)}>
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  );
}

function MiniProfilePreview({ profile }) {
  const { bg1, bg2 } = parseColors(profile.theme_color);
  const links = (profile.links || []).filter(l => l.enabled !== false);
  const bgStyle = profile.bg_image_url ? { backgroundImage: 'url(' + profile.bg_image_url + ')', backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(160deg,' + bg1 + ',' + bg2 + ')' };
  const eventImages = Array.isArray(profile.event_images) ? profile.event_images : profile.event_image_url ? [profile.event_image_url] : [];
  return (
    <div style={{ width: '240px', height: '480px', borderRadius: '32px', overflow: 'hidden', border: '6px solid #111', position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', ...bgStyle }}>
      <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', width: '56px', height: '5px', background: '#111', borderRadius: '3px', zIndex: 10 }} />
      {profile.bg_image_url && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', pointerEvents: 'none' }} />}
      <div style={{ overflowY: 'auto', height: '100%', padding: '26px 12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0, marginBottom: '7px', border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile.display_name?.[0]?.toUpperCase() || '?')}
        </div>
        <p style={{ color: 'white', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px', textAlign: 'center' }}>{profile.display_name || 'Votre nom'}{profile.is_verified && <span style={{ color: '#22c55e', marginLeft: '4px', fontSize: '9px' }}>✓</span>}</p>
        {profile.bio && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '8px', textAlign: 'center', margin: '0 0 8px', maxWidth: '200px', lineHeight: 1.4 }}>{profile.bio}</p>}
        {profile.is_event && profile.event_name && (
          <div style={{ background: 'linear-gradient(135deg,' + (profile.event_color1 || '#ff6b35') + ',' + (profile.event_color2 || '#f7c948') + ')', borderRadius: '9px', padding: '5px 9px', marginBottom: '7px', width: '100%', textAlign: 'center' }}>
            <p style={{ color: 'white', fontSize: '9px', fontWeight: 800, margin: 0 }}>🎉 {profile.event_name}</p>
          </div>
        )}
        {profile.is_event && eventImages.length > 0 && (<div style={{ width: '100%', marginBottom: '6px' }}><EventImageCarousel images={eventImages} /></div>)}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
          {links.slice(0, 5).map((link, i) => {
            const key = link.platform?.toLowerCase() || '';
            const platform = PLATFORMS[key] || { label: link.platform || 'LIEN', color: '#6366f1', icon: null };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.18)', borderRadius: '8px', padding: '5px 8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: platform.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {platform.icon ? React.cloneElement(platform.icon, { width: 13, height: 13 }) : <span style={{ color: 'white', fontSize: '7px', fontWeight: 'bold' }}>{(platform.label || '?')[0]}</span>}
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
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', padding: '8px 0', lineHeight: 1.5 }}>Pas encore de données.<br /><span style={{ fontSize: '10px', opacity: 0.7 }}>Elles s'accumulent au fil des visites.</span></p>
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
  const saveThreshold = (val) => { setThreshold(val); localStorage.setItem('notif_threshold', String(val)); if (permission === 'granted') toast.success('Seuil : ' + val + ' vues'); };
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
          <p style={{ color: 'white', fontSize: '12px', fontWeight: 600, margin: 0 }}>{permission === 'granted' ? 'Notifications actives' : permission === 'denied' ? 'Permission refusée' : 'Non configuré'}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: 0 }}>{permission === 'granted' ? 'Alertes en temps réel activées' : permission === 'denied' ? 'Activez dans les paramètres du navigateur' : 'Cliquez sur Activer ci-dessous'}</p>
        </div>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: '0 0 8px' }}>Recevoir une alerte toutes les X vues :</p>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {[5, 10, 25, 50, 100].map(n => (
          <button key={n} onClick={() => saveThreshold(n)} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid ' + (threshold === n ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.15)'), background: threshold === n ? 'rgba(99,102,241,0.2)' : 'transparent', color: threshold === n ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer', fontWeight: threshold === n ? 700 : 400 }}>{n}</button>
        ))}
      </div>
      {permission !== 'granted' && (
        <button onClick={requestPermission} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>🔔 Activer les notifications</button>
      )}
    </motion.div>
  );
}

// ─── Panneau d'activation des comptes ────────────────────────────────────────
function UserActivationPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pending'); // pending | all | active

  const { data: allProfiles = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminAllProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('link_profiles')
        .select('id, display_name, username, is_activated, expiry_date, user_id, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // rafraîchit toutes les 30s
  });

  const activateMutation = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase.from('link_profiles').update({ is_activated: true }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['adminAllProfiles'], (old) => old.map(p => p.id === updated.id ? { ...p, is_activated: true } : p));
      toast.success('✅ Compte activé !');
    },
    onError: (e) => toast.error('Erreur : ' + e.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase.from('link_profiles').update({ is_activated: false }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['adminAllProfiles'], (old) => old.map(p => p.id === updated.id ? { ...p, is_activated: false } : p));
      toast.success('Compte désactivé');
    },
    onError: (e) => toast.error('Erreur : ' + e.message),
  });

  const filtered = allProfiles.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || (p.display_name || '').toLowerCase().includes(q) || (p.username || '').toLowerCase().includes(q);
    const matchFilter = filter === 'all' || (filter === 'pending' && !p.is_activated) || (filter === 'active' && p.is_activated);
    return matchSearch && matchFilter;
  });

  const pendingCount = allProfiles.filter(p => !p.is_activated).length;
  const activeCount = allProfiles.filter(p => p.is_activated).length;

  return (
    <div style={{ background: 'rgba(15,10,30,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={15} color="white" />
          </div>
          <div>
            <h3 style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: 0 }}>Gestion des comptes</h3>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>{allProfiles.length} profil{allProfiles.length > 1 ? 's' : ''} · {pendingCount} en attente</p>
          </div>
        </div>
        <button onClick={() => refetch()} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Rafraîchir">
          <RefreshCw size={12} color="rgba(255,255,255,0.5)" className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats mini */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
        {[
          { label: 'Total', value: allProfiles.length, icon: <Users size={12} color="#a78bfa" />, color: '#a78bfa' },
          { label: 'Activés', value: activeCount, icon: <ShieldCheck size={12} color="#22c55e" />, color: '#22c55e' },
          { label: 'En attente', value: pendingCount, icon: <Clock size={12} color="#f97316" />, color: '#f97316' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,8,25,0.8)', padding: '10px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>{s.icon}<span style={{ color: s.color, fontSize: '16px', fontWeight: 800 }}>{s.value}</span></div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres + recherche */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un profil..." style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px 10px 7px 28px', color: 'white', fontSize: '12px', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['pending', '⏳ En attente'], ['active', '✓ Activés'], ['all', 'Tous']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ flex: 1, padding: '5px 6px', borderRadius: '8px', border: '1px solid ' + (filter === val ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'), background: filter === val ? 'rgba(99,102,241,0.15)' : 'transparent', color: filter === val ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: '11px', cursor: 'pointer', fontWeight: filter === val ? 600 : 400, whiteSpace: 'nowrap' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader2 size={16} className="animate-spin" color="rgba(255,255,255,0.3)" /></div>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
            {filter === 'pending' ? '🎉 Aucun compte en attente' : 'Aucun résultat'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filtered.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Avatar */}
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: p.is_activated ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {(p.display_name || '?')[0].toUpperCase()}
                </div>
                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'white', fontSize: '12px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name || 'Sans nom'}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>{p.username ? '@' + p.username : 'Sans username'}</p>
                </div>
                {/* Statut badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 7px', borderRadius: '20px', background: p.is_activated ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.12)', border: '1px solid ' + (p.is_activated ? 'rgba(34,197,94,0.25)' : 'rgba(249,115,22,0.25)'), flexShrink: 0 }}>
                  {p.is_activated ? <Check size={10} color="#22c55e" /> : <Clock size={10} color="#f97316" />}
                  <span style={{ fontSize: '10px', fontWeight: 600, color: p.is_activated ? '#22c55e' : '#f97316' }}>{p.is_activated ? 'Actif' : 'Attente'}</span>
                </div>
                {/* Bouton action */}
                {p.is_activated ? (
                  <button
                    onClick={() => deactivateMutation.mutate(p.id)}
                    disabled={deactivateMutation.isPending && deactivateMutation.variables === p.id}
                    style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                  >
                    {deactivateMutation.isPending && deactivateMutation.variables === p.id ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
                    Désact.
                  </button>
                ) : (
                  <button
                    onClick={() => activateMutation.mutate(p.id)}
                    disabled={activateMutation.isPending && activateMutation.variables === p.id}
                    style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                  >
                    {activateMutation.isPending && activateMutation.variables === p.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                    Activer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [localProfile, setLocalProfile] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [linksPage, setLinksPage] = useState(0);
  const [profilesPage, setProfilesPage] = useState(0);
  const [profileSearch, setProfileSearch] = useState('');
  const [eventCarouselIndex, setEventCarouselIndex] = useState(0);
  const [uploadingEventImages, setUploadingEventImages] = useState(false);
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifPanelRef = useRef(null);
  const notifCountRef = useRef(0);
  const notifThreshold = parseInt(localStorage.getItem('notif_threshold') || '10');
  const [uploadingBgImage, setUploadingBgImage] = useState(false);
  const [showBgPanel, setShowBgPanel] = useState(false);
  const bgPanelRef = useRef(null);

  const { data: profiles = [], isLoading } = useQuery({ queryKey: ['linkProfiles'], queryFn: db.list });

  useEffect(() => {
    if (!profiles.length) return;
    const target = profiles.find((p) => p.id === activeProfileId) || profiles[0];
    setLocalProfile((prev) => (!prev || prev.id !== target.id) ? target : prev);
    setActiveProfileId((prev) => prev || target.id);
  }, [profiles, activeProfileId]);

  useEffect(() => {
    const handler = (e) => {
      if (bgPanelRef.current && !bgPanelRef.current.contains(e.target)) setShowBgPanel(false);
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) setShowNotifPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!localProfile?.id || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const channel = supabase.channel('notif-' + localProfile.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profile_stats', filter: 'profile_id=eq.' + localProfile.id }, (payload) => {
        if (payload.new?.event_type === 'view') {
          notifCountRef.current += 1;
          if (notifCountRef.current >= notifThreshold) {
            new Notification('🔔 SocialApp — ' + (localProfile.display_name || 'Votre profil'), { body: notifCountRef.current + ' nouvelles visites !', icon: '/Logo_SocialApp.png' });
            notifCountRef.current = 0;
          }
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [localProfile?.id, notifThreshold]);

  const deleteMutation = useMutation({
    mutationFn: (id) => db.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['linkProfiles'] });
      setActiveProfileId((prev) => (prev === deletedId ? null : prev));
      setLocalProfile(null);
      toast.success('Profil supprimé !');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['linkProfiles'] });
      setActiveProfileId(created.id);
      setLocalProfile(created);
      setHasChanges(false);
      toast.success('Profil créé !');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.update(id, data),
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['linkProfiles'] });
      toast.success('Modifications sauvegardées !');
    },
    onError: (error) => { toast.error('Erreur : ' + error.message); },
  });

  const handleCreateProfile = () => {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    createMutation.mutate({ display_name: 'Profil ' + ((profiles.length || 0) + 1), bio: '', links: [], theme_color: '#6366f1', expiry_date: expiry.toISOString().split('T')[0], is_verified: false, is_event: false });
  };

  const handleSwitchProfile = useCallback((p) => {
    if (hasChanges && !window.confirm('Des modifications non sauvegardées seront perdues. Continuer ?')) return;
    setActiveProfileId(p.id); setLocalProfile(p); setHasChanges(false); setLinksPage(0);
  }, [hasChanges]);

  const handleDeleteProfile = useCallback((p) => {
    if (!window.confirm('Supprimer le profil "' + p.display_name + '" ?')) return;
    deleteMutation.mutate(p.id);
  }, [deleteMutation]);

  const updateLocal = useCallback((updates) => {
    setLocalProfile((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const applyTemplate = useCallback((template) => {
    const newLinks = template.platformKeys.map(key => ({ id: crypto.randomUUID(), platform: key, url: '', label: '', enabled: true }));
    updateLocal({ theme_color: template.theme_color, bio: template.bio, links: newLinks, is_event: template.is_event || false, event_color1: template.event_color1 || null, event_color2: template.event_color2 || null });
    setShowTemplates(false);
    toast.success('Template "' + template.label + '" appliqué ! Pensez à sauvegarder.');
  }, [updateLocal]);

  const handleSave = () => {
    if (!localProfile || updateMutation.isPending || !hasChanges) return;
    const rawImages = localProfile.event_images || (localProfile.event_image_url ? [localProfile.event_image_url] : []);
    const eventImagesArray = rawImages.map(img => (typeof img === 'string' ? img : img?.url)).filter(Boolean);
    updateMutation.mutate({ id: localProfile.id, data: {
      display_name: localProfile.display_name, bio: localProfile.bio, links: localProfile.links,
      theme_color: localProfile.theme_color, expiry_date: localProfile.expiry_date,
      username: localProfile.username ? localProfile.username.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : null,
      is_verified: localProfile.is_verified || false, is_event: localProfile.is_event || false,
      event_name: localProfile.event_name || null, event_date: localProfile.event_date || null,
      event_location: localProfile.event_location || null, event_color1: localProfile.event_color1 || null,
      event_color2: localProfile.event_color2 || null, event_booking_url: localProfile.event_booking_url || null,
      event_description: localProfile.event_description || null,
      event_images: eventImagesArray, event_image_url: eventImagesArray[0] || null,
      bg_image_url: localProfile.bg_image_url || null,
    }});
  };

  const handleDragStart = useCallback((e, idx) => { dragIndexRef.current = idx; e.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if (e.currentTarget) e.currentTarget.style.opacity = '0.4'; }, 0); }, []);
  const handleDragEnd = useCallback((e) => { e.currentTarget.style.opacity = '1'; dragIndexRef.current = null; setDragOverIndex(null); }, []);
  const handleDragOver = useCallback((e, idx) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverIndex(idx); }, []);
  const handleDragLeave = useCallback(() => { setDragOverIndex(null); }, []);
  const handleDrop = useCallback((e, toIdx) => {
    e.preventDefault();
    const fromIdx = dragIndexRef.current;
    if (fromIdx === null || fromIdx === toIdx) { setDragOverIndex(null); return; }
    const newLinks = [...(localProfile?.links || [])];
    const [moved] = newLinks.splice(fromIdx, 1);
    newLinks.splice(toIdx, 0, moved);
    updateLocal({ links: newLinks });
    setDragOverIndex(null); dragIndexRef.current = null;
  }, [localProfile, updateLocal]);

  const handleEventImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const oversized = files.find(f => f.size / 1024 > MAX_SIZE_KB);
    if (oversized) { toast.error(oversized.name + ' dépasse ' + MAX_SIZE_KB + ' Ko'); return; }
    setUploadingEventImages(true);
    try {
      const uploadedUrls = await Promise.all(files.map(async (file) => {
        const fileName = 'event-' + localProfile.id + '-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + file.name.split('.').pop();
        const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        return data.publicUrl;
      }));
      const existing = (localProfile.event_images || (localProfile.event_image_url ? [localProfile.event_image_url] : []));
      const merged = [...existing, ...uploadedUrls];
      updateLocal({ event_images: merged, event_image_url: merged[0] });
      setEventCarouselIndex(merged.length - 1);
      toast.success(uploadedUrls.length + ' image(s) ajoutée(s) !');
    } catch (err) { toast.error('Erreur upload : ' + err.message); }
    finally { setUploadingEventImages(false); e.target.value = ''; }
  };

  const handleRemoveEventImage = useCallback((idx) => {
    const current = localProfile.event_images || (localProfile.event_image_url ? [localProfile.event_image_url] : []);
    const updated = current.filter((_, i) => i !== idx);
    updateLocal({ event_images: updated, event_image_url: updated[0] || null });
    setEventCarouselIndex(prev => Math.min(prev, Math.max(0, updated.length - 1)));
  }, [localProfile, updateLocal]);

  const handleBgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size / 1024 > MAX_SIZE_KB) { toast.error('Image trop lourde ! Max ' + MAX_SIZE_KB + ' Ko'); return; }
    setUploadingBgImage(true);
    try {
      const fileName = 'bg-' + localProfile.id + '-' + Date.now() + '.' + file.name.split('.').pop();
      const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      updateLocal({ bg_image_url: data.publicUrl });
      toast.success('Image de fond appliquée !');
      setShowBgPanel(false);
    } catch (err) { toast.error('Erreur : ' + err.message); }
    finally { setUploadingBgImage(false); }
  };

  const handleRemoveBgImage = () => { updateLocal({ bg_image_url: null }); setShowBgPanel(false); toast.success('Image supprimée'); };
  const handleAddPlatform = (key) => { updateLocal({ links: [...(localProfile?.links || []), { id: crypto.randomUUID(), platform: key, url: '', label: '', enabled: true }] }); setShowAddDialog(false); };
  const handleUpdateLink = useCallback((index, updated) => { const l = [...(localProfile?.links || [])]; l[index] = updated; updateLocal({ links: l }); }, [localProfile, updateLocal]);
  const handleRemoveLink = useCallback((index) => { const l = (localProfile?.links || []).filter((_, i) => i !== index); updateLocal({ links: l }); setLinksPage((p) => Math.min(p, Math.max(0, Math.ceil(l.length / LINKS_PER_PAGE) - 1))); }, [localProfile, updateLocal]);
  const handleSignOut = async () => { if (hasChanges && !window.confirm('Modifications non sauvegardées. Se déconnecter quand même ?')) return; await signOut(); };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (!profiles.length && !createMutation.isPending) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent mx-auto mb-6 flex items-center justify-center"><Sparkles className="w-8 h-8 text-white" /></div>
        <h1 className="text-2xl font-bold mb-2">Bienvenue !</h1>
        <p className="text-muted-foreground text-sm mb-6">Créez votre page de liens unique et partagez-la via un seul QR code.</p>
        <Button onClick={handleCreateProfile} size="lg" className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Créer mon profil</Button>
      </motion.div>
    </div>
  );

  if (!localProfile) return null;

  const colors = parseColors(localProfile.theme_color);
  const links = localProfile.links || [];
  const pagedLinks = links.slice(linksPage * LINKS_PER_PAGE, (linksPage + 1) * LINKS_PER_PAGE);
  const totalLinkPages = Math.ceil(links.length / LINKS_PER_PAGE);
  const eventImages = Array.isArray(localProfile.event_images) ? localProfile.event_images : localProfile.event_image_url ? [localProfile.event_image_url] : [];
  const filteredProfiles = profiles.filter(p => !profileSearch || (p.display_name || '').toLowerCase().includes(profileSearch.toLowerCase()) || (p.username || '').toLowerCase().includes(profileSearch.toLowerCase()));
  const pagedProfiles = filteredProfiles.slice(profilesPage * PROFILES_PER_PAGE, (profilesPage + 1) * PROFILES_PER_PAGE);
  const totalProfilePages = Math.ceil(filteredProfiles.length / PROFILES_PER_PAGE);
  const notifGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
  const bgStyle = localProfile.bg_image_url ? { backgroundImage: 'url(' + localProfile.bg_image_url + ')', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : { background: 'linear-gradient(135deg,' + colors.bg1 + ',' + colors.bg2 + ')' };

  return (
    <div className="min-h-screen" style={bgStyle}>
      {localProfile.bg_image_url && <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(135deg,rgba(0,0,0,0.45),rgba(0,0,0,0.30))', pointerEvents: 'none' }} />}

      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-lg border-b border-white/10" style={{ position: 'relative', zIndex: 20 }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
            <h1 className="font-bold text-lg text-white">SocialApp</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ThemeColorPicker profile={localProfile} onUpdate={updateLocal} />
            <Button onClick={() => setShowTemplates(true)} variant="outline" size="sm" className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10" title="Templates">
              <Layout className="w-3.5 h-3.5" /><span className="hidden sm:inline">Templates</span>
            </Button>
            <Button onClick={() => setShowLivePreview(v => !v)} variant="outline" size="sm" className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10"
              style={showLivePreview ? { borderColor: 'rgba(99,102,241,0.7)', background: 'rgba(99,102,241,0.2)' } : {}}>
              <Smartphone className="w-3.5 h-3.5" /><span className="hidden sm:inline">Live</span>
              {showLivePreview && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />}
            </Button>
            <div ref={bgPanelRef} style={{ position: 'relative' }}>
              <Button onClick={() => setShowBgPanel(v => !v)} variant="outline" size="sm" className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10"
                style={localProfile.bg_image_url ? { borderColor: 'rgba(99,102,241,0.7)', background: 'rgba(99,102,241,0.2)' } : {}}>
                <ImagePlus className="w-3.5 h-3.5" /><span className="hidden sm:inline">Fond</span>
                {localProfile.bg_image_url && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />}
              </Button>
              {showBgPanel && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: 'rgba(10,8,25,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px', padding: '16px', minWidth: '260px', zIndex: 50, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImagePlus size={13} color="white" /></div>
                      <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>Image de fond</span>
                    </div>
                    <button onClick={() => setShowBgPanel(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                  </div>
                  {localProfile.bg_image_url && (
                    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={localProfile.bg_image_url} alt="fond" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.7))', padding: '20px 10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>Image actuelle</span>
                        <button onClick={handleRemoveBgImage} style={{ background: 'rgba(239,68,68,0.8)', border: 'none', cursor: 'pointer', borderRadius: '6px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: '11px' }}><Trash2 size={10} /> Supprimer</button>
                      </div>
                    </div>
                  )}
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '20px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  >
                    {uploadingBgImage ? <Loader2 size={22} color="rgba(99,102,241,0.8)" className="animate-spin" /> : <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImagePlus size={18} color="rgba(99,102,241,0.9)" /></div>}
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 500, margin: 0 }}>{uploadingBgImage ? 'Upload en cours...' : localProfile.bg_image_url ? "Changer l'image" : 'Choisir une image'}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0' }}>JPG, PNG, WebP — max 2 Mo</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} disabled={uploadingBgImage} />
                  </label>
                </motion.div>
              )}
            </div>
            <div ref={notifPanelRef} style={{ position: 'relative' }}>
              <Button onClick={() => setShowNotifPanel(v => !v)} variant="outline" size="sm" className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10"
                style={notifGranted ? { borderColor: 'rgba(34,197,94,0.5)', background: 'rgba(34,197,94,0.1)' } : {}}>
                {notifGranted ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              </Button>
              <AnimatePresence>
                {showNotifPanel && <NotificationPanel onClose={() => setShowNotifPanel(false)} profile={localProfile} />}
              </AnimatePresence>
            </div>
            <Button onClick={() => setShowPreview(true)} variant="outline" size="sm" className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10">
              <Eye className="w-3.5 h-3.5" /><span className="hidden sm:inline">Aperçu</span>
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending} className="rounded-xl gap-2" size="sm">
              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Sauvegarder
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10" title={user?.email}>
              <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <AnimatePresence>
        {showLivePreview && (
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ position: 'fixed', right: '20px', top: '76px', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
          >
            <div style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: '10px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pd 2s infinite' }} />
              <span style={{ color: 'white', fontSize: '11px', fontWeight: 600 }}>Aperçu live</span>
              <button onClick={() => setShowLivePreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', marginLeft: '2px' }}><X size={11} /></button>
            </div>
            <MiniProfilePreview profile={localProfile} />
            <style>{`@keyframes pd{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6" style={{ position: 'relative', zIndex: 1, paddingRight: showLivePreview ? '280px' : undefined }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/20 rounded-2xl border border-white/20 overflow-hidden">
              <ProfileHeader profile={localProfile} onUpdate={updateLocal} />
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0 16px' }} />
              <div className="flex items-center gap-3 px-4 py-3">
                <AtSign className="w-4 h-4 text-white/60 shrink-0" />
                <span className="text-white/70 text-sm shrink-0">Username :</span>
                <input type="text" value={localProfile.username || ''} onChange={(e) => updateLocal({ username: e.target.value })} placeholder="ex: hubson" className="bg-transparent text-white text-sm focus:outline-none flex-1 min-w-0 placeholder-white/30" />
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0 16px' }} />
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="w-4 h-4 text-white/60 shrink-0" />
                  <div>
                    <span className="text-white/70 text-sm">Badge vérifié</span>
                    <p className="text-white/40 text-xs">Affiche ✓ vert sur votre profil public</p>
                  </div>
                </div>
                <button onClick={() => updateLocal({ is_verified: !localProfile.is_verified })} style={{ width: '44px', height: '24px', borderRadius: '100px', background: localProfile.is_verified ? '#22c55e' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: localProfile.is_verified ? '23px' : '3px', transition: 'left 0.3s' }} />
                </button>
              </div>
            </div>

            {/* Mode Événement */}
            <div className="bg-white/20 rounded-2xl border border-white/20 px-4 py-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-white/60 shrink-0" />
                  <div>
                    <span className="text-white/70 text-sm">Mode Événement</span>
                    <p className="text-white/40 text-xs">Ajoute un compte à rebours sur votre profil</p>
                  </div>
                </div>
                <button onClick={() => updateLocal({ is_event: !localProfile.is_event })} style={{ width: '44px', height: '24px', borderRadius: '100px', background: localProfile.is_event ? 'linear-gradient(135deg,#ff6b35,#f7c948)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: localProfile.is_event ? '23px' : '3px', transition: 'left 0.3s' }} />
                </button>
              </div>
              {localProfile.is_event && (
                <div className="space-y-2 pt-1 border-t border-white/10">
                  <input type="text" value={localProfile.event_name || ''} onChange={(e) => updateLocal({ event_name: e.target.value })} placeholder="Nom de l'événement" className="w-full bg-white/10 text-white text-sm focus:outline-none rounded-xl px-3 py-2 placeholder-white/30 border border-white/10" />
                  <input type="datetime-local" value={localProfile.event_date || ''} onChange={(e) => updateLocal({ event_date: e.target.value })} className="w-full bg-white/10 text-white text-sm focus:outline-none rounded-xl px-3 py-2 border border-white/10" />
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                    <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <input type="text" value={localProfile.event_location || ''} onChange={(e) => updateLocal({ event_location: e.target.value })} placeholder="Lieu de l'événement" className="bg-transparent text-white text-sm focus:outline-none flex-1 placeholder-white/30" />
                  </div>
                  <textarea value={localProfile.event_description || ''} onChange={(e) => updateLocal({ event_description: e.target.value })} placeholder="Détails de l'événement..." rows={3} className="w-full bg-white/10 text-white text-sm focus:outline-none rounded-xl px-3 py-2 placeholder-white/30 border border-white/10 resize-none" />
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                    <span style={{ fontSize: '13px' }}>🎟️</span>
                    <input type="url" value={localProfile.event_booking_url || ''} onChange={(e) => updateLocal({ event_booking_url: e.target.value })} placeholder="Lien de réservation" className="bg-transparent text-white text-sm focus:outline-none flex-1 placeholder-white/30" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ImagePlus className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-white/50 text-xs">Images de l'événement{eventImages.length > 0 && <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,0.12)', borderRadius: '6px', padding: '1px 7px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{eventImages.length} / ∞</span>}</span>
                      </div>
                      {eventImages.length > 0 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '8px', padding: '4px 10px', cursor: uploadingEventImages ? 'not-allowed' : 'pointer', color: 'rgba(180,170,255,0.9)', fontSize: '12px', fontWeight: 600 }}>
                          {uploadingEventImages ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}Ajouter
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleEventImagesUpload} disabled={uploadingEventImages} />
                        </label>
                      )}
                    </div>
                    {eventImages.length > 0 ? (
                      <><EventImageCarousel images={eventImages} onRemove={handleRemoveEventImage} adminMode />
                        <EventImageThumbs images={eventImages} current={eventCarouselIndex} onSelect={setEventCarouselIndex} onRemove={handleRemoveEventImage} /></>
                    ) : (
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: '2px dashed rgba(255,255,255,0.18)', borderRadius: '14px', padding: '24px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                      >
                        {uploadingEventImages ? <Loader2 size={22} color="rgba(99,102,241,0.8)" className="animate-spin" /> : <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImagePlus size={20} color="rgba(255,255,255,0.35)" /></div>}
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: 500, margin: 0 }}>{uploadingEventImages ? 'Upload en cours...' : 'Ajouter des images'}</p>
                          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: '3px 0 0' }}>Plusieurs fichiers acceptés · max 2 Mo chacune</p>
                        </div>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleEventImagesUpload} disabled={uploadingEventImages} />
                      </label>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Palette className="w-3.5 h-3.5 text-white/40" /><span className="text-white/50 text-xs">Couleur de fond de l'événement</span></div>
                    <div className="flex gap-2 flex-wrap">
                      {EVENT_COLOR_PRESETS.map((preset) => (
                        <button key={preset.label} onClick={() => updateLocal({ event_color1: preset.c1, event_color2: preset.c2 })} title={preset.label} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,' + preset.c1 + ',' + preset.c2 + ')', border: (localProfile.event_color1 === preset.c1) ? '2px solid white' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
                      ))}
                      <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                        <input type="color" value={localProfile.event_color1 || '#ff6b35'} onChange={(e) => updateLocal({ event_color1: e.target.value })} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', border: '2px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', pointerEvents: 'none' }}>+</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Plateformes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Mes plateformes</h2>
                {links.length > 1 && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}><GripVertical size={12} /> glisser pour réordonner</span>}
              </div>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => setShowAddDialog(true)}><Plus className="w-3.5 h-3.5" /> Ajouter</Button>
            </div>
            {links.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/20 rounded-2xl border border-dashed border-white/30 p-10 text-center">
                <p className="text-white/60 text-sm">Aucune plateforme ajoutée.<br />Cliquez sur <strong>Ajouter</strong> pour commencer.</p>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pagedLinks.map((link, i) => {
                    const absoluteIndex = linksPage * LINKS_PER_PAGE + i;
                    const isDragOver = dragOverIndex === absoluteIndex;
                    return (
                      <div key={link.id || link.platform + '-' + absoluteIndex}
                        draggable onDragStart={(e) => handleDragStart(e, absoluteIndex)} onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, absoluteIndex)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, absoluteIndex)}
                        style={{ position: 'relative', transition: 'transform 0.15s', transform: isDragOver ? 'scale(1.02)' : 'scale(1)', outline: isDragOver ? '2px dashed rgba(255,255,255,0.5)' : '2px solid transparent', borderRadius: '16px', cursor: 'grab' }}
                      >
                        {links.length > 1 && <div style={{ position: 'absolute', top: '50%', left: '8px', transform: 'translateY(-50%)', zIndex: 2, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}><GripVertical size={14} /></div>}
                        <PlatformCard link={link} index={absoluteIndex} onUpdate={(u) => handleUpdateLink(absoluteIndex, u)} onRemove={() => handleRemoveLink(absoluteIndex)} />
                      </div>
                    );
                  })}
                </div>
                {totalLinkPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <button disabled={linksPage === 0} onClick={() => setLinksPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/25 text-white text-xs disabled:opacity-30 hover:bg-white/20 transition-colors">Précédent</button>
                    <span className="text-white/50 text-xs">{linksPage + 1} / {totalLinkPages}</span>
                    <button disabled={linksPage >= totalLinkPages - 1} onClick={() => setLinksPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/25 text-white text-xs disabled:opacity-30 hover:bg-white/20 transition-colors">Suivant</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <QRCodeDisplay profileId={localProfile.id} username={localProfile.username} />
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Mes profils</h3>
                <span className="text-xs text-muted-foreground">{profiles.length} profil{profiles.length > 1 ? 's' : ''}</span>
              </div>
              {profiles.length >= 1 && (
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.4)' }} />
                  <input type="text" value={profileSearch} onChange={(e) => { setProfileSearch(e.target.value); setProfilesPage(0); }} placeholder="Rechercher un profil..."
                    style={{ width: '100%', padding: '8px 30px', fontSize: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)'; e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; }}
                    onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  />
                  {profileSearch && (<button onClick={() => { setProfileSearch(''); setProfilesPage(0); }} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', padding: '3px', color: 'rgba(255,255,255,0.6)' }}><X size={11} /></button>)}
                </div>
              )}
              <div className="space-y-1">
                {filteredProfiles.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">Aucun résultat pour « {profileSearch} »</p>
                ) : pagedProfiles.map((p) => {
                  const expiry = getExpiryStatus(p.expiry_date);
                  const isActive = localProfile && localProfile.id === p.id;
                  return (
                    <div key={p.id} className="group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors hover:bg-muted" onClick={() => handleSwitchProfile(p)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={'text-sm truncate ' + (isActive ? 'font-semibold text-primary' : 'text-foreground')}>{p.display_name || 'Sans nom'}</span>
                          {p.is_verified && <span style={{ fontSize: '10px', color: '#22c55e' }}>✓</span>}
                          {p.is_event && <span style={{ fontSize: '10px' }}>🎉</span>}
                        </div>
                        {p.username && <span className="text-xs text-muted-foreground">@{p.username}</span>}
                        {expiry && (<span className={'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md mt-0.5 ' + expiry.color + ' ' + expiry.bg}><CalendarClock className="w-3 h-3" />{expiry.label}</span>)}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                        {profiles.length > 1 && (<button className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all" onClick={(e) => { e.stopPropagation(); handleDeleteProfile(p); }}><Trash2 className="w-3.5 h-3.5" /></button>)}
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalProfilePages > 1 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <button disabled={profilesPage === 0} onClick={() => setProfilesPage(p => p - 1)} className="p-1 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <span className="text-xs text-muted-foreground">{profilesPage + 1} / {totalProfilePages}</span>
                  <button disabled={profilesPage >= totalProfilePages - 1} onClick={() => setProfilesPage(p => p + 1)} className="p-1 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <button onClick={handleCreateProfile} className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-primary hover:bg-primary/10 transition-colors"><Plus className="w-3.5 h-3.5" /> Nouveau profil</button>
            </div>
            <div className="bg-white/20 rounded-2xl border border-white/20 px-4 py-3 flex items-center gap-3">
              <CalendarClock className="w-4 h-4 text-white/60 shrink-0" />
              <span className="text-white/70 text-sm shrink-0">Expiration :</span>
              <input type="date" value={localProfile.expiry_date || ''} onChange={(e) => updateLocal({ expiry_date: e.target.value })} className="bg-transparent text-white text-sm focus:outline-none flex-1 min-w-0" />
            </div>
            <StatsCard profileId={localProfile.id} />
            <GeoStatsPanel profileId={localProfile.id} />

            {/* ✅ Panneau activation des comptes utilisateurs */}
            <UserActivationPanel />

          </div>
        </div>
      </div>

      <AddPlatformDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSelect={handleAddPlatform} existingPlatforms={(localProfile.links || []).map(l => l.platform)} />
      {showPreview && <ProfilePreview profile={localProfile} onClose={() => setShowPreview(false)} />}
      <AnimatePresence>
        {showTemplates && <TemplatesModal onClose={() => setShowTemplates(false)} onApply={applyTemplate} />}
      </AnimatePresence>
    </div>
  );
}