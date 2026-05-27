import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';

import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  ShieldX,
} from 'lucide-react';

function FloatingOrb({ style }) {
  return (
    <div
      style={{
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// EMAILS TEMPORAIRES
// ─────────────────────────────────────────────────────────────

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'yopmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'trashmail.com',
  'throwaway.email',
  'maildrop.cc',
  'fakeinbox.com',
  'getnada.com',
  'mohmal.com',
  'tempmail.com',
  'mailnesia.com',
  'dispostable.com',
  'burnermail.io',
  'tempr.email',
  'discard.email',
]);

function isDisposableEmail(email) {
  if (!email || !email.includes('@')) return false;

  const domain = email.split('@')[1]?.toLowerCase().trim();

  if (!domain) return false;

  return DISPOSABLE_DOMAINS.has(domain);
}

// ─────────────────────────────────────────────────────────────
// PLAN INFO
// ─────────────────────────────────────────────────────────────

const PLAN_INFO = {
  basic: {
    label: 'BASIC',
    color: '#6366f1',
    emoji: '⚡',
    price: '10 000 FCFA',
    period: 'Paiement annuel',
    highlight: null,
  },

  pro: {
    label: 'PRO',
    color: '#ff8c00',
    emoji: '🚀',
    price: '15 000 FCFA',
    period: 'Paiement annuel',
    highlight: 'Le plus populaire',
  },

  business: {
    label: 'BUSINESS',
    color: '#f7c948',
    emoji: '💼',
    price: '25 000 FCFA',
    period: 'Paiement annuel',
    highlight: 'Tout inclus',
  },

  événement: {
    label: 'ÉVÉNEMENT',
    color: '#22c55e',
    emoji: '🎉',
    price: 'Sur devis',
    period: 'Par événement',
    highlight: null,
  },
};

export default function Login() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const { signIn } = useAuth();

  const planFromUrl = searchParams.get('plan') || 'basic';

  const selectedPlan = PLAN_INFO[planFromUrl]
    ? planFromUrl
    : 'basic';

  const planInfo = PLAN_INFO[selectedPlan];

  const [mode, setMode] = useState('signup');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [successEmail, setSuccessEmail] =
    useState('');

  // ─────────────────────────────────────────────────────────────
  // EMAIL
  // ─────────────────────────────────────────────────────────────

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  // ─────────────────────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────────────────────

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');

    setShowPassword(false);
    setShowConfirm(false);
  };

  // ─────────────────────────────────────────────────────────────
  // SIGNUP
  // ─────────────────────────────────────────────────────────────

  const handleSignup = async (e) => {
    e.preventDefault();

    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (isDisposableEmail(email)) {
      setError(
        'Les emails temporaires ne sont pas autorisés.'
      );
      return;
    }

    if (password.length < 6) {
      setError(
        'Le mot de passe doit contenir au moins 6 caractères.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        'Les mots de passe ne correspondent pas.'
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,

          options: {
            emailRedirectTo:
              window.location.origin + '/dashboard',

            data: {
              plan: selectedPlan,
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      if (data?.user) {
        await supabase.auth.updateUser({
          data: {
            plan: selectedPlan,
          },
        });
      }

      setSuccessEmail(email);

      setMode('success');
    } catch (err) {
      if (
        err.message?.includes('already registered')
      ) {
        setError(
          'Cet email est déjà utilisé.'
        );
      } else {
        setError(
          err.message ||
            "Erreur lors de l'inscription."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);

    try {
      const { error: loginError } =
        await signIn(email, password);

      if (loginError) {
        throw loginError;
      }

      navigate('/dashboard', {
        replace: true,
      });
    } catch (err) {
      if (
        err.message?.includes('Invalid login')
      ) {
        setError(
          'Email ou mot de passe incorrect.'
        );
      } else if (
        err.message?.includes(
          'Email not confirmed'
        )
      ) {
        setError(
          'Veuillez confirmer votre email.'
        );
      } else {
        setError(
          err.message ||
            'Erreur de connexion.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SWITCH MODE
  // ─────────────────────────────────────────────────────────────

  const switchMode = (newMode) => {
    resetForm();

    setMode(newMode);
  };

  // ─────────────────────────────────────────────────────────────
  // STATES
  // ─────────────────────────────────────────────────────────────

  const emailIsTyped = email.includes('@');

  const emailIsDisposable =
    emailIsTyped &&
    isDisposableEmail(email);

  // ─────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060412',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily:
          "'Sora', 'Segoe UI', sans-serif",
      }}
    >
      <FloatingOrb
        style={{
          width: '400px',
          height: '400px',
          background:
            'rgba(255,100,0,0.12)',
          top: '-100px',
          left: '-100px',
        }}
      />

      <FloatingOrb
        style={{
          width: '300px',
          height: '300px',
          background:
            'rgba(120,0,255,0.1)',
          bottom: '-80px',
          right: '-80px',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '420px',
          background:
            'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          border:
            '1px solid rgba(255,255,255,0.09)',
          borderRadius: '28px',
          padding: '36px 32px',
        }}
      >
        {/* HEADER */}

        <div
          style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <h1
            style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: 800,
              marginBottom: '6px',
            }}
          >
            SocialApp
          </h1>

          <p
            style={{
              color:
                'rgba(255,255,255,0.4)',
              fontSize: '13px',
            }}
          >
            {mode === 'signup'
              ? 'Créez votre compte'
              : 'Connexion à votre espace'}
          </p>
        </div>

        {/* PLAN */}

        {mode !== 'success' && (
          <div
            style={{
              marginBottom: '22px',
              padding: '14px',
              borderRadius: '16px',
              border: `1px solid ${planInfo.color}40`,
              background:
                'rgba(255,255,255,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: `${planInfo.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                {planInfo.emoji}
              </div>

              <div>
                <div
                  style={{
                    color: planInfo.color,
                    fontWeight: 800,
                    fontSize: '14px',
                  }}
                >
                  Offre {planInfo.label}
                </div>

                <div
                  style={{
                    color:
                      'rgba(255,255,255,0.35)',
                    fontSize: '11px',
                  }}
                >
                  {planInfo.price} ·{' '}
                  {planInfo.period}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS */}

        {mode === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle
              size={56}
              color="#22c55e"
            />

            <h2
              style={{
                color: 'white',
                marginTop: '18px',
              }}
            >
              Vérifiez votre email
            </h2>

            <p
              style={{
                color:
                  'rgba(255,255,255,0.5)',
                lineHeight: 1.7,
                fontSize: '13px',
              }}
            >
              Un email de confirmation a été
              envoyé à :
              <br />
              <strong
                style={{
                  color: '#ff8c00',
                }}
              >
                {successEmail}
              </strong>
            </p>

            <button
              className="auth-btn-primary"
              onClick={() =>
                switchMode('login')
              }
            >
              Aller à la connexion
            </button>
          </div>
        ) : (
          <>
            {/* TABS */}

            <div
              style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '24px',
              }}
            >
              <button
                onClick={() =>
                  switchMode('signup')
                }
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    mode === 'signup'
                      ? 'rgba(255,140,0,0.15)'
                      : 'transparent',
                  color:
                    mode === 'signup'
                      ? '#ff8c00'
                      : 'rgba(255,255,255,0.4)',
                }}
              >
                S'inscrire
              </button>

              <button
                onClick={() =>
                  switchMode('login')
                }
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    mode === 'login'
                      ? 'rgba(255,140,0,0.15)'
                      : 'transparent',
                  color:
                    mode === 'login'
                      ? '#ff8c00'
                      : 'rgba(255,255,255,0.4)',
                }}
              >
                Se connecter
              </button>
            </div>

            {/* SIGNUP */}

            {mode === 'signup' && (
              <form
                onSubmit={handleSignup}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={handleEmailChange}
                  className="auth-input"
                  required
                />

                {emailIsDisposable && (
                  <div
                    style={{
                      color: '#ef4444',
                      fontSize: '12px',
                    }}
                  >
                    Email temporaire détecté.
                  </div>
                )}

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  className="auth-input"
                  required
                />

                <input
                  type={
                    showConfirm
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  className="auth-input"
                  required
                />

                {error && (
                  <div
                    style={{
                      color: '#f87171',
                      fontSize: '12px',
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={
                    loading ||
                    emailIsDisposable
                  }
                >
                  {loading ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* LOGIN */}

            {mode === 'login' && (
              <form
                onSubmit={handleLogin}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  className="auth-input"
                  required
                />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  className="auth-input"
                  required
                />

                {error && (
                  <div
                    style={{
                      color: '#f87171',
                      fontSize: '12px',
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}