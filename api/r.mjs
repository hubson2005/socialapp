// Vercel Serverless Function — GET /r/:code  (réécrit vers /api/r?code=:code, cf. vercel.json)
// Enregistre le clic (IP complète, géoloc approx., appareil, source) puis redirige.
//
// Variables d'environnement Vercel (Settings → Environment Variables) — SANS préfixe VITE_ :
//   SUPABASE_URL                 ex. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    clé service_role (JAMAIS dans le code client)

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BOT_RE = /bot|crawler|spider|facebookexternalhit|facebot|whatsapp|telegrambot|twitterbot|slackbot|linkedinbot|pinterest|embedly|discordbot|preview|curl|wget|python-requests|headless|monitor/i;

export function parseUA(ua = '') {
  const device = /ipad|tablet/i.test(ua) ? 'Tablette' : /mobi|iphone|android/i.test(ua) ? 'Mobile' : 'Ordinateur';

  let os = 'Autre';
  if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os x|macintosh/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Autre';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';

  // Navigateurs intégrés aux applications : indiquent le réseau d'origine du clic
  let source = null;
  if (/instagram/i.test(ua)) source = 'Instagram';
  else if (/fban|fbav|fb_iab/i.test(ua)) source = 'Facebook';
  else if (/musical_ly|bytedance|tiktok/i.test(ua)) source = 'TikTok';
  else if (/linkedinapp/i.test(ua)) source = 'LinkedIn';
  else if (/snapchat/i.test(ua)) source = 'Snapchat';
  else if (/twitter/i.test(ua)) source = 'X';
  else if (/pinterest/i.test(ua)) source = 'Pinterest';
  else if (/whatsapp/i.test(ua)) source = 'WhatsApp';
  else if (/telegram/i.test(ua)) source = 'Telegram';

  return { device, os, browser, source };
}

export function sourceFromReferrer(ref = '') {
  if (!ref) return null;
  let host = '';
  try { host = new URL(ref).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; }
  const map = [
    ['instagram.com', 'Instagram'], ['facebook.com', 'Facebook'], ['fb.com', 'Facebook'], ['l.facebook.com', 'Facebook'],
    ['tiktok.com', 'TikTok'], ['linkedin.com', 'LinkedIn'], ['t.co', 'X'], ['x.com', 'X'], ['twitter.com', 'X'],
    ['youtube.com', 'YouTube'], ['pinterest.', 'Pinterest'], ['snapchat.com', 'Snapchat'],
    ['wa.me', 'WhatsApp'], ['whatsapp.com', 'WhatsApp'], ['t.me', 'Telegram'], ['telegram.org', 'Telegram'],
  ];
  for (const [needle, label] of map) if (host.includes(needle)) return label;
  return host;
}

export function clientIp(headers = {}, fallback = '') {
  const xff = headers['x-forwarded-for'];
  const first = (Array.isArray(xff) ? xff[0] : xff || '').split(',')[0].trim();
  return first || headers['x-real-ip'] || fallback || null;
}

const dec = (v) => { try { return v ? decodeURIComponent(v) : null; } catch { return v || null; } };

async function sb(path, init = {}) {
  return fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

function notFound(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lien introuvable</title><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f5fa;color:#151329"><div style="text-align:center;padding:24px"><h1 style="font-size:20px">Lien introuvable</h1><p style="color:#6b6f85">Ce lien n’existe pas ou a été désactivé.</p></div></body>');
}

export default async function handler(req, res) {
  const code = String(req.query?.code || '').trim();
  if (!/^[A-Za-z0-9_-]{4,32}$/.test(code)) return notFound(res);
  if (!SB_URL || !SB_KEY) {
    console.error('[r] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants');
    res.statusCode = 500; return res.end('Configuration serveur manquante');
  }

  try {
    const r = await sb(`tracked_links?code=eq.${encodeURIComponent(code)}&select=id,destination_url,active&limit=1`);
    const rows = r.ok ? await r.json() : [];
    const link = rows[0];
    if (!link || !link.active || !/^https?:\/\//i.test(link.destination_url || '')) return notFound(res);

    const h = req.headers || {};
    const ua = h['user-agent'] || '';
    const ref = h['referer'] || '';
    const { device, os, browser, source: uaSource } = parseUA(ua);

    const click = {
      link_id: link.id,
      ip: clientIp(h, req.socket?.remoteAddress),
      country: h['x-vercel-ip-country'] || null,
      region: dec(h['x-vercel-ip-country-region']),
      city: dec(h['x-vercel-ip-city']),
      device, os, browser,
      source: uaSource || sourceFromReferrer(ref),
      referrer: ref || null,
      user_agent: ua.slice(0, 400),
      is_bot: BOT_RE.test(ua) || !ua,
    };

    // On attend l'écriture (sinon la fonction peut être gelée avant la fin), mais jamais au détriment de la redirection.
    await sb('tracked_clicks', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(click) })
      .then(async (x) => { if (!x.ok) console.error('[r] insert click', x.status, await x.text()); })
      .catch((e) => console.error('[r] insert click', e));

    res.statusCode = 302;
    res.setHeader('Location', link.destination_url);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.end();
  } catch (e) {
    console.error('[r] erreur', e);
    res.statusCode = 500; res.end('Erreur serveur');
  }
}