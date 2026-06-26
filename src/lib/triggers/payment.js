/**
 * triggers/payment.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : paiement reçu (Wave, Orange Money, Stripe…).
 *
 * Appeler depuis l'Edge Function `webhooks` dans le handler
 * Stripe/Wave après confirmation du paiement :
 *
 *   import { triggerPaymentReceived } from '@/lib/triggers/payment';
 *
 *   await triggerPaymentReceived(profileId, {
 *     amount:    event.data.amount,
 *     currency:  'XOF',
 *     payerName: event.data.customer_name,
 *     payerEmail:event.data.customer_email,
 *     orderId:   event.data.id,
 *     provider:  'stripe', // 'wave' | 'orange_money' | 'stripe'
 *   });
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/**
 * @param {number} profileId
 * @param {Object} [context]  - { amount, currency, payerName, payerEmail, orderId, provider }
 */
export async function triggerPaymentReceived(profileId, context = {}) {
  await runAutomations({
    trigger:   'payment_received',
    profileId,
    context: {
      source:      'payment_received',
      visitorName: context.payerName,
      email:       context.payerEmail,
      ...context,
    },
  });
}