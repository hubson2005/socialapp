import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Save, Loader2, Sparkles, Trash2, Check, ChevronLeft, ChevronRight, CalendarClock, LogOut, AtSign, Eye, CalendarDays, MapPin, BadgeCheck, Palette, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext.jsx';

import ProfileHeader from "@/components/dashboard/ProfileHeader";
import PlatformCard from "@/components/dashboard/PlatformCard";
import AddPlatformDialog from "@/components/dashboard/AddPlatformDialog";
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

const MAX_SIZE_KB = 2000;

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
  const [uploadingEventImage, setUploadingEventImage] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['linkProfiles'],
    queryFn: db.list,
  });

  useEffect(() => {
    if (!profiles.length) return;
    const target = profiles.find((p) => p.id === activeProfileId) || profiles[0];
    setLocalProfile((prev) => {
      if (!prev || prev.id !== target.id) return target;
      return prev;
    });
    setActiveProfileId((prev) => prev || target.id);
  }, [profiles, activeProfileId]);

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
    createMutation.mutate({
      display_name: 'Profil ' + ((profiles.length || 0) + 1),
      bio: '', links: [], theme_color: '#6366f1',
      expiry_date: expiry.toISOString().split('T')[0],
      is_verified: false, is_event: false,
    });
  };

  const handleSwitchProfile = useCallback((p) => {
    if (hasChanges && !window.confirm('Des modifications non sauvegardées seront perdues. Continuer ?')) return;
    setActiveProfileId(p.id);
    setLocalProfile(p);
    setHasChanges(false);
    setLinksPage(0);
  }, [hasChanges]);

  const handleDeleteProfile = useCallback((p) => {
    if (!window.confirm('Supprimer le profil "' + p.display_name + '" ?')) return;
    deleteMutation.mutate(p.id);
  }, [deleteMutation]);

  const updateLocal = useCallback((updates) => {
    setLocalProfile((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    if (!localProfile || updateMutation.isPending || !hasChanges) return;
    const data = {
      display_name: localProfile.display_name,
      bio: localProfile.bio,
      links: localProfile.links,
      theme_color: localProfile.theme_color,
      expiry_date: localProfile.expiry_date,
      username: localProfile.username ? localProfile.username.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : null,
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
    };
    updateMutation.mutate({ id: localProfile.id, data });
  };

  const handleEventImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const sizeKb = file.size / 1024;
    if (sizeKb > MAX_SIZE_KB) {
      toast.error('Image trop lourde ! Maximum ' + MAX_SIZE_KB + ' Ko (votre fichier : ' + Math.round(sizeKb) + ' Ko)');
      return;
    }

    setUploadingEventImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = 'event-' + localProfile.id + '-' + Date.now() + '.' + fileExt;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('link_profiles')
        .update({ event_image_url: data.publicUrl })
        .eq('id', localProfile.id);

      if (updateError) throw updateError;

      updateLocal({ event_image_url: data.publicUrl });
      toast.success('Image uploadée !');
    } catch (err) {
      toast.error('Erreur upload : ' + err.message);
    } finally {
      setUploadingEventImage(false);
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

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!profiles.length && !createMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent mx-auto mb-6 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Bienvenue !</h1>
          <p className="text-muted-foreground text-sm mb-6">Créez votre page de liens unique et partagez-la via un seul QR code.</p>
          <Button onClick={handleCreateProfile} size="lg" className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Créer mon profil
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
  const pagedProfiles = profiles.slice(profilesPage * PROFILES_PER_PAGE, (profilesPage + 1) * PROFILES_PER_PAGE);
  const totalProfilePages = Math.ceil(profiles.length / PROFILES_PER_PAGE);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, ' + colors.bg1 + ', ' + colors.bg2 + ')' }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
            <h1 className="font-bold text-lg text-white">SocialApp</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeColorPicker profile={localProfile} onUpdate={updateLocal} />
            <Button onClick={() => setShowPreview(true)} variant="outline" size="sm" className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10">
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Aperçu</span>
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending} className="rounded-xl gap-2" size="sm">
              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Sauvegarder
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="rounded-xl gap-2 border-white/20 text-white hover:bg-white/10" title={user?.email}>
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <ProfileHeader profile={localProfile} onUpdate={updateLocal} />

            {/* ✅ Username + Badge vérifié fusionnés */}
            <div className="bg-white/10 rounded-2xl border border-white/10 px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <AtSign className="w-4 h-4 text-white/60 shrink-0" />
                <span className="text-white/70 text-sm shrink-0">Username :</span>
                <input type="text" value={localProfile.username || ''} onChange={(e) => updateLocal({ username: e.target.value })} placeholder="ex: hubson" className="bg-transparent text-white text-sm focus:outline-none flex-1 min-w-0 placeholder-white/30" />
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

            {/* Mode Événement */}
            <div className="bg-white/10 rounded-2xl border border-white/10 px-4 py-3 space-y-3">
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
                <div className="space-y-2 pt-1 border-t border-white/10">
                  <input type="text" value={localProfile.event_name || ''} onChange={(e) => updateLocal({ event_name: e.target.value })} placeholder="Nom de l'événement" className="w-full bg-white/10 text-white text-sm focus:outline-none rounded-xl px-3 py-2 placeholder-white/30 border border-white/10" />
                  <input type="datetime-local" value={localProfile.event_date || ''} onChange={(e) => updateLocal({ event_date: e.target.value })} className="w-full bg-white/10 text-white text-sm focus:outline-none rounded-xl px-3 py-2 border border-white/10" />
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                    <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <input type="text" value={localProfile.event_location || ''} onChange={(e) => updateLocal({ event_location: e.target.value })} placeholder="Lieu de l'événement" className="bg-transparent text-white text-sm focus:outline-none flex-1 placeholder-white/30" />
                  </div>

                  <textarea
                    value={localProfile.event_description || ''}
                    onChange={(e) => updateLocal({ event_description: e.target.value })}
                    placeholder="Détails de l'événement (programme, infos pratiques...)"
                    rows={3}
                    className="w-full bg-white/10 text-white text-sm focus:outline-none rounded-xl px-3 py-2 placeholder-white/30 border border-white/10 resize-none"
                  />

                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                    <span style={{ fontSize: '13px' }}>🎟️</span>
                    <input type="url" value={localProfile.event_booking_url || ''} onChange={(e) => updateLocal({ event_booking_url: e.target.value })} placeholder="Lien de réservation (ex: https://...)" className="bg-transparent text-white text-sm focus:outline-none flex-1 placeholder-white/30" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ImagePlus className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-white/50 text-xs">Image de l'événement (max 2000 Ko)</span>
                    </div>
                    {localProfile.event_image_url ? (
                      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                        <img src={localProfile.event_image_url} alt="event" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                        <button
                          onClick={() => updateLocal({ event_image_url: null })}
                          style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={14} color="white" />
                        </button>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '16px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                        {uploadingEventImage ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                        {uploadingEventImage ? 'Upload en cours...' : 'Cliquez pour ajouter une image'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleEventImageUpload} disabled={uploadingEventImage} />
                      </label>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-white/50 text-xs">Couleur de fond de l'événement</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {EVENT_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => updateLocal({ event_color1: preset.c1, event_color2: preset.c2 })}
                          title={preset.label}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, ' + preset.c1 + ', ' + preset.c2 + ')', border: (localProfile.event_color1 === preset.c1) ? '2px solid white' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }}
                        />
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

            {/* Platforms */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-white">Mes plateformes</h2>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </Button>
            </div>

            {links.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/10 rounded-2xl border border-dashed border-white/20 p-10 text-center">
                <p className="text-white/60 text-sm">Aucune plateforme ajoutée.<br />Cliquez sur <strong>Ajouter</strong> pour commencer.</p>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pagedLinks.map((link, i) => {
                    const absoluteIndex = linksPage * LINKS_PER_PAGE + i;
                    return (
                      <PlatformCard key={link.id || link.platform + '-' + absoluteIndex} link={link} index={absoluteIndex} onUpdate={(updated) => handleUpdateLink(absoluteIndex, updated)} onRemove={() => handleRemoveLink(absoluteIndex)} />
                    );
                  })}
                </div>
                {totalLinkPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <button disabled={linksPage === 0} onClick={() => setLinksPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs disabled:opacity-30 hover:bg-white/20 transition-colors">Précédent</button>
                    <span className="text-white/50 text-xs">{linksPage + 1} / {totalLinkPages}</span>
                    <button disabled={linksPage >= totalLinkPages - 1} onClick={() => setLinksPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs disabled:opacity-30 hover:bg-white/20 transition-colors">Suivant</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right — ✅ Expiration déplacée ici */}
          <div className="space-y-4">
            <QRCodeDisplay profileId={localProfile.id} username={localProfile.username} />
            
            {/* ✅ Expiration entre QR code et Mes profils */}
            <div className="bg-white/10 rounded-2xl border border-white/10 px-4 py-3 flex items-center gap-3">
              <CalendarClock className="w-4 h-4 text-white/60 shrink-0" />
              <span className="text-white/70 text-sm shrink-0">Expiration :</span>
              <input type="date" value={localProfile.expiry_date || ''} onChange={(e) => updateLocal({ expiry_date: e.target.value })} className="bg-transparent text-white text-sm focus:outline-none flex-1 min-w-0" />
            </div>

            <StatsCard profileId={localProfile.id} />
            
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Mes profils</h3>
                <span className="text-xs text-muted-foreground">{profiles.length} profil{profiles.length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-1">
                {pagedProfiles.map((p) => {
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
                        {expiry && (
                          <span className={'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md mt-0.5 ' + expiry.color + ' ' + expiry.bg}>
                            <CalendarClock className="w-3 h-3" />{expiry.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                        {profiles.length > 1 && (
                          <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all" onClick={(e) => { e.stopPropagation(); handleDeleteProfile(p); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalProfilePages > 1 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <button disabled={profilesPage === 0} onClick={() => setProfilesPage((p) => p - 1)} className="p-1 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <span className="text-xs text-muted-foreground">{profilesPage + 1} / {totalProfilePages}</span>
                  <button disabled={profilesPage >= totalProfilePages - 1} onClick={() => setProfilesPage((p) => p + 1)} className="p-1 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <button onClick={handleCreateProfile} className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-primary hover:bg-primary/10 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Nouveau profil
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddPlatformDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSelect={handleAddPlatform} existingPlatforms={(localProfile.links || []).map((l) => l.platform)} />
      {showPreview && <ProfilePreview profile={localProfile} onClose={() => setShowPreview(false)} />}
    </div>
  );
}