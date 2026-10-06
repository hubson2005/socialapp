import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'
import './i18n';

// ✅ Après un déploiement, un ancien index.js peut demander un chunk qui
// n'existe plus (hash changé) → 404 + écran vide. On recharge UNE fois
// pour récupérer le nouvel index.html. Le garde-fou sessionStorage évite
// toute boucle de rechargement si le problème est réel côté serveur.
const reloadOnceForNewDeploy = () => {
  if (!sessionStorage.getItem('chunk-reload')) {
    sessionStorage.setItem('chunk-reload', '1');
    window.location.reload();
  }
};

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadOnceForNewDeploy();
});

// Filet de sécurité : selon le chunk, l'erreur remonte comme promesse rejetée
// (import() dynamique sans préchargement) et non via vite:preloadError.
window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event.reason?.message || event.reason || '');
  if (/dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) {
    event.preventDefault();
    reloadOnceForNewDeploy();
  }
});

window.addEventListener('load', () => {
  // L'app a démarré normalement : on réarme le garde-fou pour le prochain déploiement.
  setTimeout(() => sessionStorage.removeItem('chunk-reload'), 3000);
});

// ✅ Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // updateViaCache:'none' → le navigateur ne sert jamais service-worker.js
      // depuis le cache HTTP, donc une nouvelle version est détectée au déploiement.
      const registration = await navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' });
      registration.update();
      console.log('Service Worker enregistré :', registration);
    } catch (err) {
      console.error('Erreur Service Worker :', err);
    }
  });
}

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)