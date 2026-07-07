import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Lock, Crown, BarChart3, Search, X,
  LayoutDashboard, Link2, CalendarDays, ShoppingBag, FileText,
  Settings, BarChart2, Activity, Users, Zap, GitBranch, MessageCircle,
  Image, Loader2,
} from "lucide-react";
import { useTranslation } from 'react-i18next';

// ─── Nav config ───────────────────────────────────────────────────────────────
export const USER_NAV = [
  { id: 'overview',      label: 'Dashboard',       icon: LayoutDashboard, group: 'main',      locked: null,       path: null                        },
  { id: 'platforms',     label: 'Plateformes',     icon: Link2,           group: 'content',   locked: null,       path: null                        },
  { id: 'event',         label: 'Événement',       icon: CalendarDays,    group: 'content',   locked: 'pro',      path: null                        },
  { id: 'marketplace',   label: 'Marketplace',     icon: ShoppingBag,     group: 'content',   locked: null,       path: null                        },
  { id: 'documents',     label: 'Documents',       icon: FileText,        group: 'content',   locked: null,       path: null                        },
  { id: 'forms',         label: 'Formulaires',     icon: FileText,        group: 'content',   locked: null,       path: null                        },
  { id: 'analytics',     label: 'Analytics',       icon: BarChart2,       group: 'analytics', locked: 'pro',      path: null                        },
  { id: 'realtime',      label: 'Temps réel',      icon: Activity,        group: 'analytics', locked: 'pro',      path: null                        },
  // ── Masqués côté Dashboard utilisateur : en cours de test sur le Dashboard admin ──
  { id:'meta', label:'Connexion Meta', icon:Zap, group:'crm', hidden: true },
  { id: 'crm',           label: 'CRM / Leads',     icon: Users,           group: 'business',  locked: 'business', path: null                        },
  { id: 'whatsapp-crm',  label: 'WhatsApp CRM',    icon: MessageCircle,   group: 'business',  locked: 'business', path: null                        },
  { id: 'automations',   label: 'Automatisations', icon: Zap,             group: 'business',  locked: 'business', path: null                        },
  { id: 'integrations',  label: 'Intégrations',    icon: GitBranch,       group: 'business',  locked: 'business', path: null                        },
  { id: 'boost', label: 'Boost & Promo', icon: Zap, group: 'crm', badge: 'NEW', hidden: true },
  { id: 'boost-analytics', label: 'Analytics Boost', icon: BarChart3, group: 'crm', hidden: true },
  { id: 'promotions', label: 'Promotions', icon: Zap, group: 'crm', badge: 'NEW', hidden: true },
  { id: 'settings',      label: 'Paramètres',      icon: Settings,        group: 'admin',     locked: null,       path: null                        },
];

export const USER_GROUPS = [
  { id: 'main',      label: 'Menu'      },
  { id: 'content',   label: 'Contenu'   },
  { id: 'analytics', label: 'Analytics' },
  { id: 'crm',       label: 'Boost & CRM' },  // ← ligne ajoutée
  { id: 'business',  label: 'Business'  },
  { id: 'admin',     label: 'Compte'    },
];

export const PLAN_ORDER = { basic: 0, événement: 0, pro: 1, business: 2 };
const MAX_PLAN_ORDER = Math.max(...Object.values(PLAN_ORDER));

// FIX — doublon supprimé : le rendu de l'avatar (photo ou initiale) était
// copié-collé identique dans le bloc "profil replié" et "profil déplié".
// Extrait ici une bonne fois pour toutes.
function AvatarBubble({ profile, limits, size = 32, radius = 9 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: `linear-gradient(135deg,${limits.color},${limits.color}99)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0, overflow: 'hidden',
    }}>
      {profile.avatar_url
        ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (profile.display_name?.[0]?.toUpperCase() || '?')
      }
    </div>
  );
}

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
  isTablet = false,
  onBgUpload,
  onBgRemove,
  bgImageUrl,
  uploadingBg,
}) {
  const [search, setSearch] = useState('');
  const currentOrder = PLAN_ORDER[plan] ?? 0;
  const isMaxPlan = currentOrder >= MAX_PLAN_ORDER;

  // Cible tactile agrandie sur mobile et tablette (écrans tactiles) : les
  // petits boutons icône (toggle, effacer recherche, retirer le fond)
  // passent de 28px à une taille conforme aux recommandations Apple/Material.
  const touchDevice = isMobile || isTablet;
  const utilityBtnSize = touchDevice ? 40 : 28;

  // FIX iOS/Android — quand le tiroir mobile est ouvert, on bloque le
  // scroll du body pour éviter l'effet de "double scroll" / bounce
  // élastique qui laisse apparaître le contenu du dashboard derrière.
  useEffect(() => {
    if (!isMobile) return;
    if (collapsed) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isMobile, collapsed]);

  // Liste de base : on retire systématiquement les items masqués (en test côté admin)
  const visibleNav = USER_NAV.filter(n => !n.hidden);

  const isNavLocked = (item) => {
    if (!item.locked) return false;
    return currentOrder < (PLAN_ORDER[item.locked] ?? 99);
  };

  const filtered = visibleNav.filter(
    n => !search || n.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleNav = (id, locked) => {
    if (locked) return;
    onNavigate(id);
    if (isMobile) onToggle();
  };

  const desktopWidth = collapsed ? (isTablet ? 72 : 64) : (isTablet ? 240 : 220);
  const { t } = useTranslation();

  const sidebarStyle = isMobile
    ? {
        position: 'fixed', top: 0, left: 0,
        width: '260px',
        height: '100dvh',
        transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.25s ease',
        zIndex: 20,
        // Évite que le logo/la recherche passent sous l'encoche iOS et que
        // le pied de tiroir passe sous le home indicator.
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxSizing: 'border-box',
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
            aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            style={{
              width: utilityBtnSize, height: utilityBtnSize, borderRadius: '8px',
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
              <AvatarBubble profile={profile} limits={limits} size={32} radius={9} />
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
            <div onClick={() => handleNav('overview', false)} style={{ cursor: 'pointer' }}>
              <AvatarBubble profile={profile} limits={limits} size={34} radius={9} />
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
                style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: touchDevice ? '16px' : '12px', flex: 1, minWidth: 0 }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Effacer la recherche"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    width: touchDevice ? 32 : 16, height: touchDevice ? 32 : 16,
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          padding: '8px',
          minHeight: 0,
        }}>
          {USER_GROUPS.map(group => {
            // visibleNav exclut déjà les items "hidden" (en test sur le Dashboard admin)
            const items = (search ? filtered : visibleNav).filter(n => n.group === group.id);
            if (!items.length) return null;

            return (
              <div key={group.id} style={{ marginBottom: '4px' }}>
                {collapsed && !isMobile
                  ? <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 4px 8px' }} />
                  : <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px 4px', margin: 0 }}>
                      {t(`group_${group.id}`, group.label)}
                    </p>
                }

                {items.map(item => {
                  const locked    = isNavLocked(item);
                  const isActive  = activeSection === item.id;
                  const lockColor = item.locked === 'business' ? '#f7c948' : '#ff8c00';
                  const lockLabel = item.locked === 'business' ? 'BUSINESS' : 'PRO';

                  const buttonEl = (
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
                      {isActive && !locked && (
                        <div style={{
                          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                          width: '3px', height: '20px',
                          background: 'linear-gradient(180deg,#6366f1,#8b5cf6)',
                          borderRadius: '0 3px 3px 0',
                        }} />
                      )}

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

                      {(!collapsed || isMobile) && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                          <span style={{
                            color: isActive && !locked ? 'white' : 'rgba(255,255,255,0.55)',
                            fontSize: '12.5px',
                            fontWeight: isActive && !locked ? 700 : 500,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {t(item.id, item.label)}
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

                      {locked && collapsed && !isMobile && (
                        <div style={{
                          position: 'absolute', top: '6px', right: '6px',
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: lockColor, border: '1px solid rgba(0,0,0,0.5)',
                        }} />
                      )}
                    </button>
                  );

                  return item.path && !locked
                    ? (
                      <Link
                        key={item.id}
                        to={item.path}
                        style={{ textDecoration: 'none', display: 'block' }}
                        onClick={() => { onNavigate(item.id); if (isMobile) onToggle(); }}
                      >
                        {buttonEl}
                      </Link>
                    )
                    : buttonEl;
                })}
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        {(!collapsed || isMobile) && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>

            {/* ── Bouton image de fond ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
                background: bgImageUrl ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                border: '1px solid ' + (bgImageUrl ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'),
                borderRadius: '8px', padding: '7px 10px', cursor: 'pointer',
                position: 'relative',
              }}>
                {uploadingBg
                  ? <Loader2 size={12} color="#a78bfa" className="animate-spin" />
                  : <Image size={12} color={bgImageUrl ? '#a78bfa' : 'rgba(255,255,255,0.4)'} />
                }
                <span style={{ color: bgImageUrl ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600 }}>
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
                  aria-label="Retirer l'image de fond"
                  style={{
                    width: utilityBtnSize, height: utilityBtnSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '8px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <X size={11} color="#f87171" />
                </button>
              )}
            </div>

            {/* ── Infos plan ── */}
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
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: isMaxPlan ? 0 : '0 0 6px' }}>
                {limits.maxLinks} liens · {limits.maxMarketplace === Infinity ? '∞' : limits.maxMarketplace} produits
              </p>
              {!isMaxPlan && (
                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ff8c00', fontSize: '10px', fontWeight: 600, textDecoration: 'none' }}>
                  <Crown size={10} /> Changer d'offre
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

