import React from 'react';
import {
  Save, Loader2, Lock, CheckCircle, AlertCircle, Crown,
  CalendarClock, AtSign, BadgeCheck, BarChart2,
  Link2, ShoppingBag, FileText, Users,
} from "lucide-react";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import QRCodeDisplay from "@/components/dashboard/QRCodeDisplay";
import StatsCard from "@/components/dashboard/StatsCard";

function useWindowWidth() {
  const [width, setWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  React.useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return width;
}

export default function OverviewPanel({
  profile, limits, isActivated, onNavigate,
  onUpdate, onSave, hasChanges, saving, plan,
  onRequestActivation,
}) {
  const isMob = useWindowWidth() < 768;
  const links = profile?.links || [];

  const quickActions = [
    { label:'Plateformes',  icon:Link2,         color:'#0ea5e9', section:'platforms',   desc:links.length+' lien(s)',                                                             locked:false },
    { label:'Événement',    icon:CalendarClock, color:'#f59e0b', section:'event',        desc:limits.hasEvent?(profile?.is_event?'Activé':'Désactivé'):'PRO requis',              locked:!limits.hasEvent },
    { label:'Analytics',    icon:BarChart2,     color:'#a78bfa', section:'analytics',    desc:limits.hasStats?'Actifs':'PRO requis',                                               locked:!limits.hasStats },
    { label:'Marketplace',  icon:ShoppingBag,   color:'#22c55e', section:'marketplace',  desc:(limits.maxMarketplace===Infinity?'∞':limits.maxMarketplace)+' produits max',       locked:false },
    { label:'CRM',          icon:Users,         color:'#ec4899', section:'crm',          desc:limits.hasCRM?'Actif':'BUSINESS requis',                                             locked:!limits.hasCRM },
    { label:'Documents',    icon:FileText,      color:'#64748b', section:'documents',    desc:limits.maxDocs+' doc(s) max',                                                        locked:false },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div>
        <h2 style={{ color:'white', fontSize:'20px', fontWeight:800, margin:0 }}>Dashboard</h2>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'13px', margin:'4px 0 0' }}>
          Bienvenue sur votre espace SocialApp
        </p>
      </div>

      {/* Activation banner */}
      {!isActivated && (
        <div style={{ background:'rgba(0,87,255,0.1)', border:'1px solid rgba(0,87,255,0.3)', borderRadius:'14px', padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:'10px' }}>
          <AlertCircle size={16} color="#60a5fa" style={{ flexShrink:0, marginTop:'1px' }}/>
          <div>
            <p style={{ color:'#93c5fd', fontSize:'13px', fontWeight:600, margin:'0 0 2px' }}>Compte en attente d'activation</p>
            <p style={{ color:'rgba(147,197,253,0.6)', fontSize:'11px', margin:0 }}>
              Certaines fonctionnalités sont verrouillées. Contactez le support pour activer votre compte.
            </p>
          </div>
          <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer"
            style={{ marginLeft:'auto', background:'#25D366', borderRadius:'8px', padding:'6px 12px', color:'white', fontSize:'11px', fontWeight:700, textDecoration:'none', flexShrink:0, display:'flex', alignItems:'center', gap:'5px', whiteSpace:'nowrap' }}>
            WhatsApp →
          </a>
        </div>
      )}

      {/* Top 3-column grid */}
      <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr':'repeat(3,1fr)', gap:'16px', alignItems:'start' }}>

        {/* Profile card */}
        <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', overflow:'hidden' }}>
          <ProfileHeader profile={profile} onUpdate={onUpdate}/>

          {/* Username row */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', padding:'11px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
            <AtSign size={13} color="rgba(255,255,255,0.4)"/>
            <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'12px', flexShrink:0 }}>@</span>
            {isActivated ? (
              <input type="text" value={profile?.username||''} onChange={e=>onUpdate({username:e.target.value})} placeholder="username"
                style={{ background:'transparent', border:'none', color:'white', fontSize:'12px', outline:'none', flex:1, minWidth:0 }}/>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={onRequestActivation}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onRequestActivation?.(); }}
                title="Cliquez pour activer votre compte et débloquer le username personnalisé"
                style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}
                onMouseEnter={e=>{ e.currentTarget.firstChild.style.borderColor='rgba(0,87,255,0.4)'; e.currentTarget.firstChild.style.opacity='0.85'; }}
                onMouseLeave={e=>{ e.currentTarget.firstChild.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.firstChild.style.opacity='0.6'; }}
              >
                <div style={{ flex:1, background:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'5px 10px', border:'1px dashed rgba(255,255,255,0.12)', display:'flex', alignItems:'center', gap:'6px', opacity:0.6, transition:'border-color 0.15s, opacity 0.15s' }}>
                  <Lock size={11} color="rgba(255,255,255,0.4)"/>
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', fontStyle:'italic' }}>{profile?.username||'verrouillé'}</span>
                </div>
                <span style={{ background:'rgba(0,87,255,0.2)', border:'1px solid rgba(0,87,255,0.4)', borderRadius:'6px', padding:'3px 7px', fontSize:'9px', color:'#60a5fa', fontWeight:700, flexShrink:0 }}>Pro</span>
              </div>
            )}
          </div>

          {/* Badge row */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <BadgeCheck size={13} color="rgba(255,255,255,0.4)"/>
              <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px' }}>Badge vérifié</span>
              {!limits.badge && (
                <span style={{ background:'rgba(255,140,0,0.15)', border:'1px solid rgba(255,140,0,0.3)', borderRadius:'5px', padding:'1px 5px', fontSize:'9px', color:'#ff8c00', fontWeight:700 }}>PRO</span>
              )}
            </div>
            <button onClick={()=>limits.badge&&onUpdate({is_verified:!profile?.is_verified})}
              style={{ width:'38px', height:'20px', borderRadius:'100px', background:profile?.is_verified?'#22c55e':'rgba(255,255,255,0.1)', border:'none', cursor:limits.badge?'pointer':'not-allowed', position:'relative', transition:'background 0.3s', flexShrink:0, opacity:limits.badge?1:0.4 }}>
              <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:'white', position:'absolute', top:'3px', left:profile?.is_verified?'21px':'3px', transition:'left 0.3s' }}/>
            </button>
          </div>

          {/* Expiry row */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', padding:'11px 14px', display:'flex', alignItems:'center', gap:'8px' }}>
            <CalendarClock size={13} color="rgba(255,255,255,0.4)"/>
            <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'12px', flexShrink:0 }}>Exp. :</span>
            <span style={{ color:'white', fontSize:'12px' }}>
              {profile?.expiry_date ? new Date(profile.expiry_date).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}) : '—'}
            </span>
          </div>

          {/* Activation status row */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', padding:'11px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'26px', height:'26px', borderRadius:'7px', background:isActivated?'rgba(34,197,94,0.2)':'rgba(0,87,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {isActivated ? <CheckCircle size={13} color="#22c55e"/> : <Lock size={13} color="#60a5fa"/>}
            </div>
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px' }}>
              {isActivated ? '✅ Compte activé' : "⏳ En attente d'activation"}
            </span>
          </div>

          {/* Save row */}
          {hasChanges && (
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', padding:'10px 14px' }}>
              <button onClick={onSave} disabled={saving}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', width:'100%', padding:'8px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:'10px', color:'white', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
                {saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>} Sauvegarder
              </button>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div><QRCodeDisplay profileId={profile?.id} username={profile?.username}/></div>

        {/* Stats */}
        <div>
          {limits.hasStats ? (
            <StatsCard profileId={profile?.id}/>
          ) : (
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'18px', padding:'24px 16px', textAlign:'center' }}>
              <BarChart2 size={28} color="rgba(255,255,255,0.2)" style={{ margin:'0 auto 10px' }}/>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', fontWeight:600, margin:'0 0 4px' }}>Statistiques</p>
              <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'11px', margin:'0 0 6px' }}>Disponible avec l'offre PRO</p>
              <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'10px', margin:'0 0 14px' }}>15 000 FCFA / an</p>
              <a href="/"
                style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(255,140,0,0.15)', border:'1px solid rgba(255,140,0,0.3)', borderRadius:'10px', padding:'7px 14px', color:'#ff8c00', fontSize:'12px', fontWeight:600, textDecoration:'none' }}>
                <Crown size={12}/> Upgrader → PRO
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions grid */}
      <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr 1fr':'repeat(3,1fr)', gap:'10px' }}>
        {quickActions.map(a => (
          <button key={a.section} onClick={()=>onNavigate(a.section)}
            style={{ display:'flex', flexDirection:'column', gap:'10px', padding:'14px', background:a.locked?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.04)', border:'1px solid '+(a.locked?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.08)'), borderRadius:'16px', cursor:'pointer', textAlign:'left', transition:'all 0.15s', opacity:a.locked?0.55:1 }}
            onMouseEnter={e=>{ if(!a.locked){e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.transform='translateY(-2px)';}}}
            onMouseLeave={e=>{ e.currentTarget.style.background=a.locked?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.04)';e.currentTarget.style.transform='translateY(0)';}}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:a.color+'22', border:'1px solid '+a.color+'44', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {a.locked ? <Lock size={15} color="rgba(255,255,255,0.25)"/> : <a.icon size={16} color={a.color}/>}
              </div>
              {a.locked && (
                <span style={{ background:'rgba(255,140,0,0.12)', border:'1px solid rgba(255,140,0,0.3)', borderRadius:'5px', padding:'2px 6px', fontSize:'8.5px', color:'#ff8c00', fontWeight:700 }}>
                  {a.desc.includes('BUSINESS')?'💼 BIZ':'🚀 PRO'}
                </span>
              )}
            </div>
            <div>
              <p style={{ color:'white', fontSize:'12px', fontWeight:700, margin:'0 0 2px' }}>{a.label}</p>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', margin:0 }}>{a.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}