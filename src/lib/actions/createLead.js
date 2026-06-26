/**
 * actions/createLead.js
 * ─────────────────────────────────────────────────────────────────
 * Crée un lead dans la table `leads`.
 *
 * Données prioritaires (ordre décroissant) :
 *   context (données du visiteur) > config (config de l'automatisation)
 *
 * Le lead créé est retourné afin que son ID soit disponible pour
 * les actions suivantes dans la même automatisation.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from "../../supabase";
/**
 * @param {Object} params
 * @param {Object} params.config    - { status, score, tag, notes, defaultName }
 * @param {number} params.profileId
 * @param {Object} params.context   - { visitorName, name, email, phone, notes, source }
 * @returns {Object} lead créé
 */
export async function createLeadAction({ config, profileId, context }) {
  const leadData = {
    profile_id: profileId,
    name:       context.visitorName || context.name || config.defaultName || 'Visiteur',
    email:      context.email  || null,
    phone:      context.phone  || null,
    notes:      context.notes  || config.notes || null,
    source:     context.source || 'automatisation',
    status:     config.status  || 'prospect',
    score:      config.score   ?? 50,
    tags:       config.tag     ? [config.tag] : [],
  };

  const { data, error } = await supabase
    .from('leads')
    .insert(leadData)
    .select()
    .single();

  if (error) throw new Error(`createLead : ${error.message}`);

  console.log(`[Action:createLead] Lead créé → id=${data.id}, name="${data.name}"`);
  return data;
}