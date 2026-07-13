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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // IMPORTANT : on matche des segments de chemin EXACTS
          // (/node_modules/<pkg>/), jamais une simple sous-chaîne.
          // L'ancien code faisait id.includes('react'), qui attrape aussi
          // react-router-dom, react-i18next, @tanstack/react-query,
          // react-hook-form, react-helmet-async, sonner-react, etc. et les
          // fourre dans le même chunk que react/react-dom sans garantie
          // d'ordre d'exécution entre eux. Résultat en prod (Rollup fait ce
          // découpage, pas esbuild/dev, d'où "ça marche en dev mais pas en
          // build") : ce chunk peut s'évaluer avant que React soit
          // pleinement initialisé -> les hooks renvoient undefined ->
          // const [x, y] = useState(...) explose avec "is not iterable" ->
          // crash React global -> page blanche.
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) return 'react'

          if (id.includes('/node_modules/react-icons/')) return 'icons'
          if (id.includes('/node_modules/framer-motion/')) return 'motion'
          if (id.includes('/node_modules/@supabase/')) return 'supabase'

          return 'vendor'
        }
      }
    },
    chunkSizeWarningLimit: 800,
  },
})