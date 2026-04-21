import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Loader2, Mail, Lock } from 'lucide-react';
import logo from '../assets/favicon.jpg';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(160deg, #0f0a1e, #2d1b69)' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '28px 32px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', margin: '0 auto 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: 0 }}>Socialapp</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '4px' }}>Connectez-vous à votre espace</p>
        </div>
        <div style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>Email</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '0 14px' }}>
                <Mail size={16} color="rgba(255,255,255,0.4)" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '14px', padding: '12px 0' }} />
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>Mot de passe</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '0 14px' }}>
                <Lock size={16} color="rgba(255,255,255,0.4)" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '14px', padding: '12px 0' }} />
              </div>
            </div>
            {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px', marginTop: '8px' }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}