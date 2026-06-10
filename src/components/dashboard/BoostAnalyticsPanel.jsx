import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase';
import { toast } from 'sonner';
import {
  BarChart3, TrendingUp, Eye, MousePointerClick, Heart,
  MessageSquare, Share2, RefreshCw, Loader2, Globe,
  ArrowUpRight, ArrowDownRight, Zap, Users, Activity,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── Config réseaux ───────────────────────────────────────────────────────────
const NET = {
  facebook:  { label: 'Facebook',   color: '#1877f2', icon: FaFacebook  },
  instagram: { label: 'Instagram',  color: '#e1306c', icon: FaInstagram },
  whatsapp:  { label: 'WhatsApp',   color: '#25d366', icon: FaWhatsapp  },
  socialapp: { label: 'SocialApp',  color: '#6366f1', icon: Globe       },
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, trend }) {
  const isUp = trend > 0;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600 }}>{label.toUpperCase()}</span>
        <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span style={{ color: 'white', fontSize: '26px', fontWeight: 900, lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {trend !== undefined && trend !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: isUp ? '#22c55e' : '#ef4444', fontSize: '11px', fontWeight: 600 }}>
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {sub && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{sub}</span>}
    </div>
  );
}

// ─── NetworkStats ─────────────────────────────────────────────────────────────
function NetworkStats({ network, stats }) {
  const cfg = NET[network];
  if (!cfg) return null;
  const Icon = cfg.icon;

  const items = [
    { label: 'Portée',       value: stats.reach        || 0, icon: Users           },
    { label: 'Impressions',  value: stats.impressions  || 0, icon: Eye             },
    { label: 'Likes',        value: stats.likes        || 0, icon: Heart           },
    { label: 'Commentaires', value: stats.comments     || 0, icon: MessageSquare   },
    { label: 'Partages',     value: stats.shares       || 0, icon: Share2          },
    { label: 'Clics',        value: stats.clicks       || 0, icon: MousePointerClick },
  ].filter(i => i.value > 0 || network !== 'socialapp');

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: cfg.color + '0a' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: cfg.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={cfg.color} />
        </div>
        <div>
          <p style={{ color: 'white', fontSize: '13px', fontWeight: 800, margin: 0 }}>{cfg.label}</p>
          {stats.engagement_rate !== undefined && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: 0 }}>
              Taux d'engagement : <span style={{ color: cfg.color, fontWeight: 700 }}>{stats.engagement_rate}%</span>
            </p>
          )}
        </div>
        {stats.error && (
          <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: '10px', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '5px' }}>
            Erreur API
          </span>
        )}
      </div>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
        {items.map(({ label, value, icon: SIcon }) => (
          <div key={label} style={{ background: '#0a0817', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}>
            <SIcon size={12} color="rgba(255,255,255,0.3)" />
            <span style={{ color: 'white', fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>{value.toLocaleString()}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: 600 }}>{label.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── CustomTooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,8,23,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: '0 0 6px' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontSize: '12px', fontWeight: 700, margin: '2px 0' }}>
          {p.name} : {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ─── BoostAnalyticsPanel ──────────────────────────────────────────────────────
export default function BoostAnalyticsPanel({ profile }) {
  const [boosts, setBoosts] = useState([]);
  const [selectedBoostId, setSelectedBoostId] = useState(null);
  const [analytics, setAnalytics] = useState({});   // { facebook: {...}, instagram: {...} }
  const [history, setHistory] = useState([]);        // historique depuis boost_analytics
  const [socialStats, setSocialStats] = useState({ views: 0, clicks: 0, leads: 0, scans: 0 });
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Charge les boosts
  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profile_boosts')
        .select('*')
        .eq('profile_id', profile.id)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });
      setBoosts(data || []);
      if (data?.length) setSelectedBoostId(data[0].id);
      setLoading(false);
    })();
  }, [profile?.id]);

  // Charge les analytics du boost sélectionné
  useEffect(() => {
    if (!selectedBoostId) return;
    (async () => {
      // Dernières stats par réseau
      const { data } = await supabase
        .from('boost_analytics')
        .select('*')
        .eq('boost_id', selectedBoostId)
        .order('fetched_at', { ascending: false });

      if (data?.length) {
        const latest = {};
        data.forEach(row => { if (!latest[row.network]) latest[row.network] = row; });
        setAnalytics(latest);

        // Historique pour le graphique (7 dernières mesures)
        const chartData = data.slice(0, 7).reverse().map(row => ({
          date: new Date(row.fetched_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          reach: row.reach,
          impressions: row.impressions,
          likes: row.likes,
          network: row.network,
        }));
        setHistory(chartData);
      }

      // Stats SocialApp
      const boost = boosts.find(b => b.id === selectedBoostId);
      if (boost?.start_date) {
        const [views, clicks, leads] = await Promise.all([
          supabase.from('profile_stats').select('id', { count: 'exact', head: true })
            .eq('profile_id', profile.id).gte('created_at', boost.start_date),
          supabase.from('profile_stats').select('id', { count: 'exact', head: true })
            .eq('profile_id', profile.id).eq('event_type', 'click').gte('created_at', boost.start_date),
          supabase.from('leads').select('id', { count: 'exact', head: true })
            .eq('profile_id', profile.id).gte('created_at', boost.start_date),
        ]);
        setSocialStats({
          views: views.count || 0,
          clicks: clicks.count || 0,
          leads: leads.count || 0,
          scans: 0,
        });
      }
    })();
  }, [selectedBoostId, boosts, profile?.id]);

  const handleFetchAnalytics = useCallback(async () => {
    if (!selectedBoostId) return;
    setFetching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-boost-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ boost_id: selectedBoostId }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      // Recharge les analytics
      const { data } = await supabase
        .from('boost_analytics')
        .select('*')
        .eq('boost_id', selectedBoostId)
        .order('fetched_at', { ascending: false });

      if (data?.length) {
        const latest = {};
        data.forEach(row => { if (!latest[row.network]) latest[row.network] = row; });
        setAnalytics(latest);
      }
      toast.success('✅ Analytics mis à jour !');
    } catch (err) {
      toast.error('Erreur : ' + err.message);
    } finally {
      setFetching(false);
    }
  }, [selectedBoostId]);

  const selectedBoost = boosts.find(b => b.id === selectedBoostId);
  const totalReach = Object.values(analytics).reduce((s, a) => s + (a.reach || 0), 0);
  const totalImpressions = Object.values(analytics).reduce((s, a) => s + (a.impressions || 0), 0);
  const totalEngagement = Object.values(analytics).reduce((s, a) => s + (a.likes || 0) + (a.comments || 0) + (a.shares || 0), 0);
  const avgEngRate = Object.values(analytics).filter(a => a.engagement_rate).reduce((s, a, _, arr) => s + a.engagement_rate / arr.length, 0);

  // Données graphique comparatif réseaux
  const networkChartData = Object.entries(analytics).map(([network, stats]) => ({
    network: NET[network]?.label || network,
    reach: stats.reach || 0,
    impressions: stats.impressions || 0,
    engagement: (stats.likes || 0) + (stats.comments || 0) + (stats.shares || 0),
    color: NET[network]?.color || '#6366f1',
  }));

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Loader2 size={24} className="animate-spin" color="rgba(99,102,241,0.6)" />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>
            📊 Analytics Promotions
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
            Performances Facebook, Instagram & SocialApp
          </p>
        </div>
        <button onClick={handleFetchAnalytics} disabled={fetching || !selectedBoostId}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          {fetching ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {fetching ? 'Mise à jour…' : 'Actualiser'}
        </button>
      </div>

      {/* Boost selector */}
      {boosts.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {boosts.map(b => (
            <button key={b.id} onClick={() => setSelectedBoostId(b.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '10px', border: '1px solid ' + (selectedBoostId === b.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'), background: selectedBoostId === b.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', color: selectedBoostId === b.id ? '#a78bfa' : 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
              {b.boost_type === 'premium' ? '👑' : b.boost_type === 'standard' ? '⭐' : '🚀'}
              Boost {b.boost_type}
              <span style={{ background: b.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)', color: b.status === 'active' ? '#22c55e' : '#a78bfa', borderRadius: '4px', padding: '1px 5px', fontSize: '9px' }}>
                {b.status === 'active' ? '● Live' : 'Terminé'}
              </span>
            </button>
          ))}
        </div>
      )}

      {boosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '20px' }}>
          <BarChart3 size={32} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'white', fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>Aucun boost actif</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>Créez un boost pour voir les analytics de promotion</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
            {[['overview', BarChart3, 'Vue globale'], ['networks', Activity, 'Par réseau'], ['history', TrendingUp, 'Historique']].map(([id, Icon, label]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '9px', border: 'none', background: activeTab === id ? 'rgba(99,102,241,0.35)' : 'transparent', color: activeTab === id ? 'white' : 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* KPIs globaux */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <StatCard label="Portée totale" value={totalReach} icon={Users} color="#6366f1" sub="Personnes touchées" />
                <StatCard label="Impressions" value={totalImpressions} icon={Eye} color="#f59e0b" sub="Affichages totaux" />
                <StatCard label="Engagement" value={totalEngagement} icon={Heart} color="#e1306c" sub="Likes + commentaires + partages" />
                <StatCard label="Taux d'eng." value={avgEngRate.toFixed(1) + '%'} icon={TrendingUp} color="#22c55e" sub="Moyenne tous réseaux" />
              </div>

              {/* SocialApp stats */}
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '18px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Globe size={14} color="#a78bfa" />
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: 800 }}>SocialApp — pendant le boost</span>
                  {selectedBoost?.start_date && (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginLeft: 'auto' }}>
                      depuis le {new Date(selectedBoost.start_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    ['Vues profil', socialStats.views, Eye, '#6366f1'],
                    ['Clics liens', socialStats.clicks, MousePointerClick, '#f59e0b'],
                    ['Nouveaux leads', socialStats.leads, Users, '#22c55e'],
                  ].map(([label, value, Icon, color]) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <Icon size={14} color={color} style={{ margin: '0 auto 6px' }} />
                      <p style={{ color: 'white', fontSize: '20px', fontWeight: 900, margin: '0 0 2px' }}>{value.toLocaleString()}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graphique comparatif réseaux */}
              {networkChartData.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, margin: '0 0 14px' }}>COMPARATIF RÉSEAUX</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={networkChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="network" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="reach" name="Portée" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="engagement" name="Engagement" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── NETWORKS TAB ── */}
          {activeTab === 'networks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.keys(analytics).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                  <Activity size={24} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 10px' }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 12px' }}>
                    Aucune donnée — Cliquez sur "Actualiser" pour récupérer les stats
                  </p>
                  <button onClick={handleFetchAnalytics} disabled={fetching}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    {fetching ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Charger les analytics
                  </button>
                </div>
              ) : (
                Object.entries(analytics).map(([network, stats]) => (
                  <NetworkStats key={network} network={network} stats={stats} />
                ))
              )}

              {/* SocialApp toujours affiché */}
              <NetworkStats network="socialapp" stats={{ reach: socialStats.views, impressions: socialStats.views, likes: 0, comments: 0, shares: 0, clicks: socialStats.clicks }} />
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                  <TrendingUp size={24} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 10px' }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Historique disponible après plusieurs actualisations</p>
                </div>
              ) : (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, margin: '0 0 14px' }}>ÉVOLUTION DE LA PORTÉE</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="reach" name="Portée" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                        <Line type="monotone" dataKey="impressions" name="Impressions" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table historique */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, margin: 0 }}>HISTORIQUE DES MESURES</p>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                            {['Date', 'Réseau', 'Portée', 'Impressions', 'Likes'].map(h => (
                              <th key={h} style={{ padding: '8px 14px', color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((row, i) => {
                            const cfg = NET[row.network];
                            return (
                              <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '9px 14px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{row.date}</td>
                                <td style={{ padding: '9px 14px' }}>
                                  <span style={{ color: cfg?.color || '#6366f1', fontSize: '11px', fontWeight: 600 }}>{cfg?.label || row.network}</span>
                                </td>
                                <td style={{ padding: '9px 14px', color: 'white', fontSize: '12px', fontWeight: 700 }}>{(row.reach || 0).toLocaleString()}</td>
                                <td style={{ padding: '9px 14px', color: 'white', fontSize: '12px', fontWeight: 700 }}>{(row.impressions || 0).toLocaleString()}</td>
                                <td style={{ padding: '9px 14px', color: '#e1306c', fontSize: '12px', fontWeight: 700 }}>{(row.likes || 0).toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}