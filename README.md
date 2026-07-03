# Sitemaps SocialApp — architecture évolutive

## Installation

```bash
npm install sitemap @supabase/supabase-js
```

Variables d'environnement requises :

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Branchement dans server.js

```js
const express = require("express");
const sitemapRoutes = require("./routes/sitemap");

const app = express();
app.use("/", sitemapRoutes);

app.listen(3000);
```

## URLs exposées

- `GET /sitemap-index.xml` → à soumettre dans Search Console
- `GET /sitemap-pages.xml` → pages fixes (/, /tarifs, /contact, /a-propos, /fonctionnalites)
- `GET /sitemap-profils-1.xml`, `-2.xml`, ... → profils publics, paginés à 45 000 URLs/fichier
- `GET /sitemap-entreprises-1.xml`, ... → entreprises publiques
- `GET /sitemap-articles-1.xml`, ... → articles publiés
- `GET /sitemap.xml` → redirection 301 vers `/sitemap-index.xml` (compat ancien lien)

## robots.txt

```
User-agent: *
Allow: /

Sitemap: https://www.socialapp.work/sitemap-index.xml
```

## Search Console

1. Supprimez l'ancien sitemap (`/sitemap.xml` si c'était un fichier statique).
2. Ajoutez `https://www.socialapp.work/sitemap-index.xml`.
3. Cliquez sur "Valider le correctif" si l'ancienne erreur était liée à un sitemap invalide.

## Cache

Chaque route est mise en cache en mémoire pendant 1h (`TTL_MS` dans `lib/sitemapService.js`).
En production multi-instance (plusieurs conteneurs/dynos), remplacez le `Map()` en mémoire
par Redis pour que le cache soit partagé entre toutes les instances, sinon chaque instance
régénère indépendamment et le TTL n'a plus vraiment de sens.

Pour invalider le cache manuellement après une mise à jour massive de données :

```js
const { invalidateCache } = require("./lib/sitemapService");
invalidateCache(); // vide tout
invalidateCache("sitemap-profils"); // vide uniquement les sitemaps de profils
```

## Limites respectées

- 45 000 URLs max par fichier (marge sous la limite officielle de 50 000)
- Échappement XML automatique via le package `sitemap` (gère les slugs avec `&`, `<`, etc.)
- `lastmod` toujours au format `YYYY-MM-DD`, dérivé de `updated_at`

## Ajouter un nouveau type de contenu plus tard

Dans `routes/sitemap.js`, il suffit d'appeler `registerPaginatedRoute` avec les bons
paramètres (table Supabase, préfixe d'URL, changefreq/priority), puis d'ajouter le
type correspondant dans la boucle du `/sitemap-index.xml`. Aucune autre modification
n'est nécessaire, même si le volume dépasse plusieurs centaines de milliers de lignes.