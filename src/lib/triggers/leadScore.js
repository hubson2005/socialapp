/**
 * triggers/leadScore.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : score d'un lead atteint un seuil.
 *
 * Branché dans LeadModal → saveEdit(), si le score augmente
 * et franchit un des seuils significatifs : 25, 50, 75, 100.
 *
 * Logique anti-doublon : ne se déclenche que si le seuil est
 * franchi dans le sens croissant (oldScore < seuil ≤ newScore).
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/** Seuils surveillés */
const THRESHOLDS = [25, 50, 75, 100];

/**
 * Vérifie si un seuil a été franchi et déclenche les automations.
 *
 * @param {number} profileId
 * @param {Object} params - { leadId, leadName, oldScore, newScore }
 */
export async function triggerLeadScoreReachedIfThreshold(profileId, {
  leadId, leadName, oldScore = 0, newScore = 0,
}) {
  const crossedThresholds = THRESHOLDS.filter(
    t => oldScore < t && newScore >= t,
  );
  if (!crossedThresholds.length) return;

  // Déclencher pour le seuil le plus élevé franchi
  const threshold = crossedThresholds[crossedThresholds.length - 1];

  await runAutomations({
    trigger:   'lead_score_reached',
    profileId,
    context: {
      source:      'lead_score_reached',
      leadId,
      visitorName: leadName,
      score:       newScore,
      threshold,
    },
  });
}