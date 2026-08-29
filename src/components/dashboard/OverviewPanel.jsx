import React from 'react';
import {
  Save, Loader2, Lock, CheckCircle, AlertCircle, Crown,
  CalendarClock, CalendarDays, AtSign, BadgeCheck, BarChart2,
  Link2, ShoppingBag, Users, Image, GalleryHorizontal, X,
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
  onRequestActivation, onUpgrade,
  // [DÉPLACÉ] Contrôle d'image de fond, auparavant dans le footer de
  // UserSidebar — vit maintenant dans la carte Profil, juste en dessous.
  // `onBgUpload` reçoit directement le File (comme uploadBgFile côté
  // UserDashboard), pas l'event brut.
  bgImageUrl, uploadingBg, onBgUpload, onBgRemove,
  // [AJOUT] Bannière de couverture (profile.banner_url) — même pattern que
  // l'image de fond ci-dessus : `onBannerUpload` reçoit directement le File.
  // Affichée en haut de la page publique, au-dessus de l'avatar (voir
  // PublicProfile.jsx). Distincte de l'image de fond (qui couvre tout
  // l'écran derrière la page).
  bannerUrl, uploadingBanner, onBannerUpload, onBannerRemove,
}) {
  const isMob = useWindowWidth() < 768;
  const links = profile?.links || [];

  // [SIMPLIFICATION PAR PLAN] Auparavant, une fonctionnalité non incluse
  // dans le plan (Événement, Analytics, CRM…) restait affichée grisée avec
  // un cadenas + bouton d'upgrade. On filtre désormais ces cartes pour ne
  // garder QUE ce qui est réellement inclus dans le plan courant : le
  // dashboard Basic devient ainsi visuellement plus léger (moins de
  // cartes) que Pro, lui-même plus léger que Business, plutôt que les
  // trois affichant la même grille avec plus ou moins de cadenas.
  // Pour retrouver l'ancien comportement (cartes verrouillées visibles),
  // il suffit de ne pas filtrer sur `locked` ci-dessous.
  const quickActions = [
    { label:'Plateformes',  icon:Link2,         color:'#3b4bf0', section:'platforms',   desc:links.length+' lien(s)',                                                       locked:false },
    { label:'Événement',    icon:CalendarClock, color:'#7b3ff2', section:'event',        desc:profile?.is_event?'Activé':'Désactivé',                                        locked:!limits.hasEvent },
    { label:'Analytics',    icon:BarChart2,     color:'#a52ee0', section:'analytics',    desc:'Actifs',                                                                       locked:!limits.hasStats },
    { label:'Marketplace',  icon:ShoppingBag,   color:'#d81f9e', section:'marketplace',  desc:(limits.maxMarketplace===Infinity?'∞':limits.maxMarketplace)+' produits max', locked:false },
    { label:'CRM',          icon:Users,         color:'#ef2f6b', section:'crm',          desc:'Actif',                                                                        locked:!limits.hasCRM },
    // [CHANGEMENT] Documents remplacé par le Calendrier de RDV sur la page
    // d'accueil — Documents reste accessible normalement depuis la
    // sidebar/MobileNav, il n'est simplement plus mis en avant ici.
    { label:'Calendrier',   icon:CalendarDays,  color:'#0d1330', section:'booking',     desc:'Prise de rendez-vous',                                                        locked:false },
  ].filter(a => !a.locked);

  // Idem pour la rangée du haut : la carte Statistiques n'apparaît plus du
  // tout en version "verrouillée" pour les plans qui n'y ont pas accès —
  // seules Profil + QR Code restent, sur 2 colonnes au lieu de 3.
  const showStatsCard = limits.hasStats;
  const topColumnCount = showStatsCard ? 3 : 2;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div>
        <h2 style={{ color:'#0f1222', fontSize:'20px', fontWeight:800, margin:0 }}>Dashboard</h2>
        <p style={{ color:'rgba(15,18,34,0.45)', fontSize:'13px', margin:'4px 0 0' }}>
          Bienvenue sur votre espace SocialApp
        </p>
      </div>

      {/* Activation banner */}
      {!isActivated && (
        <div style={{ background:'rgba(59,75,240,0.06)', border:'1px solid rgba(59,75,240,0.2)', borderRadius:'14px', padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:'10px' }}>
          <AlertCircle size={16} color="#3b4bf0" style={{ flexShrink:0, marginTop:'1px' }}/>
          <div>
            <p style={{ color:'#2c3aa8', fontSize:'13px', fontWeight:600, margin:'0 0 2px' }}>Compte en attente d'activation</p>
            <p style={{ color:'rgba(44,58,168,0.65)', fontSize:'11px', margin:0 }}>
              Certaines fonctionnalités sont verrouillées. Envoyez votre paiement via Wave CI au numéro : +225 05 76 03 12 12 pour l'activer
            </p>
          </div>
          <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer"
            style={{ marginLeft:'auto', background:'#25D366', borderRadius:'8px', padding:'8px 14px', color:'white', fontSize:'11px', fontWeight:700, textDecoration:'none', flexShrink:0, display:'flex', alignItems:'center', gap:'5px', whiteSpace:'nowrap' }}>
            WhatsApp — Envoyer la preuve
          </a>
        </div>
      )}

      {/* Top grid — 3 colonnes (Profil / QR / Stats) si le plan inclut les
          statistiques, sinon 2 colonnes (Profil / QR) pour un dashboard
          Basic plus compact plutôt qu'une 3e carte grisée. */}
      <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr':`repeat(${topColumnCount},1fr)`, gap:'16px', alignItems:'start' }}>

        {/* Profile card — la carte profil garde son fond bleu nuit foncé
            (comme sur la capture), c'est un bloc d'accent volontairement
            sombre au sein d'un dashboard clair, pas un reste de l'ancien
            thème. Tout le reste du panneau passe en thème clair. */}
        <div style={{ background:'linear-gradient(180deg,#0d1330,#0a0f24)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'20px', overflow:'hidden', boxShadow:'0 4px 20px rgba(15,18,34,0.12)' }}>
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

            {/* [AJOUT] Bannière de couverture (profile.banner_url) — placée
                AVANT le bloc "Image de fond" : c'est le premier élément
                visuel de la page publique (au-dessus de l'avatar), il
                précède donc logiquement le fond d'écran plein-page dans
                l'ordre des contrôles. Même pattern d'upload que ci-dessous. */}
            {onBannerUpload && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <label style={{
                  flex:1, display:'flex', alignItems:'center', gap:'6px',
                  background:bannerUrl?'rgba(99,102,241,0.16)':'rgba(255,255,255,0.07)',
                  border:'1px solid '+(bannerUrl?'rgba(99,102,241,0.4)':'rgba(255,255,255,0.1)'),
                  borderRadius:'8px', padding:'7px 10px', cursor:uploadingBanner?'not-allowed':'pointer',
                  position:'relative',
                }}>
                  {uploadingBanner
                    ? <Loader2 size={12} color="#a5b4fc" className="animate-spin" />
                    : <GalleryHorizontal size={12} color={bannerUrl ? '#a5b4fc' : 'rgba(255,255,255,0.45)'} />
                  }
                  <span style={{ color:bannerUrl?'#a5b4fc':'rgba(255,255,255,0.45)', fontSize:'10px', fontWeight:600 }}>
                    {bannerUrl ? 'Changer la bannière' : 'Bannière de couverture'}
                  </span>
                  <input
                    type="file" accept="image/*"
                    style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }}
                    onChange={e => { const file = e.target.files?.[0]; if (file) onBannerUpload(file); e.target.value=''; }}
                    disabled={uploadingBanner}
                  />
                </label>
                {bannerUrl && onBannerRemove && (
                  <button
                    onClick={onBannerRemove}
                    aria-label="Retirer la bannière"
                    style={{
                      width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.35)',
                      borderRadius:'8px', cursor:'pointer',
                    }}
                  >
                    <X size={11} color="#f87171" />
                  </button>
                )}
              </div>
            )}

            {/* [DÉPLACÉ DEPUIS LA SIDEBAR] Image de fond du profil public —
                rapprochée de la carte qu'elle modifie plutôt que reléguée
                au bas du menu, loin de tout aperçu. Placée après la
                bannière de couverture ci-dessus. */}
            {onBgUpload && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <label style={{
                  flex:1, display:'flex', alignItems:'center', gap:'6px',
                  background:bgImageUrl?'rgba(244,114,182,0.16)':'rgba(255,255,255,0.07)',
                  border:'1px solid '+(bgImageUrl?'rgba(244,114,182,0.4)':'rgba(255,255,255,0.1)'),
                  borderRadius:'8px', padding:'7px 10px', cursor:uploadingBg?'not-allowed':'pointer',
                  position:'relative',
                }}>
                  {uploadingBg
                    ? <Loader2 size={12} color="#f9a8d4" className="animate-spin" />
                    : <Image size={12} color={bgImageUrl ? '#f9a8d4' : 'rgba(255,255,255,0.45)'} />
                  }
                  <span style={{ color:bgImageUrl?'#f9a8d4':'rgba(255,255,255,0.45)', fontSize:'10px', fontWeight:600 }}>
                    {bgImageUrl ? 'Changer le fond' : 'Image de fond'}
                  </span>
                  <input
                    type="file" accept="image/*"
                    style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }}
                    onChange={e => { const file = e.target.files?.[0]; if (file) onBgUpload(file); e.target.value=''; }}
                    disabled={uploadingBg}
                  />
                </label>
                {bgImageUrl && onBgRemove && (
                  <button
                    onClick={onBgRemove}
                    aria-label="Retirer l'image de fond"
                    style={{
                      width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.35)',
                      borderRadius:'8px', cursor:'pointer',
                    }}
                  >
                    <X size={11} color="#f87171" />
                  </button>
                )}
              </div>
            )}
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
        <div>
          <QRCodeDisplay
            profileId={profile?.id}
            username={profile?.username}
            userLogo={profile?.avatar_url}
            isActivated={isActivated}
            onNavigate={onNavigate}
          />
        </div>

        {/* Stats — n'apparaît que si le plan l'inclut (voir showStatsCard
            plus haut) ; plus de version "grisée + upgrade" ici, elle est
            simplement absente pour Basic. */}
        {showStatsCard && (
          <div>
            <StatsCard profileId={profile?.id}/>
          </div>
        )}
      </div>

      {/* Quick actions — uniquement les sections incluses dans le plan
          (voir le filtre `locked` plus haut). Basic : Plateformes,
          Marketplace, Documents. Pro : + Événement, Analytics.
          Business : + CRM. Chaque plan a donc sa propre grille, sans
          cartes grisées à combler. */}
      <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr 1fr':'repeat(3,1fr)', gap:'10px' }}>
        {quickActions.map(a => (
          <button key={a.section} onClick={()=>onNavigate(a.section)}
            style={{ display:'flex', flexDirection:'column', gap:'10px', padding:'14px', background:a.color, border:'1px solid '+a.color, borderRadius:'16px', cursor:'pointer', textAlign:'left', transition:'all 0.15s', boxShadow:'0 2px 10px '+a.color+'40' }}
            onMouseEnter={e=>{ e.currentTarget.style.filter='brightness(1.08)';e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.filter='brightness(1)';e.currentTarget.style.transform='translateY(0)'; }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,255,255,0.22)', border:'1px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <a.icon size={16} color="white"/>
              </div>
            </div>
            <div>
              <p style={{ color:'white', fontSize:'12px', fontWeight:700, margin:'0 0 2px' }}>{a.label}</p>
              <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'10px', margin:0 }}>{a.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Bandeau d'upgrade — visible uniquement s'il existe des sections
          masquées pour ce plan (Basic ou Pro), pour ne pas laisser
          l'utilisateur deviner que d'autres fonctionnalités existent.
          Absent pour Business, qui a déjà tout débloqué. */}
      {(!limits.hasEvent || !limits.hasStats || !limits.hasCRM) && (
        <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'14px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
          <Crown size={16} color="#d97600" style={{ flexShrink:0 }}/>
          <p style={{ flex:1, minWidth:'200px', margin:0, color:'#7c4a03', fontSize:'12px', lineHeight:1.5 }}>
            {plan === 'basic'
              ? "Passez à l'offre PRO ou BUSINESS pour débloquer Événement, Analytics, CRM et plus de liens."
              : "Passez à l'offre BUSINESS pour débloquer le CRM et les automatisations."}
          </p>
          <button type="button" onClick={()=>onUpgrade?.()}
            style={{ padding:'8px 16px', borderRadius:'10px', border:'none', background:'#d97600', color:'white', fontWeight:700, fontSize:'12px', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
            Voir les offres →
          </button>
        </div>
      )}
    </div>
  );
}