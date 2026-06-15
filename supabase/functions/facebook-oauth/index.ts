import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = { 'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://socialapp.work', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const FB_VERSION = 'v21.0'
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Non autorise')
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'))
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Session invalide')
    const { action, accessToken, pageId } = await req.json()
    if (!accessToken) throw new Error('Token manquant')
    const fbHeaders = { Authorization: 'Bearer ' + accessToken }
    let url = ''
    if (action === 'get_pages') url = 'https://graph.facebook.com/' + FB_VERSION + '/me/accounts'
    else if (action === 'get_instagram') url = 'https://graph.facebook.com/' + FB_VERSION + '/' + pageId + '?fields=instagram_business_account'
    else if (action === 'get_ig_username') url = 'https://graph.facebook.com/' + FB_VERSION + '/' + pageId + '?fields=username'
    else throw new Error('Action inconnue : ' + action)
    const response = await fetch(url, { headers: fbHeaders })
    const data = await response.json()
    if (data.error) throw new Error('Facebook API: ' + data.error.message + ' (code ' + data.error.code + ')')
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})