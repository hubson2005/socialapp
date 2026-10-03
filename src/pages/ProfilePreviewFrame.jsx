import React, { useEffect, useState } from 'react';
import PublicProfile from './PublicProfile';

export default function ProfilePreviewFrame() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== window.parent) return;
      if (e.data?.type === 'PREVIEW_UPDATE') setProfile(e.data.payload);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: 'PREVIEW_READY' }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Accès direct hors iframe : rien à afficher
  if (window.parent === window) return null;
  if (!profile) return <div style={{ minHeight:'100dvh', background:'#0f0a1e' }} />;

  return <PublicProfile previewProfile={profile} />;
}