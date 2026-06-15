import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase';
import { toast } from 'sonner';
import {
  Zap, MessageCircle, Clock, CheckCircle, XCircle, Loader2,
  TrendingUp, Eye, MousePointerClick, Calendar, ChevronDown,
  Sparkles, AlertCircle, Play, BarChart3, Globe, Plus,
  Copy, Download, RefreshCw, Check, Hash, FileText, Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { FaXTwitter, FaWhatsapp } from 'react-icons/fa6';

// ─── Constants ────────────────────────────────────────────────────────────────
const BOOST_TYPES = [
  { id:'starter',  label:'Starter',  price:2500,  duration:3,  description:'Idéal pour tester',   networks:['facebook'],                       color:'#6366f1', emoji:'🚀' },
  { id:'standard', label:'Standard', price:5000,  duration:7,  description:'Le plus populaire',    networks:['facebook','instagram'],            color:'#f59e0b', emoji:'⭐', popular:true },
  { id:'premium',  label:'Premium',  price:10000, duration:14, description:'Visibilité maximale',  networks:['facebook','instagram','whatsapp'], color:'#10b981', emoji:'👑' },
];

const NETWORK_CONFIG = {
  facebook:  { label:'Facebook',    color:'#1877f2', icon:FaFacebook,  maxChars:63206 },
  instagram: { label:'Instagram',   color:'#e1306c', icon:FaInstagram, maxChars:2200  },
  whatsapp:  { label:'WhatsApp',    color:'#25d366', icon:FaWhatsapp,  maxChars:1000  },
  linkedin:  { label:'LinkedIn',    color:'#0a66c2', icon:FaLinkedin,  maxChars:3000  },
  twitter:   { label:'X / Twitter', color:'#000000', icon:FaXTwitter,  maxChars:280   },
};

const STATUS_CONFIG = {
  pending:   { label:'En attente', color:'#f59e0b', icon:Clock       },
  active:    { label:'Actif',      color:'#22c55e', icon:Play        },
  completed: { label:'Terminé',    color:'#6366f1', icon:CheckCircle },
  cancelled: { label:'Annulé',     color:'#6b7280', icon:XCircle     },
  failed:    { label:'Échoué',     color:'#ef4444', icon:AlertCircle },
};

// ─── Helpers Canvas ───────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function wrapText(ctx, text, maxWidth) {
  const words=text.split(' '); const lines=[]; let cur='';
  for (const w of words) {
    const test=cur?cur+' '+w:w;
    if (ctx.measureText(test).width>maxWidth&&cur) { lines.push(cur); cur=w; if(lines.length>=2) break; }
    else cur=test;
  }
  if (cur) lines.push(cur);
  return lines.slice(0,2);
}
function drawInitials(ctx, x, y, r, name) {
  const g=ctx.createLinearGradient(x-r,y-r,x+r,y+r);
  g.addColorStop(0,'#6366f1'); g.addColorStop(1,'#8b5cf6');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='white'; ctx.font=`bold ${r}px system-ui,sans-serif`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText((name||'?')[0].toUpperCase(),x,y); ctx.textBaseline='alphabetic';
}

async function generateSponsoredImage({ profile, canvasRef }) {
  return new Promise((resolve) => {
    const canvas=canvasRef.current; if (!canvas) { resolve(null); return; }
    const W=1080, H=1080; canvas.width=W; canvas.height=H;
    const ctx=canvas.getContext('2d');
    const grad=ctx.createLinearGradient(0,0,W,H);
    grad.addColorStop(0,'#0f0a1e'); grad.addColorStop(.5,'#1a0a3e'); grad.addColorStop(1,'#0a1628');
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=.12;
    const g1=ctx.createRadialGradient(200,200,0,200,200,300); g1.addColorStop(0,'#6366f1'); g1.addColorStop(1,'transparent');
    ctx.fillStyle=g1; ctx.beginPath(); ctx.arc(200,200,300,0,Math.PI*2); ctx.fill();
    const g2=ctx.createRadialGradient(880,880,0,880,880,280); g2.addColorStop(0,'#f59e0b'); g2.addColorStop(1,'transparent');
    ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(880,880,280,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    const bg=ctx.createLinearGradient(750,40,1040,40); bg.addColorStop(0,'#f59e0b'); bg.addColorStop(1,'#ef4444');
    ctx.fillStyle=bg; roundRect(ctx,750,40,290,52,26); ctx.fill();
    ctx.fillStyle='white'; ctx.font='bold 22px system-ui,sans-serif'; ctx.textAlign='center';
    ctx.fillText('⭐ SPONSORISÉ',895,73);
    const ax=W/2, ay=340, ar=160;
    ctx.save(); ctx.beginPath(); ctx.arc(ax,ay,ar+6,0,Math.PI*2);
    const rg=ctx.createLinearGradient(ax-ar,ay-ar,ax+ar,ay+ar);
    rg.addColorStop(0,'#6366f1'); rg.addColorStop(1,'#f59e0b');
    ctx.strokeStyle=rg; ctx.lineWidth=8; ctx.stroke(); ctx.restore();

    const drawContent = () => {
      ctx.fillStyle='white'; ctx.font='bold 68px system-ui,sans-serif'; ctx.textAlign='center';
      const name=profile.display_name||'Profil';
      ctx.fillText(name.length>20?name.slice(0,18)+'…':name,W/2,570);
      ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='32px system-ui,sans-serif';
      const bio=profile.bio||'Professionnel sur SocialApp';
      const lines=wrapText(ctx,bio,800);
      lines.forEach((l,i)=>ctx.fillText(l,W/2,622+i*44));
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(140,730); ctx.lineTo(940,730); ctx.stroke();
      ctx.fillStyle='#a78bfa'; ctx.font='bold 34px system-ui,sans-serif';
      ctx.fillText('🌐 socialapp.work/'+(profile.username||'profil'),W/2,790);
      ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.font='24px system-ui,sans-serif';
      ctx.fillText('SocialApp — Votre présence digitale',W/2,1020);
      ctx.fillStyle='rgba(255,255,255,0.08)'; roundRect(ctx,40,H-180,140,140,10); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='14px system-ui,sans-serif'; ctx.textAlign='center';
      ctx.fillText('QR Code',110,H-100);
      resolve(canvas.toDataURL('image/png'));
    };

    if (profile.avatar_url) {
      const img=new Image(); img.crossOrigin='anonymous';
      img.onload=()=>{ ctx.save(); ctx.beginPath(); ctx.arc(ax,ay,ar,0,Math.PI*2); ctx.clip(); ctx.drawImage(img,ax-ar,ay-ar,ar*2,ar*2); ctx.restore(); drawContent(); };
      img.onerror=()=>{ drawInitials(ctx,ax,ay,ar,profile.display_name); drawContent(); };
      img.src=profile.avatar_url;
    } else { drawInitials(ctx,ax,ay,ar,profile.display_name); drawContent(); }
  });
}

// ─── generatePostText — via Edge Function Supabase (CORS fix) ────────────────
async function generatePostText({ profile, network, boostType }) {
  const netLabel=NETWORK_CONFIG[network]?.label||network;
  const maxChars=NETWORK_CONFIG[network]?.maxChars>500?280:150;

  const prompt = `Tu es un expert en marketing digital pour l'Afrique francophone.
Génère un post ${netLabel} percutant pour ce profil SocialApp :
Nom : ${profile.display_name||'Professionnel'}
Bio : ${profile.bio||'Expert dans son domaine'}
Lien : https://socialapp.work/${profile.username||'profil'}
Boost : ${boostType}
Règles : ton chaleureux adapté Côte d'Ivoire, max ${maxChars} caractères, inclus le lien, CTA fort.
Réponds UNIQUEMENT en JSON valide sans markdown :
{"text":"<texte>","hashtags":["tag1","tag2","tag3","tag4","tag5"],"hook":"<accroche 1 ligne>"}`;

  // ✅ Appel via Edge Function Supabase — pas directement api.anthropic.com
  const { data, error } = await supabase.functions.invoke('claude-proxy', {
    body: { prompt, max_tokens: 600 },
  });

  if (error) throw new Error(error.message || 'Erreur Edge Function');

  const raw = data?.content?.[0]?.text || '{}';
  try {
    return JSON.parse(raw.replace(/```json|```/g,'').trim());
  } catch {
    return { text: raw, hashtags: ['#SocialApp','#Abidjan','#CoteDIvoire'], hook: '' };
  }
}

// ─── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <button onClick={handle} style={{ display:'flex',alignItems:'center',gap:'5px',padding:'6px 12px',
      background:copied?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.07)',
      border:'1px solid '+(copied?'rgba(34,197,94,0.3)':'rgba(255,255,255,0.12)'),
      borderRadius:'8px',color:copied?'#22c55e':'rgba(255,255,255,0.6)',fontSize:'11px',fontWeight:600,cursor:'pointer' }}>
      {copied?<Check size={11}/>:<Copy size={11}/>} {copied?'Copié !':'Copier'}
    </button>
  );
}

// ─── BoostContentGenerator ────────────────────────────────────────────────────
function BoostContentGenerator({ profile, boost, onContentReady }) {
  const [activeNetwork, setActiveNetwork] = useState(boost?.networks?.[0]||'facebook');
  const [contents, setContents]           = useState({});
  const [imageDataUrl, setImageDataUrl]   = useState(null);
  const [generating, setGenerating]       = useState({});
  const [generatingImage, setGeneratingImage] = useState(false);
  const [activeTab, setActiveTab]         = useState('text');
  const canvasRef = useRef(null);
  const boostNetworks = boost?.networks||['facebook'];

  const handleGenerateText = useCallback(async (network) => {
    setGenerating(p=>({...p,[network]:true}));
    try {
      const result = await generatePostText({ profile, network, boostType: boost?.boost_type||'standard' });
      setContents(p=>({...p,[network]:result}));
      toast.success(`✅ Texte ${NETWORK_CONFIG[network]?.label} généré !`);
    } catch(err) { toast.error('Erreur : '+err.message); }
    finally { setGenerating(p=>({...p,[network]:false})); }
  }, [profile, boost]);

  const handleGenerateImage = useCallback(async () => {
    setGeneratingImage(true);
    try {
      const url = await generateSponsoredImage({ profile, canvasRef });
      setImageDataUrl(url);
      toast.success('✅ Visuel sponsorisé généré !');
    } catch(err) { toast.error('Erreur image : '+err.message); }
    finally { setGeneratingImage(false); }
  }, [profile]);

  const handleGenerateAll = async () => {
    await Promise.all([
      ...boostNetworks.map(n => handleGenerateText(n)),
      handleGenerateImage(),
    ]);
    toast.success('🎉 Tout le contenu est prêt !');
  };

  const handleValidate = () => {
    if (!imageDataUrl && Object.keys(contents).length===0) { toast.error('Générez du contenu d\'abord'); return; }
    onContentReady?.({ contents, imageDataUrl });
    toast.success('Contenu envoyé pour publication !');
  };

  const cur = contents[activeNetwork];

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'16px',marginTop:'4px' }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
          <Sparkles size={14} color="#f59e0b"/>
          <span style={{ color:'white',fontSize:'13px',fontWeight:700 }}>Générateur de contenu IA</span>
        </div>
        <button onClick={handleGenerateAll} disabled={Object.values(generating).some(Boolean)||generatingImage}
          style={{ display:'flex',alignItems:'center',gap:'5px',padding:'7px 14px',
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'9px',
            color:'white',fontSize:'11px',fontWeight:700,cursor:'pointer',
            opacity:Object.values(generating).some(Boolean)||generatingImage?0.6:1 }}>
          {Object.values(generating).some(Boolean)||generatingImage ? <Loader2 size={11} className="animate-spin"/> : <Sparkles size={11}/>}
          Tout générer
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',gap:'4px',background:'rgba(255,255,255,0.06)',borderRadius:'10px',padding:'3px',width:'fit-content' }}>
        {[['text',FileText,'Textes'],['image',ImageIcon,'Visuel']].map(([id,Icon,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{
            display:'flex',alignItems:'center',gap:'5px',padding:'6px 14px',borderRadius:'8px',border:'none',
            background:activeTab===id?'rgba(99,102,241,0.35)':'transparent',
            color:activeTab===id?'white':'rgba(255,255,255,0.45)',fontSize:'11px',fontWeight:600,cursor:'pointer' }}>
            <Icon size={11}/> {label}
          </button>
        ))}
      </div>

      {/* TEXT TAB */}
      {activeTab==='text' && (
        <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
          <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>
            {boostNetworks.map(n => {
              const cfg=NETWORK_CONFIG[n]; if (!cfg) return null;
              const Icon=cfg.icon; const isA=activeNetwork===n; const hasC=!!contents[n];
              return (
                <button key={n} onClick={()=>setActiveNetwork(n)} style={{
                  position:'relative',display:'flex',alignItems:'center',gap:'5px',padding:'7px 12px',
                  borderRadius:'9px',border:'1px solid '+(isA?cfg.color:'rgba(255,255,255,0.1)'),
                  background:isA?cfg.color+'18':'rgba(255,255,255,0.04)',
                  color:isA?'white':'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:600,cursor:'pointer' }}>
                  <Icon size={12} color={isA?cfg.color:'rgba(255,255,255,0.4)'}/> {cfg.label}
                  {hasC&&<div style={{ position:'absolute',top:'-4px',right:'-4px',width:'9px',height:'9px',borderRadius:'50%',background:'#22c55e',border:'2px solid #0a0817' }}/>}
                </button>
              );
            })}
          </div>
          <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',overflow:'hidden' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color:'rgba(255,255,255,0.4)',fontSize:'10px',fontWeight:600 }}>{NETWORK_CONFIG[activeNetwork]?.label?.toUpperCase()}</span>
              <div style={{ display:'flex',gap:'6px' }}>
                {cur&&<CopyButton text={cur.text+'\n\n'+(cur.hashtags||[]).map(h=>'#'+h.replace('#','')).join(' ')}/>}
                <button onClick={()=>handleGenerateText(activeNetwork)} disabled={generating[activeNetwork]} style={{
                  display:'flex',alignItems:'center',gap:'5px',padding:'5px 10px',
                  background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'7px',
                  color:'white',fontSize:'10px',fontWeight:600,cursor:'pointer',
                  opacity:generating[activeNetwork]?0.6:1 }}>
                  {generating[activeNetwork]?<Loader2 size={10} className="animate-spin"/>:<RefreshCw size={10}/>}
                  {cur?'Regénérer':'Générer'}
                </button>
              </div>
            </div>
            <div style={{ padding:'14px' }}>
              {!cur
                ? <div style={{ textAlign:'center',padding:'24px' }}>
                    <Sparkles size={20} color="rgba(99,102,241,0.4)" style={{ margin:'0 auto 8px' }}/>
                    <p style={{ color:'rgba(255,255,255,0.3)',fontSize:'12px',margin:0 }}>Cliquez sur "Générer" pour créer le texte</p>
                  </div>
                : <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                    {cur.hook&&(
                      <div style={{ background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:'9px',padding:'9px 11px' }}>
                        <p style={{ color:'rgba(255,255,255,0.4)',fontSize:'9px',fontWeight:600,margin:'0 0 3px' }}>ACCROCHE</p>
                        <p style={{ color:'#a78bfa',fontSize:'12px',fontWeight:600,margin:0 }}>{cur.hook}</p>
                      </div>
                    )}
                    <div>
                      <p style={{ color:'rgba(255,255,255,0.4)',fontSize:'9px',fontWeight:600,margin:'0 0 5px' }}>
                        TEXTE DU POST <span style={{ fontWeight:400,color:'rgba(255,255,255,0.2)',marginLeft:'6px' }}>{cur.text?.length} / {NETWORK_CONFIG[activeNetwork]?.maxChars} chars</span>
                      </p>
                      <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'9px',padding:'11px',color:'rgba(255,255,255,0.85)',fontSize:'12px',lineHeight:'1.6',whiteSpace:'pre-wrap' }}>
                        {cur.text}
                      </div>
                    </div>
                    {cur.hashtags?.length>0&&(
                      <div>
                        <p style={{ color:'rgba(255,255,255,0.4)',fontSize:'9px',fontWeight:600,margin:'0 0 5px',display:'flex',alignItems:'center',gap:'3px' }}><Hash size={9}/> HASHTAGS</p>
                        <div style={{ display:'flex',gap:'5px',flexWrap:'wrap' }}>
                          {cur.hashtags.map((t,i)=>(
                            <span key={i} style={{ background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:'5px',padding:'2px 7px',color:'#a78bfa',fontSize:'10px',fontWeight:600 }}>
                              #{t.replace('#','')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
              }
            </div>
          </div>
        </div>
      )}

      {/* IMAGE TAB */}
      {activeTab==='image' && (
        <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
          <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',overflow:'hidden' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color:'rgba(255,255,255,0.4)',fontSize:'10px',fontWeight:600 }}>VISUEL 1080×1080</span>
              <div style={{ display:'flex',gap:'6px' }}>
                {imageDataUrl&&(
                  <button onClick={()=>{const a=document.createElement('a');a.href=imageDataUrl;a.download=`boost-${profile?.username||'profil'}.png`;a.click();}} style={{ display:'flex',alignItems:'center',gap:'5px',padding:'5px 10px',background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:'7px',color:'#22c55e',fontSize:'10px',fontWeight:600,cursor:'pointer' }}>
                    <Download size={10}/> Télécharger
                  </button>
                )}
                <button onClick={handleGenerateImage} disabled={generatingImage} style={{ display:'flex',alignItems:'center',gap:'5px',padding:'5px 10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'7px',color:'white',fontSize:'10px',fontWeight:600,cursor:'pointer',opacity:generatingImage?0.6:1 }}>
                  {generatingImage?<Loader2 size={10} className="animate-spin"/>:<Palette size={10}/>}
                  {imageDataUrl?'Regénérer':'Générer'}
                </button>
              </div>
            </div>
            <div style={{ padding:'14px',display:'flex',justifyContent:'center' }}>
              {!imageDataUrl&&!generatingImage
                ? <div style={{ width:'100%',maxWidth:'320px',aspectRatio:'1',background:'rgba(255,255,255,0.03)',border:'2px dashed rgba(255,255,255,0.1)',borderRadius:'14px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'8px' }}>
                    <ImageIcon size={28} color="rgba(255,255,255,0.15)"/>
                    <p style={{ color:'rgba(255,255,255,0.3)',fontSize:'12px',margin:0 }}>Cliquez sur "Générer"</p>
                  </div>
                : generatingImage
                  ? <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',padding:'40px' }}>
                      <Loader2 size={24} className="animate-spin" color="#6366f1"/>
                      <p style={{ color:'rgba(255,255,255,0.4)',fontSize:'12px',margin:0 }}>Génération du visuel…</p>
                    </div>
                  : <img src={imageDataUrl} alt="Visuel sponsorisé" style={{ width:'100%',maxWidth:'320px',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)' }}/>
              }
              <canvas ref={canvasRef} style={{ display:'none' }}/>
            </div>
          </div>
        </div>
      )}

      {/* Validate */}
      {(Object.keys(contents).length>0||imageDataUrl)&&(
        <button onClick={handleValidate} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',padding:'12px',background:'linear-gradient(135deg,#22c55e,#16a34a)',border:'none',borderRadius:'12px',color:'white',fontSize:'13px',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(34,197,94,0.25)' }}>
          <Check size={14}/> Valider et envoyer en publication
        </button>
      )}
    </div>
  );
}

// ─── NetworkBadge ─────────────────────────────────────────────────────────────
function NetworkBadge({ network }) {
  const cfg=NETWORK_CONFIG[network]; if (!cfg) return null;
  const Icon=cfg.icon;
  return (
    <div style={{ display:'flex',alignItems:'center',gap:'4px',background:cfg.color+'18',border:'1px solid '+cfg.color+'44',borderRadius:'6px',padding:'3px 8px' }}>
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
      style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',overflow:'hidden' }}>
      <div onClick={()=>setExpanded(v=>!v)} style={{ display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',cursor:'pointer' }}>
        <div style={{ width:'40px',height:'40px',borderRadius:'11px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0 }}>
          {BOOST_TYPES.find(b=>b.id===boost.boost_type)?.emoji||'🚀'}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap' }}>
            <span style={{ color:'white',fontSize:'13px',fontWeight:700 }}>Boost {boost.boost_type}</span>
            <div style={{ display:'flex',alignItems:'center',gap:'5px',background:status.color+'18',border:'1px solid '+status.color+'44',borderRadius:'6px',padding:'2px 8px' }}>
              <StatusIcon size={10} color={status.color}/>
              <span style={{ color:status.color,fontSize:'10px',fontWeight:600 }}>{status.label}</span>
            </div>
          </div>
          <div style={{ display:'flex',gap:'12px',marginTop:'3px',flexWrap:'wrap' }}>
            <span style={{ color:'rgba(255,255,255,0.4)',fontSize:'11px' }}>{boost.duration_days}j · {(boost.amount||0).toLocaleString()} FCFA</span>
            {boost.status==='active'&&daysLeft!==null&&<span style={{ color:'#22c55e',fontSize:'11px',fontWeight:600 }}>{daysLeft}j restants</span>}
          </div>
        </div>
        <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>
          {(boost.networks||[]).map(n=><NetworkBadge key={n} network={n}/>)}
        </div>
        <ChevronDown size={14} color="rgba(255,255,255,0.3)" style={{ transform:expanded?'rotate(180deg)':'none',transition:'transform 0.2s',flexShrink:0 }}/>
      </div>

      <AnimatePresence>
        {expanded&&(
          <motion.div initial={{ height:0,opacity:0 }} animate={{ height:'auto',opacity:1 }} exit={{ height:0,opacity:0 }} transition={{ duration:0.2 }} style={{ overflow:'hidden' }}>
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',padding:'14px 16px',display:'flex',flexDirection:'column',gap:'10px' }}>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px' }}>
                {[
                  ['Début', boost.start_date?new Date(boost.start_date).toLocaleDateString('fr-FR'):'—', Calendar],
                  ['Fin',   boost.end_date?new Date(boost.end_date).toLocaleDateString('fr-FR'):'—',   Calendar],
                  ['Paiement', boost.payment_method||'—', Globe],
                ].map(([label,value,Icon])=>(
                  <div key={label} style={{ background:'rgba(255,255,255,0.04)',borderRadius:'10px',padding:'10px',display:'flex',flexDirection:'column',gap:'4px' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:'5px' }}><Icon size={10} color="rgba(255,255,255,0.3)"/><span style={{ color:'rgba(255,255,255,0.3)',fontSize:'10px' }}>{label}</span></div>
                    <span style={{ color:'white',fontSize:'12px',fontWeight:600 }}>{value}</span>
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
                  <button onClick={()=>setShowGenerator(v=>!v)} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'9px',background:showGenerator?'rgba(245,158,11,0.15)':'linear-gradient(135deg,#f59e0b,#ef4444)',border:showGenerator?'1px solid rgba(245,158,11,0.4)':'none',borderRadius:'10px',color:'white',fontSize:'12px',fontWeight:700,cursor:'pointer' }}>
                    <Sparkles size={12}/> {showGenerator?'Masquer le générateur':'Générer le contenu IA'}
                  </button>
                )}
              </div>
              <AnimatePresence>
                {showGenerator&&boost.status==='active'&&(
                  <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} exit={{ opacity:0,height:0 }} style={{ overflow:'hidden' }}>
                    <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',padding:'14px' }}>
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
      }]).select().single();
      if (error) throw error;
      await supabase.from('publication_queue').insert(plan.networks.map(network=>({ boost_id:data.id, network, status:'queued', scheduled_at:new Date().toISOString() })));
      toast.success('Boost créé ! En attente de validation admin.');
      onCreated(data); onClose();
    } catch(err) { toast.error('Erreur : '+err.message); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px' }}>
      <motion.div initial={{ opacity:0,scale:0.95,y:16 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:0.95 }}
        onClick={e=>e.stopPropagation()}
        style={{ background:'#0a0817',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px',width:'100%',maxWidth:'520px',maxHeight:'90vh',overflow:'auto',boxShadow:'0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ padding:'22px 24px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
            <div style={{ width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#f59e0b,#ef4444)',display:'flex',alignItems:'center',justifyContent:'center' }}><Zap size={16} color="white"/></div>
            <div>
              <h2 style={{ color:'white',fontSize:'17px',fontWeight:800,margin:0 }}>Booster mon profil</h2>
              <p style={{ color:'rgba(255,255,255,0.35)',fontSize:'12px',margin:0 }}>Choisissez une offre pour {profile?.display_name}</p>
            </div>
          </div>
        </div>
        <div style={{ padding:'16px 24px 24px',display:'flex',flexDirection:'column',gap:'12px' }}>
          {BOOST_TYPES.map(type=>(
            <div key={type.id} onClick={()=>setSelected(type.id)} style={{ position:'relative',padding:'16px',background:selected===type.id?type.color+'15':'rgba(255,255,255,0.04)',border:'2px solid '+(selected===type.id?type.color:'rgba(255,255,255,0.08)'),borderRadius:'16px',cursor:'pointer' }}>
              {type.popular&&<div style={{ position:'absolute',top:'-10px',right:'16px',background:'linear-gradient(135deg,#f59e0b,#ef4444)',borderRadius:'6px',padding:'2px 10px',fontSize:'10px',color:'white',fontWeight:700 }}>⭐ Populaire</div>}
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
                  <span style={{ fontSize:'22px' }}>{type.emoji}</span>
                  <div><p style={{ color:'white',fontSize:'14px',fontWeight:800,margin:0 }}>{type.label}</p><p style={{ color:'rgba(255,255,255,0.4)',fontSize:'11px',margin:0 }}>{type.description}</p></div>
                </div>
                <div style={{ textAlign:'right' }}><p style={{ color:type.color,fontSize:'18px',fontWeight:900,margin:0 }}>{type.price.toLocaleString()}</p><p style={{ color:'rgba(255,255,255,0.35)',fontSize:'10px',margin:0 }}>FCFA · {type.duration}j</p></div>
              </div>
              <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>{type.networks.map(n=><NetworkBadge key={n} network={n}/>)}</div>
            </div>
          ))}
          {plan&&(
            <div style={{ background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:'14px',padding:'14px' }}>
              <p style={{ color:'rgba(255,255,255,0.5)',fontSize:'11px',margin:'0 0 6px',fontWeight:600 }}>RÉSUMÉ</p>
              {[['Offre '+plan.label,plan.price.toLocaleString()+' FCFA'],['Durée',plan.duration+' jours'],['Réseaux',plan.networks.length+' réseau(x)']].map(([k,v])=>(
                <div key={k} style={{ display:'flex',justifyContent:'space-between',marginBottom:'4px' }}>
                  <span style={{ color:'rgba(255,255,255,0.6)',fontSize:'12px' }}>{k}</span>
                  <span style={{ color:'white',fontSize:'12px',fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex',gap:'8px' }}>
            <button onClick={onClose} style={{ flex:1,padding:'12px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',color:'rgba(255,255,255,0.6)',fontSize:'13px',fontWeight:600,cursor:'pointer' }}>Annuler</button>
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
          <h3 style={{ color:'white',fontSize:'15px',fontWeight:800,margin:0 }}>Gestion des boosts</h3>
          <p style={{ color:'rgba(255,255,255,0.35)',fontSize:'11px',margin:'3px 0 0' }}>{counts.pending} en attente · {counts.active} actifs</p>
        </div>
      </div>
      <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>
        {[['pending','⏳ Attente'],['active','✅ Actifs'],['completed','Terminés'],['all','Tous']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ padding:'6px 12px',borderRadius:'8px',border:'1px solid '+(filter===v?'rgba(99,102,241,0.5)':'rgba(255,255,255,0.1)'),background:filter===v?'rgba(99,102,241,0.15)':'transparent',color:filter===v?'#a78bfa':'rgba(255,255,255,0.4)',fontSize:'11px',cursor:'pointer',fontWeight:filter===v?600:400 }}>{l}</button>
        ))}
      </div>
      {loading
        ?<div style={{ textAlign:'center',padding:'32px' }}><Loader2 size={20} className="animate-spin" color="rgba(99,102,241,0.6)"/></div>
        :filtered.length===0
          ?<div style={{ textAlign:'center',padding:'32px',background:'rgba(255,255,255,0.03)',border:'1px dashed rgba(255,255,255,0.1)',borderRadius:'16px' }}>
              <Zap size={24} color="rgba(255,255,255,0.15)" style={{ margin:'0 auto 10px' }}/><p style={{ color:'rgba(255,255,255,0.3)',fontSize:'13px',margin:0 }}>Aucun boost {filter!=='all'?filter:''}</p>
            </div>
          :filtered.map(boost=>(
            <div key={boost.id} style={{ display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'14px' }}>
              <div style={{ width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0,overflow:'hidden' }}>
                {boost.link_profiles?.avatar_url?<img src={boost.link_profiles.avatar_url} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:(boost.link_profiles?.display_name?.[0]?.toUpperCase()||'?')}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <p style={{ color:'white',fontSize:'12px',fontWeight:700,margin:0 }}>{boost.link_profiles?.display_name||'Profil'}</p>
                <p style={{ color:'rgba(255,255,255,0.35)',fontSize:'10px',margin:'2px 0 0' }}>{BOOST_TYPES.find(b=>b.id===boost.boost_type)?.emoji} {boost.boost_type} · {(boost.amount||0).toLocaleString()} FCFA</p>
              </div>
              <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>{(boost.networks||[]).map(n=><NetworkBadge key={n} network={n}/>)}</div>
              {boost.status==='pending'&&<button onClick={()=>handleActivate(boost.id)} style={{ display:'flex',alignItems:'center',gap:'5px',padding:'6px 12px',background:'rgba(34,197,94,0.15)',border:'1px solid rgba(34,197,94,0.35)',borderRadius:'8px',color:'#22c55e',fontSize:'11px',fontWeight:700,cursor:'pointer',flexShrink:0 }}><Play size={10}/> Activer</button>}
              {boost.status==='active'&&<div style={{ display:'flex',alignItems:'center',gap:'5px',padding:'6px 10px',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:'8px' }}><div style={{ width:'6px',height:'6px',borderRadius:'50%',background:'#22c55e',animation:'pulse-dot 2s infinite' }}/><span style={{ color:'#22c55e',fontSize:'10px',fontWeight:600 }}>Live</span></div>}
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
          <h2 style={{ color:'white',fontSize:'18px',fontWeight:800,margin:0 }}>🚀 Boosts & Promotion</h2>
          <p style={{ color:'rgba(255,255,255,0.35)',fontSize:'12px',margin:'4px 0 0' }}>Publiez automatiquement sur Facebook, Instagram et WhatsApp</p>
        </div>
        <button onClick={()=>setShowModal(true)} style={{ display:'flex',alignItems:'center',gap:'6px',padding:'10px 18px',background:'linear-gradient(135deg,#f59e0b,#ef4444)',border:'none',borderRadius:'12px',color:'white',fontSize:'13px',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(245,158,11,0.3)' }}>
          <Zap size={14}/> Nouveau boost
        </button>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px' }}>
        {[['TOTAL BOOSTS',stats.total,TrendingUp,'#6366f1'],['ACTIFS',stats.active,Play,'#22c55e'],['FCFA INVESTIS',stats.spent.toLocaleString(),BarChart3,'#f59e0b']].map(([label,value,Icon,color])=>(
          <div key={label} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',padding:'14px',display:'flex',flexDirection:'column',gap:'8px' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <span style={{ color:'rgba(255,255,255,0.4)',fontSize:'10px',fontWeight:600 }}>{label}</span>
              <div style={{ width:'26px',height:'26px',borderRadius:'7px',background:color+'22',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon size={12} color={color}/></div>
            </div>
            <span style={{ color:'white',fontSize:'22px',fontWeight:900,lineHeight:1 }}>{value}</span>
          </div>
        ))}
      </div>

      {isAdmin&&(
        <div style={{ display:'flex',gap:'4px',background:'rgba(255,255,255,0.06)',borderRadius:'12px',padding:'4px',width:'fit-content' }}>
          {[['my','Mon profil'],['admin','Admin — tous les boosts']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{ padding:'7px 16px',borderRadius:'9px',border:'none',background:tab===id?'rgba(99,102,241,0.35)':'transparent',color:tab===id?'white':'rgba(255,255,255,0.45)',fontSize:'12px',fontWeight:600,cursor:'pointer' }}>{label}</button>
          ))}
        </div>
      )}

      {tab==='admin'&&isAdmin
        ?<AdminBoostManager/>
        :loading
          ?<div style={{ textAlign:'center',padding:'32px' }}><Loader2 size={20} className="animate-spin" color="rgba(99,102,241,0.6)"/></div>
          :boosts.length===0
            ?<div style={{ textAlign:'center',padding:'48px 24px',background:'rgba(255,255,255,0.03)',border:'2px dashed rgba(255,255,255,0.1)',borderRadius:'20px' }}>
                <div style={{ fontSize:'40px',marginBottom:'12px' }}>🚀</div>
                <p style={{ color:'white',fontSize:'15px',fontWeight:700,margin:'0 0 6px' }}>Aucun boost actif</p>
                <p style={{ color:'rgba(255,255,255,0.35)',fontSize:'13px',margin:'0 0 20px' }}>Boostez votre profil pour apparaître sur Facebook et Instagram automatiquement.</p>
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