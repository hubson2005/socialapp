/**
 * supabase/functions/_shared/automationEngine.ts
 * ─────────────────────────────────────────────────────────────────
 * Version Deno du moteur d'automatisation — utilisable par toutes
 * les Edge Functions (webhooks, automation-engine, etc.)
 *
 * Identique à src/lib/automationEngine.js dans la logique,
 * mais adapté pour Deno + Supabase Edge Runtime.
 * ─────────────────────────────────────────────────────────────────
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Types ────────────────────────────────────────────────────────
interface RunAutomationsParams {
  trigger:   string;
  profileId: number;
  context?:  Record<string, unknown>;
  supabase:  SupabaseClient;
}

interface ActionDef {
  type:   string;
  config: Record<string, unknown>;
}

// ─── Libellés (miroir de src/lib/constants.js) ────────────────────
const TRIGGER_LABELS: Record<string, string> = {
  whatsapp_click:   '📱 Clic WhatsApp',
  qr_scan:          '📷 Scan QR code',
  form_submit:      '📝 Formulaire rempli',
  new_lead:         '👤 Nouveau contact',
  payment_received: '💰 Paiement reçu',
  calendly_booked:  '📅 RDV Calendly',
  marketplace_buy:  '🛍️ Achat Marketplace',
};

// ─── Point d'entrée public ────────────────────────────────────────
export async function runAutomations({
  trigger, profileId, context = {}, supabase,
}: RunAutomationsParams): Promise<void> {
  if (!trigger || !profileId) return;

  const { data: automations, error } = await supabase
    .from('automations')
    .select('*')
    .eq('profile_id', profileId)
    .eq('trigger', trigger)
    .eq('active', true);

  if (error || !automations?.length) return;

  for (const automation of automations) {
    await _executeAutomation({ automation, trigger, profileId, context, supabase });
  }
}

// ─── Exécution d'une automatisation ──────────────────────────────
async function _executeAutomation({
  automation, trigger, profileId, context, supabase,
}: {
  automation: Record<string, unknown>;
  trigger:    string;
  profileId:  number;
  context:    Record<string, unknown>;
  supabase:   SupabaseClient;
}): Promise<void> {
  let status       = 'ok';
  let errorMessage: string | null = null;
  let entityId:     string | null = null;
  let runningContext = { ...context };

  try {
    const actionsList = _resolveActions(automation);

    for (const actionDef of actionsList) {
      const actionType   = typeof actionDef === 'string' ? actionDef : (actionDef as ActionDef).type;
      const actionConfig = {
        score: automation.score ?? null,
        tag:   automation.tag   ?? null,
        ...(automation.action_config as Record<string, unknown> || {}),
        ...(typeof actionDef === 'object' ? ((actionDef as ActionDef).config || {}) : {}),
      };

      const result = await _executeAction({
        actionType,
        config: actionConfig,
        profileId,
        automation,
        context: runningContext,
        supabase,
      });

      if (result?.id) {
        if (!entityId) entityId = String(result.id);
        runningContext = {
          ...runningContext,
          lastEntityId: result.id,
          [`${actionType}_id`]: result.id,
          ...(actionType === 'create_lead' ? { leadId: result.id } : {}),
        };
      }
    }

    // Incrémenter runs + last_run
    await supabase.from('automations').update({
      runs:       ((automation.runs as number) || 0) + 1,
      last_run:   new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', automation.id);

  } catch (err: unknown) {
    status       = 'error';
    errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error(`[AutomationEngine] Erreur dans "${automation.name}":`, err);
  }

  // Logger l'exécution
  await supabase.from('automation_logs').insert({
    automation_id:   automation.id,
    profile_id:      profileId,
    automation_name: automation.name,
    trigger_label:   TRIGGER_LABELS[trigger] || trigger,
    status,
    error_message:   errorMessage,
    entity_id:       entityId,
  });
}

// ─── Dispatcher d'actions ─────────────────────────────────────────
async function _executeAction({
  actionType, config, profileId, automation, context, supabase,
}: {
  actionType: string;
  config:     Record<string, unknown>;
  profileId:  number;
  automation: Record<string, unknown>;
  context:    Record<string, unknown>;
  supabase:   SupabaseClient;
}): Promise<Record<string, unknown> | null> {
  switch (actionType) {

    case 'create_lead': {
      const { data, error } = await supabase.from('leads').insert({
        profile_id: profileId,
        name:       context.visitorName || context.name || config.defaultName || 'Visiteur',
        email:      context.email  || null,
        phone:      context.phone  || null,
        notes:      context.notes  || config.notes  || null,
        source:     context.source || 'automatisation',
        status:     config.status  || 'prospect',
        score:      config.score   ?? 50,
        tags:       config.tag     ? [config.tag] : [],
      }).select().single();
      if (error) throw new Error(`create_lead: ${error.message}`);
      return data;
    }

    case 'create_task': {
      const leadId = context.leadId || context.create_lead_id || context.lastEntityId;
      if (!leadId) { console.warn('[create_task] Aucun lead_id'); return null; }
      const { data, error } = await supabase.from('lead_activities').insert({
        lead_id:     leadId,
        type:        'task',
        description: config.taskTitle || config.task || config.taskDescription || 'Tâche automatique',
      }).select().single();
      if (error) throw new Error(`create_task: ${error.message}`);
      return data;
    }

    case 'add_score': {
      const leadId    = context.leadId || context.create_lead_id || context.lastEntityId;
      const increment = Number(config.score ?? config.amount) || 0;
      if (!leadId || increment === 0) return null;
      const { data: lead } = await supabase.from('leads').select('id,score').eq('id', leadId).single();
      if (!lead) return null;
      const newScore = Math.min(100, Math.max(0, (lead.score || 50) + increment));
      const { data, error } = await supabase.from('leads').update({ score: newScore, updated_at: new Date().toISOString() }).eq('id', leadId).select().single();
      if (error) throw new Error(`add_score: ${error.message}`);
      return data;
    }

    case 'add_tag': {
      const leadId = context.leadId || context.create_lead_id || context.lastEntityId;
      const tag    = (config.tag as string)?.trim();
      if (!leadId || !tag) return null;
      const { data: lead } = await supabase.from('leads').select('id,tags').eq('id', leadId).single();
      if (!lead) return null;
      const existing = Array.isArray(lead.tags) ? lead.tags : [];
      if (existing.includes(tag)) return lead;
      const { data, error } = await supabase.from('leads').update({ tags: [...existing, tag], updated_at: new Date().toISOString() }).eq('id', leadId).select().single();
      if (error) throw new Error(`add_tag: ${error.message}`);
      return data;
    }

    case 'notify_owner': {
      const { data: profile } = await supabase.from('link_profiles').select('user_id').eq('id', profileId).single();
      if (!profile?.user_id) return null;
      const { data, error } = await supabase.from('notifications').insert({
        user_id:    profile.user_id,
        profile_id: profileId,
        type:       'automation',
        title:      config.notifTitle || config.title || `Automatisation : ${automation.name}`,
        message:    config.message || `Déclencheur activé : ${automation.name}`,
        read:       false,
      }).select().single();
      if (error) { console.warn('[notify_owner]', error.message); return null; }
      return data;
    }

    default:
      console.warn(`[AutomationEngine] Action inconnue: "${actionType}"`);
      return null;
  }
}

// ─── Résolution des actions (compat legacy) ───────────────────────
function _resolveActions(automation: Record<string, unknown>): unknown[] {
  if (Array.isArray(automation.actions) && automation.actions.length > 0) {
    return automation.actions as unknown[];
  }
  if (automation.action) {
    return [{ type: automation.action, config: automation.action_config || {} }];
  }
  return [];
}