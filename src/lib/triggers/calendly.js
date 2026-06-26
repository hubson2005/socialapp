/**
 * triggers/calendly.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : prise de rendez-vous Calendly.
 *
 * Appeler depuis l'Edge Function `webhooks` dans le handler
 * Calendly (événement `invitee.created`) :
 *
 *   import { triggerCalendlyBooked } from '@/lib/triggers/calendly';
 *
 *   // Dans le handler webhooks Calendly
 *   const invitee = payload.payload?.invitee || {};
 *   await triggerCalendlyBooked(profileId, {
 *     name:      invitee.name,
 *     email:     invitee.email,
 *     eventName: payload.payload?.event_type?.name,
 *     startTime: payload.payload?.scheduled_event?.start_time,
 *   });
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/**
 * @param {number} profileId
 * @param {Object} [context]  - { name, email, eventName, startTime }
 */
export async function triggerCalendlyBooked(profileId, context = {}) {
  await runAutomations({
    trigger:   'calendly_booked',
    profileId,
    context: {
      source:      'calendly_booked',
      visitorName: context.name,
      email:       context.email,
      ...context,
    },
  });
}