import { useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO"; // adapter le chemin si besoin
import { SEO_PAGES, SITE } from "../data/seoPages";

const CSS = `
.seop{max-width:820px;margin:0 auto;padding:32px 20px 72px;font-family:inherit;line-height:1.7;color:#1a1a2e}
.seop-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;font-size:14px}
.seop-nav a{color:#1a1a2e;text-decoration:none;font-weight:600}
.seop h1{font-size:clamp(26px,5vw,38px);line-height:1.2;margin:0 0 16px;font-weight:800}
.seop h2{font-size:clamp(20px,3.5vw,26px);margin:36px 0 10px;font-weight:700}
.seop h3{font-size:17px;margin:20px 0 4px;font-weight:700}
.seop p{margin:0 0 12px;font-size:16px}
.seop .seop-intro{font-size:18px;color:#444}
.seop ul{margin:8px 0 16px;padding-left:22px}
.seop li{margin-bottom:6px}
.seop-cta{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 28px;border-radius:12px;background:#1a1a2e;color:#fff !important;font-weight:700;text-decoration:none;margin:24px 0}
.seop-related{display:grid;gap:10px;padding:0;list-style:none}
.seop-related a{display:block;padding:14px 16px;border:1px solid #e3e3ea;border-radius:12px;color:#1a1a2e;text-decoration:none;font-weight:600}
@media (hover:hover){.seop-related a:hover{border-color:#1a1a2e}.seop-cta:hover{opacity:.9}}
`;

export default function SeoPage({ slug }) {
  const page = SEO_PAGES[slug];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!page) return null;

  const url = `${SITE}/${slug}`;
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

  return (
    <>
      <style>{CSS}</style>
      <SEO
        title={page.title}
        description={page.description}
        image={`${SITE}/Logo_SocialApp.png`}
        url={url}
        jsonLd={jsonLd}
      />
      <main className="seop">
        <nav className="seop-nav">
          <Link to="/">← SocialApp</Link>
          <Link to="/login">Connexion</Link>
        </nav>

        <h1>{page.h1}</h1>
        <p className="seop-intro">{page.intro}</p>
        <Link className="seop-cta" to="/signup">
          Créer mon profil
        </Link>

        {page.sections.map((s) => (
          <section key={s.h2}>
            <h2>{s.h2}</h2>
            {(s.paragraphs || []).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {s.list?.length > 0 && (
              <ul>
                {s.list.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section>
          <h2>Questions fréquentes</h2>
          {page.faq.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>

        <Link className="seop-cta" to="/signup">
          Créer mon profil
        </Link>

        <section>
          <h2>À lire aussi</h2>
          <ul className="seop-related">
            {page.related
              .filter((r) => SEO_PAGES[r])
              .map((r) => (
                <li key={r}>
                  <Link to={`/${r}`}>{SEO_PAGES[r].h1}</Link>
                </li>
              ))}
          </ul>
        </section>
      </main>
    </>
  );
}