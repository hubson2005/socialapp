// ─── supabase/functions/fetch-boost-analytics/index.ts ───────────────────────
// Edge Function : aggrège les stats d'un boost depuis boost_analytics
// Appelée par BoostAnalyticsPanel pour récupérer les données de perf
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
    const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const body = await req.json();
    const { profile_id, boost_id, days = 30 } = body;

    if (!profile_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'profile_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

    // ── 1. Snapshots journaliers ──────────────────────────────────────────────
    let query = supabase
      .from('boost_analytics')
      .select('*')
      .eq('profile_id', profile_id)
      .order('snapshot_date', { ascending: true })
      .gte('snapshot_date', new Date(Date.now() - days * 86400000).toISOString().split('T')[0]);

    if (boost_id) query = query.eq('boost_id', boost_id);

    const { data: snapshots, error } = await query;
    if (error) throw error;

    // ── 2. Totaux agrégés ─────────────────────────────────────────────────────
    const totals = (snapshots || []).reduce(
      (acc, row) => ({
        impressions:     acc.impressions     + (row.impressions     || 0),
        reach:           acc.reach           + (row.reach           || 0),
        clicks:          acc.clicks          + (row.clicks          || 0),
        profile_views:   acc.profile_views   + (row.profile_views   || 0),
        leads_count:     acc.leads_count     + (row.leads_count     || 0),
        whatsapp_clicks: acc.whatsapp_clicks + (row.whatsapp_clicks || 0),
      }),
      { impressions: 0, reach: 0, clicks: 0, profile_views: 0, leads_count: 0, whatsapp_clicks: 0 }
    );

    // ── 3. Taux de conversion ─────────────────────────────────────────────────
    const ctr = totals.impressions > 0
      ? ((totals.clicks / totals.impressions) * 100).toFixed(2)
      : '0.00';

    const conversion_rate = totals.profile_views > 0
      ? ((totals.leads_count / totals.profile_views) * 100).toFixed(2)
      : '0.00';

    // ── 4. Boosts actifs du profil ────────────────────────────────────────────
    const { data: boosts } = await supabase
      .from('profile_boosts')
      .select('id, boost_type, status, start_date, end_date, networks, amount')
      .eq('profile_id', profile_id)
      .order('created_at', { ascending: false })
      .limit(10);

    return new Response(
      JSON.stringify({
        success: true,
        snapshots: snapshots || [],
        totals,
        rates: { ctr: parseFloat(ctr), conversion_rate: parseFloat(conversion_rate) },
        boosts: boosts || [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('fetch-boost-analytics error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});