import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Montants par offre — garde ces valeurs alignées avec PLAN_LIMITS
// (UserDashboard.jsx) si les prix changent un jour.
// [FIX] BUSINESS était resté à 25 000 FCFA / an : aligné sur la grille 2026
// (39 900 FCFA / an). Le module Événement est un paiement unique.
const PLAN_AMOUNTS = {
  basic:     '10 000 FCFA / an',
  pro:       '15 000 FCFA / an',
  business:  '39 900 FCFA / an',
  evenement: '3 500 FCFA',
};

// requiredPlan : 'pro' | 'business' | 'evenement' (alias accepté : 'event').
// - 'pro' / 'business' : palier de plan, libellé « disponible à partir de l'offre ».
// - 'evenement' : module vendu à l'unité, indépendant du plan (paiement unique).
// Le montant affiché est celui de l'offre / du module requis, pas celui de
// l'offre actuelle de l'utilisateur.
// onUpgrade : déclenche startGeniusPayCheckout(requiredPlan, 'new') côté
// UserDashboard.jsx — même flux de paiement automatique que PlanModal
// (Wave / Orange Money / Free Money via GeniusPay, activation par webhook).
export default function FeatureUpgradeModal({ onClose, featureName, requiredPlan = 'pro', onUpgrade, loading = false }) {
  const isEvent     = requiredPlan === 'evenement' || requiredPlan === 'event';
  const planKey     = isEvent ? 'evenement' : (requiredPlan === 'business' ? 'business' : 'pro');
  const planLabel   = isEvent ? 'MODULE ÉVÉNEMENT' : planKey === 'business' ? 'BUSINESS' : 'PRO';
  const amountLabel = PLAN_AMOUNTS[planKey];
  const color       = isEvent ? '#22c55e' : planKey === 'business' ? '#f7c948' : '#ff8c00';

  // Bloque le scroll du body tant que la modale est ouverte — évite de
  // pouvoir scroller le dashboard flouté derrière l'overlay.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={loading ? undefined : onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#0f0a1e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '28px 24px', maxWidth: '360px', width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', textAlign: 'center' }}
      >
        <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: `linear-gradient(135deg,${color},${color}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 8px 24px ${color}44` }}>
          <span style={{ fontSize: '28px' }}>{isEvent ? '🎉' : '👑'}</span>
        </div>

        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
          {isEvent ? 'Activer le module Événement' : 'Débloquer cette fonctionnalité'}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '10px', lineHeight: 1.6 }}>
          {isEvent ? (
            <>Le module <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{featureName}</strong> s'achète à l'unité, quelle que soit votre offre</>
          ) : (
            <><strong style={{ color: 'rgba(255,255,255,0.8)' }}>{featureName}</strong> est disponible à partir de l'offre</>
          )}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: color + '18', border: '1px solid ' + color + '44', borderRadius: '100px', padding: '4px 12px', marginBottom: '20px' }}>
          <span style={{ color, fontSize: '12px', fontWeight: 700 }}>{planLabel}</span>
        </div>

        <div style={{ background: color + '10', border: '1px solid ' + color + '30', borderRadius: '14px', padding: '16px', marginBottom: '18px' }}>
          <p style={{ color: 'white', fontSize: '24px', fontWeight: 800, margin: '0 0 4px' }}>{amountLabel}</p>
          {isEvent && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '0 0 4px' }}>Paiement unique</p>}
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Mobile Money · Wave · Orange Money · Sans carte bancaire</p>
        </div>

        <button
          type="button"
          onClick={onUpgrade}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px', background: loading ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,${color},${color}aa)`, borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 700, border: 'none', cursor: loading ? 'default' : 'pointer', marginBottom: '10px', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <><Loader2 size={15} className="animate-spin" /> Redirection…</> : (isEvent ? `Acheter le module — ${amountLabel} →` : `Payer ${amountLabel} →`)}
        </button>
        <button type="button" onClick={onClose} disabled={loading}
          style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: loading ? 'default' : 'pointer' }}>
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}