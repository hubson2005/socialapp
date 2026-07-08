/**
 * actions/createLead.js
 * ─────────────────────────────────────────────────────────────────
 * Crée un lead dans la table `leads`.
 *
 * Données prioritaires (ordre décroissant) :
 *   context (données du visiteur) > config (config de l'automatisation)
 *
 * IMPORTANT : cette action peut être déclenchée par un visiteur anonyme
 * (ex: trigger 'whatsapp_click' sur une page publique). L'insert ne passe
 * donc plus par supabase.from('leads').insert(...).select().single() —
 * le rôle anon n'a pas de policy SELECT sur `leads` (et ne doit pas en
 * avoir : ça exposerait les leads de tous les profils). On passe par la
 * RPC SECURITY DEFINER `create_public_lead`, qui valide les données,
 * insère le lead + son activité "created", et ne renvoie que l'id.
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
 * @returns {Object} lead créé { id, name }
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

  const { data: leadId, error } = await supabase.rpc('create_public_lead', {
    p_profile_id: leadData.profile_id,
    p_name:       leadData.name,
    p_email:      leadData.email,
    p_phone:      leadData.phone,
    p_notes:      leadData.notes,
    p_company:    null,
    p_source:     leadData.source,
    p_tags:       leadData.tags,
    p_status:     leadData.status,
    p_score:      leadData.score,
  });

  if (error) throw new Error(`createLead : ${error.message}`);

  console.log(`[Action:createLead] Lead créé → id=${leadId}, name="${leadData.name}"`);

  // On garde la même forme de retour qu'avant (data.id, data.name) pour ne
  // rien casser côté automationEngine.js (runningContext, entityId, etc.)
  return { id: leadId, name: leadData.name };
}