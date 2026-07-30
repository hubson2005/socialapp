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
  {
    slug: "crm-whatsapp-pme-afrique-ouest-2026",
    title:
      "CRM WhatsApp pour PME en Afrique de l'Ouest : pourquoi c'est indispensable en 2026",
    description:
      "WhatsApp Business est le canal n°1 de contact client en Afrique de l'Ouest. Découvrez pourquoi un CRM WhatsApp devient indispensable pour les PME en Côte d'Ivoire, au Sénégal, au Mali et dans toute la région en 2026.",
    excerpt:
      "WhatsApp est devenu le premier canal de vente et de service client des PME ouest-africaines. Voici pourquoi un CRM WhatsApp fait la différence, avec la Côte d'Ivoire comme fil conducteur.",
    date: "2026-07-30",
    updatedAt: "2026-07-30",
    author: "SocialApp",
    tags: [
      "CRM WhatsApp",
      "PME",
      "Afrique de l'Ouest",
      "Côte d'Ivoire",
      "WhatsApp Business",
    ],
    readingTime: "6 min",
    content: [
      {
        type: "paragraph",
        text:
          "WhatsApp n'est plus une simple messagerie en Afrique de l'Ouest : c'est devenu le principal canal de vente et de service client des PME, de Dakar à Lomé en passant par Abidjan, Bamako et Douala. Pourtant, la grande majorité des entreprises gèrent encore leurs conversations client depuis un téléphone unique, sans historique structuré, sans suivi commercial et sans automatisation. C'est précisément ce manque qu'un CRM WhatsApp vient combler.",
      },
      { type: "heading", text: "WhatsApp, canal n°1 de la relation client en Afrique francophone" },
      {
        type: "paragraph",
        text:
          "Dans la plupart des pays d'Afrique de l'Ouest, WhatsApp Business a dépassé l'email, le téléphone classique et même les réseaux sociaux comme point de contact privilégié entre une entreprise et ses clients. Un client ivoirien, sénégalais ou malien s'attend aujourd'hui à pouvoir écrire directement à une PME sur WhatsApp, obtenir une réponse rapide, et suivre sa commande ou son rendez-vous par ce même canal. Ce comportement est particulièrement fort en Côte d'Ivoire, mais la tendance est identique dans l'ensemble de la sous-région : Sénégal, Mali, Bénin, Togo, Cameroun.",
      },
      { type: "heading", text: "Les limites de WhatsApp Business classique" },
      {
        type: "paragraph",
        text:
          "L'application WhatsApp Business seule a permis une première professionnalisation : catalogue, réponses automatiques simples, étiquettes de conversation. Mais dès qu'une PME grandit, ses limites apparaissent : aucune vue d'ensemble sur les prospects et leur stade d'avancement, pas de relance automatique en cas de silence du client, un historique dépendant d'un seul téléphone sans partage d'équipe fiable, et aucun lien avec les autres outils de gestion (réservations, paiements, marketing).",
      },
      { type: "heading", text: "Ce qu'apporte concrètement un CRM WhatsApp" },
      {
        type: "paragraph",
        text:
          "Un CRM WhatsApp transforme la messagerie en véritable outil de pilotage commercial : un suivi structuré des prospects par étape (nouveau lead, en discussion, relance, client) avec un historique consultable par toute l'équipe ; des relances automatiques programmées après 24h ou 48h sans réponse du client ; des rappels de rendez-vous ou de paiement envoyés automatiquement ; et une vision d'équipe permettant à plusieurs collaborateurs de gérer les conversations depuis une interface commune.",
      },
      { type: "heading", text: "Cas concret : une PME à Abidjan" },
      {
        type: "paragraph",
        text:
          "Prenons l'exemple d'un institut de beauté à Abidjan qui reçoit ses demandes de rendez-vous principalement par WhatsApp. Sans CRM, la gérante gère tout depuis son téléphone personnel : elle oublie parfois de relancer une cliente intéressée et ne peut pas déléguer la gestion des messages. Avec un CRM WhatsApp intégré à un système de réservation, chaque message entrant devient un contact suivi, les rappels partent seuls la veille, et une relance automatique est envoyée aux clientes qui avaient demandé un devis sans confirmer. Ce même schéma s'applique aussi bien à un salon à Dakar, une boutique à Bamako ou un prestataire à Cotonou.",
      },
      { type: "heading", text: "Combien ça coûte pour une PME" },
      {
        type: "paragraph",
        text:
          "Contrairement aux solutions CRM internationales facturées en dollars ou en euros, une solution pensée pour l'Afrique de l'Ouest doit rester accessible en FCFA et adaptée aux réalités locales de paiement (Mobile Money notamment). C'est le principe retenu par SocialApp, dont le CRM WhatsApp est intégré à des formules pensées pour les PME ivoiriennes et ouest-africaines, avec une tarification progressive selon la taille de l'activité.",
      },
      { type: "heading", text: "En résumé" },
      {
        type: "paragraph",
        text:
          "Le CRM WhatsApp n'est plus un luxe réservé aux grandes entreprises : c'est en train de devenir un standard pour toute PME d'Afrique de l'Ouest qui veut professionnaliser sa relation client sans perdre la simplicité de WhatsApp. La Côte d'Ivoire, marché le plus mature sur ce point, montre la voie à une région entière où ce même besoin se fait sentir, du Sénégal au Cameroun.",
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