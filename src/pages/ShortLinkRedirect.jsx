import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; // ⚠️ adapte ce chemin selon l'emplacement réel du fichier

// ⚠️ HYPOTHÈSE À VÉRIFIER : ce composant redirige vers `/${username}` en
// supposant que le profil public est servi à cette route (ex: socialapp.work/kouam).
// Si ta route de profil public est différente (ex: /p/:username, /profile/:username),
// adapte la ligne `navigate(...)` plus bas en conséquence.
export default function ShortLinkRedirect() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'notfound'

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: link, error: linkError } = await supabase
        .from('profile_shortlinks')
        .select('profile_id')
        .eq('slug', slug)
        .maybeSingle();

      if (cancelled) return;
      if (linkError || !link) { setStatus('notfound'); return; }

      const { data: profile, error: profileError } = await supabase
        .from('link_profiles')
        .select('username')
        .eq('id', link.profile_id)
        .maybeSingle();

      if (cancelled) return;
      if (profileError || !profile?.username) { setStatus('notfound'); return; }

      // Comptage de clic en best-effort — ne bloque jamais la redirection,
      // même si l'appel échoue (réseau, RPC indisponible, etc.).
      supabase.rpc('increment_shortlink_clicks', { p_slug: slug }).then(() => {}).catch(() => {});

      navigate(`/${profile.username}`, { replace: true });
    })();

    return () => { cancelled = true; };
  }, [slug, navigate]);

  if (status === 'notfound') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0d1a', color: 'white', textAlign: 'center', padding: '24px' }}>
        <div>
          <p style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Lien introuvable</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>
            Ce raccourci n'existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0d1a' }}>
      <div style={{ width: '26px', height: '26px', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'shortlink-spin 0.8s linear infinite' }} />
      <style>{`@keyframes shortlink-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}