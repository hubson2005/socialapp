import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { getAllPosts } from "../data/blogPosts";

const S = {
  page: {
    minHeight: "100vh",
    background: "#060412",
    color: "#fff",
    fontFamily: "'Sora', sans-serif",
    padding: "80px 20px 100px",
  },
  container: { maxWidth: 860, margin: "0 auto" },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,107,53,.1)",
    border: "1px solid rgba(255,107,53,.3)",
    borderRadius: 100,
    padding: "6px 16px",
    fontSize: 12,
    color: "#ff6b35",
    fontWeight: 700,
    marginBottom: 18,
  },
  h1: {
    fontSize: "clamp(28px, 5vw, 42px)",
    fontWeight: 900,
    letterSpacing: "-1px",
    marginBottom: 12,
  },
  subtitle: {
    color: "rgba(255,255,255,.5)",
    fontSize: 16,
    marginBottom: 56,
    maxWidth: 560,
  },
  card: {
    display: "block",
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 20,
    padding: "28px 28px",
    marginBottom: 20,
    textDecoration: "none",
    color: "#fff",
    transition: "border-color .2s, background .2s",
  },
  cardMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,.4)",
    marginBottom: 10,
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 10,
    letterSpacing: "-0.3px",
  },
  cardExcerpt: {
    fontSize: 14.5,
    color: "rgba(255,255,255,.55)",
    lineHeight: 1.6,
  },
  readMore: {
    display: "inline-block",
    marginTop: 14,
    fontSize: 13.5,
    fontWeight: 700,
    color: "#ff6b35",
  },
};

function formatDate(d) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Blog() {
  const posts = getAllPosts();

  return (
    <>
      <SEO
        title="Blog SocialApp — Conseils profil digital, CRM et marketplace en Côte d'Ivoire"
        description="Conseils, comparatifs et actualités pour les entrepreneurs, commerçants et créateurs de Côte d'Ivoire qui veulent développer leur présence digitale avec SocialApp."
        url="https://www.socialapp.work/blog"
        type="website"
      />
      <div style={S.page}>
        <div style={S.container}>
          <div style={S.eyebrow}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b35" }} />
            BLOG
          </div>
          <h1 style={S.h1}>Ressources &amp; conseils</h1>
          <p style={S.subtitle}>
            Comparatifs, conseils pratiques et actualités pour développer votre activité en Côte d'Ivoire
            avec un profil digital, un CRM et une marketplace intégrés.
          </p>

          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              style={S.card}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,107,53,.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.08)")}
            >
              <div style={S.cardMeta}>
                <span>{formatDate(post.date)}</span>
                <span>·</span>
                <span>{post.readingTime}</span>
              </div>
              <div style={S.cardTitle}>{post.title}</div>
              <div style={S.cardExcerpt}>{post.excerpt}</div>
              <div style={S.readMore}>Lire l'article →</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
