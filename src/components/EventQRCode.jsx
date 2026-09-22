import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * Génère et affiche le QR code d'un événement à partir de son slug.
 * Aucun appel serveur : le QR encode simplement l'URL publique.
 *
 * npm i qrcode
 */
export default function EventQRCode({ slug, size = 200 }) {
  const [dataUrl, setDataUrl] = useState(null);
  const url = `https://socialapp.work/e/${slug}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { width: size, margin: 1, color: { dark: '#0a0818', light: '#ffffff' } })
      .then((d) => { if (!cancelled) setDataUrl(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [url, size]);

  if (!dataUrl) {
    return <div style={{ width: size, height: size, borderRadius: 12, background: 'rgba(255,255,255,.05)' }} />;
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <img src={dataUrl} alt={`QR code de l'événement ${slug}`} width={size} height={size} style={{ borderRadius: 12 }} />
      <a href={dataUrl} download={`qr-${slug}.png`} style={{ fontSize: 12, color: '#ff6b35', textDecoration: 'none' }}>
        Télécharger le QR code
      </a>
    </div>
  );
}