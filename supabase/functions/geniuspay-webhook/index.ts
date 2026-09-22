/**
 * supabase/functions/geniuspay-webhook/index.ts
 * ─────────────────────────────────────────────────────────────
 * Reçoit les notifications de paiement GeniusPay (payment.success
 * / payment.failed / payment.cancelled / payment.expired) et
 * active/renouvelle l'abonnement correspondant.
 *
 * Sécurité (doc officielle GeniusPay) : chaque webhook est signé
 * HMAC-SHA256 de `timestamp + "." + rawBody` avec le secret webhook
 * (préfixe whsec_ côté dashboard), transmis dans le header
 * `X-Webhook-Signature` (hex minuscules). Le timestamp est transmis
 * dans `X-Webhook-Timestamp` (secondes epoch) et DOIT être vérifié
 * pour éviter les attaques par rejeu (fenêtre de 5 minutes ici).
 *
 * Idempotence : GeniusPay peut renvoyer le même webhook plusieurs
 * fois — on ignore si `data.reference` est déjà marqué
 * status='success' en base.
 * ─────────────────────────────────────────────────────────────
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { runAutomations } from '../_shared/automationEngine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GENIUSPAY_WEBHOOK_SECRET = Deno.env.get('GENIUSPAY_WEBHOOK_SECRET') ?? '';

// Fenêtre de tolérance anti-rejeu, en secondes (doc GeniusPay : 5 minutes).
const MAX_TIMESTAMP_DRIFT_SECONDS = 5 * 60;

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
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestampHeader = req.headers.get('x-webhook-timestamp') || '';

    if (!GENIUSPAY_WEBHOOK_SECRET) {
      console.error('[geniuspay-webhook] GENIUSPAY_WEBHOOK_SECRET non configuré');
      return _json({ error: 'server misconfigured' }, 500);
    }

    if (!timestampHeader) {
      return _json({ error: 'timestamp manquant' }, 400);
    }

    // ── Vérification anti-rejeu ──
    const timestampSeconds = Number(timestampHeader);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(timestampSeconds) || Math.abs(nowSeconds - timestampSeconds) > MAX_TIMESTAMP_DRIFT_SECONDS) {
      console.warn('[geniuspay-webhook] Timestamp hors fenêtre autorisée');
      return _json({ error: 'timestamp invalide ou expiré' }, 401);
    }

    // ── Vérification de la signature ──
    const signedPayload = `${timestampHeader}.${rawBody}`;
    const expectedSignature = await hmacHex(GENIUSPAY_WEBHOOK_SECRET, signedPayload);
    if (!signature || !timingSafeEqual(signature.toLowerCase(), expectedSignature)) {
      console.warn('[geniuspay-webhook] Signature invalide');
      return _json({ error: 'invalid signature' }, 401);
    }

    const body = JSON.parse(rawBody);
    const { event, data } = body;

    if (!data?.reference) {
      return _json({ error: 'reference manquante' }, 400);
    }

    const orderReference: string = data.reference;
    const status: string = data.status;
    const transactionId = data.id ?? data.reference;
    const netAmount = data.net_amount ?? null;
    const fees = data.fees ?? null;
    const metadata = data.metadata ?? {};

    // ── Idempotence : ignorer si déjà traité avec succès ──
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('order_reference', orderReference)
      .maybeSingle();

    if (existingPayment?.status === 'success') {
      return _json({ ok: true, message: 'Déjà traité' });
    }

    const isCompleted = event === 'payment.success' && status === 'completed';

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
      console.error('[geniuspay-webhook] metadata incomplet:', metadata);
      return _json({ error: 'metadata incomplet' }, 400);
    }

    // ── Marquer le paiement comme réussi ──
    await supabase
      .from('payments')
      .update({
        status: 'success',
        provider_transaction_id: transactionId,
        net_amount: netAmount,
        fees: fees,
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
      payment_method: 'geniuspay',
      provider: 'geniuspay',
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
        amount: data.amount,
        currency: data.currency || 'XOF',
        orderId: transactionId,
        provider: 'geniuspay',
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
      console.error('[geniuspay-webhook] Échec insertion notification:', notifError.message);
      // On ne bloque pas la réponse pour ça — l'abonnement est déjà activé,
      // seule la notification a échoué. Mais on le loggue pour investigation.
    }

    return _json({ ok: true, plan, expiresAt: expiresAt.toISOString() });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[geniuspay-webhook]', msg);
    return _json({ error: msg }, 500);
  }
});

function _json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}