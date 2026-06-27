/**
 * supabase/functions/webhooks/index.ts
 * ─────────────────────────────────────────────────────────────────
 * Edge Function centrale — reçoit les webhooks entrants :
 *   • Calendly  → invitee.created
 *   • Stripe    → payment_intent.succeeded, checkout.session.completed
 *   • WhatsApp Business
 *   • Zapier / Make (payload générique)
 *
 * AJOUTS MOTEUR :
 *  [W1] runAutomations() importé depuis _shared/automationEngine.ts
 *  [W2] triggerCalendlyBooked après chaque RDV confirmé
 *  [W3] triggerPaymentReceived après chaque paiement Stripe confirmé
 * ─────────────────────────────────────────────────────────────────
 */

import { serve }                from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient }         from 'https://esm.sh/@supabase/supabase-js@2';
import { runAutomations }       from '../_shared/automationEngine.ts'; // [W1]

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-source',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body   = await req.json();
    const source = req.headers.get('x-webhook-source') || body.source || 'unknown';

    // ── Résoudre le profileId depuis le nom d'utilisateur ou l'ID ──
    // Les webhooks doivent inclure soit `profile_id` (bigint) soit `username`
    const profileId = await _resolveProfileId(supabase, body);
    if (!profileId) {
      return _json({ error: 'profile_id ou username requis' }, 400);
    }

    // ────────────────────────────────────────────────────────────────
    // [W2] CALENDLY — invitee.created
    // ────────────────────────────────────────────────────────────────
    if (source === 'calendly' || body.event?.startsWith('invitee')) {
      const invitee   = body.payload?.invitee     || body.invitee     || {};
      const eventInfo = body.payload?.event_type  || body.event_type  || {};
      const scheduled = body.payload?.scheduled_event || {};

      // Enregistrer le RDV dans la table calendly_events si elle existe
      await supabase.from('calendly_events').insert({
        profile_id:  profileId,
        invitee_name:  invitee.name,
        invitee_email: invitee.email,
        event_name:    eventInfo.name,
        start_time:    scheduled.start_time,
        raw_payload:   body,
      }).then(() => {}); // Silencieux si la table n'existe pas

      // [W2] Déclencher les automatisations calendly_booked
      await runAutomations({
        trigger:   'calendly_booked',
        profileId,
        context: {
          source:      'calendly_booked',
          visitorName: invitee.name,
          email:       invitee.email,
          eventName:   eventInfo.name,
          startTime:   scheduled.start_time,
        },
        supabase,
      });

      return _json({ ok: true, event: 'calendly_booked', profileId });
    }

    // ────────────────────────────────────────────────────────────────
    // [W3] STRIPE — payment_intent.succeeded ou checkout.session.completed
    // ────────────────────────────────────────────────────────────────
    if (source === 'stripe' || body.type?.includes('payment') || body.type?.includes('checkout')) {
      const stripeEvent = body.data?.object || body;
      const amount      = stripeEvent.amount_received || stripeEvent.amount_total || stripeEvent.amount || 0;
      const currency    = stripeEvent.currency?.toUpperCase() || 'XOF';
      const customer    = stripeEvent.customer_details || {};
      const metadata    = stripeEvent.metadata         || {};

      // [W3] Déclencher les automatisations payment_received
      await runAutomations({
        trigger:   'payment_received',
        profileId,
        context: {
          source:      'payment_received',
          visitorName: customer.name    || metadata.customer_name,
          email:       customer.email   || metadata.customer_email,
          phone:       customer.phone   || null,
          amount:      amount / 100,    // Stripe stocke en centimes
          currency,
          orderId:     stripeEvent.id,
          provider:    'stripe',
        },
        supabase,
      });

      return _json({ ok: true, event: 'payment_received', profileId, amount });
    }

    // ────────────────────────────────────────────────────────────────
    // WHATSAPP BUSINESS — message entrant
    // ────────────────────────────────────────────────────────────────
    if (source === 'whatsapp' || body.object === 'whatsapp_business_account') {
      const entry   = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      const message = changes?.messages?.[0];
      const contact = changes?.contacts?.[0];

      if (message && contact) {
        await supabase.from('whatsapp_contacts').upsert({
          user_id:    (await _getOwnerUserId(supabase, profileId)),
          name:       contact.profile?.name,
          phone:      message.from,
          last_msg_at: new Date().toISOString(),
        }, { onConflict: 'phone' }).then(() => {});
      }

      return _json({ ok: true, event: 'whatsapp_message' });
    }

    // ────────────────────────────────────────────────────────────────
    // ZAPIER / MAKE — payload générique
    // ────────────────────────────────────────────────────────────────
    if (source === 'zapier' || source === 'make' || body.action) {
      // Déléguer l'exécution à l'automation-engine Edge Function
      const { error } = await supabase.functions.invoke('automation-engine', {
        body: { ...body, profile_id: profileId },
      });
      if (error) console.error('[webhooks → automation-engine]', error);
      return _json({ ok: true, event: 'zapier_make', profileId });
    }

    return _json({ ok: true, message: 'Source non gérée', source });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[webhooks]', msg);
    return _json({ error: msg }, 500);
  }
});

// ─── Helpers ─────────────────────────────────────────────────────

/** Résout le profileId depuis body.profile_id ou body.username */
async function _resolveProfileId(
  supabase: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
): Promise<number | null> {
  // Cas 1 : profile_id fourni directement
  if (body.profile_id) return Number(body.profile_id);

  // Cas 2 : username fourni → chercher le profil
  if (body.username) {
    const { data } = await supabase
      .from('link_profiles')
      .select('id')
      .eq('username', body.username)
      .maybeSingle();
    return data?.id ?? null;
  }

  return null;
}

/** Récupère le user_id du propriétaire d'un profil */
async function _getOwnerUserId(
  supabase: ReturnType<typeof createClient>,
  profileId: number,
): Promise<string | null> {
  const { data } = await supabase
    .from('link_profiles')
    .select('user_id')
    .eq('id', profileId)
    .maybeSingle();
  return data?.user_id ?? null;
}

/** Réponse JSON avec CORS */
function _json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}