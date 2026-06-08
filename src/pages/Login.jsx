import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, ShieldX, XCircle } from 'lucide-react';

function FloatingOrb({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', ...style }} />;
}

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.biz','guerrillamail.de','guerrillamail.info','sharklasers.com',
  'guerrillamailblock.com','grr.la','spam4.me','yopmail.com','yopmail.fr',
  'cool.fr.nf','jetable.fr.nf','nospam.ze.tc','nomail.xl.cx','mega.zik.dj',
  'speed.1s.fr','courriel.fr.nf','moncourrier.fr.nf','monemail.fr.nf',
  'monmail.fr.nf','trashmail.com','trashmail.at','trashmail.io','trashmail.me',
  'trashmail.net','trashmail.org','trashmail.xyz','trash-mail.at',
  'trashmailer.com','mailnull.com','mailnesia.com','maildrop.cc',
  'dispostable.com','tempmail.com','temp-mail.org','tempail.com',
  'tempr.email','tempsky.com','10minutemail.com','10minutemail.net',
  '10minutemail.org','10minutemail.co.uk','10minutemail.de','10minutemail.ru',
  '10minutemail.nl','10minutemail.be','10minutemail.es','10minutemail.eu',
  '10minutemail.info','10minutemail.us','10minutemail.io','20minutemail.com',
  'throwam.com','throwaway.email','fakeinbox.com','fake-email.pp.ua',
  'fakeemailgenerator.com','mailforspam.com','spamgourmet.com','spamgourmet.net',
  'spamgourmet.org','spambox.us','spaml.de','spam.la','getnada.com','nada.email',
  'moakt.com','moakt.ws','moakt.cc','moakt.co','emailondeck.com','mailsac.com',
  'tempemail.net','tempemail.com','discard.email','discardmail.com',
  'discardmail.de','filzmail.com','filzmail.de','mailcatch.com',
  'getairmail.com','burnermail.io','harakirimail.com','email-fake.com',
  'tempomail.fr','temp.email','mohmal.com','throwam.net',
  'emailfake.com','emailfake.ml','fakemail.net','fakemail.fr',
  'boun.cr','schrott-email.de','meltmail.com','spamwc.de',
  'tempmail.ninja','tempinbox.xyz','mailseal.de','trbvm.com',
  '0-mail.com','0815.ru','0815.su','0815.ry','0clickemail.com',
]);

function isDisposableEmail(email) {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  const parts = domain.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (DISPOSABLE_DOMAINS.has(parent)) return true;
  }
  return false;
}

const PLAN_INFO = {
  basic:      { label:'BASIC',      color:'#6366f1', emoji:'⚡', price:'10 000 FCFA', period:'Paiement annuel', highlight:null },
  pro:        { label:'PRO',        color:'#ff8c00', emoji:'🚀', price:'15 000 FCFA', period:'Paiement annuel', highlight:'Le plus populaire' },
  business:   { label:'BUSINESS',   color:'#f7c948', emoji:'💼', price:'25 000 FCFA', period:'Paiement annuel', highlight:'Tout inclus' },
  événement:  { label:'ÉVÉNEMENT',  color:'#22c55e', emoji:'🎉', price:'Sur devis',   period:'Par événement',  highlight:null },
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();

  const planFromUrl  = searchParams.get('plan') || 'basic';
  const selectedPlan = PLAN_INFO[planFromUrl] ? planFromUrl : 'basic';

  // ✅ mode: 'login' | 'signup' | 'forgot' | 'success' | 'forgot-success'
  const [mode,            setMode]            = useState('login');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [emailWarning,    setEmailWarning]    = useState('');
  const [successEmail,    setSuccessEmail]    = useState('');
  const [supabase,        setSupabase]        = useState(null);

  useEffect(() => {
    import('../supabase').then(mod => setSupabase(mod.supabase));
  }, []);

  // ✅ Si un plan est dans l'URL → basculer en mode signup
  useEffect(() => {
    if (searchParams.get('plan')) setMode('signup');
  }, [searchParams]);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setEmailWarning(val.includes('@') && isDisposableEmail(val) ? '⚠️ Adresse temporaire non acceptée.' : '');
  };

  const resetForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setError(''); setEmailWarning('');
    setShowPassword(false); setShowConfirm(false);
  };

  const switchMode = (newMode) => { resetForm(); setMode(newMode); };

  // ── Inscription ──────────────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !confirmPassword) { setError('Veuillez remplir tous les champs.'); return; }
    if (isDisposableEmail(email)) { setError('Les adresses email temporaires ne sont pas autorisées.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + '/dashboard', data: { plan: selectedPlan } },
      });
      if (signUpError) throw signUpError;
      if (data?.user) await supabase.auth.updateUser({ data: { plan: selectedPlan } });
      setSuccessEmail(email);
      setMode('success');
    } catch (err) {
      setError(err.message?.includes('already registered') ? 'Cet email est déjà utilisé. Connectez-vous.' : err.message || "Erreur lors de l'inscription.");
    } finally { setLoading(false); }
  };

  // ── Connexion ────────────────────────────────────────────────────────────────
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
      if (err.message?.includes('Invalid login'))        setError('Email ou mot de passe incorrect.');
      else if (err.message?.includes('Email not confirmed')) setError('Confirmez votre email avant de vous connecter.');
      else setError(err.message || 'Erreur de connexion.');
    } finally { setLoading(false); }
  };

  // ── Mot de passe oublié ──────────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Veuillez entrer votre adresse email.'); return; }
    if (!supabase) return;
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (resetError) throw resetError;
      setSuccessEmail(email);
      setMode('forgot-success');
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi de l'email.");
    } finally { setLoading(false); }
  };

  // ── Auth sociale ─────────────────────────────────────────────────────────────
  const handleSocialAuth = async (provider) => {
    if (!supabase) return;
    const key = provider === 'Google' ? 'google' : provider === 'Apple' ? 'apple' : 'facebook';
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: key, options: { redirectTo: window.location.origin + '/dashboard' } });
      if (error) throw error;
    } catch (err) { setError(err.message || `Erreur via ${provider}.`); }
  };

  const emailIsTyped      = email.includes('@');
  const emailIsDisposable = emailIsTyped && isDisposableEmail(email);
  const pwdStrength = password.length >= 10 ? '#22c55e' : password.length >= 6 ? '#f97316' : '#ef4444';
  const pwdLabel    = password.length < 6 ? 'Faible' : password.length < 10 ? 'Moyen' : 'Fort';

  const modeTitle = {
    login:          'Connectez-vous à votre espace',
    signup:         'Créez votre compte gratuitement',
    forgot:         'Réinitialisez votre mot de passe',
    success:        'Vérifiez votre boîte mail',
    'forgot-success': 'Email envoyé !',
  };

  const socialButtons = [
    { name:'Google',   icon:<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
    { name:'Apple',    icon:<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg> },
    { name:'Facebook', icon:<svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#1a1825', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative', overflow:'hidden', fontFamily:"'Sora','Segoe UI',sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        .auth-input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:14px 16px 14px 46px; color:white; font-size:14px; font-family:'Sora',sans-serif; outline:none; transition:border-color 0.2s,background 0.2s; }
        .auth-input::placeholder { color:rgba(255,255,255,0.25); }
        .auth-input:focus { border-color:rgba(255,140,0,0.6); background:rgba(255,140,0,0.06); }
        .auth-input.email-ok  { border-color:rgba(34,197,94,0.5)!important; background:rgba(34,197,94,0.04)!important; }
        .auth-input.email-bad { border-color:rgba(239,68,68,0.7)!important; background:rgba(239,68,68,0.06)!important; }
        .auth-btn-primary { width:100%; padding:15px; border-radius:14px; border:none; cursor:pointer; font-family:'Sora',sans-serif; font-weight:700; font-size:15px; color:white; background:linear-gradient(135deg,#ff8c00,#ff5500); box-shadow:0 8px 32px rgba(255,140,0,0.35); transition:transform 0.15s,box-shadow 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .auth-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 12px 40px rgba(255,140,0,0.45); }
        .auth-btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
        .link-btn { background:none; border:none; cursor:pointer; color:#ff8c00; font-size:12px; font-weight:600; font-family:'Sora',sans-serif; padding:0; text-decoration:none; }
        .link-btn:hover { text-decoration:underline; }
        .social-btn { display:flex; align-items:center; justify-content:center; gap:6px; padding:11px 8px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); cursor:pointer; font-size:12px; font-weight:500; color:rgba(255,255,255,0.8); font-family:'Sora',sans-serif; transition:all 0.15s; }
        .social-btn:hover { background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.2); }
        .disposable-warning { display:flex; align-items:flex-start; gap:8px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:9px 12px; margin-top:6px; }
        .email-ok-badge { display:flex; align-items:center; gap:6px; font-size:11px; color:rgba(34,197,94,0.8); margin-top:5px; padding-left:4px; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes checkPop { 0%{transform:scale(0) rotate(-10deg)} 70%{transform:scale(1.15) rotate(3deg)} 100%{transform:scale(1) rotate(0deg)} }
        @keyframes shakeX   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        .fade-up   { animation:fadeUp   0.4s  ease both; }
        .scale-in  { animation:scaleIn  0.35s ease both; }
        .check-pop { animation:checkPop 0.5s  cubic-bezier(0.34,1.56,0.64,1) both; }
        .shake     { animation:shakeX   0.45s ease both; }
      `}</style>

      <FloatingOrb style={{ width:'400px', height:'400px', background:'rgba(255,100,0,0.10)', top:'-100px', left:'-100px' }} />
      <FloatingOrb style={{ width:'300px', height:'300px', background:'rgba(120,0,255,0.08)', bottom:'-80px', right:'-80px' }} />

      <div className="scale-in" style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'420px', background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'28px', padding:'36px 32px', boxShadow:'0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)' }}>

        {/* Logo + Titre */}
        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <div style={{ width:'60px', height:'60px', borderRadius:'18px', background:'linear-gradient(135deg,#ff8c00,#ff3300)', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 28px rgba(255,140,0,0.4)', overflow:'hidden' }}>
            <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width:'100%', height:'100%', objectFit:'cover' }}
              onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="color:white;font-size:24px;font-weight:900">S</span>'; }} />
          </div>
          <h1 style={{ color:'white', fontSize:'22px', fontWeight:800, margin:'0 0 4px', letterSpacing:'-0.3px' }}>SocialApp</h1>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', margin:0 }}>{modeTitle[mode]}</p>
        </div>

        {/* ── SUCCÈS INSCRIPTION ── */}
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

        {/* ── SUCCÈS MOT DE PASSE OUBLIÉ ── */}
        {mode === 'forgot-success' && (
          <div className="fade-up" style={{ textAlign:'center' }}>
            <div className="check-pop" style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(34,197,94,0.15)', border:'2px solid rgba(34,197,94,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <CheckCircle size={36} color="#22c55e" />
            </div>
            <h2 style={{ color:'white', fontSize:'18px', fontWeight:700, marginBottom:'10px' }}>Email envoyé !</h2>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'13px', lineHeight:1.7, marginBottom:'20px' }}>
              Un lien de réinitialisation a été envoyé à<br />
              <strong style={{ color:'rgba(255,140,0,0.9)' }}>{successEmail}</strong>.<br />
              Cliquez le lien pour créer un nouveau mot de passe.
            </p>
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'14px', marginBottom:'24px', textAlign:'left' }}>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', margin:0, lineHeight:1.7 }}>
                📧 Vérifiez vos <strong style={{ color:'rgba(255,255,255,0.7)' }}>spams</strong> si vous ne voyez pas l'email.<br />
                ⏰ Le lien expire après quelques minutes.
              </p>
            </div>
            <button onClick={() => switchMode('login')} className="auth-btn-primary">
              Retour à la connexion <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── FORMULAIRES ── */}
        {!['success','forgot-success'].includes(mode) && (
          <>
            {/* Navigation entre modes */}
            <div style={{ marginBottom:'20px', textAlign:'center' }}>
              {mode === 'login' && (
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', margin:0 }}>
                  Pas encore de compte ?{' '}
                  <button className="link-btn" onClick={() => switchMode('signup')}>S'inscrire gratuitement</button>
                </p>
              )}
              {mode === 'signup' && (
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', margin:0 }}>
                  Déjà un compte ?{' '}
                  <button className="link-btn" onClick={() => switchMode('login')}>Se connecter</button>
                </p>
              )}
              {mode === 'forgot' && (
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', margin:0 }}>
                  <button className="link-btn" onClick={() => switchMode('login')}>← Retour à la connexion</button>
                </p>
              )}
            </div>

            {/* ── CONNEXION ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="fade-up" autoComplete="on" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div style={{ position:'relative' }}>
                  <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type="email" className="auth-input" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
                </div>
                <div style={{ position:'relative' }}>
                  <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type={showPassword?'text':'password'} className="auth-input" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required style={{ paddingRight:'46px' }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'4px', display:'flex', alignItems:'center' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* ✅ Mot de passe oublié */}
                <div style={{ textAlign:'right', marginTop:'-6px' }}>
                  <button type="button" className="link-btn" style={{ fontSize:'11px' }} onClick={() => switchMode('forgot')}>
                    Mot de passe oublié ?
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

                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
                  <span style={{ color:'rgba(255,255,255,0.25)', fontSize:'11px' }}>ou se connecter avec</span>
                  <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {socialButtons.map(({ name, icon }) => (
                    <button key={name} type="button" className="social-btn" onClick={() => handleSocialAuth(name)}>{icon} {name}</button>
                  ))}
                </div>
              </form>
            )}

            {/* ── MOT DE PASSE OUBLIÉ ── */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="fade-up" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', margin:'0 0 4px', lineHeight:1.6 }}>
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
                <div style={{ position:'relative' }}>
                  <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type="email" className="auth-input" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
                </div>
                {error && (
                  <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:'8px' }}>
                    <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
                    <p style={{ color:'#f87171', fontSize:'12px', margin:0, lineHeight:1.5 }}>{error}</p>
                  </div>
                )}
                <button type="submit" className="auth-btn-primary" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Envoyer le lien <ArrowRight size={16} /></>}
                </button>
              </form>
            )}

            {/* ── INSCRIPTION ── */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="fade-up" autoComplete="off" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <input type="text" name="username" autoComplete="username" style={{ display:'none' }} readOnly tabIndex={-1} />
                <div>
                  <div style={{ position:'relative' }}>
                    <Mail size={16} color={emailIsDisposable?'#ef4444':emailIsTyped?'#22c55e':'rgba(255,255,255,0.3)'} style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', transition:'color 0.2s' }} />
                    <input type="email" className={`auth-input${emailIsDisposable?' email-bad':emailIsTyped?' email-ok':''}`} placeholder="votre@email.com" value={email} onChange={handleEmailChange} autoComplete="email" required />
                    {emailIsTyped && <div style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'13px' }}>{emailIsDisposable?'🚫':'✅'}</div>}
                  </div>
                  {emailIsDisposable && (
                    <div className="disposable-warning shake">
                      <ShieldX size={14} color="#ef4444" style={{ flexShrink:0, marginTop:'1px' }} />
                      <p style={{ color:'#f87171', fontSize:'11px', margin:0, lineHeight:1.5 }}>Adresse temporaire détectée. Utilisez Gmail, Outlook, Yahoo…</p>
                    </div>
                  )}
                  {emailIsTyped && !emailIsDisposable && <div className="email-ok-badge"><CheckCircle size={11} color="#22c55e" /> Adresse email valide</div>}
                </div>
                <div style={{ position:'relative' }}>
                  <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type={showPassword?'text':'password'} className="auth-input" placeholder="Mot de passe (min. 6 caractères)" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required style={{ paddingRight:'46px' }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'4px', display:'flex', alignItems:'center' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div style={{ position:'relative' }}>
                  <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type={showConfirm?'text':'password'} className="auth-input" placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required style={{ paddingRight:'46px' }} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'4px', display:'flex', alignItems:'center' }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background:password.length>=i*3?pwdStrength:'rgba(255,255,255,0.1)', transition:'background 0.3s' }} />
                    ))}
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', marginLeft:'4px', whiteSpace:'nowrap' }}>{pwdLabel}</span>
                  </div>
                )}
                {error && (
                  <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:'8px' }}>
                    <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
                    <p style={{ color:'#f87171', fontSize:'12px', margin:0, lineHeight:1.5 }}>{error}</p>
                  </div>
                )}
                <button type="submit" className="auth-btn-primary" disabled={loading || emailIsDisposable}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Créer mon compte <ArrowRight size={16} /></>}
                </button>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
                  <span style={{ color:'rgba(255,255,255,0.25)', fontSize:'11px' }}>ou s'inscrire avec</span>
                  <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {socialButtons.map(({ name, icon }) => (
                    <button key={name} type="button" className="social-btn" onClick={() => handleSocialAuth(name)}>{icon} {name}</button>
                  ))}
                </div>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', textAlign:'center', lineHeight:1.6, margin:0 }}>
                  En créant un compte, vous acceptez nos <span style={{ color:'rgba(255,140,0,0.7)', cursor:'pointer' }}>conditions d'utilisation</span>.
                </p>
              </form>
            )}
          </>
        )}

        <p style={{ color:'rgba(255,255,255,0.15)', fontSize:'10px', textAlign:'center', marginTop:'20px', marginBottom:0 }}>SocialApp.work · Tous droits réservés</p>
      </div>
    </div>
  );
}