import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Activity, MousePointerClick, CircleDot, Wifi } from 'lucide-react';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';

function MiniStat({ label, value, icon: Icon, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', backdropFilter: 'blur(10px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 500 }}>{label}</span>
        <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <h3 style={{ color: 'white', fontSize: '24px', fontWeight: 800, margin: 0 }}>{value}</h3>
    </div>
  );
}

export default function RealtimePanel({ profileId }) {
  const [visitors, setVisitors]         = useState([]);
  const [connected, setConnected]       = useState(false);
  const [totalToday, setTotalToday]     = useState(0);
  const [recentClicks, setRecentClicks] = useState([]);
  const [subStatus, setSubStatus]       = useState('connecting');

  useEffect(() => {
    if (!profileId) return;

    // ── charge les vues d'aujourd'hui au montage ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    supabase
      .from('profile_stats')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('event_type', 'view')
      .gte('created_at', today.toISOString())
      .then(({ count }) => { if (count) setTotalToday(count); });

    // ── canal realtime SANS filtre côté serveur ──
    // (filtre côté client pour éviter les problèmes de RLS realtime)
    const channel = supabase
      .channel('rt-' + profileId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profile_stats' },
        (payload) => {
          const ev = payload.new;

          // filtre côté client
          if (ev.profile_id !== profileId) return;

          if (ev.event_type === 'view') {
            setTotalToday(p => p + 1);
            setVisitors(prev => [{
              id:       ev.id || Date.now(),
              country:  ev.country_name || ev.country || '?',
              device:   ev.device   || 'desktop',
              referrer: ev.referrer || 'direct',
              time:     new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            }, ...prev].slice(0, 20));
          }

          if (ev.event_type === 'click') {
            setRecentClicks(prev => [{
              id:       Date.now(),
              platform: ev.platform || 'lien',
              time:     new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            }, ...prev].slice(0, 10));
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] status:', status, err || '');
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          setSubStatus('ok');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnected(false);
          setSubStatus('error');
        } else {
          setConnected(false);
          setSubStatus(status);
        }
      });

    return () => { supabase.removeChannel(channel); setConnected(false); };
  }, [profileId]);

  const flagEmoji = (code) => {
    try {
      return code?.length === 2
        ? String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397))
        : '🌐';
    } catch { return '🌐'; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: 0 }}>Temps réel</h2>
        <span style={{ background: '#22c55e', borderRadius: '5px', padding: '2px 7px', fontSize: '9px', color: 'white', fontWeight: 800, letterSpacing: '0.5px', boxShadow: '0 0 10px rgba(34,197,94,0.45)' }}>LIVE</span>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid ' + (connected ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'), borderRadius: '20px', padding: '5px 12px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444', display: 'inline-block', animation: connected ? 'pulse-dot 2s infinite' : 'none' }} />
          <span style={{ color: connected ? '#22c55e' : '#ef4444', fontSize: '12px', fontWeight: 600 }}>
            {connected ? 'Connecté' : subStatus === 'connecting' ? 'Connexion…' : 'Déconnecté'}
          </span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Flux en direct — profil actif</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
        <MiniStat label="Vues aujourd'hui" value={totalToday}         icon={Eye}              color="#6366f1" />
        <MiniStat label="Visiteurs live"   value={visitors.length}   icon={Activity}         color="#22c55e" />
        <MiniStat label="Clics récents"    value={recentClicks.length} icon={MousePointerClick} color="#f59e0b" />
      </div>

      {/* Flux */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* Visiteurs */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CircleDot size={13} color="#22c55e" />
            <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>Flux visiteurs</span>
          </div>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {visitors.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                <Wifi size={20} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: 0 }}>En attente de visiteurs…</p>
              </div>
            ) : visitors.map(v => (
              <motion.div key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '16px', width: '20px', flexShrink: 0 }}>{flagEmoji(v.country)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'white', fontSize: '11px', fontWeight: 600, margin: 0 }}>{v.country}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>{v.device} · {v.referrer}</p>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', flexShrink: 0 }}>{v.time}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Clics */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MousePointerClick size={13} color="#f59e0b" />
            <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>Clics plateformes</span>
          </div>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {recentClicks.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                <MousePointerClick size={20} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: 0 }}>Aucun clic récent</p>
              </div>
            ) : recentClicks.map(c => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MousePointerClick size={12} color="#f59e0b" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontSize: '11px', fontWeight: 600, margin: 0, textTransform: 'capitalize' }}>{c.platform}</p>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>{c.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%,100% { transform:scale(1); opacity:1; }
          50%      { transform:scale(1.5); opacity:0.5; }
        }
      `}</style>
    </div>
  );
}

