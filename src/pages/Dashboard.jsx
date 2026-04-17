import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Save, Loader2, Sparkles, Trash2, Check, ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import ProfileHeader from "@/components/dashboard/ProfileHeader";
import PlatformCard from "@/components/dashboard/PlatformCard";
import AddPlatformDialog from "@/components/dashboard/AddPlatformDialog";
import QRCodeDisplay from "@/components/dashboard/QRCodeDisplay";
import ThemeColorPicker from "@/components/dashboard/ThemeColorPicker";

// ─── LocalStorage API ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'link_profiles';

import { supabase } from '../supabase'

const db = {
  list: async () => {
    const { data, error } = await supabase
      .from('link_profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },
  create: async (data) => {
    const { data: created, error } = await supabase
      .from('link_profiles')
      .insert([data])
      .select()
      .single()
    if (error) throw error
    return created
  },
  update: async (id, data) => {
    const { data: updated, error } = await supabase
      .from('link_profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated
  },
  delete: async (id) => {
    const { error } = await supabase
      .from('link_profiles')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { id }
  },
}
// ──────────────────────────────────────────────────────────────────────────────

const LINKS_PER_PAGE = 10;
const PROFILES_PER_PAGE = 10;

const getExpiryStatus = (expiry_date) => {
  if (!expiry_date) return null;
  const now = new Date();
  const exp = new Date(expiry_date);
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)
    return { label: 'Expiré', color: 'text-destructive', bg: 'bg-destructive/10' };
  if (diffDays <= 30)
    return { label: `${diffDays}j`, color: 'text-orange-500', bg: 'bg-orange-500/10' };
  return {
    label: exp.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    color: 'text-green-600',
    bg: 'bg-green-500/10',
  };
};

const parseColors = (themeColor) => {
  if (themeColor?.includes('|')) {
    const [bg1, bg2] = themeColor.split('|');
    return { bg1, bg2 };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [localProfile, setLocalProfile] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [linksPage, setLinksPage] = useState(0);
  const [profilesPage, setProfilesPage] = useState(0);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['linkProfiles'],
    queryFn: db.list,
  });

  // FIX: sync localProfile whenever activeProfileId or profiles changes
  useEffect(() => {
    if (!profiles.length) return;
    const target = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
    // Only reset if we're not editing — or if the active profile changed externally
    setLocalProfile((prev) => {
      if (!prev || prev.id !== target.id) return target;
      return prev; // keep local edits for the same profile
    });
    // FIX: ensure activeProfileId is always initialised
    setActiveProfileId((prev) => prev ?? target.id);
  }, [profiles, activeProfileId]);

  const deleteMutation = useMutation({
    mutationFn: (id) => db.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['linkProfiles'] });
      // FIX: reset to another profile after deletion
      setActiveProfileId((prev) => (prev === deletedId ? null : prev));
      setLocalProfile(null);
      toast.success('Profil supprimé !');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['linkProfiles'] });
      // FIX: immediately switch to the new profile
      setActiveProfileId(created.id);
      setLocalProfile(created);
      setHasChanges(false);
      toast.success('Profil créé !');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkProfiles'] });
      setHasChanges(false);
      toast.success('Modifications sauvegardées !');
    },
  });

  const handleCreateProfile = () => {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    createMutation.mutate({
      display_name: `Profil ${(profiles.length || 0) + 1}`,
      bio: '',
      links: [],
      theme_color: '#6366f1',
      expiry_date: expiry.toISOString().split('T')[0],
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
    if (!window.confirm(`Supprimer le profil "${p.display_name}" ?`)) return;
    deleteMutation.mutate(p.id);
  }, [deleteMutation]);

  const updateLocal = useCallback((updates) => {
    setLocalProfile((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    if (!localProfile) return;
    // FIX: only strip known system fields, handle missing keys safely
    const { id, created_date, updated_date, created_by, ...data } = localProfile;
    updateMutation.mutate({ id, data });
  };

  const handleAddPlatform = (platformKey) => {
    updateLocal({
      links: [
        ...(localProfile?.links ?? []),
        { platform: platformKey, url: '', label: '', enabled: true },
      ],
    });
    setShowAddDialog(false);
  };

  const handleUpdateLink = useCallback((index, updatedLink) => {
    const links = [...(localProfile?.links ?? [])];
    links[index] = updatedLink;
    updateLocal({ links });
  }, [localProfile, updateLocal]);

  const handleRemoveLink = useCallback((index) => {
    const links = (localProfile?.links ?? []).filter((_, i) => i !== index);
    updateLocal({ links });
    // FIX: adjust page if last item on current page was removed
    const newTotal = links.length;
    const maxPage = Math.max(0, Math.ceil(newTotal / LINKS_PER_PAGE) - 1);
    setLinksPage((p) => Math.min(p, maxPage));
  }, [localProfile, updateLocal]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profiles.length && !createMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent mx-auto mb-6 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Bienvenue !</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Créez votre page de liens unique et partagez-la via un seul QR code.
          </p>
          <Button onClick={handleCreateProfile} size="lg" className="rounded-xl gap-2">
            <Plus className="w-4 h-4" />
            Créer mon profil
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!localProfile) return null;

  const { bg1, bg2 } = parseColors(localProfile.theme_color);
  const links = localProfile.links ?? [];
  const pagedLinks = links.slice(linksPage * LINKS_PER_PAGE, (linksPage + 1) * LINKS_PER_PAGE);
  const totalLinkPages = Math.ceil(links.length / LINKS_PER_PAGE);
  const pagedProfiles = profiles.slice(profilesPage * PROFILES_PER_PAGE, (profilesPage + 1) * PROFILES_PER_PAGE);
  const totalProfilePages = Math.ceil(profiles.length / PROFILES_PER_PAGE);

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${bg1}, ${bg2})` }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-white">SocialApp</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeColorPicker profile={localProfile} onUpdate={updateLocal} />
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className="rounded-xl gap-2"
              size="sm"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4">
            <ProfileHeader profile={localProfile} onUpdate={updateLocal} />

            {/* Expiry */}
            <div className="bg-white/10 rounded-2xl border border-white/10 px-4 py-3 flex items-center gap-3">
              <CalendarClock className="w-4 h-4 text-white/60 shrink-0" />
              <span className="text-white/70 text-sm shrink-0">Expiration :</span>
              <input
                type="date"
                value={localProfile.expiry_date ?? ''}
                onChange={(e) => updateLocal({ expiry_date: e.target.value })}
                className="bg-transparent text-white text-sm focus:outline-none flex-1 min-w-0"
              />
            </div>

            {/* Links header */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-white">Mes plateformes</h2>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 text-xs"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </Button>
            </div>

            {links.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/10 rounded-2xl border border-dashed border-white/20 p-10 text-center"
              >
                <p className="text-white/60 text-sm">
                  Aucune plateforme ajoutée.<br />
                  Cliquez sur <strong>Ajouter</strong> pour commencer.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pagedLinks.map((link, i) => {
                    // FIX: correct absolute index across pages
                    const absoluteIndex = linksPage * LINKS_PER_PAGE + i;
                    return (
                      <PlatformCard
                        key={`${link.platform}-${absoluteIndex}`}
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
                    <button
                      disabled={linksPage === 0}
                      onClick={() => setLinksPage((p) => p - 1)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs disabled:opacity-30 hover:bg-white/20 transition-colors"
                    >
                      ← Précédent
                    </button>
                    <span className="text-white/50 text-xs">
                      {linksPage + 1} / {totalLinkPages}
                    </span>
                    <button
                      disabled={linksPage >= totalLinkPages - 1}
                      onClick={() => setLinksPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs disabled:opacity-30 hover:bg-white/20 transition-colors"
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right */}
          <div className="space-y-4">
            <QRCodeDisplay profileId={localProfile.id} />

            {/* Profile Switcher */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Mes profils</h3>
                <span className="text-xs text-muted-foreground">
                  {profiles.length} profil{profiles.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-1">
                {pagedProfiles.map((p) => {
                  const expiry = getExpiryStatus(p.expiry_date);
                  const isActive = localProfile?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      className="group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors hover:bg-muted"
                      onClick={() => handleSwitchProfile(p)}
                    >
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm truncate block ${
                            isActive ? 'font-semibold text-primary' : 'text-foreground'
                          }`}
                        >
                          {p.display_name || 'Sans nom'}
                        </span>
                        {expiry && (
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md mt-0.5 ${expiry.color} ${expiry.bg}`}
                          >
                            <CalendarClock className="w-3 h-3" />
                            {expiry.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                        {profiles.length > 1 && (
                          <button
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProfile(p);
                            }}
                          >
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
                  <button
                    disabled={profilesPage === 0}
                    onClick={() => setProfilesPage((p) => p - 1)}
                    className="p-1 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {profilesPage + 1} / {totalProfilePages}
                  </span>
                  <button
                    disabled={profilesPage >= totalProfilePages - 1}
                    onClick={() => setProfilesPage((p) => p + 1)}
                    className="p-1 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                onClick={handleCreateProfile}
                className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nouveau profil
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddPlatformDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSelect={handleAddPlatform}
        existingPlatforms={(localProfile.links ?? []).map((l) => l.platform)}
      />
    </div>
  );
}