import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// import sitemap from 'vite-plugin-sitemap'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // sitemap({
    //   hostname: 'https://www.socialapp.work',
    // }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    sourcemap: true, // TEMPORAIRE — à retirer une fois le bug trouvé
    // [RETIRÉ] manualChunks (react / icons / motion / supabase / vendor).
    // Ce découpage manuel a provoqué à trois reprises des crashes "page
    // blanche" en production (ReferenceError "Cannot access '<x>' before
    // initialization", "is not iterable") : dès que deux chunks séparés
    // se référencent mutuellement au niveau module (ex: un paquet vendor
    // qui dépend d'un sous-module non capté par le regex react/motion/...),
    // l'ordre d'évaluation entre chunks n'est plus garanti et un chunk peut
    // s'exécuter avant que l'autre ait fini de s'initialiser. Ce risque est
    // structurel à tout découpage manuel par regex de package et revient
    // à chaque nouvel import ajouté quelque part dans l'app.
    // On repasse donc en bundle unique (comportement par défaut de
    // Rolldown/Rollup pour un site à une seule entrée) : plus gros en Ko,
    // mais un seul graphe de modules, exécuté dans l'ordre topologique
    // naturel des imports -> plus aucune dépendance circulaire entre
    // chunks possible. Si le gain de cache par chunk redevient nécessaire
    // un jour, le refaire via des imports dynamiques (React.lazy) par
    // route plutôt que via manualChunks par nom de paquet.
    chunkSizeWarningLimit: 1200,
  },
})