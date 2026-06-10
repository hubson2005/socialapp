import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Sparkles, Image as ImageIcon, Copy, Download, RefreshCw,
  Loader2, Check, Hash, FileText, Palette, Eye,
  Facebook, Instagram, MessageCircle, ChevronDown,
} from 'lucide-react';

// ─── Network configs ──────────────────────────────────────────────────────────
const NETWORKS = {
  facebook:  { label: 'Facebook',  icon: Facebook,       color: '#1877f2', maxChars: 63206 },
  instagram: { label: 'Instagram', icon: Instagram,      color: '#e1306c', maxChars: 2200  },
  whatsapp:  { label: 'WhatsApp',  icon: MessageCircle,  color: '#25d366', maxChars: 1000  },
};

// ─── Generate post text via Claude API ───────────────────────────────────────
async function generatePostText({ profile, network, boostType }) {
  const networkLabel = NETWORKS[network]?.label || network;
  const prompt = `Tu es un expert en marketing digital pour l'Afrique francophone.

Génère un post ${networkLabel} percutant pour promouvoir ce profil SocialApp :

Nom : ${profile.display_name || 'Professionnel'}
Bio : ${profile.bio || 'Expert dans son domaine'}
Username : ${profile.username ? '@' + profile.username : ''}
Lien profil : https://socialapp.work/${profile.username || 'profil'}
Type de boost : ${boostType}

Règles STRICTES :
- Ton : professionnel mais chaleureux, adapté à la Côte d'Ivoire et l'Afrique
- Commence par une accroche forte avec un emoji
- Maximum ${NETWORKS[network]?.maxChars > 500 ? 280 : 150} caractères pour le texte principal
- Inclus le lien du profil
- Termine par un call-to-action clair

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{"text":"<le texte du post>","hashtags":["hashtag1","hashtag2","hashtag3","hashtag4","hashtag5"],"hook":"<accroche en 1 ligne>"}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const raw = data.content?.[0]?.text || '{}';
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { text: raw, hashtags: ['#SocialApp', '#Abidjan', '#CoteDIvoire'], hook: '' };
  }
}

// ─── Generate sponsored image on Canvas ──────────────────────────────────────
function generateSponsoredImage({ profile, boostType, canvasRef }) {
  return new Promise((resolve) => {
    const canvas = canvasRef.current;
    if (!canvas) { resolve(null); return; }

    const W = 1080, H = 1080;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f0a1e');
    grad.addColorStop(0.5, '#1a0a3e');
    grad.addColorStop(1, '#0a1628');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Decorative circles
    ctx.globalAlpha = 0.12;
    const circleGrad1 = ctx.createRadialGradient(200, 200, 0, 200, 200, 300);
    circleGrad1.addColorStop(0, '#6366f1');
    circleGrad1.addColorStop(1, 'transparent');
    ctx.fillStyle = circleGrad1;
    ctx.beginPath(); ctx.arc(200, 200, 300, 0, Math.PI * 2); ctx.fill();

    const circleGrad2 = ctx.createRadialGradient(880, 880, 0, 880, 880, 280);
    circleGrad2.addColorStop(0, '#f59e0b');
    circleGrad2.addColorStop(1, 'transparent');
    ctx.fillStyle = circleGrad2;
    ctx.beginPath(); ctx.arc(880, 880, 280, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Sponsored badge (top right)
    const badgeGrad = ctx.createLinearGradient(750, 40, 1040, 40);
    badgeGrad.addColorStop(0, '#f59e0b');
    badgeGrad.addColorStop(1, '#ef4444');
    ctx.fillStyle = badgeGrad;
    roundRect(ctx, 750, 40, 290, 52, 26);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⭐ SPONSORISÉ', 895, 73);

    // Avatar circle
    const avatarX = W / 2, avatarY = 340, avatarR = 160;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR + 6, 0, Math.PI * 2);
    const ringGrad = ctx.createLinearGradient(avatarX - avatarR, avatarY - avatarR, avatarX + avatarR, avatarY + avatarR);
    ringGrad.addColorStop(0, '#6366f1');
    ringGrad.addColorStop(1, '#f59e0b');
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();

    // Draw avatar or initials
    const drawContent = () => {
      // Name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 68px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const name = profile.display_name || 'Profil';
      ctx.fillText(name.length > 20 ? name.slice(0, 18) + '…' : name, W / 2, 570);

      // Bio
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '32px system-ui, sans-serif';
      const bio = profile.bio || 'Professionnel sur SocialApp';
      const bioLines = wrapText(ctx, bio, W / 2, 620, 800, 42);
      bioLines.forEach((line, i) => ctx.fillText(line, W / 2, 622 + i * 44));

      // Divider
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(140, 730); ctx.lineTo(940, 730);
      ctx.stroke();

      // Link
      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillText('🌐 socialapp.work/' + (profile.username || 'profil'), W / 2, 790);

      // SocialApp logo text
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText('SocialApp — Votre présence digitale', W / 2, 1020);

      // QR placeholder
      drawQRPlaceholder(ctx, 40, H - 180, 140);

      resolve(canvas.toDataURL('image/png'));
    };

    if (profile.avatar_url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
        ctx.restore();
        drawContent();
      };
      img.onerror = () => {
        drawInitials(ctx, avatarX, avatarY, avatarR, profile.display_name);
        drawContent();
      };
      img.src = profile.avatar_url;
    } else {
      drawInitials(ctx, avatarX, avatarY, avatarR, profile.display_name);
      drawContent();
    }
  });
}

function drawInitials(ctx, x, y, r, name) {
  const initGrad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  initGrad.addColorStop(0, '#6366f1');
  initGrad.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = initGrad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = `bold ${r}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((name || '?')[0].toUpperCase(), x, y);
  ctx.textBaseline = 'alphabetic';
}

function drawQRPlaceholder(ctx, x, y, size) {
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, x, y, size, size, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QR Code', x + size / 2, y + size / 2 + 5);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= 2) break;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

// ─── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '6px 12px', background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
      border: '1px solid ' + (copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.12)'),
      borderRadius: '8px', color: copied ? '#22c55e' : 'rgba(255,255,255,0.6)',
      fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
    }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  );
}

// ─── BoostContentGenerator principal ─────────────────────────────────────────
export default function BoostContentGenerator({ profile, boost, onContentReady }) {
  const [activeNetwork, setActiveNetwork] = useState('facebook');
  const [contents, setContents] = useState({});      // { facebook: {text, hashtags}, ... }
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [generating, setGenerating] = useState({});  // { facebook: true/false }
  const [generatingImage, setGeneratingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const canvasRef = useRef(null);

  const boostNetworks = boost?.networks || ['facebook', 'instagram'];

  const handleGenerateText = useCallback(async (network) => {
    setGenerating(prev => ({ ...prev, [network]: true }));
    try {
      const result = await generatePostText({
        profile,
        network,
        boostType: boost?.boost_type || 'standard',
      });
      setContents(prev => ({ ...prev, [network]: result }));
      toast.success(`✅ Texte ${NETWORKS[network]?.label} généré !`);
    } catch (err) {
      toast.error('Erreur génération : ' + err.message);
    } finally {
      setGenerating(prev => ({ ...prev, [network]: false }));
    }
  }, [profile, boost]);

  const handleGenerateImage = useCallback(async () => {
    setGeneratingImage(true);
    try {
      const url = await generateSponsoredImage({
        profile,
        boostType: boost?.boost_type || 'standard',
        canvasRef,
      });
      setImageDataUrl(url);
      toast.success('✅ Visuel sponsorisé généré !');
    } catch (err) {
      toast.error('Erreur image : ' + err.message);
    } finally {
      setGeneratingImage(false);
    }
  }, [profile, boost]);

  const handleGenerateAll = useCallback(async () => {
    await Promise.all([
      ...boostNetworks.map(n => handleGenerateText(n)),
      handleGenerateImage(),
    ]);
    toast.success('🎉 Tout le contenu est prêt !');
  }, [boostNetworks, handleGenerateText, handleGenerateImage]);

  const handleDownloadImage = () => {
    if (!imageDataUrl) return;
    const a = document.createElement('a');
    a.href = imageDataUrl;
    a.download = `boost-${profile?.username || 'profil'}-${Date.now()}.png`;
    a.click();
  };

  const handleValidate = () => {
    if (!imageDataUrl && Object.keys(contents).length === 0) {
      toast.error('Générez du contenu d\'abord');
      return;
    }
    onContentReady?.({ contents, imageDataUrl });
    toast.success('Contenu envoyé pour publication !');
  };

  const currentContent = contents[activeNetwork];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#f59e0b" /> Générateur de contenu IA
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
            Textes + visuels sponsorisés générés automatiquement
          </p>
        </div>
        <button
          onClick={handleGenerateAll}
          disabled={Object.values(generating).some(Boolean) || generatingImage}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: 'none', borderRadius: '12px', color: 'white',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          {Object.values(generating).some(Boolean) || generatingImage
            ? <Loader2 size={13} className="animate-spin" />
            : <Sparkles size={13} />}
          Tout générer
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {[['text', FileText, 'Textes'], ['image', ImageIcon, 'Visuel']].map(([id, Icon, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '9px', border: 'none',
              background: activeTab === id ? 'rgba(99,102,241,0.35)' : 'transparent',
              color: activeTab === id ? 'white' : 'rgba(255,255,255,0.45)',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* TEXT TAB */}
      {activeTab === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Network selector */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {boostNetworks.map(network => {
              const cfg = NETWORKS[network];
              if (!cfg) return null;
              const Icon = cfg.icon;
              const isActive = activeNetwork === network;
              const hasContent = !!contents[network];
              return (
                <button key={network} onClick={() => setActiveNetwork(network)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '10px',
                    border: '1px solid ' + (isActive ? cfg.color : 'rgba(255,255,255,0.1)'),
                    background: isActive ? cfg.color + '18' : 'rgba(255,255,255,0.04)',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', position: 'relative',
                  }}>
                  <Icon size={13} color={isActive ? cfg.color : 'rgba(255,255,255,0.4)'} />
                  {cfg.label}
                  {hasContent && (
                    <div style={{
                      position: 'absolute', top: '-4px', right: '-4px',
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: '#22c55e', border: '2px solid #0a0817',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content area */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', overflow: 'hidden',
          }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600 }}>
                {NETWORKS[activeNetwork]?.label?.toUpperCase()}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {currentContent && <CopyButton text={currentContent.text + '\n\n' + (currentContent.hashtags || []).map(h => '#' + h.replace('#', '')).join(' ')} />}
                <button
                  onClick={() => handleGenerateText(activeNetwork)}
                  disabled={generating[activeNetwork]}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    border: 'none', borderRadius: '8px', color: 'white',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {generating[activeNetwork]
                    ? <Loader2 size={11} className="animate-spin" />
                    : <RefreshCw size={11} />}
                  {currentContent ? 'Regénérer' : 'Générer'}
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '16px' }}>
              {!currentContent
                ? (
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <Sparkles size={24} color="rgba(99,102,241,0.4)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>
                      Cliquez sur "Générer" pour créer le texte {NETWORKS[activeNetwork]?.label}
                    </p>
                  </div>
                )
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Hook */}
                    {currentContent.hook && (
                      <div style={{
                        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: '10px', padding: '10px 12px',
                      }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, margin: '0 0 4px' }}>ACCROCHE</p>
                        <p style={{ color: '#a78bfa', fontSize: '13px', fontWeight: 600, margin: 0 }}>{currentContent.hook}</p>
                      </div>
                    )}

                    {/* Main text */}
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, margin: '0 0 6px' }}>
                        TEXTE DU POST
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, marginLeft: '8px' }}>
                          {currentContent.text?.length} / {NETWORKS[activeNetwork]?.maxChars} caractères
                        </span>
                      </p>
                      <div style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px', padding: '12px',
                        color: 'rgba(255,255,255,0.85)', fontSize: '13px', lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {currentContent.text}
                      </div>
                    </div>

                    {/* Hashtags */}
                    {currentContent.hashtags?.length > 0 && (
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Hash size={10} /> HASHTAGS
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {currentContent.hashtags.map((tag, i) => (
                            <span key={i} style={{
                              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
                              borderRadius: '6px', padding: '3px 8px',
                              color: '#a78bfa', fontSize: '11px', fontWeight: 600,
                            }}>
                              #{tag.replace('#', '')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          </div>
        </div>
      )}

      {/* IMAGE TAB */}
      {activeTab === 'image' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600 }}>
                VISUEL 1080×1080 — FORMAT STORY/POST
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {imageDataUrl && (
                  <button onClick={handleDownloadImage} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px',
                    color: '#22c55e', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  }}>
                    <Download size={11} /> Télécharger
                  </button>
                )}
                <button onClick={handleGenerateImage} disabled={generatingImage}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    border: 'none', borderRadius: '8px', color: 'white',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  }}>
                  {generatingImage ? <Loader2 size={11} className="animate-spin" /> : <Palette size={11} />}
                  {imageDataUrl ? 'Regénérer' : 'Générer'}
                </button>
              </div>
            </div>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
              {!imageDataUrl && !generatingImage
                ? (
                  <div style={{
                    width: '100%', maxWidth: '400px', aspectRatio: '1',
                    background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)',
                    borderRadius: '16px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '10px',
                  }}>
                    <ImageIcon size={32} color="rgba(255,255,255,0.15)" />
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>
                      Cliquez sur "Générer" pour créer le visuel sponsorisé
                    </p>
                  </div>
                )
                : generatingImage
                  ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px' }}>
                      <Loader2 size={28} className="animate-spin" color="#6366f1" />
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Génération du visuel…</p>
                    </div>
                  )
                  : (
                    <img
                      src={imageDataUrl}
                      alt="Visuel sponsorisé"
                      style={{ width: '100%', maxWidth: '400px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  )
              }
              {/* Canvas caché pour la génération */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </div>

          {/* Info */}
          <div style={{
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '12px', padding: '12px 14px',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <Sparkles size={14} color="#a78bfa" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, margin: '0 0 3px' }}>
                Format optimisé pour les réseaux sociaux
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
                1080×1080px · Photo de profil + nom + bio + lien + badge Sponsorisé + QR code
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validate button */}
      {(Object.keys(contents).length > 0 || imageDataUrl) && (
        <button
          onClick={handleValidate}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '14px',
            background: 'linear-gradient(135deg,#22c55e,#16a34a)',
            border: 'none', borderRadius: '14px', color: 'white',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
          }}
        >
          <Check size={16} /> Valider et envoyer en publication
        </button>
      )}
    </div>
  );
}