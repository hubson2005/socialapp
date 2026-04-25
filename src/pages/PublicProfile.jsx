import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { ExternalLink } from 'lucide-react';
import { FaYoutube, FaFacebook, FaWhatsapp, FaInstagram, FaTiktok, FaLinkedin, FaTwitter, FaGlobe } from 'react-icons/fa';
import TicketShop from '../components/TicketShop';

const PLATFORM_CONFIG = {
  youtube:     { bg: '#FF0000', label: 'YOUTUBE',     Icon: FaYoutube },
  facebook:    { bg: '#1877F2', label: 'FACEBOOK',    Icon: FaFacebook },
  whatsapp:    { bg: '#25D366', label: 'WHATSAPP',    Icon: FaWhatsapp },
  instagram:   { bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', label: 'INSTAGRAM', Icon: FaInstagram },
  tiktok:      { bg: '#000000', label: 'TIKTOK',      Icon: FaTiktok },
  linkedin:    { bg: '#0A66C2', label: 'LINKEDIN',    Icon: FaLinkedin },
  twitter:     { bg: '#1DA1F2', label: 'TWITTER',     Icon: FaTwitter },
  website:     { bg: '#6366f1', label: 'SITE WEB',    Icon: FaGlobe },
  coinafrique: { bg: '#F97316', label: 'COINAFRIQUE', Icon: FaGlobe },
};

const parseColors = (themeColor) => {
  if (themeColor && themeColor.includes('|')) {
    const [bg1, bg2] = themeColor.split('|');
    return { bg1, bg2 };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

const getCountdown = (eventDate) => {
  const diff = new Date(eventDate) - new Date();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    secs: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showTicketShop, setShowTicketShop] = useState(false);

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
    const timer = setInterval(() => setCountdown(getCountdown(profile.event_date)), 1000);
    setCountdown(getCountdown(profile.event_date));
    return () => clearInterval(timer);
  }, [profile]);

  const handleLinkClick = async (link) => {
    if (!profile) return;
    await supabase.from('profile_stats').insert([{ profile_id: profile.id, event_type: 'click', platform: link.platform }]);
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

  const { bg1, bg2 } = parseColors(profile.theme_color);
  const enabledLinks = (profile.links || []).filter(l => l.enabled !== false);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10" style={{ background: `linear-gradient(160deg, ${bg1}, ${bg2})` }}>

      {/* Avatar + Badge */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        {profile.avatar_url ? (
          <div style={{ padding: '3px', borderRadius: '28px', background: 'linear-gradient(135deg,rgba(255,255,255,0.4),rgba(255,255,255,0.05))', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <img src={profile.avatar_url} alt={profile.display_name} style={{ width: '112px', height: '112px', borderRadius: '24px', objectFit: 'cover', display: 'block' }} />
          </div>
        ) : (
          <div style={{ padding: '3px', borderRadius: '28px', background: 'linear-gradient(135deg,rgba(255,255,255,0.4),rgba(255,255,255,0.05))', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ width: '112px', height: '112px', borderRadius: '24px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', color: 'white' }}>
              {profile.display_name ? profile.display_name[0].toUpperCase() : '?'}
            </div>
          </div>
        )}
        {profile.is_verified && (
          <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: '3px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', boxShadow: '0 4px 12px rgba(99,102,241,0.5)' }}>✓</div>
        )}
      </div>

      <h1 className="text-3xl font-black text-white uppercase tracking-wide mb-1 text-center">
        {profile.display_name}
        {profile.is_verified && <span style={{ marginLeft: '8px', fontSize: '16px', color: '#818cf8' }}>✓</span>}
      </h1>

      {profile.bio && <p className="text-white/80 text-sm text-center max-w-xs mb-2">{profile.bio}</p>}
      {profile.username && <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>@{profile.username}</p>}

      {/* Mode Événement */}
      {profile.is_event && profile.event_name && (
        <div style={{ width: '100%', maxWidth: '360px', marginBottom: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg,#ff6b35,#f7c948)', borderRadius: '20px', padding: '20px', textAlign: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', marginBottom: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', display: 'inline-block', animation: 'blink 1.5s infinite' }} />
              ÉVÉNEMENT
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{profile.event_name}</div>
            {profile.event_location && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>📍 {profile.event_location}</div>}
          </div>

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

          {/* Bouton Réserver */}
          <button
            onClick={() => setShowTicketShop(true)}
            style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: '800', fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.3px' }}
          >
            🎫 Réserver ma place →
          </button>
        </div>
      )}

      {/* Links */}
      <div className="w-full max-w-sm space-y-3 mt-2">
        {enabledLinks.map((link, i) => {
          const key = link.platform ? link.platform.toLowerCase() : '';
          const platform = PLATFORM_CONFIG[key] || { bg: '#6366f1', label: link.platform ? link.platform.toUpperCase() : 'LIEN', Icon: FaGlobe };
          const { Icon } = platform;
          return (
            <button
              key={i}
              onClick={() => handleLinkClick(link)}
              className="flex items-center gap-4 w-full px-4 py-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
              style={{ border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: platform.bg }}>
                <Icon size={24} color="white" />
              </div>
              <span className="text-white font-bold tracking-widest text-sm flex-1">
                {link.label || platform.label}
              </span>
              <ExternalLink className="w-4 h-4 text-white/50 shrink-0" />
            </button>
          );
        })}
      </div>

      <a href="https://wa.me/2250506458127" target="_blank" rel="noopener noreferrer" style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '12px', padding: '10px 20px', color: '#25D366', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>
        <FaWhatsapp size={16} color="#25D366" />
        Contactez notre support
      </a>

      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
        Tous droits réservés par Socialapp.
      </p>

      {showTicketShop && (
        <TicketShop
          profileId={profile.id}
          eventName={profile.event_name}
          eventDate={profile.event_date}
          eventLocation={profile.event_location}
          onClose={() => setShowTicketShop(false)}
        />
      )}

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}