import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Lock, Crown, Search, X,
  LayoutDashboard, Link2, CalendarDays, ShoppingBag, FileText,
  Settings, BarChart2, Activity, Users, Zap, GitBranch,
} from "lucide-react";

// ─── Nav config ───────────────────────────────────────────────────────────────
export const USER_NAV = [
  { id: 'overview',     label: 'Dashboard',       icon: LayoutDashboard, group: 'main',      locked: null       },
  { id: 'platforms',    label: 'Plateformes',     icon: Link2,           group: 'content',   locked: null       },
  { id: 'event',        label: 'Événement',       icon: CalendarDays,    group: 'content',   locked: 'pro'      },
  { id: 'marketplace',  label: 'Marketplace',     icon: ShoppingBag,     group: 'content',   locked: null       },
  { id: 'documents',    label: 'Documents',       icon: FileText,        group: 'content',   locked: null       },
  { id: 'analytics',    label: 'Analytics',       icon: BarChart2,       group: 'analytics', locked: 'pro'      },
  { id: 'realtime',     label: 'Temps réel',      icon: Activity,        group: 'analytics', locked: 'pro'      },
  { id: 'crm',          label: 'CRM / Leads',     icon: Users,           group: 'business',  locked: 'business' },
  { id: 'automations',  label: 'Automatisations', icon: Zap,             group: 'business',  locked: 'business' },
  { id: 'integrations', label: 'Intégrations',    icon: GitBranch,       group: 'business',  locked: 'business' },
  { id: 'settings',     label: 'Paramètres',      icon: Settings,        group: 'admin',     locked: null       },
];

export const USER_GROUPS = [
  { id: 'main',      label: 'Menu'      },
  { id: 'content',   label: 'Contenu'   },
  { id: 'analytics', label: 'Analytics' },
  { id: 'business',  label: 'Business'  },
  { id: 'admin',     label: 'Compte'    },
];

// Plan order — exporté pour usage dans UserDashboard
export const PLAN_ORDER = { basic: 0, événement: 0, pro: 1, business: 2 };

// ─── UserSidebar ──────────────────────────────────────────────────────────────
export default function UserSidebar({
  activeSection,
  onNavigate,
  profile,
  plan,
  limits,
  collapsed,
  onToggle,
  isMobile,
}) {
  const [search, setSearch] = useState('');
  const currentOrder = PLAN_ORDER[plan] ?? 0;

  const isNavLocked = (item) => {
    if (!item.locked) return false;
    return currentOrder < (PLAN_ORDER[item.locked] ?? 99);
  };

  const filtered = USER_NAV.filter(
    n => !search || n.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleNav = (id, locked) => {
    if (locked) return;
    onNavigate(id);
    if (isMobile) onToggle();
  };

  const desktopWidth = collapsed ? 64 : 220;

  const sidebarStyle = isMobile
    ? {
        position: 'fixed', top: 0, left: 0,
        width: '260px', height: '100vh',
        transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.25s ease',
        zIndex: 20,
      }
    : {
        position: 'sticky', top: 0,
        width: desktopWidth + 'px',
        minWidth: desktopWidth + 'px',
        height: '100vh',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        zIndex: 20,
        flexShrink: 0,
      };

  return (
    <>
      {/* Overlay mobile */}
      {isMobile && !collapsed && (
        <div
          onClick={onToggle}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 19,
          }}
        />
      )}

      <div style={{
        ...sidebarStyle,
        background: 'rgba(6,4,18,0.97)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: isMobile && !collapsed ? '8px 0 40px rgba(0,0,0,0.7)' : 'none',
      }}>

        {/* ── Logo ── */}
        <div style={{
          padding: collapsed && !isMobile ? '18px 0' : '16px',
          display: 'flex', alignItems: 'center', gap: '10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <img
              src="/Logo_SocialApp.png" alt=""
              style={{ width: '30px', height: '30px', borderRadius: '9px', objectFit: 'cover', flexShrink: 0 }}
            />
            {(!collapsed || isMobile) && (
              <div>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 800, display: 'block', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  SocialApp
                </span>
                <span style={{ color: limits.color, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {limits.emoji} {limits.label}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {collapsed && !isMobile
              ? <ChevronRight size={13} color="rgba(255,255,255,0.6)" />
              : <ChevronLeft  size={13} color="rgba(255,255,255,0.6)" />
            }
          </button>
        </div>

        {/* ── Profile mini (expanded) ── */}
        {(!collapsed || isMobile) && profile && (
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div
              onClick={() => handleNav('overview', false)}
              style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: '12px',
                padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: `linear-gradient(135deg,${limits.color},${limits.color}99)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0, overflow: 'hidden',
              }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (profile.display_name?.[0]?.toUpperCase() || '?')
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'white', fontSize: '12px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile.display_name || 'Mon profil'}
                </p>
                {profile.username && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: 0 }}>@{profile.username}</p>
                )}
              </div>
              <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
            </div>
          </div>
        )}

        {/* ── Avatar collapsed ── */}
        {collapsed && !isMobile && profile && (
          <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div
              onClick={() => handleNav('overview', false)}
              style={{
                width: '34px', height: '34px', borderRadius: '9px',
                background: `linear-gradient(135deg,${limits.color},${limits.color}99)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: 'white', overflow: 'hidden', cursor: 'pointer',
              }}
            >
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (profile.display_name?.[0]?.toUpperCase() || '?')
              }
            </div>
          </div>
        )}

        {/* ── Search ── */}
        {(!collapsed || isMobile) && (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.06)', borderRadius: '9px',
              padding: '7px 10px', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Search size={12} color="rgba(255,255,255,0.3)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher…"
                style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '12px', flex: 1, minWidth: 0 }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', padding: 0 }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px' }}>
          {USER_GROUPS.map(group => {
            const items = (search ? filtered : USER_NAV).filter(n => n.group === group.id);
            if (!items.length) return null;

            return (
              <div key={group.id} style={{ marginBottom: '4px' }}>
                {collapsed && !isMobile
                  ? <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 4px 8px' }} />
                  : <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px 4px', margin: 0 }}>
                      {group.label}
                    </p>
                }

                {items.map(item => {
                  const locked    = isNavLocked(item);
                  const isActive  = activeSection === item.id;
                  const lockColor = item.locked === 'business' ? '#f7c948' : '#ff8c00';
                  const lockLabel = item.locked === 'business' ? 'BUSINESS' : 'PRO';

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id, locked)}
                      title={collapsed && !isMobile ? item.label + (locked ? ` (${lockLabel})` : '') : ''}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: collapsed && !isMobile ? 0 : '10px',
                        padding: collapsed && !isMobile ? '10px 0' : '9px 10px',
                        borderRadius: '11px',
                        border: 'none',
                        background: isActive && !locked ? 'rgba(99,102,241,0.18)' : 'transparent',
                        cursor: locked ? 'default' : 'pointer',
                        opacity: locked ? 0.45 : 1,
                        justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                        position: 'relative',
                        marginBottom: '2px',
                        transition: 'background 0.12s, opacity 0.12s',
                      }}
                    >
                      {/* Indicateur actif */}
                      {isActive && !locked && (
                        <div style={{
                          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                          width: '3px', height: '20px',
                          background: 'linear-gradient(180deg,#6366f1,#8b5cf6)',
                          borderRadius: '0 3px 3px 0',
                        }} />
                      )}

                      {/* Icône */}
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '9px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: isActive && !locked ? 'rgba(99,102,241,0.25)' : 'transparent',
                      }}>
                        {locked
                          ? <Lock size={14} color="rgba(255,255,255,0.3)" />
                          : <item.icon size={15} color={isActive ? '#a78bfa' : 'rgba(255,255,255,0.45)'} />
                        }
                      </div>

                      {/* Label + badge lock */}
                      {(!collapsed || isMobile) && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                          <span style={{
                            color: isActive && !locked ? 'white' : 'rgba(255,255,255,0.55)',
                            fontSize: '12.5px',
                            fontWeight: isActive && !locked ? 700 : 500,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {item.label}
                          </span>
                          {locked && (
                            <span style={{
                              flexShrink: 0,
                              background: lockColor + '18',
                              border: '1px solid ' + lockColor + '44',
                              borderRadius: '5px',
                              padding: '1px 5px',
                              fontSize: '8px',
                              color: lockColor,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}>
                              {lockLabel}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Point lock collapsed */}
                      {locked && collapsed && !isMobile && (
                        <div style={{
                          position: 'absolute', top: '6px', right: '6px',
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: lockColor, border: '1px solid rgba(0,0,0,0.5)',
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── Footer plan ── */}
        {(!collapsed || isMobile) && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{
              background: limits.color + '18',
              border: '1px solid ' + limits.color + '44',
              borderRadius: '10px', padding: '8px 10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px' }}>{limits.emoji}</span>
                <span style={{ color: limits.color, fontSize: '11px', fontWeight: 700 }}>Offre {limits.label}</span>
                {limits.price && (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', marginLeft: 'auto' }}>
                    {limits.price}
                  </span>
                )}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '0 0 6px' }}>
                {limits.maxLinks} liens · {limits.maxMarketplace === Infinity ? '∞' : limits.maxMarketplace} produits
              </p>
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ff8c00', fontSize: '10px', fontWeight: 600, textDecoration: 'none' }}>
                <Crown size={10} /> Changer d'offre
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}