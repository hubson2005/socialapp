import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { ExternalLink, Phone } from 'lucide-react';

const PLATFORM_ICONS = {
  youtube: { bg: '#FF0000', label: 'YOUTUBE', icon: '▶' },
  facebook: { bg: '#1877F2', label: 'FACEBOOK', icon: 'f' },
  whatsapp: { bg: '#25D366', label: 'WHATSAPP', icon: '📞' },
  instagram: { bg: '#E1306C', label: 'INSTAGRAM', icon: '📷' },
  tiktok: { bg: '#000000', label: 'TIKTOK', icon: '♪' },
  linkedin: { bg: '#0A66C2', label: 'LINKEDIN', icon: 'in' },
  twitter: { bg: '#1DA1F2', label: 'TWITTER', icon: '🐦' },
  website: { bg: '#6366f1', label: 'SITE WEB', icon: '🌐' },
  coinafrique: { bg: '#6366f1', label: 'COINAFRIQUE', icon: '🌐' },
};

const parseColors = (themeColor) => {
  if (themeColor?.includes('|')) {
    const [bg1, bg2] = themeColor.split('|');
    return { bg1, bg2 };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('link_profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [id]);

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

  const { bg1, bg2 } = parseColors(profile.theme_color);
  const links = profile.links || [];
  const enabledLinks = links.filter((l) => l.enabled !== false);

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-10"
      style={{ background: `linear-gradient(160deg, ${bg1}, ${bg2})` }}
    >
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.display_name}
          className="w-28 h-28 rounded-2xl object-cover mb-4 shadow-lg"
        />
      ) : (
        <div className="w-28 h-28 rounded-2xl bg-white/20 flex items-center justify-center mb-4 text-4xl font-bold text-white">
          {profile.display_name?.[0]?.toUpperCase() || '?'}
        </div>
      )}

      <h1 className="text-3xl font-black text-white uppercase tracking-wide mb-2 text-center">
        {profile.display_name}
      </h1>

      {profile.bio && (
        <p className="text-white/80 text-sm text-center max-w-xs mb-2">
          {profile.bio}
        </p>
      )}

      {profile.phone && (
        <div className="flex items-center gap-2 text-white/70 text-sm mb-6">
          <Phone className="w-4 h-4" />
          {profile.phone}
        </div>
      )}

      <div className="w-full max-w-sm space-y-3 mt-4">
        {enabledLinks.map((link, i) => {
          const platform = PLATFORM_ICONS[link.platform?.toLowerCase()] || {
            bg: '#6366f1',
            label: link.platform?.toUpperCase() || 'LIEN',
            icon: '🔗',
          };
          return (
            
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ background: platform.bg }}
              >
                {platform.icon}
              </div>
              <span className="text-white font-bold tracking-widest text-sm flex-1">
                {link.label || platform.label}
              </span>
              <ExternalLink className="w-4 h-4 text-white/50 shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
}