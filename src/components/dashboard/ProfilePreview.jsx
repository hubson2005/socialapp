import React from 'react';
import { X, ExternalLink, Phone } from 'lucide-react';
import { FaYoutube, FaFacebook, FaWhatsapp, FaInstagram, FaTiktok, FaLinkedin, FaTwitter, FaGlobe } from 'react-icons/fa';

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

export default function ProfilePreview({ profile, onClose }) {
  if (!profile) return null;

  const { bg1, bg2 } = parseColors(profile.theme_color);
  const enabledLinks = (profile.links || []).filter(l => l.enabled !== false);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '-16px', right: '-16px', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          <X size={16} />
        </button>

        {/* Phone frame */}
        <div style={{ width: '300px', height: '600px', background: '#111', borderRadius: '40px', border: '8px solid #222', boxShadow: '0 40px 80px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
          {/* Notch */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80px', height: '24px', background: '#111', borderRadius: '0 0 16px 16px', zIndex: 10 }} />

          {/* Screen content */}
          <div style={{ height: '100%', overflowY: 'auto', background: `linear-gradient(160deg, ${bg1}, ${bg2})`, scrollbarWidth: 'none' }}>
            <div style={{ paddingTop: '32px', paddingBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 24px' }}>

              {/* Badge vérifié + avatar */}
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
                  <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: '2px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div>
                )}
              </div>

              <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {profile.display_name}
                {profile.is_verified && <span style={{ marginLeft: '6px', fontSize: '12px', color: '#818cf8' }}>✓</span>}
              </h1>

              {profile.bio && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: '4px', lineHeight: '1.5', maxWidth: '220px' }}>{profile.bio}</p>
              )}

              {profile.username && (
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>@{profile.username}</p>
              )}

              {/* Mode événement */}
              {profile.is_event && profile.event_name && (
                <div style={{ width: '100%', background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(247,201,72,0.1))', border: '1px solid rgba(255,107,53,0.3)', borderRadius: '14px', padding: '12px', marginBottom: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#ff6b35', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>🎉 Événement</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{profile.event_name}</div>
                  {profile.event_date && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{profile.event_date}</div>}
                </div>
              )}

              {/* Links */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {enabledLinks.length === 0 && (
                  <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Aucun lien ajouté</p>
                )}
                {enabledLinks.map((link, i) => {
                  const key = link.platform ? link.platform.toLowerCase() : '';
                  const cfg = PLATFORM_CONFIG[key] || { bg: '#6366f1', Icon: FaGlobe };
                  const { Icon } = cfg;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 12px' }}>
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