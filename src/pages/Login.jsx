import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

function FloatingOrb({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', ...style }} />;
}

// ✅ Correspond exactement à PLAN_LIMITS dans UserDashboard.jsx
const PLAN_INFO = {
  basic: {
    label: 'BASIC',
    color: '#6366f1',
    emoji: '⚡',
    price: '10 000 FCFA',
    period: 'Paiement annuel',
    features: [
      '1 profil',
      '3 liens',
      'Boutique marketplace - 4 produits',
      'Documents PDF',
      'Page publique',
    ],
  },
  pro: {
    label: 'PRO',
    color: '#ff8c00',
    emoji: '🚀',
    price: '15 000 FCFA',
    period: 'Paiement annuel',
    features: [
      '2 profils',
      '7 liens',
      'Boutique marketplace - 10 produits',
      'Documents PDF',
      'Statistiques',
      '1 Carte NFC ou PVC (logo & QR)',
      'Support standard',
    ],
  },
  business: {
    label: 'BUSINESS',
    color: '#f7c948',
    emoji: '💼',
    price: '25 000 FCFA',
    period: 'Paiement annuel',
    features: [
      '2 profils',
      '10 liens',
      'Boutique marketplace - 10 produits',
      'Documents PDF',
      'Statistiques',
      'QR code avec votre logo',
      '2 Cartes NFC ou PVC',
      'Support prioritaire',
    ],
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();

  const planFromUrl = searchParams.get('plan') || 'basic';
  const selectedPlan = PLAN_INFO[planFromUrl] ? planFromUrl : 'basic';
  const planInfo = PLAN_INFO[selectedPlan];

  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successEmail, setSuccessEmail] = useState('');
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    import('../supabase').then(mod => setSupabase(mod.supabase));
  }, []);

  const resetForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setError(''); setShowPassword(false); setShowConfirm(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !confirmPassword) { setError('Veuillez remplir tous les champs.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (!supabase) return;

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
          data: { plan: selectedPlan }, // ✅ plan sauvegardé dans user_metadata dès l'inscription
        },
      });
      if (signUpError) throw signUpError;

      // ✅ Double sauvegarde — updateUser pour s'assurer que le plan est bien enregistré
      if (data?.user) {
        await supabase.auth.updateUser({ data: { plan: selectedPlan } });
      }

      setSuccessEmail(email);
      setMode('success');
    } catch (err) {
      if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
        setError('Cet email est déjà utilisé. Connectez-vous à la place.');
      } else {
        setError(err.message || "Erreur lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }
    setLoading(true);
    try {
      const { error: loginError } = await signIn(email, password);
      if (loginError) throw loginError;
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.message?.includes('Invalid login')) {
        setError('Email ou mot de passe incorrect.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter.');
      } else {
        setError(err.message || 'Erreur de connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => { resetForm(); setMode(newMode); };

  return (
    <div style={{ minHeight: '100vh', background: '#060412', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden', fontFamily: "'Sora', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .auth-input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:14px 16px 14px 46px; color:white; font-size:14px; font-family:'Sora',sans-serif; outline:none; transition:border-color 0.2s,background 0.2s; }
        .auth-input::placeholder { color:rgba(255,255,255,0.25); }
        .auth-input:focus { border-color:rgba(255,140,0,0.6); background:rgba(255,140,0,0.06); }
        .auth-btn-primary { width:100%; padding:15px; border-radius:14px; border:none; cursor:pointer; font-family:'Sora',sans-serif; font-weight:700; font-size:15px; color:white; background:linear-gradient(135deg,#ff8c00,#ff5500); box-shadow:0 8px 32px rgba(255,140,0,0.35); transition:transform 0.15s,box-shadow 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .auth-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 12px 40px rgba(255,140,0,0.45); }
        .auth-btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
        .tab-btn { flex:1; padding:10px; border-radius:10px; border:none; cursor:pointer; font-family:'Sora',sans-serif; font-weight:600; font-size:13px; transition:all 0.2s; }
        .tab-btn.active { background:rgba(255,140,0,0.15); border:1px solid rgba(255,140,0,0.35); color:#ff8c00; }
        .tab-btn.inactive { background:transparent; border:1px solid transparent; color:rgba(255,255,255,0.35); }
        .plan-feature { display:flex; align-items:center; gap:7px; font-size:12px; color:rgba(255,255,255,0.65); padding:2px 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.4s ease both; }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        .scale-in { animation:scaleIn 0.35s ease both; }
        @keyframes checkPop { 0%{transform:scale(0) rotate(-10deg)} 70%{transform:scale(1.15) rotate(3deg)} 100%{transform:scale(1) rotate(0deg)} }
        .check-pop { animation:checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <FloatingOrb style={{ width:'400px', height:'400px', background:'rgba(255,100,0,0.12)', top:'-100px', left:'-100px' }} />
      <FloatingOrb style={{ width:'300px', height:'300px', background:'rgba(120,0,255,0.1)', bottom:'-80px', right:'-80px' }} />

      <div className="scale-in" style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'420px', background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'28px', padding:'36px 32px', boxShadow:'0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)' }}>

        {/* Logo + Titre */}
        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <div style={{ width:'60px', height:'60px', borderRadius:'18px', background:'linear-gradient(135deg,#ff8c00,#ff3300)', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 28px rgba(255,140,0,0.4)', overflow:'hidden' }}>
            <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="color:white;font-size:24px;font-weight:900">S</span>'; }} />
          </div>
          <h1 style={{ color:'white', fontSize:'22px', fontWeight:800, margin:'0 0 4px', letterSpacing:'-0.3px' }}>SocialApp</h1>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', margin:0 }}>
            {mode === 'success' ? 'Vérifiez votre boîte mail' : mode === 'signup' ? 'Créez votre compte gratuitement' : 'Connectez-vous à votre espace'}
          </p>
        </div>

        {/* ── Bandeau plan sélectionné ── */}
        {mode !== 'success' && (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${planInfo.color}40`, borderRadius:'14px', padding:'12px 14px', marginBottom:'20px' }}>
            {/* En-tête offre */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'9px', background: `${planInfo.color}20`, border: `1px solid ${planInfo.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>{planInfo.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ color: planInfo.color, fontSize:'12px', fontWeight:800, letterSpacing:'0.05em' }}>Offre {planInfo.label}</span>
                  <span style={{ background: `${planInfo.color}20`, color: planInfo.color, fontSize:'10px', fontWeight:700, padding:'1px 7px', borderRadius:'20px' }}>{planInfo.price}</span>
                  <span style={{ color:'rgba(255,255,255,0.25)', fontSize:'10px' }}>/ {planInfo.period}</span>
                </div>
              </div>
            </div>
            {/* Liste des fonctionnalités */}
            <div style={{ borderTop:`1px solid ${planInfo.color}20`, paddingTop:'8px', display:'flex', flexDirection:'column', gap:'3px' }}>
              {planInfo.features.map((f, i) => (
                <div key={i} className="plan-feature">
                  <span style={{ color: planInfo.color, fontSize:'11px', flexShrink:0 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ÉCRAN SUCCÈS ── */}
        {mode === 'success' && (
          <div className="fade-up" style={{ textAlign:'center' }}>
            <div className="check-pop" style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(34,197,94,0.15)', border:'2px solid rgba(34,197,94,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <CheckCircle size={36} color="#22c55e" />
            </div>
            <h2 style={{ color:'white', fontSize:'18px', fontWeight:700, marginBottom:'10px' }}>Inscription réussie !</h2>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'13px', lineHeight:1.7, marginBottom:'20px' }}>
              Un email de confirmation a été envoyé à<br />
              <strong style={{ color:'rgba(255,140,0,0.9)' }}>{successEmail}</strong>.<br />
              Confirmez votre email pour activer votre compte.
            </p>
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'14px', marginBottom:'24px', textAlign:'left' }}>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', margin:0, lineHeight:1.7 }}>
                📧 Vérifiez vos <strong style={{ color:'rgba(255,255,255,0.7)' }}>spams</strong> si vous ne voyez pas l'email.<br />
                ✅ Après confirmation, revenez vous connecter.
              </p>
            </div>
            <button onClick={() => switchMode('login')} className="auth-btn-primary">
              Aller à la connexion <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── TABS ── */}
        {mode !== 'success' && (
          <>
            <div style={{ display:'flex', gap:'6px', marginBottom:'24px', background:'rgba(255,255,255,0.04)', borderRadius:'14px', padding:'4px' }}>
              <button className={`tab-btn ${mode === 'signup' ? 'active' : 'inactive'}`} onClick={() => switchMode('signup')}>✨ S'inscrire</button>
              <button className={`tab-btn ${mode === 'login' ? 'active' : 'inactive'}`} onClick={() => switchMode('login')}>🔐 Se connecter</button>
            </div>

            {/* FORMULAIRE INSCRIPTION */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="fade-up" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div style={{ position:'relative' }}>
                  <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type="email" className="auth-input" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
                </div>
                <div style={{ position:'relative' }}>
                  <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type={showPassword ? 'text' : 'password'} className="auth-input" placeholder="Mot de passe (min. 6 caractères)" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required style={{ paddingRight:'46px' }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'4px', display:'flex', alignItems:'center' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div style={{ position:'relative' }}>
                  <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type={showConfirm ? 'text' : 'password'} className="auth-input" placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required style={{ paddingRight:'46px' }} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'4px', display:'flex', alignItems:'center' }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background: password.length >= i * 3 ? (password.length >= 10 ? '#22c55e' : password.length >= 6 ? '#f97316' : '#ef4444') : 'rgba(255,255,255,0.1)', transition:'background 0.3s' }} />
                    ))}
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', marginLeft:'4px', whiteSpace:'nowrap' }}>{password.length < 6 ? 'Faible' : password.length < 10 ? 'Moyen' : 'Fort'}</span>
                  </div>
                )}
                {error && (
                  <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:'8px' }}>
                    <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
                    <p style={{ color:'#f87171', fontSize:'12px', margin:0, lineHeight:1.5 }}>{error}</p>
                  </div>
                )}
                <button type="submit" className="auth-btn-primary" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Créer mon compte <ArrowRight size={16} /></>}
                </button>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', textAlign:'center', lineHeight:1.6, margin:0 }}>
                  En créant un compte, vous acceptez nos <span style={{ color:'rgba(255,140,0,0.7)', cursor:'pointer' }}>conditions d'utilisation</span>.
                </p>
              </form>
            )}

            {/* FORMULAIRE CONNEXION */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="fade-up" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div style={{ position:'relative' }}>
                  <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type="email" className="auth-input" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
                </div>
                <div style={{ position:'relative' }}>
                  <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type={showPassword ? 'text' : 'password'} className="auth-input" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required style={{ paddingRight:'46px' }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'4px', display:'flex', alignItems:'center' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {error && (
                  <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:'8px' }}>
                    <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
                    <p style={{ color:'#f87171', fontSize:'12px', margin:0, lineHeight:1.5 }}>{error}</p>
                  </div>
                )}
                <button type="submit" className="auth-btn-primary" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Se connecter <ArrowRight size={16} /></>}
                </button>
              </form>
            )}

            <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'20px 0 0' }}>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
              <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'11px' }}>ou</span>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
            </div>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', textAlign:'center', marginTop:'14px' }}>
              {mode === 'signup' ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
              <button onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')} style={{ background:'none', border:'none', cursor:'pointer', color:'#ff8c00', fontSize:'12px', fontWeight:600, fontFamily:'Sora,sans-serif', padding:0 }}>
                {mode === 'signup' ? 'Se connecter' : "S'inscrire gratuitement"}
              </button>
            </p>
          </>
        )}

        <p style={{ color:'rgba(255,255,255,0.15)', fontSize:'10px', textAlign:'center', marginTop:'20px', marginBottom:0 }}>SocialApp.work · Tous droits réservés</p>
      </div>
    </div>
  );
}