// api/profile.js — Pré-rendu léger des profils publics SocialApp (Vercel, Node runtime)
//
// Rôle : quand quelqu'un ouvre https://www.socialapp.work/<username>, cette fonction
//  1. lit le profil dans Supabase (table link_profiles, colonne username, insensible à la casse)
//     avec la clé publique (les règles RLS s'appliquent comme dans le navigateur) ;
//  2. renvoie le même index.html que d'habitude, mais avec, déjà dans le HTML :
//       - un <link rel="preload" as="image" fetchpriority="high"> vers l'image principale,
//       - window.__PROFILE__ (les données du profil, pour éviter l'attente de l'API),
//       - le titre / description / image Open Graph du profil (aperçus WhatsApp, Facebook…),
//       - le nom et la bio dans la coquille (contenu visible avant même le JS) ;
//  3. met le résultat en cache sur le CDN (60 s + revalidation en arrière-plan).
// En cas de problème (profil introuvable, Supabase lent…), elle renvoie simplement
// l'index.html normal : l'application se comporte alors comme avant.

const SITE = 'https://www.socialapp.work';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gxguirtpunmiiuxpxlap.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_KEY ||
  '';

// Hôtes autorisés pour aller chercher index.html (évite de fetch un hôte arbitraire).
const ALLOWED_HOST = /^(www\.)?socialapp\.work$|^[a-z0-9-]+\.vercel\.app$/i;

// À ADAPTER : routes de premier niveau de l'application qui ne sont PAS des profils.
// (À garder synchronisé avec les routes de App.jsx et la liste du même nom dans vercel.json.)
const RESERVED = new Set([
  'api', 'assets', 'fonts', 'admin', 'dashboard', 'login', 'signup', 'register', 'pricing',
  'auth', 'reset-password', 'forgot-password', 'e', 'event', 'events', 'booking',
  'marketplace', 'payment', 'success', 'cancel', 'terms', 'privacy',
  'blog', 'sitemap', 'robots', 'manifest', 'favicon',
]);
const VALID_USERNAME = /^[A-Za-z0-9_-]{1,64}$/;

// ---------- utilitaires ----------
const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// JSON sûr à l'intérieur d'un <script> (empêche la fermeture de balise et les séparateurs de ligne)
const safeJson = (obj) =>
  JSON.stringify(obj).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const httpsUrl = (u) => (typeof u === 'string' && /^https:\/\//i.test(u) ? u : null);

// Remplace le contenu d'une balise <meta> existante (gère les balises sur plusieurs lignes)
function setMeta(html, attr, key, content) {
  const re = new RegExp(`<meta\\s+${attr}="${key}"[\\s\\S]*?/>`, 'i');
  return html.replace(re, () => `<meta ${attr}="${key}" content="${esc(content)}" />`);
}

// Image principale du profil (celle qui devient le LCP). À VÉRIFIER : doit être exactement
// la même URL que celle affichée par le composant de la page publique.
function pickHero(p) {
  return httpsUrl(p.is_event ? p.event_image_url : p.banner_url);
}

// ---------- coquille HTML (index.html du déploiement), mise en cache mémoire ----------
// TTL court : après un déploiement, un vieux index.html référencerait des assets disparus.
let shellCache = { html: null, at: 0 };
const SHELL_TTL_MS = 60 * 1000;

async function getShell(origin) {
  if (shellCache.html && Date.now() - shellCache.at < SHELL_TTL_MS) return shellCache.html;
  const r = await fetch(`${origin}/index.html`, { redirect: 'follow', headers: { 'x-profile-shell': '1' } });
  if (!r.ok) throw new Error(`index.html: HTTP ${r.status}`);
  const html = await r.text();
  shellCache = { html, at: Date.now() };
  return html;
}

// ---------- lecture du profil dans Supabase ----------
async function fetchProfile(username) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    // ilike = même comportement que PublicProfile.jsx (insensible à la casse).
    // « _ » est un joker en SQL LIKE : on l'échappe pour ne pas matcher un autre profil.
    const pattern = username.replace(/_/g, '\\_');
    const url = `${SUPABASE_URL}/rest/v1/link_profiles?username=ilike.${encodeURIComponent(pattern)}&select=*&limit=3`;
    const headers = { apikey: SUPABASE_KEY, Accept: 'application/json' };
    // Les clés « legacy » sont des JWT (eyJ…) ; les nouvelles clés sb_publishable_… ne doivent
    // pas être envoyées dans Authorization.
    if (SUPABASE_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SUPABASE_KEY}`;
    const r = await fetch(url, { headers, signal: ctrl.signal });
    if (!r.ok) return null;
    const rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    return rows.find((row) => row.username === username) || rows[0];
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- injection dans le HTML ----------
function render(shell, p) {
  const name = p.display_name || p.username;
  const bio = (p.bio || '').trim();
  const description = bio ? bio.slice(0, 160) : 'Retrouvez mon profil digital sur SocialApp.';
  const hero = pickHero(p);
  const image = hero || httpsUrl(p.avatar_url) || `${SITE}/Logo_SocialApp.png`;
  const pageUrl = `${SITE}/${encodeURIComponent(p.username)}`;
  const title = `${name} – SocialApp`;

  let html = shell;

  // 1) SEO / aperçus de partage
  html = html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${esc(title)}</title>`);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:url', pageUrl);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', image);

  // 2) Preload de l'image principale + données du profil
  const head = [
    hero ? `<link rel="preload" as="image" href="${esc(hero)}" fetchpriority="high" />` : '',
    `<script>window.__PROFILE__=${safeJson(p)};</script>`,
  ].filter(Boolean).join('\n  ');
  html = html.replace('<!--PROFILE_HEAD-->', () => head);

  // 3) Coquille avec le vrai contenu (visible avant le JS)
  const shellHtml =
    `<div id="shell"><h1>${esc(name)}</h1>` + (bio ? `<p>${esc(bio.slice(0, 200))}</p>` : '') + `</div>`;
  html = html.replace(/<!--SHELL_START-->[\s\S]*?<!--SHELL_END-->/, () => `<!--SHELL_START-->${shellHtml}<!--SHELL_END-->`);

  return html;
}

// ---------- handler ----------
export default async function handler(req, res) {
  // Garde anti-boucle : si un rewrite renvoyait /index.html vers cette fonction,
  // notre propre fetch de la coquille ne doit pas se rappeler indéfiniment.
  if (req.headers['x-profile-shell']) {
    res.status(404).send('Not found');
    return;
  }

  const username = String(req.query?.username || '').trim();
  const rawHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const origin = ALLOWED_HOST.test(rawHost) ? `https://${rawHost}` : SITE;

  let shell;
  try {
    shell = await getShell(origin);
  } catch (err) {
    console.error('profile: impossible de charger index.html', err);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).send('Service momentanément indisponible');
    return;
  }

  let profile = null;
  if (SUPABASE_KEY && VALID_USERNAME.test(username) && !RESERVED.has(username.toLowerCase())) {
    profile = await fetchProfile(username);
  } else if (!SUPABASE_KEY) {
    console.warn('profile: clé Supabase publique absente (SUPABASE_ANON_KEY) — pré-rendu désactivé');
  }

  const html = profile ? render(shell, profile) : shell;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    profile
      ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=600'
      : 'public, max-age=0, s-maxage=10, stale-while-revalidate=60'
  );
  res.status(200).send(html);
}