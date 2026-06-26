/**
 * actions/addTag.js
 * ─────────────────────────────────────────────────────────────────
 * Ajoute un tag au tableau `tags` d'un lead existant.
 * Les doublons sont ignorés (idempotent).
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from "../../supabase";
/**
 * @param {Object} params
 * @param {Object} params.config  - { tag: string }
 * @param {Object} params.context - { leadId }
 * @returns {Object|null}
 */
export async function addTagAction({ config, context }) {
  const leadId = context.leadId || context.create_lead_id || context.lastEntityId;
  const tag    = config.tag?.trim();

  if (!leadId) {
    console.warn('[Action:addTag] Aucun lead_id disponible.');
    return null;
  }
  if (!tag) {
    console.warn('[Action:addTag] Aucun tag configuré.');
    return null;
  }

  // Lire les tags existants
  const { data: lead, error: readError } = await supabase
    .from('leads')
    .select('id, tags')
    .eq('id', leadId)
    .single();

  if (readError) throw new Error(`addTag (lecture) : ${readError.message}`);

  const existingTags = Array.isArray(lead.tags) ? lead.tags : [];
  if (existingTags.includes(tag)) {
    console.log(`[Action:addTag] Tag "${tag}" déjà présent sur le lead ${leadId}.`);
    return lead;
  }

  const { data, error } = await supabase
    .from('leads')
    .update({
      tags:       [...existingTags, tag],
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw new Error(`addTag (mise à jour) : ${error.message}`);

  console.log(`[Action:addTag] Tag "${tag}" ajouté → lead=${leadId}`);
  return data;
}