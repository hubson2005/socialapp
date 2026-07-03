const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // clé service pour lire is_public sans restriction RLS gênante
    );

    // Récupère tous les profils publics, avec pagination interne Supabase (max 1000/requête par défaut)
    async function fetchPublicProfiles() {
      const all = [];
        let from = 0;
          const step = 1000;

            while (true) {
                const { data, error } = await supabase
                      .from("profiles")
                            .select("slug, updated_at")
                                  .eq("is_public", true)
                                        .range(from, from + step - 1);

                                            if (error) throw error;
                                                if (!data || data.length === 0) break;

                                                    all.push(...data);
                                                        if (data.length < step) break;
                                                            from += step;
                                                              }

                                                                return all;
                                                                }

                                                                async function fetchPublicEntreprises() {
                                                                  const all = [];
                                                                    let from = 0;
                                                                      const step = 1000;

                                                                        while (true) {
                                                                            const { data, error } = await supabase
                                                                                  .from("entreprises")
                                                                                        .select("slug, updated_at")
                                                                                              .eq("is_public", true)
                                                                                                    .range(from, from + step - 1);

                                                                                                        if (error) throw error;
                                                                                                            if (!data || data.length === 0) break;

                                                                                                                all.push(...data);
                                                                                                                    if (data.length < step) break;
                                                                                                                        from += step;
                                                                                                                          }

                                                                                                                            return all;
                                                                                                                            }

                                                                                                                            async function fetchPublishedArticles() {
                                                                                                                              const all = [];
                                                                                                                                let from = 0;
                                                                                                                                  const step = 1000;

                                                                                                                                    while (true) {
                                                                                                                                        const { data, error } = await supabase
                                                                                                                                              .from("articles")
                                                                                                                                                    .select("slug, updated_at")
                                                                                                                                                          .eq("status", "published")
                                                                                                                                                                .range(from, from + step - 1);

                                                                                                                                                                    if (error) throw error;
                                                                                                                                                                        if (!data || data.length === 0) break;

                                                                                                                                                                            all.push(...data);
                                                                                                                                                                                if (data.length < step) break;
                                                                                                                                                                                    from += step;
                                                                                                                                                                                      }

                                                                                                                                                                                        return all;
                                                                                                                                                                                        }

                                                                                                                                                                                        module.exports = {
                                                                                                                                                                                          fetchPublicProfiles,
                                                                                                                                                                                            fetchPublicEntreprises,
                                                                                                                                                                                              fetchPublishedArticles,
                                                                                                                                                                                              };