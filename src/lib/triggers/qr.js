/**
 * triggers/qr.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : scan du QR code du profil.
 *
 * Appeler depuis la page publique au chargement si l'URL contient
 * le paramètre `?ref=qr` (ajouté automatiquement par le QR code) :
 *
 *   import { triggerQrScan } from '@/lib/triggers/qr';
 *
 *   useEffect(() => {
 *     const params = new URLSearchParams(window.location.search);
 *     if (params.get('ref') === 'qr') {
 *       triggerQrScan(profile.id, { referrer: document.referrer });
 *     }
 *   }, [profile.id]);
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/**
 * @param {number} profileId
 * @param {Object} [context]  - { referrer, device, country, … }
 */
export async function triggerQrScan(profileId, context = {}) {
  await runAutomations({
    trigger:   'qr_scan',
    profileId,
    context: {
      source: 'qr_scan',
      ...context,
    },
  });
}