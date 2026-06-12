// ─── supabase/functions/send-whatsapp/index.ts ───────────────────────────────
// Edge Function : envoi de notifications WhatsApp via Green API (gratuit)
//
// Variables d'environnement à définir dans Supabase Dashboard → Secrets :
//   GREEN_API_ID    → ton idInstance (ex: 1101123456)
//   GREEN_API_TOKEN → ton apiTokenInstance
//
// Configuration :
//   1. Crée un compte sur green-api.com (gratuit)
//   2. Dans le dashboard, scanne le QR code avec WhatsApp
//      (WhatsApp → Appareils liés → Lier un appareil)
//   3. Une fois "authorized", copie idInstance + apiTokenInstance
//   4. Ajoute-les dans Supabase Secrets
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
    const GREEN_API_ID    = Deno.env.get('GREEN_API_ID');
    const GREEN_API_TOKEN = Deno.env.get('GREEN_API_TOKEN');
    const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!GREEN_API_ID || !GREEN_API_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GREEN_API_ID ou GREEN_API_TOKEN non configurés',
          hint: 'Ajoutez ces secrets dans Supabase → Settings → Edge Functions → Secrets',
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

    // ── 4. Appel Green API ───────────────────────────────────────────────────
    // Format chatId Green API : "<numéro>@c.us"
    const chatId = `${cleanPhone}@c.us`;
    const greenApiUrl = `https://api.green-api.com/waInstance${GREEN_API_ID}/sendMessage/${GREEN_API_TOKEN}`;

    const greenRes = await fetch(greenApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    });

    const greenJson = await greenRes.json();
    // Succès si Green API renvoie un idMessage
    const greenSuccess = greenRes.ok && !!greenJson.idMessage;

    console.log(`Green API → HTTP ${greenRes.status} : ${JSON.stringify(greenJson)}`);

    // ── 5. Mise à jour statut BDD ────────────────────────────────────────────
    if (notifId) {
      await supabase
        .from('wa_boost_notifications')
        .update({
          status:        greenSuccess ? 'sent' : 'failed',
          external_id:   greenJson.idMessage || null,
          error_message: greenSuccess
            ? null
            : `Green API HTTP ${greenRes.status}: ${JSON.stringify(greenJson).slice(0, 500)}`,
        })
        .eq('id', notifId);
    }

    // ── 6. Réponse ───────────────────────────────────────────────────────────
    if (!greenSuccess) {
      return new Response(
        JSON.stringify({
          success: false,
          error:   `Green API erreur (HTTP ${greenRes.status})`,
          detail:  greenJson,
          hint:    'Vérifiez que votre instance Green API est "authorized" (QR scanné)',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, notif_id: notifId, provider: 'green-api', id_message: greenJson.idMessage }),
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