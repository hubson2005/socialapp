// ─── PromotionsDashboard.jsx ──────────────────────────────────────────────────
// Phase 6 — Hub central de toutes les promotions
// Place ce fichier dans src/components/dashboard/PromotionsDashboard.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase';
import { toast } from 'sonner';
import {
  Zap, BarChart3, Globe, MessageCircle, TrendingUp,
  Users, Eye, MousePointerClick, ArrowUpRight, Star,
  Play, CheckCircle, Clock, Loader2, RefreshCw,
  ChevronRight, Sparkles, Shield,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';

// ─── Import des panneaux ──────────────────────────────────────────────────────
// Ces imports fonctionneront une fois les fichiers placés dans le bon dossier
import BoostPanel from './BoostPanel';
import BoostAnalyticsPanel from './BoostAnalyticsPanel';
import MetaIntegrationPanel from './MetaIntegrationPanel';
import WhatsAppPanel from './WhatsAppPanel';

// ─── MiniKPI ─────────────────────────────────────────────────────────────────
function MiniKPI({ label, value, icon: Icon, color, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600 }}>{label.toUpperCase()}</span>
        <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <span style={{ color: 'white', fontSize: '26px', fontWeight: 900, lineHeight: 1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
      {sub && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{sub}</span>}
    </div>
  );
}

// ─── ActiveBoostBanner ────────────────────────────────────────────────────────
function ActiveBoostBanner({ boost, onNavigate }) {
  if (!boost) return null;
  const daysLeft = boost.end_date ? Math.max(0, Math.ceil((new Date(boost.end_date) - new Date()) / 86400000)) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.08))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '18px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
      onClick={() => onNavigate('boosts')}
    >
      <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
        🚀
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span style={{ color: 'white', fontSize: '13px', fontWeight: 800 }}>Boost {boost.boost_type} actif</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '5px', padding: '1px 7px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2s infinite' }} />
            <span style={{ color: '#22c55e', fontSize: '9px', fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{(boost.networks || []).join(', ')}</span>
          {daysLeft !== null && <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 600 }}>{daysLeft}j restants</span>}
        </div>
      </div>
      <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
    </motion.div>
  );
}

// ─── QuickActions ─────────────────────────────────────────────────────────────
function QuickActions({ onNavigate, hasMetaConnected, hasWhatsApp }) {
  const actions = [
    { id: 'boosts',    label: 'Nouveau boost',       icon: Zap,         color: '#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', desc: 'Sponsoriser mon profil' },
    { id: 'analytics', label: 'Voir les stats',      icon: BarChart3,   color: '#6366f1', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', desc: 'Analytics de promotion' },
    { id: 'meta',      label: hasMetaConnected ? '✅ Meta connecté' : 'Connecter Meta', icon: FaFacebook, color: '#1877f2', bg: hasMetaConnected ? 'rgba(24,119,242,0.15)' : 'linear-gradient(135deg,#1877f2,#0d5bba)', desc: 'Facebook & Instagram' },
    { id: 'whatsapp',  label: hasWhatsApp ? '✅ WhatsApp actif' : 'Config. WhatsApp', icon: FaWhatsapp, color: '#25d366', bg: hasWhatsApp ? 'rgba(37,211,102,0.12)' : 'linear-gradient(135deg,#25d366,#128c7e)', desc: 'Notifications auto' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
      {actions.map(({ id, label, icon: Icon, color, bg, desc }) => (
        <button key={id} onClick={() => onNavigate(id)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'none'; }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: 'white', fontSize: '12px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '2px 0 0' }}>{desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── PromotionOverview ────────────────────────────────────────────────────────
function PromotionOverview({ profile, onNavigate, stats, activeBoost, hasMetaConnected, hasWhatsApp }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: 0 }}>🎯 Centre de Promotion</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: '4px 0 0' }}>
          Gérez tous vos boosts et publications automatiques depuis un seul endroit
        </p>
      </div>

      {/* Boost actif */}
      {activeBoost && <ActiveBoostBanner boost={activeBoost} onNavigate={onNavigate} />}

      {/* Setup status */}
      {(!hasMetaConnected || !hasWhatsApp) && (
        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Shield size={13} color="#a78bfa" />
            <span style={{ color: '#a78bfa', fontSize: '12px', fontWeight: 700 }}>Configuration recommandée</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              [hasMetaConnected, 'Connecter Facebook & Instagram', 'meta'],
              [hasWhatsApp, 'Configurer WhatsApp Business', 'whatsapp'],
            ].filter(([done]) => !done).map(([, label, id]) => (
              <button key={id} onClick={() => onNavigate(id)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(245,158,11,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#f59e0b', fontSize: '10px', fontWeight: 700 }}>!</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', flex: 1 }}>{label}</span>
                <ChevronRight size={12} color="rgba(255,255,255,0.3)" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPIs globaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
        <MiniKPI label="Boosts lancés" value={stats.totalBoosts} icon={Zap} color="#f59e0b" sub={`${stats.activeBoosts} actif(s)`} />
        <MiniKPI label="FCFA investis" value={(stats.totalSpent || 0).toLocaleString()} icon={TrendingUp} color="#6366f1" sub="Total boosts" />
        <MiniKPI label="Vues pendant boosts" value={stats.boostViews} icon={Eye} color="#22c55e" sub="Visites générées" />
        <MiniKPI label="Leads générés" value={stats.boostLeads} icon={Users} color="#e1306c" sub="Pendant les boosts" />
      </div>

      {/* Actions rapides */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, margin: '0 0 10px' }}>ACTIONS RAPIDES</p>
        <QuickActions onNavigate={onNavigate} hasMetaConnected={hasMetaConnected} hasWhatsApp={hasWhatsApp} />
      </div>

      {/* Réseaux actifs */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, margin: '0 0 12px' }}>CANAUX DE PUBLICATION</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            [FaFacebook, '#1877f2', 'Facebook', hasMetaConnected ? 'Connecté · Publication auto' : 'Non connecté', hasMetaConnected],
            [FaInstagram, '#e1306c', 'Instagram', hasMetaConnected ? 'Connecté · Publication auto' : 'Non connecté', hasMetaConnected],
            [FaWhatsapp, '#25d366', 'WhatsApp', hasWhatsApp ? 'Actif · Notifications auto' : 'Non configuré', hasWhatsApp],
            [Globe, '#6366f1', 'SocialApp', 'Toujours actif · Stats en temps réel', true],
          ].map(([Icon, color, label, sub, active]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'white', fontSize: '12px', fontWeight: 700, margin: 0 }}>{label}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>{sub}</p>
              </div>
              {active
                ? <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} /><span style={{ color: '#22c55e', fontSize: '10px', fontWeight: 600 }}>Actif</span></div>
                : <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>Inactif</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PromotionsDashboard principal ────────────────────────────────────────────
export default function PromotionsDashboard({ profile, isAdmin = false, onUpdateProfile }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ totalBoosts: 0, activeBoosts: 0, totalSpent: 0, boostViews: 0, boostLeads: 0 });
  const [activeBoost, setActiveBoost] = useState(null);
  const [hasMetaConnected, setHasMetaConnected] = useState(false);
  const [hasWhatsApp, setHasWhatsApp] = useState(!!profile?.whatsapp_phone);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoading(true);
      const [boostsRes, metaRes] = await Promise.all([
        supabase.from('profile_boosts').select('*').eq('profile_id', profile.id),
        supabase.from('meta_integrations').select('id').eq('user_id', profile.user_id || '').eq('is_active', true).maybeSingle(),
      ]);

      const boosts = boostsRes.data || [];
      const active = boosts.find(b => b.status === 'active') || null;
      setActiveBoost(active);
      setHasMetaConnected(!!metaRes.data);
      setHasWhatsApp(!!profile.whatsapp_phone);

      // Stats globales
      const totalSpent = boosts.filter(b => ['active', 'completed'].includes(b.status)).reduce((s, b) => s + (b.amount || 0), 0);

      // Vues et leads générés pendant les boosts
      let boostViews = 0, boostLeads = 0;
      if (active?.start_date) {
        const [vRes, lRes] = await Promise.all([
          supabase.from('profile_stats').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id).gte('created_at', active.start_date),
          supabase.from('leads').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id).gte('created_at', active.start_date),
        ]);
        boostViews = vRes.count || 0;
        boostLeads = lRes.count || 0;
      }

      setStats({ totalBoosts: boosts.length, activeBoosts: boosts.filter(b => b.status === 'active').length, totalSpent, boostViews, boostLeads });
      setLoading(false);
    })();
  }, [profile?.id, profile?.whatsapp_phone]);

  const TABS = [
    { id: 'overview',  icon: Star,         label: 'Vue globale'    },
    { id: 'boosts',    icon: Zap,          label: 'Boosts'         },
    { id: 'analytics', icon: BarChart3,    label: 'Analytics'      },
    { id: 'meta',      icon: FaFacebook,   label: 'Meta'           },
    { id: 'whatsapp',  icon: FaWhatsapp,   label: 'WhatsApp'       },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={28} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Chargement des promotions…</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Tabs de navigation */}
      <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '4px', marginBottom: '20px', overflowX: 'auto' }}>
        {TABS.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          const hasBadge = (id === 'meta' && !hasMetaConnected) || (id === 'whatsapp' && !hasWhatsApp);
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '12px', border: 'none', background: isActive ? 'rgba(99,102,241,0.3)' : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: isActive ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0 }}>
              <Icon size={13} color={isActive ? 'white' : 'rgba(255,255,255,0.4)'} />
              {label}
              {hasBadge && (
                <div style={{ position: 'absolute', top: '4px', right: '6px', width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b', border: '1px solid rgba(0,0,0,0.3)' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
          {activeTab === 'overview' && (
            <PromotionOverview
              profile={profile}
              onNavigate={setActiveTab}
              stats={stats}
              activeBoost={activeBoost}
              hasMetaConnected={hasMetaConnected}
              hasWhatsApp={hasWhatsApp}
            />
          )}
          {activeTab === 'boosts' && (
            <BoostPanel profile={profile} isAdmin={isAdmin} />
          )}
          {activeTab === 'analytics' && (
            <BoostAnalyticsPanel profile={profile} />
          )}
         {activeTab === 'meta' && (
  <MetaIntegrationPanel profile={profile} isAdmin={isAdmin} />
)}
          {activeTab === 'whatsapp' && (
  <WhatsAppPanel
    profile={profile}
    onUpdate={(updates) => {
      // On met à jour uniquement l'état local du PromotionsDashboard
      // sans remonter au dashboard parent (évite le "unsaved" et le Save topbar)
      if (updates.whatsapp_phone !== undefined) {
        setHasWhatsApp(!!updates.whatsapp_phone);
      }
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}