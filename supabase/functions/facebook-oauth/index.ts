import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, accessToken, pageId } = await req.json()

    let url = ''

    if (action === 'get_pages') {
      url = `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    } else if (action === 'get_instagram') {
      url = `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
    } else if (action === 'get_ig_username') {
      url = `https://graph.facebook.com/v19.0/${pageId}?fields=username&access_token=${accessToken}`
    } else {
      throw new Error('Action inconnue')
    }

    const response = await fetch(url)
    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})