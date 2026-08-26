import React from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

const DISMISS_KEY = 'sa_install_prompt_dismissed_until';
const DISMISS_DAYS = 7;

function isStandalone() {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true
  );
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !window.MSStream;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [visible, setVisible] = React.useState(false);
  const [showIOSSteps, setShowIOSSteps] = React.useState(false);
  const [showManualSteps, setShowManualSteps] = React.useState(false);
  const ios = React.useMemo(() => isIOS(), []);

  React.useEffect(() => {
    const forceDebug = new URLSearchParams(window.location.search).get('forceInstallPrompt') === '1';

    if (isStandalone() && !forceDebug) return; // déjà installé, on n'affiche rien

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() < dismissedUntil && !forceDebug) return;

    // [FIX] Auparavant, sur Android/desktop, la bannière n'apparaissait
    // QUE lorsque Chrome avait déjà déclenché "beforeinstallprompt" —
    // un événement soumis à ses propres heuristiques d'engagement
    // (parfois retardé, en particulier lors des toutes premières visites
    // après un déploiement). Résultat : le bandeau pouvait ne jamais
    // s'afficher à temps. On affiche maintenant la bannière tout de
    // suite dans tous les cas (comme sur iOS), et on écoute l'event en
    // arrière-plan pour activer l'installation native dès qu'elle est
    // prête. Si l'utilisateur clique avant que l'event soit arrivé, on
    // bascule sur des instructions manuelles (voir handleInstall).
    setVisible(true);

    if (ios) return; // iOS n'a pas d'event beforeinstallprompt

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [ios]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86400000));
    setVisible(false);
    setShowIOSSteps(false);
    setShowManualSteps(false);
  };

  const handleInstall = async () => {
    if (ios) {
      setShowIOSSteps(true);
      return;
    }
    if (!deferredPrompt) {
      // L'event natif n'est pas encore arrivé (ou ce navigateur ne le
      // déclenche jamais, ex. certains navigateurs Android non-Chrome) :
      // on guide l'utilisateur vers le menu du navigateur.
      setShowManualSteps(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      dismiss();
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  const showSteps = showIOSSteps || showManualSteps;

  return (
    <>
      <style>{`
        @keyframes installPromptSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        bottom: 'calc(20px + env(safe-area-inset-bottom))',
        right: '20px',
        left: 'auto',
        maxWidth: '380px',
        width: 'calc(100vw - 40px)',
        zIndex: 9999,
        background: 'linear-gradient(180deg,#0d1330,#0a0f24)',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        animation: 'installPromptSlideIn 0.25s ease',
      }}>
        {/* Icône app */}
        <img
          src="/icon-192.png"
          alt="SocialApp"
          style={{
            width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
            objectFit: 'cover',
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: '0 0 2px' }}>
            Installer l'application SocialApp
          </p>
          {!showSteps ? (
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11.5px', margin: 0 }}>
              Accès rapide depuis ton écran d'accueil, plein écran.
            </p>
          ) : showIOSSteps ? (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              Appuie sur <Share size={12} style={{ display: 'inline' }} /> puis
              <PlusSquare size={12} style={{ display: 'inline' }} /> « Sur l'écran d'accueil »
            </p>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11.5px', margin: 0 }}>
              Ouvre le menu ⋮ de ton navigateur puis « Installer l'application »
            </p>
          )}
        </div>

        {!showSteps && (
          <button onClick={handleInstall} style={{
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: 'none', borderRadius: '10px', color: 'white',
            fontSize: '12.5px', fontWeight: 700, padding: '9px 16px',
            cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            Installer
          </button>
        )}

        <button onClick={dismiss} aria-label="Fermer" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)', flexShrink: 0, padding: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={16} />
        </button>
      </div>
    </>
  );
}