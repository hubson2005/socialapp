import React, { useState, useEffect } from 'react';
import { X, ExternalLink, MapPin, Calendar, Ticket } from 'lucide-react';
import { FaYoutube, FaFacebook, FaWhatsapp, FaInstagram, FaTiktok, FaLinkedin, FaTwitter, FaGlobe } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const PLATFORM_CONFIG = {
  youtube:   { bg: '#FF0000', Icon: FaYoutube },
  facebook:  { bg: '#1877F2', Icon: FaFacebook },
  whatsapp:  { bg: '#25D366', Icon: FaWhatsapp },
  instagram: { bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', Icon: FaInstagram },
  tiktok:    { bg: '#000000', Icon: FaTiktok },
  linkedin:  { bg: '#0A66C2', Icon: FaLinkedin },
  twitter:   { bg: '#1DA1F2', Icon: FaTwitter },
  website:   { bg: '#6366f1', Icon: FaGlobe },
};

const parseColors = (themeColor) => {
  if (themeColor && themeColor.includes('|')) {
    const [bg1, bg2] = themeColor.split('|');
    return { bg1, bg2 };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

/* ─── Compte à rebours ──────────────────────────────────────────────────── */
function Countdown({ eventDate }) {
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    const calc = () => {
      const ms = new Date(eventDate) - new Date();
      if (ms <= 0) { setDiff(null); return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setDiff({ d, h, m, s });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [eventDate]);

  if (!diff) return null;

  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
      {[['d', diff.d], ['h', diff.h], ['m', diff.m], ['s', diff.s]].map(([unit, val]) => (
        <div key={unit} style={{ textAlign: 'center', minWidth: '34px' }}>
          <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '7px', padding: '4px 6px', fontSize: '14px', fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
            {String(val).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{unit}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Galerie images événement (layout adaptatif) ───────────────────────── */
function EventGallery({ images }) {
  const [lightbox, setLightbox] = useState(null);
  const n = images.length;
  if (n === 0) return null;

  /* Layout */
  const gridStyle = n === 1
    ? { display: 'block' }
    : n === 2
      ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }
      : n === 3
        ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }
        : n === 4
          ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }
          : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' };

  const getHeight = (i) => {
    if (n === 1) return '160px';
    if (n === 2) return '110px';
    if (n === 3) return i === 0 ? '130px' : '90px';
    if (n === 4) return '95px';
    return '75px';
  };

  const getSpan = (i) => {
    if (n === 3 && i === 0) return { gridColumn: '1 / -1' };
    return {};
  };

  /* Overlay "+N" sur la dernière vignette si > 6 */
  const MAX_VISIBLE = 6;
  const visible = images.slice(0, MAX_VISIBLE);
  const hidden = n - MAX_VISIBLE;

  return (
    <>
      <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '10px', width: '100%' }}>
        <div style={gridStyle}>
          {visible.map((url, i) => {
            const isLast = i === visible.length - 1 && hidden > 0;
            return (
              <div
                key={i}
                onClick={() => setLightbox(i)}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  ...getSpan(i),
                }}
              >
                <img
                  src={url}
                  alt={'event-' + i}
                  style={{
                    width: '100%',
                    height: getHeight(i),
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                />
                {/* Overlay "+N" */}
                {isLast && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '16px', fontWeight: 800 }}>+{hidden}</span>
                  </div>
                )}
                {/* Badge principale */}
                {i === 0 && n > 1 && (
                  <span style={{ position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '8px', fontWeight: 700, padding: '2px 6px', borderRadius: '20px' }}>
                    Principale
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <X size={18} />
          </button>
          {/* Flèche gauche */}
          {lightbox > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(l => l - 1); }}
              style={{ position: 'absolute', left: '12px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: '18px' }}
            >‹</button>
          )}
          <img
            src={images[lightbox]}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 24px 60px rgba(0,0,0,0.8)' }}
          />
          {/* Flèche droite */}
          {lightbox < images.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(l => l + 1); }}
              style={{ position: 'absolute', right: '12px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: '18px' }}
            >›</button>
          )}
          <div style={{ position: 'absolute', bottom: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Bloc événement complet ────────────────────────────────────────────── */
function EventBlock({ profile }) {
  if (!profile.is_event || !profile.event_name) return null;

  const c1 = profile.event_color1 || '#ff6b35';
  const c2 = profile.event_color2 || '#f7c948';

  /* Images : priorité event_images[], fallback event_image_url */
  const images = profile.event_images?.length
    ? profile.event_images
    : profile.event_image_url
      ? [profile.event_image_url]
      : [];

  const formatDate = (raw) => {
    if (!raw) return null;
    try {
      return new Date(raw).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return raw; }
  };

  return (
    <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.12)' }}>
      {/* Bandeau titre gradient */}
      <div style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, padding: '10px 14px' }}>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>🎉 Événement</div>
        <div style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>{profile.event_name}</div>
      </div>

      {/* Corps */}
      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 12px' }}>
        {/* Galerie multi-images */}
        {images.length > 0 && <EventGallery images={images} />}

        {/* Infos */}
        {profile.event_date && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '5px' }}>
            <Calendar size={11} color={c1} style={{ marginTop: '1px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{formatDate(profile.event_date)}</div>
              <Countdown eventDate={profile.event_date} />
            </div>
          </div>
        )}

        {profile.event_location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
            <MapPin size={11} color={c1} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{profile.event_location}</span>
          </div>
        )}

        {profile.event_description && (
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, margin: '6px 0' }}>
            {profile.event_description}
          </p>
        )}

        {/* Bouton réservation */}
        {profile.event_booking_url && (
          <a
            href={profile.event_booking_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: `linear-gradient(135deg, ${c1}, ${c2})`, borderRadius: '10px', padding: '8px 12px', marginTop: '8px', color: 'white', fontSize: '11px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.03em' }}
          >
            <Ticket size={12} /> Réserver ma place
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── ProfilePreview principal ──────────────────────────────────────────── */
export default function ProfilePreview({ profile, onClose }) {
  if (!profile) return null;

  const { bg1, bg2 } = parseColors(profile.theme_color);
  const enabledLinks = (profile.links || []).filter(l => l.enabled !== false);

  const bgStyle = profile.bg_image_url
    ? { backgroundImage: `url(${profile.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(160deg, ${bg1}, ${bg2})` };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '-16px', right: '-16px', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          <X size={16} />
        </button>

        {/* Cadre téléphone */}
        <div style={{ width: '300px', height: '620px', background: '#111', borderRadius: '40px', border: '8px solid #222', boxShadow: '0 40px 80px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
          {/* Notch */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80px', height: '24px', background: '#111', borderRadius: '0 0 16px 16px', zIndex: 10 }} />

          {/* Écran */}
          <div style={{ height: '100%', overflowY: 'auto', ...bgStyle, scrollbarWidth: 'none' }}>
            {/* Overlay si bg image */}
            {profile.bg_image_url && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', pointerEvents: 'none', zIndex: 0 }} />
            )}

            <div style={{ paddingTop: '32px', paddingBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 24px', position: 'relative', zIndex: 1 }}>

              {/* Avatar */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                {profile.avatar_url ? (
                  <div style={{ padding: '2px', borderRadius: '22px', background: 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05))' }}>
                    <img src={profile.avatar_url} alt="" style={{ width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
                    {profile.display_name ? profile.display_name[0].toUpperCase() : '?'}
                  </div>
                )}
                {profile.is_verified && (
                  <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: '2px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' }}>✓</div>
                )}
              </div>

              {/* Nom */}
              <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {profile.display_name}
                {profile.is_verified && <span style={{ marginLeft: '6px', fontSize: '12px', color: '#818cf8' }}>✓</span>}
              </h1>

              {/* Bio */}
              {profile.bio && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: '4px', lineHeight: '1.5', maxWidth: '220px' }}>
                  {profile.bio}
                </p>
              )}

              {/* Username */}
              {profile.username && (
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>
                  @{profile.username}
                </p>
              )}

              {/* ── Bloc événement avec galerie ── */}
              <EventBlock profile={profile} />

              {/* ── Liens ── */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {enabledLinks.length === 0 && (
                  <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Aucun lien ajouté</p>
                )}
                {enabledLinks.map((link, i) => {
                  const key = link.platform ? link.platform.toLowerCase() : '';
                  const cfg = PLATFORM_CONFIG[key] || { bg: '#6366f1', Icon: FaGlobe };
                  const { Icon } = cfg;
                  return (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 12px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} color="white" />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'white', flex: 1 }}>
                        {link.label || (link.platform ? link.platform.charAt(0).toUpperCase() + link.platform.slice(1) : 'Lien')}
                      </span>
                      <ExternalLink size={12} color="rgba(255,255,255,0.4)" />
                    </div>
                  );
                })}
              </div>

              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '20px' }}>Powered by SocialApp</p>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '12px' }}>Aperçu de ta page publique</p>
      </div>
    </div>
  );
}

