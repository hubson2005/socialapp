// ─── supabase/functions/send-whatsapp/index.ts ───────────────────────────────
// Edge Function : envoi de notifications WhatsApp via Whapi.cloud
//
// Variables d'environnement à définir dans Supabase Dashboard → Secrets :
//   WHAPI_TOKEN → ton token API Whapi.cloud
//
// Configuration :
//   1. Crée un compte sur whapi.cloud (essai gratuit 5 jours)
//   2. Crée un channel → scanne le QR code avec WhatsApp
//   3. Copie le "API Token" du channel
//   4. Ajoute-le dans Supabase → Settings → Edge Functions → Secrets
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 1. Variables d'environnement ─────────────────────────────────────────
    const WHAPI_TOKEN     = Deno.env.get('WHAPI_TOKEN');
    const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!WHAPI_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'WHAPI_TOKEN non configuré',
          hint: 'Ajoutez WHAPI_TOKEN dans Supabase → Settings → Edge Functions → Secrets',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 2. Lecture du body ───────────────────────────────────────────────────
    const body = await req.json();
    const {
      phone,             // string  — numéro destinataire sans +
      message,           // string  — texte du message
      profile_id,        // string  — UUID du profil link_profiles
      boost_id,          // string? — optionnel
      notification_type, // string  — type de notification
    } = body;

    if (!phone || !message || !profile_id || !notification_type) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Champs requis manquants : phone, message, profile_id, notification_type',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalisation du numéro (supprime +, espaces, tirets)
    const cleanPhone = phone.replace(/[\s\-\+]/g, '');

    // ── 3. Enregistrement BDD (statut pending) ───────────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

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

    // ── 4. Appel Whapi.cloud ─────────────────────────────────────────────────
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

    // ── 5. Mise à jour statut BDD ────────────────────────────────────────────
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

    // ── 6. Réponse ───────────────────────────────────────────────────────────
    if (!whapiSuccess) {
      return new Response(
        JSON.stringify({
          success: false,
          error:   `Whapi erreur (HTTP ${whapiRes.status})`,
          detail:  whapiJson,
          hint:    'Vérifiez que votre channel Whapi est connecté (QR scanné) et le token correct',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, notif_id: notifId, provider: 'whapi', detail: whapiJson }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('send-whatsapp error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});