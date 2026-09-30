import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  // Requête de vérification CORS du navigateur
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { profile_id, referrer } = await req.json();
    if (!profile_id) return json({ success: false, error: "profile_id manquant" }, 400);

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("profile_visits").insert({
      profile_id,
      ip_address: ip,
      user_agent: userAgent,
      referrer,
    });

    if (error) console.error("[track-profile-visit] insert:", error.message);
    return json({ success: !error });
  } catch (e) {
    console.error("[track-profile-visit]", e);
    return json({ success: false }, 500);
  }
});