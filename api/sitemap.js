import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.socialapp.work";
const PAGE_SIZE = 1000;   // Supabase renvoie au maximum 1000 lignes par requête
const MAX_URLS = 50000;   // limite d'un fichier sitemap (au-delà : sitemap index)

// Mêmes valeurs que api/profile.js (mêmes noms de variables, même URL de repli)
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://gxguirtpunmiiuxpxlap.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_KEY;

// Pages publiques indexables (pas de /login, /dashboard…)
const STATIC_PAGES = ["/", "/privacy-policy", "/terms-of-service"];

// Noms réservés : ce ne sont pas des profils (alignés sur la règle de vercel.json)
const RESERVED = new Set([
  "api", "assets", "fonts", "admin", "dashboard", "login", "signup", "register",
  "pricing", "auth", "reset-password", "forgot-password", "delete-account",
  "e", "event", "events", "booking", "marketplace", "payment", "success",
  "cancel", "terms", "terms-of-service", "privacy", "privacy-policy", "blog",
  "sitemap", "sitemap.xml", "robots", "robots.txt", "manifest", "favicon",
  "preview-profile", "r", "webhooks", "home",
]);

// Identifiant valide : même jeu de caractères que la règle /api/profile de vercel.json
// (lettres, chiffres, tiret, souligné — pas de point)
const VALID_USERNAME = /^[A-Za-z0-9_-]{1,60}$/;

const escapeXml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

async function fetchAllProfiles(supabase) {
  const rows = [];
  for (let from = 0; rows.length < MAX_URLS; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("link_profiles")
      .select("username, updated_at")
      .not("username", "is", null)
      // .eq("is_public", true)   // ← à activer si une colonne indique qu'un profil est public/actif
      .order("username", { ascending: true }) // ordre stable, indispensable pour paginer
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

export default async function handler(req, res) {
  try {
    if (!SUPABASE_KEY) {
      throw new Error(
        "Clé Supabase absente : définir SUPABASE_ANON_KEY dans les variables d'environnement Vercel"
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const profiles = await fetchAllProfiles(supabase);

    const seen = new Set();
    const urls = [];

    for (const page of STATIC_PAGES) {
      urls.push(`  <url>\n    <loc>${BASE_URL}${page}</loc>\n  </url>`);
    }

    for (const p of profiles) {
      const name = String(p.username || "").trim();
      const key = name.toLowerCase();
      if (!VALID_USERNAME.test(name) || RESERVED.has(key) || seen.has(key)) continue;
      seen.add(key);

      const loc = `${BASE_URL}/${encodeURIComponent(name)}`;
      const d = p.updated_at ? new Date(p.updated_at) : null;
      const lastmod =
        d && !Number.isNaN(d.getTime()) ? `\n    <lastmod>${d.toISOString()}</lastmod>` : "";
      urls.push(`  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod}\n  </url>`);
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);
  } catch (err) {
    console.error("sitemap error:", err);
    // TODO : une fois le sitemap validé, remplacer par .send("Erreur sitemap")
    const detail = err?.message || err?.details || JSON.stringify(err);
    res
      .status(500)
      .setHeader("Content-Type", "text/plain; charset=utf-8")
      .send("Erreur sitemap: " + detail);
  }
}