// middleware.js — à placer à la RACINE du projet (à côté de vercel.json)
//
// Rôle : quand un crawler (WhatsApp, Facebook, Twitter/X, LinkedIn, Google...)
// demande une page /:username ou /blog/:slug, on lui sert du HTML dont le
// <head> contient déjà les bonnes meta tags (title, og:image, description,
// JSON-LD). Les vrais visiteurs humains ne voient AUCUN changement : ils
// continuent de recevoir la SPA normale, qui affiche ensuite les mêmes infos
// via le composant <SEO /> existant (react-helmet-async).
//
// Installation : npm install @vercel/edge

import { next } from '@vercel/edge';
import blogPosts from './src/data/blogPosts.js';

export const config = {
  // Exclut les fichiers statiques (tout ce qui a une extension : .js, .png, .css...)
  // et les routes déjà gérées ailleurs (api, webhooks).
  matcher: ['/((?!api/|webhooks/|.*\\.[\\w]+$).*)'],
};

// Crawlers de prévisualisation / indexation qu'on veut servir en HTML statique
const BOT_UA =
  /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Googlebot|bingbot|Pinterest|redditbot|SkypeUriPreview|W3C_Validator|Applebot|vkShare/i;

// Segments de 1er niveau déjà utilisés par une route existante (src/App.jsx) —
// ne doivent jamais être interprétés comme un "username" de profil public.
const RESERVED = new Set([
  'login', 'reset-password', 'dashboard', 'privacy-policy',
  'privacy-policy.html', 'politique-de-confidentialite',
  'terms-of-service', 'privacy', 'terms', 'delete-account',
  'form', 'blog', 'home', 'sitemap.xml', 'manifest.json',
]);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = 'https://www.socialapp.work';
const DEFAULT_IMAGE = `${SITE_URL}/Logo_SocialApp.png`;

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMetaTags({ title, description, image, url, type = 'website', jsonLd }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description || '');
  const safeImage = image || DEFAULT_IMAGE;

  return `
<title>${safeTitle}</title>
<meta name="description" content="${safeDesc}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="${type}" />
<meta property="og:site_name" content="SocialApp" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${safeImage}" />
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}`;
}

async function getProfileMeta(username) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/link_profiles?username=eq.${encodeURIComponent(username)}&select=username,display_name,bio,avatar_url`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  if (!res.ok) return null;

  const rows = await res.json();
  const profile = rows[0];
  if (!profile) return null;

  return buildMetaTags({
    title: `${profile.display_name} | SocialApp`,
    description: profile.bio || `Découvrez le profil de ${profile.display_name} sur SocialApp.`,
    image: profile.avatar_url,
    url: `${SITE_URL}/${profile.username}`,
    type: 'profile',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.display_name,
      url: `${SITE_URL}/${profile.username}`,
      image: profile.avatar_url,
    },
  });
}

function getBlogMeta(slug) {
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return null;

  return buildMetaTags({
    title: `${post.title} | Blog SocialApp`,
    description: post.description || post.excerpt,
    url: `${SITE_URL}/blog/${post.slug}`,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: post.date,
      dateModified: post.updatedAt || post.date,
      author: { '@type': 'Organization', name: post.author || 'SocialApp' },
    },
  });
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';

  // On ne touche à rien pour les vrais visiteurs : ils suivent le chemin normal
  // (la réécriture existante de vercel.json vers /index.html s'applique ensuite).
  if (!BOT_UA.test(ua)) return next();

  const { pathname } = new URL(request.url);
  const segments = pathname.split('/').filter(Boolean);

  let metaHtml = null;

  if (segments.length === 2 && segments[0] === 'blog') {
    metaHtml = getBlogMeta(decodeURIComponent(segments[1]));
  } else if (segments.length === 1 && !RESERVED.has(segments[0])) {
    metaHtml = await getProfileMeta(decodeURIComponent(segments[0]));
  }

  // Ni profil ni article trouvé (ou route non concernée) → comportement normal
  if (!metaHtml) return next();

  const indexRes = await fetch(new URL('/index.html', request.url));
  let html = await indexRes.text();

  // On retire les meta tags génériques par défaut pour éviter les doublons
  html = html.replace(/<title>.*?<\/title>/s, '');
  html = html.replace(/<meta name="description"[^>]*>/g, '');
  html = html.replace(/<meta property="og:[^>]*>/g, '');
  html = html.replace(/<meta name="twitter:[^>]*>/g, '');

  html = html.replace('</head>', `${metaHtml}\n</head>`);

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Évite de recontacter Supabase à chaque partage — 1h de cache pour les bots
      'cache-control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}