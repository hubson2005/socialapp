import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, FileText, Eye, Copy, ExternalLink, Settings,
  Search, Inbox, Users, AlertTriangle, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import FormBuilder from './FormBuilder';
import FormPreview from './FormPreview';

// ─── Constantes ───────────────────────────────────────────────────────────────
const QUERY_KEY = ['adminAllForms'];

const STATUS_STYLES = {
  actif:     { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  inactif:   { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  brouillon: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
};

const BG_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#F59E0B', '#6366F1'];

const emptyForm = (profileId) => ({
  profile_id:        profileId || null,
  title:             '',
  description:       '',
  status:            'brouillon',
  fields:            [],
  bg_color:          '#F97316',
  thank_you_message: 'Merci pour votre réponse !',
  redirect_url:      '',
});

// ─── DB layer ─────────────────────────────────────────────────────────────────
const db = {
  listAll: async () => {
    // Fix #1 : on sélectionne explicitement submissions_count
    const { data, error } = await supabase
      .from('forms')
      .select('*, link_profiles(display_name, username), submissions_count:form_submissions(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Supabase renvoie submissions_count comme [{ count: N }] avec l'agrégat
    return (data || []).map(f => ({
      ...f,
      submissions_count: Array.isArray(f.submissions_count)
        ? (f.submissions_count[0]?.count ?? 0)
        : (f.submissions_count ?? 0),
    }));
  },

  create: async (data) => {
    const { data: created, error } = await supabase
      .from('forms').insert([data]).select().maybeSingle();
    if (error) throw error;
    if (!created) throw new Error('Aucune donnée retournée après création');
    return created;
  },

  update: async (id, data) => {
    const { data: updated, error } = await supabase
      .from('forms').update(data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!updated) throw new Error('Aucune donnée retournée après mise à jour');
    return updated;
  },

  remove: async (id) => {
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
};

// ─── Spinner CSS-inline (Fix #4 : sans Tailwind) ─────────────────────────────
function Spinner({ size = 16, color = 'rgba(99,102,241,0.7)' }) {
  return (
    <>
      <span style={{
        display: 'inline-block',
        width: size, height: size,
        border: `2px solid ${color}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'admin-spin 0.7s linear infinite',
        flexShrink: 0,
      }} />
      <style>{`@keyframes admin-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─── Modal de confirmation suppression (Fix #2) ───────────────────────────────
function DeleteConfirmModal({ form, onConfirm, onCancel, isPending }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }} onClick={onCancel}>
      <div
        style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '24px', maxWidth: '340px', width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
            <AlertTriangle size={16} />
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>Supprimer le formulaire</span>
          </div>
          <button type="button" onClick={onCancel} className="afp-icon-btn" style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '5px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 18px', lineHeight: 1.6 }}>
          Voulez-vous vraiment supprimer <strong style={{ color: 'white' }}>"{form?.title || 'Sans titre'}"</strong> ?
          Cette action est irréversible et supprimera toutes les réponses associées.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.85)', border: 'none', color: 'white', fontSize: '12px', fontWeight: 700, cursor: isPending ? 'default' : 'pointer', opacity: isPending ? 0.7 : 1 }}
          >
            {isPending && <Spinner size={12} color="rgba(255,255,255,0.8)" />}
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AdminFormsPanel({ profileId }) {
  const queryClient = useQueryClient();

  const [selectedForm,    setSelectedForm]    = useState(null);
  const [formData,        setFormData]        = useState(() => emptyForm(profileId));
  const [tab,             setTab]             = useState('builder');
  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('all');
  const [confirmDelete,   setConfirmDelete]   = useState(false); // Fix #2

  // Fix #8 : pas de refetch silencieux pendant qu'on édite
  const { data: allForms = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn:  db.listAll,
    refetchInterval:      30_000,
    refetchOnWindowFocus: false,
  });

  // Fix #6 : useMemo pour éviter le recalcul à chaque render
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allForms.filter(f => {
      const owner = f.link_profiles?.display_name || f.link_profiles?.username || '';
      const matchesSearch = !q
        || (f.title || '').toLowerCase().includes(q)
        || owner.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allForms, search, statusFilter]);

  // Fix #10 : mémoïsé une seule fois — construit l'URL publique sur le domaine
  // principal, PAS sur l'origine courante. Ce composant est servi depuis
  // admin.socialapp.work, qui n'a pas de route publique /form/:id ; seul le
  // domaine principal (socialapp.work) l'a. window.location.origin renvoyait
  // donc un lien mort qui retombait sur le dashboard admin.
  const baseUrl = useMemo(() => {
    const { protocol, host } = window.location;
    const publicHost = host.startsWith('admin.') ? host.slice('admin.'.length) : host;
    return `${protocol}//${publicHost}`;
  }, []);
  const publicUrl = useCallback((id) => `${baseUrl}/form/${id}`, [baseUrl]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => db.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setSelectedForm(created);
      toast.success('Formulaire créé !');
    },
    onError: (e) => toast.error('Erreur création : ' + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      // Fix #7 : updated ne peut plus être null (db.update lève une erreur sinon)
      setSelectedForm(updated);
      toast.success('Modifications sauvegardées !');
    },
    onError: (e) => toast.error('Erreur mise à jour : ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setSelectedForm(null);
      setFormData(emptyForm(profileId));
      setConfirmDelete(false);
      toast.success('Formulaire supprimé');
    },
    onError: (e) => {
      toast.error('Erreur suppression : ' + e.message);
      setConfirmDelete(false);
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelect = (form) => {
    setSelectedForm(form);
    setFormData({
      profile_id:        form.profile_id,
      title:             form.title             || '',
      description:       form.description       || '',
      status:            form.status            || 'brouillon',
      fields:            form.fields            || [],
      bg_color:          form.bg_color          || '#F97316',
      thank_you_message: form.thank_you_message || 'Merci pour votre réponse !',
      redirect_url:      form.redirect_url      || '',
    });
    setTab('builder');
  };

  const handleNew = () => {
    setSelectedForm(null);
    // Fix #5 : utilise le profileId courant à la création, pas celui capturé au montage
    setFormData(emptyForm(profileId));
    setTab('builder');
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Le titre du formulaire est requis');
      return;
    }
    // Fix #3 : on avertit mais on ne bloque plus la création côté admin
    if (!formData.profile_id) {
      toast.warning('Aucun profil associé — le formulaire sera créé sans propriétaire');
    }
    if (selectedForm) {
      updateMutation.mutate({ id: selectedForm.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCopyLink = (id) => {
    navigator.clipboard.writeText(publicUrl(id))
      .then(() => toast.success('Lien copié !'))
      .catch(() => toast.error('Impossible de copier le lien'));
  };

  const isSaving = updateMutation.isPending || createMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Fixes responsive tablette/mobile : grille qui s'empile, dvh au lieu de vh
          (Safari iOS), onglets scrollables au lieu de déborder, cibles tactiles
          agrandies sur écran tactile, inputs à 16px pour éviter le zoom auto iOS. */}
      <style>{`
        @media (max-width: 900px) {
          .afp-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .afp-panel input, .afp-panel textarea { font-size: 16px !important; }
          .afp-builder-grid { grid-template-columns: 1fr !important; }
        }
        .afp-tabbar-scroll {
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .afp-tabbar-scroll::-webkit-scrollbar { display: none; }
        .afp-tabbar-scroll button { flex-shrink: 0; }
        @media (max-width: 560px) {
          .afp-tabbar { flex-wrap: wrap; }
          .afp-tabbar-scroll { width: 100%; order: 1; }
          .afp-actions {
            margin-left: 0 !important;
            width: 100%;
            order: 2;
            justify-content: flex-end;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding-top: 8px !important;
          }
        }
        @media (pointer: coarse) {
          .afp-icon-btn { width: 40px !important; height: 40px !important; }
          .afp-swatch { width: 30px !important; height: 30px !important; }
        }
      `}</style>

      {/* Modal suppression */}
      {confirmDelete && (
        <DeleteConfirmModal
          form={selectedForm}
          onConfirm={() => deleteMutation.mutate(selectedForm.id)}
          onCancel={() => setConfirmDelete(false)}
          isPending={deleteMutation.isPending}
        />
      )}

      <div className="afp-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Formulaires — Vue admin</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
              {allForms.length} formulaire(s) sur tous les comptes
            </p>
          </div>
          <button
            type="button"
            onClick={handleNew}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={13} /> Nouveau formulaire
          </button>
        </div>

        {/* Bannière info si pas de profileId */}
        {!profileId && !selectedForm && (
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', padding: '10px 14px' }}>
            <p style={{ color: '#a78bfa', fontSize: '11.5px', margin: 0 }}>
              ℹ️ Aucun <code>profileId</code> fourni — les nouveaux formulaires seront créés sans propriétaire.
            </p>
          </div>
        )}

        <div className="afp-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,300px) 1fr', gap: '16px', alignItems: 'start' }}>

          {/* ── Liste + filtres ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Barre de recherche */}
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Titre ou propriétaire..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px 8px 28px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '12px', outline: 'none' }}
              />
            </div>

            {/* Filtres statut */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[['all','Tous'], ['actif','Actifs'], ['brouillon','Brouillons'], ['inactif','Inactifs']].map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setStatusFilter(v)}
                  style={{ padding: '5px 11px', borderRadius: '8px', border: '1px solid ' + (statusFilter === v ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'), background: statusFilter === v ? 'rgba(99,102,241,0.15)' : 'transparent', color: statusFilter === v ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: '10.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Liste des formulaires — Fix #9 : hauteur flexible, dvh pour Safari iOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 'calc(100dvh - 280px)', overflowY: 'auto' }}>
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                  <Spinner size={18} />
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '14px', padding: '24px 14px', textAlign: 'center' }}>
                  <Inbox size={22} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>Aucun formulaire trouvé</p>
                </div>
              ) : filtered.map(form => {
                const style     = STATUS_STYLES[form.status] || STATUS_STYLES.brouillon;
                const isSelected = selectedForm?.id === form.id;
                const owner     = form.link_profiles?.display_name || form.link_profiles?.username || 'Profil inconnu';
                return (
                  <div
                    key={form.id}
                    onClick={() => handleSelect(form)}
                    style={{ background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (isSelected ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'), borderRadius: '14px', padding: '12px', cursor: 'pointer', transition: 'background 0.15s' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0 }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', marginTop: '3px', flexShrink: 0, background: form.bg_color || '#F97316' }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ color: 'white', fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.title || 'Sans titre'}</p>
                          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10.5px', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={9} /> {owner}
                          </p>
                        </div>
                      </div>
                      <span style={{ background: style.bg, color: style.color, borderRadius: '6px', padding: '2px 7px', fontSize: '9.5px', fontWeight: 700, flexShrink: 0 }}>{form.status}</span>
                    </div>

                    {/* Fix #1 : submissions_count maintenant correctement résolu */}
                    {form.submissions_count > 0 && (
                      <p style={{ color: '#a78bfa', fontSize: '10.5px', margin: '6px 0 0' }}>{form.submissions_count} réponse(s)</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Éditeur ── */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>

            {/* Tabs */}
            <div className="afp-tabbar" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 14px' }}>
              <div className="afp-tabbar-scroll">
                {[
                  { key: 'builder',  label: 'Constructeur', icon: FileText  },
                  { key: 'preview',  label: 'Aperçu',       icon: Eye       },
                  { key: 'settings', label: 'Paramètres',   icon: Settings  },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 14px', fontSize: '12.5px', fontWeight: 600, border: 'none', whiteSpace: 'nowrap', borderBottom: '2px solid ' + (tab === key ? '#6366f1' : 'transparent'), background: 'transparent', color: tab === key ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>

              {/* Actions header */}
              <div className="afp-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', flexShrink: 0 }}>
                {/* Fix #2 : ouvre la modale au lieu de supprimer directement */}
                {selectedForm && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    title="Supprimer ce formulaire"
                    className="afp-icon-btn"
                    style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: isSaving ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '9px', color: 'white', fontSize: '11.5px', fontWeight: 700, cursor: isSaving ? 'default' : 'pointer', transition: 'background 0.2s' }}
                >
                  {isSaving && <Spinner size={12} color="rgba(255,255,255,0.8)" />}
                  {selectedForm ? 'Sauvegarder' : 'Créer'}
                </button>
              </div>
            </div>

            {/* Contenu des tabs — dvh pour Safari iOS */}
            <div style={{ padding: '18px', maxHeight: 'calc(100dvh - 240px)', overflowY: 'auto' }}>

              {/* ─ Builder ─ */}
              {tab === 'builder' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '560px' }}>
                  <div className="afp-builder-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>Titre *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                        placeholder="Mon formulaire"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: 'white', fontSize: '12.5px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>Couleur</label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
                        {BG_COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setFormData(f => ({ ...f, bg_color: c }))}
                            className="afp-swatch"
                            style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: formData.bg_color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                      placeholder="Courte description..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: 'white', fontSize: '12.5px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                    <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: '0 0 10px' }}>Champs du formulaire</p>
                    <FormBuilder
                      fields={formData.fields}
                      onChange={(fields) => setFormData(f => ({ ...f, fields }))}
                    />
                  </div>
                </div>
              )}

              {/* ─ Preview ─ */}
              {tab === 'preview' && (
                <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11.5px', marginBottom: '14px', textAlign: 'center' }}>Aperçu du formulaire</p>
                  <FormPreview form={formData} mode="preview" />
                </div>
              )}

              {/* ─ Settings ─ */}
              {tab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px' }}>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>Statut</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['brouillon', 'actif', 'inactif'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, status: s }))}
                          style={{ padding: '7px 13px', borderRadius: '9px', fontSize: '11.5px', fontWeight: 600, border: '1px solid ' + (formData.status === s ? '#6366f1' : 'rgba(255,255,255,0.1)'), background: formData.status === s ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', color: formData.status === s ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>Message de remerciement</label>
                    <textarea
                      value={formData.thank_you_message}
                      onChange={e => setFormData(f => ({ ...f, thank_you_message: e.target.value }))}
                      rows={2}
                      placeholder="Merci pour votre réponse !"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: 'white', fontSize: '12.5px', outline: 'none', resize: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>URL de redirection après soumission</label>
                    <input
                      type="text"
                      value={formData.redirect_url}
                      onChange={e => setFormData(f => ({ ...f, redirect_url: e.target.value }))}
                      placeholder="https://..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: 'white', fontSize: '12.5px', outline: 'none' }}
                    />
                  </div>

                  {selectedForm && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px' }}>
                      <p style={{ color: 'white', fontSize: '11.5px', fontWeight: 700, margin: '0 0 8px' }}>Lien de partage public</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ flex: 1, fontSize: '11px', color: '#a78bfa', background: 'rgba(0,0,0,0.3)', padding: '7px 10px', borderRadius: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {publicUrl(selectedForm.id)}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(selectedForm.id)}
                          title="Copier le lien"
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}
                        >
                          <Copy size={14} />
                        </button>
                        <a
                          href={publicUrl(selectedForm.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ouvrir dans un nouvel onglet"
                          style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', flexShrink: 0 }}
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}