import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const { data: profiles, error } = await supabase
      .from("link_profiles")
      .select("username, updated_at")
      .not("username", "is", null);

    if (error) throw error;

    const baseUrl = "https://www.socialapp.work";

    const staticPages = [
      "",
      "/privacy-policy",
      "/terms-of-service",
    ];

    let urls = "";

    staticPages.forEach((page) => {
      urls += `
      <url>
        <loc>${baseUrl}${page}</loc>
        <changefreq>weekly</changefreq>
        <priority>${page === "" ? "1.0" : "0.5"}</priority>
      </url>`;
    });

    profiles.forEach((profile) => {
      urls += `
      <url>
        <loc>${baseUrl}/${profile.username}</loc>
        <lastmod>${new Date(
          profile.updated_at || Date.now()
        ).toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>

<urlset
xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls}

</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "s-maxage=3600");
    res.status(200).send(xml);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur sitemap");
  }
}