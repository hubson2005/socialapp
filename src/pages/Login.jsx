import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, ShieldX } from 'lucide-react';

function FloatingOrb({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', ...style }} />;
}

// ─── Liste étendue de domaines d'emails temporaires / jetables ───────────────
const DISPOSABLE_DOMAINS = new Set([
  // ── Classiques & très connus ──
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.biz','guerrillamail.de','guerrillamail.info','sharklasers.com',
  'guerrillamailblock.com','grr.la','guerrillamail.org','spam4.me','yopmail.com',
  'yopmail.fr','cool.fr.nf','jetable.fr.nf','nospam.ze.tc','nomail.xl.cx',
  'mega.zik.dj','speed.1s.fr','courriel.fr.nf','moncourrier.fr.nf',
  'monemail.fr.nf','monmail.fr.nf','trashmail.com','trashmail.at','trashmail.io',
  'trashmail.me','trashmail.net','trashmail.org','trashmail.xyz','trash-mail.at',
  'trashmailer.com','mailnull.com','mailnesia.com','maildrop.cc',
  'dispostable.com','tempmail.com','temp-mail.org','tempail.com',
  'tempr.email','tempsky.com','10minutemail.com','10minutemail.net',
  '10minutemail.org','10minutemail.co.uk','10minutemail.de','10minutemail.ru',
  '10minutemail.nl','10minutemail.be','10minutemail.es','10minutemail.eu',
  '10minutemail.info','10minutemail.us','10minutemail.io','20minutemail.com',
  'throwam.com','throwam.net','throwaway.email',
  'fakeinbox.com','fake-email.pp.ua','fakeemailgenerator.com','mailforspam.com',
  'spamgourmet.com','spamgourmet.net','spamgourmet.org','spambox.us',
  'spaml.de','spam.la','spamgolf.com','spamcorptastic.com','spamcowboy.com',
  'spamcowboy.org','spamcowboy.net','spamday.com','spamdecoy.net',
  'spamex.com','spamfree24.de','spamfree24.eu','spamfree24.info',
  'spamfree24.net','spamfree24.org','spamgourmet.com','spamherelots.com',
  'spamhereplease.com','spamhole.com','spamify.com','spaminacan.com',
  'spaminator.de','spamkill.info','spaml.com','spammotel.com',
  'spamoff.de','spamslicer.com','spamspot.com','spamstack.net',
  'spamthis.co.uk','spamthisplease.com','spamtrail.com','spamtroll.net',
  'mailnull.com','discard.email','discardmail.com','discardmail.de',
  'tempemail.net','tempemail.com','throwam.com','throwaway.email',
  'getnada.com','nada.email','moakt.com','moakt.ws','moakt.cc','moakt.co',
  'tnetsolutions.net','emailondeck.com','inboxkitten.com','mailsac.com',
  'sharedmailbox.org','tempinbox.com','filzmail.com','filzmail.de',
  'klzlk.com','dingbone.com','fux0ringduh.com','hulapla.de',
  'ihateyoualot.info','imails.info','inoutmail.de','inoutmail.eu',
  'inoutmail.info','inoutmail.net','jetable.com','jetable.net',
  'jetable.org','jetable.pp.ua','jnxjn.com','jourrapide.com',
  'kasmail.com','klassmaster.com','klassmaster.net','kruununhaka.com',
  'kulturbetrieb.info','kurzepost.de','letthemeatspam.com','lhsdv.com',
  'ligsb.com','linktraining.com','litedrop.com','lol.ovpn.to',
  'lookugly.com','lortemail.dk','lr78.com','lroid.com','lukop.dk',
  'mail.by','mail.mezimages.net','mail.mezimages.com','mailbidon.com',
  'mailbiz.biz','mailblocks.com','mailbolt.com','mailchop.com',
  'mailcker.com','maildd.com','mailde.de','mailde.info',
  'maildu.de','maileater.com','mailed.in','maileme101.com',
  'mailfa.tk','mailforspam.com','mailfreeonline.com','mailfs.com',
  'mailguard.me','mailhazard.com','mailhazard.us','mailhero.io',
  'mailimate.com','mailin8r.com','mailinater.com','mailinator.net',
  'mailinator.org','mailinator.us','mailinator2.com','mailincubator.com',
  'mailismagic.com','mailjunk.cf','mailjunk.ga','mailjunk.gq',
  'mailjunk.ml','mailjunk.tk','mailkutu.com','maillnk.com',
  'mailmate.com','mailme.ir','mailme.lv','mailme24.com',
  'mailmetrash.com','mailmoat.com','mailms.com','mailnew.com',
  'mailnull.com','mailnull.net','mailorg.org','mailpick.biz',
  'mailpluss.com','mailproxsy.com','mailquack.com','mailr.eu',
  'mailrss.org','mails.omletv.tv','mailscrap.com','mailseal.de',
  'mailshell.com','mailsiphon.com','mailslite.com','mailsponge.com',
  'mailss.net','mailsto.com','mailtechx.com','mailtem.com',
  'mailtemporaire.com','mailtemporaire.fr','mailtome.de','mailtoyou.top',
  'mailtrash.net','mailtv.net','mailtv.tv','mailueberfall.de',
  'mailvault.com','mailw.info','mailwithyou.com','mailworks.org',
  '33mail.com','armyspy.com','cem.net','chacuo.net',
  'cuvox.de','dayrep.com','einrot.com','fleckens.hu',
  'gustr.com','ibnuh.bz','jourrapide.com','kurzepost.de',
  'objectmail.com','obobbo.com','odaymail.com','petml.com',
  'postinbox.com','postpro.net','powered.name','privacy.net',
  'proxymail.eu','rcpt.at','rhyta.com','safetymail.info',
  'safetypost.de','shieldedmail.com','sibmail.com','skeefmail.com',
  'slaskpost.se','slopsbox.com','smashmail.de','smellfear.com',
  'snakemail.com','sneakemail.com','sneakmail.de','snkmail.com',
  'sofimail.com','sofort-mail.de','sogetthis.com','soisz.com',
  'spamfree.eu','spamfree24.de','spamgob.com','spamgoes.in',
  'supergreatmail.com','suremail.info','tagyourself.com','tapchicongnghe.com',
  'teewars.org','teleworm.com','teleworm.us','tempalias.com',
  'tempe-mail.com','tempemail.biz','tempemail.co.za','tempemail.com',
  'tempemail.net','tempemail.org','tempinbox.co.uk','tempinbox.com',
  'tempmail.de','tempmail.eu','tempmail.it','tempmail.us',
  'temporamail.com','temporarioemail.com.br','temporaryemail.net',
  'temporaryemail.us','temporaryforwarding.com','temporaryinbox.com',
  'temporarymailaddress.com','thanksnospam.com','thankyou2010.com',
  'thisisnotmyrealemail.com','throwam.com','tilien.com',
  'tittbit.in','tizi.com','tmail.com','tmailinator.com',
  'toiea.com','tokenmail.de','toomail.biz','topranklist.de',
  'tradermail.info','trash2009.com','trash2010.com','trash2011.com',
  'trashdevil.com','trashdevil.de','trashemail.de',
  'trashimail.de','trashinbox.com','trashmail.at','trashmail.com',
  'trashmail.io','trashmail.me','trashmail.net','trashmail.org',
  'trashmail.xyz','trashmailer.com','trashmalinator.com',
  'trashtienda.com','trayna.com','trillianpro.com','trmailbox.com',
  'trollbot.org','ttt.lovemeet.faith','tualias.com',
  'turual.com','twinmail.de','tyldd.com','ubismail.net',
  'uggsrock.com','umail.net','upliftnow.com','uplipht.com',
  'uroid.com','us.af','used.cz','uyhip.com',
  'venompen.com','veryrealemail.com','viditag.com','viralplays.com',
  'vkcode.ru','vmani.com','vomoto.com','vpn.st',
  'vsimcard.com','vubby.com','w3internet.co.uk','wasteland.raven.wtf',
  'webemail.me','webm4il.info','wegwerfadresse.de','wegwerfemail.com',
  'wegwerfemail.de','wegwerfemail.net','wegwerfemail.org','wegwerfmail.de',
  'wegwerfmail.info','wegwerfmail.net','wegwerfmail.org','wegwerfnummer.de',
  'wetrainbayarea.com','wetrainbayarea.org','whyspam.me','wilemail.com',
  'willhackforfood.biz','willselfdestruct.com','wmail.cf','wolfsmail.tk',
  'wolfsmail.at','writeme.us','wronghead.com','wuzupmail.net',
  'wwwnew.eu','yapped.net','yboxmail.com','yep.it',
  'yodx.ro','yogamaven.com','yomail.info','yopmail.com',
  'yopmail.fr','yopmail.net','yopmail.pp.ua','youmail.ga',
  'yourdomain.com','yourspamgoesto.com','ytasqfxk.com','yuurok.com',
  'z1p.biz','za.com','zapto.in','zeek.ir',
  'zep.it','zerotohero.me','zetmail.com','zikomo.info',
  'zippiex.com','zippymail.info','zoaxe.com','zoemail.com',
  'zoemail.net','zoemail.org','zomg.info','zumpul.com',
  'emailfake.com','emailfake.ml','fakemail.net','fakemail.fr',
  'mailcatch.com','getairmail.com','air-mail.site','nowaste.email',
  'boun.cr','emailna.com','spamcannibal.com','trbvm.com',
  'bsvarsity.com','schrott-email.de','meltmail.com','tempr.email',
  'spamwc.de','tempmail.ninja','tempr.email','tempinbox.xyz',
  'burnermail.io','harakirimail.com','mailseal.de','email-fake.com',
  'fake-email.pp.ua','tempomail.fr','spamfighter.cf',
  'lol.ovpn.to','gero.us','temp.email','temp.email',
  'mohmal.com','discard.email','objectmail.com','throwam.com',
  '0-mail.com','0815.ru','0815.su','0815.ry','0clickemail.com',
  '027168.com','0815.ru','0clickemail.com','0-mail.com',
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

// ─────────────────────────────────────────────────────────────────────────────
// ✅ PLAN_INFO — synchronisé avec PLAN_LIMITS dans UserDashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_INFO = {
  basic: {
    label: 'BASIC',
    color: '#6366f1',
    emoji: '⚡',
    price: '10 000 FCFA',
    period: 'Paiement annuel',
    highlight: null,
    features: [
      { text: '1 profil',                        locked: false },
      { text: '3 liens sociaux',                 locked: false },
      { text: 'QR Code Standard',                locked: false },
      { text: 'Page publique',                   locked: false },
      { text: 'Marketplace — 4 produits max',    locked: false },
      { text: '1 document PDF',                  locked: false },
      { text: 'Personnalisation couleurs basique',locked: false },
      { text: 'Analytics',                        locked: true, lockedLabel: 'PRO' },
      { text: 'Mode Événement',                  locked: true, lockedLabel: 'PRO' },
      { text: 'CRM / Automatisations',           locked: true, lockedLabel: 'BUSINESS' },
    ],
  },
  pro: {
    label: 'PRO',
    color: '#ff8c00',
    emoji: '🚀',
    price: '15 000 FCFA',
    period: 'Paiement annuel',
    highlight: 'Le plus populaire',
    features: [
      { text: '1 profil',                                  locked: false },
      { text: '8 liens sociaux',                           locked: false },
      { text: 'QR Code Premium',                           locked: false },
      { text: 'Page publique',                             locked: false },
      { text: 'Marketplace — 10 produits max',             locked: false },
      { text: '3 documents PDF',                           locked: false },
      { text: 'Personnalisation couleurs avancée',         locked: false },
      { text: 'Badge vérifié',                             locked: false },
      { text: 'Analytics & Temps réel',                   locked: false },
      { text: 'Mode Événement (galerie images/vidéos)',    locked: false },
      { text: '1 carte NFC / PVC offerte',                 locked: false },
      { text: 'Support Standard',                          locked: false },
      { text: 'CRM / Automatisations / Intégrations',      locked: true, lockedLabel: 'BUSINESS' },
    ],
  },
  business: {
    label: 'BUSINESS',
    color: '#f7c948',
    emoji: '💼',
    price: '25 000 FCFA',
    period: 'Paiement annuel',
    highlight: 'Tout inclus',
    features: [
      { text: '1 profil',                                              locked: false },
      { text: '17 liens sociaux',                                      locked: false },
      { text: 'QR Code dynamique avec logo',                          locked: false },
      { text: 'Page publique',                                         locked: false },
      { text: 'Marketplace — produits illimités',                     locked: false },
      { text: '10 documents PDF',                                      locked: false },
      { text: 'Personnalisation couleurs complète',                    locked: false },
      { text: 'Badge vérifié',                                         locked: false },
      { text: 'Analytics avancés complets + Temps réel',              locked: false },
      { text: 'Mode Événement + Statistiques événement',              locked: false },
      { text: 'CRM / Leads',                                          locked: false },
      { text: 'Automatisations',                                       locked: false },
      { text: 'Toutes les intégrations',                              locked: false },
      { text: 'Import/Export CSV & Google Sheets',                    locked: false },
      { text: 'WhatsApp API & Meta Pixel',                            locked: false },
      { text: '1 carte NFC / PVC offerte',                            locked: false },
      { text: 'Support VIP prioritaire',                              locked: false },
      { text: 'Publicités sponsorisées (optionnel)',                  locked: false },
      { text: 'Stockage fichiers élevé',                              locked: false },
      { text: 'Priorité nouvelles fonctionnalités',                   locked: false },
    ],
  },
  événement: {
    label: 'ÉVÉNEMENT',
    color: '#22c55e',
    emoji: '🎉',
    price: 'Sur devis',
    period: 'Par événement',
    highlight: null,
    features: [
      { text: '1 profil événement',                   locked: false },
      { text: '3 liens',                              locked: false },
      { text: 'QR Code Standard',                    locked: false },
      { text: 'Mode Événement activé',               locked: false },
      { text: 'Galerie images & vidéos',             locked: false },
      { text: 'Page publique événement',             locked: false },
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
  const [emailWarning, setEmailWarning] = useState('');
  const [successEmail, setSuccessEmail] = useState('');
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    import('../supabase').then(mod => setSupabase(mod.supabase));
  }, []);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val.includes('@') && isDisposableEmail(val)) {
      setEmailWarning('⚠️ Les adresses email temporaires ne sont pas acceptées.');
    } else {
      setEmailWarning('');
    }
  };

  const resetForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setError(''); setEmailWarning('');
    setShowPassword(false); setShowConfirm(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) { setError('Veuillez remplir tous les champs.'); return; }

    if (isDisposableEmail(email)) {
      setError('Les adresses email temporaires ou jetables ne sont pas autorisées. Veuillez utiliser une adresse email permanente (Gmail, Outlook, Yahoo, etc.).');
      return;
    }

    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (!supabase) return;

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
          data: { plan: selectedPlan },
        },
      });
      if (signUpError) throw signUpError;

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

  const emailIsTyped = email.includes('@');
  const emailIsDisposable = emailIsTyped && isDisposableEmail(email);

  return (
    <div style={{ minHeight: '100vh', background: '#060412', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden', fontFamily: "'Sora', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .auth-input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:14px 16px 14px 46px; color:white; font-size:14px; font-family:'Sora',sans-serif; outline:none; transition:border-color 0.2s,background 0.2s; }
        .auth-input::placeholder { color:rgba(255,255,255,0.25); }
        .auth-input:focus { border-color:rgba(255,140,0,0.6); background:rgba(255,140,0,0.06); }
        .auth-input.email-ok { border-color:rgba(34,197,94,0.5) !important; background:rgba(34,197,94,0.04) !important; }
        .auth-input.email-bad { border-color:rgba(239,68,68,0.7) !important; background:rgba(239,68,68,0.06) !important; }
        .auth-btn-primary { width:100%; padding:15px; border-radius:14px; border:none; cursor:pointer; font-family:'Sora',sans-serif; font-weight:700; font-size:15px; color:white; background:linear-gradient(135deg,#ff8c00,#ff5500); box-shadow:0 8px 32px rgba(255,140,0,0.35); transition:transform 0.15s,box-shadow 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .auth-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 12px 40px rgba(255,140,0,0.45); }
        .auth-btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
        .tab-btn { flex:1; padding:10px; border-radius:10px; border:none; cursor:pointer; font-family:'Sora',sans-serif; font-weight:600; font-size:13px; transition:all 0.2s; }
        .tab-btn.active { background:rgba(255,140,0,0.15); border:1px solid rgba(255,140,0,0.35); color:#ff8c00; }
        .tab-btn.inactive { background:transparent; border:1px solid transparent; color:rgba(255,255,255,0.35); }
        .plan-feature { display:flex; align-items:center; gap:7px; font-size:12px; padding:2px 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.4s ease both; }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        .scale-in { animation:scaleIn 0.35s ease both; }
        @keyframes checkPop { 0%{transform:scale(0) rotate(-10deg)} 70%{transform:scale(1.15) rotate(3deg)} 100%{transform:scale(1) rotate(0deg)} }
        .check-pop { animation:checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes shakeX { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        .shake { animation:shakeX 0.45s ease both; }
        .disposable-warning { display:flex; align-items:flex-start; gap:8px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:9px 12px; margin-top:6px; }
        .email-ok-badge { display:flex; align-items:center; gap:6px; font-size:11px; color:rgba(34,197,94,0.8); margin-top:5px; padding-left:4px; }
        .plan-card-scroll { max-height:220px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.1) transparent; }
        .plan-card-scroll::-webkit-scrollbar { width:4px; }
        .plan-card-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
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
          <div style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${planInfo.color}40`, borderRadius:'16px', padding:'12px 14px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>

            {/* Badge "highlight" (ex: "Le plus populaire") */}
            {planInfo.highlight && (
              <div style={{ position:'absolute', top:0, right:0, background:planInfo.color, borderRadius:'0 14px 0 10px', padding:'3px 10px' }}>
                <span style={{ color: selectedPlan === 'business' ? '#000' : 'white', fontSize:'9px', fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase' }}>{planInfo.highlight}</span>
              </div>
            )}

            {/* En-tête plan */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${planInfo.color}20`, border:`1px solid ${planInfo.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
                {planInfo.emoji}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:'6px', flexWrap:'wrap' }}>
                  <span style={{ color:planInfo.color, fontSize:'13px', fontWeight:800, letterSpacing:'0.05em' }}>Offre {planInfo.label}</span>
                  <span style={{ background:`${planInfo.color}22`, color:planInfo.color, fontSize:'11px', fontWeight:700, padding:'1px 8px', borderRadius:'20px' }}>{planInfo.price}</span>
                </div>
                <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'10px' }}>{planInfo.period}</span>
              </div>
            </div>

            {/* Séparateur */}
            <div style={{ borderTop:`1px solid ${planInfo.color}20`, marginBottom:'8px' }} />

            {/* Liste des fonctionnalités — scrollable si longue */}
            <div className="plan-card-scroll" style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              {planInfo.features.map((f, i) => (
                <div key={i} className="plan-feature">
                  {f.locked ? (
                    <>
                      <span style={{ fontSize:'11px', flexShrink:0, opacity:0.4 }}>🔒</span>
                      <span style={{ color:'rgba(255,255,255,0.28)', textDecoration:'line-through', flex:1 }}>{f.text}</span>
                      <span style={{
                        flexShrink:0,
                        background: f.lockedLabel === 'BUSINESS' ? 'rgba(247,201,72,0.12)' : 'rgba(255,140,0,0.12)',
                        border: `1px solid ${f.lockedLabel === 'BUSINESS' ? 'rgba(247,201,72,0.3)' : 'rgba(255,140,0,0.3)'}`,
                        borderRadius:'5px', padding:'1px 5px', fontSize:'8px',
                        color: f.lockedLabel === 'BUSINESS' ? '#f7c948' : '#ff8c00',
                        fontWeight:700, letterSpacing:'0.04em',
                      }}>
                        {f.lockedLabel === 'BUSINESS' ? '💼' : '🚀'} {f.lockedLabel}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ color:planInfo.color, fontSize:'11px', flexShrink:0 }}>✓</span>
                      <span style={{ color:'rgba(255,255,255,0.65)', flex:1 }}>{f.text}</span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Lien changer d'offre */}
            <div style={{ borderTop:`1px solid ${planInfo.color}15`, marginTop:'10px', paddingTop:'8px', display:'flex', justifyContent:'center' }}>
              <a href="/" style={{ color:'rgba(255,255,255,0.3)', fontSize:'10px', textDecoration:'none', display:'flex', alignItems:'center', gap:'4px' }}>
                Changer d'offre →
              </a>
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

            {/* ── FORMULAIRE INSCRIPTION ── */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="fade-up" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

                {/* Email */}
                <div>
                  <div style={{ position:'relative' }}>
                    <Mail
                      size={16}
                      color={emailIsDisposable ? '#ef4444' : emailIsTyped ? '#22c55e' : 'rgba(255,255,255,0.3)'}
                      style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', transition:'color 0.2s' }}
                    />
                    <input
                      type="email"
                      className={`auth-input${emailIsDisposable ? ' email-bad' : emailIsTyped ? ' email-ok' : ''}`}
                      placeholder="votre@email.com"
                      value={email}
                      onChange={handleEmailChange}
                      autoComplete="email"
                      required
                    />
                    {emailIsTyped && (
                      <div style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'13px' }}>
                        {emailIsDisposable ? '🚫' : '✅'}
                      </div>
                    )}
                  </div>
                  {emailIsDisposable && (
                    <div className="disposable-warning shake">
                      <ShieldX size={14} color="#ef4444" style={{ flexShrink:0, marginTop:'1px' }} />
                      <p style={{ color:'#f87171', fontSize:'11px', margin:0, lineHeight:1.5 }}>
                        Adresse email temporaire détectée. Utilisez une adresse permanente (Gmail, Outlook, Yahoo…).
                      </p>
                    </div>
                  )}
                  {emailIsTyped && !emailIsDisposable && (
                    <div className="email-ok-badge">
                      <CheckCircle size={11} color="#22c55e" />
                      Adresse email valide
                    </div>
                  )}
                </div>

                {/* Mot de passe */}
                <div style={{ position:'relative' }}>
                  <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type={showPassword ? 'text' : 'password'} className="auth-input" placeholder="Mot de passe (min. 6 caractères)" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required style={{ paddingRight:'46px' }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'4px', display:'flex', alignItems:'center' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Confirmer le mot de passe */}
                <div style={{ position:'relative' }}>
                  <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type={showConfirm ? 'text' : 'password'} className="auth-input" placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required style={{ paddingRight:'46px' }} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'4px', display:'flex', alignItems:'center' }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Barre force mot de passe */}
                {password.length > 0 && (
                  <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background: password.length >= i * 3 ? (password.length >= 10 ? '#22c55e' : password.length >= 6 ? '#f97316' : '#ef4444') : 'rgba(255,255,255,0.1)', transition:'background 0.3s' }} />
                    ))}
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', marginLeft:'4px', whiteSpace:'nowrap' }}>{password.length < 6 ? 'Faible' : password.length < 10 ? 'Moyen' : 'Fort'}</span>
                  </div>
                )}

                {/* Erreur */}
                {error && (
                  <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:'8px' }}>
                    <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
                    <p style={{ color:'#f87171', fontSize:'12px', margin:0, lineHeight:1.5 }}>{error}</p>
                  </div>
                )}

                <button type="submit" className="auth-btn-primary" disabled={loading || emailIsDisposable}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Créer mon compte <ArrowRight size={16} /></>}
                </button>

                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', textAlign:'center', lineHeight:1.6, margin:0 }}>
                  En créant un compte, vous acceptez nos <span style={{ color:'rgba(255,140,0,0.7)', cursor:'pointer' }}>conditions d'utilisation</span>.
                </p>
              </form>
            )}

            {/* ── FORMULAIRE CONNEXION ── */}
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