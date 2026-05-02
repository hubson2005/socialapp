import React, { useEffect, useRef, useState } from 'react';
import { Download, QrCode, Copy, Check } from 'lucide-react';

const BASE_URL = 'https://www.socialapp.work';

export default function QRCodeDisplay({ profileId, username, userLogo, userName }) {
  const canvasRef = useRef(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const profileUrl = username
    ? `${BASE_URL}/profil/${username}`
    : `${BASE_URL}/profil/${profileId}`;

  useEffect(() => {
    setQrLoaded(false);
    loadQRCodeLibrary();
  }, [profileId, username]);

  const loadQRCodeLibrary = () => {
    if (window.QRCode) { renderQR(); return; }
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
        correctLevel: window.QRCode.CorrectLevel.H,
      });
      setQrLoaded(true);
      if (userLogo) setTimeout(() => addLogoToQR(), 100);
    } catch (e) {
      console.error('QR generation error:', e);
    }
  };

  const addLogoToQR = () => {
    const container = canvasRef.current;
    if (!container) return;
    const img = container.querySelector('img');
    if (!img) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200; canvas.height = 200;
    const qrImage = new Image();
    qrImage.crossOrigin = 'anonymous';
    qrImage.onload = () => {
      ctx.drawImage(qrImage, 0, 0, 200, 200);
      const logoImage = new Image();
      logoImage.crossOrigin = 'anonymous';
      logoImage.onload = () => {
        const logoSize = 50;
        const x = (200 - logoSize) / 2;
        const y = (200 - logoSize) / 2;
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 8;
        ctx.beginPath(); roundRect(ctx, x - 6, y - 6, logoSize + 12, logoSize + 12, 10); ctx.fill();
        ctx.shadowColor = 'transparent';
        const gradient = ctx.createLinearGradient(x - 6, y - 6, x + logoSize + 6, y + logoSize + 6);
        gradient.addColorStop(0, '#ff6b35'); gradient.addColorStop(1, '#f7c948');
        ctx.strokeStyle = gradient; ctx.lineWidth = 2;
        ctx.beginPath(); roundRect(ctx, x - 6, y - 6, logoSize + 12, logoSize + 12, 10); ctx.stroke();
        ctx.save();
        ctx.beginPath(); roundRect(ctx, x, y, logoSize, logoSize, 8); ctx.clip();
        ctx.drawImage(logoImage, x, y, logoSize, logoSize);
        ctx.restore();
        img.src = canvas.toDataURL('image/png');
      };
      logoImage.onerror = () => { img.src = canvas.toDataURL('image/png'); };
      logoImage.src = userLogo;
    };
    qrImage.src = img.src;
  };

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

  // ── Download fix mobile ────────────────────────────────────────────────────
  const handleDownload = async () => {
    const container = canvasRef.current;
    if (!container) return;
    const img = container.querySelector('img') || container.querySelector('canvas');
    if (!img) return;

    setDownloading(true);
    try {
      const dataUrl = img.tagName === 'CANVAS' ? img.toDataURL('image/png') : img.src;

      // Convertir en Blob pour contourner le bug mobile (index.html)
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `qr-${username || profileId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      // Fallback : ouvrir dans un nouvel onglet
      const img2 = container.querySelector('img');
      if (img2) window.open(img2.src, '_blank');
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
    <div className="bg-card rounded-2xl border border-border p-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <QrCode className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="font-bold text-sm">Mon QR Code</h3>
      </div>

      <div className="relative mb-3">
        <div className="bg-white rounded-2xl p-4 shadow-lg inline-block">
          {!qrLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={canvasRef} className="w-[160px] h-[160px] rounded-xl overflow-hidden mx-auto" style={{ opacity: qrLoaded ? 1 : 0.3 }} />
        </div>
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br-xl" />
      </div>

      <div className="bg-muted/50 rounded-xl px-3 py-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs">🔗</span>
          <p className="text-xs text-muted-foreground truncate flex-1 font-mono">{profileUrl}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleCopyLink}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            copied ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-primary/90 to-primary text-primary-foreground'
          }`}
        >
          {copied ? <><Check className="w-3.5 h-3.5" /> Copié !</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading || !qrLoaded}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {downloading ? 'Export...' : 'Télécharger'}
        </button>
      </div>

      <div className="mt-3 p-2.5 bg-primary/5 border border-primary/10 rounded-xl">
        <div className="flex items-start gap-2">
          <span className="text-sm">💡</span>
          <p className="text-xs text-muted-foreground text-left leading-relaxed">
            <span className="font-semibold text-primary">Astuce :</span> Partagez ce QR code sur vos supports marketing pour booster votre visibilité !
          </p>
        </div>
      </div>
    </div>
  );
}