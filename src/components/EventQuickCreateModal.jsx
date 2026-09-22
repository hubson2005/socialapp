import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';
import { buildEventDraft, createEventNow, saveDraftLocally } from '../lib/eventDraft';

const TYPES = [
  { id: 'mariage', label: 'Mariage' },
  { id: 'custom', label: 'Soirée' },
  { id: 'expo_temp', label: 'Exposant' },
];

// À terme, remplacer par un fetch sur event_editions (active = true).
const EDITIONS = [
  { id: null, label: 'Sélectionner un salon...' },
];

export default function EventQuickCreateModal({ onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('form'); // 'form' | 'auth' | 'success'
  const [type, setType] = useState('mariage');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [editionId, setEditionId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  const validateForm = () => {
    if (!title.trim()) { setError('Ajoutez au moins un titre.'); return false; }
    if (type === 'expo_temp' && !editionId) { setError('Choisissez une édition de salon.'); return false; }
    setError('');
    return true;
  };

  const handlePrimarySubmit = async () => {
    if (!validateForm()) return;

    const draft = buildEventDraft({ type, title, location, eventDate, editionId });

    if (user) {
      setLoading(true);
      const { data, error: insertError } = await createEventNow(draft, user.id);
      setLoading(false);
      if (insertError) { setError("Une erreur est survenue, réessayez."); return; }
      onClose();
      navigate(`/dashboard/events/${data.id}`);
      return;
    }

    // Pas connecté : on garde le brouillon et on passe à l'étape inscription.
    saveDraftLocally(draft);
    setStep('auth');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Renseignez un email et un mot de passe.'); return; }
    if (password.length < 6) { setError('6 caractères minimum.'); return; }

    const draft = buildEventDraft({ type, title, location, eventDate, editionId });
    setLoading(true);
    setError('');
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
          data: { plan: 'evenement', event_draft: draft },
        },
      });
      if (signUpError) throw signUpError;
      setStep('success');
    } catch (err) {
      setError(
        err.message?.includes('already registered')
          ? 'Cet email est déjà utilisé. Connectez-vous.'
          : err.message || "Erreur lors de l'inscription."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={handleBackdrop} style={overlay}>
      <div style={modal}>
        <button type="button" onClick={onClose} aria-label="Fermer" style={closeBtn}>×</button>

        {step === 'form' && (
          <>
            <p style={title1}>Créer votre événement</p>
            <p style={subtitle}>Deux minutes suffisent, vous complèterez le reste ensuite.</p>

            <div style={typeRow}>
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  style={type === t.id ? typeBtnActive : typeBtn}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <label style={label}>Titre</label>
            <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mariage Awa & Yves" />

            {type !== 'expo_temp' ? (
              <>
                <label style={label}>Date</label>
                <input style={input} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </>
            ) : (
              <>
                <label style={label}>Édition du salon</label>
                <select style={input} value={editionId} onChange={(e) => setEditionId(e.target.value)}>
                  {EDITIONS.map((ed) => (<option key={ed.id || ''} value={ed.id || ''}>{ed.label}</option>))}
                </select>
              </>
            )}

            <label style={label}>Lieu</label>
            <input style={input} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Abidjan" />

            {error && <p style={errorText}>{error}</p>}

            <button type="button" onClick={handlePrimarySubmit} disabled={loading} style={submitBtn}>
              {loading ? 'Création...' : 'Créer mon événement →'}
            </button>
          </>
        )}

        {step === 'auth' && (
          <form onSubmit={handleSignup}>
            <p style={title1}>Encore une étape</p>
            <p style={subtitle}>Créez votre compte pour activer « {title} ».</p>

            <label style={label}>Email</label>
            <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" />

            <label style={label}>Mot de passe</label>
            <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 caractères minimum" />

            {error && <p style={errorText}>{error}</p>}

            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? 'Inscription...' : 'Créer mon compte →'}
            </button>
          </form>
        )}

        {step === 'success' && (
          <>
            <p style={title1}>Vérifiez votre boîte mail</p>
            <p style={subtitle}>
              Confirmez votre inscription via le lien envoyé à <strong>{email}</strong>.
              Votre événement « {title} » et son QR code vous attendront directement sur votre tableau de bord.
            </p>
            <button type="button" onClick={onClose} style={submitBtn}>Fermer</button>
          </>
        )}
      </div>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' };
const modal = { background: '#0a0818', border: '1px solid rgba(255,255,255,.1)', borderRadius: '24px', padding: '32px 28px', maxWidth: '400px', width: '100%', position: 'relative', color: '#fff' };
const closeBtn = { position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '50%', width: '30px', height: '30px', color: 'rgba(255,255,255,.6)', fontSize: '16px', cursor: 'pointer' };
const title1 = { fontSize: '19px', fontWeight: '800', margin: '0 0 4px' };
const subtitle = { fontSize: '13px', color: 'rgba(255,255,255,.5)', margin: '0 0 18px', lineHeight: 1.5 };
const typeRow = { display: 'flex', gap: '6px', marginBottom: '16px' };
const typeBtn = { flex: 1, height: '34px', fontSize: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: 'rgba(255,255,255,.6)', cursor: 'pointer' };
const typeBtnActive = { ...typeBtn, border: '1px solid #ff6b35', background: 'rgba(255,107,53,.12)', color: '#ff6b35' };
const label = { display: 'block', fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: '0 0 6px' };
const input = { width: '100%', height: '38px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff', padding: '0 12px', marginBottom: '14px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' };
const submitBtn = { width: '100%', height: '42px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '4px' };
const errorText = { color: '#f87171', fontSize: '12px', margin: '0 0 12px' };