import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase';
import { toast } from 'sonner';
import {
  CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw,
  AlertCircle, Play, Zap, Eye, Trash2, Shield,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';

const META_APP_ID    = import.meta.env.VITE_META_APP_ID || '';
const SUPABASE_URL   = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── MetaLoginButton ──────────────────────────────────────────────────────────
function MetaLoginButton({ onSuccess, fbReady }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!window.FB || !fbReady) {
      toast.error('SDK Facebook en cours de chargement, réessayez dans 2 secondes');
      return;
    }
    setLoading(true);
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          fetchPagesAndInstagram(response.authResponse.accessToken);
        } else {
          toast.error('Connexion Facebook annulée');
          setLoading(false);
        }
      },
      { scope: 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,business_management' }
    );
  };

  const fetchPagesAndInstagram = async (userToken) => {
    try {
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`);
      const pagesData = await pagesRes.json();
      if (!pagesData.data?.length) {
        toast.error('Aucune Page Facebook trouvée. Créez une page d\'abord.');
        setLoading(false); return;
      }
      const page       = pagesData.data[0];
      const pageToken  = page.access_token;
      const pageId     = page.id;
      const pageName   = page.name;

      const igRes  = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
      const igData = await igRes.json();
      const instagramAccountId = igData.instagram_business_account?.id || null;

      let instagramUsername = null;
      if (instagramAccountId) {
        const igUserRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}?fields=username&access_token=${pageToken}`);
        const igUser    = await igUserRes.json();
        instagramUsername = igUser.username || null;
      }
      onSuccess({ facebook_page_id: pageId, facebook_page_name: pageName, facebook_access_token: pageToken, instagram_account_id: instagramAccountId, instagram_username: instagramUsername });
    } catch (err) {
      toast.error('Erreur connexion : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleLogin} disabled={loading || !fbReady} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      width: '100%', padding: '14px',
      background: !fbReady ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#1877f2,#0d5bba)',
      border: 'none', borderRadius: '14px', color: 'white',
      fontSize: '14px', fontWeight: 700,
      cursor: loading || !fbReady ? 'not-allowed' : 'pointer',
      boxShadow: fbReady ? '0 4px 20px rgba(24,119,242,0.35)' : 'none',
      opacity: loading ? 0.7 : 1, transition: 'all 0.3s',
    }}>
      {loading
        ? <Loader2 size={16} className="animate-spin" />
        : !fbReady
          ? <Loader2 size={16} className="animate-spin" />
          : <FaFacebook size={16} />}
      {!fbReady ? 'Chargement SDK Facebook…' : loading ? 'Connexion en cours…' : 'Connecter Facebook & Instagram'}
    </button>
  );
}

// ─── PublicationLog ───────────────────────────────────────────────────────────
function PublicationLog({ boostId }) {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boostId) return;
    (async () => {
      const { data } = await supabase
        .from('publication_logs')
        .select('*')
        .eq('boost_id', boostId)
        .order('created_at', { ascending: false });
      setLogs(data || []);
      setLoading(false);
    })();
  }, [boostId]);

  if (loading) return <div style={{ textAlign:'center', padding:'20px' }}><Loader2 size={16} className="animate-spin" color="rgba(255,255,255,0.3)" /></div>;
  if (!logs.length) return <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', textAlign:'center', padding:'16px' }}>Aucun log de publication</p>;

  const networkIcon  = { facebook: FaFacebook, instagram: FaInstagram, whatsapp: FaWhatsapp };
  const networkColor = { facebook: '#1877f2',  instagram: '#e1306c',   whatsapp: '#25d366'  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      {logs.map(log => {
        const Icon  = networkIcon[log.network]  || Zap;
        const color = networkColor[log.network] || '#6366f1';
        const isOk  = log.status === 'published';
        return (
          <div key={log.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
            <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={13} color={color} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:'white', fontSize:'12px', fontWeight:600, margin:0, textTransform:'capitalize' }}>{log.network}</p>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'10px', margin:0 }}>{new Date(log.published_at || log.created_at).toLocaleString('fr-FR')}</p>
            </div>
            {isOk
              ? <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'#22c55e' }}><CheckCircle size={12}/><span style={{ fontSize:'10px', fontWeight:600 }}>Publié</span></div>
              : <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'#ef4444' }}><XCircle size={12}/><span style={{ fontSize:'10px', fontWeight:600 }}>Échec</span></div>
            }
          </div>
        );
      })}
    </div>
  );
}

// ─── MetaIntegrationPanel principal ──────────────────────────────────────────
export default function MetaIntegrationPanel({ profile, isAdmin = false }) {
  const [integration,   setIntegration]   = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [publishing,    setPublishing]    = useState(false);
  const [testMode,      setTestMode]      = useState(false);
  const [activeBoosts,  setActiveBoosts]  = useState([]);
  const [selectedBoost, setSelectedBoost] = useState(null);
  const [showLogs,      setShowLogs]      = useState(false);
  const [fbReady,       setFbReady]       = useState(false);

  // ── FIX 1 : SDK Facebook ────────────────────────────────────────────────────
  // Problème original : if(!window.FB) return; empêchait l'init
  //                   + fbReady jamais mis à true si script déjà chargé
  useEffect(() => {
  const initFB = () => {
    if (!window.FB) return;
    window.FB.init({
      appId:   META_APP_ID,
      cookie:  true,
      xfbml:   false,
      version: 'v19.0',
    });
    setFbReady(true);
  };

  // SDK déjà chargé → init immédiat
  if (window.FB) {
    initFB();
    return;
  }

  // SDK pas encore chargé → callback + script
  window.fbAsyncInit = initFB;

  if (!document.getElementById('fb-sdk')) {
    const script    = document.createElement('script');
    script.id       = 'fb-sdk';
    script.src      = 'https://connect.facebook.net/fr_FR/sdk.js';
    script.async    = true;
    script.defer    = true;
    script.onerror  = () => toast.error('Impossible de charger le SDK Facebook');
    document.body.appendChild(script);
  }
}, []);

  // ── Charge données ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // FIX 2 : la table meta_integrations doit avoir les bonnes colonnes
      // (facebook_page_id, facebook_page_name, facebook_access_token,
      //  instagram_account_id, instagram_username, profile_id)
      const { data, error } = await supabase
        .from('meta_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      // FIX 3 : 406 = table inexistante ou colonnes incorrectes
      // → voir SQL de migration ci-dessous
      if (error && error.code !== 'PGRST116') {
        console.error('meta_integrations error:', error.message);
      }
      setIntegration(data || null);

      const { data: boosts } = await supabase
        .from('profile_boosts')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setActiveBoosts(boosts || []);
      if (boosts?.length) setSelectedBoost(boosts[0].id);

      setLoading(false);
    })();
  }, [profile?.id]);

  const handleMetaConnected = async (metaData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('meta_integrations').update({ is_active: false }).eq('user_id', user.id);
      const { data, error } = await supabase.from('meta_integrations').insert([{
        user_id:    user.id,
        profile_id: profile.id,
        ...metaData,
        is_active: true,
      }]).select().single();
      if (error) throw error;
      setIntegration(data);
      toast.success('✅ Facebook & Instagram connectés !');
    } catch (err) {
      toast.error('Erreur sauvegarde : ' + err.message);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Déconnecter Facebook & Instagram ?')) return;
    await supabase.from('meta_integrations').update({ is_active: false }).eq('id', integration.id);
    setIntegration(null);
    toast.success('Déconnecté');
  };

  const handlePublish = async () => {
    if (!selectedBoost)            { toast.error('Sélectionnez un boost actif'); return; }
    if (!integration && !testMode) { toast.error('Connectez Facebook d\'abord'); return; }
    setPublishing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/publish-boost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ boost_id: selectedBoost, test_mode: testMode }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      const published = Object.keys(result.results || {}).filter(n => result.results[n]?.success !== false);
      const failed    = Object.keys(result.results || {}).filter(n => result.results[n]?.success === false);
      if (published.length) toast.success(`✅ Publié sur : ${published.join(', ')}`);
      if (failed.length)    toast.error(`❌ Échec sur : ${failed.join(', ')}`);
      setShowLogs(true);
    } catch (err) {
      toast.error('Erreur publication : ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'40px' }}>
      <Loader2 size={24} className="animate-spin" color="rgba(99,102,241,0.6)" />
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px', maxWidth:'680px' }}>

      <div>
        <h2 style={{ color:'white', fontSize:'18px', fontWeight:800, margin:0 }}>📡 Intégrations Meta</h2>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'12px', margin:'4px 0 0' }}>
          Connectez Facebook & Instagram pour la publication automatique des boosts
        </p>
      </div>

      {/* Statut connexion */}
      <div style={{ background: integration ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border:'1px solid '+(integration ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)'), borderRadius:'20px', padding:'20px' }}>
        {integration ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e' }} />
              <span style={{ color:'#22c55e', fontSize:'13px', fontWeight:700 }}>Connecté</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', background:'rgba(24,119,242,0.08)', border:'1px solid rgba(24,119,242,0.2)', borderRadius:'14px' }}>
              <FaFacebook size={20} color="#1877f2" />
              <div style={{ flex:1 }}>
                <p style={{ color:'white', fontSize:'13px', fontWeight:700, margin:0 }}>{integration.facebook_page_name || 'Page Facebook'}</p>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px', margin:0 }}>ID : {integration.facebook_page_id}</p>
              </div>
              <CheckCircle size={14} color="#22c55e" />
            </div>
            {integration.instagram_account_id ? (
              <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', background:'rgba(225,48,108,0.08)', border:'1px solid rgba(225,48,108,0.2)', borderRadius:'14px' }}>
                <FaInstagram size={20} color="#e1306c" />
                <div style={{ flex:1 }}>
                  <p style={{ color:'white', fontSize:'13px', fontWeight:700, margin:0 }}>@{integration.instagram_username || 'compte Instagram'}</p>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px', margin:0 }}>Compte business lié</p>
                </div>
                <CheckCircle size={14} color="#22c55e" />
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'12px' }}>
                <AlertCircle size={13} color="#f59e0b" />
                <p style={{ color:'#f59e0b', fontSize:'11px', margin:0 }}>Aucun compte Instagram Business lié à cette Page</p>
              </div>
            )}
            <button onClick={handleDisconnect} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', color:'#f87171', fontSize:'12px', fontWeight:600, cursor:'pointer', width:'fit-content' }}>
              <Trash2 size={11} /> Déconnecter
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <Shield size={14} color="rgba(255,255,255,0.4)" />
              <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px' }}>Connectez votre Page Facebook pour activer la publication automatique</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
              {[[FaFacebook,'#1877f2','Facebook','Posts sur votre page'],[FaInstagram,'#e1306c','Instagram','Posts sponsorisés'],[FaWhatsapp,'#25d366','WhatsApp','Notifications']].map(([Icon,color,label,sub]) => (
                <div key={label} style={{ background:color+'0f', border:'1px solid '+color+'22', borderRadius:'12px', padding:'12px', textAlign:'center' }}>
                  <Icon size={20} color={color} style={{ margin:'0 auto 6px' }} />
                  <p style={{ color:'white', fontSize:'11px', fontWeight:700, margin:'0 0 2px' }}>{label}</p>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', margin:0 }}>{sub}</p>
                </div>
              ))}
            </div>
            <MetaLoginButton onSuccess={handleMetaConnected} fbReady={fbReady} />
          </div>
        )}
      </div>

      {/* Publication */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'20px', display:'flex', flexDirection:'column', gap:'14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <Zap size={14} color="#f59e0b" />
          <h3 style={{ color:'white', fontSize:'14px', fontWeight:800, margin:0 }}>Lancer une publication</h3>
        </div>
        {activeBoosts.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px', fontWeight:600, margin:0 }}>BOOST ACTIF</p>
            {activeBoosts.map(boost => (
              <div key={boost.id} onClick={() => setSelectedBoost(boost.id)}
                style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:selectedBoost===boost.id?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.04)', border:'1px solid '+(selectedBoost===boost.id?'rgba(99,102,241,0.35)':'rgba(255,255,255,0.07)'), borderRadius:'12px', cursor:'pointer' }}>
                <span style={{ fontSize:'18px' }}>🚀</span>
                <div style={{ flex:1 }}>
                  <p style={{ color:'white', fontSize:'12px', fontWeight:700, margin:0 }}>Boost {boost.boost_type}</p>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', margin:0 }}>{(boost.networks||[]).join(', ')} · {boost.duration_days}j</p>
                </div>
                {selectedBoost===boost.id && <CheckCircle size={13} color="#6366f1" />}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'12px', padding:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
            <AlertCircle size={13} color="#f59e0b" />
            <p style={{ color:'#f59e0b', fontSize:'12px', margin:0 }}>Aucun boost actif. Activez un boost d'abord.</p>
          </div>
        )}
        {isAdmin && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'12px' }}>
            <div>
              <p style={{ color:'white', fontSize:'12px', fontWeight:600, margin:0 }}>Mode test</p>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', margin:0 }}>Simule la publication sans publier réellement</p>
            </div>
            <button onClick={() => setTestMode(v => !v)} style={{ width:'40px', height:'22px', borderRadius:'100px', background:testMode?'#6366f1':'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', position:'relative', flexShrink:0 }}>
              <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:'white', position:'absolute', top:'3px', left:testMode?'21px':'3px', transition:'left 0.2s' }} />
            </button>
          </div>
        )}
        <button onClick={handlePublish} disabled={publishing || activeBoosts.length === 0}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'13px', background:activeBoosts.length===0?'rgba(255,255,255,0.06)':testMode?'linear-gradient(135deg,#6366f1,#8b5cf6)':'linear-gradient(135deg,#f59e0b,#ef4444)', border:'none', borderRadius:'12px', color:activeBoosts.length===0?'rgba(255,255,255,0.3)':'white', fontSize:'13px', fontWeight:700, cursor:activeBoosts.length===0?'not-allowed':'pointer', opacity:publishing?0.7:1 }}>
          {publishing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {publishing ? 'Publication en cours…' : testMode ? '🧪 Tester la publication' : '🚀 Publier maintenant'}
        </button>
      </div>

      {/* Logs */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', overflow:'hidden' }}>
        <div onClick={() => setShowLogs(v => !v)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', cursor:'pointer' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <Eye size={14} color="rgba(255,255,255,0.4)" />
            <span style={{ color:'white', fontSize:'13px', fontWeight:700 }}>Historique des publications</span>
          </div>
          <RefreshCw size={13} color="rgba(255,255,255,0.3)" style={{ transform:showLogs?'rotate(180deg)':'none', transition:'transform 0.2s' }} />
        </div>
        <AnimatePresence>
          {showLogs && (
            <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }} style={{ overflow:'hidden' }}>
              <div style={{ padding:'0 16px 16px' }}><PublicationLog boostId={selectedBoost} /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Guide config */}
      <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:'16px', padding:'16px' }}>
        <p style={{ color:'#a78bfa', fontSize:'12px', fontWeight:700, margin:'0 0 8px' }}>📋 Configuration requise</p>
        {[
          ['VITE_META_APP_ID',  'Votre App ID Meta dans .env et Vercel',          !!META_APP_ID && META_APP_ID !== 'YOUR_META_APP_ID'],
          ['Page Facebook',     'Avec un compte Instagram Business lié',           !!integration?.facebook_page_id],
          ['Token valide',      'Reconnectez si expiré (valide 90 jours)',          !!integration?.facebook_access_token],
        ].map(([key, desc, ok]) => (
          <div key={key} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
            {ok ? <CheckCircle size={11} color="#22c55e" /> : <XCircle size={11} color="rgba(255,255,255,0.2)" />}
            <span style={{ color:ok?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.35)', fontSize:'11px' }}>
              <strong>{key}</strong> — {desc}
            </span>
          </div>
        ))}
        <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer"
          style={{ display:'inline-flex', alignItems:'center', gap:'5px', marginTop:'6px', color:'#a78bfa', fontSize:'11px', fontWeight:600, textDecoration:'none' }}>
          <ExternalLink size={10} /> Créer une App Meta
        </a>
      </div>
    </div>
  );
}