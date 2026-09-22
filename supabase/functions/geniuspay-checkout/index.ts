/**
 * supabase/functions/geniuspay-checkout/index.ts
 * ─────────────────────────────────────────────────────────────
 * Crée un paiement GeniusPay (checkout hébergé) pour un abonnement
 * SocialApp (souscription initiale OU rappel de renouvellement
 * automatique appelé par le cron `process_senepay_renewals`).
 *
 * Body attendu : { profile_id: number, plan: 'basic'|'pro'|'business'|'evenement', mode?: 'new'|'renewal' }
 *
 * Secrets requis (Supabase secrets) :
 *   GENIUSPAY_API_KEY        (X-API-Key,    ex: pk_sandbox_/pk_live_)
 *   GENIUSPAY_API_SECRET     (X-API-Secret, ex: sk_sandbox_/sk_live_)
 *   GENIUSPAY_WEBHOOK_SECRET (utilisé par geniuspay-webhook pour vérifier
 *                             le header X-Webhook-Signature)
 *
 * NOTE : l'URL de webhook n'est PAS envoyée dans cette requête — elle se
 * configure une seule fois dans le dashboard GeniusPay (onglet Webhooks).
 * ─────────────────────────────────────────────────────────────
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const GENIUSPAY_API_KEY = Deno.env.get('GENIUSPAY_API_KEY') ?? '';
const GENIUSPAY_API_SECRET = Deno.env.get('GENIUSPAY_API_SECRET') ?? '';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    SUPABASE_URL,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { profile_id, plan, mode = 'new' } = await req.json();

    if (!profile_id || !plan) {
      return _json({ error: 'profile_id et plan sont requis' }, 400);
    }

    // ── Récupérer le prix du plan depuis la table `plans` (jamais en dur) ──
    const { data: planRow, error: planErr } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan)
      .eq('is_active', true)
      .maybeSingle();

    if (planErr || !planRow) {
      return _json({ error: `Plan inconnu ou inactif: ${plan}` }, 400);
    }

    // ── Récupérer le profil + son propriétaire ──
    const { data: profile, error: profileErr } = await supabase
      .from('link_profiles')
      .select('id, user_id, display_name, whatsapp_phone')
      .eq('id', profile_id)
      .maybeSingle();

    if (profileErr || !profile) {
      return _json({ error: 'Profil introuvable' }, 404);
    }

    // ── Créer le paiement GeniusPay (checkout hébergé) ──
    // NOTE : payment_method volontairement omis -> GeniusPay génère une page
    // de checkout hébergée où le client choisit lui-même Wave/Orange/MTN/carte.
    const geniuspayRes = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': GENIUSPAY_API_KEY,
        'X-API-Secret': GENIUSPAY_API_SECRET,
      },
      body: JSON.stringify({
        amount: planRow.price_amount,
        currency: planRow.currency,
        description: `Abonnement SocialApp — ${planRow.label} (${planRow.billing_period === 'annual' ? 'annuel' : 'mensuel'})`,
        customer: {
          name: profile.display_name || undefined,
          phone: profile.whatsapp_phone || undefined,
          country: 'CI',
        },
        success_url: 'https://admin.socialapp.work/dashboard?subscription=success',
        error_url: 'https://admin.socialapp.work/dashboard?subscription=cancelled',
        metadata: {
          profile_id: String(profile_id),
          user_id: profile.user_id,
          plan,
          billing_period: planRow.billing_period,
        },
      }),
    });

    const geniuspayJson = await geniuspayRes.json();

    if (!geniuspayRes.ok || !geniuspayJson.success) {
      console.error('[geniuspay-checkout] Erreur GeniusPay:', geniuspayJson);
      const message = geniuspayJson?.error?.message || 'Échec de création du paiement GeniusPay';
      return _json({ error: message, details: geniuspayJson }, 502);
    }

    const geniuspayData = geniuspayJson.data;
    const checkoutUrl = geniuspayData.checkout_url || geniuspayData.payment_url;
    const orderReference = geniuspayData.reference;

    // ── Enregistrer le paiement en attente (idempotent via order_reference) ──
    await supabase.from('payments').insert({
      user_id: profile.user_id,
      profile_id,
      plan,
      amount: planRow.price_amount,
      currency: planRow.currency,
      status: 'pending',
      provider: 'geniuspay',
      order_reference: orderReference,
      payment_url: checkoutUrl,
      metadata: { mode, geniuspay_id: geniuspayData.id },
    });

    // ── Si c'est un rappel de renouvellement automatique, envoyer le lien par WhatsApp ──
    if (mode === 'renewal' && profile.whatsapp_phone) {
      const message = `Bonjour ${profile.display_name || ''} ! 👋 Votre abonnement SocialApp (${planRow.label}) arrive à expiration. Renouvelez en un clic (${planRow.price_amount.toLocaleString('fr-FR')} FCFA) : ${checkoutUrl}`;
      fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: profile.whatsapp_phone,
          message,
          profile_id: String(profile_id),
          notification_type: 'subscription_renewal_reminder',
        }),
      }).catch((e) => console.error('[geniuspay-checkout] send-whatsapp:', e));
    }

    return _json({ checkoutUrl, orderReference });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[geniuspay-checkout]', msg);
    return _json({ error: msg }, 500);
  }
});

function _json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}