import React, { useState, useEffect } from 'react';
import {
  Loader2, Eye, MousePointerClick, TrendingUp, Globe,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { supabase } from '../../supabase';

const PLATFORMS = {
  youtube:   { label: 'YouTube',   icon: '📺', color: '#FF0000' },
  tiktok:    { label: 'TikTok',    icon: '🎵', color: '#0f172a' },
  instagram: { label: 'Instagram', icon: '📸', color: '#E1306C' },
  facebook:  { label: 'Facebook',  icon: '📘', color: '#1877F2' },
  linkedin:  { label: 'LinkedIn',  icon: '💼', color: '#0A66C2' },
  whatsapp:  { label: 'WhatsApp',  icon: '💬', color: '#25D366' },
  telegram:  { label: 'Telegram',  icon: '✈️', color: '#229ED9' },
  snapchat:  { label: 'Snapchat',  icon: '👻', color: '#EAB308' },
  pinterest: { label: 'Pinterest', icon: '📌', color: '#E60023' },
  twitter:   { label: 'X',         icon: '𝕏',  color: '#0f172a' },
};

// ─── Palette (thème clair, cohérent avec le reste du dashboard) ─
const T = {
  bgCard:     '#ffffff',
  bgCardAlt:  '#f8f9fc',
  border:     '#e6e8f0',
  track:      '#eef0f6',
  textPrimary:   '#151329',
  textSecondary: '#6b6f85',
  textMuted:     '#9a9db0',
  shadow: '0 1px 2px rgba(16,18,40,0.04), 0 1px 8px rgba(16,18,40,0.03)',
};

// ─── Hook : largeur de la fenêtre ─────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

// ─── Mini Stat ────────────────────────────────────────────────
function MiniStat({ label, value, icon: Icon, color, trend, trendUp }) {
  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadow,
      borderRadius: '14px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
        <span style={{
          color: T.textMuted, fontSize: '10px', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textTransform: 'uppercase', letterSpacing: '0.02em',
        }}>
          {label}
        </span>
        <div style={{
          width: '26px', height: '26px', borderRadius: '7px',
          background: color + '1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={12} color={color} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ color: T.textPrimary, fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>
          {value}
        </span>
        {trend != null && (
          <span style={{
            fontSize: '11px',
            color: trendUp ? '#16a34a' : '#dc2626',
            fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '2px',
            flexShrink: 0,
          }}>
            {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── AnalyticsPanel ───────────────────────────────────────────
export default function AnalyticsPanel({ profileId }) {
  const [period, setPeriod]   = useState('7d');
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [geoData, setGeoData] = useState([]);
  const [totalCountries, setTotalCountries] = useState(0);
  const [topLinks, setTopLinks] = useState([]);
  const [daily, setDaily]     = useState([]);

  const windowWidth = useWindowWidth();
  const isMobile  = windowWidth < 480;
  const isTablet  = windowWidth >= 480 && windowWidth < 768;
  const isDesktop = windowWidth >= 768;

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      setLoading(true);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const from = new Date();
      from.setDate(from.getDate() - days);

      const { data: viewsData } = await supabase
        .from('profile_stats')
        .select('created_at, country, country_name, platform')
        .eq('profile_id', profileId)
        .gte('created_at', from.toISOString());

      const { data: prevData } = await supabase
        .from('profile_stats')
        .select('id')
        .eq('profile_id', profileId)
        .eq('event_type', 'view')
        .gte('created_at', new Date(from.getTime() - days * 86400000).toISOString())
        .lt('created_at', from.toISOString());

      const views     = (viewsData || []).filter(r => !r.platform);
      const clicks    = (viewsData || []).filter(r =>  r.platform);
      const prevCount = prevData?.length || 0;
      const trend     = prevCount > 0
        ? Math.round(((views.length - prevCount) / prevCount) * 100)
        : null;

      setStats({
        views:   views.length,
        clicks:  clicks.length,
        ctr:     views.length > 0 ? Math.round((clicks.length / views.length) * 100) : 0,
        trend,
        trendUp: trend !== null ? trend >= 0 : true,
      });

      // ── Geo ──
      const geoMap = {};
      views.forEach(r => {
        const k = r.country_name || r.country || 'Inconnu';
        geoMap[k] = { count: (geoMap[k]?.count || 0) + 1, code: r.country };
      });
      const geoEntries = Object.entries(geoMap).sort((a, b) => b[1].count - a[1].count);
      setTotalCountries(geoEntries.length);
      setGeoData(geoEntries.slice(0, 5));

      // ── Top links ──
      const clickMap = {};
      clicks.forEach(r => { clickMap[r.platform] = (clickMap[r.platform] || 0) + 1; });
      setTopLinks(
        Object.entries(clickMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
      );

      // ── Daily bars (7 derniers jours) ──
      const buckets = {};
      const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        buckets[key] = { day: DAY_LABELS[d.getDay()], views: 0, clicks: 0 };
      }
      (viewsData || []).forEach(r => {
        const key = r.created_at?.split('T')[0];
        if (!buckets[key]) return;
        if (!r.platform) buckets[key].views++;
        else             buckets[key].clicks++;
      });
      setDaily(Object.values(buckets));

      setLoading(false);
    })();
  }, [profileId, period]);

  const flagEmoji = (code) => {
    try {
      return code?.length === 2
        ? String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397))
        : '🌐';
    } catch { return '🌐'; }
  };

  const maxGeo    = geoData[0]?.[1]?.count || 1;
  const maxLink   = topLinks[0]?.[1]        || 1;
  const maxViews  = Math.max(...daily.map(d => d.views),  1);
  const maxClicks = Math.max(...daily.map(d => d.clicks), 1);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '16px',
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain',
      minWidth: 0, width: '100%',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ color: T.textPrimary, fontSize: '18px', fontWeight: 800, margin: 0 }}>
            Analytics
          </h2>
          <p style={{ color: T.textSecondary, fontSize: '12px', margin: '4px 0 0' }}>
            Performance de votre profil
          </p>
        </div>

        {/* Boutons de période */}
        <div style={{
          display: 'flex', gap: '4px',
          background: T.track,
          borderRadius: '10px', padding: '3px',
          flexShrink: 0,
        }}>
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 12px',
                minHeight: '36px',
                borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 600,
                transition: 'all 0.15s',
                background: period === p ? '#ede9fe' : 'transparent',
                color:      period === p ? '#7c3aed' : T.textSecondary,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Loader2 size={24} className="animate-spin" color="#6366f1" />
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop
              ? 'repeat(4, 1fr)'
              : isTablet
                ? 'repeat(4, 1fr)'
                : 'repeat(2, 1fr)',
            gap: isMobile ? '8px' : '10px',
          }}>
            <MiniStat label="Vues"      value={stats?.views   || 0}        icon={Eye}               color="#6366f1" trend={stats?.trend} trendUp={stats?.trendUp} />
            <MiniStat label="Clics"     value={stats?.clicks  || 0}        icon={MousePointerClick}  color="#f59e0b" />
            <MiniStat label="CTR"       value={(stats?.ctr    || 0) + '%'} icon={TrendingUp}         color="#22c55e" />
            <MiniStat label="Pays"      value={totalCountries}             icon={Globe}              color="#0ea5e9" />
          </div>

          {/* ── Bar chart ── */}
          <div style={{
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            boxShadow: T.shadow,
            borderRadius: '18px',
            padding: isMobile ? '12px' : '16px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap', gap: '8px',
            }}>
              <span style={{ color: T.textPrimary, fontSize: '13px', fontWeight: 700 }}>
                Activité — 7 derniers jours
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { color: '#e5683b', label: 'Vues' },
                  { color: '#22c55e', label: 'Clics' },
                ].map(({ color, label }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: T.textSecondary, fontSize: '11px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, display: 'inline-block', flexShrink: 0 }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: isMobile ? '3px' : '6px',
              height: isMobile ? '64px' : '80px',
              overflow: 'hidden',
            }}>
              {daily.map(d => (
                <div key={d.day} style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '3px',
                  height: '100%',
                  minWidth: 0,
                }}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', gap: '1px' }}>
                    {/* Vues */}
                    <div style={{
                      flex: 1,
                      height: `${Math.round((d.views / maxViews) * 100)}%`,
                      minHeight: '3px',
                      background: '#e5683b',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.5s ease',
                    }} />
                    {/* Clics */}
                    <div style={{
                      flex: 1,
                      height: `${Math.round((d.clicks / maxClicks) * 100)}%`,
                      minHeight: '3px',
                      background: '#22c55e',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.5s ease',
                    }} />
                  </div>
                  <span style={{
                    color: T.textMuted,
                    fontSize: isMobile ? '8px' : '9px',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom row : Top pays + Top liens ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '12px',
          }}>

            {/* Top pays */}
            <div style={{
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadow,
              borderRadius: '18px',
              padding: isMobile ? '12px' : '16px',
              minWidth: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Globe size={14} color="#7c3aed" />
                <span style={{ color: T.textPrimary, fontSize: '13px', fontWeight: 700 }}>Top pays</span>
                {totalCountries > geoData.length && (
                  <span style={{ color: T.textMuted, fontSize: '10px', fontWeight: 500, marginLeft: 'auto' }}>
                    Top {geoData.length} / {totalCountries}
                  </span>
                )}
              </div>
              {geoData.length === 0 ? (
                <p style={{ color: T.textMuted, fontSize: '12px', textAlign: 'center', padding: '12px 0', margin: 0 }}>
                  Pas encore de données
                </p>
              ) : geoData.map(([country, { count, code }]) => (
                <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', minWidth: 0 }}>
                  <span style={{ fontSize: '15px', width: '20px', flexShrink: 0 }}>
                    {flagEmoji(code)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', gap: '4px' }}>
                      <span style={{
                        color: T.textPrimary, fontSize: '11px', fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {country}
                      </span>
                      <span style={{ color: T.textSecondary, fontSize: '11px', flexShrink: 0 }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: '3px', background: T.track, borderRadius: '2px' }}>
                      <div style={{
                        width: Math.round((count / maxGeo) * 100) + '%',
                        height: '100%',
                        background: 'linear-gradient(90deg,#a78bfa,#6366f1)',
                        borderRadius: '2px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top liens */}
            <div style={{
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadow,
              borderRadius: '18px',
              padding: isMobile ? '12px' : '16px',
              minWidth: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <MousePointerClick size={14} color="#f59e0b" />
                <span style={{ color: T.textPrimary, fontSize: '13px', fontWeight: 700 }}>Top liens</span>
              </div>
              {topLinks.length === 0 ? (
                <p style={{ color: T.textMuted, fontSize: '12px', textAlign: 'center', padding: '12px 0', margin: 0 }}>
                  Pas encore de données
                </p>
              ) : topLinks.map(([platform, count]) => {
                const social = PLATFORMS[platform?.toLowerCase()] || {
                  label: platform || 'Lien',
                  icon: '🔗',
                  color: '#6366f1',
                };
                return (
                  <div key={platform} style={{ marginBottom: '14px', minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                      gap: '6px',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        minWidth: 0, flex: 1,
                      }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: social.color + '1a',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', flexShrink: 0,
                        }}>
                          {social.icon}
                        </div>
                        <span style={{
                          color: T.textPrimary, fontSize: '12px', fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {social.label}
                        </span>
                      </div>
                      <span style={{ color: T.textSecondary, fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: T.track, borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.round((count / maxLink) * 100)}%`,
                        height: '100%',
                        background: social.color,
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}