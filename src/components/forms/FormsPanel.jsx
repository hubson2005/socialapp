import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, FileText, Eye, Copy, ExternalLink, Settings,
  Loader2, AlertCircle, Check, BarChart3, Inbox, RefreshCcw, Clock3, ImagePlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import FormBuilder from './FormBuilder';
import FormPreview from './FormPreview';

// [T1] [FIX THÈME] Ce panneau était entièrement en thème sombre (pas de
// modale ici — tout est posé directement dans le contenu du dashboard, qui
// est désormais clair #f4f5fa). Converti en thème clair : liste de
// formulaires, éditeur à onglets, constructeur, paramètres et réponses.
const STATUS_STYLES = {
  actif:     { bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.25)',  color: '#16a34a', dot: '#16a34a' },
  inactif:   { bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.22)',  color: '#dc2626', dot: '#dc2626' },
  brouillon: { bg: '#eef0f5',               border: '#e6e8f0',               color: '#6b7280', dot: '#a2a7b5' },
};

const BG_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#F59E0B', '#6366F1'];

const ACCENT_GRADIENT = 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 55%,#a855f7 100%)';

// Ratio d'une bannière façon Google Forms (recommandé ~1600×400px)
const BANNER_RATIO = '4 / 1';
const MAX_BANNER_SIZE = 3 * 1024 * 1024; // 3 Mo

const emptyForm = (profileId) => ({
  profile_id: profileId,
  title: '',
  description: '',
  status: 'brouillon',
  fields: [],
  bg_color: '#F97316',
  banner_url: '',
  thank_you_message: 'Merci pour votre réponse !',
  redirect_url: '',
});

// Normalise un formulaire (venant de la DB ou local) vers la forme exacte de `formData`,
// pour que la comparaison JSON de dirty-tracking soit stable peu importe la source.
const toFormData = (form) => ({
  title:             form.title             || '',
  description:       form.description       || '',
  status:            form.status            || 'brouillon',
  fields:            form.fields            || [],
  bg_color:          form.bg_color          || '#F97316',
  banner_url:        form.banner_url        || '',
  thank_you_message: form.thank_you_message || '',
  redirect_url:      form.redirect_url      || '',
});

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

// Copie robuste, en 3 paliers — chacun peut échouer pour des raisons différentes
// (permissions-policy bloquant clipboard-write, navigateur ancien, geste utilisateur
// perdu à cause d'un await trop tôt, etc.), donc on tente le suivant plutôt que
// d'abandonner. Les erreurs réelles sont loguées en console pour pouvoir diagnostiquer
// si le problème persiste malgré les 3 paliers.
const copyToClipboard = async (text) => {
  // Palier 1 — API Clipboard moderne (nécessite un contexte sécurisé + permission,
  // pas garantie selon les en-têtes Permissions-Policy du domaine d'hébergement).
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Lien copié !');
      return;
    } catch (err) {
      console.warn('[copyToClipboard] navigator.clipboard.writeText a échoué :', err);
    }
  }

  // Palier 2 — document.execCommand, plus ancien mais souvent encore autorisé
  // là où l'API Clipboard est bloquée par une politique de permissions.
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!ok) throw new Error('execCommand("copy") a renvoyé false');
    toast.success('Lien copié !');
    return;
  } catch (err) {
    console.warn('[copyToClipboard] execCommand fallback a échoué :', err);
  }

  // Palier 3 — copie automatique impossible : on guide vers la copie manuelle.
  toast.error('Copie automatique bloquée par le navigateur — cliquez sur le lien pour le sélectionner, puis Ctrl/Cmd+C');
};

// ─── DB layer (Supabase) ──────────────────────────────────────────────────
const db = {
  list: async (profileId) => {
    const { data, error } = await supabase
      .from('forms').select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  create: async (data) => {
    const { data: created, error } = await supabase
      .from('forms').insert([data]).select().maybeSingle();
    if (error) throw error;
    return created;
  },
  update: async (id, data) => {
    const { data: updated, error } = await supabase
      .from('forms').update(data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return updated;
  },
  remove: async (id) => {
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
  listSubmissions: async (formId) => {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

// ─── Shared input style — thème clair ──────────────────────────────────────
const fieldStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 13px',
  background: '#f6f7fb',
  border: '1px solid #e6e8f0',
  borderRadius: '10px', color: '#161a2e',
  fontSize: '13px', outline: 'none',
  transition: 'border-color 0.15s ease, background 0.15s ease',
};

const labelStyle = {
  color: '#8a90a2',
  fontSize: '10.5px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: '7px',
};

const cardShadow = '0 1px 2px rgba(15,23,42,0.05), 0 8px 20px -14px rgba(15,23,42,0.25)';

// ─── Main component ───────────────────────────────────────────────────────
export default function FormsPanel({ profileId, maxForms = 1, onUpgrade }) {
  const queryClient = useQueryClient();
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData]         = useState(emptyForm(profileId));
  // Snapshot du dernier état persisté (chargé depuis la DB ou juste sauvegardé).
  // Sert uniquement à savoir si `formData` a divergé depuis → bouton Sauvegarder actif ou grisé.
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(toFormData(emptyForm(profileId))));
  const [tab, setTab]                   = useState('builder');
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const fresh = emptyForm(profileId);
    setSelectedForm(null);
    setFormData(fresh);
    setSavedSnapshot(JSON.stringify(toFormData(fresh)));
    setTab('builder');
  }, [profileId]);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['forms', profileId],
    queryFn: () => db.list(profileId),
    enabled: !!profileId,
  });

  const {
    data: submissions = [],
    isLoading: submissionsLoading,
    refetch: refetchSubmissions,
    isFetching: submissionsFetching,
  } = useQuery({
    queryKey: ['form_submissions', selectedForm?.id],
    queryFn: () => db.listSubmissions(selectedForm.id),
    enabled: !!selectedForm?.id,
  });

  const atLimit = maxForms !== Infinity && forms.length >= maxForms && !selectedForm;

  const createMutation = useMutation({
    mutationFn: (data) => db.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['forms', profileId] });
      const next = toFormData(created);
      setSelectedForm(created);
      setFormData(next);
      setSavedSnapshot(JSON.stringify(next));
      toast.success('Formulaire créé !');
    },
    onError: (e) => toast.error('Erreur : ' + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['forms', profileId] });
      const next = toFormData(updated);
      setSelectedForm(updated);
      setFormData(next);
      setSavedSnapshot(JSON.stringify(next));
      toast.success('Modifications sauvegardées !');
    },
    onError: (e) => toast.error('Erreur : ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', profileId] });
      const fresh = emptyForm(profileId);
      setSelectedForm(null);
      setFormData(fresh);
      setSavedSnapshot(JSON.stringify(toFormData(fresh)));
      toast.success('Formulaire supprimé');
    },
    onError: (e) => toast.error('Erreur : ' + e.message),
  });

  // Rien de nouveau à persister par rapport au dernier état sauvegardé/chargé.
  const isDirty = JSON.stringify(formData) !== savedSnapshot;
  const pending = updateMutation.isPending || createMutation.isPending;
  const canSave = isDirty && !pending;

  const handleSelect = (form) => {
    const next = toFormData(form);
    setSelectedForm(form);
    setFormData(next);
    setSavedSnapshot(JSON.stringify(next));
    setTab('builder');
  };

  const handleNew = () => {
    if (atLimit) {
      toast.error(`Limite atteinte — ${maxForms} formulaire(s) max pour votre offre`);
      return;
    }
    const fresh = emptyForm(profileId);
    setSelectedForm(null);
    setFormData(fresh);
    setSavedSnapshot(JSON.stringify(toFormData(fresh)));
    setTab('builder');
  };

  const handleSave = () => {
    if (!formData.title.trim()) { toast.error('Le titre du formulaire est requis'); return; }
    if (selectedForm) {
      updateMutation.mutate({ id: selectedForm.id, data: formData });
    } else {
      if (atLimit) {
        toast.error(`Limite atteinte — ${maxForms} formulaire(s) max pour votre offre`);
        return;
      }
      createMutation.mutate({ ...formData, profile_id: profileId });
    }
  };

  const handleDelete = () => {
    const name = selectedForm.title?.trim() || 'Sans titre';
    if (!window.confirm(`Supprimer le formulaire « ${name} » ?\nCette action est irréversible.`)) return;
    deleteMutation.mutate(selectedForm.id);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Veuillez choisir un fichier image'); e.target.value = ''; return; }
    if (file.size > MAX_BANNER_SIZE) { toast.error('Image trop lourde (3 Mo maximum)'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => setFormData(prev => ({ ...prev, banner_url: reader.result }));
    reader.onerror = () => toast.error("Erreur lors de la lecture de l'image");
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const publicUrl = (id) => `${window.location.origin}/form/${id}`;

  const inputFocusStyle = (key) => focusedField === key
    ? { borderColor: 'rgba(139,92,246,0.55)', background: '#ffffff' }
    : {};

  const fieldLabelById = (id) => formData.fields.find(f => f.id === id)?.label || id;

  // Sélectionne tout le texte d'un élément au clic (fallback manuel si la copie auto échoue)
  const selectAllText = (e) => {
    const range = document.createRange();
    range.selectNodeContents(e.currentTarget);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  return (
    <div className="fp-panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Hover effects scoped to (hover: hover) so iOS/Android don't get "stuck" hover states after tap.
          Mobile breakpoints for the 2-col grid and iOS input zoom-on-focus fix. */}
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          .fp-panel .fp-card:not(.fp-card-selected):hover { border-color: #c9cddb !important; }
          .fp-panel .fp-btn-primary:hover { transform: translateY(-1px); }
          .fp-panel .fp-icon-delete:hover { background: rgba(220,38,38,0.14) !important; }
          .fp-panel .fp-swatch:hover { transform: scale(1.12); }
          .fp-panel .fp-refresh:hover { border-color: #c9cddb !important; }
          .fp-panel .fp-banner-drop:hover { border-color: rgba(139,92,246,0.4) !important; background: rgba(139,92,246,0.04) !important; }
          .fp-panel .fp-switch:not(.fp-switch-active):hover { background: #c9cddb !important; }
        }
        @media (max-width: 860px) {
          .fp-panel .fp-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .fp-panel input, .fp-panel textarea { font-size: 16px !important; }
          .fp-panel .fp-builder-grid { grid-template-columns: 1fr !important; }
        }
        /* [FIX] Barre d'onglets vs actions (Supprimer/Sauvegarder) — l'ancienne
           version ne détachait les actions sur leur propre ligne qu'en dessous de
           560px de VIEWPORT. Or ce panneau est rendu à l'intérieur d'un dashboard
           avec sidebar : sa largeur RÉELLE (le conteneur) peut être bien plus
           étroite que 560px de fenêtre sur desktop/tablette (sidebar dépliée +
           padding), ce qui faisait chevaucher "Réponses" et les boutons d'action
           (cf. capture). On détache désormais TOUJOURS les actions sur une
           deuxième ligne — plus de dépendance à la largeur de la fenêtre, donc
           correct quel que soit l'appareil (desktop étroit, tablette portrait/
           paysage, iOS, Android) sans jamais recouvrir un onglet. */
        .fp-panel .fp-tabbar { overflow: hidden; flex-wrap: wrap; }
        .fp-panel .fp-tabbar-scroll {
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          min-width: 0; /* essentiel : sans ça un enfant flex refuse de rétrécir sous la
                            largeur de son contenu, et c'est toute la ligne qui déborde
                            au lieu que cette zone scrolle toute seule */
          width: 100%;
          order: 1;
        }
        .fp-panel .fp-tabbar-scroll::-webkit-scrollbar { display: none; }
        .fp-panel .fp-tabbar-scroll button { flex-shrink: 0; }
        .fp-panel .fp-actions {
          margin-left: 0 !important;
          width: 100%;
          order: 2;
          justify-content: flex-end;
          border-top: 1px solid #eef0f5;
          padding-top: 9px !important;
        }
        /* Cibles tactiles agrandies sur tout écran tactile (tablette incluse, pas que mobile) */
        @media (pointer: coarse) {
          .fp-panel .fp-icon-delete { width: 40px !important; height: 40px !important; }
          .fp-panel .fp-swatch { width: 30px !important; height: 30px !important; }
          .fp-panel .fp-refresh { width: 34px !important; height: 34px !important; }
          .fp-panel .fp-switch { width: 46px !important; height: 27px !important; }
          .fp-panel .fp-switch .fp-switch-knob { width: 21px !important; height: 21px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: '#161a2e', fontSize: '19px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
            Formulaires
          </h2>
          <p style={{ color: '#8a90a2', fontSize: '12px', margin: '5px 0 0', fontVariantNumeric: 'tabular-nums' }}>
            {forms.length} / {maxForms === Infinity ? '∞' : maxForms} formulaire(s) utilisé(s)
          </p>
        </div>
        <button
          onClick={handleNew}
          disabled={atLimit}
          className={atLimit ? '' : 'fp-btn-primary'}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px',
            background: atLimit ? '#eef0f5' : ACCENT_GRADIENT,
            border: 'none', borderRadius: '11px',
            color: atLimit ? '#a2a7b5' : 'white',
            fontSize: '12.5px', fontWeight: 700,
            cursor: atLimit ? 'not-allowed' : 'pointer',
            boxShadow: atLimit ? 'none' : '0 1px 0 rgba(255,255,255,0.2) inset, 0 8px 20px -6px rgba(139,92,246,0.45)',
            transition: 'transform 0.12s ease, box-shadow 0.12s ease',
          }}
        >
          <Plus size={13} /> Nouveau formulaire
        </button>
      </div>

      {/* Limit banner */}
      {atLimit && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(220,38,38,0.08), rgba(220,38,38,0.03))',
          border: '1px solid rgba(220,38,38,0.2)', borderRadius: '13px', padding: '11px 15px',
          display: 'flex', alignItems: 'center', gap: '9px',
        }}>
          <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
          <span style={{ color: '#dc2626', fontSize: '12px', flex: 1 }}>
            Limite atteinte — {maxForms} formulaire(s) max pour votre offre actuelle
          </span>
          {onUpgrade && (
            <button onClick={onUpgrade} style={{ background: 'none', border: 'none', color: '#d9591f', fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Upgrader →
            </button>
          )}
        </div>
      )}

      <div className="fp-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px,290px) 1fr', gap: '18px', alignItems: 'start' }}>

        {/* ── Form list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '28px' }}>
              <Loader2 size={18} className="animate-spin" color="#8b5cf6" />
            </div>
          ) : forms.length === 0 ? (
            <div style={{
              background: '#f9fafc', border: '1.5px dashed #dde0ea',
              borderRadius: '16px', padding: '30px 16px', textAlign: 'center',
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '11px', margin: '0 auto 10px',
                background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={17} color="#7c3aed" />
              </div>
              <p style={{ color: '#454b5a', fontSize: '12.5px', fontWeight: 600, margin: 0 }}>Aucun formulaire</p>
              <p style={{ color: '#a2a7b5', fontSize: '11px', margin: '4px 0 0' }}>Créez-en un pour commencer</p>
            </div>
          ) : (
            forms.map(form => {
              const style      = STATUS_STYLES[form.status] || STATUS_STYLES.brouillon;
              const isSelected = selectedForm?.id === form.id;
              return (
                <div
                  key={form.id}
                  onClick={() => handleSelect(form)}
                  className={'fp-card' + (isSelected ? ' fp-card-selected' : '')}
                  style={{
                    position: 'relative',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))'
                      : '#ffffff',
                    border: '1px solid ' + (isSelected ? 'rgba(139,92,246,0.4)' : '#e6e8f0'),
                    borderRadius: '15px', padding: '13px', cursor: 'pointer',
                    boxShadow: isSelected
                      ? '0 0 0 3px rgba(139,92,246,0.08), 0 10px 24px -14px rgba(139,92,246,0.35)'
                      : cardShadow,
                    transition: 'border-color 0.15s ease, background 0.15s ease, transform 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', minWidth: 0 }}>
                      <div style={{
                        width: '11px', height: '11px', borderRadius: '4px', marginTop: '3px', flexShrink: 0,
                        background: form.bg_color || '#F97316',
                        boxShadow: `0 0 0 3px ${form.bg_color || '#F97316'}22`,
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: '#161a2e', fontSize: '13.5px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {form.title || 'Sans titre'}
                        </p>
                        <p style={{ color: '#8a90a2', fontSize: '10.5px', margin: '3px 0 0' }}>
                          {(form.fields || []).length} champ(s)
                        </p>
                      </div>
                    </div>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: style.bg, border: '1px solid ' + style.border,
                      color: style.color, borderRadius: '7px', padding: '3px 8px 3px 6px',
                      fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.03em', flexShrink: 0,
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
                      {form.status}
                    </span>
                  </div>
                  {(form.submissions_count > 0) && (
                    <p style={{ color: '#7c3aed', fontSize: '10.5px', fontWeight: 600, margin: '8px 0 0' }}>
                      {form.submissions_count} réponse(s)
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Editor ── */}
        <div style={{
          background: '#ffffff', border: '1px solid #e6e8f0',
          borderRadius: '20px', overflow: 'hidden', boxShadow: cardShadow,
        }}>

          {/* Tab bar */}
          <div style={{
            display: 'flex', alignItems: 'center',
            borderBottom: '1px solid #eef0f5', padding: '0 16px',
            background: '#f9fafc',
          }} className="fp-tabbar">
            <div className="fp-tabbar-scroll">
              {[
                { key: 'builder',   label: 'Constructeur', icon: FileText  },
                { key: 'preview',   label: 'Aperçu',       icon: Eye       },
                { key: 'settings',  label: 'Paramètres',   icon: Settings  },
                { key: 'responses', label: 'Réponses',     icon: BarChart3 },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '13px 15px', fontSize: '12.5px', fontWeight: 700,
                    border: 'none', whiteSpace: 'nowrap',
                    borderBottom: '2px solid ' + (tab === key ? '#8b5cf6' : 'transparent'),
                    background: 'transparent',
                    color: tab === key ? '#161a2e' : '#8a90a2',
                    cursor: 'pointer',
                    transition: 'color 0.15s ease',
                  }}
                >
                  <Icon size={13} /> {label}
                  {key === 'responses' && submissions.length > 0 && (
                    <span style={{
                      background: 'rgba(139,92,246,0.14)', color: '#7c3aed', borderRadius: '100px',
                      fontSize: '10px', fontWeight: 700, padding: '1px 6px', lineHeight: 1.5,
                    }}>
                      {submissions.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Action buttons — toujours sur leur propre ligne (voir .fp-actions dans le <style>) */}
            <div className="fp-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 0', flexShrink: 0 }}>
              {selectedForm && (
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  title="Supprimer ce formulaire"
                  className="fp-icon-delete"
                  style={{
                    width: '31px', height: '31px', borderRadius: '9px',
                    background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
                    color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: deleteMutation.isPending ? 'wait' : 'pointer',
                    opacity: deleteMutation.isPending ? 0.6 : 1,
                    transition: 'background 0.15s ease',
                  }}
                >
                  {deleteMutation.isPending
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Trash2 size={13} />
                  }
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!canSave}
                title={!isDirty && !pending ? 'Aucune modification à sauvegarder' : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '8px 16px',
                  background: canSave ? ACCENT_GRADIENT : '#eef0f5',
                  border: 'none', borderRadius: '10px',
                  color: canSave ? 'white' : '#a2a7b5',
                  fontSize: '11.5px', fontWeight: 700,
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  boxShadow: canSave ? '0 1px 0 rgba(255,255,255,0.2) inset, 0 6px 16px -8px rgba(139,92,246,0.5)' : 'none',
                  transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {pending ? <Loader2 size={12} className="animate-spin" /> : (!isDirty && <Check size={12} />)}
                {selectedForm ? 'Sauvegarder' : 'Créer'}
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div style={{ padding: '20px', maxHeight: 'calc(100dvh - 220px)', overflowY: 'auto' }}>

            {/* ── Builder ── */}
            {tab === 'builder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="fp-builder-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Titre du formulaire *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      onFocus={() => setFocusedField('title')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Mon formulaire"
                      style={{ ...fieldStyle, ...inputFocusStyle('title') }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Couleur</label>
                    <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', paddingTop: '5px' }}>
                      {BG_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setFormData({ ...formData, bg_color: c })}
                          className="fp-swatch"
                          style={{
                            width: '24px', height: '24px', borderRadius: '50%', background: c,
                            border: formData.bg_color === c ? '2px solid white' : '2px solid transparent',
                            boxShadow: formData.bg_color === c ? `0 0 0 3px ${c}55` : '0 0 0 1px #e6e8f0',
                            cursor: 'pointer',
                            transition: 'transform 0.12s ease',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Courte description..."
                    style={{ ...fieldStyle, ...inputFocusStyle('description') }}
                  />
                </div>

                {/* Bannière façon Google Forms, affichée en haut du formulaire public */}
                <div>
                  <label style={labelStyle}>Bannière (image d'en-tête)</label>
                  <p style={{ color: '#9095a5', fontSize: '10.5px', margin: '0 0 9px' }}>
                    Affichée en haut du formulaire. Format recommandé : 1600 × 400px (ratio 4:1).
                  </p>
                  {formData.banner_url ? (
                    <div style={{
                      position: 'relative', borderRadius: '13px', overflow: 'hidden',
                      border: '1px solid #e6e8f0', aspectRatio: BANNER_RATIO,
                      background: '#f1f2f7',
                    }}>
                      <img
                        src={formData.banner_url}
                        alt="Bannière du formulaire"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <button
                        onClick={() => setFormData({ ...formData, banner_url: '' })}
                        title="Retirer la bannière"
                        style={{
                          position: 'absolute', top: '8px', right: '8px',
                          width: '27px', height: '27px', borderRadius: '8px',
                          background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', backdropFilter: 'blur(4px)',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="fp-banner-upload"
                      className="fp-banner-drop"
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '7px', aspectRatio: BANNER_RATIO,
                        background: '#f9fafc', border: '1.5px dashed #dde0ea',
                        borderRadius: '13px', cursor: 'pointer', color: '#8a90a2',
                        transition: 'border-color 0.15s ease, background 0.15s ease',
                      }}
                    >
                      <ImagePlus size={18} color="#7c3aed" />
                      <span style={{ fontSize: '11.5px', fontWeight: 600 }}>Ajouter une bannière</span>
                      <input
                        id="fp-banner-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleBannerUpload}
                      />
                    </label>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #eef0f5', paddingTop: '16px' }}>
                  <p style={{ color: '#161a2e', fontSize: '13px', fontWeight: 700, margin: '0 0 11px', letterSpacing: '-0.005em' }}>
                    Champs du formulaire
                  </p>
                  <FormBuilder fields={formData.fields} onChange={fields => setFormData({ ...formData, fields })} />
                </div>
              </div>
            )}

            {/* ── Preview ── */}
            {tab === 'preview' && (
              <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                <p style={{ color: '#8a90a2', fontSize: '11.5px', marginBottom: '16px', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Aperçu du formulaire
                </p>
                <FormPreview form={formData} mode="preview" />
              </div>
            )}

            {/* ── Settings ── */}
            {tab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px' }}>
                <div>
                  <label style={labelStyle}>Statut</label>
                  {/* 3 interrupteurs on/off indépendants, un par statut (visuel façon
                      switch iOS : rond blanc à gauche = éteint, rond blanc à droite +
                      fond coloré = allumé). Comme un seul statut est stocké en base,
                      activer un interrupteur active CE statut et désactive
                      automatiquement les deux autres — un seul switch peut donc être
                      "allumé" à la fois. */}
                  <div style={{
                    background: '#f9fafc', border: '1px solid #eef0f5',
                    borderRadius: '13px', overflow: 'hidden',
                  }}>
                    {['brouillon', 'actif', 'inactif'].map((s, i) => {
                      const active = formData.status === s;
                      const style = STATUS_STYLES[s];
                      const labelText = s.charAt(0).toUpperCase() + s.slice(1);
                      return (
                        <div
                          key={s}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderTop: i === 0 ? 'none' : '1px solid #eef0f5',
                          }}
                        >
                          <span style={{ color: '#161a2e', fontSize: '12.5px', fontWeight: 600 }}>
                            {labelText}
                          </span>
                          <button
                            onClick={() => setFormData({ ...formData, status: s })}
                            role="switch"
                            aria-checked={active}
                            title={active ? `${labelText} activé` : `Activer « ${labelText} »`}
                            className={'fp-switch' + (active ? ' fp-switch-active' : '')}
                            style={{
                              width: '42px', height: '24px', borderRadius: '100px',
                              border: 'none', padding: '3px',
                              background: active ? style.color : '#d7dae3',
                              display: 'flex', alignItems: 'center',
                              justifyContent: active ? 'flex-end' : 'flex-start',
                              cursor: active ? 'default' : 'pointer',
                              transition: 'background 0.15s ease',
                              flexShrink: 0,
                            }}
                          >
                            <span
                              className="fp-switch-knob"
                              style={{
                                width: '18px', height: '18px', borderRadius: '50%',
                                background: '#ffffff',
                                boxShadow: '0 1px 3px rgba(15,23,42,0.35)',
                              }}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ color: '#9095a5', fontSize: '10.5px', margin: '8px 0 0' }}>
                    {formData.status === 'actif' ? 'Le lien public est accessible.' : 'Le lien public est désactivé.'}
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>Message de remerciement</label>
                  <textarea
                    value={formData.thank_you_message}
                    onChange={e => setFormData({ ...formData, thank_you_message: e.target.value })}
                    onFocus={() => setFocusedField('thanks')}
                    onBlur={() => setFocusedField(null)}
                    rows={2}
                    placeholder="Merci pour votre réponse !"
                    style={{ ...fieldStyle, ...inputFocusStyle('thanks'), resize: 'none' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>URL de redirection après soumission</label>
                  <input
                    type="text"
                    value={formData.redirect_url}
                    onChange={e => setFormData({ ...formData, redirect_url: e.target.value })}
                    onFocus={() => setFocusedField('redirect')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="https://..."
                    style={{ ...fieldStyle, ...inputFocusStyle('redirect') }}
                  />
                </div>

                {selectedForm && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(139,92,246,0))',
                    border: '1px solid rgba(139,92,246,0.18)', borderRadius: '13px', padding: '13px',
                  }}>
                    <p style={{ color: '#161a2e', fontSize: '11.5px', fontWeight: 700, margin: '0 0 9px' }}>
                      Lien de partage public
                    </p>
                    {selectedForm.status !== 'actif' && (
                      <p style={{ color: '#b45309', fontSize: '10.5px', margin: '0 0 9px' }}>
                        ⚠️ Passez le statut à « actif » pour rendre ce lien accessible publiquement.
                      </p>
                    )}
                    {/* Puce de lien : fond sombre volontaire, façon bloc de code —
                        contraste maximal pour l'URL quel que soit le thème de la page. */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code
                        onClick={selectAllText}
                        title="Cliquer pour sélectionner le lien"
                        style={{
                          flex: 1, fontSize: '11px', color: '#c4b5fd', background: '#181830',
                          padding: '8px 11px', borderRadius: '9px', overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.06)', cursor: 'text',
                          userSelect: 'all',
                        }}
                      >
                        {publicUrl(selectedForm.id)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(publicUrl(selectedForm.id))}
                        title="Copier le lien"
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', flexShrink: 0 }}
                      >
                        <Copy size={14} />
                      </button>
                      <a
                        href={publicUrl(selectedForm.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ouvrir dans un nouvel onglet"
                        style={{ color: '#6b7280', display: 'flex', flexShrink: 0 }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Réponses ── */}
            {tab === 'responses' && (
              <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                {!selectedForm ? (
                  <EmptyState
                    icon={Inbox}
                    title="Aucun formulaire sélectionné"
                    subtitle="Choisissez un formulaire dans la liste pour voir ses réponses."
                  />
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <p style={{ color: '#8a90a2', fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                        {submissions.length} réponse{submissions.length !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => refetchSubmissions()}
                        className="fp-refresh"
                        title="Actualiser"
                        style={{
                          width: '27px', height: '27px', borderRadius: '8px',
                          background: '#f6f7fb', border: '1px solid #e6e8f0',
                          color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'border-color 0.15s ease',
                        }}
                      >
                        <RefreshCcw size={12} className={submissionsFetching ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    {submissionsLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                        <Loader2 size={18} className="animate-spin" color="#8b5cf6" />
                      </div>
                    ) : submissions.length === 0 ? (
                      <EmptyState
                        icon={Inbox}
                        title="Aucune réponse"
                        subtitle="Les réponses s'afficheront ici dès qu'une personne remplira ce formulaire."
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {submissions.map(sub => (
                          <div
                            key={sub.id}
                            style={{
                              background: '#ffffff', border: '1px solid #e6e8f0',
                              borderRadius: '14px', padding: '14px 16px',
                              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                              <Clock3 size={11} color="#a2a7b5" />
                              <span style={{ color: '#8a90a2', fontSize: '10.5px', fontVariantNumeric: 'tabular-nums' }}>
                                {formatDate(sub.created_at)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                              {Object.entries(sub.data || {}).map(([fieldId, val]) => (
                                <div key={fieldId}>
                                  <p style={{ color: '#8a90a2', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 3px' }}>
                                    {fieldLabelById(fieldId)}
                                  </p>
                                  <p style={{ color: '#161a2e', fontSize: '12.5px', margin: 0, wordBreak: 'break-word' }}>
                                    {Array.isArray(val) ? val.join(', ') : String(val ?? '—')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── État vide partagé pour l'onglet Réponses ──────────────────────────────
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
      <div style={{
        width: '42px', height: '42px', borderRadius: '12px', margin: '0 auto 12px',
        background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={19} color="#7c3aed" />
      </div>
      <p style={{ color: '#454b5a', fontSize: '13px', fontWeight: 600, margin: 0 }}>{title}</p>
      {subtitle && <p style={{ color: '#9095a5', fontSize: '11.5px', margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
  );
}