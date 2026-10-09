import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Lock, Crown, BarChart3,
  LayoutDashboard, Link2, CalendarDays, ShoppingBag, FileText,
  Settings, BarChart2, Activity, Users, Zap, GitBranch, MessageCircle,
  LogOut, CalendarClock, Eye, CheckSquare,
} from "lucide-react";
import { useTranslation } from 'react-i18next';

// ─── Nav config ───────────────────────────────────────────────────────────────
// Aligné sur la grille tarifaire de la page d'accueil :
//  • BASIC    : carte, liens, marketplace, imports, formulaires, calendrier
//  • PRO      : + analytics détaillées + temps réel
//  • BUSINESS : + CRM, CRM WhatsApp, automatisations, intégrations, tracking IP
//  • ÉVÉNEMENT: module à 3 500 FCFA, vendu à l'unité, indépendant du plan
//               → l'entrée "Événement" reste visible avec un cadenas pour BASIC,
//               PRO et BUSINESS tant que `hasEventAccess` est faux (admin et
//               comptes ayant payé le module exceptés). Voir isNavLocked().
export const USER_NAV = [
  { id: 'overview',      label: 'Dashboard',       icon: LayoutDashboard, group: 'main',      locked: null,       path: null },
  { id: 'platforms',     label: 'Plateformes',     icon: Link2,           group: 'content',   locked: null,       path: null },
  { id: 'event',         label: 'Événement',       icon: CalendarDays,    group: 'content',   locked: 'event',    path: null }, // module payant à l'unité, verrouillé pour tous les plans
  { id: 'marketplace',   label: 'Marketplace',     icon: ShoppingBag,     group: 'content',   locked: null,       path: null },
  { id: 'documents',     label: 'Documents',       icon: FileText,        group: 'content',   locked: null,       path: null },
  { id: 'booking',       label: 'Calendrier',      icon: CalendarClock,   group: 'content',   locked: null,       path: null },
  { id: 'forms',         label: 'Formulaires',     icon: FileText,        group: 'content',   locked: null,       path: null },
  { id: 'analytics',     label: 'Analytics',       icon: BarChart2,       group: 'analytics', locked: 'pro',      path: null },
  { id: 'realtime',      label: 'Temps réel',      icon: Activity,        group: 'analytics', locked: 'pro',      path: null },
  // ── Masqués côté Dashboard utilisateur : en cours de test sur le Dashboard admin ──
  // (Sponsoring Facebook/Instagram = "BIENTÔT DISPONIBLE" dans la grille BUSINESS)
  { id: 'meta', label: 'Connexion Meta', icon: Zap, group: 'crm', hidden: true },
  { id: 'crm',            label: 'CRM / Leads',     icon: Users,         group: 'business', locked: 'business', path: null },
  { id: 'tasks',          label: 'Tâches',          icon: CheckSquare,   group: 'business', locked: 'business', path: null }, // relances & rappels
  { id: 'whatsapp-crm',   label: 'WhatsApp CRM',    icon: MessageCircle, group: 'business', locked: 'business', path: null },
  { id: 'profile-visits', label: 'Visiteurs',       icon: Eye,           group: 'business', locked: 'business', path: null }, // Tracking IP
  { id: 'automations',    label: 'Automatisations', icon: Zap,           group: 'business', locked: 'business', path: null },
  { id: 'integrations',   label: 'Intégrations',    icon: GitBranch,     group: 'business', locked: 'business', path: null },
  { id: 'boost', label: 'Boost & Promo', icon: Zap, group: 'crm', badge: 'NEW', hidden: true },
  { id: 'boost-analytics', label: 'Analytics Boost', icon: BarChart3, group: 'crm', hidden: true },
  { id: 'promotions', label: 'Promotions', icon: Zap, group: 'crm', badge: 'NEW', hidden: true },
  { id: 'settings',      label: 'Paramètres',      icon: Settings,        group: 'admin',     locked: null,       path: null },
];

export const USER_GROUPS = [
  { id: 'main',      label: 'Menu'      },
  { id: 'content',   label: 'Contenu'   },
  { id: 'analytics', label: 'Analytics' },
  { id: 'crm',       label: 'Boost & CRM' },
  { id: 'business',  label: 'Business'  },
  { id: 'admin',     label: 'Compte'    },
];

export const PLAN_ORDER = { basic: 0, 'événement': 0, evenement: 0, pro: 1, business: 2 };
const MAX_PLAN_ORDER = Math.max(...Object.values(PLAN_ORDER));

// Normalise la valeur de plan venant de la base (casse, accents, vide).
export function normalizePlan(plan) {
  const p = String(plan || 'basic').trim().toLowerCase();
  return PLAN_ORDER[p] === undefined ? 'basic' : p;
}

// Message d'invitation à la mise à niveau selon le niveau courant.
const UPGRADE_HINT = {
  0: { title: 'Passer à PRO ou BUSINESS', sub: 'Analytics, temps réel, CRM…' },
  1: { title: 'Passer à BUSINESS',        sub: 'CRM, WhatsApp IA, automatisations…' },
};

// ─── Palette (issue du logo SocialApp) ────────────────────────────────────────
const C = {
  bg:         '#0a1028',                 // bleu nuit, proche du wordmark
  border:     'rgba(255,255,255,0.08)',
  indigo:     '#4b4bf0',                 // bleu du logo
  indigoSoft: 'rgba(75,75,240,0.22)',    // fond de l'élément actif
  orange:     '#ff8a1f',                 // orange du logo
  text:       '#aab3d0',
  textStrong: '#ffffff',
  icon:       '#7e88b0',
  muted:      '#6c76a0',
};

// Hover/focus : impossibles en style inline, donc une petite feuille dédiée.
const SIDEBAR_CSS = `
  .ua-item:hover:not(.ua-on):not(.ua-locked) { background: rgba(255,255,255,0.05); }
  .ua-item:hover:not(.ua-on):not(.ua-locked) .ua-label { color: #fff; }
  .ua-item:focus-visible, .ua-util:focus-visible { outline: 2px solid ${C.orange}; outline-offset: -2px; }
  .ua-util:hover { background: rgba(255,255,255,0.06); }
  .ua-scroll::-webkit-scrollbar { width: 6px; }
  .ua-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
`;

// ─── UserSidebar ──────────────────────────────────────────────────────────────
export default function UserSidebar({
  activeSection,
  onNavigate,
  plan,
  limits,
  collapsed,
  onToggle,
  isMobile,
  isTablet = false,
  isAdmin = false,
  hasEventAccess = false, // admin || limits.hasEvent || event_module_paid (calculé dans UserDashboard)
  userEmail,
  onSignOut,
  onUpgrade,
}) {
  // Plan normalisé (casse / accents) : "Business", "ÉVÉNEMENT"… ne
  // retombent plus silencieusement sur un mauvais niveau.
  const planKey = normalizePlan(plan);
  const currentOrder = PLAN_ORDER[planKey] ?? 0;
  const isMaxPlan = currentOrder >= MAX_PLAN_ORDER;
  const upgradeHint = UPGRADE_HINT[currentOrder] || UPGRADE_HINT[0];

  const touchDevice = isMobile || isTablet;
  const utilityBtnSize = touchDevice ? 40 : 28;
  const isCompact = collapsed && !isMobile;

  useEffect(() => {
    if (!isMobile) return;
    if (collapsed) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isMobile, collapsed]);

  const isNavLocked = (item) => {
    if (isAdmin) return false;
    if (!item.locked) return false;
    // Module Événement : indépendant du plan, déverrouillé uniquement par l'accès au module.
    if (item.locked === 'event') return !hasEventAccess;
    return currentOrder < (PLAN_ORDER[item.locked] ?? 99);
  };

  // Les entrées non incluses dans le plan sont retirées du menu (Basic < Pro < Business),
  // sauf « Événement » qui reste visible avec un cadenas pour inviter à acheter le module.
  const visibleNav = USER_NAV.filter(n => !n.hidden && (!isNavLocked(n) || n.locked === 'event'));

  const handleNav = (id, locked) => {
    if (locked) {
      if (id === 'event') {
        onUpgrade?.('event');
        if (isMobile) onToggle();
      }
      return;
    }
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
      <style>{SIDEBAR_CSS}</style>

      {isMobile && !collapsed && (
        <div
          onClick={onToggle}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 19,
          }}
        />
      )}

      <div style={{
        ...sidebarStyle,
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: isMobile && !collapsed ? '8px 0 32px rgba(0,0,0,0.5)' : 'none',
      }}>

        {/* ── En-tête : logo, nom, plan, bouton replier ── */}
        <div style={{
          padding: isCompact ? '16px 0 14px' : '16px',
          display: 'flex', alignItems: 'center', gap: '10px',
          borderBottom: `1px solid ${C.border}`,
          justifyContent: isCompact ? 'center' : 'space-between',
          flexShrink: 0,
          flexDirection: isCompact ? 'column' : 'row',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', minWidth: 0 }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
            }}>
              <img
                src="/Logo_SocialApp.png" alt="SocialApp"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {!isCompact && (
              <div style={{ minWidth: 0 }}>
                <span style={{ color: '#f4f6fb', fontSize: '14px', fontWeight: 600, display: 'block', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                  SocialApp
                </span>
                {limits?.label && (
                  <span style={{ color: C.orange, fontSize: '11px', fontWeight: 500, display: 'block', marginTop: '2px' }}>
                    {limits.label}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            className="ua-util"
            onClick={onToggle}
            aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            style={{
              width: utilityBtnSize, height: utilityBtnSize, borderRadius: '7px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              padding: 0,
            }}
          >
            {isCompact
              ? <ChevronRight size={14} color={C.text} />
              : <ChevronLeft  size={14} color={C.text} />
            }
          </button>
        </div>

        {/* ── Navigation ── */}
        <div
          className="ua-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            padding: '8px',
            minHeight: 0,
          }}
        >
          {USER_GROUPS.map(group => {
            const items = visibleNav.filter(n => n.group === group.id);
            if (!items.length) return null;

            return (
              <div key={group.id} style={{ marginBottom: '2px' }}>
                {isCompact
                  ? <div style={{ height: '1px', background: C.border, margin: '8px 6px' }} />
                  : <p style={{
                      color: C.muted, fontSize: '11px', fontWeight: 500,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '14px 10px 6px', margin: 0,
                    }}>
                      {t(`group_${group.id}`, group.label)}
                    </p>
                }

                {items.map(item => {
                  const locked    = isNavLocked(item);
                  const isActive  = activeSection === item.id;
                  const on        = isActive && !locked;
                  const lockColor = item.locked === 'business' ? '#f7c948' : C.orange;
                  const lockLabel = item.locked === 'business' ? 'BUSINESS' : item.locked === 'event' ? 'MODULE' : 'PRO';
                  const clickable = !locked || item.id === 'event';

                  const buttonEl = (
                    <button
                      key={item.id}
                      className={`ua-item${on ? ' ua-on' : ''}${locked ? ' ua-locked' : ''}`}
                      onClick={() => handleNav(item.id, locked)}
                      aria-current={on ? 'page' : undefined}
                      title={isCompact ? item.label + (locked ? ` (${lockLabel})` : '') : ''}
                      style={{
                        width: '100%',
                        height: touchDevice ? '42px' : '36px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isCompact ? 0 : '10px',
                        padding: isCompact ? 0 : '0 10px',
                        borderRadius: '7px',
                        border: 'none',
                        background: on ? C.indigoSoft : 'transparent',
                        cursor: clickable ? 'pointer' : 'default',
                        opacity: locked ? 0.55 : 1,
                        justifyContent: isCompact ? 'center' : 'flex-start',
                        position: 'relative',
                        marginBottom: '1px',
                        fontFamily: 'inherit',
                        transition: 'background 0.12s',
                      }}
                    >
                      {on && (
                        <span style={{
                          position: 'absolute', left: '-8px', top: '8px', bottom: '8px',
                          width: '3px', background: C.orange, borderRadius: 0,
                        }} />
                      )}

                      <span style={{
                        width: '20px', height: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {locked
                          ? <Lock size={16} color="rgba(255,255,255,0.4)" />
                          : <item.icon size={17} strokeWidth={1.75} color={on ? C.orange : C.icon} />
                        }
                      </span>

                      {!isCompact && (
                        <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                          <span
                            className="ua-label"
                            style={{
                              color: on ? C.textStrong : C.text,
                              fontSize: '13px',
                              fontWeight: on ? 600 : 500,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              transition: 'color 0.12s',
                            }}
                          >
                            {t(item.id, item.label)}
                          </span>
                          {locked && (
                            <span style={{
                              flexShrink: 0,
                              background: lockColor + '20',
                              border: '1px solid ' + lockColor + '55',
                              borderRadius: '5px',
                              padding: '1px 5px',
                              fontSize: '9px',
                              color: lockColor,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}>
                              {lockLabel}
                            </span>
                          )}
                        </span>
                      )}

                      {locked && isCompact && (
                        <span style={{
                          position: 'absolute', top: '6px', right: '10px',
                          width: '8px', height: '8px', borderRadius: '50%',
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

          {/* Rappel d'upgrade : message adapté au plan (BASIC → PRO/BUSINESS,
              PRO → BUSINESS). Jamais affiché pour BUSINESS ni pour un admin. */}
          {!isAdmin && !isMaxPlan && !isCompact && (
            <button
              onClick={() => onUpgrade?.()}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                marginTop: '12px', padding: '9px 10px', borderRadius: '7px',
                background: 'rgba(255,138,31,0.08)', border: '1px solid rgba(255,138,31,0.3)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <Crown size={15} color={C.orange} style={{ flexShrink: 0 }} />
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ color: '#ffb673', fontSize: '12px', fontWeight: 600 }}>
                  {upgradeHint.title}
                </span>
                <span style={{ color: 'rgba(255,182,115,0.7)', fontSize: '11px', fontWeight: 400 }}>
                  {upgradeHint.sub}
                </span>
              </span>
            </button>
          )}
        </div>

        {/* ── Pied de page (déplié) ── */}
        {!isCompact && onSignOut && (
          <div style={{ padding: '12px 16px 14px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            {userEmail && (
              <p style={{
                color: C.muted, fontSize: '11px', margin: '0 0 6px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {userEmail}
              </p>
            )}
            <button
              className="ua-util"
              onClick={onSignOut}
              style={{
                width: 'calc(100% + 20px)', margin: '0 -10px',
                display: 'flex', alignItems: 'center', gap: '10px',
                height: touchDevice ? '42px' : '34px', padding: '0 10px',
                background: 'transparent', border: 'none', borderRadius: '7px',
                color: C.text, fontSize: '13px', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              <LogOut size={17} strokeWidth={1.75} color={C.icon} /> Se déconnecter
            </button>
          </div>
        )}

        {/* ── Pied de page (replié) ── */}
        {isCompact && onSignOut && (
          <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'center', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <button
              className="ua-util"
              onClick={onSignOut}
              aria-label="Se déconnecter"
              title={userEmail ? `Se déconnecter (${userEmail})` : 'Se déconnecter'}
              style={{
                width: utilityBtnSize, height: utilityBtnSize,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none',
                borderRadius: '7px', cursor: 'pointer', padding: 0,
              }}
            >
              <LogOut size={17} strokeWidth={1.75} color={C.icon} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}