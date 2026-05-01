import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { ExternalLink, Phone } from 'lucide-react';
import { PLATFORMS } from '../components/dashboard/AddPlatformDialog';

const parseColors = (themeColor) => {
  if (themeColor && themeColor.includes('|')) {
    const parts = themeColor.split('|');
    return { bg1: parts[0], bg2: parts[1] };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

const getCountdown = (eventDate) => {
  if (!eventDate) return null;
  const diff = new Date(eventDate) - new Date();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, mins, secs };
};

const WhatsAppIcon = ({ size = 16, color = '#25D366' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.2 13.8c-.2.6-1.3 1.2-1.8 1.2-.5.1-1.1.1-1.6-.1-1-.3-2-1-2.8-1.8A9.2 9.2 0 0 1 9 12.4c-.2-.5-.2-1-.1-1.5.1-.5.6-1.1 1-1.3.3-.1.5-.1.7 0 .2 0 .3 0 .4.3l.6 1.6c0 .1.1.3 0 .4-.1.2-.2.3-.3.4-.1.1-.3.3-.2.5.4.7 1 1.3 1.7 1.7.2.1.4 0 .5-.1l.5-.6c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.4.1.3 0 .8-.2 1z"/>
  </svg>
);

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('link_profiles')
        .select('*')
        .eq('username', username)
        .single();
      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data);
        await supabase.from('profile_stats').insert([{ profile_id: data.id, event_type: 'view' }]);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!profile?.is_event || !profile?.event_date) return;
    const timer = setInterval(() => {
      setCountdown(getCountdown(profile.event_date));
    }, 1000);
    setCountdown(getCountdown(profile.event_date));
    return () => clearInterval(timer);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;

    const existing = document.getElementById('__bg_style__');
    if (existing) existing.remove();

    const html = document.documentElement;
    const body = document.body;
    html.style.background = 'transparent';
    body.style.background = 'transparent';

    const style = document.createElement('style');
    style.id = '__bg_style__';

    if (profile.bg_image_url) {
      style.textContent = `
        #__bg_layer__ {
          position: fixed;
          top: 0; left: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          z-index: -10;
          background-image: url(${JSON.stringify(profile.bg_image_url)});
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          transform: translateZ(0);
          will-change: transform;
        }
        #__bg_overlay__ {
          position: fixed;
          top: 0; left: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          z-index: -9;
          background: linear-gradient(160deg, rgba(0,0,0,0.52), rgba(0,0,0,0.36));
          pointer-events: none;
        }
      `;
    } else {
      const colors = parseColors(profile.theme_color);
      style.textContent = `
        #__bg_layer__ {
          position: fixed;
          top: 0; left: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          z-index: -10;
          background: linear-gradient(160deg, ${colors.bg1}, ${colors.bg2});
        }
        #__bg_overlay__ { display: none; }
      `;
    }

    document.head.appendChild(style);

    return () => {
      const s = document.getElementById('__bg_style__');
      if (s) s.remove();
      html.style.background = '';
      body.style.background = '';
    };
  }, [profile]);

  const handleLinkClick = async (link) => {
    if (!profile) return;
    await supabase.from('profile_stats').insert([{
      profile_id: profile.id,
      event_type: 'click',
      platform: link.platform,
    }]);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0a1e' }}>
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center text-white" style={{ background: '#0f0a1e' }}>
      <p>Profil introuvable.</p>
    </div>
  );

  const colors = parseColors(profile.theme_color);
  const links = profile.links || [];
  const enabledLinks = links.filter(l => l.enabled !== false);
  const ec1 = profile.event_color1 || '#ff6b35';
  const ec2 = profile.event_color2 || '#f7c948';

  return (
    <>
      <style>{`
        html, body { min-height: 100%; margin: 0; padding: 0; background: transparent; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <div id="__bg_layer__" />
      <div id="__bg_overlay__" />

      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 16px',
      }}>

        {/* Avatar + Badge */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          {profile.avatar_url ? (
            <div style={{ padding: '3px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05))', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <img src={profile.avatar_url} alt={profile.display_name} style={{ width: '112px', height: '112px', borderRadius: '24px', objectFit: 'cover', display: 'block' }} />
            </div>
          ) : (
            <div style={{ padding: '3px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05))', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <div style={{ width: '112px', height: '112px', borderRadius: '24px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', color: 'white' }}>
                {profile.display_name ? profile.display_name[0].toUpperCase() : '?'}
              </div>
            </div>
          )}
          {profile.is_verified && (
            <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: '3px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', boxShadow: '0 4px 12px rgba(34,197,94,0.5)' }}>✓</div>
          )}
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', textAlign: 'center' }}>
          {profile.display_name}
          {profile.is_verified && <span style={{ marginLeft: '8px', fontSize: '16px', color: '#22c55e' }}>✓</span>}
        </h1>

        {profile.bio && (
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', textAlign: 'center', maxWidth: '300px', marginBottom: '16px' }}>{profile.bio}</p>
        )}

        {profile.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '16px' }}>
            <Phone size={16} />
            {profile.phone}
          </div>
        )}

        {/* Mode Événement */}
        {profile.is_event && profile.event_name && (
          <div style={{ width: '100%', maxWidth: '360px', marginBottom: '20px' }}>

            {profile.event_image_url && (
              <div style={{ marginBottom: '12px', borderRadius: '20px', overflow: 'hidden' }}>
                <img src={profile.event_image_url} alt={profile.event_name} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
              </div>
            )}

            <div style={{ background: 'linear-gradient(135deg, ' + ec1 + ', ' + ec2 + ')', borderRadius: '20px', padding: '20px', textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                ÉVÉNEMENT
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{profile.event_name}</div>
              {profile.event_location && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>📍 {profile.event_location}</div>}
            </div>

            {countdown && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '12px' }}>
                {[
                  { v: countdown.days, l: 'Jours' },
                  { v: countdown.hours, l: 'Heures' },
                  { v: countdown.mins, l: 'Min' },
                  { v: countdown.secs, l: 'Sec' },
                ].map(({ v, l }) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#ff6b35', lineHeight: 1 }}>{String(v).padStart(2, '0')}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '3px' }}>{l}</div>
                  </div>
                ))}
              </div>
            )}

            {profile.event_description && (
              <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '16px', padding: '14px 16px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {profile.event_description}
                </p>
              </div>
            )}

            {profile.event_booking_url && (
              <a
                href={profile.event_booking_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, ' + ec1 + ', ' + ec2 + ')', borderRadius: '14px', padding: '14px 20px', color: 'white', fontSize: '15px', fontWeight: '700', textDecoration: 'none', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
              >
                🎟️ Réserver ma place
              </a>
            )}
          </div>
        )}

        {/* ── Links ─────────────────────────────────────────────────── */}
        <div style={{ width: '100%', maxWidth: '384px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          {enabledLinks.map((link, i) => {
            const key = link.platform ? link.platform.toLowerCase() : '';
            const platform = PLATFORMS[key] || {
              label: link.platform ? link.platform.toUpperCase() : 'LIEN',
              color: '#6366f1',
              icon: (
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <rect width="24" height="24" rx="6" fill="#6366f1"/>
                  <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5" fill="none"/>
                  <ellipse cx="12" cy="12" rx="3.5" ry="8" stroke="white" strokeWidth="1.5" fill="none"/>
                  <line x1="4" y1="12" x2="20" y2="12" stroke="white" strokeWidth="1.5"/>
                </svg>
              ),
            };

            return (
              <button
                key={i}
                onClick={() => handleLinkClick(link)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  width: '100%', padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.25)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer', textAlign: 'left',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              >
                {/* ✅ Icône SVG sans background: color — le SVG a déjà son propre fond */}
                <div style={{
                  width: '48px', height: '48px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {platform.icon
                    ? React.cloneElement(platform.icon, { width: 48, height: 48 })
                    : null}
                </div>

                <span style={{ color: 'white', fontWeight: '700', letterSpacing: '0.08em', fontSize: '14px', flex: 1 }}>
                  {link.label || platform.label}
                </span>

                <ExternalLink size={16} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>

        {/* Bouton support WhatsApp */}
        <a
          href="https://wa.me/2250506458127"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '12px', padding: '10px 20px', color: '#25D366', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}
        >
          <WhatsAppIcon size={16} color="#25D366" />
          Contactez notre support
        </a>

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
          Tous droits réservés par Socialapp.
        </p>

      </div>
    </>
  );
}