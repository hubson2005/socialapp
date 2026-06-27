/**
 * actions/addScore.js
 * ─────────────────────────────────────────────────────────────────
 * Ajoute (ou soustrait) des points au score d'un lead existant.
 * Nécessite context.leadId (fourni par createLead si exécuté avant).
 * Le score est maintenu entre 0 et 100.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from '../../supabase';

/**
 * @param {Object} params
 * @param {Object} params.config  - { score: number } (positif = ajout, négatif = retrait)
 * @param {Object} params.context - { leadId }
 * @returns {Object|null}
 */
export async function addScoreAction({ config, context }) {
  const leadId    = context.leadId || context.create_lead_id || context.lastEntityId;
  const increment = Number(config.score ?? config.amount) || 0; // config.amount = clé legacy

  if (!leadId) {
    console.warn('[Action:addScore] Aucun lead_id disponible.');
    return null;
  }
  if (increment === 0) {
    console.warn('[Action:addScore] Score = 0, action ignorée.');
    return null;
  }

  // Lire le score actuel
  const { data: lead, error: readError } = await supabase
    .from('leads')
    .select('id, score')
    .eq('id', leadId)
    .single();

  if (readError) throw new Error(`addScore (lecture) : ${readError.message}`);

  const newScore = Math.min(100, Math.max(0, (lead.score || 50) + increment));

  const { data, error } = await supabase
    .from('leads')
    .update({ score: newScore, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw new Error(`addScore (mise à jour) : ${error.message}`);

  console.log(`[Action:addScore] Score mis à jour → lead=${leadId}, ${lead.score} → ${newScore} (${increment > 0 ? '+' : ''}${increment})`);
  return data;
}