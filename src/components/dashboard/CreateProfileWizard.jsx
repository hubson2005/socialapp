import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, ArrowRight, Camera, User, Loader2, Search, SkipForward,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import { PLATFORMS } from './AddPlatformDialog';

// ─── Thème local (composant autonome, pas de dépendance à Dashboard.jsx) ───
const T = {
  text: '#161a2e', muted: '#6b7280', faint: '#9095a5',
  border: '#e6e8f0', inputBg: '#f6f7fb', panel: '#ffffff',
  accent: '#6366f1', accent2: '#8b5cf6', success: '#16a34a',
};

const THEME_PRESETS = [
  { label: 'Violet',  value: '#4f46e5|#7c3aed' },
  { label: 'Océan',   value: '#0c4a6e|#0ea5e9' },
  { label: 'Forêt',   value: '#14532d|#16a34a' },
  { label: 'Coucher', value: '#7c2d12|#ea580c' },
  { label: 'Rose',    value: '#831843|#db2777' },
  { label: 'Ardoise', value: '#1e293b|#475569' },
  { label: 'Noir',    value: '#000000|#1a1a2e' },
  { label: 'Beige',   value: '#D2B48C|#e5cab1' },
];

const POPULAR_PLATFORM_KEYS = [
  'instagram', 'whatsapp', 'facebook', 'tiktok', 'youtube', 'website',
  'linkedin', 'twitter', 'wave', 'orangemoney',
];

const STEP_LABELS = ['Nom', 'Bio', 'Photo', 'Couleur', 'Plateforme'];

export default function CreateProfileWizard({ open, onClose, onSubmit, submitting, profileNumber }) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [themeColor, setThemeColor] = useState(THEME_PRESETS[0].value);
  const [platformKey, setPlatformKey] = useState(null);
  const [platformUrl, setPlatformUrl] = useState('');
  const [platformSearch, setPlatformSearch] = useState('');
  const fileRef = useRef();
  const tempIdRef = useRef(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));

  if (!open) return null;

  const reset = () => {
    setStep(0); setDisplayName(''); setBio(''); setAvatarUrl('');
    setThemeColor(THEME_PRESETS[0].value); setPlatformKey(null);
    setPlatformUrl(''); setPlatformSearch('');
  };

  const handleClose = () => { reset(); onClose?.(); };

  const goNext = () => setStep(s => Math.min(s + 1, STEP_LABELS.length - 1));
  const goEdit = (i) => setStep(i);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = 'avatar-' + tempIdRef.current + '-' + Date.now() + '.' + ext;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
    } catch (err) {
      toast.error('Erreur upload : ' + err.message);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleFinish = async () => {
    const links = (platformKey && platformUrl.trim())
      ? [{ id: crypto.randomUUID(), platform: platformKey, url: platformUrl.trim(), label: '', enabled: true }]
      : [];
    await onSubmit?.({
      display_name: displayName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl || null,
      theme_color: themeColor,
      links,
    });
    reset();
  };

  const filteredPlatformKeys = platformSearch.trim()
    ? Object.keys(PLATFORMS).filter(k => PLATFORMS[k].label.toLowerCase().includes(platformSearch.trim().toLowerCase()))
    : POPULAR_PLATFORM_KEYS;

  const selectedPlatform = platformKey ? PLATFORMS[platformKey] : null;
  const [c1, c2] = themeColor.split('|');

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,18,34,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        style={{ width: '100%', maxWidth: '460px', maxHeight: '88vh', overflowY: 'auto', background: T.panel, borderRadius: '24px', boxShadow: '0 24px 64px rgba(15,23,42,.2)', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 22px 14px', borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, background: T.panel, borderRadius: '24px 24px 0 0', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ color: T.text, fontSize: '17px', fontWeight: 800, margin: 0 }}>Créer votre profil digital</h2>
            <button onClick={handleClose} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.inputBg, border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              <X size={14} color={T.muted} />
            </button>
          </div>
          {/* Progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px' }}>
            {STEP_LABELS.map((label, i) => (
              <React.Fragment key={label}>
                <div title={label} style={{ width: i === step ? '20px' : '8px', height: '8px', borderRadius: '5px', background: i <= step ? `linear-gradient(135deg,${T.accent},${T.accent2})` : T.border, transition: 'all 0.25s' }} />
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* ── Étape complétée : Nom ── */}
          {step > 0 && (
            <CompletedRow icon="🏷️" label="Nom" value={displayName || '—'} onEdit={() => goEdit(0)} />
          )}
          {/* ── Étape active : Nom ── */}
          {step === 0 && (
            <StepCard title="Comment souhaitez-vous nommer votre profil ?" subtitle="C'est le nom affiché en haut de votre page publique.">
              <input
                autoFocus type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && displayName.trim()) goNext(); }}
                placeholder={'Profil ' + (profileNumber || 1)}
                style={inputStyle}
              />
              <PrimaryButton disabled={!displayName.trim()} onClick={goNext}>
                Continuer <ArrowRight size={14} />
              </PrimaryButton>
            </StepCard>
          )}

          {/* ── Étape complétée : Bio ── */}
          {step > 1 && (
            <CompletedRow icon="📝" label="Bio" value={bio || 'Aucune'} onEdit={() => goEdit(1)} />
          )}
          {/* ── Étape active : Bio ── */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <StepCard title="Ajoutez une courte description" subtitle="Optionnel — une phrase qui présente votre activité.">
                <textarea
                  autoFocus value={bio} onChange={e => setBio(e.target.value)} rows={3}
                  placeholder="Ex : Coiffeuse à domicile — Abidjan, Cocody"
                  style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <SkipButton onClick={goNext} />
                  <PrimaryButton onClick={goNext} style={{ flex: 1 }}>
                    Continuer <ArrowRight size={14} />
                  </PrimaryButton>
                </div>
              </StepCard>
            </motion.div>
          )}

          {/* ── Étape complétée : Photo ── */}
          {step > 2 && (
            <CompletedRow icon="🖼️" label="Photo" value={avatarUrl ? 'Ajoutée' : 'Aucune'} onEdit={() => goEdit(2)} avatarPreview={avatarUrl} />
          )}
          {/* ── Étape active : Photo ── */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <StepCard title="Ajoutez une photo de profil" subtitle="Optionnel — vous pourrez la changer à tout moment.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{ width: '64px', height: '64px', borderRadius: '16px', background: T.inputBg, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, position: 'relative' }}
                  >
                    {uploadingAvatar ? <Loader2 size={20} className="animate-spin" color={T.accent} />
                      : avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <User size={24} color={T.faint} />}
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: '22px', height: '22px', borderRadius: '7px', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={11} color="white" />
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" style={{ display: 'none' }} onChange={handleAvatarChange} />
                  <p style={{ color: T.muted, fontSize: '12px', margin: 0, lineHeight: 1.5 }}>Cliquez sur le cadre pour choisir une image (2 Mo max).</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <SkipButton onClick={goNext} />
                  <PrimaryButton onClick={goNext} disabled={uploadingAvatar} style={{ flex: 1 }}>
                    Continuer <ArrowRight size={14} />
                  </PrimaryButton>
                </div>
              </StepCard>
            </motion.div>
          )}

          {/* ── Étape complétée : Couleur ── */}
          {step > 3 && (
            <CompletedRow icon={<div style={{ width: '14px', height: '14px', borderRadius: '50%', background: `linear-gradient(135deg,${c1},${c2})` }} />} label="Couleur" value="" onEdit={() => goEdit(3)} />
          )}
          {/* ── Étape active : Couleur ── */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <StepCard title="Choisissez une couleur pour votre profil" subtitle="Le dégradé de fond de votre page publique.">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                  {THEME_PRESETS.map(p => {
                    const [pc1, pc2] = p.value.split('|');
                    const active = themeColor === p.value;
                    return (
                      <button key={p.value} type="button" title={p.label} onClick={() => setThemeColor(p.value)}
                        style={{ height: '44px', borderRadius: '12px', background: `linear-gradient(135deg,${pc1},${pc2})`, border: active ? `2px solid ${T.text}` : '2px solid transparent', boxShadow: active ? '0 0 0 2px white, 0 0 0 4px ' + T.accent : 'none', cursor: 'pointer' }}
                      />
                    );
                  })}
                </div>
                <PrimaryButton onClick={goNext}>
                  Continuer <ArrowRight size={14} />
                </PrimaryButton>
              </StepCard>
            </motion.div>
          )}

          {/* ── Étape active : Plateforme (dernière étape) ── */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <StepCard title="Ajoutez votre première plateforme" subtitle="Optionnel — vous pourrez en ajouter d'autres ensuite.">
                {!selectedPlatform ? (
                  <>
                    <div style={{ position: 'relative' }}>
                      <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: T.faint }} />
                      <input
                        type="text" value={platformSearch} onChange={e => setPlatformSearch(e.target.value)}
                        placeholder="Rechercher une plateforme..."
                        style={{ ...inputStyle, paddingLeft: '32px' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                      {filteredPlatformKeys.map(key => {
                        const p = PLATFORMS[key];
                        if (!p) return null;
                        return (
                          <button key={key} type="button" title={p.label} onClick={() => setPlatformKey(key)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 4px', background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: '10px', cursor: 'pointer' }}>
                            <div style={{ width: '20px', height: '20px' }}>{p.icon}</div>
                            <span style={{ fontSize: '9px', color: T.muted, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '8px 10px' }}>
                      <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>{selectedPlatform.icon}</div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: T.text, flex: 1 }}>{selectedPlatform.label}</span>
                      <button onClick={() => { setPlatformKey(null); setPlatformUrl(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.faint, padding: 0 }}><X size={13} /></button>
                    </div>
                    <input
                      autoFocus type="text" value={platformUrl} onChange={e => setPlatformUrl(e.target.value)}
                      placeholder={selectedPlatform.placeholder}
                      style={inputStyle}
                    />
                  </>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!(selectedPlatform && platformUrl.trim()) && <SkipButton onClick={handleFinish} label="Passer et créer" />}
                  <PrimaryButton onClick={handleFinish} disabled={submitting} style={{ flex: 1 }}>
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Créer mon profil
                  </PrimaryButton>
                </div>
              </StepCard>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '11px 13px',
  background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: '10px',
  color: T.text, fontSize: '13px', outline: 'none',
};

function StepCard({ title, subtitle, children }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 10px rgba(15,23,42,.04)' }}>
      <div>
        <p style={{ color: T.text, fontSize: '13px', fontWeight: 700, margin: 0 }}>{title}</p>
        {subtitle && <p style={{ color: T.muted, fontSize: '11px', margin: '3px 0 0' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function CompletedRow({ icon, label, value, onEdit, avatarPreview }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
      <div onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: '#f7f8fc', border: `1px solid ${T.border}`, borderRadius: '12px', cursor: 'pointer' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '7px', background: 'rgba(22,163,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={12} color={T.success} />
        </div>
        {avatarPreview && <img src={avatarPreview} alt="" style={{ width: '18px', height: '18px', borderRadius: '5px', objectFit: 'cover' }} />}
        {typeof icon !== 'string' && icon}
        <span style={{ color: T.faint, fontSize: '11px', fontWeight: 600 }}>{label}</span>
        <span style={{ color: T.text, fontSize: '12px', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        <span style={{ color: T.accent, fontSize: '11px', fontWeight: 600 }}>Modifier</span>
      </div>
    </motion.div>
  );
}

function PrimaryButton({ children, disabled, onClick, style }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', background: disabled ? T.border : `linear-gradient(135deg,${T.accent},${T.accent2})`, border: 'none', borderRadius: '10px', color: disabled ? T.faint : 'white', fontSize: '13px', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', width: '100%', ...style }}>
      {children}
    </button>
  );
}

function SkipButton({ onClick, label = 'Passer' }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '11px 14px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '10px', color: T.muted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <SkipForward size={12} /> {label}
    </button>
  );
}