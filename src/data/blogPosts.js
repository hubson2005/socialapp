// src/data/blogPosts.js
// Contenu statique du blog SocialApp. Pour ajouter un article :
// 1. Ajoute un objet dans le tableau ci-dessous (slug unique, requis).
// 2. Ajoute le chemin correspondant dans src/routes/sitemap.js (STATIC_PAGES).
// Aucune base de données requise pour cette V1.

const blogPosts = [
  {
    slug: "socialapp-vs-linktree-cote-divoire",
    title: "SocialApp vs Linktree : quelle solution choisir pour les professionnels en Côte d'Ivoire ?",
    description:
      "Comparatif entre SocialApp et Linktree pour les entrepreneurs, commerçants et créateurs ivoiriens : prix en FCFA, paiement Mobile Money, CRM intégré et marketplace locale.",
    excerpt:
      "Linktree est populaire, mais n'est pas pensé pour le marché ivoirien. Voici pourquoi de plus en plus de professionnels à Abidjan choisissent une alternative locale.",
    date: "2026-07-30",
    updatedAt: "2026-07-30",
    author: "SocialApp",
    tags: ["comparatif", "linktree", "côte d'ivoire", "profil digital"],
    readingTime: "5 min",
    content: [
      {
        type: "paragraph",
        text:
          "Si vous êtes commerçant, prestataire de services ou créateur de contenu en Côte d'Ivoire, vous avez sûrement déjà entendu parler de Linktree pour regrouper vos liens sociaux en une seule page. C'est un bon outil, mais il n'a pas été conçu pour les réalités du marché ouest-africain : paiement en dollars, pas de CRM pour vos prospects, pas de marketplace locale. Voici une comparaison honnête pour vous aider à choisir.",
      },
      { type: "heading", text: "1. Le prix et le mode de paiement" },
      {
        type: "paragraph",
        text:
          "Linktree facture ses offres payantes en dollars US, avec une carte bancaire internationale souvent nécessaire. SocialApp propose des tarifs pensés pour le marché local, en FCFA, réglables directement via Mobile Money (Orange Money, MTN MoMo, Moov Money, Wave) : à partir de 10 000 FCFA par an pour l'offre Basic, jusqu'à 25 000 FCFA par an pour l'offre Business.",
      },
      { type: "heading", text: "2. Un CRM pour vos prospects, pas juste des liens" },
      {
        type: "paragraph",
        text:
          "Linktree se limite à afficher des liens cliquables. SocialApp va plus loin avec un CRM intégré : chaque visiteur qui remplit un formulaire ou clique sur votre WhatsApp devient un prospect que vous pouvez suivre, taguer, relancer et organiser en pipeline — directement depuis votre tableau de bord.",
      },
      { type: "heading", text: "3. Une marketplace pour vendre sans commission" },
      {
        type: "paragraph",
        text:
          "Avec SocialApp, vous pouvez présenter et vendre vos produits ou services directement depuis votre profil, sans commission prélevée sur vos ventes — un avantage important pour les commerçants et créateurs qui n'ont pas encore de boutique en ligne dédiée.",
      },
      { type: "heading", text: "4. Analytics et QR Code pensés pour le terrain" },
      {
        type: "paragraph",
        text:
          "SocialApp propose des statistiques de visite en temps réel et des QR codes prêts à imprimer sur une carte de visite, une vitrine ou une affiche — utile pour un usage terrain à Abidjan ou ailleurs en Côte d'Ivoire, sans dépendre uniquement du digital.",
      },
      { type: "heading", text: "En résumé" },
      {
        type: "paragraph",
        text:
          "Linktree reste un bon choix pour un usage international basique. Mais si vous êtes un professionnel ivoirien qui veut un outil pensé pour son marché — paiement local, CRM, marketplace et support en français — SocialApp est une alternative plus complète et mieux adaptée à votre quotidien.",
      },
    ],
  },
];

export function getAllPosts() {
  return [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getPostBySlug(slug) {
  return blogPosts.find((p) => p.slug === slug) || null;
}

export default blogPosts;
