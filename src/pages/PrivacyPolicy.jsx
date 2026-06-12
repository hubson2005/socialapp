export default function PrivacyPolicy() {
  const sections = [
    {
      num: "1",
      title: "Présentation",
      content: (
        <p>
          SocialApp est une plateforme permettant aux particuliers, entrepreneurs, entreprises et organisations de créer
          un profil digital personnalisé, gérer leurs prospects (CRM), suivre leurs statistiques et développer leur
          présence en ligne.<br /><br />
          La protection de vos données personnelles est une priorité pour SocialApp.
        </p>
      ),
    },
    {
      num: "2",
      title: "Informations collectées",
      content: (
        <>
          <p>Lors de l'utilisation de SocialApp, nous pouvons collecter :</p>
          <ul>
            <li>Nom et prénom</li>
            <li>Adresse e-mail</li>
            <li>Photo de profil</li>
            <li>Informations de connexion</li>
            <li>Données de navigation sur la plateforme</li>
            <li>Informations liées aux profils digitaux créés</li>
            <li>Informations relatives aux prospects et contacts gérés par l'utilisateur</li>
          </ul>
        </>
      ),
    },
    {
      num: "3",
      title: "Connexion avec Google",
      content: (
        <>
          <p>Lorsque vous choisissez de vous connecter avec Google, SocialApp peut accéder aux informations suivantes :</p>
          <ul>
            <li>Votre nom</li>
            <li>Votre adresse e-mail</li>
            <li>Votre photo de profil Google</li>
          </ul>
          <p>Ces informations sont utilisées uniquement pour :</p>
          <ul>
            <li>Créer ou connecter votre compte SocialApp</li>
            <li>Sécuriser votre authentification</li>
            <li>Personnaliser votre expérience utilisateur</li>
          </ul>
          <p>SocialApp ne vend, ne loue et ne partage jamais vos données Google à des tiers à des fins commerciales.</p>
        </>
      ),
    },
    {
      num: "4",
      title: "Utilisation des données",
      content: (
        <>
          <p>Les données collectées servent à :</p>
          <ul>
            <li>Fournir les fonctionnalités de SocialApp</li>
            <li>Gérer les comptes utilisateurs</li>
            <li>Assurer la sécurité de la plateforme</li>
            <li>Fournir un support client</li>
            <li>Améliorer les performances et fonctionnalités du service</li>
          </ul>
        </>
      ),
    },
    {
      num: "5",
      title: "Partage des données",
      content: (
        <>
          <p>SocialApp ne partage pas vos données personnelles avec des tiers, sauf :</p>
          <ul>
            <li>Lorsque la loi l'exige</li>
            <li>Pour protéger nos droits légaux</li>
            <li>Avec des prestataires techniques nécessaires au fonctionnement du service</li>
          </ul>
        </>
      ),
    },
    {
      num: "6",
      title: "Conservation des données",
      content: (
        <p>
          Les données sont conservées aussi longtemps que votre compte reste actif ou lorsque cela est nécessaire
          pour respecter nos obligations légales.
        </p>
      ),
    },
    {
      num: "7",
      title: "Sécurité",
      content: (
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles visant à protéger vos données contre
          tout accès non autorisé, perte ou divulgation.
        </p>
      ),
    },
    {
      num: "8",
      title: "Vos droits",
      content: (
        <>
          <p>Vous pouvez à tout moment :</p>
          <ul>
            <li>Accéder à vos données</li>
            <li>Modifier vos informations</li>
            <li>Demander la suppression de votre compte</li>
            <li>Demander la suppression de vos données personnelles</li>
          </ul>
        </>
      ),
    },
    {
      num: "9",
      title: "Contact",
      content: (
        <p>
          Pour toute question relative à cette politique de confidentialité :<br />
          Email : <a href="mailto:contact@socialapp.work">contact@socialapp.work</a><br />
          Site web :{" "}
          <a href="https://www.socialapp.work" target="_blank" rel="noopener noreferrer">
            https://www.socialapp.work
          </a>
        </p>
      ),
    },
    {
      num: "10",
      title: "Modifications",
      content: (
        <p>
          Cette politique peut être mise à jour à tout moment. Les modifications seront publiées sur cette page
          avec une nouvelle date de mise à jour.
        </p>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      <h1>Politique de confidentialité</h1>
      <p>Dernière mise à jour : 08 juin 2026</p>

      {sections.map((section) => (
        <div key={section.num}>
          <h2>
            {section.num}. {section.title}
          </h2>
          {section.content}
        </div>
      ))}
    </div>
  );
}