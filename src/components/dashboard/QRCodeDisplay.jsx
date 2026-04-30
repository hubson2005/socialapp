import React, { useEffect, useRef, useState } from 'react';
import { Download, QrCode, Copy, Check } from 'lucide-react';

const BASE_URL = 'https://www.socialapp.work';

export default function QRCodeDisplay({ profileId, username, userLogo, userName }) {
  const canvasRef = useRef(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileUrl = username
    ? `${BASE_URL}/profil/${username}`
    : `${BASE_URL}/profil/${profileId}`;

  useEffect(() => {
    setQrLoaded(false);
    loadQRCodeLibrary();
  }, [profileId, username]);

  const loadQRCodeLibrary = () => {
    if (window.QRCode) {
      renderQR();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = renderQR;
    script.onerror = () => console.error('Erreur chargement QRCode library');
    document.head.appendChild(script);
  };

  const renderQR = () => {
    const container = canvasRef.current;
    if (!container || !window.QRCode) return;
    
    container.innerHTML = '';
    
    try {
      new window.QRCode(container, {
        text: profileUrl,
        width: 200,
        height: 200,
        colorDark: '#060412',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H
      });
      
      setQrLoaded(true);
      
      // Ajouter le logo au centre après un court délai
      if (userLogo) {
        setTimeout(() => addLogoToQR(), 100);
      }
    } catch (e) {
      console.error('QR generation error:', e);
    }
  };

  const addLogoToQR = () => {
    const container = canvasRef.current;
    if (!container) return;

    const img = container.querySelector('img');
    if (!img) return;

    // Créer un canvas pour combiner QR + logo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;

    const qrImage = new Image();
    qrImage.crossOrigin = 'anonymous';
    
    qrImage.onload = () => {
      // Dessiner le QR code
      ctx.drawImage(qrImage, 0, 0, 200, 200);

      // Créer l'image du logo
      const logoImage = new Image();
      logoImage.crossOrigin = 'anonymous';
      
      logoImage.onload = () => {
        const logoSize = 50;
        const x = (200 - logoSize) / 2;
        const y = (200 - logoSize) / 2;

        // Fond blanc arrondi derrière le logo
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        roundRect(ctx, x - 6, y - 6, logoSize + 12, logoSize + 12, 10);
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';

        // Border gradient
        const gradient = ctx.createLinearGradient(x - 6, y - 6, x + logoSize + 6, y + logoSize + 6);
        gradient.addColorStop(0, '#ff6b35');
        gradient.addColorStop(1, '#f7c948');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundRect(ctx, x - 6, y - 6, logoSize + 12, logoSize + 12, 10);
        ctx.stroke();

        // Dessiner le logo avec clip path arrondi
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, x, y, logoSize, logoSize, 8);
        ctx.clip();
        ctx.drawImage(logoImage, x, y, logoSize, logoSize);
        ctx.restore();

        // Remplacer l'image originale
        img.src = canvas.toDataURL('image/png');
      };

      logoImage.onerror = () => {
        console.error('Erreur chargement logo');
        // Garder le QR code sans logo
        img.src = canvas.toDataURL('image/png');
      };

      logoImage.src = userLogo;
    };

    qrImage.src = img.src;
  };

  // Fonction helper pour dessiner des rectangles arrondis
  const roundRect = (ctx, x, y, width, height, radius) => {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const handleDownload = () => {
    const container = canvasRef.current;
    if (!container) return;

    const img = container.querySelector('img') || container.querySelector('canvas');
    if (!img) return;

    const link = document.createElement('a');
    link.download = `qr-code-${username || userName || profileId}.png`;
    link.href = img.tagName === 'CANVAS' ? img.toDataURL('image/png') : img.src;
    link.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur copie:', err);
      // Fallback pour les navigateurs qui ne supportent pas clipboard
      const textArea = document.createElement('textarea');
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 text-center">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <QrCode className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-bold text-base">Mon QR Code</h3>
      </div>

      {/* QR Code Container avec bordures arrondies */}
      <div className="relative mb-4">
        <div className="bg-white rounded-2xl p-5 shadow-lg inline-block">
          {/* Loading spinner */}
          {!qrLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {/* QR Code */}
          <div 
            ref={canvasRef} 
            className="w-[200px] h-[200px] rounded-xl overflow-hidden mx-auto"
            style={{ opacity: qrLoaded ? 1 : 0.3 }}
          />
        </div>

        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-xl" />
      </div>

      {/* URL Display */}
      <div className="bg-muted/50 rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs">🔗</span>
          <p className="text-xs text-muted-foreground truncate flex-1 font-mono">
            {profileUrl}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bouton Copier le lien */}
        <button
          onClick={handleCopyLink}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-primary/90 to-primary text-primary-foreground hover:from-primary hover:to-primary/90'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copié !</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copier</span>
            </>
          )}
        </button>

        {/* Bouton Télécharger */}
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Télécharger</span>
        </button>
      </div>

      {/* Info tip */}
      <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-xl">
        <div className="flex items-start gap-2">
          <span className="text-base mt-0.5">💡</span>
          <p className="text-xs text-muted-foreground text-left leading-relaxed">
            <span className="font-semibold text-primary">Astuce :</span> Partagez ce QR code sur vos supports marketing pour booster votre visibilité !
          </p>
        </div>
      </div>
    </div>
  );
}