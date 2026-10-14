// src/data/seoPages.js — source unique des pages SEO (contenu, FAQ, maillage)
export const SITE = "https://www.socialapp.work";

export const SEO_PAGES = {
  tarifs: {
    title: "Tarifs SocialApp : plans dès 10 000 FCFA/an",
    description:
      "Découvrez les tarifs SocialApp : Basic 10 000 FCFA/an, Pro 15 000 FCFA/an, Business dès 3 990 FCFA/mois. Profil digital, QR code, CRM WhatsApp.",
    h1: "Tarifs SocialApp : des plans adaptés aux entrepreneurs en Côte d'Ivoire",
    intro:
      "SocialApp propose des tarifs en FCFA, pensés pour les indépendants, commerçants et PME d'Afrique de l'Ouest. Choisissez un plan annuel ou, pour Business, un paiement mensuel.",
    sections: [
      {
        h2: "Plan Basic : 10 000 FCFA par an",
        paragraphs: [
          "Le plan Basic couvre l'essentiel pour lancer votre présence en ligne avec un profil digital et un QR code professionnel.",
        ],
        list: [
          "9 liens sur votre profil",
          "2 imports",
          "7 articles dans la marketplace",
          "5 formulaires",
        ],
      },
      {
        h2: "Plan Pro : 15 000 FCFA par an",
        paragraphs: [
          "Le plan Pro s'adresse à ceux qui vendent ou collectent des demandes clients régulièrement.",
        ],
        list: [
          "12 liens sur votre profil",
          "5 imports",
          "10 articles dans la marketplace",
          "Formulaires illimités",
        ],
      },
      {
        h2: "Plan Business : 39 900 FCFA par an ou 3 990 FCFA par mois",
        paragraphs: [
          "Le plan Business est conçu pour les entreprises qui veulent tout débloquer. En paiement annuel, vous ne payez que 10 mois sur 12.",
        ],
        list: [
          "10 imports",
          "Marketplace illimitée",
          "Formulaires illimités",
        ],
      },
      {
        h2: "Module Événement : 3 500 FCFA, quel que soit le plan",
        paragraphs: [
          "Organisez un événement avec sa page dédiée pour 3 500 FCFA, que vous soyez en Basic, Pro ou Business.",
        ],
      },
      {
        h2: "Moyens de paiement",
        paragraphs: [
          "Payez avec les moyens courants en Côte d'Ivoire : Wave, MTN Money, Orange Money ou carte bancaire.",
        ],
      },
    ],
    faq: [
      {
        q: "Combien coûte SocialApp en Côte d'Ivoire ?",
        a: "Les plans démarrent à 10 000 FCFA par an (Basic). Pro coûte 15 000 FCFA par an et Business 39 900 FCFA par an ou 3 990 FCFA par mois.",
      },
      {
        q: "Puis-je payer par Mobile Money ?",
        a: "Oui, le paiement par Wave, MTN Money, Orange Money et carte bancaire est pris en charge.",
      },
      {
        q: "Le module Événement est-il inclus dans les plans ?",
        a: "Non, c'est un module à 3 500 FCFA, au même prix quel que soit votre plan.",
      },
    ],
    related: ["carte-de-visite-digitale", "qr-code-professionnel", "crm-whatsapp"],
  },

  "carte-de-visite-digitale": {
    title: "Carte de visite digitale en Côte d'Ivoire | SocialApp",
    description:
      "Créez votre carte de visite digitale avec SocialApp : un lien unique, un QR code, vos réseaux, WhatsApp et boutique. Dès 10 000 FCFA/an.",
    h1: "Carte de visite digitale : votre profil professionnel dans un seul lien",
    intro:
      "Une carte de visite papier se perd, se périme et ne dit presque rien de vous. Avec SocialApp, votre carte de visite digitale rassemble vos coordonnées, vos liens, vos produits et votre WhatsApp sur une page unique, toujours à jour.",
    sections: [
      {
        h2: "Qu'est-ce qu'une carte de visite digitale ?",
        paragraphs: [
          "C'est une page web personnelle accessible par un lien court ou un QR code. Elle présente qui vous êtes, ce que vous proposez et comment vous contacter. Vous la modifiez à tout moment, sans réimprimer quoi que ce soit.",
        ],
      },
      {
        h2: "Ce que vous pouvez y mettre",
        paragraphs: ["Votre profil SocialApp est complet et personnalisable :"],
        list: [
          "Vos liens : réseaux sociaux, site, catalogue",
          "Un bouton WhatsApp pour être contacté directement",
          "Votre boutique avec vos produits et leurs prix en FCFA",
          "Vos documents à télécharger (brochure, tarifs)",
          "Un calendrier de prise de rendez-vous",
          "Des formulaires pour collecter les demandes",
        ],
      },
      {
        h2: "Pourquoi c'est adapté au marché ivoirien",
        paragraphs: [
          "Ici, les affaires se font par WhatsApp et par partage de liens. Votre carte digitale s'y intègre naturellement : vous la partagez en statut, en message ou en scannant un QR code, et le client vous écrit en un clic.",
        ],
      },
      {
        h2: "Comment créer votre carte en quelques minutes",
        paragraphs: [
          "Créez votre compte, ajoutez votre photo, votre bio et vos liens, puis partagez votre lien ou votre QR code. Les plans démarrent à 10 000 FCFA par an.",
        ],
      },
    ],
    faq: [
      {
        q: "Une carte de visite digitale remplace-t-elle la carte papier ?",
        a: "Elle la complète et la dépasse : elle contient bien plus d'informations, se met à jour instantanément et se partage à distance.",
      },
      {
        q: "Mes clients doivent-ils installer une application ?",
        a: "Non. Votre profil s'ouvre dans n'importe quel navigateur, depuis un lien ou un QR code.",
      },
      {
        q: "Puis-je modifier ma carte après l'avoir partagée ?",
        a: "Oui, le lien reste le même. Toutes vos modifications apparaissent immédiatement.",
      },
    ],
    related: ["qr-code-professionnel", "carte-de-visite-nfc", "tarifs"],
  },

  "qr-code-professionnel": {
    title: "QR code professionnel pour votre profil | SocialApp",
    description:
      "Générez un QR code professionnel qui mène à votre profil digital : cartes, flyers, vitrine. Contenu modifiable à tout moment. SocialApp, Côte d'Ivoire.",
    h1: "QR code professionnel : un seul scan pour vous contacter",
    intro:
      "Un QR code professionnel relie votre support imprimé (carte, flyer, vitrine, emballage) à votre profil en ligne. Vos clients scannent, et accèdent à tout ce que vous proposez.",
    sections: [
      {
        h2: "Un QR code qui ne change jamais, un contenu toujours à jour",
        paragraphs: [
          "Le QR code SocialApp pointe vers votre profil. Vous pouvez changer vos liens, vos prix ou votre numéro WhatsApp sans modifier ni réimprimer le code.",
        ],
      },
      {
        h2: "Où utiliser votre QR code",
        paragraphs: [],
        list: [
          "Cartes de visite et brochures",
          "Flyers et affiches d'événement",
          "Vitrine de boutique ou comptoir",
          "Emballages et sacs de vos produits",
          "Tenue de travail, véhicule, stand de salon",
        ],
      },
      {
        h2: "Ce que vos clients trouvent après le scan",
        paragraphs: [
          "Votre profil s'ouvre sur leur téléphone : boutique, documents, rendez-vous, formulaire et bouton WhatsApp. Ils passent de l'intérêt au contact en quelques secondes.",
        ],
      },
      {
        h2: "Conseils pour un QR code efficace",
        paragraphs: [
          "Imprimez-le assez grand, avec un fort contraste, et ajoutez une courte invitation du type « Scannez pour commander ». Testez-le toujours avec un téléphone avant impression.",
        ],
      },
    ],
    faq: [
      {
        q: "Le QR code SocialApp expire-t-il ?",
        a: "Il reste valide tant que votre compte est actif et que votre profil est public.",
      },
      {
        q: "Puis-je changer la destination après impression ?",
        a: "Le code mène à votre profil. Vous modifiez le contenu du profil librement sans toucher au code.",
      },
      {
        q: "Faut-il une application pour le scanner ?",
        a: "Non, l'appareil photo de la plupart des téléphones suffit.",
      },
    ],
    related: ["carte-de-visite-digitale", "carte-de-visite-nfc", "tarifs"],
  },

  "crm-whatsapp": {
    title: "CRM WhatsApp pour PME en Côte d'Ivoire | SocialApp",
    description:
      "Gérez vos contacts et clients depuis WhatsApp : suivi des leads, rappels de rendez-vous, automatisations. CRM WhatsApp pensé pour l'Afrique de l'Ouest.",
    h1: "CRM WhatsApp : suivez vos clients là où ils vous écrivent",
    intro:
      "En Côte d'Ivoire, la plupart des ventes commencent par un message WhatsApp. Un CRM WhatsApp organise ces conversations pour ne perdre aucun client potentiel.",
    sections: [
      {
        h2: "Pourquoi un CRM pour WhatsApp ?",
        paragraphs: [
          "Sans outil, les contacts se perdent dans des dizaines de discussions. Un CRM centralise vos contacts, leur statut et l'historique de vos échanges.",
        ],
      },
      {
        h2: "Ce que permet le CRM SocialApp",
        paragraphs: [],
        list: [
          "Centraliser vos contacts et leads",
          "Suivre l'avancement de chaque prospect",
          "Envoyer des rappels de rendez-vous par WhatsApp",
          "Notifier le client quand un rendez-vous est confirmé ou annulé",
          "Déclencher des automatisations quand un client clique sur votre bouton WhatsApp",
        ],
      },
      {
        h2: "De votre profil à votre CRM",
        paragraphs: [
          "Les demandes reçues via votre profil (formulaires, clics WhatsApp, rendez-vous) alimentent votre CRM. Vous voyez d'où vient chaque contact et ce qu'il demande.",
        ],
      },
      {
        h2: "Pour qui ?",
        paragraphs: [
          "Commerçants, prestataires de services, salons, formateurs, agences : toute activité qui vit de la relation client sur WhatsApp.",
        ],
      },
    ],
    faq: [
      {
        q: "Un CRM WhatsApp, c'est utile pour une petite entreprise ?",
        a: "Oui. Plus vos clients vous écrivent, plus il devient difficile de les suivre sans outil. Même un petit volume gagne à être organisé.",
      },
      {
        q: "Mes clients reçoivent-ils des rappels automatiques ?",
        a: "Oui, SocialApp peut envoyer des rappels de rendez-vous par WhatsApp avant l'heure prévue.",
      },
      {
        q: "Quel plan faut-il pour le CRM ?",
        a: "Consultez la page des tarifs : l'accès à certaines fonctions dépend du plan choisi.",
      },
    ],
    related: ["carte-de-visite-digitale", "entreprises", "tarifs"],
  },

  "carte-de-visite-nfc": {
    title: "Carte de visite NFC : partagez votre profil d'un geste | SocialApp",
    description:
      "Associez une carte de visite NFC à votre profil SocialApp : approchez le téléphone, le profil s'ouvre. Complétez avec un QR code. Côte d'Ivoire.",
    h1: "Carte de visite NFC : approchez le téléphone, votre profil s'ouvre",
    intro:
      "Une carte NFC contient une puce qui ouvre un lien lorsqu'un téléphone compatible l'approche. Programmée avec l'adresse de votre profil SocialApp, elle devient une carte de visite moderne et mémorable.",
    sections: [
      {
        h2: "Comment fonctionne une carte NFC ?",
        paragraphs: [
          "La puce NFC stocke l'adresse de votre profil. Un téléphone compatible qui l'approche ouvre la page directement, sans application ni saisie.",
        ],
      },
      {
        h2: "NFC et QR code : le duo gagnant",
        paragraphs: [
          "Tous les téléphones ne lisent pas le NFC. Imprimez donc aussi le QR code de votre profil sur la carte : le client choisit la méthode qui lui convient, et les deux mènent au même profil.",
        ],
      },
      {
        h2: "Un contenu qui évolue sans changer de carte",
        paragraphs: [
          "La carte pointe vers votre lien SocialApp. Vous modifiez vos liens, votre boutique ou votre numéro WhatsApp à tout moment, sans reprogrammer la carte.",
        ],
      },
      {
        h2: "Pour qui ?",
        paragraphs: [
          "Dirigeants, commerciaux, artistes, restaurateurs, organisateurs d'événements : tous ceux qui rencontrent beaucoup de monde et veulent être contactés facilement.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il une application pour lire une carte NFC ?",
        a: "Non. Les téléphones compatibles ouvrent le lien directement en approchant la carte.",
      },
      {
        q: "Que faire si le téléphone du client ne lit pas le NFC ?",
        a: "Ajoutez le QR code de votre profil sur la carte, il fonctionne sur tous les smartphones.",
      },
      {
        q: "Puis-je changer mes informations après avoir fait la carte ?",
        a: "Oui, la carte mène à votre profil SocialApp, que vous modifiez librement.",
      },
    ],
    related: ["carte-de-visite-digitale", "qr-code-professionnel", "tarifs"],
  },

  entreprises: {
    title: "SocialApp pour entreprises : profil, CRM et marketplace",
    description:
      "SocialApp pour les entreprises en Afrique de l'Ouest : profil digital, boutique, rendez-vous, formulaires et CRM WhatsApp. Plan Business dès 3 990 FCFA/mois.",
    h1: "SocialApp pour les entreprises : une vitrine, une boutique et un CRM",
    intro:
      "Votre entreprise a besoin d'être trouvée, contactée et suivie. SocialApp réunit sur une seule plateforme votre profil digital, votre catalogue, vos rendez-vous et votre suivi client WhatsApp.",
    sections: [
      {
        h2: "Une présence professionnelle sans site web complexe",
        paragraphs: [
          "Votre profil sert de vitrine : présentation, liens, produits, documents et contact. Il se partage par lien ou QR code sur tous vos supports.",
        ],
      },
      {
        h2: "Vendre, planifier, collecter",
        paragraphs: [],
        list: [
          "Marketplace pour présenter vos produits et leurs prix",
          "Calendrier de prise de rendez-vous",
          "Formulaires pour devis et demandes",
          "Pages événement pour vos lancements et salons",
        ],
      },
      {
        h2: "Suivre vos clients avec le CRM WhatsApp",
        paragraphs: [
          "Chaque contact issu de votre profil arrive dans votre CRM. Vous suivez les prospects, envoyez des rappels et automatisez les réponses.",
        ],
      },
      {
        h2: "Le plan Business",
        paragraphs: [
          "Le plan Business coûte 39 900 FCFA par an (10 mois payés sur 12) ou 3 990 FCFA par mois. Il inclut une marketplace et des formulaires illimités.",
        ],
      },
    ],
    faq: [
      {
        q: "SocialApp convient-il à une PME ?",
        a: "Oui, il est conçu pour les PME et indépendants d'Afrique de l'Ouest, avec des prix en FCFA.",
      },
      {
        q: "Puis-je gérer plusieurs produits et clients ?",
        a: "Oui. Le plan Business offre une marketplace illimitée et un CRM pour suivre vos contacts.",
      },
      {
        q: "Comment démarrer ?",
        a: "Créez votre compte, complétez votre profil et partagez votre lien ou votre QR code.",
      },
    ],
    related: ["crm-whatsapp", "tarifs", "carte-de-visite-digitale"],
  },
};

export const SEO_SLUGS = Object.keys(SEO_PAGES);