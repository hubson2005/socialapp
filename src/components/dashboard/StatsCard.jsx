import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { Eye, MousePointer, TrendingUp, Award } from 'lucide-react';

export default function StatsCard({ profileId }) {
  const [stats, setStats] = useState({ views: 0, clicks: 0, topPlatform: null, clicksByPlatform: {} });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('profile_stats')
      .select('*')
      .eq('profile_id', profileId);

    if (error || !data) { setLoading(false); return; }

    const views = data.filter(d => d.event_type === 'view').length;
    const clicks = data.filter(d => d.event_type === 'click');
    const clicksByPlatform = {};
    clicks.forEach(c => {
      if (c.platform) clicksByPlatform[c.platform] = (clicksByPlatform[c.platform] || 0) + 1;
    });
    const topPlatform = Object.entries(clicksByPlatform).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    setStats({ views, clicks: clicks.length, topPlatform, clicksByPlatform });
    setLoading(false);
  };

  useEffect(() => {
    if (!profileId) return;
    fetchStats();

    const channel = supabase
      .channel('stats-' + profileId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profile_stats', filter: 'profile_id=eq.' + profileId }, () => fetchStats())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profileId]);

  const metrics = [
    { icon: Eye,          label: 'Vues',     value: stats.views,  color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { icon: MousePointer, label: 'Clics',    value: stats.clicks, color: '#ff6b35', bg: 'rgba(255,107,53,0.12)' },
    { icon: TrendingUp,   label: 'Taux',     value: stats.views > 0 ? Math.round((stats.clicks / stats.views) * 100) + '%' : '0%', color: '#25D366', bg: 'rgba(37,211,102,0.12)' },
    { icon: Award,        label: 'Top lien', value: stats.topPlatform ? stats.topPlatform.charAt(0).toUpperCase() + stats.topPlatform.slice(1) : '—', color: '#f7c948', bg: 'rgba(247,201,72,0.12)' },
  ];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '20px',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: 0 }}>Statistiques</h3>
        {loading && (
          <div style={{
            width: '12px', height: '12px',
            border: '2px solid rgba(99,102,241,0.4)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}/>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {metrics.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: '12px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Icon size={12} color={color} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {Object.keys(stats.clicksByPlatform).length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', margin: '0 0 8px' }}>
            Clics par plateforme
          </p>
          {Object.entries(stats.clicksByPlatform)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([platform, count]) => {
              const pct = Math.round((count / (stats.clicks || 1)) * 100);
              return (
                <div key={platform} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>{platform}</span>
                    <span style={{ color: '#ff6b35', fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,#ff6b35,#f7c948)', borderRadius: '100px', transition: 'width 0.5s ease' }}/>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {stats.views === 0 && !loading && (
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: '12px' }}>
          Partagez votre profil pour voir les stats
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}