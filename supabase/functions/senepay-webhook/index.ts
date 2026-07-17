/**
 * supabase/functions/senepay-webhook/index.ts
 * ──────────────────────────────────────────────────────────────────
 * Reçoit les notifications de paiement SenePay (checkout.session.completed
 * / checkout.session.failed) et active/renouvelle l'abonnement correspondant.
 *
 * Sécurité (doc officielle SenePay) : chaque webhook est signé HMAC-SHA256
 * du CORPS BRUT avec `webhookSigningSecret` (préfixe whsec_), transmis dans
 * le header `X-SenePay-Signature` (hex minuscules). On DOIT calculer le HMAC
 * sur le texte brut reçu, avant tout JSON.parse.
 *
 * Idempotence : SenePay peut renvoyer le même webhook plusieurs fois
 * (retries jusqu'à ~3 jours) — on ignore si `order_reference` est déjà
 * marqué status='success' en base.
 * ─────────────────────────────────────────────────────────────────
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { runAutomations } from '../_shared/automationEngine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SENEPAY_WEBHOOK_SECRET = Deno.env.get('SENEPAY_WEBHOOK_SECRET') ?? '';

// HMAC-SHA256 hex digest via Web Crypto (disponible nativement dans Deno,
// pas besoin du module `crypto` Node).
async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Comparaison en temps constant pour éviter les attaques par timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // ── Lire le corps BRUT avant tout parsing — requis pour le HMAC ──
    const rawBody = await req.text();
    const signature = req.headers.get('x-senepay-signature') || '';

    if (!SENEPAY_WEBHOOK_SECRET) {
      console.error('[senepay-webhook] SENEPAY_WEBHOOK_SECRET non configuré');
      return _json({ error: 'server misconfigured' }, 500);
    }

    const expectedSignature = await hmacHex(SENEPAY_WEBHOOK_SECRET, rawBody);
    if (!signature || !timingSafeEqual(signature.toLowerCase(), expectedSignature)) {
      console.warn('[senepay-webhook] Signature invalide');
      return _json({ error: 'invalid signature' }, 401);
    }

    const body = JSON.parse(rawBody);
    const { event, orderReference, status, transactionId, netAmount, fees, metadata } = body;

    if (!orderReference) {
      return _json({ error: 'orderReference manquant' }, 400);
    }

    // ── Idempotence : ignorer si déjà traité avec succès ──
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('order_reference', orderReference)
      .maybeSingle();

    if (existingPayment?.status === 'success') {
      return _json({ ok: true, message: 'Déjà traité' });
    }

    // NOTE: le statut SenePay pour un paiement réussi est "Complete" (SANS 'd'),
    // à ne pas confondre avec l'événement "checkout.session.completed" (AVEC 'd').
    const isCompleted = event === 'checkout.session.completed' && status === 'Complete';

    if (!isCompleted) {
      await supabase
        .from('payments')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('order_reference', orderReference);
      return _json({ ok: true, event, status });
    }

    const profileId = Number(metadata?.profile_id);
    const userId = metadata?.user_id;
    const plan = metadata?.plan;

    if (!profileId || !userId || !plan) {
      console.error('[senepay-webhook] metadata incomplet:', metadata);
      return _json({ error: 'metadata incomplet' }, 400);
    }

    // ── Marquer le paiement comme réussi ──
    await supabase
      .from('payments')
      .update({
        status: 'success',
        provider_transaction_id: transactionId,
        net_amount: netAmount ?? null,
        fees: fees ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('order_reference', orderReference);

    // ── Déterminer la durée de la période selon le plan ──
    const { data: planRow } = await supabase
      .from('plans')
      .select('billing_period')
      .eq('id', plan)
      .maybeSingle();

    const periodInterval = planRow?.billing_period === 'monthly' ? '1 month' : '1 year';

    // ── Prolonger depuis la date la plus tardive entre l'expiration actuelle
    //    et maintenant (renouvellement anticipé ne "perd" jamais de jours) ──
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    const now = new Date();
    const base = existingSub?.expires_at && new Date(existingSub.expires_at) > now
      ? new Date(existingSub.expires_at)
      : now;

    const expiresAt = new Date(base);
    if (periodInterval === '1 month') expiresAt.setMonth(expiresAt.getMonth() + 1);
    else expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      payment_method: 'senepay',
      provider: 'senepay',
      transaction_id: transactionId,
      renewal_reminder_sent_at: null,
      updated_at: now.toISOString(),
    }, { onConflict: 'user_id' });

    // ── Mettre à jour le profil (respecte le CHECK basic/pro/business) ──
    if (['basic', 'pro', 'business'].includes(plan)) {
      await supabase.from('link_profiles').update({ plan, is_activated: true }).eq('id', profileId);
    } else if (plan === 'evenement') {
      await supabase.from('link_profiles').update({ is_event: true, is_activated: true }).eq('id', profileId);
    }

    // ── Déclencher les automatisations existantes (WhatsApp, notify_owner, etc.) ──
    await runAutomations({
      trigger: 'payment_received',
      profileId,
      context: {
        source: 'payment_received',
        amount: body.amount,
        currency: body.currency || 'XOF',
        orderId: transactionId,
        provider: 'senepay',
        plan,
      },
      supabase,
    });

    // ── Notification interne dans le dashboard ──
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: userId,
      type: 'success',
      title: 'Abonnement activé',
      message: `Votre plan ${plan} est actif jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`,
    });

    if (notifError) {
      console.error('[senepay-webhook] Échec insertion notification:', notifError.message);
      // On ne bloque pas la réponse pour ça — l'abonnement est déjà activé,
      // seule la notification a échoué. Mais on le loggue pour investigation.
    }

    return _json({ ok: true, plan, expiresAt: expiresAt.toISOString() });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[senepay-webhook]', msg);
    return _json({ error: msg }, 500);
  }
});

function _json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}