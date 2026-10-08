import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { extractCryptoAddress } from './dashboard/AddPlatformDialog';

// ─── CryptoAddressRow ─────────────────────────────────────────────────────────
// Ligne du profil public pour une adresse de portefeuille (bitcoin, ethereum,
// usdt, usdc, tron, xrp) : icône à gauche, titre + adresse au centre, bouton
// rond à droite qui copie l'ADRESSE UNIQUEMENT (pas le titre).
//
//   <CryptoAddressRow
//     link={link}                // { platform, url (= l'adresse), label? }
//     platform={platform}        // PLATFORMS[...] : icon, color, coin, label
//     theme={{ text, border, bg, iconBg, shadow }}   // couleurs de la page
//     onCopied={() => trackClick(...)}               // optionnel
//   />
//
// Le titre est `link.label` s'il est renseigné, sinon « Mon adresse BITCOIN ».
// Pour USDT/USDC, mettre le réseau dans le titre (ex. « Mon adresse USDT (TRC20) »)
// évite qu'un visiteur envoie sur le mauvais réseau.

// Copie avec repli (anciens navigateurs / contexte non sécurisé)
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { /* on tente le repli */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function CryptoAddressRow({ link, platform, theme = {}, onCopied }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const address = extractCryptoAddress(link?.url);
  if (!address) return null;

  const title = (link?.label || '').trim() || `Mon adresse ${platform.coin || platform.label}`;
  const text   = theme.text   || 'rgba(255,255,255,0.96)';
  const border = theme.border || 'rgba(255,255,255,0.30)';
  const iconBg = theme.iconBg || 'rgba(255,255,255,0.12)';

  const handleCopy = async (e) => {
    e.stopPropagation();
    const ok = await copyToClipboard(address);
    if (!ok) {
      // Dernier recours : l'utilisateur copie lui-même depuis la boîte de dialogue
      window.prompt('Copiez cette adresse :', address);
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
    if (onCopied) onCopied();
  };

  return (
    <div
      role="group"
      aria-label={title}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', boxSizing: 'border-box', padding: '8px',
        borderRadius: '999px',
        background: theme.bg || 'rgba(255,255,255,0.13)',
        border: `1px solid ${border}`,
        borderLeft: `4px solid ${platform.color || '#6366f1'}`,
        boxShadow: theme.shadow || '0 4px 20px rgba(0,0,0,0.28)',
      }}
    >
      {/* Icône de la cryptomonnaie */}
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: iconBg, boxShadow: `0 0 0 1px ${border}`,
      }}>
        {platform.icon ? React.cloneElement(platform.icon, { width: 48, height: 48 }) : null}
      </div>

      {/* Titre + adresse (l'adresse est sélectionnable d'un seul toucher) */}
      <div style={{ flex: 1, minWidth: 0, textAlign: 'center', color: text }}>
        <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{
          marginTop: '2px', fontSize: '12px', lineHeight: 1.35, fontWeight: 500,
          wordBreak: 'break-all', userSelect: 'all', WebkitUserSelect: 'all',
        }}>
          {address}
        </div>
      </div>

      {/* Bouton « copier l'adresse » */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copier l'adresse"
        title={copied ? 'Adresse copiée' : "Copier l'adresse"}
        style={{
          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: copied ? 'rgba(34,197,94,0.92)' : iconBg,
          border: `1px solid ${copied ? 'rgba(34,197,94,0.6)' : border}`,
          color: copied ? '#fff' : text,
          cursor: 'pointer', touchAction: 'manipulation',
          transition: 'background 0.2s, border-color 0.2s, color 0.2s',
        }}
      >
        {copied ? <Check size={18} /> : <Copy size={17} />}
      </button>

      {/* Annonce vocale pour les lecteurs d'écran */}
      <span
        aria-live="polite"
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
      >
        {copied ? 'Adresse copiée' : ''}
      </span>
    </div>
  );
}