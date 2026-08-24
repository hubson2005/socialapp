import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase';
import { toast } from 'sonner';
import {
  Zap, Clock, CheckCircle, XCircle, Loader2,
  TrendingUp, Calendar, ChevronDown,
  Sparkles, AlertCircle, Play, BarChart3, Globe,
} from 'lucide-react';
// [EXTRACTION — cette révision] BoostContentGenerator (et NETWORK_CONFIG,
// dont il a l'usage le plus complet) vivent désormais dans leur propre
// fichier. Il existait un fichier BoostContentGenerator.jsx séparé avec
// un contenu dupliqué de l'ancienne version inline de ce composant —
// source de confusion sur quelle version faisait foi. Import direct
// plutôt que redéfinition, pour n'avoir plus qu'une seule source de vérité.
import BoostContentGenerator, { NETWORK_CONFIG } from './BoostContentGenerator';

// [THÈME CLAIR] Palette retournée pour le fond clair du dashboard :
// cartes blanches (#ffffff), bordures #e6e8f0, texte #151329 (fort) /
// #6b6f85 (secondaire) / #9a9db0 (muet). Les couleurs d'accent (indigo,
// orange/rouge du boost, vert succès, couleurs de réseaux sociaux) sont
// conservées à l'identique.

// ─── Constants ────────────────────────────────────────────────────────────────
const BOOST_TYPES = [
  { id:'starter',  label:'Starter',  price:2500,  duration:3,  description:'Idéal pour tester',   networks:['facebook'],                       color:'#6366f1', emoji:'🚀' },
  { id:'standard', label:'Standard', price:5000,  duration:7,  description:'Le plus populaire',    networks:['facebook','instagram'],            color:'#f59e0b', emoji:'⭐', popular:true },
  { id:'premium',  label:'Premium',  price:10000, duration:14, description:'Visibilité maximale',  networks:['facebook','instagram','whatsapp'], color:'#10b981', emoji:'👑' },
];

const STATUS_CONFIG = {
  pending:   { label:'En attente', color:'#b45309', icon:Clock       },
  active:    { label:'Actif',      color:'#16a34a', icon:Play        },
  completed: { label:'Terminé',    color:'#4f46e5', icon:CheckCircle },
  cancelled: { label:'Annulé',     color:'#6b7280', icon:XCircle     },
  failed:    { label:'Échoué',     color:'#dc2626', icon:AlertCircle },
};

// ─── NetworkBadge ─────────────────────────────────────────────────────────────
function NetworkBadge({ network }) {
  const cfg=NETWORK_CONFIG[network]; if (!cfg) return null;
  const Icon=cfg.icon;
  return (
    <div style={{ display:'flex',alignItems:'center',gap:'4px',background:cfg.color+'14',border:'1px solid '+cfg.color+'44',borderRadius:'6px',padding:'3px 8px' }}>
      <Icon size={10} color={cfg.color}/>
      <span style={{ color:cfg.color,fontSize:'10px',fontWeight:600 }}>{cfg.label}</span>
    </div>
  );
}

// ─── BoostCard ────────────────────────────────────────────────────────────────
function BoostCard({ boost, profile, onActivate, isAdmin }) {
  const [expanded, setExpanded]           = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const status=STATUS_CONFIG[boost.status]||STATUS_CONFIG.pending;
  const StatusIcon=status.icon;
  const daysLeft=boost.end_date?Math.max(0,Math.ceil((new Date(boost.end_date)-new Date())/86400000)):null;

  return (
    <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}
      style={{ background:'#ffffff',border:'1px solid #e6e8f0',boxShadow:'0 1px 2px rgba(16,18,40,0.04)',borderRadius:'16px',overflow:'hidden' }}>
      <div onClick={()=>setExpanded(v=>!v)} style={{ display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',cursor:'pointer' }}>
        <div style={{ width:'40px',height:'40px',borderRadius:'11px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0 }}>
          {BOOST_TYPES.find(b=>b.id===boost.boost_type)?.emoji||'🚀'}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap' }}>
            <span style={{ color:'#151329',fontSize:'13px',fontWeight:700 }}>Boost {boost.boost_type}</span>
            <div style={{ display:'flex',alignItems:'center',gap:'5px',background:status.color+'14',border:'1px solid '+status.color+'44',borderRadius:'6px',padding:'2px 8px' }}>
              <StatusIcon size={10} color={status.color}/>
              <span style={{ color:status.color,fontSize:'10px',fontWeight:600 }}>{status.label}</span>
            </div>
          </div>
          <div style={{ display:'flex',gap:'12px',marginTop:'3px',flexWrap:'wrap' }}>
            <span style={{ color:'#6b6f85',fontSize:'11px' }}>{boost.duration_days}j · {(boost.amount||0).toLocaleString()} FCFA</span>
            {boost.status==='active'&&daysLeft!==null&&<span style={{ color:'#16a34a',fontSize:'11px',fontWeight:600 }}>{daysLeft}j restants</span>}
          </div>
        </div>
        <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>
          {(boost.networks||[]).map(n=><NetworkBadge key={n} network={n}/>)}
        </div>
        <ChevronDown size={14} color="#9a9db0" style={{ transform:expanded?'rotate(180deg)':'none',transition:'transform 0.2s',flexShrink:0 }}/>
      </div>

      <AnimatePresence>
        {expanded&&(
          <motion.div initial={{ height:0,opacity:0 }} animate={{ height:'auto',opacity:1 }} exit={{ height:0,opacity:0 }} transition={{ duration:0.2 }} style={{ overflow:'hidden' }}>
            <div style={{ borderTop:'1px solid #e6e8f0',padding:'14px 16px',display:'flex',flexDirection:'column',gap:'10px' }}>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px' }}>
                {[
                  ['Début', boost.start_date?new Date(boost.start_date).toLocaleDateString('fr-FR'):'—', Calendar],
                  ['Fin',   boost.end_date?new Date(boost.end_date).toLocaleDateString('fr-FR'):'—',   Calendar],
                  ['Paiement', boost.payment_method||'—', Globe],
                ].map(([label,value,Icon])=>(
                  <div key={label} style={{ background:'#f8f9fc',border:'1px solid #e6e8f0',borderRadius:'10px',padding:'10px',display:'flex',flexDirection:'column',gap:'4px' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:'5px' }}><Icon size={10} color="#9a9db0"/><span style={{ color:'#9a9db0',fontSize:'10px' }}>{label}</span></div>
                    <span style={{ color:'#151329',fontSize:'12px',fontWeight:600 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex',gap:'8px',flexWrap:'wrap' }}>
                {isAdmin&&boost.status==='pending'&&(
                  <button onClick={()=>onActivate(boost.id)} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'9px',background:'linear-gradient(135deg,#22c55e,#16a34a)',border:'none',borderRadius:'10px',color:'white',fontSize:'12px',fontWeight:700,cursor:'pointer' }}>
                    <Play size={12}/> Activer ce boost
                  </button>
                )}
                {boost.status==='active'&&(
                  <button onClick={()=>setShowGenerator(v=>!v)} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'9px',background:showGenerator?'rgba(245,158,11,0.12)':'linear-gradient(135deg,#f59e0b,#ef4444)',border:showGenerator?'1px solid rgba(245,158,11,0.4)':'none',borderRadius:'10px',color:showGenerator?'#b45309':'white',fontSize:'12px',fontWeight:700,cursor:'pointer' }}>
                    <Sparkles size={12}/> {showGenerator?'Masquer le générateur':'Générer le contenu IA'}
                  </button>
                )}
              </div>
              <AnimatePresence>
                {showGenerator&&boost.status==='active'&&(
                  <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} exit={{ opacity:0,height:0 }} style={{ overflow:'hidden' }}>
                    <div style={{ background:'#f8f9fc',border:'1px solid #e6e8f0',borderRadius:'14px',padding:'14px' }}>
                      <BoostContentGenerator profile={profile} boost={boost} onContentReady={(content)=>{ console.log('Contenu prêt :',content); toast.success('🎉 Contenu prêt pour publication !'); setShowGenerator(false); }}/>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── NewBoostModal ────────────────────────────────────────────────────────────
function NewBoostModal({ profile, onClose, onCreated }) {
  const [selected, setSelected] = useState('standard');
  const [loading, setLoading]   = useState(false);
  const plan=BOOST_TYPES.find(b=>b.id===selected);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('profile_boosts').insert([{
        profile_id:profile.id, user_id:user.id, boost_type:selected,
        amount:plan.price, duration_days:plan.duration, status:'pending',
        networks:plan.networks, payment_method:'cinetpay',
      }]).select().maybeSingle();
      if (error) throw error;
      await supabase.from('publication_queue').insert(plan.networks.map(network=>({ boost_id:data.id, network, status:'queued', scheduled_at:new Date().toISOString() })));
      toast.success('Boost créé ! En attente de validation admin.');
      onCreated(data); onClose();
    } catch(err) { toast.error('Erreur : '+err.message); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(15,17,25,0.6)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px' }}>
      <motion.div initial={{ opacity:0,scale:0.95,y:16 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:0.95 }}
        onClick={e=>e.stopPropagation()}
        style={{ background:'#ffffff',border:'1px solid #e6e8f0',borderRadius:'24px',width:'100%',maxWidth:'520px',maxHeight:'90vh',overflow:'auto',boxShadow:'0 32px 80px rgba(15,23,42,0.25)' }}>
        <div style={{ padding:'22px 24px 16px',borderBottom:'1px solid #e6e8f0' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
            <div style={{ width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#f59e0b,#ef4444)',display:'flex',alignItems:'center',justifyContent:'center' }}><Zap size={16} color="white"/></div>
            <div>
              <h2 style={{ color:'#151329',fontSize:'17px',fontWeight:800,margin:0 }}>Booster mon profil</h2>
              <p style={{ color:'#6b6f85',fontSize:'12px',margin:0 }}>Choisissez une offre pour {profile?.display_name}</p>
            </div>
          </div>
        </div>
        <div style={{ padding:'16px 24px 24px',display:'flex',flexDirection:'column',gap:'12px' }}>
          {BOOST_TYPES.map(type=>(
            <div key={type.id} onClick={()=>setSelected(type.id)} style={{ position:'relative',padding:'16px',background:selected===type.id?type.color+'12':'#f8f9fc',border:'2px solid '+(selected===type.id?type.color:'#e6e8f0'),borderRadius:'16px',cursor:'pointer' }}>
              {type.popular&&<div style={{ position:'absolute',top:'-10px',right:'16px',background:'linear-gradient(135deg,#f59e0b,#ef4444)',borderRadius:'6px',padding:'2px 10px',fontSize:'10px',color:'white',fontWeight:700 }}>⭐ Populaire</div>}
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
                  <span style={{ fontSize:'22px' }}>{type.emoji}</span>
                  <div><p style={{ color:'#151329',fontSize:'14px',fontWeight:800,margin:0 }}>{type.label}</p><p style={{ color:'#6b6f85',fontSize:'11px',margin:0 }}>{type.description}</p></div>
                </div>
                <div style={{ textAlign:'right' }}><p style={{ color:type.color,fontSize:'18px',fontWeight:900,margin:0 }}>{type.price.toLocaleString()}</p><p style={{ color:'#9a9db0',fontSize:'10px',margin:0 }}>FCFA · {type.duration}j</p></div>
              </div>
              <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>{type.networks.map(n=><NetworkBadge key={n} network={n}/>)}</div>
            </div>
          ))}
          {plan&&(
            <div style={{ background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.18)',borderRadius:'14px',padding:'14px' }}>
              <p style={{ color:'#6b6f85',fontSize:'11px',margin:'0 0 6px',fontWeight:600 }}>RÉSUMÉ</p>
              {[['Offre '+plan.label,plan.price.toLocaleString()+' FCFA'],['Durée',plan.duration+' jours'],['Réseaux',plan.networks.length+' réseau(x)']].map(([k,v])=>(
                <div key={k} style={{ display:'flex',justifyContent:'space-between',marginBottom:'4px' }}>
                  <span style={{ color:'#6b6f85',fontSize:'12px' }}>{k}</span>
                  <span style={{ color:'#151329',fontSize:'12px',fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex',gap:'8px' }}>
            <button onClick={onClose} style={{ flex:1,padding:'12px',background:'#eef0f6',border:'1px solid #e6e8f0',borderRadius:'12px',color:'#6b6f85',fontSize:'13px',fontWeight:600,cursor:'pointer' }}>Annuler</button>
            <button onClick={handleSubmit} disabled={loading} style={{ flex:2,padding:'12px',background:'linear-gradient(135deg,#f59e0b,#ef4444)',border:'none',borderRadius:'12px',color:'white',fontSize:'13px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',opacity:loading?0.7:1 }}>
              {loading?<Loader2 size={14} className="animate-spin"/>:<Zap size={14}/>} Commander · {plan?.price.toLocaleString()} FCFA
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── AdminBoostManager ────────────────────────────────────────────────────────
function AdminBoostManager() {
  const [boosts, setBoosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('pending');

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const { data } = await supabase.from('profile_boosts').select('*, link_profiles(display_name,username,avatar_url)').order('created_at',{ ascending:false });
      setBoosts(data||[]); setLoading(false);
    })();
  },[]);

  const handleActivate = async (boostId) => {
    const start=new Date(); const boost=boosts.find(b=>b.id===boostId);
    const end=new Date(start); end.setDate(end.getDate()+(boost?.duration_days||7));
    const { error } = await supabase.from('profile_boosts').update({ status:'active',start_date:start.toISOString(),end_date:end.toISOString() }).eq('id',boostId);
    if (error) { toast.error('Erreur activation'); return; }
    await supabase.from('publication_queue').update({ status:'processing' }).eq('boost_id',boostId);
    setBoosts(prev=>prev.map(b=>b.id===boostId?{...b,status:'active',start_date:start.toISOString(),end_date:end.toISOString()}:b));
    toast.success('✅ Boost activé ! Publication en cours…');
  };

  const filtered=boosts.filter(b=>filter==='all'||b.status===filter);
  const counts={ pending:boosts.filter(b=>b.status==='pending').length, active:boosts.filter(b=>b.status==='active').length };

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'16px' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div>
          <h3 style={{ color:'#151329',fontSize:'15px',fontWeight:800,margin:0 }}>Gestion des boosts</h3>
          <p style={{ color:'#6b6f85',fontSize:'11px',margin:'3px 0 0' }}>{counts.pending} en attente · {counts.active} actifs</p>
        </div>
      </div>
      <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>
        {[['pending','⏳ Attente'],['active','✅ Actifs'],['completed','Terminés'],['all','Tous']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ padding:'6px 12px',borderRadius:'8px',border:'1px solid '+(filter===v?'rgba(99,102,241,0.5)':'#e6e8f0'),background:filter===v?'rgba(99,102,241,0.1)':'transparent',color:filter===v?'#4f46e5':'#6b6f85',fontSize:'11px',cursor:'pointer',fontWeight:filter===v?600:400 }}>{l}</button>
        ))}
      </div>
      {loading
        ?<div style={{ textAlign:'center',padding:'32px' }}><Loader2 size={20} className="animate-spin" color="rgba(99,102,241,0.6)"/></div>
        :filtered.length===0
          ?<div style={{ textAlign:'center',padding:'32px',background:'#f8f9fc',border:'1px dashed #e6e8f0',borderRadius:'16px' }}>
              <Zap size={24} color="#c7cdfb" style={{ margin:'0 auto 10px' }}/><p style={{ color:'#9a9db0',fontSize:'13px',margin:0 }}>Aucun boost {filter!=='all'?filter:''}</p>
            </div>
          :filtered.map(boost=>(
            <div key={boost.id} style={{ display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',background:'#ffffff',border:'1px solid #e6e8f0',boxShadow:'0 1px 2px rgba(16,18,40,0.04)',borderRadius:'14px' }}>
              <div style={{ width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0,overflow:'hidden' }}>
                {boost.link_profiles?.avatar_url?<img src={boost.link_profiles.avatar_url} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:(boost.link_profiles?.display_name?.[0]?.toUpperCase()||'?')}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <p style={{ color:'#151329',fontSize:'12px',fontWeight:700,margin:0 }}>{boost.link_profiles?.display_name||'Profil'}</p>
                <p style={{ color:'#9a9db0',fontSize:'10px',margin:'2px 0 0' }}>{BOOST_TYPES.find(b=>b.id===boost.boost_type)?.emoji} {boost.boost_type} · {(boost.amount||0).toLocaleString()} FCFA</p>
              </div>
              <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>{(boost.networks||[]).map(n=><NetworkBadge key={n} network={n}/>)}</div>
              {boost.status==='pending'&&<button onClick={()=>handleActivate(boost.id)} style={{ display:'flex',alignItems:'center',gap:'5px',padding:'6px 12px',background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.35)',borderRadius:'8px',color:'#16a34a',fontSize:'11px',fontWeight:700,cursor:'pointer',flexShrink:0 }}><Play size={10}/> Activer</button>}
              {boost.status==='active'&&<div style={{ display:'flex',alignItems:'center',gap:'5px',padding:'6px 10px',background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:'8px' }}><div style={{ width:'6px',height:'6px',borderRadius:'50%',background:'#22c55e',animation:'pulse-dot 2s infinite' }}/><span style={{ color:'#16a34a',fontSize:'10px',fontWeight:600 }}>Live</span></div>}
            </div>
          ))
      }
    </div>
  );
}

// ─── BoostPanel principal ─────────────────────────────────────────────────────
export default function BoostPanel({ profile, isAdmin = false }) {
  const [boosts, setBoosts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab]             = useState(isAdmin?'admin':'my');

  useEffect(()=>{
    if (!profile?.id) return;
    (async()=>{
      setLoading(true);
      const { data } = await supabase.from('profile_boosts').select('*').eq('profile_id',profile.id).order('created_at',{ ascending:false });
      setBoosts(data||[]); setLoading(false);
    })();
  },[profile?.id]);

  const handleActivate = async (boostId) => {
    const start=new Date(); const boost=boosts.find(b=>b.id===boostId);
    const end=new Date(start); end.setDate(end.getDate()+(boost?.duration_days||7));
    await supabase.from('profile_boosts').update({ status:'active',start_date:start.toISOString(),end_date:end.toISOString() }).eq('id',boostId);
    setBoosts(prev=>prev.map(b=>b.id===boostId?{...b,status:'active',start_date:start.toISOString(),end_date:end.toISOString()}:b));
    toast.success('✅ Boost activé !');
  };

  const stats = {
    total:  boosts.length,
    active: boosts.filter(b=>b.status==='active').length,
    spent:  boosts.filter(b=>['active','completed'].includes(b.status)).reduce((s,b)=>s+(b.amount||0),0),
  };

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'20px' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px' }}>
        <div>
          <h2 style={{ color:'#151329',fontSize:'18px',fontWeight:800,margin:0 }}>🚀 Boosts & Promotion</h2>
          <p style={{ color:'#6b6f85',fontSize:'12px',margin:'4px 0 0' }}>Publiez automatiquement sur Facebook, Instagram et WhatsApp</p>
        </div>
        <button onClick={()=>setShowModal(true)} style={{ display:'flex',alignItems:'center',gap:'6px',padding:'10px 18px',background:'linear-gradient(135deg,#f59e0b,#ef4444)',border:'none',borderRadius:'12px',color:'white',fontSize:'13px',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(245,158,11,0.3)' }}>
          <Zap size={14}/> Nouveau boost
        </button>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px' }}>
        {[['TOTAL BOOSTS',stats.total,TrendingUp,'#6366f1'],['ACTIFS',stats.active,Play,'#16a34a'],['FCFA INVESTIS',stats.spent.toLocaleString(),BarChart3,'#b45309']].map(([label,value,Icon,color])=>(
          <div key={label} style={{ background:'#ffffff',border:'1px solid #e6e8f0',boxShadow:'0 1px 2px rgba(16,18,40,0.04)',borderRadius:'14px',padding:'14px',display:'flex',flexDirection:'column',gap:'8px' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <span style={{ color:'#6b6f85',fontSize:'10px',fontWeight:600 }}>{label}</span>
              <div style={{ width:'26px',height:'26px',borderRadius:'7px',background:color+'18',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon size={12} color={color}/></div>
            </div>
            <span style={{ color:'#151329',fontSize:'22px',fontWeight:900,lineHeight:1 }}>{value}</span>
          </div>
        ))}
      </div>

      {isAdmin&&(
        <div style={{ display:'flex',gap:'4px',background:'#eef0f6',borderRadius:'12px',padding:'4px',width:'fit-content' }}>
          {[['my','Mon profil'],['admin','Admin — tous les boosts']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{ padding:'7px 16px',borderRadius:'9px',border:'none',background:tab===id?'#ffffff':'transparent',boxShadow:tab===id?'0 1px 3px rgba(16,18,40,0.1)':'none',color:tab===id?'#151329':'#6b6f85',fontSize:'12px',fontWeight:600,cursor:'pointer' }}>{label}</button>
          ))}
        </div>
      )}

      {tab==='admin'&&isAdmin
        ?<AdminBoostManager/>
        :loading
          ?<div style={{ textAlign:'center',padding:'32px' }}><Loader2 size={20} className="animate-spin" color="rgba(99,102,241,0.6)"/></div>
          :boosts.length===0
            ?<div style={{ textAlign:'center',padding:'48px 24px',background:'#f8f9fc',border:'2px dashed #e6e8f0',borderRadius:'20px' }}>
                <div style={{ fontSize:'40px',marginBottom:'12px' }}>🚀</div>
                <p style={{ color:'#151329',fontSize:'15px',fontWeight:700,margin:'0 0 6px' }}>Aucun boost actif</p>
                <p style={{ color:'#6b6f85',fontSize:'13px',margin:'0 0 20px' }}>Boostez votre profil pour apparaître sur Facebook et Instagram automatiquement.</p>
                <button onClick={()=>setShowModal(true)} style={{ display:'inline-flex',alignItems:'center',gap:'6px',padding:'10px 24px',background:'linear-gradient(135deg,#f59e0b,#ef4444)',border:'none',borderRadius:'12px',color:'white',fontSize:'13px',fontWeight:700,cursor:'pointer' }}><Zap size={14}/> Lancer mon premier boost</button>
              </div>
            :<div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                {boosts.map(boost=><BoostCard key={boost.id} boost={boost} profile={profile} onActivate={handleActivate} isAdmin={isAdmin}/>)}
              </div>
      }

      <AnimatePresence>
        {showModal&&<NewBoostModal profile={profile} onClose={()=>setShowModal(false)} onCreated={b=>setBoosts(prev=>[b,...prev])}/>}
      </AnimatePresence>
    </div>
  );
}