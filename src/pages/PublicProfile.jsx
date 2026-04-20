import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { ExternalLink, Phone } from 'lucide-react';
import { FaYoutube, FaFacebook, FaWhatsapp, FaInstagram, FaTiktok, FaLinkedin, FaTwitter, FaGlobe } from 'react-icons/fa';

const PLATFORM_CONFIG = {
  youtube:     { bg: '#FF0000', label: 'YOUTUBE',     Icon: FaYoutube },
  facebook:    { bg: '#1877F2', label: 'FACEBOOK',    Icon: FaFacebook },
  whatsapp:    { bg: '#25D366', label: 'WHATSAPP',    Icon: FaWhatsapp },
  instagram:   { bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', label: 'INSTAGRAM', Icon: FaInstagram },
  tiktok:      { bg: '#000000', label: 'TIKTOK',      Icon: FaTiktok },
  linkedin:    { bg: '#0A66C2', label: 'LINKEDIN',    Icon: FaLinkedin },
  twitter:     { bg: '#1DA1F2', label: 'TWITTER',     Icon: FaTwitter },
  website:     { bg: '#6366f1', label: 'SITE WEB',    Icon: FaGlobe },
  coinafrique: { bg: '#6366f1', label: 'COINAFRIQUE', Icon: FaGlobe },
};

const parseColors = (themeColor) => {
  if (themeColor && themeColor.includes('|')) {
    const parts = themeColor.split('|');
    return { bg1: parts[0], bg2: parts[1] };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

export default function PublicProfile() {
  const { username } = useParams(); // ✅ CHANGÉ ICI

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('link_profiles')
        .select('*')
        .eq('username', username) // ✅ CHANGÉ ICI
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Profil introuvable.</p>
      </div>
    );
  }

  const colors = parseColors(profile.theme_color);
  const links = profile.links || [];
  const enabledLinks = links.filter(l => l.enabled !== false);

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-10"
      style={{ background: `linear-gradient(160deg, ${colors.bg1}, ${colors.bg2})` }}
    >
      {/* AVATAR */}
      {profile.avatar_url ? (
        <div style={{
          padding: '3px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
          marginBottom: '16px',
        }}>
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            style={{ width: '112px', height: '112px', borderRadius: '24px', objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div style={{
          width: '112px',
          height: '112px',
          borderRadius: '24px',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '16px',
        }}>
          {profile.display_name?.[0]?.toUpperCase() || '?'}
        </div>
      )}

      {/* NAME */}
      <h1 className="text-3xl font-black text-white uppercase tracking-wide mb-2 text-center">
        {profile.display_name}
      </h1>

      {/* BIO */}
      {profile.bio && (
        <p className="text-white/80 text-sm text-center max-w-xs mb-2">
          {profile.bio}
        </p>
      )}

      {/* PHONE */}
      {profile.phone && (
        <div className="flex items-center gap-2 text-white/70 text-sm mb-6">
          <Phone className="w-4 h-4" />
          {profile.phone}
        </div>
      )}

      {/* LINKS */}
      <div className="w-full max-w-sm space-y-3 mt-4">
        {enabledLinks.map((link, i) => {
          const key = link.platform?.toLowerCase();
          const platform = PLATFORM_CONFIG[key] || {
            bg: '#6366f1',
            label: link.platform?.toUpperCase() || 'LIEN',
            Icon: FaGlobe,
          };

          const Icon = platform.Icon;

          return (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: platform.bg }}
              >
                <Icon size={24} color="white" />
              </div>

              <span className="text-white font-bold tracking-widest text-sm flex-1">
                {link.label || platform.label}
              </span>

              <ExternalLink className="w-4 h-4 text-white/50 shrink-0" />
            </a>
          );
        })}
      </div>

      {/* FOOTER */}
      <p style={{
        color: 'rgba(255,255,255,0.3)',
        fontSize: '12px',
        textAlign: 'center',
        marginTop: '40px',
      }}>
        Tous droits réservés par Socialapp.
      </p>
    </div>
  );
}