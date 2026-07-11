import React from 'react';
import {
  Save, Loader2, Lock, CheckCircle, AlertCircle, Crown,
  CalendarClock, AtSign, BadgeCheck, BarChart2,
  Link2, ShoppingBag, FileText, Users,
} from "lucide-react";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import QRCodeDisplay from "@/components/dashboard/QRCodeDisplay";
import StatsCard from "@/components/dashboard/StatsCard";
import ShortLinksCard from "@/components/dashboard/ShortLinksCard";

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
  onRequestActivation, onUpgrade,
}) {
  const isMob = useWindowWidth() < 768;
  const links = profile?.links || [];

  // Couleurs reprises du dégradé du logo SocialApp (bleu → violet → magenta → orange)
  const quickActions = [
    { label:'Plateformes',  icon:Link2,         color:'#3b4bf0', section:'platforms',   desc:links.length+' lien(s)',                                                             locked:false },
    { label:'Événement',    icon:CalendarClock, color:'#7b3ff2', section:'event',        desc:limits.hasEvent?(profile?.is_event?'Activé':'Désactivé'):'PRO requis',              locked:!limits.hasEvent },
    { label:'Analytics',    icon:BarChart2,     color:'#a52ee0', section:'analytics',    desc:limits.hasStats?'Actifs':'PRO requis',                                               locked:!limits.hasStats },
    { label:'Marketplace',  icon:ShoppingBag,   color:'#d81f9e', section:'marketplace',  desc:(limits.maxMarketplace===Infinity?'∞':limits.maxMarketplace)+' produits max',       locked:false },
    { label:'CRM',          icon:Users,         color:'#ef2f6b', section:'crm',          desc:limits.hasCRM?'Actif':'BUSINESS requis',                                             locked:!limits.hasCRM },
    { label:'Documents',    icon:FileText,      color:'#ff8c1a', section:'documents',    desc:limits.maxDocs+' doc(s) max',                                                        locked:false },
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
              Certaines fonctionnalités sont verrouillées. Envoyez votre paiement via Wave CI au numéro : +225 05 76 03 12 12 pour l'activer
            </p>
          </div>
          <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer"
            style={{ marginLeft:'auto', background:'#25D366', borderRadius:'8px', padding:'8px 14px', color:'white', fontSize:'11px', fontWeight:700, textDecoration:'none', flexShrink:0, display:'flex', alignItems:'center', gap:'5px', whiteSpace:'nowrap' }}>
            WhatsApp — Envoyer la preuve
          </a>
        </div>
      )}

      {/* Top 3-column grid */}
      <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr':'repeat(3,1fr)', gap:'16px', alignItems:'start' }}>

        {/* Profile card */}
        <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', overflow:'hidden' }}>
          <ProfileHeader profile={profile} onUpdate={onUpdate}/>

          {/* Bloc méta compact — username + badge sur une ligne, expiry + statut sur l'autre */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', padding:'12px 14px', display:'flex', flexDirection:'column', gap:'10px' }}>

            {/* Ligne 1 : username + badge vérifié */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <AtSign size={13} color="rgba(255,255,255,0.35)" style={{ flexShrink:0 }}/>
              {isActivated ? (
                <input type="text" value={profile?.username||''} onChange={e=>onUpdate({username:e.target.value})} placeholder="username"
                  style={{ background:'transparent', border:'none', color:'white', fontSize:'12px', outline:'none', flex:1, minWidth:0 }}/>
              ) : (
                <div
                  role="button" tabIndex={0}
                  onClick={onRequestActivation}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onRequestActivation?.(); }}
                  title="Cliquez pour activer votre compte et débloquer le username personnalisé"
                  style={{ flex:1, display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', minWidth:0 }}
                >
                  <Lock size={11} color="rgba(255,255,255,0.35)" style={{ flexShrink:0 }}/>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile?.username||'verrouillé'}</span>
                </div>
              )}

              <button onClick={()=>limits.badge&&onUpdate({is_verified:!profile?.is_verified})}
                title={limits.badge ? 'Badge vérifié' : 'Badge vérifié — PRO requis'}
                aria-label="Basculer le badge vérifié"
                style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:limits.badge?'pointer':'not-allowed', padding:0, flexShrink:0, opacity:limits.badge?1:0.4 }}>
                <BadgeCheck size={13} color={profile?.is_verified ? '#22c55e' : 'rgba(255,255,255,0.35)'}/>
                <div style={{ width:'30px', height:'17px', borderRadius:'100px', background:profile?.is_verified?'#22c55e':'rgba(255,255,255,0.1)', position:'relative', transition:'background 0.3s' }}>
                  <div style={{ width:'11px', height:'11px', borderRadius:'50%', background:'white', position:'absolute', top:'3px', left:profile?.is_verified?'16px':'3px', transition:'left 0.3s' }}/>
                </div>
              </button>
            </div>

            {/* Ligne 2 : expiry + statut d'activation */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px', flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:'5px', color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>
                <CalendarClock size={12}/>
                Exp. {profile?.expiry_date ? new Date(profile.expiry_date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:isActivated?'#4ade80':'#60a5fa' }}>
                {isActivated ? <CheckCircle size={12}/> : <Lock size={12}/>}
                {isActivated ? 'Compte activé' : "En attente d'activation"}
              </span>
            </div>
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
        {/* [FIX Q-ACTIVATION] isActivated transmis à QRCodeDisplay : tant que
            le compte n'est pas activé (verrou anti-squattage de username
            avant paiement), le username local n'est pas encore celui stocké
            en base — générer le QR ici encoderait un lien qui répond
            "Profil introuvable" une fois scanné. QRCodeDisplay affiche
            désormais un état "en attente d'activation" dans ce cas plutôt
            que de rendre un QR mort. userLogo/onNavigate ajoutés au passage
            pour que le logo du profil et la redirection vers "Configurer
            mon profil" (cas username manquant) fonctionnent aussi ici. */}
        <div>
          <QRCodeDisplay
            profileId={profile?.id}
            username={profile?.username}
            userLogo={profile?.avatar_url}
            isActivated={isActivated}
            onNavigate={onNavigate}
          />
        </div>

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
              <button type="button" onClick={()=>onUpgrade?.('Statistiques','pro')}
                style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(255,140,0,0.15)', border:'1px solid rgba(255,140,0,0.3)', borderRadius:'10px', padding:'7px 14px', color:'#ff8c00', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <Crown size={12}/> Upgrader → PRO
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Raccourcis de lien — personnalisation + alias vers le profil public.
          profileUsername transmis pour que ShortLinksCard puisse afficher le
          lien d'origine (profil public) dans la confirmation post-création. */}
      <ShortLinksCard profileId={profile?.id} isActivated={isActivated} profileUsername={profile?.username} />
      {/* FIX OPACITÉ — les cartes utilisaient un fond quasi transparent
          (a.color+'14' = ~8% d'opacité, bordure +'33' = ~20%), ce qui les
          rendait trop translucides sur le fond sombre du dashboard. On
          garde exactement les mêmes couleurs (a.color) mais avec des
          canaux alpha bien plus élevés pour un rendu "opaque" :
          fond ~78% (+'c8'), bordure ~55% (+'8c'), hover ~88% (+'e0').
          Le texte reste blanc/blanc-atténué, toujours lisible sur ces
          fonds plus denses. Les cartes verrouillées gardent leur style
          gris neutre inchangé. */}
      <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr 1fr':'repeat(3,1fr)', gap:'10px' }}>
        {quickActions.map(a => (
          <button key={a.section} onClick={()=>onNavigate(a.section)}
            style={{ display:'flex', flexDirection:'column', gap:'10px', padding:'14px', background:a.locked?'rgba(255,255,255,0.06)':a.color+'c8', border:'1px solid '+(a.locked?'rgba(255,255,255,0.1)':a.color+'8c'), borderRadius:'16px', cursor:'pointer', textAlign:'left', transition:'all 0.15s', opacity:a.locked?0.55:1 }}
            onMouseEnter={e=>{ if(!a.locked){e.currentTarget.style.background=a.color+'e0';e.currentTarget.style.transform='translateY(-2px)';}}}
            onMouseLeave={e=>{ e.currentTarget.style.background=a.locked?'rgba(255,255,255,0.06)':a.color+'c8';e.currentTarget.style.transform='translateY(0)';}}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(0,0,0,0.22)', border:'1px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {a.locked ? <Lock size={15} color="rgba(255,255,255,0.35)"/> : <a.icon size={16} color="white"/>}
              </div>
              {a.locked && (
                <span style={{ background:'rgba(255,140,0,0.12)', border:'1px solid rgba(255,140,0,0.3)', borderRadius:'5px', padding:'2px 6px', fontSize:'8.5px', color:'#ff8c00', fontWeight:700 }}>
                  {a.desc.includes('BUSINESS')?'💼 BIZ':'🚀 PRO'}
                </span>
              )}
            </div>
            <div>
              <p style={{ color:'white', fontSize:'12px', fontWeight:700, margin:'0 0 2px' }}>{a.label}</p>
              <p style={{ color:a.locked?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.8)', fontSize:'10px', margin:0 }}>{a.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

