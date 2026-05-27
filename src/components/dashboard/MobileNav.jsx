/**
 * MobileNav.jsx — Hybride Tab Bar + Sidebar pour SocialApp
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  UserPlus,
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
  Users,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

// ─── Config nav ───────────────────────────────────────────────

const TAB_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: UserPlus },
  { id: 'profiles', label: 'Profils', icon: Layers },
  { id: 'realtime', label: 'Live', icon: Radio, badge: '●' },
  { id: '__menu__', label: 'Menu', icon: Menu },
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
      { id: 'leads', label: 'Leads / CRM', icon: UserPlus },
      { id: 'automations', label: 'Automatisations', icon: Zap },
      { id: 'integrations', label: 'Intégrations', icon: Sparkles },
    ],
  },
  {
    label: 'Contenu',
    items: [
      { id: 'profiles', label: 'Mes profils', icon: Layers },
      { id: 'platforms', label: 'Plateformes', icon: Link2 },
      { id: 'event', label: 'Événement', icon: CalendarDays },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
      { id: 'documents', label: 'Documents', icon: FileText },
    ],
  },
  {
    label: 'Notifications',
    items: [
      { id: 'realtime', label: 'Temps réel', icon: Radio, badge: 'LIVE' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'accounts', label: 'Comptes', icon: Users },
      { id: 'settings', label: 'Paramètres', icon: Settings },
    ],
  },
];

// ─── MobileNav ───────────────────────────────────────────────

export default function MobileNav({
  activeSection,
  onNavigate,
  profile,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerRef = useRef(null);

  // ─────────────────────────────────────────────
  // Swipe system FIXED
  // ─────────────────────────────────────────────

  const touchStartY = useRef(0);
  const touchMoveY = useRef(0);
  const isDragging = useRef(false);

  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const onTouchMove = (e) => {
    if (!isDragging.current) return;

    touchMoveY.current = e.touches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!isDragging.current) return;

    const delta =
      touchMoveY.current - touchStartY.current;

    // fermeture uniquement gros swipe
    if (delta > 120) {
      setDrawerOpen(false);
    }

    isDragging.current = false;
    touchStartY.current = 0;
    touchMoveY.current = 0;
  };

  // ─────────────────────────────────────────────
  // Close outside
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!drawerOpen) return;

    const handler = (e) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(e.target)
      ) {
        setDrawerOpen(false);
      }
    };

    document.addEventListener('touchstart', handler);
    document.addEventListener('mousedown', handler);

    return () => {
      document.removeEventListener(
        'touchstart',
        handler
      );

      document.removeEventListener(
        'mousedown',
        handler
      );
    };
  }, [drawerOpen]);

  // ─────────────────────────────────────────────
  // Lock body scroll
  // ─────────────────────────────────────────────

  useEffect(() => {
    document.body.style.overflow = drawerOpen
      ? 'hidden'
      : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // ─────────────────────────────────────────────

  const handleTab = (id) => {
    if (id === '__menu__') {
      setDrawerOpen((v) => !v);
      return;
    }

    setDrawerOpen(false);
    onNavigate(id);
  };

  const handleDrawerNav = (id) => {
    setDrawerOpen(false);
    onNavigate(id);
  };

  const menuActive = drawerOpen;

  return (
    <>
      {/* ─────────────────────────────
          Backdrop
      ───────────────────────────── */}

      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 39,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen
            ? 'auto'
            : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* ─────────────────────────────
          Drawer
      ───────────────────────────── */}

      <div
        ref={drawerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          maxHeight: '82vh',

          transform: drawerOpen
            ? 'translateY(0)'
            : 'translateY(100%)',

          transition:
            'transform 0.32s cubic-bezier(0.32,0.72,0,1)',

          background: 'rgba(8,5,22,0.98)',

          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',

          borderRadius: '24px 24px 0 0',

          border:
            '1px solid rgba(255,255,255,0.09)',

          borderBottom: 'none',

          boxShadow:
            '0 -12px 60px rgba(0,0,0,0.7)',

          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Handle */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 0 4px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              background:
                'rgba(255,255,255,0.18)',
            }}
          />
        </div>

        {/* Header */}

        <div
          style={{
            padding: '10px 20px 14px',

            borderBottom:
              '1px solid rgba(255,255,255,0.07)',

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',

            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',

                background:
                  'linear-gradient(135deg,#6366f1,#8b5cf6)',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                fontSize: '14px',
                fontWeight: 800,
                color: 'white',

                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                profile?.display_name?.[0]?.toUpperCase() ||
                '?'
              )}
            </div>

            <div>
              <p
                style={{
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 700,
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {profile?.display_name ||
                  'Mon profil'}
              </p>

              {profile?.username && (
                <p
                  style={{
                    color:
                      'rgba(255,255,255,0.35)',
                    fontSize: '10px',
                    margin: '3px 0 0',
                  }}
                >
                  @{profile.username}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',

              background:
                'rgba(255,255,255,0.08)',

              border:
                '1px solid rgba(255,255,255,0.1)',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              cursor: 'pointer',
            }}
          >
            <X
              size={15}
              color="rgba(255,255,255,0.6)"
            />
          </button>
        </div>

        {/* ─────────────────────────────
            Scrollable content FIXED
        ───────────────────────────── */}

        <div
          onTouchMove={(e) =>
            e.stopPropagation()
          }
          style={{
            flex: 1,

            overflowY: 'auto',

            padding: '8px 12px 24px',

            overscrollBehavior: 'contain',

            WebkitOverflowScrolling: 'touch',
          }}
        >
          {SIDEBAR_GROUPS.map((group) => (
            <div
              key={group.label}
              style={{ marginBottom: '4px' }}
            >
              <p
                style={{
                  color:
                    'rgba(255,255,255,0.22)',

                  fontSize: '9px',
                  fontWeight: 700,

                  letterSpacing: '0.12em',

                  textTransform: 'uppercase',

                  padding: '10px 10px 4px',

                  margin: 0,
                }}
              >
                {group.label}
              </p>

              {group.items.map((item) => {
                const isActive =
                  activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleDrawerNav(item.id)
                    }
                    style={{
                      width: '100%',

                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',

                      padding: '11px 12px',

                      borderRadius: '13px',

                      border: 'none',

                      background: isActive
                        ? 'rgba(99,102,241,0.16)'
                        : 'transparent',

                      cursor: 'pointer',

                      marginBottom: '2px',

                      position: 'relative',
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',

                          left: 0,
                          top: '50%',

                          transform:
                            'translateY(-50%)',

                          width: '3px',
                          height: '22px',

                          background:
                            'linear-gradient(180deg,#6366f1,#8b5cf6)',

                          borderRadius:
                            '0 3px 3px 0',
                        }}
                      />
                    )}

                    <div
                      style={{
                        width: '34px',
                        height: '34px',

                        borderRadius: '10px',

                        background: isActive
                          ? 'rgba(99,102,241,0.28)'
                          : 'rgba(255,255,255,0.07)',

                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',

                        flexShrink: 0,
                      }}
                    >
                      <item.icon
                        size={16}
                        color={
                          isActive
                            ? '#a78bfa'
                            : 'rgba(255,255,255,0.5)'
                        }
                      />
                    </div>

                    <span
                      style={{
                        color: isActive
                          ? 'white'
                          : 'rgba(255,255,255,0.65)',

                        fontSize: '13.5px',

                        fontWeight: isActive
                          ? 700
                          : 500,

                        flex: 1,

                        textAlign: 'left',
                      }}
                    >
                      {item.label}
                    </span>

                    {item.badge && (
                      <span
                        style={{
                          background: '#22c55e',

                          color: 'white',

                          fontSize: '8px',
                          fontWeight: 700,

                          padding: '2px 6px',

                          borderRadius: '6px',

                          flexShrink: 0,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}

                    {!item.badge && (
                      <ChevronRight
                        size={13}
                        color="rgba(255,255,255,0.2)"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────
          Floating Tab Bar
      ───────────────────────────── */}

      <div
        style={{
          position: 'fixed',

          bottom: '16px',

          left: '50%',

          transform: 'translateX(-50%)',

          zIndex: 38,

          background: 'rgba(8,5,22,0.82)',

          backdropFilter: 'blur(24px)',

          WebkitBackdropFilter:
            'blur(24px)',

          border:
            '1px solid rgba(255,255,255,0.12)',

          borderRadius: '999px',

          padding: '8px 10px',

          display: 'flex',

          alignItems: 'center',

          gap: '4px',

          boxShadow:
            '0 8px 32px rgba(0,0,0,0.5)',

          minWidth: '280px',

          maxWidth: 'calc(100vw - 32px)',

          justifyContent: 'space-around',
        }}
      >
        {TAB_ITEMS.map((item) => {
          const isActive =
            item.id === '__menu__'
              ? menuActive
              : activeSection === item.id;

          const isMenu =
            item.id === '__menu__';

          return (
            <button
              key={item.id}
              onClick={() =>
                handleTab(item.id)
              }
              style={{
                display: 'flex',
                flexDirection: 'column',

                alignItems: 'center',

                gap: '3px',

                padding: '6px 10px',

                borderRadius: '999px',

                border: 'none',

                background: isActive
                  ? isMenu
                    ? 'rgba(239,68,68,0.18)'
                    : 'rgba(99,102,241,0.22)'
                  : 'transparent',

                cursor: 'pointer',

                transform: isActive
                  ? 'scale(1.05)'
                  : 'scale(1)',

                position: 'relative',

                minWidth: '48px',
              }}
            >
              {item.badge && !isMenu && (
                <span
                  style={{
                    position: 'absolute',

                    top: '4px',
                    right: '8px',

                    width: '7px',
                    height: '7px',

                    borderRadius: '50%',

                    background: '#22c55e',
                  }}
                />
              )}

              <item.icon
                size={20}
                color={
                  isActive
                    ? isMenu
                      ? '#f87171'
                      : '#a78bfa'
                    : 'rgba(255,255,255,0.42)'
                }
              />

              <span
                style={{
                  fontSize: '9px',

                  fontWeight: isActive
                    ? 700
                    : 500,

                  color: isActive
                    ? isMenu
                      ? '#f87171'
                      : '#a78bfa'
                    : 'rgba(255,255,255,0.3)',

                  lineHeight: 1,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}