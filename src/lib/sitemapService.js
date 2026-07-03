const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");

const BASE_URL = "https://www.socialapp.work";
const MAX_URLS_PER_FILE = 45000; // marge de sécurité sous la limite officielle de 50 000

// ---------------------------------------------------------------------------
// Cache mémoire simple (TTL). En prod multi-instance, remplacez par Redis.
// ---------------------------------------------------------------------------
const cache = new Map(); // key -> { xml, expiresAt }
const TTL_MS = 60 * 60 * 1000; // 1h

function getCached(key) {
  const entry = cache.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.xml;
      return null;
      }

      function setCached(key, xml) {
        cache.set(key, { xml, expiresAt: Date.now() + TTL_MS });
        }

        function invalidateCache(prefix = "") {
          for (const key of cache.keys()) {
              if (key.startsWith(prefix)) cache.delete(key);
                }
                }

                // ---------------------------------------------------------------------------
                // Génération d'un fichier sitemap XML à partir d'une liste d'entrées
                // entries: [{ url, lastmod, changefreq, priority }]
                // ---------------------------------------------------------------------------
                async function buildSitemapXml(entries) {
                  const stream = new SitemapStream({ hostname: BASE_URL });
                    const xml = await streamToPromise(Readable.from(entries).pipe(stream)).then(
                        (data) => data.toString()
                          );
                            return xml;
                            }

                            // ---------------------------------------------------------------------------
                            // Découpe une liste d'entrées en plusieurs pages selon MAX_URLS_PER_FILE
                            // ---------------------------------------------------------------------------
                            function paginate(entries, pageSize = MAX_URLS_PER_FILE) {
                              const pages = [];
                                for (let i = 0; i < entries.length; i += pageSize) {
                                    pages.push(entries.slice(i, i + pageSize));
                                      }
                                        return pages.length ? pages : [[]];
                                        }

                                        // ---------------------------------------------------------------------------
                                        // Génère le sitemap-index.xml à partir d'une liste de { loc, lastmod }
                                        // ---------------------------------------------------------------------------
                                        function buildSitemapIndexXml(sitemaps) {
                                          const items = sitemaps
                                              .map(
                                                    (s) => `  <sitemap>
                                                        <loc>${escapeXml(s.loc)}</loc>
                                                            <lastmod>${s.lastmod}</lastmod>
                                                              </sitemap>`
                                                                  )
                                                                      .join("\n");

                                                                        return `<?xml version="1.0" encoding="UTF-8"?>
                                                                        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                                                                        ${items}
                                                                        </sitemapindex>`;
                                                                        }

                                                                        function escapeXml(str) {
                                                                          return String(str)
                                                                              .replace(/&/g, "&amp;")
                                                                                  .replace(/</g, "&lt;")
                                                                                      .replace(/>/g, "&gt;")
                                                                                          .replace(/"/g, "&quot;")
                                                                                              .replace(/'/g, "&apos;");
                                                                                              }

                                                                                              function toDateOnly(value) {
                                                                                                try {
                                                                                                    return new Date(value).toISOString().split("T")[0];
                                                                                                      } catch {
                                                                                                          return new Date().toISOString().split("T")[0];
                                                                                                            }
                                                                                                            }

                                                                                                            module.exports = {
                                                                                                              BASE_URL,
                                                                                                                MAX_URLS_PER_FILE,
                                                                                                                  getCached,
                                                                                                                    setCached,
                                                                                                                      invalidateCache,
                                                                                                                        buildSitemapXml,
                                                                                                                          buildSitemapIndexXml,
                                                                                                                            paginate,
                                                                                                                              escapeXml,
                                                                                                                                toDateOnly,
                                                                                                                                };