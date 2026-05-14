import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Plus, Save, Loader2, Lock, CheckCircle,
  CalendarClock, LogOut, AtSign, Eye,
  CalendarDays, MapPin, BadgeCheck, ImagePlus, X,
  BarChart2, AlertCircle, Crown,
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

// ─── Limites par plan ─────────────────────────────────────────────────────────
// ✅ maxMarketplace et maxDocs ajoutés selon les offres définies
const PLAN_LIMITS = {
  basic:    { maxLinks: 3,  maxProfiles: 1, hasStats: false, maxMarketplace: 4,  maxDocs: 1, label: 'BASIC',    color: '#6366f1', emoji: '⚡' },
  pro:      { maxLinks: 7,  maxProfiles: 2, hasStats: true,  maxMarketplace: 10, maxDocs: 3, label: 'PRO',      color: '#ff8c00', emoji: '🚀' },
  business: { maxLinks: 10, maxProfiles: 2, hasStats: true,  maxMarketplace: 10, maxDocs: 5, label: 'BUSINESS', color: '#f7c948', emoji: '💼' },
};

const db = {
  get: async (userId) => {
    const { data, error } = await supabase
      .from('link_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  create: async (data) => {
    const { data: created, error } = await supabase
      .from('link_profiles').insert([data]).select().single();
    if (error) throw error;
    return created;
  },
  update: async (id, data) => {
    const { data: updated, error } = await supabase
      .from('link_profiles').update(data).eq('id', id).select().single();
    if (error) throw error;
    return updated;
  },
};

const MAX_SIZE_KB = 2000;
const parseColors = (themeColor) => {
  if (themeColor && themeColor.includes('|')) {
    const parts = themeColor.split('|');
    return { bg1: parts[0], bg2: parts[1] };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

function LockedField({ placeholder }) {
  return (
    <div style={{ flex:1, display:'flex', alignItems:'center', gap:'6px', background:'rgba(0,0,0,0.2)', borderRadius:'10px', padding:'7px 10px', border:'1px dashed rgba(255,255,255,0.12)', opacity:0.5 }}>
      <Lock size={11} color="rgba(255,255,255,0.4)" />
      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', fontStyle:'italic' }}>{placeholder}</span>
    </div>
  );
}

function PlanLimitBanner({ limits, currentCount, type }) {
  const isAtLimit = currentCount >= limits;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'8px',
      padding:'8px 12px', borderRadius:'10px',
      background: isAtLimit ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${isAtLimit ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)'}`,
      marginBottom:'8px',
    }}>
      {isAtLimit ? <AlertCircle size={13} color="#f87171" /> : <Crown size={13} color="rgba(255,255,255,0.4)" />}
      <span style={{ fontSize:'12px', color: isAtLimit ? '#f87171' : 'rgba(255,255,255,0.5)' }}>
        {isAtLimit
          ? `Limite atteinte — ${limits} ${type} max pour votre offre`
          : `${currentCount} / ${limits} ${type} utilisé${currentCount > 1 ? 's' : ''}`}
      </span>
      {isAtLimit && (
        <a href="/" style={{ marginLeft:'auto', fontSize:'11px', color:'#ff8c00', fontWeight:600, textDecoration:'none', whiteSpace:'nowrap' }}>
          Changer d'offre →
        </a>
      )}
    </div>
  );
}

function WaveModal({ onClose }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity:0, scale:0.93, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.93 }}
        transition={{ type:'spring', stiffness:300, damping:25 }}
        onClick={e => e.stopPropagation()}
        style={{ background:'#0f0a1e', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'24px', padding:'28px 24px', maxWidth:'360px', width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.7)', textAlign:'center' }}
      >
        <div style={{ width:'60px', height:'60px', borderRadius:'18px', background:'linear-gradient(135deg,#0057FF,#0099FF)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 24px rgba(0,87,255,0.4)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
        <h3 style={{ color:'white', fontSize:'18px', fontWeight:800, marginBottom:'6px' }}>🔓 Débloquer cette fonctionnalité</h3>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', marginBottom:'20px', lineHeight:1.6 }}>
          Le <strong style={{ color:'rgba(255,255,255,0.8)' }}>username personnalisé</strong> est une fonctionnalité premium. Activez votre compte via Wave pour en bénéficier.
        </p>
        <div style={{ background:'rgba(0,87,255,0.1)', border:'1px solid rgba(0,87,255,0.3)', borderRadius:'14px', padding:'16px', marginBottom:'14px' }}>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', marginBottom:'8px' }}>
            Envoyez votre paiement via <strong style={{ color:'#60a5fa' }}>Wave CI</strong> au numéro :
          </p>
          <p style={{ color:'white', fontSize:'26px', fontWeight:800, margin:'0 0 4px', letterSpacing:'0.02em' }}>+225 05 76 03 12 12</p>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>Montant : à définir selon votre offre</p>
        </div>
        <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:'12px', padding:'12px 14px', marginBottom:'18px', textAlign:'left' }}>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px', lineHeight:1.7, margin:0 }}>
            📸 Après paiement, envoyez une capture au support WhatsApp. Votre compte sera activé dans les <strong style={{ color:'rgba(255,255,255,0.85)' }}>minutes qui suivent</strong>.
          </p>
        </div>
        <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer"
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'13px', background:'#25D366', borderRadius:'12px', color:'white', fontSize:'14px', fontWeight:700, textDecoration:'none', marginBottom:'10px', boxShadow:'0 4px 16px rgba(37,211,102,0.35)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.2 13.8c-.2.6-1.3 1.2-1.8 1.2-.5.1-1.1.1-1.6-.1-1-.3-2-1-2.8-1.8A9.2 9.2 0 0 1 9 12.4c-.2-.5-.2-1-.1-1.5.1-.5.6-1.1 1-1.3.3-.1.5-.1.7 0 .2 0 .3 0 .4.3l.6 1.6c0 .1.1.3 0 .4-.1.2-.2.3-.3.4-.1.1-.3.3-.2.5.4.7 1 1.3 1.7 1.7.2.1.4 0 .5-.1l.5-.6c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.4.1.3 0 .8-.2 1z"/></svg>
          Envoyer la preuve sur WhatsApp
        </a>
        <button onClick={onClose} style={{ width:'100%', padding:'11px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', color:'rgba(255,255,255,0.5)', fontSize:'13px', cursor:'pointer' }}>
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Dashboard utilisateur ────────────────────────────────────────────────────
export default function UserDashboard() {
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showWaveModal, setShowWaveModal] = useState(false);
  const [localProfile, setLocalProfile] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingEventImage, setUploadingEventImage] = useState(false);
  const [uploadingBgImage, setUploadingBgImage] = useState(false);
  const [showBgPanel, setShowBgPanel] = useState(false);
  const bgPanelRef = useRef(null);

  // ✅ FIX BUG 1 : on lit le plan depuis le profil BDD en PRIORITÉ,
  // puis depuis user_metadata (fallback), puis 'basic' en dernier recours.
  // Avant : uniquement user_metadata → plan toujours 'basic' si metadata vide.
  const rawPlan = localProfile?.plan || user?.user_metadata?.plan || 'basic';
  const userPlan = rawPlan.toLowerCase().trim();
  const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.basic;

  const isActivated = localProfile?.is_activated === true;

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['userProfiles', user?.id],
    queryFn: () => db.get(user.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!profiles.length) return;
    const target = profiles.find(p => p.id === activeProfileId) || profiles[0];
    setLocalProfile(prev => (!prev || prev.id !== target.id) ? target : prev);
    setActiveProfileId(prev => prev || target.id);
  }, [profiles, activeProfileId]);

  useEffect(() => {
    if (!showBgPanel) return;
    const handler = (e) => {
      if (bgPanelRef.current && !bgPanelRef.current.contains(e.target)) setShowBgPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showBgPanel]);

  useEffect(() => {
    if (!localProfile) return;
    const html = document.documentElement;
    const body = document.body;
    body.style.background = 'transparent';
    if (localProfile.bg_image_url) {
      html.style.backgroundImage = 'url(' + localProfile.bg_image_url + ')';
      html.style.backgroundSize = 'cover';
      html.style.backgroundPosition = 'center';
      html.style.backgroundRepeat = 'no-repeat';
      html.style.backgroundAttachment = 'fixed';
    } else {
      const colors = parseColors(localProfile.theme_color);
      html.style.backgroundImage = 'none';
      html.style.background = 'linear-gradient(160deg,' + colors.bg1 + ',' + colors.bg2 + ')';
    }
    return () => {
      html.style.backgroundImage = '';
      html.style.backgroundSize = '';
      html.style.backgroundPosition = '';
      html.style.backgroundRepeat = '';
      html.style.backgroundAttachment = '';
      html.style.background = '';
      body.style.background = '';
    };
  }, [localProfile]);

  const createMutation = useMutation({
    mutationFn: (data) => db.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['userProfiles', user?.id] });
      setLocalProfile(created);
      setActiveProfileId(created.id);
      setHasChanges(false);
      toast.success('Profil créé !');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.update(id, data),
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['userProfiles', user?.id] });
      toast.success('Modifications sauvegardées !');
    },
    onError: (e) => toast.error('Erreur : ' + e.message),
  });

  const handleCreateProfile = () => {
    if (profiles.length >= limits.maxProfiles) {
      toast.error('Limite atteinte — votre offre ' + limits.label + ' autorise ' + limits.maxProfiles + ' profil(s) maximum.');
      return;
    }
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    createMutation.mutate({
      user_id: user.id,
      display_name: 'Mon Profil ' + (profiles.length + 1),
      bio: '', links: [], theme_color: '#6366f1',
      expiry_date: expiry.toISOString().split('T')[0],
      is_verified: false, is_event: false, is_activated: false,
      plan: userPlan,
    });
  };

  const updateLocal = useCallback((updates) => {
    setLocalProfile(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    if (!localProfile || updateMutation.isPending || !hasChanges) return;
    updateMutation.mutate({ id: localProfile.id, data: {
      display_name: localProfile.display_name,
      bio: localProfile.bio,
      links: localProfile.links,
      theme_color: localProfile.theme_color,
      expiry_date: localProfile.expiry_date,
      ...(isActivated && localProfile.username
        ? { username: localProfile.username.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }
        : {}),
      is_verified: localProfile.is_verified || false,
      is_event: localProfile.is_event || false,
      event_name: localProfile.event_name || null,
      event_date: localProfile.event_date || null,
      event_location: localProfile.event_location || null,
      event_color1: localProfile.event_color1 || null,
      event_color2: localProfile.event_color2 || null,
      event_booking_url: localProfile.event_booking_url || null,
      event_description: localProfile.event_description || null,
      event_image_url: localProfile.event_image_url || null,
      bg_image_url: localProfile.bg_image_url || null,
    }});
  };

  const handleAddPlatform = (key) => {
    const currentLinks = localProfile?.links || [];
    if (currentLinks.length >= limits.maxLinks) {
      toast.error('Limite atteinte — votre offre ' + limits.label + ' autorise ' + limits.maxLinks + ' liens maximum.');
      return;
    }
    updateLocal({ links: [...currentLinks, { id: crypto.randomUUID(), platform: key, url: '', label: '', enabled: true }] });
    setShowAddDialog(false);
  };

  const handleUpdateLink = useCallback((index, updated) => {
    const l = [...(localProfile?.links || [])];
    l[index] = updated;
    updateLocal({ links: l });
  }, [localProfile, updateLocal]);

  const handleRemoveLink = useCallback((index) => {
    const l = (localProfile?.links || []).filter((_, i) => i !== index);
    updateLocal({ links: l });
  }, [localProfile, updateLocal]);

  const handleEventImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size / 1024 > MAX_SIZE_KB) { toast.error('Image trop lourde ! Max 2 Mo'); return; }
    setUploadingEventImage(true);
    try {
      const fileName = 'event-' + localProfile.id + '-' + Date.now() + '.' + file.name.split('.').pop();
      const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      updateLocal({ event_image_url: data.publicUrl });
      toast.success('Image uploadée !');
    } catch (err) { toast.error('Erreur : ' + err.message); }
    finally { setUploadingEventImage(false); e.target.value = ''; }
  };

  const handleBgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size / 1024 > MAX_SIZE_KB) { toast.error('Image trop lourde ! Max 2 Mo'); return; }
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

  const handleSignOut = async () => {
    if (hasChanges && !window.confirm('Des modifications non sauvegardées seront perdues. Se déconnecter ?')) return;
    await signOut();
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!profiles.length && !createMutation.isPending) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg,#0f0a1e,#2d1b69)' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center max-w-sm">
        <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width:'80px', height:'80px', borderRadius:'24px', objectFit:'cover', margin:'0 auto 24px', display:'block', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }} />
        <h1 className="text-2xl font-bold mb-2 text-white">Bienvenue !</h1>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:`${limits.color}20`, border:`1px solid ${limits.color}40`, borderRadius:'100px', padding:'4px 14px', marginBottom:'12px' }}>
          <span style={{ fontSize:'14px' }}>{limits.emoji}</span>
          <span style={{ color: limits.color, fontSize:'12px', fontWeight:700 }}>Offre {limits.label}</span>
        </div>
        <p className="text-white/60 text-sm mb-6">{limits.maxLinks} liens · {limits.maxProfiles} profil{limits.maxProfiles > 1 ? 's' : ''} · {limits.hasStats ? 'Stats incluses' : 'Stats non incluses'}</p>
        <Button onClick={handleCreateProfile} size="lg" className="rounded-xl gap-2" disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Créer mon profil
        </Button>
      </motion.div>
    </div>
  );

  if (!localProfile) return null;

  const colors = parseColors(localProfile.theme_color);
  const links = localProfile.links || [];
  const atLinkLimit = links.length >= limits.maxLinks;
  const atProfileLimit = profiles.length >= limits.maxProfiles;

  return (
    <>
      <div className="min-h-screen" style={{ background: localProfile.bg_image_url ? undefined : 'linear-gradient(135deg,' + colors.bg1 + ',' + colors.bg2 + ')' }}>

        {/* ── Top Bar ── */}
        <div className="sticky top-0 z-20 bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width:'32px', height:'32px', borderRadius:'8px', objectFit:'cover' }} />
              <div>
                <h1 className="font-bold text-base text-white leading-none">SocialApp</h1>
                {/* ✅ Affiche maintenant le bon plan */}
                <span style={{ fontSize:'9px', color: limits.color, fontWeight:700, background:`${limits.color}20`, padding:'1px 6px', borderRadius:'20px', letterSpacing:'0.05em', display:'inline-block', marginTop:'2px' }}>
                  {limits.emoji} {limits.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeColorPicker profile={localProfile} onUpdate={updateLocal} />
              <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending} className="rounded-xl gap-2" size="sm">
                {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Sauvegarder
              </Button>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10" title={user?.email}>
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bandeau non activé */}
        {!isActivated && (
          <div style={{ background:'rgba(0,87,255,0.12)', borderBottom:'1px solid rgba(0,87,255,0.25)', padding:'8px 16px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
            <AlertCircle size={14} color="#60a5fa" />
            <span style={{ color:'#93c5fd', fontSize:'12px' }}>
              Compte en attente d'activation — certaines fonctionnalités sont verrouillées.
            </span>
          </div>
        )}

        <style>{`
          .db-col-left   { display: flex; flex-direction: column; gap: 16px; }
          .db-col-center { display: flex; flex-direction: column; gap: 16px; }
          .db-col-right  { display: flex; flex-direction: column; gap: 16px; }
          .db-layout { display: flex; flex-direction: column; gap: 16px; }
          @media (min-width: 768px) {
            .db-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
            .db-col-left   { grid-column: 1; }
            .db-col-center { grid-column: 2; }
            .db-col-right  { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          }
          @media (min-width: 1100px) {
            .db-layout { grid-template-columns: 230px 1fr 270px; }
            .db-col-right { grid-column: 3; display: flex; flex-direction: column; gap: 16px; }
          }
        `}</style>

        <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'24px 16px' }}>
          <div className="db-layout">

            {/* ══ COLONNE GAUCHE ══ */}
            <div className="db-col-left">

              <QRCodeDisplay profileId={localProfile.id} username={localProfile.username} />

              <div className="bg-white/20 rounded-2xl border border-white/20 px-4 py-3 flex items-center gap-3">
                <CalendarClock className="w-4 h-4 text-white/60 shrink-0" />
                <div style={{ flex:1 }}>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'13px', margin:0 }}>Abonnement jusqu'au</p>
                  <p style={{ color:'white', fontSize:'14px', fontWeight:600, margin:'2px 0 0' }}>
                    {localProfile.expiry_date
                      ? new Date(localProfile.expiry_date).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
                      : '—'}
                  </p>
                </div>
                <div style={{ background:'#dcfce7', borderRadius:'8px', padding:'4px 8px', flexShrink:0 }}>
                  <span style={{ color:'#166534', fontSize:'11px', fontWeight:600 }}>12 mois</span>
                </div>
              </div>

              <div style={{ background: isActivated ? 'rgba(34,197,94,0.1)' : 'rgba(0,87,255,0.1)', border:'1px solid ' + (isActivated ? 'rgba(34,197,94,0.3)' : 'rgba(0,87,255,0.3)'), borderRadius:'16px', padding:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background: isActivated ? 'rgba(34,197,94,0.2)' : 'rgba(0,87,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {isActivated ? <CheckCircle size={18} color="#22c55e" /> : <Lock size={18} color="#60a5fa" />}
                  </div>
                  <div>
                    <p style={{ color:'white', fontSize:'13px', fontWeight:600, margin:0 }}>
                      {isActivated ? '✅ Compte activé' : '⏳ Compte non activé'}
                    </p>
                    <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'11px', margin:'2px 0 0' }}>
                      {isActivated ? 'Toutes les fonctionnalités disponibles' : 'Contactez le support pour activer'}
                    </p>
                  </div>
                </div>
                {!isActivated && (
                  <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginTop:'10px', padding:'8px', background:'#25D366', borderRadius:'10px', color:'white', fontSize:'12px', fontWeight:600, textDecoration:'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.2 13.8c-.2.6-1.3 1.2-1.8 1.2-.5.1-1.1.1-1.6-.1-1-.3-2-1-2.8-1.8A9.2 9.2 0 0 1 9 12.4c-.2-.5-.2-1-.1-1.5.1-.5.6-1.1 1-1.3.3-.1.5-.1.7 0 .2 0 .3 0 .4.3l.6 1.6c0 .1.1.3 0 .4-.1.2-.2.3-.3.4-.1.1-.3.3-.2.5.4.7 1 1.3 1.7 1.7.2.1.4 0 .5-.1l.5-.6c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.4.1.3 0 .8-.2 1z"/></svg>
                    Contacter le support
                  </a>
                )}
              </div>

              {limits.maxProfiles > 1 && (
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm">Mes profils</h3>
                    <span className="text-xs text-muted-foreground">{profiles.length} / {limits.maxProfiles}</span>
                  </div>
                  <div className="space-y-1">
                    {profiles.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => { setActiveProfileId(p.id); setLocalProfile(p); setHasChanges(false); }}>
                        <span className={'text-sm ' + (localProfile.id === p.id ? 'font-semibold text-primary' : 'text-foreground')}>{p.display_name || 'Sans nom'}</span>
                        {localProfile.id === p.id && <CheckCircle size={14} className="text-primary" />}
                      </div>
                    ))}
                  </div>
                  {!atProfileLimit && (
                    <button onClick={handleCreateProfile} className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-primary hover:bg-primary/10 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Nouveau profil
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ══ COLONNE CENTRE ══ */}
            <div className="db-col-center">

              <div className="bg-white/20 rounded-2xl border border-white/20 overflow-hidden">
                <ProfileHeader profile={localProfile} onUpdate={updateLocal} />
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', margin:'0 16px' }} />
                <div
                  onClick={() => !isActivated && setShowWaveModal(true)}
                  style={{ cursor: !isActivated ? 'pointer' : 'default' }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <AtSign className="w-4 h-4 text-white/60 shrink-0" />
                  <span className="text-white/70 text-sm shrink-0">Username :</span>
                  {isActivated ? (
                    <input type="text" value={localProfile.username || ''} onChange={e => updateLocal({ username: e.target.value })} placeholder="ex: hubson"
                      className="bg-transparent text-white text-sm focus:outline-none flex-1 min-w-0 placeholder-white/30" onClick={e => e.stopPropagation()} />
                  ) : (
                    <div style={{ flex:1, display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ flex:1, background:'rgba(0,0,0,0.2)', borderRadius:'10px', padding:'6px 10px', border:'1px dashed rgba(255,255,255,0.15)', display:'flex', alignItems:'center', gap:'6px' }}>
                        <Lock size={12} color="rgba(255,255,255,0.35)" />
                        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', fontStyle:'italic' }}>{localProfile.username || 'ex: hubson'}</span>
                      </div>
                      <div style={{ background:'rgba(0,87,255,0.2)', border:'1px solid rgba(0,87,255,0.4)', borderRadius:'8px', padding:'4px 8px', display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
                        <Lock size={10} color="#60a5fa" />
                        <span style={{ fontSize:'10px', color:'#60a5fa', fontWeight:600 }}>Pro</span>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', margin:'0 16px' }} />
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="w-4 h-4 text-white/60 shrink-0" />
                    <div>
                      <span className="text-white/70 text-sm">Badge vérifié</span>
                      <p className="text-white/40 text-xs">Affiche ✓ vert sur votre profil public</p>
                    </div>
                  </div>
                  <button onClick={() => updateLocal({ is_verified: !localProfile.is_verified })}
                    style={{ width:'44px', height:'24px', borderRadius:'100px', background: localProfile.is_verified ? '#22c55e' : 'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.3s', flexShrink:0 }}>
                    <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'white', position:'absolute', top:'3px', left: localProfile.is_verified ? '23px' : '3px', transition:'left 0.3s' }} />
                  </button>
                </div>
              </div>

              {/* MODE ÉVÉNEMENT */}
              <div className="bg-white/20 rounded-2xl border border-white/20 px-4 py-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-4 h-4 text-white/60 shrink-0" />
                    <div>
                      <span className="text-white/70 text-sm">Mode Événement</span>
                      <p className="text-white/40 text-xs">Ajoutez l'image de votre événement</p>
                    </div>
                  </div>
                  <button onClick={() => updateLocal({ is_event: !localProfile.is_event })}
                    style={{ width:'44px', height:'24px', borderRadius:'100px', background: localProfile.is_event ? 'linear-gradient(135deg,#ff6b35,#f7c948)' : 'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.3s', flexShrink:0 }}>
                    <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'white', position:'absolute', top:'3px', left: localProfile.is_event ? '23px' : '3px', transition:'left 0.3s' }} />
                  </button>
                </div>
                {localProfile.is_event && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {["Nom de l'événement", 'Date & heure', "Lieu de l'événement", 'Description / programme', 'Lien de réservation'].map(label => (
                      <div key={label} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <Lock size={13} color="rgba(255,255,255,0.2)" style={{ flexShrink:0 }} />
                        <LockedField placeholder={label} />
                      </div>
                    ))}
                    <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'14px', padding:'12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
                        <ImagePlus size={14} color="rgba(255,255,255,0.5)" />
                        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)' }}>
                          Image de l'événement — <span style={{ color:'#a5b4fc', fontWeight:600 }}>disponible sans activation</span>
                        </span>
                      </div>
                      {localProfile.event_image_url ? (
                        <div style={{ position:'relative', borderRadius:'10px', overflow:'hidden' }}>
                          <img src={localProfile.event_image_url} alt="event" style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', display:'block' }} />
                          <button onClick={() => updateLocal({ event_image_url: null })} style={{ position:'absolute', top:'8px', right:'8px', width:'26px', height:'26px', borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={13} color="white" /></button>
                        </div>
                      ) : (
                        <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'rgba(255,255,255,0.06)', border:'2px dashed rgba(255,255,255,0.15)', borderRadius:'10px', padding:'16px', cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:'13px' }}>
                          {uploadingEventImage ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                          {uploadingEventImage ? 'Upload...' : 'Ajouter une image'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleEventImageUpload} disabled={uploadingEventImage} />
                        </label>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(0,87,255,0.08)', border:'1px solid rgba(0,87,255,0.2)', borderRadius:'10px', padding:'8px 12px' }}>
                      <Lock size={12} color="#60a5fa" style={{ flexShrink:0 }} />
                      <span style={{ color:'#93c5fd', fontSize:'11px' }}>Les autres champs seront accessibles après l'activation de votre compte.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* PLATEFORMES */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-base text-white">Mes plateformes</h2>
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => setShowAddDialog(true)} disabled={atLinkLimit}>
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </Button>
                </div>
                <PlanLimitBanner limits={limits.maxLinks} currentCount={links.length} type="liens" />
                {links.length === 0 ? (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="bg-white/20 rounded-2xl border border-dashed border-white/30 p-10 text-center">
                    <p className="text-white/60 text-sm">Aucune plateforme ajoutée.<br />Cliquez sur <strong>Ajouter</strong> pour commencer.</p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {links.map((link, i) => (
                      <PlatformCard key={link.id || i} link={link} index={i} onUpdate={u => handleUpdateLink(i, u)} onRemove={() => handleRemoveLink(i)} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ══ COLONNE DROITE ══ */}
            <div className="db-col-right">

              {/* STATS */}
              {limits.hasStats ? (
                <StatsCard profileId={localProfile.id} />
              ) : (
                <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'16px', textAlign:'center' }}>
                  <BarChart2 size={24} color="rgba(255,255,255,0.2)" style={{ margin:'0 auto 8px' }} />
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', fontWeight:600, margin:'0 0 4px' }}>Statistiques</p>
                  <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'11px', margin:'0 0 12px' }}>Disponible avec l'offre PRO ou BUSINESS</p>
                  <a href="/" style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(255,140,0,0.15)', border:'1px solid rgba(255,140,0,0.3)', borderRadius:'10px', padding:'7px 14px', color:'#ff8c00', fontSize:'12px', fontWeight:600, textDecoration:'none' }}>
                    <Crown size={12} /> Upgrader mon offre
                  </a>
                </div>
              )}

              {/* ✅ FIX BUG 2 : maxProducts passé selon le plan réel
                  BASIC = 4 · PRO = 10 · BUSINESS = 10 */}
              {localProfile?.id && (
                <MarketplacePanel
                  profileId={localProfile.id}
                  maxProducts={limits.maxMarketplace}
                />
              )}

              {/* ✅ FIX BUG 2 : userPlan maintenant correct → maxDocs correct
                  BASIC = 1 · PRO = 3 · BUSINESS = 5
                  Le bouton "Ajouter" s'ouvre correctement */}
              {localProfile?.id && (
                <DocumentsPanel
                  profileId={localProfile.id}
                  userPlan={userPlan}
                />
              )}

            </div>
          </div>
        </div>
      </div>

      <AddPlatformDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSelect={handleAddPlatform} existingPlatforms={(localProfile.links || []).map(l => l.platform)} />
      {showPreview && <ProfilePreview profile={localProfile} onClose={() => setShowPreview(false)} />}

      <AnimatePresence>
        {showWaveModal && <WaveModal onClose={() => setShowWaveModal(false)} />}
      </AnimatePresence>
    </>
  );
}