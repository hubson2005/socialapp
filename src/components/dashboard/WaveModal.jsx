import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

const WAVE_NUMBER = '+225 05 76 03 12 12';

// Montants par offre — garde ces valeurs alignées avec PLAN_LIMITS
// (UserDashboard.jsx) si les prix changent un jour.
const PLAN_AMOUNTS = {
  basic:    '10 000 FCFA / an',
  pro:      '15 000 FCFA / an',
  business: '25 000 FCFA / an',
};

export default function WaveModal({ onClose, plan }) {
  const [copied, setCopied] = useState(false);
  const amountLabel = PLAN_AMOUNTS[plan] || 'Montant à confirmer avec le support';

  // Bloque le scroll du body tant que la modale est ouverte — évite de
  // pouvoir scroller le dashboard flouté derrière l'overlay.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(WAVE_NUMBER.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible (permissions/navigateur) — pas bloquant
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#0f0a1e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '28px 24px', maxWidth: '360px', width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', textAlign: 'center' }}
      >
        <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg,#0057FF,#0099FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(0,87,255,0.4)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
          </svg>
        </div>

        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Compte en attente d'activation</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
          Certaines fonctionnalités sont verrouillées. Contactez le support pour activer votre compte.
        </p>

        <div style={{ background: 'rgba(0,87,255,0.1)', border: '1px solid rgba(0,87,255,0.3)', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '8px' }}>
            Envoyez votre paiement via <strong style={{ color: '#60a5fa' }}>Wave CI</strong> au numéro :
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <p style={{ color: 'white', fontSize: '26px', fontWeight: 800, margin: 0 }}>{WAVE_NUMBER}</p>
            <button
              type="button" onClick={handleCopy}
              aria-label="Copier le numéro"
              title="Copier le numéro"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} color="rgba(255,255,255,0.6)" />}
            </button>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Montant : {amountLabel}</p>
        </div>

        <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px', background: '#25D366', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 700, textDecoration: 'none', marginBottom: '10px' }}>
          WhatsApp — Envoyer la preuve
        </a>
        <button type="button" onClick={onClose}
          style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}