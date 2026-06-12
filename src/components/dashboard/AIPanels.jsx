// src/components/dashboard/AIPanels.jsx
// ─────────────────────────────────────────────────────────────────
// Exporte 3 composants IA :
//   import { BioAIGenerator, CampaignAIGenerator, PlatformAISuggestions } from "@/components/dashboard/AIPanels"
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import {
  Loader2, Sparkles, Copy, Check, RefreshCw, X,
  Plus, CheckCircle, TrendingUp,
} from 'lucide-react'

// ─── Design tokens partagés ───────────────────────────────────────
const C = {
  bg:         '#0c0d1a',
  card:       '#141525',
  border:     'rgba(255,255,255,0.07)',
  purple:     '#6c63ff',
  purpleL:    '#8b84ff',
  purpleDim:  'rgba(108,99,255,0.15)',
  green:      '#25D366',
  greenDim:   'rgba(37,211,102,0.12)',
  orange:     '#ff9500',
  orangeDim:  'rgba(255,149,0,0.12)',
  text:       '#ffffff',
  sub:        '#8b8fa8',
  mute:       '#4a4e6a',
}

// ─── Styles partagés ──────────────────────────────────────────────
const btn = (v = 'primary') => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: v === 'sm' ? '5px 12px' : '9px 16px',
  borderRadius: 9,
  border: `1px solid ${v === 'green' ? C.green : v === 'ghost' ? C.border : C.purple}`,
  cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .15s',
  background: v === 'green' ? C.greenDim : v === 'primary' ? C.purpleDim : 'transparent',
  color: v === 'green' ? C.green : v === 'primary' ? C.purpleL : C.sub,
  fontFamily: 'inherit',
})
const inp = {
  width: '100%', background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '9px 12px', color: C.text, fontSize: 13,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}
const sel = { ...inp }
const lbl = {
  fontSize: 11, color: C.sub, display: 'block', marginBottom: 5,
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
}
const resultCard = {
  background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
  borderRadius: 10, padding: '12px 14px', marginBottom: 8,
  display: 'flex', alignItems: 'flex-start', gap: 10,
}
const panelWrap = (accent) => ({
  background: C.card,
  border: `1px solid ${accent}`,
  borderRadius: 14, padding: '18px', marginBottom: 14,
})
const panelHeader = (icon, title, onClose, iconColor) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon}
      <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{title}</span>
    </div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.sub, display: 'flex', padding: 0 }}>
      <X size={15} />
    </button>
  </div>
)

const spinStyle = { animation: 'spin .7s linear infinite' }
const spinCSS   = `@keyframes spin{to{transform:rotate(360deg)}}`

const SECTORS = [
  'Mode & Beauté', 'Restaurant & Food', 'Coaching & Formation', 'Immobilier',
  'Tech & Digital', 'Musique & Art', 'Commerce général', 'Événementiel',
  'Santé & Bien-être', 'Politique & Influence', 'Sport & Fitness', 'Autre',
]

// ─── Helper : appel Claude via Edge Function ──────────────────────
async function askClaude(prompt, max_tokens = 700) {
  const { data, error } = await supabase.functions.invoke('claude-proxy', {
    body: { prompt, max_tokens },
  })
  if (error) throw new Error(error.message)
  const text  = data?.content?.[0]?.text || ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ═══════════════════════════════════════════════════════════════════
// 1. BioAIGenerator
// ═══════════════════════════════════════════════════════════════════
// Usage :
//   <BioAIGenerator profile={localProfile} onApply={(bio) => updateLocal({ bio })} />

const TONES_BIO = [
  { id: 'pro',     label: '💼 Professionnel' },
  { id: 'creatif', label: '🎨 Créatif'       },
  { id: 'humour',  label: '😄 Avec humour'   },
  { id: 'luxe',    label: '✨ Premium / Luxe' },
  { id: 'local',   label: '🌍 Ancré local'   },
]

export function BioAIGenerator({ profile, onApply }) {
  const [open,    setOpen]    = useState(false)
  const [sector,  setSector]  = useState('')
  const [tone,    setTone]    = useState('pro')
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState(null)

  const generate = async () => {
    if (!sector) { toast.error('Choisissez un secteur'); return }
    setLoading(true); setResults(null)
    try {
      const parsed = await askClaude(`
Tu es un expert en personal branding pour des entrepreneurs en Côte d'Ivoire.
Génère pour "${profile?.display_name || 'entrepreneur'}" dans le secteur "${sector}" avec un ton "${tone}"${keyword ? ` et les mots-clés : ${keyword}` : ''}.
Réponds UNIQUEMENT en JSON valide :
{
  "bios": ["Bio 1 (max 120 car)","Bio 2 (max 120 car)","Bio 3 (max 120 car)"],
  "slogans": ["Slogan 1","Slogan 2"],
  "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5 #tag6"
}`, 600)
      setResults(parsed)
    } catch (e) { toast.error('Erreur IA : ' + e.message) }
    finally      { setLoading(false) }
  }

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 1800)
    toast.success('Copié !')
  }

  const apply = (bio) => { onApply?.(bio); toast.success('Bio appliquée !'); setOpen(false) }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={btn()}>
      <Sparkles size={13} /> Générer avec IA
    </button>
  )

  return (
    <div style={panelWrap('rgba(108,99,255,0.3)')}>
      {panelHeader(<Sparkles size={15} color={C.purpleL} />, 'Générateur de bio IA', () => setOpen(false))}

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Secteur d'activité *</label>
        <select style={sel} value={sector} onChange={e => setSector(e.target.value)}>
          <option value="">— Choisir —</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Ton souhaité</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TONES_BIO.map(t => (
            <button key={t.id} onClick={() => setTone(t.id)}
              style={{ ...btn('ghost'), padding: '5px 11px', fontSize: 12,
                background: tone === t.id ? C.purpleDim : 'transparent',
                borderColor: tone === t.id ? C.purple : C.border,
                color: tone === t.id ? C.purpleL : C.sub,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Mots-clés (optionnel)</label>
        <input style={inp} placeholder="Ex: livraison rapide, qualité, Abidjan..."
          value={keyword} onChange={e => setKeyword(e.target.value)} />
      </div>

      <button onClick={generate} disabled={loading || !sector}
        style={{ ...btn(), width: '100%', justifyContent: 'center', opacity: loading || !sector ? 0.5 : 1, marginBottom: results ? 14 : 0 }}>
        {loading
          ? <><Loader2 size={13} style={spinStyle} /> Génération…</>
          : <><Sparkles size={13} /> Générer la bio</>}
      </button>

      {results && <>
        <p style={{ ...lbl, margin: '0 0 8px' }}>Bios suggérées</p>
        {results.bios?.map((bio, i) => (
          <div key={i} style={resultCard}>
            <p style={{ flex: 1, color: C.text, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{bio}</p>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => copy(bio, 'bio' + i)} style={{ ...btn('ghost'), padding: '4px 9px', fontSize: 11 }}>
                {copied === 'bio' + i ? <Check size={11} /> : <Copy size={11} />}
              </button>
              <button onClick={() => apply(bio)} style={{ ...btn('sm'), padding: '4px 9px', fontSize: 11 }}>
                Appliquer
              </button>
            </div>
          </div>
        ))}

        {results.slogans?.length > 0 && <>
          <p style={{ ...lbl, margin: '12px 0 8px' }}>Slogans</p>
          {results.slogans.map((s, i) => (
            <div key={i} style={resultCard}>
              <p style={{ flex: 1, color: C.text, fontSize: 13, margin: 0, fontStyle: 'italic' }}>{s}</p>
              <button onClick={() => copy(s, 'slo' + i)} style={{ ...btn('ghost'), padding: '4px 9px', fontSize: 11 }}>
                {copied === 'slo' + i ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </div>
          ))}
        </>}

        {results.hashtags && <>
          <p style={{ ...lbl, margin: '12px 0 8px' }}>Hashtags</p>
          <div style={{ ...resultCard, alignItems: 'center' }}>
            <p style={{ flex: 1, color: C.purple, fontSize: 12, margin: 0, lineHeight: 1.7 }}>{results.hashtags}</p>
            <button onClick={() => copy(results.hashtags, 'hash')} style={{ ...btn('ghost'), padding: '4px 9px', fontSize: 11 }}>
              {copied === 'hash' ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>
        </>}

        <button onClick={generate} style={{ ...btn('ghost'), width: '100%', justifyContent: 'center', marginTop: 10, fontSize: 12 }}>
          <RefreshCw size={12} /> Régénérer
        </button>
      </>}

      <style>{spinCSS}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 2. CampaignAIGenerator
// ═══════════════════════════════════════════════════════════════════
// Usage :
//   <CampaignAIGenerator onApply={(msg) => setNewCam(p => ({ ...p, message: msg }))} />

const TYPES_CAM = [
  { id: 'promo',     label: '🎉 Promotion',      desc: 'Offre, réduction, soldes'     },
  { id: 'relance',   label: '🔄 Relance client',  desc: 'Prospects ou anciens clients'  },
  { id: 'evenement', label: '📅 Événement',        desc: 'Lancement, soirée, ouverture' },
  { id: 'nouveaute', label: '🆕 Nouveau produit',  desc: "Annonce d'arrivée"            },
  { id: 'rdv',       label: '📞 Prise de RDV',     desc: 'Consultation, devis'          },
]
const TONES_CAM = ['Professionnel', 'Chaleureux', 'Urgent', 'Exclusif', 'Simple et direct']

export function CampaignAIGenerator({ onApply }) {
  const [open,    setOpen]    = useState(false)
  const [type,    setType]    = useState('promo')
  const [tone,    setTone]    = useState('Chaleureux')
  const [product, setProduct] = useState('')
  const [promo,   setPromo]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState(null)
  const [selected,setSelected]= useState(null)

  const generate = async () => {
    if (!product) { toast.error('Décrivez votre produit/service'); return }
    setLoading(true); setResults([]); setSelected(null)
    try {
      const selectedType = TYPES_CAM.find(t => t.id === type)
      const parsed = await askClaude(`
Tu es un expert en marketing WhatsApp pour des entrepreneurs en Côte d'Ivoire.
Crée 4 messages WhatsApp pour une campagne "${selectedType?.label}" avec un ton "${tone}" pour :
- Produit/Service : ${product}
${promo ? `- Offre spéciale : ${promo}` : ''}
Contraintes : max 280 caractères, emojis adaptés, appel à l'action fort, ton naturel.
Réponds UNIQUEMENT en JSON valide :
{"messages":["Message 1...","Message 2...","Message 3...","Message 4..."]}`, 800)
      setResults(parsed.messages || [])
    } catch (e) { toast.error('Erreur IA : ' + e.message) }
    finally      { setLoading(false) }
  }

  const copy = async (msg, i) => {
    await navigator.clipboard.writeText(msg)
    setCopied(i); setTimeout(() => setCopied(null), 1800); toast.success('Copié !')
  }

  const apply = (msg) => { onApply?.(msg); toast.success('Message appliqué !'); setOpen(false) }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ ...btn(), fontSize: 12, padding: '6px 12px' }}>
      <Sparkles size={12} /> Générer avec IA
    </button>
  )

  return (
    <div style={panelWrap('rgba(37,211,102,0.25)')}>
      {panelHeader(<Sparkles size={15} color={C.green} />, 'Campagne WhatsApp IA', () => setOpen(false))}

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Type de campagne</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 6 }}>
          {TYPES_CAM.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              style={{ padding: '8px 10px', borderRadius: 9, border: `1px solid ${type === t.id ? C.green : C.border}`, background: type === t.id ? C.greenDim : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              <p style={{ color: C.text, fontSize: 12, fontWeight: 700, margin: '0 0 2px' }}>{t.label}</p>
              <p style={{ color: C.sub, fontSize: 10, margin: 0 }}>{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>Produit / Service *</label>
        <input style={inp} placeholder="Ex: Robe batik, coaching business, burger artisanal..."
          value={product} onChange={e => setProduct(e.target.value)} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>Offre spéciale (optionnel)</label>
        <input style={inp} placeholder="Ex: -20%, livraison gratuite, code PROMO10..."
          value={promo} onChange={e => setPromo(e.target.value)} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Ton</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TONES_CAM.map(t => (
            <button key={t} onClick={() => setTone(t)}
              style={{ padding: '5px 11px', borderRadius: 20, border: `1px solid ${tone === t ? C.green : C.border}`, background: tone === t ? C.greenDim : 'transparent', color: tone === t ? C.green : C.sub, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <button onClick={generate} disabled={loading || !product}
        style={{ ...btn('green'), width: '100%', justifyContent: 'center', opacity: loading || !product ? 0.5 : 1, marginBottom: results.length ? 14 : 0 }}>
        {loading
          ? <><Loader2 size={13} style={spinStyle} /> Génération…</>
          : <><Sparkles size={13} /> Générer 4 messages</>}
      </button>

      {results.length > 0 && <>
        <p style={{ ...lbl, margin: '0 0 10px' }}>Messages générés — choisissez le meilleur</p>
        {results.map((msg, i) => (
          <div key={i} onClick={() => setSelected(i)}
            style={{ background: selected === i ? 'rgba(37,211,102,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected === i ? C.green : C.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', transition: 'all .15s' }}>
            <p style={{ color: C.text, fontSize: 13, margin: '0 0 10px', lineHeight: 1.6 }}>{msg}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: C.sub, fontSize: 10 }}>{msg.length} caractères</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); copy(msg, i) }} style={{ ...btn('ghost'), padding: '4px 9px', fontSize: 11 }}>
                  {copied === i ? <Check size={11} /> : <Copy size={11} />}
                </button>
                <button onClick={e => { e.stopPropagation(); apply(msg) }} style={{ ...btn('green'), padding: '4px 9px', fontSize: 11 }}>
                  Utiliser
                </button>
              </div>
            </div>
          </div>
        ))}
        <button onClick={generate} style={{ ...btn('ghost'), width: '100%', justifyContent: 'center', marginTop: 6, fontSize: 12 }}>
          <RefreshCw size={12} /> Régénérer
        </button>
      </>}

      <style>{spinCSS}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 3. PlatformAISuggestions
// ═══════════════════════════════════════════════════════════════════
// Usage :
//   <PlatformAISuggestions profile={localProfile} onAdd={(key) => handleAddPlatform(key)} />

const PRIORITY_COLOR = {
  haute:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#f87171', label: 'Priorité haute'   },
  moyenne: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24', label: 'Priorité moyenne' },
  faible:  { bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.25)', color: '#4ade80', label: 'Optionnel'        },
}

const PLATFORM_EMOJI = {
  instagram: '📸', facebook: '📘', tiktok: '🎵', youtube: '▶️',
  twitter: '🐦', linkedin: '💼', whatsapp: '💬', telegram: '✈️',
  spotify: '🎧', twitch: '🎮', pinterest: '📌', website: '🌐',
  email: '📧', behance: '🎨', github: '⚙️', snapchat: '👻',
}

export function PlatformAISuggestions({ profile, onAdd }) {
  const [open,    setOpen]    = useState(false)
  const [sector,  setSector]  = useState('')
  const [goal,    setGoal]    = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [added,   setAdded]   = useState([])

  const existingPlatforms = (profile?.links || []).map(l => l.platform)

  const generate = async () => {
    if (!sector) { toast.error('Choisissez un secteur'); return }
    setLoading(true); setResults([])
    try {
      const existingStr = existingPlatforms.length > 0
        ? `Plateformes déjà ajoutées : ${existingPlatforms.join(', ')}. Ne pas les recommander.`
        : ''
      const parsed = await askClaude(`
Tu es un expert en marketing digital pour des entrepreneurs en Côte d'Ivoire.
Recommande les 6 meilleures plateformes pour le secteur "${sector}"${goal ? ` avec l'objectif : "${goal}"` : ''}.
${existingStr}
Explique en 1 phrase pourquoi c'est important pour ce secteur en Côte d'Ivoire.
Clés autorisées : instagram, facebook, tiktok, youtube, twitter, linkedin, whatsapp, telegram, spotify, twitch, pinterest, website, email, behance, github, snapchat.
Réponds UNIQUEMENT en JSON valide :
{"suggestions":[{"platform":"instagram","label":"Instagram","raison":"...","priorite":"haute"}]}`)
      setResults(parsed.suggestions || [])
    } catch (e) { toast.error('Erreur IA : ' + e.message) }
    finally      { setLoading(false) }
  }

  const handleAdd = (platformKey, label) => {
    onAdd?.(platformKey)
    setAdded(prev => [...prev, platformKey])
    toast.success(`${label} ajouté !`)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ ...btn(), fontSize: 12, padding: '7px 13px' }}>
      <TrendingUp size={13} /> Suggestions IA
    </button>
  )

  return (
    <div style={panelWrap(C.purpleDim)}>
      {panelHeader(<TrendingUp size={15} color={C.purpleL} />, 'Plateformes recommandées par IA', () => setOpen(false))}

      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>Secteur d'activité *</label>
        <select style={sel} value={sector} onChange={e => setSector(e.target.value)}>
          <option value="">— Choisir votre secteur —</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Objectif principal (optionnel)</label>
        <input style={inp} placeholder="Ex: vendre en ligne, recruter des clients, devenir influenceur..."
          value={goal} onChange={e => setGoal(e.target.value)} />
      </div>

      <button onClick={generate} disabled={loading || !sector}
        style={{ ...btn(), width: '100%', justifyContent: 'center', opacity: loading || !sector ? 0.5 : 1, marginBottom: results.length ? 16 : 0 }}>
        {loading
          ? <><Loader2 size={13} style={spinStyle} /> Analyse en cours…</>
          : <><Sparkles size={13} /> Analyser et recommander</>}
      </button>

      {results.length > 0 && <>
        <p style={{ ...lbl, margin: '0 0 10px' }}>
          {results.length} plateformes recommandées pour votre secteur
        </p>
        {results.map((item, i) => {
          const prio    = PRIORITY_COLOR[item.priorite] || PRIORITY_COLOR.faible
          const isAdded = added.includes(item.platform) || existingPlatforms.includes(item.platform)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: C.purpleDim, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {PLATFORM_EMOJI[item.platform] || '🔗'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{item.label || item.platform}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: prio.bg, border: `1px solid ${prio.border}`, color: prio.color, padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    {prio.label}
                  </span>
                </div>
                <p style={{ color: C.sub, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{item.raison}</p>
              </div>
              <div style={{ flexShrink: 0 }}>
                {isAdded
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4ade80', fontSize: 12 }}>
                      <CheckCircle size={14} /> Ajouté
                    </div>
                  : <button onClick={() => handleAdd(item.platform, item.label)}
                      style={{ ...btn(), padding: '6px 12px', fontSize: 12 }}>
                      <Plus size={12} /> Ajouter
                    </button>
                }
              </div>
            </div>
          )
        })}
      </>}

      <style>{spinCSS}</style>
    </div>
  )
}