// api/seo-page.js — Pré-rendu des pages SEO SocialApp (Vercel, Node runtime)
// Renvoie index.html avec title, meta, canonical, Open Graph, JSON-LD et le contenu
// textuel de la page dans la coquille (#shell), lisible par Google sans JavaScript.
// Même mécanique que api/profile.js. Si le slug est inconnu : index.html en 404.
// Les balises injectées portent data-rh="true" : react-helmet-async les remplace
// au lieu de les dupliquer une fois React chargé.

import { SEO_PAGES, SITE } from "../src/data/seoPages.js";

const ALLOWED_HOST = /^(www\.)?socialapp\.work$|^[a-z0-9-]+\.vercel\.app$/i;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const safeJson = (obj) =>
  JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

let shellCache = { html: null, at: 0 };
const SHELL_TTL_MS = 60 * 1000;

async function getShell(origin) {
  if (shellCache.html && Date.now() - shellCache.at < SHELL_TTL_MS) return shellCache.html;
  const r = await fetch(`${origin}/index.html`, {
    redirect: "follow",
    headers: { "x-profile-shell": "1" },
  });
  if (!r.ok) throw new Error(`index.html: HTTP ${r.status}`);
  const html = await r.text();
  shellCache = { html, at: Date.now() };
  return html;
}

// Supprime une balise <meta> existante (elle est ré-injectée dans le bloc head)
function stripMeta(html, attr, key) {
  const re = new RegExp(`<meta\\s+${attr}="${key}"[\\s\\S]*?/>\\s*`, "i");
  return html.replace(re, "");
}

function buildBody(page) {
  const sections = page.sections
    .map((s) => {
      const paras = (s.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("");
      const list = s.list?.length
        ? `<ul>${s.list.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>`
        : "";
      return `<section><h2>${esc(s.h2)}</h2>${paras}${list}</section>`;
    })
    .join("");

  const faq = `<section><h2>Questions fréquentes</h2>${page.faq
    .map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`)
    .join("")}</section>`;

  const related = page.related
    .filter((slug) => SEO_PAGES[slug])
    .map((slug) => `<li><a href="/${slug}">${esc(SEO_PAGES[slug].h1)}</a></li>`)
    .join("");

  return (
    `<div id="shell"><main>` +
    `<h1>${esc(page.h1)}</h1><p>${esc(page.intro)}</p>${sections}${faq}` +
    `<section><h2>À lire aussi</h2><ul>${related}</ul></section>` +
    `<p><a href="/signup">Créer mon profil SocialApp</a> · <a href="/">Accueil</a></p>` +
    `</main></div>`
  );
}

function render(shell, slug, page) {
  const url = `${SITE}/${slug}`;
  const image = `${SITE}/Logo_SocialApp.png`;

  let html = shell;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${esc(page.title)}</title>`);
  for (const [attr, key] of [
    ["name", "description"],
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:image"],
    ["property", "og:url"],
    ["property", "og:type"],
    ["name", "twitter:card"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"],
  ]) {
    html = stripMeta(html, attr, key);
  }
  html = html.replace(/<link\s+rel="canonical"[\s\S]*?\/>\s*/i, "");

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.description,
      url,
      inLanguage: "fr",
      isPartOf: { "@type": "WebSite", name: "SocialApp", url: SITE },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE },
        { "@type": "ListItem", position: 2, name: page.h1, item: url },
      ],
    },
  ];

  const head = [
    `<link data-rh="true" rel="canonical" href="${esc(url)}" />`,
    `<meta data-rh="true" name="description" content="${esc(page.description)}" />`,
    `<meta data-rh="true" property="og:type" content="website" />`,
    `<meta data-rh="true" property="og:title" content="${esc(page.title)}" />`,
    `<meta data-rh="true" property="og:description" content="${esc(page.description)}" />`,
    `<meta data-rh="true" property="og:image" content="${esc(image)}" />`,
    `<meta data-rh="true" property="og:url" content="${esc(url)}" />`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-rh="true" name="twitter:title" content="${esc(page.title)}" />`,
    `<meta data-rh="true" name="twitter:description" content="${esc(page.description)}" />`,
    `<meta data-rh="true" name="twitter:image" content="${esc(image)}" />`,
    `<script data-rh="true" type="application/ld+json">${safeJson(jsonLd)}</script>`,
  ].join("\n  ");

  html = html.replace("<!--PROFILE_HEAD-->", () => head);
  html = html.replace(
    /<!--SHELL_START-->[\s\S]*?<!--SHELL_END-->/,
    () => `<!--SHELL_START-->${buildBody(page)}<!--SHELL_END-->`
  );
  return html;
}

export default async function handler(req, res) {
  // Garde anti-boucle : notre propre fetch de index.html ne doit pas nous rappeler.
  if (req.headers["x-profile-shell"]) {
    res.status(404).send("Not found");
    return;
  }

  const slug = String(req.query?.slug || "").trim().toLowerCase();
  const rawHost = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    .trim();
  const origin = ALLOWED_HOST.test(rawHost) ? `https://${rawHost}` : SITE;

  let shell;
  try {
    shell = await getShell(origin);
  } catch (err) {
    console.error("seo-page: impossible de charger index.html", err);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(502).send("Service momentanément indisponible");
    return;
  }

  const page = Object.hasOwn(SEO_PAGES, slug) ? SEO_PAGES[slug] : null;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (!page) {
    res.setHeader("X-Robots-Tag", "noindex");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=10");
    res.status(404).send(shell);
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(render(shell, slug, page));
}