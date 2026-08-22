/**
 * StatsCard.jsx — Statistiques temps réel d'un profil
 *
 * CORRECTIONS APPLIQUÉES :
 *  [C1]  fetchStats déplacée dans useEffect via useCallback pour éviter les closures stales
 *  [C2]  Fuite mémoire : guard isMounted avant tout setState async
 *  [C3]  @keyframes sorti du JSX, injecté une seule fois via useEffect (préfixé 'statscard-spin')
 *  [C4]  channel.unsubscribe() à la place du deprecated supabase.removeChannel()
 *  [C5]  Requête limitée à 500 lignes pour éviter les surcharges
 *  [C6]  Taux de clic cappé à 100% (Math.min)
 *  [C7]  Division par zéro : Math.max(stats.clicks, 1) pour les barres
 *  [C8]  Gestion d'erreur visible avec état error + message utilisateur
 *  [C9]  Reset du state au changement de profileId (évite l'affichage des données précédentes)
 *  [C10] Valeurs affichées comme '—' pendant le loading (pas de faux zéros)
 *  [C11] Capitalisation de topPlatform isolée dans une fonction utilitaire
 *  [T1]  [FIX THÈME] Carte calquée sur l'ancien fond sombre du dashboard
 *        (rgba(255,255,255,0.0x) + texte blanc). Repassée en thème clair
 *        (carte blanche, texte foncé) pour rester lisible sur le fond
 *        #f4f5fa désormais utilisé par le dashboard.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import { Eye, MousePointer, TrendingUp, Award, AlertCircle } from 'lucide-react';

// ─── Utilitaires ──────────────────────────────────────────────
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';

const KEYFRAME_ID = 'statscard-spin-keyframe';

// ─── StatsCard ────────────────────────────────────────────────
export default function StatsCard({ profileId }) {
  const [stats, setStats]   = useState({ views: 0, clicks: 0, topPlatform: null, clicksByPlatform: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  // [C2] Guard isMounted pour éviter setState après démontage
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // [C3] Injection unique du keyframe, préfixé pour éviter les collisions
  useEffect(() => {
    if (!document.getElementById(KEYFRAME_ID)) {
      const style = document.createElement('style');
      style.id = KEYFRAME_ID;
      style.textContent = `@keyframes statscard-spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
  }, []);

  // [C1] fetchStats stable via useCallback, listée en dep de useEffect
  const fetchStats = useCallback(async () => {
    if (!profileId) return;

    setError(null);

    // [C5] Limite à 500 lignes pour éviter les surcharges réseau
    const { data, error: fetchError } = await supabase
      .from('profile_stats')
      .select('event_type, platform')
      .eq('profile_id', profileId)
      .limit(500);

    if (!isMounted.current) return; // [C2] Composant démonté pendant le fetch

    if (fetchError || !data) {
      // [C8] Erreur visible
      setError('Impossible de charger les statistiques.');
      setLoading(false);
      return;
    }

    const views  = data.filter(d => d.event_type === 'view').length;
    const clicks = data.filter(d => d.event_type === 'click');

    const clicksByPlatform = {};
    clicks.forEach(c => {
      if (c.platform) {
        clicksByPlatform[c.platform] = (clicksByPlatform[c.platform] || 0) + 1;
      }
    });

    const topPlatform =
      Object.entries(clicksByPlatform).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    setStats({ views, clicks: clicks.length, topPlatform, clicksByPlatform });
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;

    // [C9] Reset du state à chaque changement de profileId
    setStats({ views: 0, clicks: 0, topPlatform: null, clicksByPlatform: {} });
    setLoading(true);
    setError(null);

    fetchStats();

    const channel = supabase
      .channel('stats-' + profileId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profile_stats', filter: 'profile_id=eq.' + profileId },
        () => fetchStats(),
      )
      .subscribe();

    return () => {
      // [C4] unsubscribe() recommandé par l'API Supabase actuelle
      channel.unsubscribe();
    };
  }, [profileId, fetchStats]); // [C1] fetchStats en dep (stable grâce à useCallback)

  // [C6] Taux cappé à 100% · [C10] '—' pendant le loading
  const rateValue = loading
    ? '—'
    : stats.views > 0
      ? Math.min(100, Math.round((stats.clicks / stats.views) * 100)) + '%'
      : '0%';

  // [C11] Capitalisation isolée · [C10] '—' pendant loading
  const topValue = loading ? '—' : capitalize(stats.topPlatform ?? null);

  const metrics = [
    { icon: Eye,          label: 'Vues',     value: loading ? '—' : stats.views,  color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { icon: MousePointer, label: 'Clics',    value: loading ? '—' : stats.clicks, color: '#ff6b35', bg: 'rgba(255,107,53,0.1)'  },
    { icon: TrendingUp,   label: 'Taux',     value: rateValue,                     color: '#16a34a', bg: 'rgba(34,197,94,0.1)'  },
    { icon: Award,        label: 'Top lien', value: topValue,                      color: '#b8860b', bg: 'rgba(247,201,72,0.16)'  },
  ];

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e6e8f0',
      borderRadius: '20px',
      padding: '16px',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ color: '#161a2e', fontSize: '13px', fontWeight: 700, margin: 0 }}>Statistiques</h3>
        {loading && (
          <div style={{
            width: '12px', height: '12px',
            border: '2px solid rgba(99,102,241,0.25)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'statscard-spin 0.7s linear infinite', // [C3] nom préfixé
          }} />
        )}
      </div>

      {/* [C8] Bandeau d'erreur */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '10px',
          padding: '8px 12px',
          marginBottom: '12px',
        }}>
          <AlertCircle size={13} color="#dc2626" style={{ flexShrink: 0 }} />
          <span style={{ color: '#dc2626', fontSize: '11px' }}>{error}</span>
        </div>
      )}

      {/* Grille métriques */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {metrics.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: '12px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Icon size={12} color={color} />
              <span style={{ fontSize: '11px', color: '#6b7280' }}>{label}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Détail par plateforme */}
      {!loading && Object.keys(stats.clicksByPlatform).length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eef0f5' }}>
          <p style={{ fontSize: '11px', color: '#8a90a2', margin: '0 0 8px' }}>
            Clics par plateforme
          </p>
          {Object.entries(stats.clicksByPlatform)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([platform, count]) => {
              // [C7] Math.max pour éviter NaN si clicks = 0
              const pct = Math.round((count / Math.max(stats.clicks, 1)) * 100);
              return (
                <div key={platform} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: '#454b5a', textTransform: 'capitalize' }}>{platform}</span>
                    <span style={{ color: '#ea580c', fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ height: '4px', background: '#e6e8f0', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: pct + '%',
                      background: 'linear-gradient(90deg,#ff6b35,#f7c948)',
                      borderRadius: '100px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* État vide */}
      {!loading && !error && stats.views === 0 && (
        <p style={{ fontSize: '11px', color: '#a2a7b5', textAlign: 'center', marginTop: '12px', margin: '12px 0 0' }}>
          Partagez votre profil pour voir les stats
        </p>
      )}
    </div>
  );
}