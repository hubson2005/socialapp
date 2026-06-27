/**
 * triggers/marketplace.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : achat dans la boutique Marketplace du profil.
 *
 * Appeler depuis ProductDetailModal (ou le handler de commande)
 * quand le visiteur confirme sa commande WhatsApp :
 *
 *   import { triggerMarketplaceBuy } from '@/lib/triggers/marketplace';
 *
 *   const handleOrder = async () => {
 *     window.open(`https://wa.me/${waNumber}?text=${waMsg}`, '_blank');
 *     await triggerMarketplaceBuy(profile.id, {
 *       productId:    product.id,
 *       productTitle: product.title,
 *       price:        product.price,
 *     });
 *   };
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/**
 * @param {number} profileId
 * @param {Object} [context]  - { productId, productTitle, price, visitorName, phone }
 */
export async function triggerMarketplaceBuy(profileId, context = {}) {
  await runAutomations({
    trigger:   'marketplace_buy',
    profileId,
    context: {
      source: 'automatisation',
      notes:  context.productTitle ? `Intérêt pour : ${context.productTitle}` : undefined,
      ...context,
    },
  });
}
