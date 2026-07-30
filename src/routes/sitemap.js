const express = require("express");
const router = express.Router();

const {
  BASE_URL,
    getCached,
      setCached,
        buildSitemapXml,
          buildSitemapIndexXml,
            paginate,
              toDateOnly,
              } = require("../lib/sitemapService");

              const {
                fetchPublicProfiles,
                  fetchPublicEntreprises,
                    fetchPublishedArticles,
                    } = require("../lib/dataSources");

                    // ---------------------------------------------------------------------------
                    // Pages fixes du site (non liées à la base de données)
                    // ---------------------------------------------------------------------------
                    const STATIC_PAGES = [
                      { path: "/", changefreq: "daily", priority: 1.0 },
                        { path: "/tarifs", changefreq: "monthly", priority: 0.8 },
                          { path: "/contact", changefreq: "monthly", priority: 0.5 },
                            { path: "/a-propos", changefreq: "monthly", priority: 0.5 },
                              { path: "/fonctionnalites", changefreq: "monthly", priority: 0.8 },
                              { path: "/blog", changefreq: "weekly", priority: 0.7 },
                                  { path: "/blog/socialapp-vs-linktree-cote-divoire", changefreq: "monthly", priority: 0.6 },
                              ];

                              function sendXml(res, xml) {
                                res.header("Content-Type", "application/xml; charset=utf-8");
                                  res.send(xml);
                                  }

                                  // ---------------------------------------------------------------------------
                                  // /sitemap-pages.xml — pages fixes
                                  // ---------------------------------------------------------------------------
                                  router.get("/sitemap-pages.xml", async (req, res) => {
                                    const cacheKey = "pages";
                                      const cached = getCached(cacheKey);
                                        if (cached) return sendXml(res, cached);

                                          const entries = STATIC_PAGES.map((p) => ({
                                              url: p.path,
                                                  changefreq: p.changefreq,
                                                      priority: p.priority,
                                                        }));

                                                          const xml = await buildSitemapXml(entries);
                                                            setCached(cacheKey, xml);
                                                              sendXml(res, xml);
                                                              });

                                                              // ---------------------------------------------------------------------------
                                                              // Fabrique générique de route paginée pour un type de contenu donné
                                                              // (profils, entreprises, articles...)
                                                              // ---------------------------------------------------------------------------
                                                              function registerPaginatedRoute({ routePrefix, urlPrefix, fetchFn, changefreq, priority }) {
                                                                router.get(`/${routePrefix}-:page.xml`, async (req, res) => {
                                                                    const page = parseInt(req.params.page, 10);
                                                                        if (!Number.isInteger(page) || page < 1) {
                                                                              return res.status(404).send("Not found");
                                                                                  }

                                                                                      const cacheKey = `${routePrefix}-${page}`;
                                                                                          const cached = getCached(cacheKey);
                                                                                              if (cached) return sendXml(res, cached);

                                                                                                  try {
                                                                                                        const rows = await fetchFn();
                                                                                                              const entries = rows.map((row) => ({
                                                                                                                      url: `${urlPrefix}/${row.slug}`,
                                                                                                                              lastmod: toDateOnly(row.updated_at),
                                                                                                                                      changefreq,
                                                                                                                                              priority,
                                                                                                                                                    }));

                                                                                                                                                          const pages = paginate(entries);
                                                                                                                                                                if (page > pages.length) return res.status(404).send("Not found");

                                                                                                                                                                      const xml = await buildSitemapXml(pages[page - 1]);
                                                                                                                                                                            setCached(cacheKey, xml);
                                                                                                                                                                                  sendXml(res, xml);
                                                                                                                                                                                      } catch (err) {
                                                                                                                                                                                            console.error(`Erreur génération sitemap ${routePrefix}:`, err);
                                                                                                                                                                                                  res.status(500).send("Erreur de génération du sitemap");
                                                                                                                                                                                                      }
                                                                                                                                                                                                        });
                                                                                                                                                                                                        }

                                                                                                                                                                                                        registerPaginatedRoute({
                                                                                                                                                                                                          routePrefix: "sitemap-profils",
                                                                                                                                                                                                            urlPrefix: "/profil",
                                                                                                                                                                                                              fetchFn: fetchPublicProfiles,
                                                                                                                                                                                                                changefreq: "weekly",
                                                                                                                                                                                                                  priority: 0.8,
                                                                                                                                                                                                                  });

                                                                                                                                                                                                                  registerPaginatedRoute({
                                                                                                                                                                                                                    routePrefix: "sitemap-entreprises",
                                                                                                                                                                                                                      urlPrefix: "/entreprise",
                                                                                                                                                                                                                        fetchFn: fetchPublicEntreprises,
                                                                                                                                                                                                                          changefreq: "weekly",
                                                                                                                                                                                                                            priority: 0.8,
                                                                                                                                                                                                                            });

                                                                                                                                                                                                                            registerPaginatedRoute({
                                                                                                                                                                                                                              routePrefix: "sitemap-articles",
                                                                                                                                                                                                                                urlPrefix: "/articles",
                                                                                                                                                                                                                                  fetchFn: fetchPublishedArticles,
                                                                                                                                                                                                                                    changefreq: "monthly",
                                                                                                                                                                                                                                      priority: 0.6,
                                                                                                                                                                                                                                      });

                                                                                                                                                                                                                                      // ---------------------------------------------------------------------------
                                                                                                                                                                                                                                      // /sitemap-index.xml — référence tous les sitemaps, avec pagination détectée
                                                                                                                                                                                                                                      // dynamiquement pour chaque type de contenu
                                                                                                                                                                                                                                      // ---------------------------------------------------------------------------
                                                                                                                                                                                                                                      router.get("/sitemap-index.xml", async (req, res) => {
                                                                                                                                                                                                                                        const cacheKey = "index";
                                                                                                                                                                                                                                          const cached = getCached(cacheKey);
                                                                                                                                                                                                                                            if (cached) return sendXml(res, cached);

                                                                                                                                                                                                                                              try {
                                                                                                                                                                                                                                                  const today = toDateOnly(new Date());

                                                                                                                                                                                                                                                      const [profiles, entreprises, articles] = await Promise.all([
                                                                                                                                                                                                                                                            fetchPublicProfiles(),
                                                                                                                                                                                                                                                                  fetchPublicEntreprises(),
                                                                                                                                                                                                                                                                        fetchPublishedArticles(),
                                                                                                                                                                                                                                                                            ]);

                                                                                                                                                                                                                                                                                const profilePages = paginate(profiles).length;
                                                                                                                                                                                                                                                                                    const entreprisePages = paginate(entreprises).length;
                                                                                                                                                                                                                                                                                        const articlePages = paginate(articles).length;

                                                                                                                                                                                                                                                                                            const sitemaps = [
                                                                                                                                                                                                                                                                                                  { loc: `${BASE_URL}/sitemap-pages.xml`, lastmod: today },
                                                                                                                                                                                                                                                                                                        ...Array.from({ length: profilePages }, (_, i) => ({
                                                                                                                                                                                                                                                                                                                loc: `${BASE_URL}/sitemap-profils-${i + 1}.xml`,
                                                                                                                                                                                                                                                                                                                        lastmod: today,
                                                                                                                                                                                                                                                                                                                              })),
                                                                                                                                                                                                                                                                                                                                    ...Array.from({ length: entreprisePages }, (_, i) => ({
                                                                                                                                                                                                                                                                                                                                            loc: `${BASE_URL}/sitemap-entreprises-${i + 1}.xml`,
                                                                                                                                                                                                                                                                                                                                                    lastmod: today,
                                                                                                                                                                                                                                                                                                                                                          })),
                                                                                                                                                                                                                                                                                                                                                                ...Array.from({ length: articlePages }, (_, i) => ({
                                                                                                                                                                                                                                                                                                                                                                        loc: `${BASE_URL}/sitemap-articles-${i + 1}.xml`,
                                                                                                                                                                                                                                                                                                                                                                                lastmod: today,
                                                                                                                                                                                                                                                                                                                                                                                      })),
                                                                                                                                                                                                                                                                                                                                                                                          ];

                                                                                                                                                                                                                                                                                                                                                                                              const xml = buildSitemapIndexXml(sitemaps);
                                                                                                                                                                                                                                                                                                                                                                                                  setCached(cacheKey, xml);
                                                                                                                                                                                                                                                                                                                                                                                                      sendXml(res, xml);
                                                                                                                                                                                                                                                                                                                                                                                                        } catch (err) {
                                                                                                                                                                                                                                                                                                                                                                                                            console.error("Erreur génération sitemap-index:", err);
                                                                                                                                                                                                                                                                                                                                                                                                                res.status(500).send("Erreur de génération du sitemap index");
                                                                                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                                                                                  });

                                                                                                                                                                                                                                                                                                                                                                                                                  // ---------------------------------------------------------------------------
                                                                                                                                                                                                                                                                                                                                                                                                                  // Alias : /sitemap.xml redirige simplement vers l'index
                                                                                                                                                                                                                                                                                                                                                                                                                  // (utile si un ancien lien externe pointe encore vers l'ancienne URL)
                                                                                                                                                                                                                                                                                                                                                                                                                  // ---------------------------------------------------------------------------
                                                                                                                                                                                                                                                                                                                                                                                                                  router.get("/sitemap.xml", (req, res) => {
                                                                                                                                                                                                                                                                                                                                                                                                                    res.redirect(301, "/sitemap-index.xml");
                                                                                                                                                                                                                                                                                                                                                                                                                    });

                                                                                                                                                                                                                                                                                                                                                                                                                    module.exports = router;