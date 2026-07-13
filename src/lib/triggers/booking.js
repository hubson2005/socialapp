/**
 * triggers/booking.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheurs : calendrier de réservation interne SocialApp
 * (booking_services / booking_events, cf. panel "Calendrier").
 *
 * Contrairement à triggers/calendly.js (RDV pris sur un Calendly
 * externe via webhook), ceux-ci sont appelés directement côté client
 * depuis PublicBookingWidget.jsx, juste après confirmation d'une
 * réservation via les RPC Supabase `create_public_booking` /
 * `book_public_event` — sur le même modèle fire-and-forget que
 * triggerQrScan / triggerWhatsappClick dans PublicProfile.jsx.
 *
 * Usage :
 *   import { triggerNewBooking } from '@/lib/triggers/booking';
 *
 *   await triggerNewBooking(profileId, {
 *     name:        form.client_name,
 *     phone:       form.client_phone,
 *     email:       form.client_email,
 *     serviceName: service.name,
 *     bookingDate: date,
 *     startTime:   slot.slot_start,
 *   });
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';
import { TRIGGERS } from '../constants';

/**
 * RDV de service (booking_services) réservé via le widget public.
 *
 * @param {number} profileId
 * @param {Object} [context] - { name, phone, email, serviceName, bookingDate, startTime, notes }
 */
export async function triggerNewBooking(profileId, context = {}) {
  await runAutomations({
    trigger:   TRIGGERS.NEW_BOOKING,
    profileId,
    context: {
      source:      'new_booking',
      visitorName: context.name,
      phone:       context.phone,
      email:       context.email,
      ...context,
    },
  });
}

/**
 * Inscription à un événement à places limitées (booking_events).
 *
 * @param {number} profileId
 * @param {Object} [context] - { name, phone, email, eventTitle, eventDate, partySize }
 */
export async function triggerNewEventRegistration(profileId, context = {}) {
  await runAutomations({
    trigger:   TRIGGERS.NEW_EVENT_REGISTRATION,
    profileId,
    context: {
      source:      'new_event_registration',
      visitorName: context.name,
      phone:       context.phone,
      email:       context.email,
      ...context,
    },
  });
}