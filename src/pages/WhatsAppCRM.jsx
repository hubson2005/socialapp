// src/pages/WhatsAppCRM.jsx
// ─────────────────────────────────────────────────────────────────
// Intégrez dans votre router :
//   <Route path="/dashboard/whatsapp-crm" element={<WhatsAppCRM />} />
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useWhatsappCRM } from '../hooks/useWhatsappCRM.js'

// ── TEMPLATES ────────────────────────────────────────────────────
const TEMPLATES = [
  { id:1, name:'Bienvenue',      text:'👋 Bonjour {{prénom}}, bienvenue chez SocialApp ! Comment puis-je vous aider ?' },
  { id:2, name:'Rappel RDV',     text:'⏰ Rappel : votre RDV est demain à {{heure}}. Répondez OUI pour confirmer.' },
  { id:3, name:'Suivi prospect', text:'Bonjour {{prénom}}, avez-vous eu le temps de réfléchir à notre proposition ?' },
  { id:4, name:'Promotion',      text:'🎉 Offre exclusive {{prénom}} : -20% ce week-end ! Code : PROMO20' },
]

// ── DESIGN TOKENS (socialapp.work) ────────────────────────────────
const C = {
  bg:       '#0c0d1a',
  card:     '#141525',
  border:   'rgba(255,255,255,0.07)',
  borderAct:'rgba(108,99,255,0.4)',
  purple:   '#6c63ff',
  purpleL:  '#8b84ff',
  purpleDim:'rgba(108,99,255,0.15)',
  orange:   '#ff9500',
  orangeDim:'rgba(255,149,0,0.15)',
  green:    '#25D366',
  greenDim: 'rgba(37,211,102,0.12)',
  blue:     '#3b82f6',
  blueDim:  'rgba(59,130,246,0.12)',
  text:     '#ffffff',
  textSub:  '#8b8fa8',
  textMute: '#4a4e6a',
}
const TAG_C = {
  Client:   [C.purpleDim, C.purpleL],
  Prospect: [C.blueDim,   C.blue],
  VIP:      [C.orangeDim, C.orange],
}
const STA_C = {
  actif:   [C.greenDim,  C.green],
  attente: [C.orangeDim, C.orange],
  inactif: ['rgba(255,255,255,0.06)', C.textMute],
}
const CAM_C = {
  envoyé:   [C.greenDim,  C.green],
  planifié: [C.blueDim,   C.blue],
  brouillon:['rgba(255,255,255,0.06)', C.textMute],
}
const AVAT = [
  'linear-gradient(135deg,#6c63ff,#a78bfa)',
  'linear-gradient(135deg,#3b82f6,#60a5fa)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
  'linear-gradient(135deg,#25D366,#4ade80)',
]

// ── STYLES ────────────────────────────────────────────────────────
const S = {
  page:     { background:C.bg, minHeight:'100vh', color:C.text, fontFamily:"'Inter','DM Sans',system-ui,sans-serif" },
  header:   { padding:'18px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  hTitle:   { fontSize:22, fontWeight:700, letterSpacing:'-0.5px', color:C.text, display:'flex', alignItems:'center', gap:9 },
  proBadge: { fontSize:10, fontWeight:700, background:C.orangeDim, color:C.orange, padding:'3px 8px', borderRadius:6, letterSpacing:'0.5px', textTransform:'uppercase' },
  hSub:     { fontSize:13, color:C.textMute, marginTop:3 },
  tabs:     { display:'flex', gap:2, padding:'0 24px', borderBottom:`1px solid ${C.border}`, marginBottom:24 },
  tab:  (a) => ({ padding:'10px 14px', fontSize:13, fontWeight:a?600:400, color:a?C.purpleL:C.textSub, border:'none', background:'none', cursor:'pointer', borderBottom:a?`2px solid ${C.purple}`:'2px solid transparent', transition:'all .15s' }),
  content:  { padding:'0 24px 32px' },
  g4:       { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 },
  g2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  card:     { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 18px' },
  cardT:    { fontSize:13, fontWeight:600, color:C.text, marginBottom:14 },
  statCard: { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 18px', position:'relative', overflow:'hidden' },
  statIco:  (bg) => ({ width:36, height:36, borderRadius:9, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, marginBottom:10 }),
  statVal:  { fontSize:28, fontWeight:800, letterSpacing:'-1.5px', color:C.text },
  statLbl:  { fontSize:12, color:C.textMute, marginTop:2 },
  statGlow: (c) => ({ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:c, filter:'blur(30px)', opacity:0.25, pointerEvents:'none' }),
  tbl:      { width:'100%', borderCollapse:'collapse' },
  th:       { textAlign:'left', fontSize:10, color:C.textMute, fontWeight:700, paddingBottom:9, borderBottom:`1px solid ${C.border}`, textTransform:'uppercase', letterSpacing:'0.8px' },
  td:       { padding:'11px 0', borderBottom:`1px solid rgba(255,255,255,0.04)`, fontSize:13, color:'#c8cae0', verticalAlign:'middle' },
  badge:    (bg,c) => ({ display:'inline-flex', padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:700, background:bg, color:c, letterSpacing:'0.3px', textTransform:'uppercase' }),
  avat:     (g)   => ({ width:30, height:30, borderRadius:'50%', background:g, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }),
  btn:      (v='primary') => ({
    display:'inline-flex', alignItems:'center', gap:6,
    padding: v==='sm'?'5px 12px':'9px 16px',
    borderRadius:9, border:`1px solid ${v==='ghost'?C.border:v==='primary'?C.purple:'transparent'}`,
    cursor:'pointer', fontSize:13, fontWeight:600, transition:'all .15s',
    background: v==='primary'?C.purpleDim:v==='ghost'?'transparent':C.purpleDim,
    color:       v==='primary'?C.purpleL:v==='ghost'?C.textSub:C.purpleL,
  }),
  overlay:  { position:'fixed', inset:0, background:'rgba(5,5,15,0.85)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:    { background:'#181930', border:`1px solid ${C.border}`, borderRadius:16, padding:'26px 28px', width:440, maxWidth:'94vw' },
  mT:       { fontSize:16, fontWeight:700, color:C.text, marginBottom:18 },
  lbl:      { fontSize:11, color:C.textMute, marginBottom:5, display:'block', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' },
  inp:      { width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:13, outline:'none', boxSizing:'border-box' },
  ta:       { width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:13, outline:'none', resize:'vertical', minHeight:82, boxSizing:'border-box', fontFamily:'inherit' },
  sel:      { width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:13, outline:'none', boxSizing:'border-box' },
  fg:       { marginBottom:14 },
  quickBtn: { display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:9, border:`1px solid ${C.border}`, background:'transparent', cursor:'pointer', width:'100%', color:C.textSub, fontSize:13, fontWeight:500, transition:'all .15s', marginBottom:8 },
  toast:    (t) => ({ position:'fixed', bottom:22, right:22, background:t==='success'?'#0d3b26':'#3b1a1a', border:`1px solid ${t==='success'?C.green:'#ef4444'}`, borderRadius:9, padding:'11px 16px', color:t==='success'?C.green:'#ef4444', fontSize:13, fontWeight:600, zIndex:2000 }),
  loading:  { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontSize:14, color:C.purple },
  errBox:   { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:9, padding:'12px 16px', color:'#ef4444', fontSize:13, margin:'24px' },
}

// ── ICON WA ───────────────────────────────────────────────────────
const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14}}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

// ── COMPOSANT PRINCIPAL ───────────────────────────────────────────
export default function WhatsAppCRM() {

  // ── Hook Supabase (toutes les données + actions) ──────────────
  const {
    contacts, campaigns, notifs,
    webhook, connected, loading, error, stats,
    addContact, sendMessage,
    createCampaign,
    addNotification, toggleNotification,
    saveWebhook,
  } = useWhatsappCRM()

  // ── UI state (local seulement) ────────────────────────────────
  const [tab,       setTab]       = useState('dashboard')
  const [toast,     setToast]     = useState(null)
  const [modal,     setModal]     = useState(null)
  const [msgTarget, setMsgTarget] = useState(null)
  const [msgText,   setMsgText]   = useState('')
  const [camStep,   setCamStep]   = useState(1)
  const [webhookInput, setWebhookInput] = useState(webhook)

  // Formulaires
  const [newC,   setNewC]   = useState({ name:'', phone:'', email:'', tag:'Client' })
  const [newCam, setNewCam] = useState({ name:'', message:'', recipients:[] })
  const [newN,   setNewN]   = useState({ name:'', trigger_type:'Automatique' })

  // ── Helpers ───────────────────────────────────────────────────
  const flash = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }
  const closeModal = () => {
    setModal(null); setMsgTarget(null); setMsgText('')
    setCamStep(1);  setNewCam({ name:'', message:'', recipients:[] })
  }

  // ── Handlers qui appellent le hook ───────────────────────────
  const handleAddContact = async () => {
    if (!newC.name || !newC.phone) return
    try {
      await addContact(newC)
      flash(`Contact "${newC.name}" ajouté ✓`)
      setModal(null)
      setNewC({ name:'', phone:'', email:'', tag:'Client' })
    } catch (e) { flash(e.message, 'error') }
  }

  const handleSendMsg = async () => {
    if (!msgText.trim()) return
    const res = await sendMessage({ to: msgTarget.phone, name: msgTarget.name, message: msgText })
    if (res.reason === 'no_webhook') flash('Configurez d\'abord le webhook Make.com', 'error')
    else flash(`Message envoyé à ${msgTarget.name} ✓`)
    closeModal()
  }

  const handleLaunchCampaign = async () => {
    if (!newCam.name || !newCam.message || newCam.recipients.length === 0) return
    try {
      await createCampaign({ name: newCam.name, message: newCam.message, recipientIds: newCam.recipients })
      flash(`Campagne "${newCam.name}" lancée ✓`)
      closeModal()
    } catch (e) { flash(e.message, 'error') }
  }

  const handleAddNotif = async () => {
    if (!newN.name) return
    try {
      await addNotification(newN)
      flash(`Automatisation "${newN.name}" créée ✓`)
      setModal(null)
      setNewN({ name:'', trigger_type:'Automatique' })
    } catch (e) { flash(e.message, 'error') }
  }

  const handleSaveWebhook = async () => {
    if (!webhookInput) return
    try {
      await saveWebhook(webhookInput)
      flash('Webhook enregistré ✓')
    } catch (e) { flash(e.message, 'error') }
  }

  // ── États loading / erreur ────────────────────────────────────
  if (loading) return <div style={S.loading}>Chargement des données...</div>
  if (error)   return <div style={S.errBox}>Erreur : {error}</div>

  // ── MODALS ────────────────────────────────────────────────────
  const ModalAddContact = () => (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
      <div style={S.modal}>
        <div style={S.mT}>➕ Nouveau contact</div>
        {[['Nom complet *','name','Sophie Martin'],['Téléphone *','phone','+225 07 00 00 00'],['Email','email','contact@mail.ci']].map(([l,k,p]) => (
          <div key={k} style={S.fg}>
            <label style={S.lbl}>{l}</label>
            <input style={S.inp} placeholder={p} value={newC[k]} onChange={e => setNewC(v => ({...v,[k]:e.target.value}))}/>
          </div>
        ))}
        <div style={S.fg}>
          <label style={S.lbl}>Tag</label>
          <select style={S.sel} value={newC.tag} onChange={e => setNewC(v => ({...v, tag:e.target.value}))}>
            {['Client','Prospect','VIP'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button style={S.btn('ghost')} onClick={closeModal}>Annuler</button>
          <button style={S.btn()} onClick={handleAddContact}>Ajouter</button>
        </div>
      </div>
    </div>
  )

  const ModalSendMsg = () => (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
      <div style={S.modal}>
        <div style={S.mT}>📨 Envoyer via WhatsApp</div>
        <div style={{background:C.bg, borderRadius:9, padding:'10px 12px', marginBottom:16, display:'flex', alignItems:'center', gap:10, border:`1px solid ${C.border}`}}>
          <div style={S.avat(AVAT[0])}>{(msgTarget?.name||'?').slice(0,2).toUpperCase()}</div>
          <div>
            <div style={{fontSize:13, fontWeight:600}}>{msgTarget?.name}</div>
            <div style={{fontSize:11, color:C.textMute}}>{msgTarget?.phone}</div>
          </div>
        </div>
        <div style={S.fg}>
          <label style={S.lbl}>Template rapide</label>
          <select style={S.sel} onChange={e => setMsgText(e.target.value)}>
            <option value="">— Choisir un template —</option>
            {TEMPLATES.map(t => <option key={t.id} value={t.text}>{t.name}</option>)}
          </select>
        </div>
        <div style={S.fg}>
          <label style={S.lbl}>Message</label>
          <textarea style={S.ta} placeholder="Votre message..." value={msgText} onChange={e => setMsgText(e.target.value)}/>
        </div>
        {!connected && (
          <div style={{fontSize:11, color:C.orange, background:C.orangeDim, borderRadius:7, padding:'8px 11px', marginBottom:12}}>
            ⚠️ Webhook non configuré — simulation active.
          </div>
        )}
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button style={S.btn('ghost')} onClick={closeModal}>Annuler</button>
          <button style={S.btn()} onClick={handleSendMsg}>Envoyer ✓</button>
        </div>
      </div>
    </div>
  )

  const ModalCampaign = () => (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
      <div style={S.modal}>
        <div style={S.mT}>📢 Nouvelle campagne — Étape {camStep}/2</div>
        {camStep === 1 && <>
          <div style={S.fg}>
            <label style={S.lbl}>Nom</label>
            <input style={S.inp} placeholder="Ex : Promo été 2026" value={newCam.name} onChange={e => setNewCam(p => ({...p, name:e.target.value}))}/>
          </div>
          <div style={S.fg}>
            <label style={S.lbl}>Message</label>
            <select style={{...S.sel, marginBottom:8}} onChange={e => setNewCam(p => ({...p, message:e.target.value}))}>
              <option value="">— Template —</option>
              {TEMPLATES.map(t => <option key={t.id} value={t.text}>{t.name}</option>)}
            </select>
            <textarea style={S.ta} placeholder="Ou écrivez votre message..." value={newCam.message} onChange={e => setNewCam(p => ({...p, message:e.target.value}))}/>
          </div>
          <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <button style={S.btn('ghost')} onClick={closeModal}>Annuler</button>
            <button style={{...S.btn(), opacity:(!newCam.name||!newCam.message)?0.4:1}} onClick={() => setCamStep(2)}>Suivant →</button>
          </div>
        </>}
        {camStep === 2 && <>
          <div style={{fontSize:12, color:C.textMute, marginBottom:10}}>Sélectionnez les destinataires :</div>
          <div style={{maxHeight:210, overflow:'auto', display:'flex', flexDirection:'column', gap:6, marginBottom:12}}>
            {contacts.map((c,i) => {
              const checked = newCam.recipients.includes(c.id)
              return (
                <div key={c.id}
                  onClick={() => setNewCam(p => ({...p, recipients: checked ? p.recipients.filter(x=>x!==c.id) : [...p.recipients, c.id]}))}
                  style={{display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:8, cursor:'pointer', background:checked?C.purpleDim:C.bg, border:`1px solid ${checked?C.purple:C.border}`, transition:'all .15s'}}>
                  <div style={{width:16, height:16, borderRadius:4, border:`2px solid ${checked?C.purple:C.textMute}`, background:checked?C.purple:'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center'}}>
                    {checked && <span style={{fontSize:9, color:'#fff', fontWeight:900}}>✓</span>}
                  </div>
                  <div style={S.avat(AVAT[i%5])}>{(c.name||'?').slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13, fontWeight:600}}>{c.name}</div>
                    <div style={{fontSize:11, color:C.textMute}}>{c.phone}</div>
                  </div>
                  <span style={S.badge(...(TAG_C[c.tag]||['#1a1a2e',C.textMute]))}>{c.tag}</span>
                </div>
              )
            })}
          </div>
          <div style={{fontSize:12, color:C.textMute, marginBottom:12}}>{newCam.recipients.length} contact(s) sélectionné(s)</div>
          <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <button style={S.btn('ghost')} onClick={() => setCamStep(1)}>← Retour</button>
            <button style={{...S.btn(), opacity:newCam.recipients.length===0?0.4:1}} onClick={handleLaunchCampaign}>🚀 Lancer</button>
          </div>
        </>}
      </div>
    </div>
  )

  const ModalNotif = () => (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
      <div style={S.modal}>
        <div style={S.mT}>🔔 Nouvelle automatisation</div>
        <div style={S.fg}>
          <label style={S.lbl}>Nom</label>
          <input style={S.inp} placeholder="Ex : Rappel RDV 24h avant" value={newN.name} onChange={e => setNewN(p => ({...p, name:e.target.value}))}/>
        </div>
        <div style={S.fg}>
          <label style={S.lbl}>Déclencheur</label>
          <select style={S.sel} value={newN.trigger_type} onChange={e => setNewN(p => ({...p, trigger_type:e.target.value}))}>
            {['Automatique','Délai','Date','Condition'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{fontSize:12, color:C.textMute, background:C.bg, borderRadius:8, padding:'9px 11px', marginBottom:14, border:`1px solid ${C.border}`}}>
          ℹ️ La logique est définie dans votre scénario Make.com.
        </div>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button style={S.btn('ghost')} onClick={closeModal}>Annuler</button>
          <button style={S.btn()} onClick={handleAddNotif}>Créer</button>
        </div>
      </div>
    </div>
  )

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* HEADER */}
      <div style={S.header}>
        <div>
          <div style={S.hTitle}>
            <span style={{color:C.green}}><WaIcon /></span>
            WhatsApp CRM
            <span style={S.proBadge}>⚡ PRO</span>
          </div>
          <div style={S.hSub}>Gérez vos contacts, campagnes et automatisations WhatsApp</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div style={{width:8, height:8, borderRadius:'50%', background:connected?C.green:C.textMute}}/>
          <span style={{fontSize:12, color:connected?C.green:C.textMute}}>
            {connected ? 'Make.com connecté' : 'Non connecté'}
          </span>
          <button style={{...S.btn(), fontSize:12, padding:'6px 13px'}} onClick={() => setTab('settings')}>⚙ Paramètres</button>
        </div>
      </div>

      {/* TABS */}
      <div style={S.tabs}>
        {[
          ['dashboard',     '🏠 Tableau de bord'],
          ['contacts',      '👥 Contacts'],
          ['campaigns',     '📢 Campagnes'],
          ['notifications', '🔔 Notifications'],
          ['settings',      '⚙ Paramètres'],
        ].map(([k,l]) => (
          <button key={k} style={S.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div style={S.content}>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && <>
          <div style={S.g4}>
            {[
              { lbl:'Contacts',   ico:'👥', val:stats.totalContacts,  glow:C.purple, bg:C.purpleDim },
              { lbl:'Actifs',     ico:'✅', val:stats.activeContacts, glow:C.green,  bg:C.greenDim  },
              { lbl:'Campagnes',  ico:'📢', val:stats.sentCampaigns,  glow:C.orange, bg:C.orangeDim },
              { lbl:'Messages',   ico:'✉️', val:stats.totalMessages,  glow:C.blue,   bg:C.blueDim   },
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
              <div style={S.cardT}>👥 Contacts récents</div>
              {contacts.slice(0,5).map((c,i) => (
                <div key={c.id} style={{display:'flex', alignItems:'center', gap:9, padding:'8px 0', borderBottom:i<4?`1px solid rgba(255,255,255,0.04)`:'none'}}>
                  <div style={S.avat(AVAT[i%5])}>{c.name.slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13, fontWeight:600}}>{c.name}</div>
                    <div style={{fontSize:11, color:C.textMute}}>{c.phone}</div>
                  </div>
                  <span style={S.badge(...(TAG_C[c.tag]||['#1a1a2e',C.textMute]))}>{c.tag}</span>
                </div>
              ))}
              {contacts.length === 0 && <div style={{fontSize:12, color:C.textMute, textAlign:'center', padding:'16px 0'}}>Aucun contact encore</div>}
            </div>
            <div style={S.card}>
              <div style={S.cardT}>⚡ Actions rapides</div>
              {[
                ['📨 Envoyer un message', 'msg'],
                ['📢 Lancer une campagne','campaign'],
                ['➕ Ajouter un contact', 'contact'],
                ['🔔 Nouvelle automatisation','notif'],
              ].map(([l,m]) => (
                <button key={m} style={S.quickBtn} onClick={() => { if(m==='msg') setMsgTarget(contacts[0]); setModal(m) }}>
                  <span style={{flex:1, textAlign:'left'}}>{l}</span>
                  <span style={{color:C.textMute, fontSize:12}}>→</span>
                </button>
              ))}
            </div>
          </div>
        </>}

        {/* ── CONTACTS ── */}
        {tab === 'contacts' && <>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
            <div style={{fontSize:13, color:C.textMute}}>{contacts.length} contacts enregistrés</div>
            <button style={S.btn()} onClick={() => setModal('contact')}>➕ Nouveau contact</button>
          </div>
          <div style={S.card}>
            {contacts.length === 0
              ? <div style={{textAlign:'center', color:C.textMute, padding:32}}>Aucun contact. Ajoutez-en un !</div>
              : <table style={S.tbl}>
                  <thead><tr>{['Contact','Téléphone','Email','Tag','Statut','Action'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {contacts.map((c,i) => (
                      <tr key={c.id}>
                        <td style={S.td}>
                          <div style={{display:'flex', alignItems:'center', gap:9}}>
                            <div style={S.avat(AVAT[i%5])}>{(c.name||'?').slice(0,2).toUpperCase()}</div>
                            <span style={{fontWeight:600}}>{c.name}</span>
                          </div>
                        </td>
                        <td style={S.td}>{c.phone}</td>
                        <td style={{...S.td, color:C.textMute}}>{c.email||'—'}</td>
                        <td style={S.td}><span style={S.badge(...(TAG_C[c.tag]||['#1a1a2e',C.textMute]))}>{c.tag}</span></td>
                        <td style={S.td}><span style={S.badge(...(STA_C[c.status]||['#1a1a2e',C.textMute]))}>{c.status}</span></td>
                        <td style={S.td}>
                          <button style={{...S.btn('sm'), color:C.green, borderColor:C.greenDim, background:C.greenDim, gap:5}}
                            onClick={() => { setMsgTarget(c); setModal('msg') }}>
                            <WaIcon/> WA
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </>}

        {/* ── CAMPAGNES ── */}
        {tab === 'campaigns' && <>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
            <div style={{fontSize:13, color:C.textMute}}>{campaigns.length} campagnes</div>
            <button style={S.btn()} onClick={() => { setModal('campaign'); setCamStep(1) }}>📢 Nouvelle campagne</button>
          </div>
          <div style={S.card}>
            {campaigns.length === 0
              ? <div style={{textAlign:'center', color:C.textMute, padding:32}}>Aucune campagne. Créez-en une !</div>
              : <table style={S.tbl}>
                  <thead><tr>{['Campagne','Statut','Envoyés','Lus','Taux lecture','Date'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {campaigns.map(c => (
                      <tr key={c.id}>
                        <td style={S.td}><span style={{fontWeight:600}}>{c.name}</span></td>
                        <td style={S.td}><span style={S.badge(...(CAM_C[c.status]||['#1a1a2e',C.textMute]))}>{c.status}</span></td>
                        <td style={S.td}>{c.sent_count||0}</td>
                        <td style={S.td}>{c.read_count||0}</td>
                        <td style={S.td}>
                          {(c.sent_count||0) > 0
                            ? <div style={{display:'flex', alignItems:'center', gap:8}}>
                                <div style={{width:50, height:4, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden'}}>
                                  <div style={{width:`${Math.round(((c.read_count||0)/c.sent_count)*100)}%`, height:'100%', background:`linear-gradient(90deg,${C.purple},${C.purpleL})`, borderRadius:99}}/>
                                </div>
                                <span style={{fontSize:11, color:C.textMute}}>{Math.round(((c.read_count||0)/c.sent_count)*100)}%</span>
                              </div>
                            : '—'}
                        </td>
                        <td style={{...S.td, color:C.textMute, fontSize:12}}>
                          {c.launched_at ? new Date(c.launched_at).toLocaleDateString('fr-FR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </>}

        {/* ── NOTIFICATIONS ── */}
        {tab === 'notifications' && <>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
            <div style={{fontSize:13, color:C.textMute}}>{stats.activeNotifs} automatisation(s) active(s)</div>
            <button style={S.btn()} onClick={() => setModal('notif')}>🔔 Nouvelle automatisation</button>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {notifs.length === 0 && (
              <div style={{...S.card, textAlign:'center', color:C.textMute, padding:32}}>Aucune automatisation. Créez-en une !</div>
            )}
            {notifs.map(n => (
              <div key={n.id} style={{...S.card, display:'flex', alignItems:'center', gap:14, borderColor:n.active?C.borderAct:C.border}}>
                <div style={{width:38, height:38, borderRadius:9, background:n.active?C.purpleDim:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0}}>
                  {n.active ? '🔔' : '🔕'}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600, fontSize:14}}>{n.name}</div>
                  <div style={{fontSize:12, color:C.textMute, marginTop:2}}>Déclencheur : {n.trigger_type}</div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span style={{fontSize:12, color:n.active?C.purpleL:C.textMute}}>{n.active?'Actif':'Inactif'}</span>
                  <button onClick={() => toggleNotification(n.id, n.active)} style={{
                    width:42, height:22, borderRadius:99, border:'none', cursor:'pointer',
                    background:n.active?C.purple:'rgba(255,255,255,0.1)', position:'relative', transition:'all .2s', flexShrink:0,
                  }}>
                    <div style={{position:'absolute', top:2, left:n.active?22:2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'all .2s'}}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{...S.card, marginTop:16, borderColor:C.borderAct, background:'rgba(108,99,255,0.06)'}}>
            <div style={{fontSize:12, fontWeight:600, color:C.purpleL, marginBottom:6}}>💡 Comment ça marche ?</div>
            <div style={{fontSize:12, color:C.textMute, lineHeight:1.7}}>
              Chaque automatisation est déclenchée par votre scénario Make.com.{' '}
              <button onClick={() => setTab('settings')} style={{background:'none', border:'none', color:C.purpleL, cursor:'pointer', fontSize:12, textDecoration:'underline'}}>
                Configurer le webhook →
              </button>
            </div>
          </div>
        </>}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && <div style={{maxWidth:520}}>
          <div style={{...S.card, marginBottom:14}}>
            <div style={S.cardT}>🔗 Connexion Make.com</div>
            <div style={S.fg}>
              <label style={S.lbl}>URL Webhook Make.com</label>
              <input
                style={S.inp}
                value={webhookInput}
                onChange={e => setWebhookInput(e.target.value)}
                placeholder="https://hook.eu1.make.com/xxxxx..."
              />
              <div style={{fontSize:11, color:C.textMute, marginTop:4}}>
                Créez un scénario Make : Webhook → WhatsApp Business Cloud → Send Message
              </div>
            </div>
            <button style={S.btn()} onClick={handleSaveWebhook}>💾 Enregistrer</button>
          </div>
          <div style={S.card}>
            <div style={S.cardT}>📋 Guide Make.com (no-code)</div>
            {[
              'Créer un compte gratuit sur make.com',
              'Nouveau scénario → Webhooks → Custom webhook → copier l\'URL',
              'Ajouter module "WhatsApp Business Cloud > Send a Message"',
              'Mapper : to → {{to}}, message → {{message}}',
              'Activer le scénario et coller l\'URL ci-dessus',
            ].map((s,i) => (
              <div key={i} style={{display:'flex', gap:10, marginBottom:10, alignItems:'flex-start'}}>
                <div style={{width:22, height:22, borderRadius:'50%', background:C.purpleDim, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:C.purpleL, flexShrink:0}}>{i+1}</div>
                <div style={{fontSize:12, color:C.textSub, lineHeight:1.6, paddingTop:2}}>{s}</div>
              </div>
            ))}
          </div>
        </div>}

      </div>

      {/* MODALS */}
      {modal === 'contact'  && <ModalAddContact/>}
      {modal === 'msg'      && msgTarget && <ModalSendMsg/>}
      {modal === 'campaign' && <ModalCampaign/>}
      {modal === 'notif'    && <ModalNotif/>}

      {/* TOAST */}
      {toast && (
        <div style={S.toast(toast.type)}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  )
}