import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import SEO from "../components/SEO";
import { getPostBySlug } from "../data/blogPosts";

const S = {
  page: {
    minHeight: "100vh",
    background: "#060412",
    color: "#fff",
    fontFamily: "'Sora', sans-serif",
    padding: "80px 20px 100px",
  },
  container: { maxWidth: 720, margin: "0 auto" },
  back: {
    display: "inline-block",
    fontSize: 13.5,
    color: "rgba(255,255,255,.5)",
    textDecoration: "none",
    marginBottom: 28,
  },
  meta: {
    fontSize: 12,
    color: "rgba(255,255,255,.4)",
    marginBottom: 14,
    display: "flex",
    gap: 10,
  },
  h1: {
    fontSize: "clamp(26px, 4.5vw, 38px)",
    fontWeight: 900,
    letterSpacing: "-1px",
    marginBottom: 32,
    lineHeight: 1.25,
  },
  h2: {
    fontSize: 21,
    fontWeight: 800,
    marginTop: 36,
    marginBottom: 14,
    letterSpacing: "-0.3px",
    color: "#ff9d6b",
  },
  p: {
    fontSize: 16,
    lineHeight: 1.75,
    color: "rgba(255,255,255,.75)",
    marginBottom: 6,
  },
  cta: {
    marginTop: 56,
    padding: "28px",
    borderRadius: 20,
    background: "rgba(255,107,53,.08)",
    border: "1px solid rgba(255,107,53,.25)",
    textAlign: "center",
  },
  ctaBtn: {
    display: "inline-block",
    marginTop: 14,
    background: "#ff6b35",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14.5,
    padding: "12px 28px",
    borderRadius: 100,
    textDecoration: "none",
  },
};

function formatDate(d) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  if (!post) return <Navigate to="/blog" replace />;

  const url = `https://www.socialapp.work/blog/${post.slug}`;

  return (
    <>
      <SEO
        title={`${post.title} | Blog SocialApp`}
        description={post.description}
        url={url}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.updatedAt || post.date,
          author: { "@type": "Organization", name: post.author || "SocialApp" },
          url,
          inLanguage: "fr",
        }}
      />
      <div style={S.page}>
        <div style={S.container}>
          <Link to="/blog" style={S.back}>← Retour au blog</Link>
          <div style={S.meta}>
            <span>{formatDate(post.date)}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>
          <h1 style={S.h1}>{post.title}</h1>

          {post.content.map((block, i) =>
            block.type === "heading" ? (
              <h2 key={i} style={S.h2}>{block.text}</h2>
            ) : (
              <p key={i} style={S.p}>{block.text}</p>
            )
          )}

          <div style={S.cta}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
              Prêt à créer votre profil digital ?
            </div>
            <div style={{ color: "rgba(255,255,255,.55)", fontSize: 14 }}>
              Dès 10 000 FCFA/an, paiement Mobile Money.
            </div>
            <Link to="/" style={S.ctaBtn}>Découvrir SocialApp</Link>
          </div>
        </div>
      </div>
    </>
  );
}
