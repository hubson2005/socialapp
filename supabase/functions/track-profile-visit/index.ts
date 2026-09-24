import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { profile_id, referrer } = await req.json();

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

  return new Response(JSON.stringify({ success: !error }), {
    headers: { "Content-Type": "application/json" },
  });
});
