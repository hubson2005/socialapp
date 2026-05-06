import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { ExternalLink, Phone, Eye } from 'lucide-react';
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

// ✅ Formate le nombre de vues : 1200 → "1,2k"
const formatViews = (n) => {
  if (!n || n === 0) return null;
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
};

const WhatsAppIcon = ({ size = 16, color = '#25D366' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.2 13.8c-.2.6-1.3 1.2-1.8 1.2-.5.1-1.1.1-1.6-.1-1-.3-2-1-2.8-1.8A9.2 9.2 0 0 1 9 12.4c-.2-.5-.2-1-.1-1.5.1-.5.6-1.1 1-1.3.3-.1.5-.1.7 0 .2 0 .3 0 .4.3l.6 1.6c0 .1.1.3 0 .4-.1.2-.2.3-.3.4-.1.1-.3.3-.2.5.4.7 1 1.3 1.7 1.7.2.1.4 0 .5-.1l.5-.6c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.4.1.3 0 .8-.2 1z"/>
  </svg>
);

// ✅ Composant bouton avec effet ripple au tap
function RippleButton({ onClick, style, children, platformColor }) {
  const [ripples, setRipples] = useState([]);

  const handlePointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  };

  return (
    <button
      onClick={onClick}
      onPointerDown={handlePointerDown}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
        // ✅ Bord gauche coloré avec la couleur de la plateforme
        borderLeft: platformColor ? `4px solid ${platformColor}` : '4px solid rgba(255,255,255,0.15)',
      }}
    >
      {/* Ripples */}
      {ripples.map(r => (
        <span
          key={r.id}
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.45)',
            transform: 'translate(-50%, -50%) scale(0)',
            animation: 'ripple 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}
      {children}
    </button>
  );
}

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  // ✅ State pour le nombre de vues
  const [viewCount, setViewCount] = useState(null);

  const handleDownload = (url) => {
    try {
      const filename = url.split('/').pop().split('?')[0] || 'image.jpg';
      const downloadUrl = url.includes('?')
        ? url + '&download=' + filename
        : url + '?download=' + filename;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

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
        // Enregistre la vue
        await supabase.from('profile_stats').insert([{ profile_id: data.id, event_type: 'view' }]);
        // ✅ Récupère le total des vues
        const { count } = await supabase
          .from('profile_stats')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', data.id)
          .eq('event_type', 'view');
        setViewCount(count);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (profile?.event_images) {
      setImages(Array.isArray(profile.event_images) ? profile.event_images : [profile.event_images]);
    } else if (profile?.event_image_url) {
      setImages([profile.event_image_url]);
    } else {
      setImages([]);
    }
  }, [profile]);

  useEffect(() => {
    if (!images.length || !isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length, isAutoPlay]);

  const handleTouchStart = useCallback((e) => {
    const touchStartX = e.touches[0].clientX;
    const touchStartY = e.touches[0].clientY;

    const handleTouchMove = (moveEvent) => {
      const touchMoveX = moveEvent.touches[0].clientX;
      const touchMoveY = moveEvent.touches[0].clientY;
      const deltaX = touchStartX - touchMoveX;
      const deltaY = touchStartY - touchMoveY;

      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && currentIndex < images.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else if (deltaX < 0 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
        setIsAutoPlay(false);
        moveEvent.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { once: true });
  }, [currentIndex, images.length]);

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
          position: fixed; top: 0; left: 0;
          width: 100vw; height: 100vh; height: 100dvh;
          z-index: -10;
          background-image: url(${JSON.stringify(profile.bg_image_url)});
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          transform: translateZ(0);
          will-change: transform;
        }
        #__bg_overlay__ {
          position: fixed; top: 0; left: 0;
          width: 100vw; height: 100vh; height: 100dvh;
          z-index: -9;
          background: linear-gradient(160deg, rgba(0,0,0,0.52), rgba(0,0,0,0.36));
          pointer-events: none;
        }
      `;
    } else {
      const colors = parseColors(profile.theme_color);
      style.textContent = `
        #__bg_layer__ {
          position: fixed; top: 0; left: 0;
          width: 100vw; height: 100vh; height: 100dvh;
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

    const isPhone = link.platform === 'phone';
    const isEmail = link.platform === 'email';

    if (isPhone) {
      const raw = (link.url || '').replace(/^tel:/i, '').trim();
      window.location.href = 'tel:' + raw;
    } else if (isEmail) {
      const raw = (link.url || '').replace(/^mailto:/i, '').trim();
      window.location.href = 'mailto:' + raw;
    } else {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
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
  const formattedViews = formatViews(viewCount);

  const hasEventContent =
    profile.is_event && (
      images.length > 0 ||
      profile.event_name ||
      profile.event_date ||
      profile.event_location ||
      profile.event_description ||
      profile.event_booking_url
    );

  return (
    <>
      <style>{`
        html, body { min-height: 100%; margin: 0; padding: 0; background: transparent; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* ✅ Animation ripple */
        @keyframes ripple {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(28); opacity: 0; }
        }

        /* ✅ Animation fade-in décalée pour les boutons de liens */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .link-btn {
          animation: fadeSlideUp 0.4s ease both;
        }
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
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', textAlign: 'center', maxWidth: '300px', marginBottom: '12px' }}>{profile.bio}</p>
        )}

        {/* ✅ COMPTEUR DE VUES */}
        {formattedViews && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '100px',
            padding: '5px 14px',
            marginBottom: '16px',
          }}>
            <Eye size={13} color="rgba(255,255,255,0.5)" />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600' }}>
              {formattedViews} personne{viewCount > 1 ? 's ont' : ' a'} visité ce profil
            </span>
          </div>
        )}

        {profile.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '16px' }}>
            <Phone size={16} />
            {profile.phone}
          </div>
        )}

        {/* MODE ÉVÉNEMENT */}
        {hasEventContent && (
          <div style={{ width: '100%', maxWidth: '360px', marginBottom: '20px' }}>

            {/* CARROUSEL */}
            {images.length > 0 && (
              <div
                style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', marginBottom: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                onTouchStart={handleTouchStart}
              >
                <img
                  src={images[currentIndex]}
                  alt="event"
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', transition: 'opacity 0.5s ease' }}
                />

                <button
                  onClick={() => handleDownload(images[currentIndex])}
                  style={{
                    position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                    background: 'white', color: '#000', padding: '10px 18px', borderRadius: '999px',
                    fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10, whiteSpace: 'nowrap',
                  }}
                >
                  ⬇ Télécharger
                </button>

                {images.length > 1 && (
                  <div style={{ position: 'absolute', bottom: '12px', width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                    {images.map((_, i) => (
                      <div
                        key={i}
                        onClick={() => { setCurrentIndex(i); setIsAutoPlay(false); }}
                        style={{ width: i === currentIndex ? '18px' : '6px', height: '6px', borderRadius: '999px', background: 'white', opacity: i === currentIndex ? 1 : 0.4, transition: 'all 0.3s', cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {(profile.event_name || profile.event_location) && (
              <div style={{ background: 'linear-gradient(135deg, ' + ec1 + ', ' + ec2 + ')', borderRadius: '20px', padding: '20px', textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  ÉVÉNEMENT
                </div>
                {profile.event_name && <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{profile.event_name}</div>}
                {profile.event_location && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>📍 {profile.event_location}</div>}
              </div>
            )}

            {countdown && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '12px' }}>
                {[{ v: countdown.days, l: 'Jours' }, { v: countdown.hours, l: 'Heures' }, { v: countdown.mins, l: 'Min' }, { v: countdown.secs, l: 'Sec' }].map(({ v, l }) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#ff6b35', lineHeight: 1 }}>{String(v).padStart(2, '0')}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '3px' }}>{l}</div>
                  </div>
                ))}
              </div>
            )}

            {profile.event_description && (
              <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '16px', padding: '14px 16px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>{profile.event_description}</p>
              </div>
            )}

            {profile.event_booking_url && (
              <a href={profile.event_booking_url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, ' + ec1 + ', ' + ec2 + ')', borderRadius: '14px', padding: '14px 20px', color: 'white', fontSize: '15px', fontWeight: '700', textDecoration: 'none', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
              >
                🎟️ Réserver ma place
              </a>
            )}
          </div>
        )}

        {/* ✅ LIENS AVEC RIPPLE + BORD COLORÉ + ANIMATION DÉCALÉE */}
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

            // Couleur d'accent : depuis PLATFORMS ou fallback
            const accentColor = platform.color || '#6366f1';

            return (
              <div
                key={i}
                className="link-btn"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <RippleButton
                  onClick={() => handleLinkClick(link)}
                  platformColor={accentColor}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    width: '100%', padding: '14px 16px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer', textAlign: 'left',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    transition: 'background 0.15s, transform 0.1s',
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {platform.icon ? React.cloneElement(platform.icon, { width: 48, height: 48 }) : null}
                  </div>
                  <span style={{ color: 'white', fontWeight: '700', letterSpacing: '0.08em', fontSize: '14px', flex: 1 }}>
                    {link.label || platform.label}
                  </span>
                  <ExternalLink size={16} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
                </RippleButton>
              </div>
            );
          })}
        </div>

        {/* Support WhatsApp */}
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