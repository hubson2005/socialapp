// ─── supabase/functions/send-whatsapp/index.ts ───────────────────────────────
// Edge Function : envoi de notifications WhatsApp via Whapi.cloud
//
// Variables d'environnement à définir dans Supabase Dashboard → Secrets :
//   WHAPI_TOKEN              → ton token API Whapi.cloud
//   INTERNAL_FUNCTION_SECRET → secret partagé pour les appels serveur → serveur
//
// Autorisation (une des deux preuves est exigée) :
//   1. En-tête x-internal-secret = INTERNAL_FUNCTION_SECRET   (autres Edge Functions)
//   2. Authorization: Bearer <session utilisateur> dont l'utilisateur est
//      propriétaire du profile_id envoyé dans le body        (dashboard)
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Comparaison en temps constant (évite de révéler le secret par le temps de réponse)
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 1. Variables d'environnement ─────────────────────────────────────────
    const WHAPI_TOKEN     = Deno.env.get('WHAPI_TOKEN');
    const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const INTERNAL_SECRET  = Deno.env.get('INTERNAL_FUNCTION_SECRET') ?? '';

    if (!WHAPI_TOKEN) {
      return json({
        success: false,
        error: 'WHAPI_TOKEN non configuré',
        hint: 'Ajoutez WHAPI_TOKEN dans Supabase → Settings → Edge Functions → Secrets',
      }, 500);
    }

    // ── 2. Lecture du body ───────────────────────────────────────────────────
    const body = await req.json();
    const {
      phone,             // string  — numéro destinataire sans +
      message,           // string  — texte du message
      profile_id,        // number|string — id du profil link_profiles
      boost_id,          // string? — optionnel
      notification_type, // string  — type de notification
    } = body;

    if (!phone || !message || !profile_id || !notification_type) {
      return json({
        success: false,
        error: 'Champs requis manquants : phone, message, profile_id, notification_type',
      }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

    // ── 3. Autorisation ──────────────────────────────────────────────────────
    let authorized = false;

    // 3a. Appel serveur → serveur (secret interne)
    const internalHeader = req.headers.get('x-internal-secret') ?? '';
    if (INTERNAL_SECRET && internalHeader && safeEqual(internalHeader, INTERNAL_SECRET)) {
      authorized = true;
    }

    // 3b. Appel depuis le dashboard (session utilisateur propriétaire du profil)
    if (!authorized) {
      const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
      if (token) {
        const { data: userData } = await supabase.auth.getUser(token);
        const userId = userData?.user?.id;
        if (userId) {
          const { data: owned } = await supabase
            .from('link_profiles')
            .select('id')
            .eq('id', profile_id)
            .eq('user_id', userId)
            .maybeSingle();
          authorized = !!owned;
        }
      }
    }

    if (!authorized) {
      return json({ success: false, error: 'Non autorisé' }, 401);
    }

    // Normalisation du numéro (supprime +, espaces, tirets)
    const cleanPhone = String(phone).replace(/[\s\-\+]/g, '');

    // ── 4. Enregistrement BDD (statut pending) ───────────────────────────────
    const { data: notifRow, error: insertErr } = await supabase
      .from('wa_boost_notifications')
      .insert({
        profile_id,
        boost_id:          boost_id || null,
        recipient_phone:   cleanPhone,
        notification_type,
        message_body:      message,
        status:            'pending',
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('INSERT wa_boost_notifications:', insertErr);
    }

    const notifId = notifRow?.id;

    // ── 5. Appel Whapi.cloud ─────────────────────────────────────────────────
    // Doc : https://whapi.readme.io/reference/sendmessagetext
    const whapiUrl = 'https://gate.whapi.cloud/messages/text';

    const whapiRes = await fetch(whapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
      },
      body: JSON.stringify({
        to: cleanPhone,
        body: message,
      }),
    });

    const whapiJson = await whapiRes.json();
    // Succès si Whapi renvoie un id de message et sent=true
    const whapiSuccess = whapiRes.ok && (whapiJson.sent === true || !!whapiJson.message?.id);

    console.log(`Whapi → HTTP ${whapiRes.status} : ${JSON.stringify(whapiJson)}`);

    // ── 6. Mise à jour statut BDD ────────────────────────────────────────────
    if (notifId) {
      await supabase
        .from('wa_boost_notifications')
        .update({
          status:        whapiSuccess ? 'sent' : 'failed',
          external_id:   whapiJson.message?.id || whapiJson.id || null,
          error_message: whapiSuccess
            ? null
            : `Whapi HTTP ${whapiRes.status}: ${JSON.stringify(whapiJson).slice(0, 500)}`,
        })
        .eq('id', notifId);
    }

    // ── 7. Réponse ───────────────────────────────────────────────────────────
    if (!whapiSuccess) {
      return json({
        success: false,
        error:   `Whapi erreur (HTTP ${whapiRes.status})`,
        detail:  whapiJson,
        hint:    'Vérifiez que votre channel Whapi est connecté (QR scanné) et le token correct',
      }, 502);
    }

    return json({ success: true, notif_id: notifId, provider: 'whapi', detail: whapiJson });

  } catch (err) {
    console.error('send-whatsapp error:', err);
    return json({ success: false, error: (err as Error).message }, 500);
  }
});