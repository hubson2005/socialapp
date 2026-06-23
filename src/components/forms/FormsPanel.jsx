import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, FileText, Eye, Copy, ExternalLink, Settings,
  Loader2, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import FormBuilder from './FormBuilder';
import FormPreview from './FormPreview';

const STATUS_STYLES = {
  actif:     { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  inactif:   { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  brouillon: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
};

const BG_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#F59E0B', '#6366F1'];

const emptyForm = (profileId) => ({
  profile_id: profileId,
  title: '',
  description: '',
  status: 'brouillon',
  fields: [],
  bg_color: '#F97316',
  thank_you_message: 'Merci pour votre r\u00e9ponse\u00a0!',
  redirect_url: '',
});

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
};

// ─── Shared input style ───────────────────────────────────────────────────
const fieldStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '9px', color: 'white',
  fontSize: '12.5px', outline: 'none',
};

// ─── Main component ───────────────────────────────────────────────────────
export default function FormsPanel({ profileId, maxForms = 1, onUpgrade }) {
  const queryClient = useQueryClient();
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData]         = useState(emptyForm(profileId));
  const [tab, setTab]                   = useState('builder');

  // FIX 3 — reset state whenever the active profile changes
  useEffect(() => {
    setSelectedForm(null);
    setFormData(emptyForm(profileId));
    setTab('builder');
  }, [profileId]);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['forms', profileId],
    queryFn: () => db.list(profileId),
    enabled: !!profileId,
  });

  const atLimit = maxForms !== Infinity && forms.length >= maxForms && !selectedForm;

  const createMutation = useMutation({
    mutationFn: (data) => db.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['forms', profileId] });
      setSelectedForm(created);
      toast.success('Formulaire cr\u00e9\u00e9\u00a0!');
    },
    onError: (e) => toast.error('Erreur\u00a0: ' + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['forms', profileId] });
      setSelectedForm(updated);
      toast.success('Modifications sauvegard\u00e9es\u00a0!');
    },
    onError: (e) => toast.error('Erreur\u00a0: ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', profileId] });
      setSelectedForm(null);
      setFormData(emptyForm(profileId));
      toast.success('Formulaire supprim\u00e9');
    },
    onError: (e) => toast.error('Erreur\u00a0: ' + e.message),
  });

  const handleSelect = (form) => {
    setSelectedForm(form);
    setFormData({
      title:             form.title             || '',
      description:       form.description       || '',
      status:            form.status            || 'brouillon',
      fields:            form.fields            || [],
      bg_color:          form.bg_color          || '#F97316',
      thank_you_message: form.thank_you_message || '',
      redirect_url:      form.redirect_url      || '',
    });
    setTab('builder');
  };

  const handleNew = () => {
    if (atLimit) {
      toast.error(`Limite atteinte \u2014 ${maxForms} formulaire(s) max pour votre offre`);
      return;
    }
    setSelectedForm(null);
    setFormData(emptyForm(profileId));
    setTab('builder');
  };

  const handleSave = () => {
    if (!formData.title.trim()) { toast.error('Le titre du formulaire est requis'); return; }
    if (selectedForm) {
      updateMutation.mutate({ id: selectedForm.id, data: formData });
    } else {
      if (atLimit) {
        toast.error(`Limite atteinte \u2014 ${maxForms} formulaire(s) max pour votre offre`);
        return;
      }
      createMutation.mutate({ ...formData, profile_id: profileId });
    }
  };

  // FIX 2 — confirmation before delete
  const handleDelete = () => {
    const name = selectedForm.title?.trim() || 'Sans titre';
    if (!window.confirm(`Supprimer le formulaire \u00ab\u00a0${name}\u00a0\u00bb ?\nCette action est irr\u00e9versible.`)) return;
    deleteMutation.mutate(selectedForm.id);
  };

  const publicUrl = (id) => `${window.location.origin}/form/${id}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Formulaires</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
            {forms.length} / {maxForms === Infinity ? '\u221e' : maxForms} formulaire(s) utilis\u00e9(s)
          </p>
        </div>
        <button
          onClick={handleNew}
          disabled={atLimit}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px',
            background: atLimit ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: 'none', borderRadius: '10px',
            color: atLimit ? 'rgba(255,255,255,0.3)' : 'white',
            fontSize: '12px', fontWeight: 600,
            cursor: atLimit ? 'not-allowed' : 'pointer',
          }}
        >
          <Plus size={13} /> Nouveau formulaire
        </button>
      </div>

      {/* Limit banner */}
      {atLimit && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0 }} />
          <span style={{ color: '#f87171', fontSize: '12px', flex: 1 }}>
            Limite atteinte \u2014 {maxForms} formulaire(s) max pour votre offre actuelle
          </span>
          {onUpgrade && (
            <button onClick={onUpgrade} style={{ background: 'none', border: 'none', color: '#ff8c00', fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Upgrader \u2192
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,280px) 1fr', gap: '16px', alignItems: 'start' }}>

        {/* ── Form list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <Loader2 size={18} className="animate-spin" color="rgba(99,102,241,0.6)" />
            </div>
          ) : forms.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '14px', padding: '24px 14px', textAlign: 'center' }}>
              <FileText size={22} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 8px' }} />
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>Aucun formulaire</p>
            </div>
          ) : (
            forms.map(form => {
              const style      = STATUS_STYLES[form.status] || STATUS_STYLES.brouillon;
              const isSelected = selectedForm?.id === form.id;
              return (
                <div
                  key={form.id}
                  onClick={() => handleSelect(form)}
                  style={{
                    background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid ' + (isSelected ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'),
                    borderRadius: '14px', padding: '12px', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0 }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', marginTop: '3px', flexShrink: 0, background: form.bg_color || '#F97316' }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: 'white', fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {form.title || 'Sans titre'}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10.5px', margin: '2px 0 0' }}>
                          {(form.fields || []).length} champ(s)
                        </p>
                      </div>
                    </div>
                    <span style={{ background: style.bg, color: style.color, borderRadius: '6px', padding: '2px 7px', fontSize: '9.5px', fontWeight: 700, flexShrink: 0 }}>
                      {form.status}
                    </span>
                  </div>
                  {/* submissions_count : présent si la colonne existe en DB */}
                  {(form.submissions_count > 0) && (
                    <p style={{ color: '#a78bfa', fontSize: '10.5px', margin: '6px 0 0' }}>
                      {form.submissions_count} r\u00e9ponse(s)
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Editor ── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 14px' }}>
            {[
              { key: 'builder',  label: 'Constructeur', icon: FileText  },
              { key: 'preview',  label: 'Aper\u00e7u',  icon: Eye       },
              { key: 'settings', label: 'Param\u00e8tres', icon: Settings },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '12px 14px', fontSize: '12.5px', fontWeight: 600,
                  border: 'none',
                  borderBottom: '2px solid ' + (tab === key ? '#6366f1' : 'transparent'),
                  background: 'transparent',
                  color: tab === key ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}

            {/* Action buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
              {selectedForm && (
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  title="Supprimer ce formulaire"
                  style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: deleteMutation.isPending ? 'wait' : 'pointer',
                    opacity: deleteMutation.isPending ? 0.6 : 1,
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
                disabled={updateMutation.isPending || createMutation.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  border: 'none', borderRadius: '9px', color: 'white',
                  fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
                  opacity: (updateMutation.isPending || createMutation.isPending) ? 0.7 : 1,
                }}
              >
                {(updateMutation.isPending || createMutation.isPending)
                  ? <Loader2 size={12} className="animate-spin" />
                  : null}
                {selectedForm ? 'Sauvegarder' : 'Cr\u00e9er'}
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div style={{ padding: '18px', maxHeight: 'calc(100dvh - 220px)', overflowY: 'auto' }}>

            {/* ── Builder ── */}
            {tab === 'builder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>
                      Titre du formulaire *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Mon formulaire"
                      style={fieldStyle}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>
                      Couleur
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
                      {BG_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setFormData({ ...formData, bg_color: c })}
                          style={{
                            width: '24px', height: '24px', borderRadius: '50%', background: c,
                            border: formData.bg_color === c ? '2px solid white' : '2px solid transparent',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Courte description..."
                    style={fieldStyle}
                  />
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                  <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: '0 0 10px' }}>
                    Champs du formulaire
                  </p>
                  <FormBuilder fields={formData.fields} onChange={fields => setFormData({ ...formData, fields })} />
                </div>
              </div>
            )}

            {/* ── Preview ── */}
            {tab === 'preview' && (
              <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11.5px', marginBottom: '14px', textAlign: 'center' }}>
                  Aper\u00e7u du formulaire
                </p>
                <FormPreview form={formData} mode="preview" />
              </div>
            )}

            {/* ── Settings ── */}
            {tab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '640px' }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                    Statut
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['brouillon', 'actif', 'inactif'].map(s => (
                      <button
                        key={s}
                        onClick={() => setFormData({ ...formData, status: s })}
                        style={{
                          padding: '7px 13px', borderRadius: '9px', fontSize: '11.5px', fontWeight: 600,
                          border: '1px solid ' + (formData.status === s ? '#6366f1' : 'rgba(255,255,255,0.1)'),
                          background: formData.status === s ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                          color: formData.status === s ? 'white' : 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                    Message de remerciement
                  </label>
                  <textarea
                    value={formData.thank_you_message}
                    onChange={e => setFormData({ ...formData, thank_you_message: e.target.value })}
                    rows={2}
                    placeholder="Merci pour votre r\u00e9ponse\u00a0!"
                    style={{ ...fieldStyle, resize: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                    URL de redirection apr\u00e8s soumission
                  </label>
                  <input
                    type="text"
                    value={formData.redirect_url}
                    onChange={e => setFormData({ ...formData, redirect_url: e.target.value })}
                    placeholder="https://..."
                    style={fieldStyle}
                  />
                </div>

                {selectedForm && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px' }}>
                    <p style={{ color: 'white', fontSize: '11.5px', fontWeight: 700, margin: '0 0 8px' }}>
                      Lien de partage public
                    </p>
                    {selectedForm.status !== 'actif' && (
                      <p style={{ color: '#fbbf24', fontSize: '10.5px', margin: '0 0 8px' }}>
                        \u26a0\ufe0f Passez le statut \u00e0 \u00ab\u00a0actif\u00a0\u00bb pour rendre ce lien accessible publiquement.
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ flex: 1, fontSize: '11px', color: '#a78bfa', background: 'rgba(0,0,0,0.3)', padding: '7px 10px', borderRadius: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {publicUrl(selectedForm.id)}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(publicUrl(selectedForm.id)); toast.success('Lien copi\u00e9\u00a0!'); }}
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
  );
}