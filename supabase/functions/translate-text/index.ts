// supabase/functions/translate-text/index.ts
// Traduction de textes courts (profil public SocialApp) via Google Cloud Translation v2.
//
// Déploiement :
//   supabase secrets set GOOGLE_TRANSLATE_API_KEY=xxxxxxxx
//   supabase functions deploy translate-text
//
// Conseil : restreindre la clé Google à l'API « Cloud Translation » uniquement.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const MAX_TEXTS = 40;        // textes par requête
const MAX_LEN = 2000;        // caractères par texte
const MAX_TOTAL = 12000;     // caractères par requête (protège le quota)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const { texts, target } = await req.json();
    if (!Array.isArray(texts) || texts.length === 0 || !['en', 'fr'].includes(target)) {
      return json({ error: 'bad_request' }, 400);
    }

    const q = texts.slice(0, MAX_TEXTS).map((t: unknown) => String(t ?? '').slice(0, MAX_LEN));
    if (q.reduce((n: number, t: string) => n + t.length, 0) > MAX_TOTAL) {
      return json({ error: 'too_large' }, 413);
    }

    const key = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
    if (!key) return json({ error: 'not_configured' }, 500);

    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, target, format: 'text' }),
    });
    if (!res.ok) return json({ error: 'provider_error', status: res.status }, 502);

    const d = await res.json();
    const translations = (d?.data?.translations ?? []).map((x: { translatedText: string }) => x.translatedText);
    if (translations.length !== q.length) return json({ error: 'bad_provider_response' }, 502);

    return json({ translations });
  } catch (_e) {
    return json({ error: 'server_error' }, 500);
  }
});