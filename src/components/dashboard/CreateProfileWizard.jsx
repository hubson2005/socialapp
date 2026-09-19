import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Check, ArrowRight, Camera, User, Loader2, Search, SkipForward,
  ShoppingBag, FileText, Upload, AtSign, Lock,
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

const MAX_DOC_SIZE_MB = 10;
const MAX_DOC_SIZE_BYTES = MAX_DOC_SIZE_MB * 1024 * 1024;
const MAX_IMG_SIZE_KB = 2000;

// [MÊME RÈGLE que handleSave dans Dashboard.jsx] pour ne jamais insérer un
// username différent de celui que la sauvegarde normale aurait produit.
const sanitizeUsername = (value) =>
  (value || '').toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// 6 étapes créent le profil (Nom → Plateforme). Les 2 dernières (Boutique,
// Documents) n'apparaissent qu'une fois le profil réellement créé en base,
// car marketplace_products / profile_documents exigent un profile_id.
const STEP_LABELS = ['Nom', 'Username', 'Bio', 'Photo', 'Couleur', 'Plateforme', 'Boutique', 'Documents'];
const LAST_PRE_CREATE_STEP = 5; // index de l'étape "Plateforme"

export default function CreateProfileWizard({ open, onClose, onSubmit, submitting, profileNumber }) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [themeColor, setThemeColor] = useState(THEME_PRESETS[0].value);
  const [platformKey, setPlatformKey] = useState(null);
  const [platformUrl, setPlatformUrl] = useState('');
  const [platformSearch, setPlatformSearch] = useState('');

  // ── Post-création (nécessitent un profile.id réel) ──
  const [createdProfileId, setCreatedProfileId] = useState(null);
  const [productTitle, setProductTitle] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [savingDoc, setSavingDoc] = useState(false);

  const fileRef = useRef();
  const productFileRef = useRef();
  const docFileRef = useRef();
  const tempIdRef = useRef(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));

  if (!open) return null;

  const locked = !!createdProfileId; // profil déjà créé -> étapes 0-5 non ré-éditables

  const reset = () => {
    setStep(0); setDisplayName(''); setUsername(''); setBio(''); setAvatarUrl('');
    setThemeColor(THEME_PRESETS[0].value); setPlatformKey(null);
    setPlatformUrl(''); setPlatformSearch(''); setCreatedProfileId(null);
    setProductTitle(''); setProductPrice(''); setProductImageUrl('');
    setDocName(''); setDocFile(null);
  };

  const handleClose = () => { reset(); onClose?.(); };

  const goNext = () => setStep(s => Math.min(s + 1, STEP_LABELS.length - 1));
  const goEdit = (i) => { if (!locked) setStep(i); };

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

  // ── Étape 5 -> création réelle du profil en base ──
  const handleCreateProfile = async () => {
    const links = (platformKey && platformUrl.trim())
      ? [{ id: crypto.randomUUID(), platform: platformKey, url: platformUrl.trim(), label: '', enabled: true }]
      : [];
    const created = await onSubmit?.({
      display_name: displayName.trim(),
      username: sanitizeUsername(username) || null,
      bio: bio.trim(),
      avatar_url: avatarUrl || null,
      theme_color: themeColor,
      links,
    });
    if (created?.id) {
      setCreatedProfileId(created.id);
      goNext(); // -> étape Boutique
    }
    // en cas d'échec (created falsy), on reste sur l'étape Plateforme —
    // le toast d'erreur est déjà géré côté Dashboard.jsx (handleWizardSubmit).
  };

  // ── Étape 6 : premier produit boutique (optionnel) ──
  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMG_SIZE_KB * 1024) { toast.error('Image trop lourde — max ' + MAX_IMG_SIZE_KB + ' Ko'); return; }
    setUploadingProductImage(true);
    try {
      const fileName = 'market-' + createdProfileId + '-' + Date.now() + '.' + file.name.split('.').pop();
      const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setProductImageUrl(data.publicUrl);
    } catch (err) {
      toast.error('Erreur upload : ' + err.message);
    } finally {
      setUploadingProductImage(false);
      e.target.value = '';
    }
  };

  const handleSaveProduct = async () => {
    if (!productTitle.trim() || !productPrice) { goNext(); return; } // rien de saisi -> on passe
    if (Number(productPrice) <= 0) { toast.error('Le prix doit être supérieur à 0'); return; }
    setSavingProduct(true);
    try {
      const { error } = await supabase.from('marketplace_products').insert([{
        profile_id: createdProfileId,
        title: productTitle.trim(),
        price: Number(productPrice),
        original_price: null,
        description: null,
        image_url: productImageUrl || null,
        is_available: true,
      }]);
      if (error) throw error;
      toast.success('Produit ajouté !');
      goNext();
    } catch (err) {
      toast.error('Erreur : ' + err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  // ── Étape 7 : premier document (optionnel) ──
  const handleDocFileChange = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { toast.error('Seuls les fichiers PDF sont acceptés'); return; }
    if (f.size > MAX_DOC_SIZE_BYTES) { toast.error('Fichier trop lourd — max ' + MAX_DOC_SIZE_MB + ' Mo'); return; }
    setDocFile(f);
    if (!docName) setDocName(f.name.replace(/\.pdf$/i, ''));
  };

  const handleSaveDocument = async () => {
    if (!docFile || !docName.trim()) { handleClose(); return; } // rien de saisi -> on termine
    setSavingDoc(true);
    try {
      const fileName = 'doc-' + createdProfileId + '-' + Date.now() + '.pdf';
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, docFile, { contentType: 'application/pdf', upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('profile_documents').insert([{
        profile_id: Number(createdProfileId),
        name: docName.trim(),
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_size: docFile.size,
        is_visible: true,
      }]);
      if (dbError) throw dbError;
      toast.success('Document ajouté !');
      handleClose();
    } catch (err) {
      toast.error('Erreur : ' + err.message);
    } finally {
      setSavingDoc(false);
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '14px' }}>
            {STEP_LABELS.map((label, i) => (
              <div key={label} title={label} style={{ width: i === step ? '18px' : '7px', height: '7px', borderRadius: '5px', background: i <= step ? `linear-gradient(135deg,${T.accent},${T.accent2})` : T.border, transition: 'all 0.25s' }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* ── Nom ── */}
          {step > 0 && <CompletedRow icon="🏷️" label="Nom" value={displayName || '—'} onEdit={locked ? null : () => goEdit(0)} />}
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

          {/* ── Username ── */}
          {step > 1 && <CompletedRow icon="🔗" label="Username" value={username ? '@' + sanitizeUsername(username) : 'Aucun'} onEdit={locked ? null : () => goEdit(1)} />}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <StepCard title="Choisissez un nom d'utilisateur" subtitle="Optionnel — utilisé dans le lien de votre page (socialapp.work/votre-nom).">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '0 12px' }}>
                  <AtSign size={13} color={T.faint} style={{ flexShrink: 0 }} />
                  <input
                    autoFocus type="text" value={username} onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') goNext(); }}
                    placeholder="votre-nom"
                    style={{ ...inputStyle, background: 'transparent', border: 'none', padding: '11px 0' }}
                  />
                </div>
                {username && <p style={{ color: T.faint, fontSize: '11px', margin: 0 }}>Lien : socialapp.work/{sanitizeUsername(username)}</p>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <SkipButton onClick={goNext} />
                  <PrimaryButton onClick={goNext} style={{ flex: 1 }}>
                    Continuer <ArrowRight size={14} />
                  </PrimaryButton>
                </div>
              </StepCard>
            </motion.div>
          )}

          {/* ── Bio ── */}
          {step > 2 && <CompletedRow icon="📝" label="Bio" value={bio || 'Aucune'} onEdit={locked ? null : () => goEdit(2)} />}
          {step === 2 && (
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

          {/* ── Photo ── */}
          {step > 3 && <CompletedRow icon="🖼️" label="Photo" value={avatarUrl ? 'Ajoutée' : 'Aucune'} onEdit={locked ? null : () => goEdit(3)} avatarPreview={avatarUrl} />}
          {step === 3 && (
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
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
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

          {/* ── Couleur ── */}
          {step > 4 && <CompletedRow icon={<div style={{ width: '14px', height: '14px', borderRadius: '50%', background: `linear-gradient(135deg,${c1},${c2})` }} />} label="Couleur" value="" onEdit={locked ? null : () => goEdit(4)} />}
          {step === 4 && (
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

          {/* ── Plateforme (déclenche la création réelle du profil) ── */}
          {step > 5 && <CompletedRow icon="🔗" label="Plateforme" value={selectedPlatform ? selectedPlatform.label : 'Aucune'} onEdit={null} />}
          {step === 5 && (
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
                  {!(selectedPlatform && platformUrl.trim()) && <SkipButton onClick={handleCreateProfile} label="Passer et créer" />}
                  <PrimaryButton onClick={handleCreateProfile} disabled={submitting} style={{ flex: 1 }}>
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Créer mon profil
                  </PrimaryButton>
                </div>
              </StepCard>
            </motion.div>
          )}

          {/* ── Boutique (après création réelle) ── */}
          {step > 6 && <CompletedRow icon={<ShoppingBag size={14} color={T.accent} />} label="Boutique" value={productTitle ? productTitle : 'Aucun produit'} onEdit={null} />}
          {step === 6 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <StepCard title="Ajoutez votre premier produit" subtitle="Optionnel — visible dans la Boutique de votre page publique.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    onClick={() => productFileRef.current?.click()}
                    style={{ width: '56px', height: '56px', borderRadius: '14px', background: T.inputBg, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {uploadingProductImage ? <Loader2 size={18} className="animate-spin" color={T.accent} />
                      : productImageUrl ? <img src={productImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <ShoppingBag size={20} color={T.faint} />}
                  </div>
                  <input ref={productFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProductImageUpload} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input type="text" value={productTitle} onChange={e => setProductTitle(e.target.value)} placeholder="Nom du produit" style={inputStyle} />
                  </div>
                </div>
                <input type="number" min="0" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="Prix (FCFA)" style={inputStyle} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <SkipButton onClick={goNext} />
                  <PrimaryButton onClick={handleSaveProduct} disabled={savingProduct || uploadingProductImage} style={{ flex: 1 }}>
                    {savingProduct ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />} Continuer
                  </PrimaryButton>
                </div>
              </StepCard>
            </motion.div>
          )}

          {/* ── Documents (après création réelle, dernière étape) ── */}
          {step === 7 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <StepCard title="Ajoutez un premier document" subtitle="Optionnel — un PDF (brochure, catalogue, CV...) visible sur votre page.">
                <label
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: T.inputBg, border: `1.5px dashed ${T.border}`, borderRadius: '14px', padding: '20px', cursor: 'pointer' }}
                >
                  {docFile ? <FileText size={22} color={T.accent} /> : <Upload size={22} color={T.faint} />}
                  <span style={{ color: docFile ? T.text : T.muted, fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                    {docFile ? docFile.name : 'Cliquez pour choisir un PDF (10 Mo max)'}
                  </span>
                  <input ref={docFileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleDocFileChange(e.target.files?.[0])} />
                </label>
                {docFile && (
                  <input type="text" value={docName} onChange={e => setDocName(e.target.value)} placeholder="Nom du document" style={inputStyle} />
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!(docFile && docName.trim()) && <SkipButton onClick={handleClose} label="Passer et terminer" />}
                  <PrimaryButton onClick={handleSaveDocument} disabled={savingDoc} style={{ flex: 1 }}>
                    {savingDoc ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Terminer
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
      <div onClick={onEdit || undefined} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: '#f7f8fc', border: `1px solid ${T.border}`, borderRadius: '12px', cursor: onEdit ? 'pointer' : 'default' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '7px', background: 'rgba(22,163,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={12} color={T.success} />
        </div>
        {avatarPreview && <img src={avatarPreview} alt="" style={{ width: '18px', height: '18px', borderRadius: '5px', objectFit: 'cover' }} />}
        {typeof icon !== 'string' && icon}
        <span style={{ color: T.faint, fontSize: '11px', fontWeight: 600 }}>{label}</span>
        <span style={{ color: T.text, fontSize: '12px', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        {onEdit ? <span style={{ color: T.accent, fontSize: '11px', fontWeight: 600 }}>Modifier</span> : <Lock size={11} color={T.faint} />}
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