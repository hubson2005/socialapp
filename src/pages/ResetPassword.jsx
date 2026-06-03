import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState(false);
  const [tokenError,   setTokenError]   = useState(null); // ✅ gestion erreur token
  const [supabase,     setSupabase]     = useState(null);

 useEffect(() => {
  import('../supabase').then(mod => setSupabase(mod.supabase));
}, []);

  // ✅ Détection des erreurs dans l'URL (#error=access_denied, token expiré, etc.)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const errorCode = params.get('error_code');
      const errorDesc = params.get('error_description');

      if (errorCode === 'otp_expired' || errorDesc?.includes('expired')) {
        setTokenError('expired');
      } else if (errorCode === 'access_denied') {
        setTokenError('invalid');
      } else {
        setTokenError('unknown');
      }
    }
  }, []);

  const pwdStrength = password.length >= 10 ? '#22c55e' : password.length >= 6 ? '#f97316' : '#ef4444';
  const pwdLabel    = password.length < 6 ? 'Faible' : password.length < 10 ? 'Moyen' : 'Fort';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (!supabase) return;
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      // ✅ Redirige vers /login après 3 secondes (jamais vers le dashboard)
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#1a1825', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:"'Sora','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        * { box-sizing:border-box; }
        .rp-input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:14px 46px; color:white; font-size:14px; font-family:'Sora',sans-serif; outline:none; transition:border-color 0.2s; }
        .rp-input::placeholder { color:rgba(255,255,255,0.25); }
        .rp-input:focus { border-color:rgba(255,140,0,0.6); background:rgba(255,140,0,0.06); }
        .rp-btn { width:100%; padding:15px; border-radius:14px; border:none; cursor:pointer; font-family:'Sora',sans-serif; font-weight:700; font-size:15px; color:white; background:linear-gradient(135deg,#ff8c00,#ff5500); box-shadow:0 8px 32px rgba(255,140,0,0.35); transition:transform 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .rp-btn:hover:not(:disabled) { transform:translateY(-1px); }
        .rp-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .rp-btn-secondary { width:100%; padding:13px; border-radius:14px; border:1px solid rgba(255,255,255,0.15); cursor:pointer; font-family:'Sora',sans-serif; font-weight:600; font-size:14px; color:rgba(255,255,255,0.7); background:rgba(255,255,255,0.05); transition:all 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .rp-btn-secondary:hover { background:rgba(255,255,255,0.1); }
        @keyframes scaleIn  { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes checkPop { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }
        .scale-in  { animation:scaleIn  0.35s ease both; }
        .check-pop { animation:checkPop 0.5s  cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      {/* Orbes de fond */}
      <div style={{ position:'absolute', width:'400px', height:'400px', borderRadius:'50%', filter:'blur(80px)', background:'rgba(255,100,0,0.10)', top:'-100px', left:'-100px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'300px', height:'300px', borderRadius:'50%', filter:'blur(80px)', background:'rgba(120,0,255,0.08)', bottom:'-80px', right:'-80px', pointerEvents:'none' }} />

      <div className="scale-in" style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'420px', background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'28px', padding:'36px 32px', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{ width:'60px', height:'60px', borderRadius:'18px', background:'linear-gradient(135deg,#ff8c00,#ff3300)', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 28px rgba(255,140,0,0.4)', overflow:'hidden' }}>
            <img src="/Logo_SocialApp.png" alt="SocialApp" style={{ width:'100%', height:'100%', objectFit:'cover' }}
              onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="color:white;font-size:24px;font-weight:900">S</span>'; }} />
          </div>
          <h1 style={{ color:'white', fontSize:'22px', fontWeight:800, margin:'0 0 4px' }}>SocialApp</h1>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', margin:0 }}>
            {success ? 'Mot de passe mis à jour !' : tokenError ? 'Lien invalide' : 'Créez votre nouveau mot de passe'}
          </p>
        </div>

        {/* ── ERREUR TOKEN EXPIRÉ ── */}
        {tokenError === 'expired' && (
          <div style={{ textAlign:'center' }}>
            <div className="check-pop" style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(239,68,68,0.15)', border:'2px solid rgba(239,68,68,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <XCircle size={36} color="#ef4444" />
            </div>
            <h2 style={{ color:'white', fontSize:'18px', fontWeight:700, marginBottom:'10px' }}>Lien expiré ⏰</h2>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', lineHeight:1.7, marginBottom:'24px' }}>
              Ce lien de réinitialisation n'est plus valide.<br />
              Les liens expirent après quelques minutes pour votre sécurité.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <button className="rp-btn" onClick={() => navigate('/login?forgot=true')}>
                Demander un nouveau lien
              </button>
              <button className="rp-btn-secondary" onClick={() => navigate('/login')}>
                Retour à la connexion
              </button>
            </div>
          </div>
        )}

        {/* ── ERREUR TOKEN INVALIDE ── */}
        {(tokenError === 'invalid' || tokenError === 'unknown') && (
          <div style={{ textAlign:'center' }}>
            <div className="check-pop" style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(239,68,68,0.15)', border:'2px solid rgba(239,68,68,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <XCircle size={36} color="#ef4444" />
            </div>
            <h2 style={{ color:'white', fontSize:'18px', fontWeight:700, marginBottom:'10px' }}>Lien invalide ❌</h2>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', lineHeight:1.7, marginBottom:'24px' }}>
              Ce lien de réinitialisation est invalide ou a déjà été utilisé.<br />
              Veuillez en demander un nouveau.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <button className="rp-btn" onClick={() => navigate('/login')}>
                Retour à la connexion
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCÈS ── */}
        {success && !tokenError && (
          <div style={{ textAlign:'center' }}>
            <div className="check-pop" style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(34,197,94,0.15)', border:'2px solid rgba(34,197,94,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <CheckCircle size={36} color="#22c55e" />
            </div>
            <h2 style={{ color:'white', fontSize:'18px', fontWeight:700, marginBottom:'10px' }}>Mot de passe mis à jour !</h2>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', lineHeight:1.7 }}>
              Vous allez être redirigé vers la page de connexion dans quelques secondes…
            </p>
          </div>
        )}

        {/* ── FORMULAIRE ── */}
        {!success && !tokenError && (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* Mot de passe */}
            <div style={{ position:'relative' }}>
              <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type={showPassword ? 'text' : 'password'} className="rp-input" placeholder="Nouveau mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'4px', display:'flex', alignItems:'center' }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Barre de force */}
            {password.length > 0 && (
              <div style={{ display:'flex', gap:'4px', alignItems:'center', marginTop:'-8px' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background: password.length >= i * 3 ? pwdStrength : 'rgba(255,255,255,0.1)', transition:'background 0.3s' }} />
                ))}
                <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', marginLeft:'4px', whiteSpace:'nowrap' }}>{pwdLabel}</span>
              </div>
            )}

            {/* Confirmation */}
            <div style={{ position:'relative' }}>
              <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type={showConfirm ? 'text' : 'password'} className="rp-input" placeholder="Confirmer le mot de passe" value={confirm} onChange={e => setConfirm(e.target.value)} required />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'4px', display:'flex', alignItems:'center' }}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Indicateur correspondance */}
            {confirm.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', marginTop:'-8px', color: password === confirm ? '#22c55e' : '#ef4444' }}>
                {password === confirm
                  ? <><CheckCircle size={12} /> Les mots de passe correspondent</>
                  : <><AlertCircle size={12} /> Les mots de passe ne correspondent pas</>
                }
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:'8px' }}>
                <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
                <p style={{ color:'#f87171', fontSize:'12px', margin:0, lineHeight:1.5 }}>{error}</p>
              </div>
            )}

            <button type="submit" className="rp-btn" disabled={loading || password !== confirm || password.length < 6}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer le nouveau mot de passe'}
            </button>
          </form>
        )}

        <p style={{ color:'rgba(255,255,255,0.15)', fontSize:'10px', textAlign:'center', marginTop:'20px', marginBottom:0 }}>
          SocialApp.work · Tous droits réservés
        </p>
      </div>
    </div>
  );
}