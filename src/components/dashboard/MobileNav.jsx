/**
 * MobileNav.jsx — Hybride Tab Bar + Sidebar pour SocialApp
 * FIX: IDs alignés sur les cases de renderSection() dans UserDashboard
 *   'leads'    → 'crm'
 *   'profiles' → 'overview'
 *   'accounts' → 'settings'
 * FIX 2: Ajout section "Image de fond" + "Infos plan" dans le footer du drawer
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  ShoppingBag,
  FileText,
  Radio,
  BarChart3,
  Settings,
  CalendarDays,
  Zap,
  Sparkles,
  Link2,
  Menu,
  X,
  ChevronRight,
  Image,
  Loader2,
  Crown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Config nav ───────────────────────────────────────────────
const TAB_ITEMS = [
  { id: 'overview',  label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crm',       label: 'Leads',     icon: Users            },
  { id: 'platforms', label: 'Profils',   icon: Layers           },
  { id: 'realtime',  label: 'Live',      icon: Radio, badge: '●' },
  { id: '__menu__',  label: 'Menu',      icon: Menu             },
];

const SIDEBAR_GROUPS = [
  {
    label: 'Dashboard',
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'CRM',
    items: [
      { id: 'crm',          label: 'Leads / CRM',     icon: Users      },
      { id: 'automations',  label: 'Automatisations', icon: Zap        },
      { id: 'integrations', label: 'Intégrations',    icon: Sparkles   },
    ],
  },
  {
    label: 'Contenu',
    items: [
      { id: 'platforms',   label: 'Plateformes', icon: Link2        },
      { id: 'event',       label: 'Événement',   icon: CalendarDays },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag  },
      { id: 'documents',   label: 'Documents',   icon: FileText     },
    ],
  },
  {
    label: 'Notifications',
    items: [
      { id: 'realtime',  label: 'Temps réel', icon: Radio,   badge: 'LIVE' },
      { id: 'analytics', label: 'Analytics',  icon: BarChart3               },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'settings', label: 'Paramètres', icon: Settings },
    ],
  },
];

const PLAN_ORDER = { basic: 0, événement: 0, pro: 1, business: 2 };
const MAX_PLAN_ORDER = Math.max(...Object.values(PLAN_ORDER));

// ─── MobileNav ───────────────────────────────────────────────
export default function MobileNav({
  activeSection,
  onNavigate,
  profile,
  // Props ajoutées pour Image de fond + Infos plan
  plan,
  limits,
  onBgUpload,
  onBgRemove,
  bgImageUrl,
  uploadingBg,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  const currentOrder = PLAN_ORDER[plan] ?? 0;
  const isMaxPlan    = currentOrder >= MAX_PLAN_ORDER;

  const touchStartY = useRef(0);
  const touchMoveY  = useRef(0);
  const isDragging  = useRef(false);

  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current  = true;
  };
  const onTouchMove = (e) => {
    if (!isDragging.current) return;
    touchMoveY.current = e.touches[0].clientY;
  };
  const onTouchEnd = () => {
    if (!isDragging.current) return;
    if (touchMoveY.current - touchStartY.current > 120) setDrawerOpen(false);
    isDragging.current  = false;
    touchStartY.current = 0;
    touchMoveY.current  = 0;
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setDrawerOpen(false);
    };
    document.addEventListener('touchstart', handler);
    document.addEventListener('mousedown',  handler);
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('mousedown',  handler);
    };
  }, [drawerOpen]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleTab = (id) => {
    if (id === '__menu__') { setDrawerOpen(v => !v); return; }
    setDrawerOpen(false);
    onNavigate(id);
  };

  const handleDrawerNav = (id) => {
    setDrawerOpen(false);
    onNavigate(id);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 39,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, maxHeight: '82vh',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
          background: 'rgba(8,5,22,0.98)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
          boxShadow: '0 -12px 60px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '10px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 800, color: 'white', overflow: 'hidden', flexShrink: 0,
            }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (profile?.display_name?.[0]?.toUpperCase() || '?')
              }
            </div>
            <div>
              <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: 0, lineHeight: 1 }}>
                {profile?.display_name || 'Mon profil'}
              </p>
              {profile?.username && (
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '3px 0 0' }}>
                  @{profile.username}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={15} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Scrollable list — minHeight: 0 obligatoire pour que le footer reste visible */}
        <div
          onTouchMove={e => e.stopPropagation()}
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,           // FIX flexbox : sans ça le footer est poussé hors écran
            padding: '8px 12px 8px',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {SIDEBAR_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: '4px' }}>
              <p style={{
                color: 'rgba(255,255,255,0.22)', fontSize: '9px', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '10px 10px 4px', margin: 0,
              }}>
                {group.label}
              </p>
              {group.items.map(item => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleDrawerNav(item.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '11px 12px', borderRadius: '13px', border: 'none',
                      background: isActive ? 'rgba(99,102,241,0.16)' : 'transparent',
                      cursor: 'pointer', marginBottom: '2px', position: 'relative',
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        width: '3px', height: '22px',
                        background: 'linear-gradient(180deg,#6366f1,#8b5cf6)',
                        borderRadius: '0 3px 3px 0',
                      }} />
                    )}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: isActive ? 'rgba(99,102,241,0.28)' : 'rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <item.icon size={16} color={isActive ? '#a78bfa' : 'rgba(255,255,255,0.5)'} />
                    </div>
                    <span style={{
                      color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                      fontSize: '13.5px', fontWeight: isActive ? 700 : 500,
                      flex: 1, textAlign: 'left',
                    }}>
                      {item.label}
                    </span>
                    {item.badge
                      ? <span style={{ background: '#22c55e', color: 'white', fontSize: '8px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', flexShrink: 0 }}>{item.badge}</span>
                      : <ChevronRight size={13} color="rgba(255,255,255,0.2)" />
                    }
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Footer : Image de fond + Infos plan ── */}
        <div style={{
          padding: '12px 16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>

          {/* Bouton image de fond */}
          {onBgUpload && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                background: bgImageUrl ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                border: '1px solid ' + (bgImageUrl ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'),
                borderRadius: '10px', padding: '9px 12px', cursor: 'pointer',
                position: 'relative',
              }}>
                {uploadingBg
                  ? <Loader2 size={14} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />
                  : <Image size={14} color={bgImageUrl ? '#a78bfa' : 'rgba(255,255,255,0.4)'} />
                }
                <span style={{
                  color: bgImageUrl ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                  fontSize: '12px', fontWeight: 600,
                }}>
                  {bgImageUrl ? 'Changer le fond' : 'Image de fond'}
                </span>
                <input
                  type="file" accept="image/*"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  onChange={onBgUpload}
                  disabled={uploadingBg}
                />
              </label>
              {bgImageUrl && (
                <button
                  onClick={onBgRemove}
                  style={{
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '10px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <X size={13} color="#f87171" />
                </button>
              )}
            </div>
          )}

          {/* Infos plan */}
          {limits && (
            <div style={{
              background: limits.color + '18',
              border: '1px solid ' + limits.color + '44',
              borderRadius: '12px', padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px' }}>{limits.emoji}</span>
                <span style={{ color: limits.color, fontSize: '12px', fontWeight: 700 }}>
                  Offre {limits.label}
                </span>
                {limits.price && (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginLeft: 'auto' }}>
                    {limits.price}
                  </span>
                )}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: isMaxPlan ? 0 : '0 0 6px' }}>
                {limits.maxLinks} liens · {limits.maxMarketplace === Infinity ? '∞' : limits.maxMarketplace} produits
              </p>
              {!isMaxPlan && (
                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ff8c00', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                  <Crown size={11} /> Changer d'offre
                </a>
              )}
            </div>
          )}
        </div>

        {/* keyframes pour le spinner Loader2 */}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Floating Tab Bar */}
      <div style={{
        position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 38,
        background: 'rgba(8,5,22,0.96)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px',
        padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: '280px', maxWidth: 'calc(100vw - 32px)',
        justifyContent: 'space-around',
      }}>
        {TAB_ITEMS.map(item => {
          const isMenu   = item.id === '__menu__';
          const isActive = isMenu ? drawerOpen : activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTab(item.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: '6px 10px', borderRadius: '999px', border: 'none',
                background: isActive ? (isMenu ? 'rgba(239,68,68,0.18)' : 'rgba(99,102,241,0.22)') : 'transparent',
                cursor: 'pointer',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                position: 'relative', minWidth: '48px',
              }}
            >
              {item.badge && !isMenu && (
                <span style={{ position: 'absolute', top: '4px', right: '8px', width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} />
              )}
              <item.icon size={20} color={isActive ? (isMenu ? '#f87171' : '#a78bfa') : 'rgba(255,255,255,0.42)'} />
              <span style={{
                fontSize: '9px', fontWeight: isActive ? 700 : 500,
                color: isActive ? (isMenu ? '#f87171' : '#a78bfa') : 'rgba(255,255,255,0.3)',
                lineHeight: 1,
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}