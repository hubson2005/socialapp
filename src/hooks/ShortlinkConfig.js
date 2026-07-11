// Domaine dédié aux raccourcis de lien — sous-domaine gratuit de
// socialapp.work (pas d'achat de domaine nécessaire, juste un CNAME).
// Centralisé ici pour ne pas répéter la chaîne en dur dans chaque composant.
export const SHORTLINK_DOMAIN = 'lien.socialapp.work';
export const SHORTLINK_BASE_URL = `https://${SHORTLINK_DOMAIN}`;

// À utiliser dans le routeur principal (là où vit déjà isAdminDomain()) pour
// détecter qu'on est servi depuis le sous-domaine des raccourcis :
//
//   import { SHORTLINK_DOMAIN } from './config/shortlinks';
//   export const isShortlinkDomain = () =>
//     typeof window !== 'undefined' && window.location.hostname === SHORTLINK_DOMAIN;
//
// Puis, dans l'arbre de routes, monter la route slug À LA RACINE (pas /s/:slug)
// uniquement quand isShortlinkDomain() est vrai — le sous-domaine remplace
// le préfixe /s/ :
//
//   {isShortlinkDomain() ? (
//     <Route path="/:slug" element={<ShortLinkRedirect />} />
//   ) : (
//     <Route path="/s/:slug" element={<ShortLinkRedirect />} />
//   )}
//
// ShortLinkRedirect.jsx n'a besoin d'aucune modification pour ça : il lit
// déjà `slug` via useParams(), quel que soit le chemin de la route.
export const isShortlinkDomain = () =>
  typeof window !== 'undefined' && window.location.hostname === SHORTLINK_DOMAIN;

