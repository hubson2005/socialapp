import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

// Copie robuste en 2 paliers — identique au pattern utilisé dans ShortLinksCard.
const copyToClipboard = async (text, onDone) => {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); onDone(true); return; }
    catch (err) { console.warn('[ShortLinkResultDisplay] clipboard API a échoué :', err); }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (!ok) throw new Error('execCommand a échoué');
    onDone(true);
  } catch (err) {
    console.warn('[ShortLinkResultDisplay] execCommand fallback a échoué :', err);
    onDone(false);
  }
};

// Affichage façon urls.fr : le lien d'origine en petit/italique au-dessus,
// puis le lien court dans une case bordée avec bouton "Copier" à droite.
// Pensé comme résultat immédiat après création d'un raccourci (ou dans un
// modal de partage), plutôt que pour la liste dense de ShortLinksCard.
export default function ShortLinkResultDisplay({ originalUrl, shortUrl }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  // Nettoyage du timeout si le composant est démonté avant la fin du délai
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = () => {
    if (!shortUrl) {
      toast.error('Aucun lien à copier');
      return;
    }

    copyToClipboard(shortUrl, (ok) => {
      if (ok) {
        setCopied(true);
        toast.success('Lien copié !');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 1600);
      } else {
        toast.error('Copie automatique bloquée — sélectionnez le lien manuellement');
      }
    });
  };

  const displayShortUrl = shortUrl ? shortUrl.replace(/^https?:\/\//, '') : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{
        margin: 0, fontSize: '13px', fontStyle: 'italic', color: 'rgba(255,255,255,0.4)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {originalUrl || ''}
      </p>

      <div style={{
        display: 'flex', alignItems: 'stretch', border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: '10px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)',
      }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', padding: '11px 14px' }}>
          <span style={{
            color: 'white', fontSize: '14px', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayShortUrl}
          </span>
        </div>
        <button
          onClick={handleCopy}
          disabled={!shortUrl}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px',
            background: copied ? '#22c55e' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: 'none', color: 'white', fontSize: '12.5px', fontWeight: 700,
            cursor: shortUrl ? 'pointer' : 'not-allowed',
            opacity: shortUrl ? 1 : 0.5,
            whiteSpace: 'nowrap', transition: 'background 0.15s',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
    </div>
  );
}