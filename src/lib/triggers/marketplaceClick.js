/**
 * triggers/marketplaceClick.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : visiteur ouvre la fiche d'un produit Marketplace.
 *
 * Distinct de marketplace_buy (clic "Commander sur WhatsApp").
 * Branché dans PublicProfile → onOpen de PublicProductCard.
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/**
 * @param {number} profileId
 * @param {Object} context - { productId, productTitle, price }
 */
export async function triggerMarketplaceClick(profileId, context = {}) {
  await runAutomations({
    trigger:   'marketplace_click',
    profileId,
    context: {
      source: 'marketplace_click',
      notes:  context.productTitle ? `Vue produit : ${context.productTitle}` : undefined,
      ...context,
    },
  });
}