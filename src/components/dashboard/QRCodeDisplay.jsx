import React, { useEffect, useRef, useState } from 'react';
import { Download, QrCode, Copy, Check, X } from 'lucide-react';

const BASE_URL = 'https://www.socialapp.work';

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function QRCodeDisplay({ profileId, username, userLogo, userName }) {
  const containerRef = useRef(null);
  const qrInstanceRef = useRef(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  const profileUrl = username
    ? `${BASE_URL}/profil/${username}`
    : `${BASE_URL}/profil/${profileId}`;

  useEffect(() => {
    setQrLoaded(false);
    loadLibraryAndRender();
  }, [profileId, username, userLogo]);

  const loadLibraryAndRender = () => {
    if (window.QRCodeStyling) {
      renderStyledQR();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js';
    script.onload = renderStyledQR;
    script.onerror = () => console.error('Erreur chargement QRCodeStyling');
    document.head.appendChild(script);
  };

  const renderStyledQR = () => {
    const container = containerRef.current;
    if (!container || !window.QRCodeStyling) return;

    container.innerHTML = '';

    const qr = new window.QRCodeStyling({
      width: 200,
      height: 200,
      type: 'canvas',
      data: profileUrl,
      // ── Style dots arrondis ──────────────────────────────────────
      dotsOptions: {
        type: 'rounded',       // dots arrondis comme dans l'image
        color: '#060412',
      },
      cornersSquareOptions: {
        type: 'extra-rounded', // coins finder arrondis
        color: '#060412',
      },
      cornersDotOptions: {
        type: 'dot',           // point central finder
        color: '#060412',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      // ── Logo centré si fourni ────────────────────────────────────
      ...(userLogo ? {
        image: userLogo,
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 4,
          imageSize: 0.25,
        },
      } : {}),
      qrOptions: {
        errorCorrectionLevel: 'H',
      },
    });

    qr.append(container);
    qrInstanceRef.current = qr;

    setTimeout(() => setQrLoaded(true), 300);
  };

  const getQrDataUrl = () => {
    const container = containerRef.current;
    if (!container) return null;
    const canvas = container.querySelector('canvas');
    if (canvas) return canvas.toDataURL('image/png');
    return null;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (isMobile()) {
        const dataUrl = getQrDataUrl();
        if (dataUrl) {
          setQrDataUrl(dataUrl);
          setShowMobileModal(true);
        }
      } else {
        if (qrInstanceRef.current) {
          qrInstanceRef.current.download({
            name: `qr-${username || profileId}`,
            extension: 'png',
          });
        }
      }
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      const dataUrl = getQrDataUrl();
      if (dataUrl) window.open(dataUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = profileUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* ── Modale mobile ─────────────────────────────────────────── */}
      {showMobileModal && qrDataUrl && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setShowMobileModal(false)}
        >
          <div
            style={{
              background: '#1a1a2e', borderRadius: '24px',
              padding: '24px', maxWidth: '320px', width: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0 }}>
                📱 Sauvegarder le QR Code
              </p>
              <button
                onClick={() => setShowMobileModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', textAlign: 'center', marginBottom: '16px' }}>
              <img
                src={qrDataUrl}
                alt="QR Code"
                style={{ width: '200px', height: '200px', display: 'block', margin: '0 auto', borderRadius: '8px' }}
              />
            </div>

            <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
                👆 <strong>Appuyez longuement</strong> sur l'image ci-dessus<br />
                puis choisissez <strong>"Enregistrer l'image"</strong>
              </p>
            </div>

            <button
              onClick={() => setShowMobileModal(false)}
              style={{
                width: '100%', padding: '12px',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: 'none', borderRadius: '12px',
                color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── Carte principale ──────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <QrCode className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="font-bold text-sm">Mon QR Code</h3>
        </div>

        {/* QR Code */}
        <div className="relative mb-3">
          <div className="bg-white rounded-2xl p-4 shadow-lg inline-block">
            {/* Spinner */}
            {!qrLoaded && (
              <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {/* Container QR rendu par qr-code-styling — caché jusqu'au chargement */}
            <div
              ref={containerRef}
              style={{
                width: '160px',
                height: '160px',
                display: qrLoaded ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '8px',
              }}
            />
          </div>
          {/* Coins décoratifs */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br-xl" />
        </div>

        {/* URL */}
        <div className="bg-muted/50 rounded-xl px-3 py-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs">🔗</span>
            <p className="text-xs text-muted-foreground truncate flex-1 font-mono">{profileUrl}</p>
          </div>
        </div>

        {/* Boutons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyLink}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              copied ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-primary/90 to-primary text-primary-foreground'
            }`}
          >
            {copied
              ? <><Check className="w-3.5 h-3.5" /> Copié !</>
              : <><Copy className="w-3.5 h-3.5" /> Copier</>}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || !qrLoaded}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Chargement...' : 'Télécharger'}
          </button>
        </div>

        {/* Astuce */}
        <div className="mt-3 p-2.5 bg-primary/5 border border-primary/10 rounded-xl">
          <div className="flex items-start gap-2">
            <span className="text-sm">💡</span>
            <p className="text-xs text-muted-foreground text-left leading-relaxed">
              <span className="font-semibold text-primary">Astuce :</span> Partagez ce QR code sur vos supports marketing pour booster votre visibilité !
            </p>
          </div>
        </div>
      </div>
    </>
  );
}