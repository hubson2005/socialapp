export default function TermsOfService() {
  const sections = [
    {
      num: "1",
      title: "Acceptation des conditions",
      content: (
        <p>
          En accédant à SocialApp et en utilisant ses services, vous acceptez les présentes Conditions d'utilisation.
          Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.
        </p>
      ),
    },
    {
      num: "2",
      title: "Présentation du service",
      content: (
        <>
          <p>SocialApp est une plateforme permettant aux utilisateurs de :</p>
          <ul>
            <li>Créer un profil digital personnalisé</li>
            <li>Partager leurs liens et réseaux sociaux</li>
            <li>Gérer leurs prospects via un CRM intégré</li>
            <li>Générer et utiliser des QR Codes</li>
            <li>Suivre les statistiques de consultation et d'interaction</li>
            <li>Gérer des événements et inscriptions</li>
            <li>Développer leur présence digitale</li>
          </ul>
        </>
      ),
    },
    {
      num: "3",
      title: "Création de compte",
      content: (
        <>
          <p>L'utilisateur peut créer un compte à l'aide :</p>
          <ul>
            <li>D'une adresse e-mail</li>
            <li>D'un compte Google</li>
          </ul>
          <p>L'utilisateur s'engage à fournir des informations exactes et à maintenir leur mise à jour.</p>
        </>
      ),
    },
    {
      num: "4",
      title: "Responsabilités de l'utilisateur",
      content: (
        <>
          <p>L'utilisateur est seul responsable :</p>
          <ul>
            <li>Des informations publiées sur son profil</li>
            <li>Des contenus, images et liens partagés</li>
            <li>Du respect des lois applicables dans son pays</li>
          </ul>
          <p>Il est interdit de publier :</p>
          <ul>
            <li>Du contenu illégal</li>
            <li>Du contenu frauduleux</li>
            <li>Du contenu diffamatoire</li>
            <li>Du contenu portant atteinte aux droits d'autrui</li>
          </ul>
        </>
      ),
    },
    {
      num: "5",
      title: "Protection des comptes",
      content: (
        <p>
          Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion.
          Toute activité réalisée depuis un compte est réputée effectuée par son titulaire.
        </p>
      ),
    },
    {
      num: "6",
      title: "Propriété intellectuelle",
      content: (
        <p>
          Les éléments constituant SocialApp (design, logo, fonctionnalités, marque, code source et contenus propriétaires)
          demeurent la propriété exclusive de SocialApp. Toute reproduction non autorisée est interdite.
        </p>
      ),
    },
    {
      num: "7",
      title: "Disponibilité du service",
      content: (
        <p>
          Nous nous efforçons d'assurer la disponibilité du service. Cependant, SocialApp ne garantit pas une
          disponibilité permanente et peut interrompre temporairement le service pour maintenance ou amélioration.
        </p>
      ),
    },
    {
      num: "8",
      title: "Limitation de responsabilité",
      content: (
        <>
          <p>SocialApp ne pourra être tenu responsable :</p>
          <ul>
            <li>Des pertes de données résultant d'une mauvaise utilisation du service</li>
            <li>Des interruptions temporaires du service</li>
            <li>Des contenus publiés par les utilisateurs</li>
          </ul>
        </>
      ),
    },
    {
      num: "9",
      title: "Résiliation",
      content: (
        <p>
          Nous nous réservons le droit de suspendre ou supprimer tout compte en cas de violation des présentes conditions.
          L'utilisateur peut également supprimer son compte à tout moment.
        </p>
      ),
    },
    {
      num: "10",
      title: "Modification des conditions",
      content: (
        <p>
          SocialApp peut modifier les présentes Conditions d'utilisation à tout moment.
          Les nouvelles versions seront publiées sur cette page.
        </p>
      ),
    },
    {
      num: "11",
      title: "Contact",
      content: (
        <p>
          Pour toute question concernant ces Conditions d'utilisation :<br />
          Email : <a href="mailto:contact@socialapp.work">contact@socialapp.work</a><br />
          Site web : <a href="https://www.socialapp.work" target="_blank" rel="noopener noreferrer">https://www.socialapp.work</a>
        </p>
      ),
    },
    {
      num: "12",
      title: "Droit applicable",
      content: (
        <p>
          Les présentes Conditions d'utilisation sont régies par les lois applicables en Côte d'Ivoire.
        </p>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      <h1>Conditions d'utilisation</h1>
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