import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Plus, Save, Loader2, Sparkles, Trash2, Check,
  ChevronLeft, ChevronRight, CalendarClock, LogOut,
  AtSign, Eye, CalendarDays, MapPin, BadgeCheck,
  ImagePlus, X, Lock, AlertCircle
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

// ─── DB helpers ──────────────────────────────────────────────────────────────
const db = {
  get: async (userId) => {
    const { data, error } = await supabase
      .from('link_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  create: async (data) => {
    const { data: created, error } = await supabase
      .from('link_profiles')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return created;
  },
  update: async (id, data) => {
    const { data: updated, error } = await supabase
      .from('link_profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },
};

const LINKS_PER_PAGE = 10;
const MAX_SIZE_KB = 2000;

const parseColors = (themeColor) => {
  if (themeColor && themeColor.includes('|')) {
    const parts = themeColor.split('|');
    return { bg1: parts[0], bg2: parts[1] };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

// ─── Composant champ verrouillé ───────────────────────────────────────────────
function LockedField({ placeholder }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
      background: 'rgba(0,0,0,0.2)', borderRadius: '10px',
      padding: '7px 10px', border: '1px dashed rgba(255,255,255,0.12)',
      opacity: 0.5,
    }}>
      <Lock size={11} color="rgba(255,255,255,0.4)" />
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
        {placeholder}
      </span>
    </div>
  );
}

// ─── Modal Wave Paiement ──────────────────────────────────────────────────────
function WaveModal({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0f0a1e',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '24px',
          padding: '28px 24px',
          maxWidth: '360px',
          width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          textAlign: 'center',
        }}
      >
        {/* Icône Wave */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #0057FF, #0099FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 24px rgba(0,87,255,0.4)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm5-3c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm5 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm2 5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>
          </svg>
        </div>

        <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>
          Activation du compte
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
          Pour activer votre profil et sauvegarder vos modifications, effectuez le paiement via Wave.
        </p>

        {/* Montant */}
        <div style={{
          background: 'rgba(0,87,255,0.1)', border: '1px solid rgba(0,87,255,0.25)',
          borderRadius: '14px', padding: '16px', marginBottom: '16px',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>Montant à envoyer</p>
          <p style={{ color: 'white', fontSize: '28px', fontWeight: 800, margin: '0 0 4px' }}>XXXXX FCFA</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>via Wave CI</p>
        </div>

        {/* Numéro */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: '12px',
          padding: '12px', marginBottom: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Numéro Wave</span>
          <span style={{ color: '#0099FF', fontSize: '16px', fontWeight: 700 }}>+225 05 76 03 12 12</span>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
          padding: '10px 12px', marginBottom: '20px',
          textAlign: 'left',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', lineHeight: 1.6 }}>
            📸 Après paiement, envoyez une capture d'écran au support WhatsApp. Votre compte sera activé sous <strong style={{ color: 'rgba(255,255,255,0.8)' }}>24h</strong>.
          </p>
        </div>

        {/* Bouton WhatsApp */}
        <a
          href="https://wa.me/2250576031212"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '12px',
            background: '#25D366', borderRadius: '12px',
            color: 'white', fontSize: '14px', fontWeight: 600,
            textDecoration: 'none', marginBottom: '10px',
            boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.2 13.8c-.2.6-1.3 1.2-1.8 1.2-.5.1-1.1.1-1.6-.1-1-.3-2-1-2.8-1.8A9.2 9.2 0 0 1 9 12.4c-.2-.5-.2-1-.1-1.5.1-.5.6-1.1 1-1.3.3-.1.5-.1.7 0 .2 0 .3 0 .4.3l.6 1.6c0 .1.1.3 0 .4-.1.2-.2.3-.3.4-.1.1-.3.3-.2.5.4.7 1 1.3 1.7 1.7.2.1.4 0 .5-.1l.5-.6c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.4.1.3 0 .8-.2 1z"/>
          </svg>
          Envoyer la preuve sur WhatsApp
        </a>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer',
          }}
        >
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function UserDashboard() {
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showWaveModal, setShowWaveModal] = useState(false);
  const [localProfile, setLocalProfile] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [linksPage, setLinksPage] = useState(0);
  const [uploadingEventImage, setUploadingEventImage] = useState(false);
  const [uploadingBgImage, setUploadingBgImage] = useState(false);
  const [showBgPanel, setShowBgPanel] = useState(false);
  const bgPanelRef = useRef(null);

  // Récupère le profil de l'utilisateur connecté
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => db.get(user.id),
    enabled: !!user?.id,
  });

  // is_activated vient de la table link_profiles (mis à true par l'admin)
  const isActivated = profile?.is_activated === true;

  useEffect(() => {
    if (!profile) return;
    setLocalProfile((prev) => {
      if (!prev || prev.id !== profile.id) return profile;
      return prev;
    });
  }, [profile]);

  // Fermer le panel bg au clic extérieur
  useEffect(() => {
    if (!showBgPanel) return;
    const handler = (e) => {
      if (bgPanelRef.current && !bgPanelRef.current.contains(e.target)) {
        setShowBgPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showBgPanel]);

  // Applique le fond sur <html>
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
      html.style.background = 'linear-gradient(160deg, ' + colors.bg1 + ', ' + colors.bg2 + ')';
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
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      setLocalProfile(created);
      setHasChanges(false);
      toast.success('Profil créé !');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.update(id, data),
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      toast.success('Modifications sauvegardées !');
    },
    onError: (error) => { toast.error('Erreur : ' + error.message); },
  });

  const handleCreateProfile = () => {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    createMutation.mutate({
      user_id: user.id,
      display_name: user.email?.split('@')[0] || 'Mon Profil',
      bio: '', links: [], theme_color: '#6366f1',
      expiry_date: expiry.toISOString().split('T')[0],
      is_verified: false, is_event: false, is_activated: false,
    });
  };

  const updateLocal = useCallback((updates) => {
    setLocalProfile((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Clic sur Sauvegarder : si non activé → modal Wave, sinon sauvegarde
  const handleSaveClick = () => {
    if (!isActivated) {
      setShowWaveModal(true);
      return;
    }
    handleSave();
  };

  const handleSave = () => {
    if (!localProfile || updateMutation.isPending || !hasChanges) return;
    const data = {
      display_name: localProfile.display_name,
      bio: localProfile.bio,
      links: localProfile.links,
      theme_color: localProfile.theme_color,
      expiry_date: localProfile.expiry_date,
      username: localProfile.username
        ? localProfile.username.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : null,
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
    };
    updateMutation.mutate({ id: localProfile.id, data });
  };

  const handleEventImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const sizeKb = file.size / 1024;
    if (sizeKb > MAX_SIZE_KB) {
      toast.error('Image trop lourde ! Maximum 2 Mo');
      return;
    }
    setUploadingEventImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = 'event-' + localProfile.id + '-' + Date.now() + '.' + fileExt;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      updateLocal({ event_image_url: data.publicUrl });
      toast.success('Image uploadée !');
    } catch (err) {
      toast.error('Erreur upload : ' + err.message);
    } finally {
      setUploadingEventImage(false);
    }
  };

  const handleBgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const sizeKb = file.size / 1024;
    if (sizeKb > MAX_SIZE_KB) {
      toast.error('Image trop lourde ! Maximum 2 Mo');
      return;
    }
    setUploadingBgImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = 'bg-' + localProfile.id + '-' + Date.now() + '.' + fileExt;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      updateLocal({ bg_image_url: data.publicUrl });
      toast.success('Image de fond appliquée !');
      setShowBgPanel(false);
    } catch (err) {
      toast.error('Erreur upload : ' + err.message);
    } finally {
      setUploadingBgImage(false);
    }
  };

  const handleAddPlatform = (platformKey) => {
    updateLocal({ links: [...(localProfile?.links || []), { id: crypto.randomUUID(), platform: platformKey, url: '', label: '', enabled: true }] });
    setShowAddDialog(false);
  };

  const handleUpdateLink = useCallback((index, updatedLink) => {
    const links = [...(localProfile?.links || [])];
    links[index] = updatedLink;
    updateLocal({ links });
  }, [localProfile, updateLocal]);

  const handleRemoveLink = useCallback((index) => {
    const links = (localProfile?.links || []).filter((_, i) => i !== index);
    updateLocal({ links });
    const maxPage = Math.max(0, Math.ceil(links.length / LINKS_PER_PAGE) - 1);
    setLinksPage((p) => Math.min(p, maxPage));
  }, [localProfile, updateLocal]);

  const handleSignOut = async () => {
    if (hasChanges && !window.confirm('Des modifications non sauvegardées seront perdues. Se déconnecter quand même ?')) return;
    await signOut();
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  // ── Pas encore de profil ───────────────────────────────────────────────────
  if (!profile && !createMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg,#0f0a1e,#2d1b69)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent mx-auto mb-6 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">Bienvenue !</h1>
          <p className="text-white/60 text-sm mb-6">Créez votre page de liens unique et partagez-la via un seul QR code.</p>
          <Button onClick={handleCreateProfile} size="lg" className="rounded-xl gap-2" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer mon profil
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!localProfile) return null;

  const colors = parseColors(localProfile.theme_color);
  const links = localProfile.links || [];
  const pagedLinks = links.slice(linksPage * LINKS_PER_PAGE, (linksPage + 1) * LINKS_PER_PAGE);
  const totalLinkPages = Math.ceil(links.length / LINKS_PER_PAGE);

  const bgStyle = localProfile.bg_image_url
    ? { backgroundImage: 'url(' + localProfile.bg_image_url + ')', backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, ' + colors.bg1 + ', ' + colors.bg2 + ')' };

  return (
    <>
      <div className="min-h-screen" style={bgStyle}>

        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
              <h1 className="font-bold text-lg text-white">SocialApp</h1>
            </div>

            <div className="flex items-center gap-2">
              <ThemeColorPicker profile={localProfile} onUpdate={updateLocal} />

              {/* Fond */}
              <div ref={bgPanelRef} style={{ position: 'relative' }}>
                <Button
                  onClick={() => setShowBgPanel((v) => !v)}
                  variant="outline" size="sm"
                  className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10"
                  style={localProfile.bg_image_url ? { borderColor: 'rgba(99,102,241,0.7)', background: 'rgba(99,102,241,0.2)' } : {}}
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fond</span>
                </Button>
                {showBgPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                      background: 'rgba(10,8,25,0.97)', backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px',
                      padding: '16px', minWidth: '240px', zIndex: 50,
                      boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>🖼️ Image de fond</span>
                      <button onClick={() => setShowBgPanel(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={13} />
                      </button>
                    </div>
                    {localProfile.bg_image_url && (
                      <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                        <img src={localProfile.bg_image_url} alt="fond" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                        <button onClick={() => { updateLocal({ bg_image_url: null }); setShowBgPanel(false); }} style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={12} color="white" />
                        </button>
                      </div>
                    )}
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '10px', padding: '16px', cursor: uploadingBgImage ? 'not-allowed' : 'pointer' }}>
                      {uploadingBgImage ? <Loader2 size={16} className="animate-spin" color="rgba(99,102,241,0.8)" /> : <ImagePlus size={16} color="rgba(255,255,255,0.5)" />}
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{uploadingBgImage ? 'Upload...' : localProfile.bg_image_url ? "Changer l'image" : "Choisir une image"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} disabled={uploadingBgImage} />
                    </label>
                  </motion.div>
                )}
              </div>

              <Button onClick={() => setShowPreview(true)} variant="outline" size="sm" className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10">
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Aperçu</span>
              </Button>

              {/* Bouton Sauvegarder — verrouillé si non activé */}
              <Button
                onClick={handleSaveClick}
                disabled={updateMutation.isPending}
                className="rounded-xl gap-2"
                size="sm"
                style={!isActivated ? { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' } : {}}
              >
                {updateMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : !isActivated
                    ? <Lock className="w-3.5 h-3.5" />
                    : <Save className="w-3.5 h-3.5" />
                }
                Sauvegarder
              </Button>

              <Button onClick={handleSignOut} variant="outline" size="sm" className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10" title={user?.email}>
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Bandeau compte non activé */}
        {!isActivated && (
          <div style={{ background: 'rgba(0,87,255,0.15)', borderBottom: '1px solid rgba(0,87,255,0.3)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertCircle size={14} color="#60a5fa" />
            <span style={{ color: '#93c5fd', fontSize: '13px' }}>
              Compte en attente d'activation — cliquez sur <strong>Sauvegarder</strong> pour obtenir les instructions de paiement.
            </span>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">

              <ProfileHeader profile={localProfile} onUpdate={updateLocal} />

              {/* Username + Badge */}
              <div className="bg-white/20 rounded-2xl border border-white/20 px-4 py-3 space-y-3">
                <div className="flex items-center gap-3">
                  <AtSign className="w-4 h-4 text-white/60 shrink-0" />
                  <span className="text-white/70 text-sm shrink-0">Username :</span>
                  <input type="text" value={localProfile.username || ''} onChange={(e) => updateLocal({ username: e.target.value })} placeholder="ex: monpseudo" className="bg-transparent text-white text-sm focus:outline-none flex-1 min-w-0 placeholder-white/30" />
                </div>
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="w-4 h-4 text-white/60 shrink-0" />
                    <div>
                      <span className="text-white/70 text-sm">Badge vérifié</span>
                      <p className="text-white/40 text-xs">Affiche ✓ vert sur votre profil public</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateLocal({ is_verified: !localProfile.is_verified })}
                    style={{ width: '44px', height: '24px', borderRadius: '100px', background: localProfile.is_verified ? '#22c55e' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: localProfile.is_verified ? '23px' : '3px', transition: 'left 0.3s' }} />
                  </button>
                </div>
              </div>

              {/* Mode Événement — champs verrouillés sauf image */}
              <div className="bg-white/20 rounded-2xl border border-white/20 px-4 py-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-4 h-4 text-white/60 shrink-0" />
                    <div>
                      <span className="text-white/70 text-sm">Mode Événement</span>
                      <p className="text-white/40 text-xs">Ajoute un compte à rebours sur votre profil</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateLocal({ is_event: !localProfile.is_event })}
                    style={{ width: '44px', height: '24px', borderRadius: '100px', background: localProfile.is_event ? 'linear-gradient(135deg, #ff6b35, #f7c948)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: localProfile.is_event ? '23px' : '3px', transition: 'left 0.3s' }} />
                  </button>
                </div>

                {localProfile.is_event && (
                  <div className="space-y-2 pt-2 border-t border-white/10">

                    {/* Champs verrouillés */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={13} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
                      <LockedField placeholder="Nom de l'événement — activez votre compte pour modifier" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={13} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
                      <LockedField placeholder="Date de l'événement" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={13} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
                      <LockedField placeholder="Lieu de l'événement" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={13} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
                      <LockedField placeholder="Description / programme" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={13} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
                      <LockedField placeholder="Lien de réservation" />
                    </div>

                    {/* Image — déverrouillée */}
                    <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', padding: '10px 12px' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <ImagePlus className="w-3.5 h-3.5 text-white/50" />
                        <span className="text-white/60 text-xs">Image de l'événement — <span style={{ color: '#a5b4fc' }}>disponible sans activation</span></span>
                      </div>
                      {localProfile.event_image_url ? (
                        <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                          <img src={localProfile.event_image_url} alt="event" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                          <button
                            onClick={() => updateLocal({ event_image_url: null })}
                            style={{ position: 'absolute', top: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={13} color="white" />
                          </button>
                        </div>
                      ) : (
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '10px', padding: '14px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                          {uploadingEventImage ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                          {uploadingEventImage ? 'Upload...' : 'Ajouter une image'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleEventImageUpload} disabled={uploadingEventImage} />
                        </label>
                      )}
                    </div>

                    {/* Message activation */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,87,255,0.08)', border: '1px solid rgba(0,87,255,0.2)', borderRadius: '10px', padding: '8px 12px' }}>
                      <Lock size={12} color="#60a5fa" style={{ flexShrink: 0 }} />
                      <span style={{ color: '#93c5fd', fontSize: '11px' }}>
                        Les autres champs seront accessibles après l'activation de votre compte.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Plateformes */}
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base text-white">Mes plateformes</h2>
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </Button>
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
                      return (
                        <PlatformCard
                          key={link.id || link.platform + '-' + absoluteIndex}
                          link={link}
                          index={absoluteIndex}
                          onUpdate={(updated) => handleUpdateLink(absoluteIndex, updated)}
                          onRemove={() => handleRemoveLink(absoluteIndex)}
                        />
                      );
                    })}
                  </div>
                  {totalLinkPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <button disabled={linksPage === 0} onClick={() => setLinksPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/25 text-white text-xs disabled:opacity-30 hover:bg-white/30 transition-colors">Précédent</button>
                      <span className="text-white/50 text-xs">{linksPage + 1} / {totalLinkPages}</span>
                      <button disabled={linksPage >= totalLinkPages - 1} onClick={() => setLinksPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/25 text-white text-xs disabled:opacity-30 hover:bg-white/30 transition-colors">Suivant</button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Colonne droite */}
            <div className="space-y-4">
              <QRCodeDisplay profileId={localProfile.id} username={localProfile.username} />

              {/* Expiration */}
              <div className="bg-white/20 rounded-2xl border border-white/20 px-4 py-3 flex items-center gap-3">
                <CalendarClock className="w-4 h-4 text-white/60 shrink-0" />
                <span className="text-white/70 text-sm shrink-0">Expiration :</span>
                <input type="date" value={localProfile.expiry_date || ''} onChange={(e) => updateLocal({ expiry_date: e.target.value })} className="bg-transparent text-white text-sm focus:outline-none flex-1 min-w-0" />
              </div>

              <StatsCard profileId={localProfile.id} />

              {/* Statut activation */}
              <div style={{
                background: isActivated ? 'rgba(34,197,94,0.1)' : 'rgba(0,87,255,0.1)',
                border: '1px solid ' + (isActivated ? 'rgba(34,197,94,0.3)' : 'rgba(0,87,255,0.3)'),
                borderRadius: '16px', padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: isActivated ? 'rgba(34,197,94,0.2)' : 'rgba(0,87,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isActivated
                      ? <Check size={18} color="#22c55e" />
                      : <Lock size={18} color="#60a5fa" />
                    }
                  </div>
                  <div>
                    <p style={{ color: 'white', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                      {isActivated ? 'Compte activé' : 'Compte non activé'}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>
                      {isActivated
                        ? 'Vous pouvez sauvegarder vos modifications'
                        : 'Cliquez sur Sauvegarder pour activer'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddPlatformDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSelect={handleAddPlatform} existingPlatforms={(localProfile.links || []).map((l) => l.platform)} />
      {showPreview && <ProfilePreview profile={localProfile} onClose={() => setShowPreview(false)} />}

      {/* Modal Wave */}
      <AnimatePresence>
        {showWaveModal && <WaveModal onClose={() => setShowWaveModal(false)} />}
      </AnimatePresence>
    </>
  );
}