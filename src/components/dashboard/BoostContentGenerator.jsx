import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../../supabase';
import { toast } from 'sonner';
import {
  Sparkles, Loader2, RefreshCw, Copy, Check, Hash, FileText,
  Palette, Image as ImageIcon, Edit3, Download,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { FaXTwitter, FaWhatsapp } from 'react-icons/fa6';

// [EXTRACTION — cette révision] BoostContentGenerator vivait auparavant
// en interne dans BoostPanel.jsx. Un fichier BoostContentGenerator.jsx
// séparé existait aussi dans le repo avec un contenu dupliqué (reste d'un
// ancien découpage) — source de confusion sur quelle version faisait foi.
// Ce fichier est désormais la SEULE source du composant, exporté par
// défaut. BoostPanel.jsx l'importe au lieu de le redéfinir.
//
// NETWORK_CONFIG déplacé ici (et réexporté) plutôt que dupliqué : c'est
// ce composant qui en a l'usage le plus complet (icônes, limites de
// caractères par réseau) ; BoostPanel.jsx l'importe pour NetworkBadge et
// NewBoostModal plutôt que de le redéfinir — évite tout risque de
// divergence entre deux copies du même objet.
export const NETWORK_CONFIG = {
  facebook:  { label:'Facebook',    color:'#1877f2', icon:FaFacebook,  maxChars:63206 },
  instagram: { label:'Instagram',   color:'#e1306c', icon:FaInstagram, maxChars:2200  },
  whatsapp:  { label:'WhatsApp',    color:'#25d366', icon:FaWhatsapp,  maxChars:1000  },
  linkedin:  { label:'LinkedIn',    color:'#0a66c2', icon:FaLinkedin,  maxChars:3000  },
  twitter:   { label:'X / Twitter', color:'#000000', icon:FaXTwitter,  maxChars:280   },
};

// ─── Helpers Canvas (visuel sponsorisé — reste en style sombre : c'est un
// visuel marketing à publier tel quel sur les réseaux, pas une pièce d'UI
// du dashboard, donc indépendant du thème clair du reste du panneau) ────
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
async function generatePostText({ profile, network, boostType, customPrompt }) {
  const netLabel=NETWORK_CONFIG[network]?.label||network;
  const maxChars=NETWORK_CONFIG[network]?.maxChars>500?280:150;

  const prompt = `Tu es un expert en marketing digital pour l'Afrique francophone.
Génère un post ${netLabel} percutant pour ce profil SocialApp :
Nom : ${profile.display_name||'Professionnel'}
Bio : ${profile.bio||'Expert dans son domaine'}
Lien : https://socialapp.work/${profile.username||'profil'}
Boost : ${boostType}
Règles : ton chaleureux adapté Côte d'Ivoire, max ${maxChars} caractères, inclus le lien, CTA fort.${customPrompt?.trim() ? `
Instructions supplémentaires de l'utilisateur (à respecter en priorité) : ${customPrompt.trim()}` : ''}
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
      background:copied?'rgba(34,197,94,0.12)':'#eef0f6',
      border:'1px solid '+(copied?'rgba(34,197,94,0.3)':'#e6e8f0'),
      borderRadius:'8px',color:copied?'#16a34a':'#6b6f85',fontSize:'11px',fontWeight:600,cursor:'pointer' }}>
      {copied?<Check size={11}/>:<Copy size={11}/>} {copied?'Copié !':'Copier'}
    </button>
  );
}

// ─── BoostContentGenerator ────────────────────────────────────────────────────
export default function BoostContentGenerator({ profile, boost, onContentReady }) {
  const [activeNetwork, setActiveNetwork] = useState(boost?.networks?.[0]||'facebook');
  const [contents, setContents]           = useState({});
  const [imageDataUrl, setImageDataUrl]   = useState(null);
  const [generating, setGenerating]       = useState({});
  const [generatingImage, setGeneratingImage] = useState(false);
  const [activeTab, setActiveTab]         = useState('text');
  const [customPrompt, setCustomPrompt]   = useState('');
  const canvasRef = useRef(null);
  const boostNetworks = boost?.networks||['facebook'];

  const handleGenerateText = useCallback(async (network) => {
    setGenerating(p=>({...p,[network]:true}));
    try {
      const result = await generatePostText({ profile, network, boostType: boost?.boost_type||'standard', customPrompt });
      setContents(p=>({...p,[network]:result}));
      toast.success(`✅ Texte ${NETWORK_CONFIG[network]?.label} généré !`);
    } catch(err) { toast.error('Erreur : '+err.message); }
    finally { setGenerating(p=>({...p,[network]:false})); }
  }, [profile, boost, customPrompt]);

  // Permet de modifier directement le texte généré dans le champ
  const handleTextChange = useCallback((network, newText) => {
    setContents(prev => ({
      ...prev,
      [network]: { ...(prev[network]||{}), text: newText },
    }));
  }, []);

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
  const overLimit = (cur?.text?.length||0) > (NETWORK_CONFIG[activeNetwork]?.maxChars||Infinity);

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'16px',marginTop:'4px' }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
          <Sparkles size={14} color="#b45309"/>
          <span style={{ color:'#151329',fontSize:'13px',fontWeight:700 }}>Générateur de contenu IA</span>
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
      <div style={{ display:'flex',gap:'4px',background:'#eef0f6',borderRadius:'10px',padding:'3px',width:'fit-content' }}>
        {[['text',FileText,'Textes'],['image',ImageIcon,'Visuel']].map(([id,Icon,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{
            display:'flex',alignItems:'center',gap:'5px',padding:'6px 14px',borderRadius:'8px',border:'none',
            background:activeTab===id?'#ffffff':'transparent',
            boxShadow:activeTab===id?'0 1px 3px rgba(16,18,40,0.1)':'none',
            color:activeTab===id?'#151329':'#6b6f85',fontSize:'11px',fontWeight:600,cursor:'pointer' }}>
            <Icon size={11}/> {label}
          </button>
        ))}
      </div>

      {/* TEXT TAB */}
      {activeTab==='text' && (
        <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>

          {/* Prompt personnalisé */}
          <div style={{ display:'flex',flexDirection:'column',gap:'6px' }}>
            <label style={{ display:'flex',alignItems:'center',gap:'5px',color:'#6b6f85',fontSize:'10px',fontWeight:600 }}>
              <Edit3 size={10}/> INSTRUCTIONS PERSONNALISÉES (optionnel)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e)=>setCustomPrompt(e.target.value)}
              placeholder="Ex : mets l'accent sur une promo -20% ce week-end, ton plus humoristique, parle de notre nouveau service…"
              rows={2}
              style={{
                width:'100%', boxSizing:'border-box',
                background:'#f8f9fc', border:'1px solid #e6e8f0',
                borderRadius:'10px', padding:'10px 11px',
                color:'#151329', fontSize:'12px', lineHeight:'1.5',
                fontFamily:'inherit', resize:'vertical', outline:'none',
              }}
            />
            <p style={{ color:'#9a9db0', fontSize:'10px', margin:0 }}>
              Ces instructions seront prises en compte à la prochaine génération (bouton "Générer" ou "Régénérer").
            </p>
          </div>

          <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>
            {boostNetworks.map(n => {
              const cfg=NETWORK_CONFIG[n]; if (!cfg) return null;
              const Icon=cfg.icon; const isA=activeNetwork===n; const hasC=!!contents[n];
              return (
                <button key={n} onClick={()=>setActiveNetwork(n)} style={{
                  position:'relative',display:'flex',alignItems:'center',gap:'5px',padding:'7px 12px',
                  borderRadius:'9px',border:'1px solid '+(isA?cfg.color:'#e6e8f0'),
                  background:isA?cfg.color+'14':'#f8f9fc',
                  color:isA?cfg.color:'#6b6f85',fontSize:'11px',fontWeight:600,cursor:'pointer' }}>
                  <Icon size={12} color={isA?cfg.color:'#9a9db0'}/> {cfg.label}
                  {hasC&&<div style={{ position:'absolute',top:'-4px',right:'-4px',width:'9px',height:'9px',borderRadius:'50%',background:'#22c55e',border:'2px solid #ffffff' }}/>}
                </button>
              );
            })}
          </div>
          <div style={{ background:'#ffffff',border:'1px solid #e6e8f0',boxShadow:'0 1px 2px rgba(16,18,40,0.04)',borderRadius:'14px',overflow:'hidden' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid #e6e8f0' }}>
              <span style={{ color:'#6b6f85',fontSize:'10px',fontWeight:600 }}>{NETWORK_CONFIG[activeNetwork]?.label?.toUpperCase()}</span>
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
                    <p style={{ color:'#9a9db0',fontSize:'12px',margin:0 }}>Cliquez sur "Générer" pour créer le texte</p>
                  </div>
                : <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                    {cur.hook&&(
                      <div style={{ background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.18)',borderRadius:'9px',padding:'9px 11px' }}>
                        <p style={{ color:'#6b6f85',fontSize:'9px',fontWeight:600,margin:'0 0 3px' }}>ACCROCHE</p>
                        <p style={{ color:'#4f46e5',fontSize:'12px',fontWeight:600,margin:0 }}>{cur.hook}</p>
                      </div>
                    )}
                    <div>
                      <p style={{ color:'#6b6f85',fontSize:'9px',fontWeight:600,margin:'0 0 5px',display:'flex',alignItems:'center',gap:'6px' }}>
                        TEXTE DU POST
                        <span style={{ fontWeight:400, color: overLimit ? '#dc2626' : '#9a9db0' }}>
                          {cur.text?.length||0} / {NETWORK_CONFIG[activeNetwork]?.maxChars} chars
                        </span>
                        <span style={{ fontWeight:400,color:'#9a9db0',marginLeft:'auto',display:'flex',alignItems:'center',gap:'3px' }}>
                          <Edit3 size={9}/> modifiable
                        </span>
                      </p>
                      <textarea
                        value={cur.text||''}
                        onChange={(e)=>handleTextChange(activeNetwork, e.target.value)}
                        rows={5}
                        style={{
                          width:'100%', boxSizing:'border-box',
                          background:'#f8f9fc',
                          border:'1px solid '+(overLimit?'rgba(239,68,68,0.4)':'#e6e8f0'),
                          borderRadius:'9px', padding:'11px',
                          color:'#151329', fontSize:'12px', lineHeight:'1.6',
                          fontFamily:'inherit', whiteSpace:'pre-wrap', resize:'vertical', outline:'none',
                        }}
                      />
                    </div>
                    {cur.hashtags?.length>0&&(
                      <div>
                        <p style={{ color:'#6b6f85',fontSize:'9px',fontWeight:600,margin:'0 0 5px',display:'flex',alignItems:'center',gap:'3px' }}><Hash size={9}/> HASHTAGS</p>
                        <div style={{ display:'flex',gap:'5px',flexWrap:'wrap' }}>
                          {cur.hashtags.map((t,i)=>(
                            <span key={i} style={{ background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:'5px',padding:'2px 7px',color:'#4f46e5',fontSize:'10px',fontWeight:600 }}>
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
          <div style={{ background:'#ffffff',border:'1px solid #e6e8f0',boxShadow:'0 1px 2px rgba(16,18,40,0.04)',borderRadius:'14px',overflow:'hidden' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid #e6e8f0' }}>
              <span style={{ color:'#6b6f85',fontSize:'10px',fontWeight:600 }}>VISUEL 1080×1080</span>
              <div style={{ display:'flex',gap:'6px' }}>
                {imageDataUrl&&(
                  <button onClick={()=>{const a=document.createElement('a');a.href=imageDataUrl;a.download=`boost-${profile?.username||'profil'}.png`;a.click();}} style={{ display:'flex',alignItems:'center',gap:'5px',padding:'5px 10px',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:'7px',color:'#16a34a',fontSize:'10px',fontWeight:600,cursor:'pointer' }}>
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
                ? <div style={{ width:'100%',maxWidth:'320px',aspectRatio:'1',background:'#f8f9fc',border:'2px dashed #e6e8f0',borderRadius:'14px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'8px' }}>
                    <ImageIcon size={28} color="#c7cdfb"/>
                    <p style={{ color:'#9a9db0',fontSize:'12px',margin:0 }}>Cliquez sur "Générer"</p>
                  </div>
                : generatingImage
                  ? <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',padding:'40px' }}>
                      <Loader2 size={24} className="animate-spin" color="#6366f1"/>
                      <p style={{ color:'#6b6f85',fontSize:'12px',margin:0 }}>Génération du visuel…</p>
                    </div>
                  : <img src={imageDataUrl} alt="Visuel sponsorisé" style={{ width:'100%',maxWidth:'320px',borderRadius:'10px',border:'1px solid #e6e8f0' }}/>
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