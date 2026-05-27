import React, { useState } from 'react';
import { BarChart2, TrendingUp, MousePointer, Eye, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// ─── Données simulées (remplacer par vraies données Supabase) ─────────────────
const MOCK_WEEKLY = [
  { day: 'Lun', views: 24, clicks: 8  },
  { day: 'Mar', views: 31, clicks: 14 },
  { day: 'Mer', views: 19, clicks: 6  },
  { day: 'Jeu', views: 47, clicks: 22 },
  { day: 'Ven', views: 38, clicks: 17 },
  { day: 'Sam', views: 55, clicks: 29 },
  { day: 'Dim', views: 42, clicks: 18 },
];

const MOCK_TOP_LINKS = [
  { platform: 'Instagram', icon: '📸', clicks: 142, trend: +12 },
  { platform: 'WhatsApp',  icon: '💬', clicks: 98,  trend: +5  },
  { platform: 'TikTok',    icon: '🎵', clicks: 76,  trend: -3  },
  { platform: 'LinkedIn',  icon: '💼', clicks: 34,  trend: +8  },
  { platform: 'YouTube',   icon: '▶️',  clicks: 21,  trend: +1  },
];

const PERIODS = ['7 jours', '30 jours', '90 jours'];

function MiniBar({ value, max, color = '#6366f1', height = 40 }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: height + 'px', flex: 1 }}>
      <div style={{ width: '100%', height: `${pct}%`, minHeight: '3px', background: color, borderRadius: '3px 3px 0 0', transition: 'height 0.5s ease' }} />
    </div>
  );
}

export default function AnalyticsPanel() {
  const [period, setPeriod] = useState('7 jours');
  const [metric, setMetric] = useState('views');

  const maxViews  = Math.max(...MOCK_WEEKLY.map(d => d.views));
  const maxClicks = Math.max(...MOCK_WEEKLY.map(d => d.clicks));
  const totalViews  = MOCK_WEEKLY.reduce((s, d) => s + d.views, 0);
  const totalClicks = MOCK_WEEKLY.reduce((s, d) => s + d.clicks, 0);
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0';

  const stats = [
    { label: 'Vues totales',     value: totalViews,  icon: Eye,          color: '#6366f1', delta: '+18%' },
    { label: 'Clics totaux',     value: totalClicks, icon: MousePointer, color: '#22c55e', delta: '+9%'  },
    { label: 'Taux de clic',     value: ctr + '%',   icon: TrendingUp,   color: '#f59e0b', delta: '+2%'  },
    { label: 'Visiteurs uniques',value: 87,          icon: Users,        color: '#a78bfa', delta: '+14%' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header + sélecteur période */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Analytics</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>Performance de votre profil</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '3px' }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, background: period === p ? 'rgba(99,102,241,0.3)' : 'transparent', color: period === p ? '#a78bfa' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{s.label}</span>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={12} color={s.color} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ color: 'white', fontSize: '22px', fontWeight: 800 }}>{s.value}</span>
              <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowUpRight size={11} />{s.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Graphique barres */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>Activité — {period}</span>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px' }}>
            {['views', 'clicks'].map(m => (
              <button key={m} onClick={() => setMetric(m)}
                style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 600, background: metric === m ? (m === 'views' ? 'rgba(99,102,241,0.3)' : 'rgba(34,197,94,0.3)') : 'transparent', color: metric === m ? (m === 'views' ? '#a78bfa' : '#22c55e') : 'rgba(255,255,255,0.35)', transition: 'all 0.15s' }}>
                {m === 'views' ? 'Vues' : 'Clics'}
              </button>
            ))}
          </div>
        </div>
        {/* Barres */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
          {MOCK_WEEKLY.map(d => {
            const val = metric === 'views' ? d.views : d.clicks;
            const max = metric === 'views' ? maxViews : maxClicks;
            const color = metric === 'views' ? '#6366f1' : '#22c55e';
            return (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%' }}>
                <MiniBar value={val} max={max} color={color} height={64} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top liens */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <BarChart2 size={14} color="rgba(255,255,255,0.4)" />
          <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>Top liens</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MOCK_TOP_LINKS.map((link, i) => {
            const maxClk = MOCK_TOP_LINKS[0].clicks;
            return (
              <div key={link.platform} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', width: '14px', flexShrink: 0 }}>#{i + 1}</span>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{link.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>{link.platform}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>{link.clicks}</span>
                      <span style={{ fontSize: '10px', color: link.trend > 0 ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: '1px' }}>
                        {link.trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {Math.abs(link.trend)}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${(link.clicks / maxClk) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '2px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}