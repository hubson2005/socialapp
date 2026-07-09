import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, FileText, Eye, Copy, ExternalLink, Settings,
  Loader2, AlertCircle, Check, BarChart3, Inbox, RefreshCcw, Clock3,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import FormBuilder from './FormBuilder';
import FormPreview from './FormPreview';

const STATUS_STYLES = {
  actif:     { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)', color: '#34d399', dot: '#34d399' },
  inactif:   { bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.24)', color: '#f87171', dot: '#f87171' },
  brouillon: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)',  color: 'rgba(255,255,255,0.5)', dot: 'rgba(255,255,255,0.35)' },
};

const BG_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#F59E0B', '#6366F1'];

const ACCENT_GRADIENT = 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 55%,#a855f7 100%)';

const emptyForm = (profileId) => ({
  profile_id: profileId,
  title: '',
  description: '',
  status: 'brouillon',
  fields: [],
  bg_color: '#F97316',
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
  thank_you_message: form.thank_you_message || '',
  redirect_url:      form.redirect_url      || '',
});

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
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

// ─── Shared input style ───────────────────────────────────────────────────
const fieldStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 13px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px', color: 'white',
  fontSize: '13px', outline: 'none',
  transition: 'border-color 0.15s ease, background 0.15s ease',
};

const labelStyle = {
  color: 'rgba(255,255,255,0.38)',
  fontSize: '10.5px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: '7px',
};

const cardShadow = '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 28px -12px rgba(0,0,0,0.5)';

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

  const publicUrl = (id) => `${window.location.origin}/form/${id}`;

  const inputFocusStyle = (key) => focusedField === key
    ? { borderColor: 'rgba(139,92,246,0.55)', background: 'rgba(139,92,246,0.06)' }
    : {};

  const fieldLabelById = (id) => formData.fields.find(f => f.id === id)?.label || id;

  return (
    <div className="fp-panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Hover effects scoped to (hover: hover) so iOS/Android don't get "stuck" hover states after tap.
          Mobile breakpoints for the 2-col grid and iOS input zoom-on-focus fix. */}
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          .fp-panel .fp-card:not(.fp-card-selected):hover { border-color: rgba(255,255,255,0.14) !important; }
          .fp-panel .fp-btn-primary:hover { transform: translateY(-1px); }
          .fp-panel .fp-icon-delete:hover { background: rgba(239,68,68,0.16) !important; }
          .fp-panel .fp-swatch:hover { transform: scale(1.12); }
          .fp-panel .fp-refresh:hover { border-color: rgba(255,255,255,0.22) !important; }
        }
        @media (max-width: 860px) {
          .fp-panel .fp-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .fp-panel input, .fp-panel textarea { font-size: 16px !important; }
          .fp-panel .fp-builder-grid { grid-template-columns: 1fr !important; }
        }
        /* Onglets scrollables horizontalement (au doigt) plutôt que de déborder ou wrapper —
           évite que "Sauvegarder"/"Réponses" se fassent couper, à toute largeur d'écran
           (notamment la zone tablette portrait/paysage où ni le style desktop ni le wrap
           mobile ne s'appliquaient). */
        .fp-panel .fp-tabbar-scroll {
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .fp-panel .fp-tabbar-scroll::-webkit-scrollbar { display: none; }
        .fp-panel .fp-tabbar-scroll button { flex-shrink: 0; }
        @media (max-width: 560px) {
          .fp-panel .fp-tabbar { flex-wrap: wrap; }
          .fp-panel .fp-tabbar-scroll { width: 100%; order: 1; }
          .fp-panel .fp-actions {
            margin-left: 0 !important;
            width: 100%;
            order: 2;
            justify-content: flex-end;
            border-top: 1px solid rgba(255,255,255,0.07);
            padding-top: 9px !important;
          }
        }
        /* Cibles tactiles agrandies sur tout écran tactile (tablette incluse, pas que mobile) */
        @media (pointer: coarse) {
          .fp-panel .fp-icon-delete { width: 40px !important; height: 40px !important; }
          .fp-panel .fp-swatch { width: 30px !important; height: 30px !important; }
          .fp-panel .fp-refresh { width: 34px !important; height: 34px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '19px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
            Formulaires
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.34)', fontSize: '12px', margin: '5px 0 0', fontVariantNumeric: 'tabular-nums' }}>
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
            background: atLimit ? 'rgba(255,255,255,0.05)' : ACCENT_GRADIENT,
            border: 'none', borderRadius: '11px',
            color: atLimit ? 'rgba(255,255,255,0.28)' : 'white',
            fontSize: '12.5px', fontWeight: 700,
            cursor: atLimit ? 'not-allowed' : 'pointer',
            boxShadow: atLimit ? 'none' : '0 1px 0 rgba(255,255,255,0.2) inset, 0 8px 20px -6px rgba(139,92,246,0.55)',
            transition: 'transform 0.12s ease, box-shadow 0.12s ease',
          }}
        >
          <Plus size={13} /> Nouveau formulaire
        </button>
      </div>

      {/* Limit banner */}
      {atLimit && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))',
          border: '1px solid rgba(239,68,68,0.22)', borderRadius: '13px', padding: '11px 15px',
          display: 'flex', alignItems: 'center', gap: '9px',
        }}>
          <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0 }} />
          <span style={{ color: '#f87171', fontSize: '12px', flex: 1 }}>
            Limite atteinte — {maxForms} formulaire(s) max pour votre offre actuelle
          </span>
          {onUpgrade && (
            <button onClick={onUpgrade} style={{ background: 'none', border: 'none', color: '#ff8c00', fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
              <Loader2 size={18} className="animate-spin" color="rgba(167,139,250,0.7)" />
            </div>
          ) : forms.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.025)', border: '1.5px dashed rgba(255,255,255,0.1)',
              borderRadius: '16px', padding: '30px 16px', textAlign: 'center',
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '11px', margin: '0 auto 10px',
                background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={17} color="rgba(167,139,250,0.6)" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', fontWeight: 600, margin: 0 }}>Aucun formulaire</p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: '4px 0 0' }}>Créez-en un pour commencer</p>
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
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(139,92,246,0.08))'
                      : 'rgba(255,255,255,0.035)',
                    border: '1px solid ' + (isSelected ? 'rgba(139,92,246,0.45)' : 'rgba(255,255,255,0.07)'),
                    borderRadius: '15px', padding: '13px', cursor: 'pointer',
                    boxShadow: isSelected
                      ? '0 0 0 3px rgba(139,92,246,0.1), 0 10px 24px -12px rgba(139,92,246,0.4)'
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
                        <p style={{ color: 'white', fontSize: '13.5px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {form.title || 'Sans titre'}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '10.5px', margin: '3px 0 0' }}>
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
                    <p style={{ color: '#a78bfa', fontSize: '10.5px', fontWeight: 600, margin: '8px 0 0' }}>
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
          background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px', overflow: 'hidden', boxShadow: cardShadow,
        }}>

          {/* Tab bar */}
          <div style={{
            display: 'flex', alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 16px',
            background: 'rgba(255,255,255,0.015)',
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
                    color: tab === key ? 'white' : 'rgba(255,255,255,0.38)',
                    cursor: 'pointer',
                    transition: 'color 0.15s ease',
                  }}
                >
                  <Icon size={13} /> {label}
                  {key === 'responses' && submissions.length > 0 && (
                    <span style={{
                      background: 'rgba(139,92,246,0.18)', color: '#c4b5fd', borderRadius: '100px',
                      fontSize: '10px', fontWeight: 700, padding: '1px 6px', lineHeight: 1.5,
                    }}>
                      {submissions.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="fp-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 0', flexShrink: 0 }}>
              {selectedForm && (
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  title="Supprimer ce formulaire"
                  className="fp-icon-delete"
                  style={{
                    width: '31px', height: '31px', borderRadius: '9px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)',
                    color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                  background: canSave ? ACCENT_GRADIENT : 'rgba(255,255,255,0.05)',
                  border: 'none', borderRadius: '10px',
                  color: canSave ? 'white' : 'rgba(255,255,255,0.28)',
                  fontSize: '11.5px', fontWeight: 700,
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  boxShadow: canSave ? '0 1px 0 rgba(255,255,255,0.2) inset, 0 6px 16px -6px rgba(139,92,246,0.5)' : 'none',
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
                            boxShadow: formData.bg_color === c ? `0 0 0 3px ${c}33` : 'none',
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

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px' }}>
                  <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: '0 0 11px', letterSpacing: '-0.005em' }}>
                    Champs du formulaire
                  </p>
                  <FormBuilder fields={formData.fields} onChange={fields => setFormData({ ...formData, fields })} />
                </div>
              </div>
            )}

            {/* ── Preview ── */}
            {tab === 'preview' && (
              <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '11.5px', marginBottom: '16px', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                  <div style={{ display: 'flex', gap: '7px' }}>
                    {['brouillon', 'actif', 'inactif'].map(s => {
                      const active = formData.status === s;
                      const style = STATUS_STYLES[s];
                      return (
                        <button
                          key={s}
                          onClick={() => setFormData({ ...formData, status: s })}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 700,
                            border: '1px solid ' + (active ? style.border : 'rgba(255,255,255,0.09)'),
                            background: active ? style.bg : 'rgba(255,255,255,0.03)',
                            color: active ? style.color : 'rgba(255,255,255,0.38)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {active && <Check size={11} />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
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
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.07), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(139,92,246,0.18)', borderRadius: '13px', padding: '13px',
                  }}>
                    <p style={{ color: 'white', fontSize: '11.5px', fontWeight: 700, margin: '0 0 9px' }}>
                      Lien de partage public
                    </p>
                    {selectedForm.status !== 'actif' && (
                      <p style={{ color: '#fbbf24', fontSize: '10.5px', margin: '0 0 9px' }}>
                        ⚠️ Passez le statut à « actif » pour rendre ce lien accessible publiquement.
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{
                        flex: 1, fontSize: '11px', color: '#c4b5fd', background: 'rgba(0,0,0,0.35)',
                        padding: '8px 11px', borderRadius: '9px', overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        {publicUrl(selectedForm.id)}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(publicUrl(selectedForm.id)); toast.success('Lien copié !'); }}
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
                      <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                        {submissions.length} réponse{submissions.length !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => refetchSubmissions()}
                        className="fp-refresh"
                        title="Actualiser"
                        style={{
                          width: '27px', height: '27px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                          color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'border-color 0.15s ease',
                        }}
                      >
                        <RefreshCcw size={12} className={submissionsFetching ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    {submissionsLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                        <Loader2 size={18} className="animate-spin" color="rgba(167,139,250,0.7)" />
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
                              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '14px', padding: '14px 16px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                              <Clock3 size={11} color="rgba(255,255,255,0.3)" />
                              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10.5px', fontVariantNumeric: 'tabular-nums' }}>
                                {formatDate(sub.created_at)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                              {Object.entries(sub.data || {}).map(([fieldId, val]) => (
                                <div key={fieldId}>
                                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 3px' }}>
                                    {fieldLabelById(fieldId)}
                                  </p>
                                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12.5px', margin: 0, wordBreak: 'break-word' }}>
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
        <Icon size={19} color="rgba(167,139,250,0.6)" />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: 600, margin: 0 }}>{title}</p>
      {subtitle && <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11.5px', margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
  );
}