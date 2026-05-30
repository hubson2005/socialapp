import React, { useState, useEffect } from 'react';
import {
  Loader2, Eye, MousePointerClick, TrendingUp, Globe,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';

// ─── Mini Stat ────────────────────────────────────────────────────────────────
function MiniStat({ label, value, icon: Icon, color, trend, trendUp }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 500 }}>{label}</span>
        <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={12} color={color} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ color: 'white', fontSize: '22px', fontWeight: 800, lineHeight: 1 }}>{value}</span>
        {trend != null && (
          <span style={{ fontSize: '11px', color: trendUp ? '#22c55e' : '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────
export default function AnalyticsPanel({ profileId }) {
  const [period, setPeriod]   = useState('7d');
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [geoData, setGeoData] = useState([]);
  const [topLinks, setTopLinks] = useState([]);
  const [daily, setDaily]     = useState([]);

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

      const views  = (viewsData || []).filter(r => !r.platform);
      const clicks = (viewsData || []).filter(r =>  r.platform);
      const prevCount = prevData?.length || 0;
      const trend = prevCount > 0
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
      setGeoData(
        Object.entries(geoMap).sort((a, b) => b[1].count - a[1].count).slice(0, 5)
      );

      // ── Top links ──
      const clickMap = {};
      clicks.forEach(r => { clickMap[r.platform] = (clickMap[r.platform] || 0) + 1; });
      setTopLinks(
        Object.entries(clickMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
      );

      // ── Daily bars (last 7 days always) ──
      const buckets = {};
      const DAY_LABELS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
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

  const maxGeo  = geoData[0]?.[1]?.count  || 1;
  const maxLink = topLinks[0]?.[1]         || 1;
  const maxViews  = Math.max(...daily.map(d => d.views),  1);
  const maxClicks = Math.max(...daily.map(d => d.clicks), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Analytics</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
            Performance de votre profil
          </p>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '3px' }}>
          {['7d','30d','90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: 'all 0.15s',
                background: period === p ? 'rgba(99,102,241,0.3)' : 'transparent',
                color:      period === p ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Loader2 size={24} className="animate-spin" color="rgba(99,102,241,0.6)" />
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
            <MiniStat label="Vues totales"  value={stats?.views   || 0}           icon={Eye}              color="#6366f1" trend={stats?.trend} trendUp={stats?.trendUp} />
            <MiniStat label="Clics totaux"  value={stats?.clicks  || 0}           icon={MousePointerClick} color="#22c55e" />
            <MiniStat label="Taux de clic"  value={(stats?.ctr    || 0) + '%'}    icon={TrendingUp}        color="#f59e0b" />
            <MiniStat label="Pays atteints" value={geoData.length}                icon={Globe}             color="#a78bfa" />
          </div>

          {/* ── Bar chart ── */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>Activité — 7 derniers jours</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#6366f1', display: 'inline-block' }} /> Vues
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22c55e', display: 'inline-block' }} /> Clics
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
              {daily.map(d => (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%' }}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                    {/* Vues */}
                    <div style={{ flex: 1, height: `${Math.round((d.views / maxViews) * 100)}%`, minHeight: '3px', background: '#6366f1', borderRadius: '3px 3px 0 0', transition: 'height 0.5s ease' }} />
                    {/* Clics */}
                    <div style={{ flex: 1, height: `${Math.round((d.clicks / maxClicks) * 100)}%`, minHeight: '3px', background: '#22c55e', borderRadius: '3px 3px 0 0', transition: 'height 0.5s ease' }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom row : Top pays + Top liens ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Top pays */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Globe size={14} color="#a78bfa" />
                <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>Top pays</span>
              </div>
              {geoData.length === 0
                ? <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', textAlign: 'center', padding: '12px 0', margin: 0 }}>Pas encore de données</p>
                : geoData.map(([country, { count, code }]) => (
                  <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '15px', width: '20px', flexShrink: 0 }}>{flagEmoji(code)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 500 }}>{country}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{count}</span>
                      </div>
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                        <div style={{ width: Math.round((count / maxGeo) * 100) + '%', height: '100%', background: 'linear-gradient(90deg,#a78bfa,#6366f1)', borderRadius: '2px' }} />
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Top liens */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <MousePointerClick size={14} color="#22c55e" />
                <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>Top liens</span>
              </div>
              {topLinks.length === 0
                ? <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', textAlign: 'center', padding: '12px 0', margin: 0 }}>Pas encore de données</p>
                : topLinks.map(([platform, count], i) => (
                  <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', width: '14px', flexShrink: 0 }}>#{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>{platform}</span>
                        <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                        <div style={{ width: Math.round((count / maxLink) * 100) + '%', height: '100%', background: 'linear-gradient(90deg,#22c55e,#6366f1)', borderRadius: '2px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
}

