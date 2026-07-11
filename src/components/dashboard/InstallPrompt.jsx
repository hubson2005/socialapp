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
  const ios = React.useMemo(() => isIOS(), []);

  React.useEffect(() => {
    if (isStandalone()) return; // déjà installé, on n'affiche rien

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() < dismissedUntil) return;

    if (ios) {
      // iOS n'a pas d'event beforeinstallprompt : on affiche direct
      setVisible(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [ios]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86400000));
    setVisible(false);
    setShowIOSSteps(false);
  };

  const handleInstall = async () => {
    if (ios) {
      setShowIOSSteps(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      dismiss();
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div style={{
      background: 'linear-gradient(180deg,#0d1330,#0a0f24)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: '16px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      marginBottom: '16px',
    }}>
      {/* Icône app */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
        background: 'linear-gradient(135deg,#3b4bf0,#a52ee0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: 'white', fontSize: '15px',
      }}>
        SA
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: '0 0 2px' }}>
          Installer l'application SocialApp
        </p>
        {!showIOSSteps ? (
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11.5px', margin: 0 }}>
            Accès rapide depuis ton écran d'accueil, plein écran.
          </p>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            Appuie sur <Share size={12} style={{ display: 'inline' }} /> puis
            <PlusSquare size={12} style={{ display: 'inline' }} /> « Sur l'écran d'accueil »
          </p>
        )}
      </div>

      {!showIOSSteps && (
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
  );
}