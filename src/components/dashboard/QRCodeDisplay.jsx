import React, { useEffect, useRef, useState } from 'react';
import { Download, QrCode } from 'lucide-react';

export default function QRCodeDisplay({ profileId }) {
  const canvasRef = useRef(null);
  const [qrLoaded, setQrLoaded] = useState(false);

  const profileUrl = `${window.location.origin}/profile/${profileId}`;

  useEffect(() => {
    // Dynamically load qrcode library
    if (window.QRCode) {
      renderQR();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = renderQR;
    document.head.appendChild(script);
  }, [profileId]);

  const renderQR = () => {
    const canvas = canvasRef.current;
    if (!canvas || !window.QRCode) return;
    canvas.innerHTML = '';
    try {
      new window.QRCode(canvas, {
        text: profileUrl,
        width: 160,
        height: 160,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H,
      });
      setQrLoaded(true);
    } catch (e) {
      console.error('QR error', e);
    }
  };

  const handleDownload = () => {
    const img = canvasRef.current?.querySelector('img') || canvasRef.current?.querySelector('canvas');
    if (!img) return;
    const link = document.createElement('a');
    link.download = `qr-${profileId}.png`;
    if (img.tagName === 'CANVAS') {
      link.href = img.toDataURL();
    } else {
      link.href = img.src;
    }
    link.click();
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 text-center">
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm">QR Code</h3>
      </div>

      <div className="flex justify-center mb-3">
        <div
          ref={canvasRef}
          className="w-40 h-40 bg-white rounded-xl flex items-center justify-center overflow-hidden"
        >
          {!qrLoaded && (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground truncate mb-3">{profileUrl}</p>

      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Télécharger le QR
      </button>
    </div>
  );
}
