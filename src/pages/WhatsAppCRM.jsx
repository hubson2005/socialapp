import { useState, useEffect } from 'react'
import { useWhatsappCRM, BOOST_NOTIF_TEMPLATES } from '../hooks/useWhatsappCRM'
// ✅ FIX: import CampaignAIGenerator avec fallback si inexistant
let CampaignAIGenerator
try {
  CampaignAIGenerator = require('@/components/dashboard/AIPanels').CampaignAIGenerator
} catch {
  CampaignAIGenerator = null
}

// ── TEMPLATES ────────────────────────────────────────────────────
const TEMPLATES = [
  { id:1, name:'Bienvenue',      text:'👋 Bonjour {{prénom}}, bienvenue chez SocialApp ! Comment puis-je vous aider ?' },
  { id:2, name:'Rappel RDV',     text:'⏰ Rappel : votre RDV est demain à {{heure}}. Répondez OUI pour confirmer.' },
  { id:3, name:'Suivi prospect', text:'Bonjour {{prénom}}, avez-vous eu le temps de réfléchir à notre proposition ?' },
  { id:4, name:'Promotion',      text:'🎉 Offre exclusive {{prénom}} : -20% ce week-end ! Code : PROMO20' },
]
const MAX_MSG = 1000

// ── DESIGN TOKENS ────────────────────────────────────────────────
const C = {
  bg:'#0c0d1a', card:'#141525', border:'rgba(255,255,255,0.07)', borderAct:'rgba(108,99,255,0.4)',
  purple:'#6c63ff', purpleL:'#8b84ff', purpleDim:'rgba(108,99,255,0.15)',
  orange:'#ff9500', orangeDim:'rgba(255,149,0,0.15)',
  green:'#25D366', greenDim:'rgba(37,211,102,0.12)', greenDark:'#166834',
  blue:'#3b82f6', blueDim:'rgba(59,130,246,0.12)',
  text:'#ffffff', textSub:'#8b8fa8', textMute:'#4a4e6a',
  amber:'#f59e0b', amberDim:'rgba(245,158,11,0.12)',
  red:'#ef4444', redDim:'rgba(239,68,68,0.12)',
}
const TAG_C  = { Client:[C.purpleDim,C.purpleL], Prospect:[C.blueDim,C.blue], VIP:[C.orangeDim,C.orange] }
const STA_C  = { actif:[C.greenDim,C.green], attente:[C.orangeDim,C.orange], inactif:['rgba(255,255,255,0.06)',C.textMute] }
const CAM_C  = { envoyé:[C.greenDim,C.green], planifié:[C.blueDim,C.blue], brouillon:['rgba(255,255,255,0.06)',C.textMute] }
const NOTIF_TYPE_C = {
  boost_activated:['rgba(34,197,94,0.12)','#22c55e','🚀'],
  boost_completed:['rgba(99,102,241,0.12)','#a78bfa','📊'],
  new_lead:       ['rgba(245,158,11,0.12)','#f59e0b','🔥'],
  view_milestone: ['rgba(59,130,246,0.12)','#3b82f6','👀'],
  weekly_report:  ['rgba(16,185,129,0.12)','#10b981','📈'],
  manual:         ['rgba(255,255,255,0.06)','#8b8fa8','💬'],
}
const AVAT = [
  'linear-gradient(135deg,#6c63ff,#a78bfa)',
  'linear-gradient(135deg,#3b82f6,#60a5fa)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
  'linear-gradient(135deg,#25D366,#4ade80)',
]

const S = {
  page:     { background:C.bg, minHeight:'100vh', color:C.text, fontFamily:"'Inter','DM Sans',system-ui,sans-serif" },
  header:   { padding:'18px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  hTitle:   { fontSize:22, fontWeight:700, letterSpacing:'-0.5px', color:C.text, display:'flex', alignItems:'center', gap:9 },
  proBadge: { fontSize:10, fontWeight:700, background:C.orangeDim, color:C.orange, padding:'3px 8px', borderRadius:6, letterSpacing:'0.5px', textTransform:'uppercase' },
  hSub:     { fontSize:13, color:C.textMute, marginTop:3 },
  tabs:     { display:'flex', gap:2, padding:'0 24px', borderBottom:`1px solid ${C.border}`, marginBottom:24, overflowX:'auto' },
  tab: (a) => ({ padding:'10px 14px', fontSize:13, fontWeight:a?600:400, color:a?C.purpleL:C.textSub, border:'none', background:'none', cursor:'pointer', borderBottom:a?`2px solid ${C.purple}`:'2px solid transparent', transition:'all .15s', whiteSpace:'nowrap', flexShrink:0 }),
  content:  { padding:'0 24px 32px' },
  g4:       { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 },
  g2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  card:     { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 18px' },
  cardT:    { fontSize:13, fontWeight:600, color:C.text, marginBottom:14, display:'flex', alignItems:'center', gap:7 },
  statCard: { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 18px', position:'relative', overflow:'hidden' },
  statIco:  (bg) => ({ width:36, height:36, borderRadius:9, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, marginBottom:10 }),
  statVal:  { fontSize:28, fontWeight:800, letterSpacing:'-1.5px', color:C.text },
  statLbl:  { fontSize:12, color:C.textMute, marginTop:2 },
  statGlow: (c) => ({ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:c, filter:'blur(30px)', opacity:0.25, pointerEvents:'none' }),
  tbl:      { width:'100%', borderCollapse:'collapse' },
  th:       { textAlign:'left', fontSize:10, color:C.textMute, fontWeight:700, paddingBottom:9, borderBottom:`1px solid ${C.border}`, textTransform:'uppercase', letterSpacing:'0.8px' },
  td:       { padding:'11px 0', borderBottom:`1px solid rgba(255,255,255,0.04)`, fontSize:13, color:'#c8cae0', verticalAlign:'middle' },
  badge:    (bg,c) => ({ display:'inline-flex', padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:700, background:bg, color:c, letterSpacing:'0.3px', textTransform:'uppercase' }),
  avat:     (g,sz=30) => ({ width:sz, height:sz, borderRadius:'50%', background:g, display:'flex', alignItems:'center', justifyContent:'center', fontSize:sz>30?14:11, fontWeight:700, color:'#fff', flexShrink:0 }),
  btn:      (v='primary', loading=false) => ({
    display:'inline-flex', alignItems:'center', gap:6,
    padding: v==='sm'?'5px 12px':'9px 16px',
    borderRadius:9, border:`1px solid ${v==='ghost'?C.border:v==='green'?C.green:v==='danger'?C.red:v==='primary'?C.purple:'transparent'}`,
    cursor: loading?'wait':'pointer', fontSize:13, fontWeight:600, transition:'all .15s',
    background: v==='green'?'rgba(37,211,102,0.15)':v==='danger'?C.redDim:v==='primary'?C.purpleDim:v==='ghost'?'transparent':C.purpleDim,
    color:       v==='green'?C.green:v==='danger'?C.red:v==='primary'?C.purpleL:v==='ghost'?C.textSub:C.purpleL,
    opacity: loading?0.7:1,
    boxShadow: v==='green'?'0 4px 14px rgba(37,211,102,0.2)':'none',
    fontFamily:'inherit',
  }),
  iconBtn:  (color=C.textSub) => ({
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`,
    background:'transparent', cursor:'pointer', color, fontSize:13, transition:'all .15s',
  }),
  overlay:  { position:'fixed', inset:0, background:'rgba(5,5,15,0.88)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:    { background:'#181930', border:`1px solid ${C.border}`, borderRadius:18, padding:'26px 28px', width:480, maxWidth:'94vw', boxShadow:'0 24px 64px rgba(0,0,0,0.6)', maxHeight:'90vh', overflowY:'auto' },
  mT:       { fontSize:16, fontWeight:700, color:C.text, marginBottom:18, display:'flex', alignItems:'center', gap:8 },
  lbl:      { fontSize:11, color:C.textMute, marginBottom:5, display:'block', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' },
  inp:      { width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:13, outline:'none', boxSizing:'border-box', transition:'border-color .15s' },
  ta:       { width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:13, outline:'none', resize:'vertical', minHeight:100, boxSizing:'border-box', fontFamily:'inherit' },
  sel:      { width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:13, outline:'none', boxSizing:'border-box' },
  fg:       { marginBottom:14 },
  quickBtn: { display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:9, border:`1px solid ${C.border}`, background:'transparent', cursor:'pointer', width:'100%', color:C.textSub, fontSize:13, fontWeight:500, transition:'all .15s', marginBottom:8, fontFamily:'inherit' },
  toast:    (t) => ({ position:'fixed', bottom:22, right:22, background:t==='success'?'#0d3b26':'#3b1a1a', border:`1px solid ${t==='success'?C.green:'#ef4444'}`, borderRadius:9, padding:'11px 16px', color:t==='success'?C.green:'#ef4444', fontSize:13, fontWeight:600, zIndex:2000, display:'flex', alignItems:'center', gap:8 }),
  loading:  { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontSize:14, color:C.purple },
  errBox:   { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:9, padding:'12px 16px', color:'#ef4444', fontSize:13, margin:'24px' },
}

// ── ICÔNES ────────────────────────────────────────────────────────
const WaIcon = ({ size=14, color='currentColor' }) => (
  <svg viewBox="0 0 24 24" fill={color} style={{width:size,height:size,flexShrink:0}}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const Spinner = () => (
  <svg viewBox="0 0 24 24" fill="none" style={{width:14,height:14,animation:'spin .7s linear infinite'}}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </svg>
)

// ── BoostNotifsTab ────────────────────────────────────────────────
function BoostNotifsTab({ boostNotifs, profile, sendBoostNotification, connected, flash }) {
  const [sending,  setSending]  = useState(false)
  const [testType, setTestType] = useState('boost_activated')
  const [preview,  setPreview]  = useState('')

  useEffect(() => {
    const p = profile || { display_name:'Mon Profil', username:'monprofil', whatsapp_phone:'' }
    const tpl = BOOST_NOTIF_TEMPLATES.find(t => t.trigger_type === testType || t.id === testType)
    setPreview(tpl
      ? tpl.message
          .replace('{{nom}}',  p.display_name || 'Mon Profil')
          .replace('{{lien}}', 'https://socialapp.work/' + (p.username || ''))
          .replace('{{plan}}', 'Standard')
      : ''
    )
  }, [testType, profile])

  const handleTest = async () => {
    if (!profile?.whatsapp_phone) { flash('Configurez votre numéro WhatsApp dans les paramètres','error'); return }
    setSending(true)
    try {
      await sendBoostNotification({
        profile,
        boost:{ id:null, boost_type:'standard', networks:['facebook','instagram'], duration_days:7 },
        notificationType:testType,
        recipientPhone:profile.whatsapp_phone
      })
      flash(`Notification "${testType}" envoyée ✓`)
    } catch(e) { flash(e.message,'error') }
    finally { setSending(false) }
  }

  const typeLabel = {
    boost_activated:'🚀 Boost activé',
    boost_completed:'📊 Boost terminé',
    new_lead:'🔥 Nouveau lead',
    view_milestone:'👀 Jalon de vues',
    weekly_report:'📈 Rapport hebdo',
  }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
        {[
          { lbl:'Envoyées', val:boostNotifs.length,                                bg:C.greenDim,             glow:C.green,   ico:'📤' },
          { lbl:'Livrées',  val:boostNotifs.filter(n=>n.status==='sent').length,   bg:C.purpleDim,            glow:C.purple,  ico:'✅' },
          { lbl:'Échecs',   val:boostNotifs.filter(n=>n.status==='failed').length, bg:'rgba(239,68,68,0.12)', glow:'#ef4444', ico:'❌' },
        ].map((s,i) => (
          <div key={i} style={S.statCard}>
            <div style={S.statGlow(s.glow)}/>
            <div style={S.statIco(s.bg)}>{s.ico}</div>
            <div style={S.statVal}>{s.val}</div>
            <div style={S.statLbl}>{s.lbl}</div>
          </div>
        ))}
      </div>
      <div style={S.g2}>
        <div style={S.card}>
          <div style={S.cardT}>🧪 Tester une notification</div>
          <div style={S.fg}>
            <label style={S.lbl}>Type de notification</label>
            <select value={testType} onChange={e=>setTestType(e.target.value)} style={S.sel}>
              {Object.entries(typeLabel).map(([k,v]) => <option key={k} value={k} style={{background:C.bg}}>{v}</option>)}
            </select>
          </div>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:9, padding:'12px', marginBottom:14, maxHeight:160, overflowY:'auto' }}>
            <div style={{ fontSize:10, color:C.textMute, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>APERÇU</div>
            <pre style={{ color:'rgba(255,255,255,0.7)', fontSize:11, lineHeight:1.6, margin:0, whiteSpace:'pre-wrap', fontFamily:'inherit' }}>{preview}</pre>
          </div>
          <div style={{ fontSize:12, color:C.textMute, marginBottom:14 }}>
            📱 Envoi vers : <span style={{ color:profile?.whatsapp_phone?C.green:'#ef4444', fontWeight:600 }}>
              {profile?.whatsapp_phone || 'Non configuré'}
            </span>
          </div>
          {!connected && (
            <div style={{ padding:'9px 12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#ef4444', fontSize:12, marginBottom:12 }}>
              ⚠️ Configurez le webhook Make.com dans Paramètres
            </div>
          )}
          <button onClick={handleTest} disabled={sending||!connected||!profile?.whatsapp_phone}
            style={{ ...S.btn('green',sending), width:'100%', justifyContent:'center', opacity:(sending||!connected||!profile?.whatsapp_phone)?0.5:1 }}>
            {sending ? <><Spinner/> Envoi…</> : <><WaIcon size={14} color={C.green}/> Envoyer le test</>}
          </button>
        </div>
        <div style={S.card}>
          <div style={S.cardT}>⚡ Déclencheurs automatiques</div>
          <div style={{ fontSize:12, color:C.textMute, marginBottom:14, lineHeight:1.6 }}>
            Ces notifications sont envoyées automatiquement si le numéro WhatsApp est configuré.
          </div>
          {[
            ['🚀','Boost activé','Quand un boost passe en statut actif',profile?.notify_boost],
            ['📊','Boost terminé','À la fin de la période de boost',profile?.notify_boost],
            ['🔥','Nouveau lead','Quand un visiteur devient prospect',profile?.notify_new_lead],
            ['📈','Rapport hebdo','Chaque lundi avec les stats de la semaine',profile?.notify_weekly],
          ].map(([ico,label,desc,active]) => (
            <div key={label} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{ico}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:active?C.text:'rgba(255,255,255,0.4)' }}>{label}</div>
                <div style={{ fontSize:11, color:C.textMute, marginTop:1 }}>{desc}</div>
              </div>
              <div style={{ width:8, height:8, borderRadius:'50%', background:active?C.green:'rgba(255,255,255,0.15)', flexShrink:0, marginTop:4 }}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...S.card, marginTop:16 }}>
        <div style={S.cardT}>📋 Historique des notifications boost</div>
        {boostNotifs.length===0
          ? <div style={{ textAlign:'center', color:C.textMute, padding:'24px 0', fontSize:13 }}>Aucune notification envoyée pour l'instant</div>
          : <table style={S.tbl}>
              <thead><tr>{['Type','Destinataire','Statut','Date'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {boostNotifs.slice(0,20).map(n => {
                  const [bg,color,ico] = NOTIF_TYPE_C[n.notification_type] || NOTIF_TYPE_C.manual
                  return (
                    <tr key={n.id}>
                      <td style={S.td}><span style={{ ...S.badge(bg,color), gap:4 }}>{ico} {n.notification_type?.replace('_',' ')}</span></td>
                      <td style={{ ...S.td, color:C.textMute, fontSize:12 }}>{n.recipient_phone}</td>
                      <td style={S.td}>
                        <span style={S.badge(
                          n.status==='sent'?C.greenDim:n.status==='failed'?'rgba(239,68,68,0.12)':C.amberDim,
                          n.status==='sent'?C.green:n.status==='failed'?'#ef4444':C.amber,
                        )}>{n.status}</span>
                      </td>
                      <td style={{ ...S.td, color:C.textMute, fontSize:12 }}>
                        {new Date(n.created_at).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
        }
      </div>
    </div>
  )
}

// ── MODALS INLINE ─────────────────────────────────────────────────
function ModalAddContact({ newC, setNewC, closeModal, handleAddContact }) {
  return (
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&closeModal()}>
      <div style={S.modal}>
        <div style={S.mT}>➕ Nouveau contact</div>
        {[['Nom complet *','name','Sophie Martin'],['Téléphone *','phone','+225 07 00 00 00'],['Email','email','contact@mail.ci']].map(([l,k,p]) => (
          <div key={k} style={S.fg}>
            <label style={S.lbl}>{l}</label>
            <input style={S.inp} placeholder={p} value={newC[k]} onChange={e=>setNewC(v=>({...v,[k]:e.target.value}))}/>
          </div>
        ))}
        <div style={S.fg}>
          <label style={S.lbl}>Tag</label>
          <select style={S.sel} value={newC.tag} onChange={e=>setNewC(v=>({...v,tag:e.target.value}))}>
            {['Client','Prospect','VIP'].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button style={S.btn('ghost')} onClick={closeModal}>Annuler</button>
          {/* ✅ FIX: disabled réel + feedback visuel cohérent */}
          <button
            style={{...S.btn(), opacity:(!newC.name||!newC.phone)?0.4:1, pointerEvents:(!newC.name||!newC.phone)?'none':'auto'}}
            disabled={!newC.name||!newC.phone}
            onClick={handleAddContact}
          >Ajouter</button>
        </div>
      </div>
    </div>
  )
}

// ── MODAL EDIT CONTACT ────────────────────────────────────────────
function ModalEditContact({ editC, setEditC, closeModal, handleEditContact, saving }) {
  if (!editC) return null
  return (
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&closeModal()}>
      <div style={S.modal}>
        <div style={S.mT}>✏️ Modifier le contact</div>
        {[['Nom complet *','name','Sophie Martin'],['Téléphone *','phone','+225 07 00 00 00'],['Email','email','contact@mail.ci']].map(([l,k,p]) => (
          <div key={k} style={S.fg}>
            <label style={S.lbl}>{l}</label>
            <input style={S.inp} placeholder={p} value={editC[k]||''} onChange={e=>setEditC(v=>({...v,[k]:e.target.value}))}/>
          </div>
        ))}
        <div style={S.fg}>
          <label style={S.lbl}>Tag</label>
          <select style={S.sel} value={editC.tag} onChange={e=>setEditC(v=>({...v,tag:e.target.value}))}>
            {['Client','Prospect','VIP'].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button style={S.btn('ghost')} onClick={closeModal}>Annuler</button>
          <button
            style={{...S.btn('primary',saving), opacity:(!editC.name||!editC.phone)?0.4:1, pointerEvents:(!editC.name||!editC.phone||saving)?'none':'auto'}}
            disabled={!editC.name||!editC.phone||saving}
            onClick={handleEditContact}
          >{saving ? <><Spinner/> Sauvegarde…</> : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  )
}

// ── MODAL CONFIRM DELETE ──────────────────────────────────────────
function ModalConfirmDelete({ target, closeModal, handleDeleteContact, deleting }) {
  if (!target) return null
  return (
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&closeModal()}>
      <div style={{...S.modal, width:380}}>
        <div style={S.mT}>🗑️ Supprimer le contact</div>
        <div style={{fontSize:13, color:C.textSub, lineHeight:1.6, marginBottom:20}}>
          Voulez-vous vraiment supprimer <strong style={{color:C.text}}>{target.name}</strong> ({target.phone}) ?
          Cette action est irréversible.
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button style={S.btn('ghost')} onClick={closeModal}>Annuler</button>
          <button
            style={{...S.btn('danger',deleting), pointerEvents:deleting?'none':'auto'}}
            disabled={deleting}
            onClick={handleDeleteContact}
          >{deleting ? <><Spinner/> Suppression…</> : 'Supprimer'}</button>
        </div>
      </div>
    </div>
  )
}

function ModalSendMsg({ contacts, msgTarget, msgText, setMsgText, selectedTpl, setSelectedTpl, connected, sending, closeModal, handleSendMsg }) {
  // ✅ FIX: findIndex par id (robuste après re-fetch)
  const avatarIndex = contacts.findIndex(c => c.id === msgTarget?.id)
  const avatarGrad  = AVAT[avatarIndex >= 0 ? avatarIndex % 5 : 0]

  return (
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&closeModal()}>
      <div style={S.modal}>
        <div style={S.mT}>
          <span style={{width:32,height:32,borderRadius:'50%',background:C.greenDim,border:'1px solid rgba(37,211,102,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <WaIcon size={16} color={C.green}/>
          </span>
          Envoyer via WhatsApp
        </div>
        <div style={{background:'rgba(255,255,255,0.04)',borderRadius:14,padding:'12px 14px',marginBottom:18,display:'flex',alignItems:'center',gap:12,border:`1px solid rgba(255,255,255,0.08)`}}>
          <div style={S.avat(avatarGrad,44)}>{(msgTarget?.name||'?').slice(0,2).toUpperCase()}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>{msgTarget?.name}</div>
            <div style={{fontSize:12,color:C.textMute,marginTop:2}}>{msgTarget?.phone}</div>
          </div>
          <span style={S.badge(...(TAG_C[msgTarget?.tag]||[C.purpleDim,C.purpleL]))}>{msgTarget?.tag||'Contact'}</span>
        </div>
        <div style={S.fg}>
          <label style={S.lbl}>Template rapide</label>
          <select style={S.sel} value={selectedTpl?.id||''} onChange={e=>{const t=TEMPLATES.find(t=>t.id===+e.target.value);setSelectedTpl(t||null);setMsgText(t?.text||'');}}>
            <option value="">— Choisir un template —</option>
            {TEMPLATES.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {selectedTpl && (
            <div style={{marginTop:8,padding:'10px 12px',borderRadius:9,background:'rgba(108,99,255,0.08)',border:`1px solid rgba(108,99,255,0.3)`,fontSize:12,color:C.textSub,lineHeight:1.6}}>
              <span style={{fontSize:10,color:C.purpleL,fontWeight:700,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>Aperçu</span>
              {selectedTpl.text}
            </div>
          )}
        </div>
        <div style={S.fg}>
          <label style={S.lbl}>Message</label>
          <textarea style={S.ta} placeholder="Votre message..." value={msgText} maxLength={MAX_MSG} onChange={e=>setMsgText(e.target.value)}/>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:4}}>
            <span style={{fontSize:11,color:msgText.length>MAX_MSG*0.9?C.orange:C.textMute}}>{msgText.length}/{MAX_MSG}</span>
          </div>
        </div>
        {!connected && (
          <div style={{display:'flex',alignItems:'center',gap:9,padding:'10px 13px',borderRadius:10,background:C.amberDim,border:'1px solid rgba(245,158,11,0.25)',color:C.amber,fontSize:12,marginBottom:16}}>
            <span style={{fontSize:15}}>⚠️</span><span>Webhook non configuré — mode simulation actif.</span>
          </div>
        )}
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button style={S.btn('ghost')} onClick={closeModal}>Annuler</button>
          <button
            style={{...S.btn('green',sending), opacity:(sending||!msgText.trim())?0.5:1, pointerEvents:(sending||!msgText.trim())?'none':'auto'}}
            disabled={sending||!msgText.trim()}
            onClick={handleSendMsg}
          >
            {sending?<><Spinner/> Envoi…</>:<><WaIcon size={13} color={C.green}/> Envoyer</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ModalCampaign ────────────────────────────────────────────────
// ✅ FIX PRINCIPAL : bouton "Lancer" corrigé + disabled réel + selectAll helper
function ModalCampaign({ contacts, newCam, setNewCam, camStep, setCamStep, closeModal, handleLaunchCampaign }) {
  // ✅ FIX: validation étape 1 — on passe à l'étape 2 seulement si nom + message remplis
  const canGoNext = newCam.name.trim() !== '' && newCam.message.trim() !== ''
  // ✅ FIX: validation étape 2 — au moins 1 destinataire
  const canLaunch = newCam.recipients.length > 0

  // ✅ FIX: sélectionner / désélectionner tous
  const allSelected = contacts.length > 0 && newCam.recipients.length === contacts.length
  const toggleAll = () => {
    setNewCam(p => ({
      ...p,
      recipients: allSelected ? [] : contacts.map(c => c.id)
    }))
  }

  return (
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&closeModal()}>
      <div style={S.modal}>
        <div style={S.mT}>📢 Nouvelle campagne — Étape {camStep}/2</div>

        {camStep===1 && <>
          {/* ✅ FIX: CampaignAIGenerator rendu uniquement si importé avec succès */}
          {CampaignAIGenerator && (
            <CampaignAIGenerator
              onApply={(msg) => setNewCam(p => ({ ...p, message: msg }))}
            />
          )}
          <div style={S.fg}>
            <label style={S.lbl}>Nom de la campagne</label>
            <input style={S.inp} placeholder="Ex : Promo été 2026" value={newCam.name} onChange={e=>setNewCam(p=>({...p,name:e.target.value}))}/>
          </div>
          <div style={S.fg}>
            <label style={S.lbl}>Message</label>
            <select style={{...S.sel,marginBottom:8}} onChange={e=>{if(e.target.value)setNewCam(p=>({...p,message:e.target.value}))}}>
              <option value="">— Template manuel —</option>
              {TEMPLATES.map(t=><option key={t.id} value={t.text}>{t.name}</option>)}
            </select>
            <textarea style={S.ta} placeholder="Ou écrivez votre message..." value={newCam.message} onChange={e=>setNewCam(p=>({...p,message:e.target.value}))} maxLength={MAX_MSG}/>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:4}}>
              <span style={{fontSize:11,color:C.textMute}}>{newCam.message.length}/{MAX_MSG}</span>
            </div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button style={S.btn('ghost')} onClick={closeModal}>Annuler</button>
            {/* ✅ FIX: disabled + pointerEvents pour bloquer vraiment le clic */}
            <button
              style={{...S.btn(), opacity:canGoNext?1:0.4, pointerEvents:canGoNext?'auto':'none'}}
              disabled={!canGoNext}
              onClick={()=>setCamStep(2)}
            >Suivant →</button>
          </div>
        </>}

        {camStep===2 && <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{fontSize:12,color:C.textMute}}>Sélectionnez les destinataires :</div>
            {/* ✅ FIX: bouton Tout sélectionner / Tout désélectionner */}
            {contacts.length > 0 && (
              <button style={{...S.btn('sm'),fontSize:11,padding:'4px 10px'}} onClick={toggleAll}>
                {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            )}
          </div>
          <div style={{maxHeight:220,overflow:'auto',display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
            {contacts.length===0 && (
              <div style={{textAlign:'center',color:C.textMute,padding:24,fontSize:13,background:C.bg,borderRadius:9,border:`1px solid ${C.border}`}}>
                Aucun contact disponible. <br/>
                <span style={{fontSize:11,marginTop:4,display:'block'}}>Ajoutez des contacts dans l'onglet Contacts d'abord.</span>
              </div>
            )}
            {contacts.map((c,i) => {
              const checked = newCam.recipients.includes(c.id)
              return (
                <div key={c.id}
                  onClick={()=>setNewCam(p=>({...p,recipients:checked?p.recipients.filter(x=>x!==c.id):[...p.recipients,c.id]}))}
                  style={{display:'flex',alignItems:'center',gap:9,padding:'9px 12px',borderRadius:8,cursor:'pointer',background:checked?C.purpleDim:C.bg,border:`1px solid ${checked?C.purple:C.border}`,transition:'all .15s'}}
                >
                  <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${checked?C.purple:C.textMute}`,background:checked?C.purple:'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {checked&&<span style={{fontSize:9,color:'#fff',fontWeight:900}}>✓</span>}
                  </div>
                  <div style={S.avat(AVAT[i%5])}>{(c.name||'?').slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{c.name}</div>
                    <div style={{fontSize:11,color:C.textMute}}>{c.phone}</div>
                  </div>
                  <span style={S.badge(...(TAG_C[c.tag]||['#1a1a2e',C.textMute]))}>{c.tag}</span>
                </div>
              )
            })}
          </div>

          {/* ✅ FIX: message d'info si 0 contact sélectionné */}
          <div style={{fontSize:12,marginBottom:12,color:canLaunch?C.purpleL:C.textMute,fontWeight:canLaunch?600:400}}>
            {canLaunch
              ? `✓ ${newCam.recipients.length} contact(s) sélectionné(s)`
              : '⚠️ Sélectionnez au moins un contact pour lancer la campagne'
            }
          </div>

          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button style={S.btn('ghost')} onClick={()=>setCamStep(1)}>← Retour</button>
            {/* ✅ FIX CRITIQUE: disabled réel + pointerEvents:'none' quand pas de destinataires */}
            <button
              style={{...S.btn(), opacity:canLaunch?1:0.4, pointerEvents:canLaunch?'auto':'none'}}
              disabled={!canLaunch}
              onClick={handleLaunchCampaign}
            >🚀 Lancer</button>
          </div>
        </>}
      </div>
    </div>
  )
}

function ModalNotif({ newN, setNewN, closeModal, handleAddNotif }) {
  return (
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&closeModal()}>
      <div style={S.modal}>
        <div style={S.mT}>🔔 Nouvelle automatisation</div>
        <div style={S.fg}>
          <label style={S.lbl}>Nom</label>
          <input style={S.inp} placeholder="Ex : Rappel RDV 24h avant" value={newN.name} onChange={e=>setNewN(p=>({...p,name:e.target.value}))}/>
        </div>
        <div style={S.fg}>
          <label style={S.lbl}>Déclencheur</label>
          <select style={S.sel} value={newN.trigger_type} onChange={e=>setNewN(p=>({...p,trigger_type:e.target.value}))}>
            {['Automatique','Délai','Date','Condition'].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{fontSize:12,color:C.textMute,background:C.bg,borderRadius:8,padding:'9px 11px',marginBottom:14,border:`1px solid ${C.border}`}}>
          ℹ️ La logique est définie dans votre scénario Make.com.
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button style={S.btn('ghost')} onClick={closeModal}>Annuler</button>
          <button
            style={{...S.btn(), opacity:!newN.name?0.4:1, pointerEvents:!newN.name?'none':'auto'}}
            disabled={!newN.name}
            onClick={handleAddNotif}
          >Créer</button>
        </div>
      </div>
    </div>
  )
}

// ── MODAL SÉLECTION CONTACT ───────────────────────────────────────
function ModalPickContact({ contacts, onSelect, closeModal }) {
  return (
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&closeModal()}>
      <div style={S.modal}>
        <div style={S.mT}>📨 Choisir un destinataire</div>
        {contacts.length===0
          ? <div style={{textAlign:'center',color:C.textMute,padding:24,fontSize:13}}>Aucun contact disponible.</div>
          : <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:340,overflowY:'auto'}}>
              {contacts.map((c,i) => (
                <div key={c.id} onClick={()=>onSelect(c)}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:9,cursor:'pointer',border:`1px solid ${C.border}`,background:C.bg,transition:'all .15s'}}>
                  <div style={S.avat(AVAT[i%5])}>{(c.name||'?').slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.text}}>{c.name}</div>
                    <div style={{fontSize:11,color:C.textMute}}>{c.phone}</div>
                  </div>
                  <span style={S.badge(...(TAG_C[c.tag]||[C.purpleDim,C.purpleL]))}>{c.tag}</span>
                </div>
              ))}
            </div>
        }
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:14}}>
          <button style={S.btn('ghost')} onClick={closeModal}>Annuler</button>
        </div>
      </div>
    </div>
  )
}

// ── COMPOSANT PRINCIPAL ───────────────────────────────────────────
export default function WhatsAppCRM({ profile }) {
  const {
    contacts, campaigns, notifs, boostNotifs,
    webhook, connected, loading, error, stats,
    addContact, updateContact, deleteContact, sendMessage, createCampaign,
    addNotification, toggleNotification, saveWebhook,
    sendBoostNotification,
  } = useWhatsappCRM()

  const [tab,          setTab]          = useState('dashboard')
  const [toast,        setToast]        = useState(null)
  const [modal,        setModal]        = useState(null)
  const [msgTarget,    setMsgTarget]    = useState(null)
  const [msgText,      setMsgText]      = useState('')
  const [selectedTpl,  setSelectedTpl]  = useState(null)
  const [camStep,      setCamStep]      = useState(1)
  const [webhookInput, setWebhookInput] = useState('')
  const [sending,      setSending]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [newC,   setNewC]   = useState({ name:'', phone:'', email:'', tag:'Client' })
  const [editC,  setEditC]  = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [newCam, setNewCam] = useState({ name:'', message:'', recipients:[] })
  const [newN,   setNewN]   = useState({ name:'', trigger_type:'Automatique' })

  useEffect(() => { setWebhookInput(webhook||'') }, [webhook])

  const flash = (msg, type='success') => {
    setToast({ msg, type }); setTimeout(()=>setToast(null), 3200)
  }

  const closeModal = () => {
    setModal(null)
    setMsgTarget(null)
    setMsgText('')
    setSelectedTpl(null)
    setCamStep(1)
    // ✅ FIX: reset complet du state campagne à la fermeture
    setNewCam({ name:'', message:'', recipients:[] })
    setEditC(null)
    setDeleteTarget(null)
  }

  const handleAddContact = async () => {
    if (!newC.name||!newC.phone) return
    try {
      await addContact(newC)
      flash(`Contact "${newC.name}" ajouté ✓`)
      setModal(null)
      setNewC({name:'',phone:'',email:'',tag:'Client'})
    } catch(e) { flash(e.message,'error') }
  }

  const handleOpenEdit = (c) => {
    setEditC({ id:c.id, name:c.name, phone:c.phone, email:c.email||'', tag:c.tag })
    setModal('edit_contact')
  }

  const handleEditContact = async () => {
    if (!editC?.name||!editC?.phone) return
    setSaving(true)
    try {
      await updateContact(editC.id, { name:editC.name, phone:editC.phone, email:editC.email, tag:editC.tag })
      flash(`Contact "${editC.name}" modifié ✓`)
      closeModal()
    } catch(e) { flash(e.message,'error') }
    finally { setSaving(false) }
  }

  const handleOpenDelete = (c) => {
    setDeleteTarget(c)
    setModal('delete_contact')
  }

  const handleDeleteContact = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteContact(deleteTarget.id)
      flash(`Contact "${deleteTarget.name}" supprimé ✓`)
      closeModal()
    } catch(e) { flash(e.message,'error') }
    finally { setDeleting(false) }
  }

  const handleSendMsg = async () => {
    if (!msgText.trim()) return
    setSending(true)
    try {
      const res = await sendMessage({ to:msgTarget.phone, name:msgTarget.name, message:msgText })
      if (res?.reason==='no_webhook') flash("Configurez d'abord le webhook Make.com",'error')
      else flash(`Message envoyé à ${msgTarget.name} ✓`)
      closeModal()
    } catch(e) { flash(e.message,'error') }
    finally { setSending(false) }
  }

  const handleLaunchCampaign = async () => {
    // ✅ FIX: guard explicite avec feedback utilisateur
    if (!newCam.name.trim()) { flash('Donnez un nom à la campagne','error'); return }
    if (!newCam.message.trim()) { flash('Écrivez un message pour la campagne','error'); return }
    if (newCam.recipients.length===0) { flash('Sélectionnez au moins un destinataire','error'); return }
    try {
      await createCampaign({ name:newCam.name, message:newCam.message, recipientIds:newCam.recipients })
      flash(`Campagne "${newCam.name}" lancée ✓`)
      closeModal()
    } catch(e) { flash(e.message,'error') }
  }

  const handleAddNotif = async () => {
    if (!newN.name) return
    try {
      await addNotification(newN)
      flash(`Automatisation "${newN.name}" créée ✓`)
      setModal(null)
      setNewN({name:'',trigger_type:'Automatique'})
    } catch(e) { flash(e.message,'error') }
  }

  const handleSaveWebhook = async () => {
    if (!webhookInput) return
    try { await saveWebhook(webhookInput); flash('Webhook enregistré ✓') }
    catch(e) { flash(e.message,'error') }
  }

  // ✅ FIX: reset camStep à l'ouverture du modal campagne
  const handleOpenCampaign = () => {
    setNewCam({ name:'', message:'', recipients:[] })
    setCamStep(1)
    setModal('campaign')
  }

  const handleQuickAction = (m) => {
    if (m==='msg') {
      if (contacts.length===0) { flash("Ajoutez d'abord un contact",'error'); return }
      setModal('pick_contact')
      return
    }
    if (m==='campaign') {
      // ✅ FIX: utilise handleOpenCampaign pour reset propre
      handleOpenCampaign()
      return
    }
    setModal(m)
  }

  if (loading) return <div style={S.loading}><Spinner/>&nbsp;Chargement...</div>
  if (error)   return <div style={S.errBox}>Erreur : {error}</div>

  return (
    <div style={S.page}>

      {/* HEADER */}
      <div style={S.header}>
        <div>
          <div style={S.hTitle}>
            <span style={{width:34,height:34,borderRadius:'50%',background:C.greenDim,border:'1px solid rgba(37,211,102,0.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <WaIcon size={17} color={C.green}/>
            </span>
            WhatsApp CRM
            <span style={S.proBadge}>⚡ BUSINESS</span>
          </div>
          <div style={S.hSub}>Gérez vos contacts, campagnes et notifications de boost WhatsApp</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 11px',borderRadius:99,background:connected?C.greenDim:'rgba(255,255,255,0.05)',border:`1px solid ${connected?'rgba(37,211,102,0.25)':C.border}`}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:connected?C.green:C.textMute}}/>
            <span style={{fontSize:12,color:connected?C.green:C.textMute,fontWeight:600}}>{connected?'Make.com connecté':'Non connecté'}</span>
          </div>
          <button style={{...S.btn(),fontSize:12,padding:'6px 13px'}} onClick={()=>setTab('settings')}>⚙ Paramètres</button>
        </div>
      </div>

      {/* TABS */}
      <div style={S.tabs}>
        {[
          ['dashboard',    '🏠 Dashboard'],
          ['contacts',     '👥 Contacts'],
          ['campaigns',    '📢 Campagnes'],
          ['boost_notifs', '🚀 Notifs Boost'],
          ['notifications','🔔 Automatisations'],
          ['settings',     '⚙ Paramètres'],
        ].map(([k,l]) => (
          <button key={k} style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      <div style={S.content}>

        {/* ── DASHBOARD ── */}
        {tab==='dashboard' && <>
          <div style={S.g4}>
            {[
              { lbl:'Contacts',     ico:'👥', val:stats.totalContacts,      glow:C.purple, bg:C.purpleDim },
              { lbl:'Actifs',       ico:'✅', val:stats.activeContacts,     glow:C.green,  bg:C.greenDim  },
              { lbl:'Campagnes',    ico:'📢', val:stats.sentCampaigns,      glow:C.orange, bg:C.orangeDim },
              { lbl:'Notifs Boost', ico:'🚀', val:stats.boostNotifsSent||0, glow:C.blue,   bg:C.blueDim   },
            ].map((s,i) => (
              <div key={i} style={S.statCard}>
                <div style={S.statGlow(s.glow)}/><div style={S.statIco(s.bg)}>{s.ico}</div>
                <div style={S.statVal}>{s.val}</div><div style={S.statLbl}>{s.lbl}</div>
              </div>
            ))}
          </div>
          <div style={S.g2}>
            <div style={S.card}>
              <div style={S.cardT}>👥 Contacts récents</div>
              {contacts.slice(0,5).map((c,i) => (
                <div key={c.id} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 0',borderBottom:i<4?'1px solid rgba(255,255,255,0.04)':'none'}}>
                  <div style={S.avat(AVAT[i%5])}>{c.name.slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{c.name}</div><div style={{fontSize:11,color:C.textMute}}>{c.phone}</div></div>
                  <span style={S.badge(...(TAG_C[c.tag]||['#1a1a2e',C.textMute]))}>{c.tag}</span>
                </div>
              ))}
              {contacts.length===0 && <div style={{fontSize:12,color:C.textMute,textAlign:'center',padding:'16px 0'}}>Aucun contact encore</div>}
            </div>
            <div style={S.card}>
              <div style={S.cardT}>⚡ Actions rapides</div>
              {[
                ['📨 Envoyer un message',  'msg'],
                ['📢 Lancer une campagne', 'campaign'],
                ['➕ Ajouter un contact',  'contact'],
                ['🚀 Tester notif boost',  null],
              ].map(([l,m]) => (
                <button key={l} style={S.quickBtn} onClick={()=>m?handleQuickAction(m):setTab('boost_notifs')}>
                  <span style={{flex:1,textAlign:'left'}}>{l}</span>
                  <span style={{color:C.textMute,fontSize:12}}>→</span>
                </button>
              ))}
            </div>
          </div>
        </>}

        {/* ── CONTACTS ── */}
        {tab==='contacts' && <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:13,color:C.textMute}}>{contacts.length} contacts</div>
            <button style={S.btn()} onClick={()=>setModal('contact')}>➕ Nouveau contact</button>
          </div>
          <div style={S.card}>
            {contacts.length===0
              ? <div style={{textAlign:'center',color:C.textMute,padding:32}}>Aucun contact. Ajoutez-en un !</div>
              : <table style={S.tbl}>
                  <thead><tr>{['Contact','Téléphone','Email','Tag','Statut','Action'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {contacts.map((c,i) => (
                      <tr key={c.id}>
                        <td style={S.td}><div style={{display:'flex',alignItems:'center',gap:9}}><div style={S.avat(AVAT[i%5])}>{(c.name||'?').slice(0,2).toUpperCase()}</div><span style={{fontWeight:600}}>{c.name}</span></div></td>
                        <td style={S.td}>{c.phone}</td>
                        <td style={{...S.td,color:C.textMute}}>{c.email||'—'}</td>
                        <td style={S.td}><span style={S.badge(...(TAG_C[c.tag]||['#1a1a2e',C.textMute]))}>{c.tag}</span></td>
                        <td style={S.td}><span style={S.badge(...(STA_C[c.status]||['#1a1a2e',C.textMute]))}>{c.status}</span></td>
                        <td style={S.td}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <button style={{...S.btn('green'),padding:'5px 12px',fontSize:12,gap:5}} onClick={()=>{setMsgTarget(c);setModal('msg')}}>
                              <WaIcon size={12} color={C.green}/> WA
                            </button>
                            <button style={S.iconBtn(C.purpleL)} title="Modifier" onClick={()=>handleOpenEdit(c)}>✏️</button>
                            <button style={S.iconBtn(C.red)} title="Supprimer" onClick={()=>handleOpenDelete(c)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </>}

        {/* ── CAMPAGNES ── */}
        {tab==='campaigns' && <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:13,color:C.textMute}}>{campaigns.length} campagnes</div>
            {/* ✅ FIX: utilise handleOpenCampaign pour reset propre */}
            <button style={S.btn()} onClick={handleOpenCampaign}>📢 Nouvelle campagne</button>
          </div>
          <div style={S.card}>
            {campaigns.length===0
              ? <div style={{textAlign:'center',color:C.textMute,padding:32}}>Aucune campagne. Créez-en une !</div>
              : <table style={S.tbl}>
                  <thead><tr>{['Campagne','Statut','Envoyés','Lus','Taux lecture','Date'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {campaigns.map(c => (
                      <tr key={c.id}>
                        <td style={S.td}><span style={{fontWeight:600}}>{c.name}</span></td>
                        <td style={S.td}><span style={S.badge(...(CAM_C[c.status]||['#1a1a2e',C.textMute]))}>{c.status}</span></td>
                        <td style={S.td}>{c.sent_count||0}</td>
                        <td style={S.td}>{c.read_count||0}</td>
                        <td style={S.td}>
                          {(c.sent_count||0)>0
                            ? <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{width:50,height:4,background:'rgba(255,255,255,0.08)',borderRadius:99,overflow:'hidden'}}>
                                  <div style={{width:`${Math.round(((c.read_count||0)/c.sent_count)*100)}%`,height:'100%',background:`linear-gradient(90deg,${C.purple},${C.purpleL})`,borderRadius:99}}/>
                                </div>
                                <span style={{fontSize:11,color:C.textMute}}>{Math.round(((c.read_count||0)/c.sent_count)*100)}%</span>
                              </div>
                            : '—'}
                        </td>
                        <td style={{...S.td,color:C.textMute,fontSize:12}}>
                          {c.launched_at?new Date(c.launched_at).toLocaleDateString('fr-FR'):'—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </>}

        {/* ── BOOST NOTIFS ── */}
        {tab==='boost_notifs' && (
          <BoostNotifsTab boostNotifs={boostNotifs} profile={profile} sendBoostNotification={sendBoostNotification} connected={connected} flash={flash}/>
        )}

        {/* ── AUTOMATISATIONS ── */}
        {tab==='notifications' && <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:13,color:C.textMute}}>{stats.activeNotifs} automatisation(s) active(s)</div>
            <button style={S.btn()} onClick={()=>setModal('notif')}>🔔 Nouvelle automatisation</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {notifs.length===0 && <div style={{...S.card,textAlign:'center',color:C.textMute,padding:32}}>Aucune automatisation. Créez-en une !</div>}
            {notifs.map(n => (
              <div key={n.id} style={{...S.card,display:'flex',alignItems:'center',gap:14,borderColor:n.active?C.borderAct:C.border}}>
                <div style={{width:38,height:38,borderRadius:9,background:n.active?C.purpleDim:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                  {n.active?'🔔':'🔕'}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14}}>{n.name}</div>
                  <div style={{fontSize:12,color:C.textMute,marginTop:2}}>Déclencheur : {n.trigger_type}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:12,color:n.active?C.purpleL:C.textMute}}>{n.active?'Actif':'Inactif'}</span>
                  <button onClick={()=>toggleNotification(n.id,n.active)}
                    style={{width:42,height:22,borderRadius:99,border:'none',cursor:'pointer',background:n.active?C.purple:'rgba(255,255,255,0.1)',position:'relative',transition:'all .2s',flexShrink:0}}>
                    <div style={{position:'absolute',top:2,left:n.active?22:2,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'all .2s'}}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ── PARAMÈTRES ── */}
        {tab==='settings' && (
          <div style={{maxWidth:520}}>
            <div style={{...S.card,marginBottom:14}}>
              <div style={S.cardT}>🔗 Connexion Make.com</div>
              <div style={S.fg}>
                <label style={S.lbl}>URL Webhook Make.com</label>
                <input style={S.inp} value={webhookInput} onChange={e=>setWebhookInput(e.target.value)} placeholder="https://hook.eu1.make.com/xxxxx..."/>
                <div style={{fontSize:11,color:C.textMute,marginTop:4}}>Créez un scénario Make : Webhook → WhatsApp Business Cloud → Send Message</div>
              </div>
              <button style={S.btn()} onClick={handleSaveWebhook}>💾 Enregistrer</button>
            </div>
            <div style={S.card}>
              <div style={S.cardT}>📋 Guide Make.com (no-code)</div>
              {[
                "Créer un compte gratuit sur make.com",
                "Nouveau scénario → Webhooks → Custom webhook → copier l'URL",
                'Ajouter module "WhatsApp Business Cloud > Send a Message"',
                "Mapper : to → {{to}}, message → {{message}}",
                "Activer le scénario et coller l'URL ci-dessus",
              ].map((step,i) => (
                <div key={i} style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:C.purpleDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:C.purpleL,flexShrink:0}}>{i+1}</div>
                  <div style={{fontSize:12,color:C.textSub,lineHeight:1.6,paddingTop:2}}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── MODALS ── */}
      {modal==='contact'       && <ModalAddContact newC={newC} setNewC={setNewC} closeModal={closeModal} handleAddContact={handleAddContact}/>}
      {modal==='edit_contact'  && <ModalEditContact editC={editC} setEditC={setEditC} closeModal={closeModal} handleEditContact={handleEditContact} saving={saving}/>}
      {modal==='delete_contact'&& <ModalConfirmDelete target={deleteTarget} closeModal={closeModal} handleDeleteContact={handleDeleteContact} deleting={deleting}/>}
      {modal==='msg'          && msgTarget && <ModalSendMsg contacts={contacts} msgTarget={msgTarget} msgText={msgText} setMsgText={setMsgText} selectedTpl={selectedTpl} setSelectedTpl={setSelectedTpl} connected={connected} sending={sending} closeModal={closeModal} handleSendMsg={handleSendMsg}/>}
      {modal==='campaign'     && <ModalCampaign contacts={contacts} newCam={newCam} setNewCam={setNewCam} camStep={camStep} setCamStep={setCamStep} closeModal={closeModal} handleLaunchCampaign={handleLaunchCampaign}/>}
      {modal==='notif'        && <ModalNotif newN={newN} setNewN={setNewN} closeModal={closeModal} handleAddNotif={handleAddNotif}/>}
      {modal==='pick_contact' && (
        <ModalPickContact
          contacts={contacts}
          onSelect={(c) => { setMsgTarget(c); setModal('msg') }}
          closeModal={closeModal}
        />
      )}

      {/* TOAST */}
      {toast && <div style={S.toast(toast.type)}>{toast.type==='success'?'✓':'✕'} {toast.msg}</div>}
    </div>
  )
}