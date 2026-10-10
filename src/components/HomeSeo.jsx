import React from 'react';
import { Helmet } from 'react-helmet-async';

/* ─────────────────────────────────────────────
   SEO de la page d'accueil
   Utilisation dans Home.jsx :
     import HomeSeo from '../components/HomeSeo';
     ...
     <HomeSeo faqs={FAQS} />      // à la place de l'ancien bloc <Helmet>…</Helmet>
───────────────────────────────────────────── */
const SITE = 'https://www.socialapp.work';
const LOGO = `${SITE}/Logo_SocialApp.png`;
const OG_IMAGE = `${SITE}/og-preview.jpg`; // à vérifier : fichier présent dans /public, 1200 × 630 px

const TITLE = "SocialApp – Carte digitale, QR Code, NFC et CRM | Côte d'Ivoire";
const DESCRIPTION =
  'Carte de visite digitale, QR Code et carte NFC, boutique WhatsApp et CRM avec relances automatiques. Dès 10 000 FCFA/an, paiement Mobile Money.';
const KEYWORDS = [
  'carte de visite digitale', 'carte de visite numérique', 'carte NFC professionnelle', 'carte de visite NFC',
  'QR code professionnel', 'profil digital Côte d\'Ivoire', 'lien en bio', 'CRM WhatsApp', 'CRM Côte d\'Ivoire',
  'relances automatiques', 'tâches et rappels CRM', 'gestion des prospects', 'boutique WhatsApp', 'marketplace sans commission',
  'page événement', 'analytics profil', 'Abidjan', 'SocialApp',
].join(', ');

const FEATURES = [
  'Carte de visite digitale avec lien unique et QR code personnalisable',
  'Carte NFC avec logo et QR code (offres PRO et BUSINESS)',
  'Boutique intégrée au profil, commandes sur WhatsApp, zéro commission',
  'Calendrier de réservation et formulaires personnalisés',
  'Analytics en temps réel : vues, clics, pays, visiteurs en direct',
  'CRM et pipeline de leads avec fiche contact complète',
  'Tâches, rappels et relances automatiques avec délai',
  'Campagnes WhatsApp générées par l\'IA',
  'Mode Événement : page dédiée, compte à rebours, galerie, RSVP',
  'Paiement par Mobile Money, Wave et Orange Money',
];

const OFFERS = [
  ['BASIC', '10000', 'Offre BASIC, paiement annuel'],
  ['PRO', '15000', 'Offre PRO, paiement annuel, carte NFC incluse'],
  ['BUSINESS (annuel)', '39900', 'Offre BUSINESS, paiement annuel (2 mois offerts)'],
  ['BUSINESS (mensuel)', '3990', 'Offre BUSINESS, paiement mensuel'],
  ['ÉVÉNEMENT', '3500', 'Module Événement, par événement, quel que soit le plan'],
].map(([name, price, description]) => ({
  '@type': 'Offer', name, description, price, priceCurrency: 'XOF',
  availability: 'https://schema.org/InStock', url: `${SITE}/#t`,
}));

export function buildSchemas(faqs = []) {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': `${SITE}/#org`, name: 'SocialApp', url: SITE, logo: LOGO,
        contactPoint: { '@type': 'ContactPoint', telephone: '+2250576031212', contactType: 'customer support', areaServed: 'CI', availableLanguage: 'French' },
      },
      { '@type': 'WebSite', '@id': `${SITE}/#site`, name: 'SocialApp', url: SITE, inLanguage: 'fr', publisher: { '@id': `${SITE}/#org` } },
      {
        '@type': 'SoftwareApplication', '@id': `${SITE}/#app`, name: 'SocialApp', url: SITE, image: LOGO,
        applicationCategory: 'BusinessApplication', operatingSystem: 'Web', inLanguage: 'fr',
        description: 'Plateforme ivoirienne de carte de visite digitale avec QR code et carte NFC, boutique WhatsApp, analytics et CRM avec relances automatiques.',
        areaServed: { '@type': 'Country', name: "Côte d'Ivoire" },
        featureList: FEATURES, publisher: { '@id': `${SITE}/#org` }, offers: OFFERS,
      },
    ],
  };
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return { graph, faq };
}

export default function HomeSeo({ faqs }) {
  const { graph, faq } = buildSchemas(faqs);
  return (
    <Helmet>
      <html lang="fr" />
      <title>{TITLE}</title>
      <meta name="description" content={DESCRIPTION} />
      <meta name="keywords" content={KEYWORDS} />
      <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      <link rel="canonical" href={`${SITE}/`} />
      <link rel="alternate" hrefLang="fr-CI" href={`${SITE}/`} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE}/`} />
      <meta name="theme-color" content="#f8f5ef" />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="SocialApp" />
      <meta property="og:url" content={`${SITE}/`} />
      <meta property="og:title" content="SocialApp – Carte digitale, QR Code, NFC et CRM tout-en-un" />
      <meta property="og:description" content="Une carte de visite digitale, un QR code, une carte NFC, une boutique WhatsApp et un CRM avec relances automatiques. Dès 10 000 FCFA/an." />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="SocialApp : carte de visite digitale, QR code et CRM" />
      <meta property="og:locale" content="fr_FR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="SocialApp – Carte digitale, QR Code, NFC et CRM" />
      <meta name="twitter:description" content="Partagez votre profil en un scan ou un geste (NFC), vendez sur WhatsApp et relancez vos prospects automatiquement." />
      <meta name="twitter:image" content={OG_IMAGE} />

      <script type="application/ld+json">{JSON.stringify(graph)}</script>
      <script type="application/ld+json">{JSON.stringify(faq)}</script>
    </Helmet>
  );
}