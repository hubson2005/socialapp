/**
 * MobileNav.jsx — Hybride Tab Bar + Drawer pour SocialApp
 *
 * CORRECTIONS APPLIQUÉES :
 *  [C1]  Suppression de l'import `useTranslation` inutilisé
 *  [C2]  Clé 'événement' normalisée en 'evenement' (pas d'accent dans les clés)
 *  [C3]  MAX_PLAN_ORDER déclaré en constante explicite (évite Math.max sur objet vide)
 *  [C4]  onBgUpload : extraction de e.target.files[0] dans le composant + reset input
 *  [C5]  Lien "Changer d'offre" remplacé par prop callback onUpgrade
 *  [C6]  Swipe-to-close : reset touchMoveY à null, vérification explicite avant calcul
 *  [C7]  Guard sur onBgRemove avant appel (évite crash si prop absente)
 *  [C8]  Bouton remove bg désactivé pendant uploadingBg
 *  [C9]  @keyframes spin sorti du JSX et injecté une seule fois via useEffect
 *  [C10] Tokens de style extraits en objet TOKENS pour réduire la duplication
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

// ─── Design tokens ────────────────────────────────────────────
const T = {
  bg:           'rgba(8,5,22,0.98)',
  border:       'rgba(255,255,255,0.09)',
  borderSubtle: 'rgba(255,255,255,0.07)',
  text:         'white',
  textMuted:    'rgba(255,255,255,0.65)',
  textDim:      'rgba(255,255,255,0.35)',
  textGhost:    'rgba(255,255,255,0.22)',
  accent:       '#6366f1',
  accentLight:  '#a78bfa',
  accentBg:     'rgba(99,102,241,0.16)',
  accentBgHover:'rgba(99,102,241,0.28)',
  red:          '#f87171',
  redBg:        'rgba(239,68,68,0.1)',
  redBorder:    'rgba(239,68,68,0.3)',
  green:        '#22c55e',
  orange:       '#ff8c00',
  radius:       '13px',
  radiusPill:   '999px',
};

// ─── [C2] Clés de plan sans accent (normalisées) ──────────────
//  Côté parent, passer plan="evenement" au lieu de "événement"
const PLAN_ORDER = { basic: 0, evenement: 0, pro: 1, business: 2 };

// ─── [C3] Constante explicite plutôt que Math.max dynamique ───
const MAX_PLAN_ORDER = 2;

// ─── Config navigation ────────────────────────────────────────
const NAV_IDS = {
  OVERVIEW:     'overview',
  CRM:          'crm',
  PLATFORMS:    'platforms',
  REALTIME:     'realtime',
  AUTOMATIONS:  'automations',
  INTEGRATIONS: 'integrations',
  EVENT:        'event',
  MARKETPLACE:  'marketplace',
  DOCUMENTS:    'documents',
  ANALYTICS:    'analytics',
  SETTINGS:     'settings',
  MENU:         '__menu__',
};

const TAB_ITEMS = [
  { id: NAV_IDS.OVERVIEW,  label: 'Dashboard', icon: LayoutDashboard },
  { id: NAV_IDS.CRM,       label: 'Leads',     icon: Users            },
  { id: NAV_IDS.PLATFORMS, label: 'Profils',   icon: Layers           },
  { id: NAV_IDS.REALTIME,  label: 'Live',      icon: Radio, badge: '●' },
  { id: NAV_IDS.MENU,      label: 'Menu',      icon: Menu             },
];

const SIDEBAR_GROUPS = [
  {
    label: 'Dashboard',
    items: [
      { id: NAV_IDS.OVERVIEW, label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'CRM',
    items: [
      { id: NAV_IDS.CRM,          label: 'Leads / CRM',     icon: Users    },
      { id: NAV_IDS.AUTOMATIONS,  label: 'Automatisations', icon: Zap      },
      { id: NAV_IDS.INTEGRATIONS, label: 'Intégrations',    icon: Sparkles },
    ],
  },
  {
    label: 'Contenu',
    items: [
      { id: NAV_IDS.PLATFORMS,   label: 'Plateformes', icon: Link2        },
      { id: NAV_IDS.EVENT,       label: 'Événement',   icon: CalendarDays },
      { id: NAV_IDS.MARKETPLACE, label: 'Marketplace', icon: ShoppingBag  },
      { id: NAV_IDS.DOCUMENTS,   label: 'Documents',   icon: FileText     },
    ],
  },
  {
    label: 'Notifications',
    items: [
      { id: NAV_IDS.REALTIME,  label: 'Temps réel', icon: Radio,    badge: 'LIVE' },
      { id: NAV_IDS.ANALYTICS, label: 'Analytics',  icon: BarChart3               },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: NAV_IDS.SETTINGS, label: 'Paramètres', icon: Settings },
    ],
  },
];

// ─── MobileNav ───────────────────────────────────────────────
export default function MobileNav({
  activeSection,
  onNavigate,
  profile,
  plan,
  limits,
  onBgUpload,   // (file: File) => void  — [C4] le composant extrait le File lui-même
  onBgRemove,   // () => void            — [C7] appelé uniquement si fourni
  bgImageUrl,
  uploadingBg,
  onUpgrade,    // [C5] () => void — remplace le lien href="/"
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef  = useRef(null);
  const fileInputRef = useRef(null); // [C4] pour reset l'input après sélection

  const currentOrder = PLAN_ORDER[plan] ?? 0;
  const isMaxPlan    = currentOrder >= MAX_PLAN_ORDER;

  // ── Swipe-to-close ──────────────────────────────────────────
  const touchStartY = useRef(0);
  const touchMoveY  = useRef(null); // [C6] null = pas encore de move enregistré

  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchMoveY.current  = null; // reset explicite à chaque nouveau touch
  };
  const onTouchMove = (e) => {
    touchMoveY.current = e.touches[0].clientY;
  };
  const onTouchEnd = () => {
    // [C6] On ferme uniquement si un mouvement réel a été enregistré
    if (touchMoveY.current !== null && touchMoveY.current - touchStartY.current > 120) {
      setDrawerOpen(false);
    }
    touchStartY.current = 0;
    touchMoveY.current  = null;
  };

  // ── Fermeture au clic extérieur ──────────────────────────────
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('touchstart', handler);
    document.addEventListener('mousedown',  handler);
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('mousedown',  handler);
    };
  }, [drawerOpen]);

  // ── Verrouillage du scroll body ──────────────────────────────
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // ── [C9] Injection unique du keyframe spin ───────────────────
  useEffect(() => {
    const styleId = 'mobile-nav-spin-keyframe';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = '@keyframes mobile-nav-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────────
  const handleTab = (id) => {
    if (id === NAV_IDS.MENU) { setDrawerOpen(v => !v); return; }
    setDrawerOpen(false);
    onNavigate(id);
  };

  const handleDrawerNav = (id) => {
    setDrawerOpen(false);
    onNavigate(id);
  };

  // [C4] Extraction du File depuis l'event + reset de l'input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onBgUpload) {
      onBgUpload(file);
    }
    // Reset pour permettre de re-sélectionner le même fichier
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // [C7] Guard sur onBgRemove
  const handleBgRemove = () => {
    if (onBgRemove) onBgRemove();
  };

  // ── Avatar initiale ──────────────────────────────────────────
  const avatarInitial = profile?.display_name?.charAt(0)?.toUpperCase() || '?';

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 39,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          maxHeight: '82vh',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
          background: T.bg,
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          borderRadius: '24px 24px 0 0',
          border: `1px solid ${T.border}`, borderBottom: 'none',
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
          borderBottom: `1px solid ${T.borderSubtle}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 800, color: T.text,
              overflow: 'hidden', flexShrink: 0,
            }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : avatarInitial
              }
            </div>
            <div>
              <p style={{ color: T.text, fontSize: '13px', fontWeight: 700, margin: 0, lineHeight: 1 }}>
                {profile?.display_name || 'Mon profil'}
              </p>
              {profile?.username && (
                <p style={{ color: T.textDim, fontSize: '10px', margin: '3px 0 0' }}>
                  @{profile.username}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Fermer le menu"
            style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={15} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Scrollable list */}
        <div
          onTouchMove={e => e.stopPropagation()}
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0, // FIX flexbox : oblige le footer à rester visible
            padding: '8px 12px 8px',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {SIDEBAR_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: '4px' }}>
              <p style={{
                color: T.textGhost, fontSize: '9px', fontWeight: 700,
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
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '11px 12px', borderRadius: T.radius, border: 'none',
                      background: isActive ? T.accentBg : 'transparent',
                      cursor: 'pointer', marginBottom: '2px', position: 'relative',
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        width: '3px', height: '22px',
                        background: `linear-gradient(180deg,${T.accent},#8b5cf6)`,
                        borderRadius: '0 3px 3px 0',
                      }} />
                    )}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: isActive ? T.accentBgHover : 'rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <item.icon size={16} color={isActive ? T.accentLight : 'rgba(255,255,255,0.5)'} />
                    </div>
                    <span style={{
                      color: isActive ? T.text : T.textMuted,
                      fontSize: '13.5px', fontWeight: isActive ? 700 : 500,
                      flex: 1, textAlign: 'left',
                    }}>
                      {item.label}
                    </span>
                    {item.badge
                      ? (
                        <span style={{
                          background: T.green, color: T.text,
                          fontSize: '8px', fontWeight: 700,
                          padding: '2px 6px', borderRadius: '6px', flexShrink: 0,
                        }}>
                          {item.badge}
                        </span>
                      )
                      : <ChevronRight size={13} color="rgba(255,255,255,0.2)" />
                    }
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer : Image de fond + Infos plan */}
        <div style={{
          padding: '12px 16px 20px',
          borderTop: `1px solid ${T.borderSubtle}`,
          flexShrink: 0,
        }}>

          {/* Bouton image de fond — [C4] onChange extrait le File, [C7] remove guardé */}
          {onBgUpload && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                background: bgImageUrl ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                border: '1px solid ' + (bgImageUrl ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'),
                borderRadius: '10px', padding: '9px 12px',
                cursor: uploadingBg ? 'not-allowed' : 'pointer',
                position: 'relative', opacity: uploadingBg ? 0.7 : 1,
              }}>
                {uploadingBg
                  ? <Loader2 size={14} color={T.accentLight} style={{ animation: 'mobile-nav-spin 1s linear infinite' }} />
                  : <Image size={14} color={bgImageUrl ? T.accentLight : 'rgba(255,255,255,0.4)'} />
                }
                <span style={{
                  color: bgImageUrl ? T.accentLight : 'rgba(255,255,255,0.4)',
                  fontSize: '12px', fontWeight: 600,
                }}>
                  {bgImageUrl ? 'Changer le fond' : 'Image de fond'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'inherit', width: '100%', height: '100%' }}
                  onChange={handleFileChange}
                  disabled={uploadingBg}
                />
              </label>

              {/* [C7] Guard onBgRemove · [C8] disabled pendant upload */}
              {bgImageUrl && (
                <button
                  onClick={handleBgRemove}
                  disabled={uploadingBg}
                  aria-label="Supprimer l'image de fond"
                  style={{
                    width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: T.redBg, border: `1px solid ${T.redBorder}`,
                    borderRadius: '10px',
                    cursor: uploadingBg ? 'not-allowed' : 'pointer',
                    opacity: uploadingBg ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                >
                  <X size={13} color={T.red} />
                </button>
              )}
            </div>
          )}

          {/* Infos plan */}
          {limits && (
            <div style={{
              background: limits.color + '18',
              border: `1px solid ${limits.color}44`,
              borderRadius: '12px', padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px' }}>{limits.emoji}</span>
                <span style={{ color: limits.color, fontSize: '12px', fontWeight: 700 }}>
                  Offre {limits.label}
                </span>
                {limits.price && (
                  <span style={{ color: T.textDim, fontSize: '10px', marginLeft: 'auto' }}>
                    {limits.price}
                  </span>
                )}
              </div>
              <p style={{ color: T.textDim, fontSize: '11px', margin: isMaxPlan ? 0 : '0 0 6px' }}>
                {limits.maxLinks} liens · {limits.maxMarketplace === Infinity ? '∞' : limits.maxMarketplace} produits
              </p>
              {/* [C5] onUpgrade callback au lieu de href="/" */}
              {!isMaxPlan && onUpgrade && (
                <button
                  onClick={onUpgrade}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px',
                    color: T.orange, fontSize: '11px', fontWeight: 600,
                  }}
                >
                  <Crown size={11} /> Changer d'offre
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Tab Bar */}
      <nav
        aria-label="Navigation principale"
        style={{
          position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 38,
          background: 'rgba(8,5,22,0.96)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: T.radiusPill,
          padding: '8px 10px',
          display: 'flex', alignItems: 'center', gap: '4px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          minWidth: '280px', maxWidth: 'calc(100vw - 32px)',
          justifyContent: 'space-around',
        }}
      >
        {TAB_ITEMS.map(item => {
          const isMenu   = item.id === NAV_IDS.MENU;
          const isActive = isMenu ? drawerOpen : activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTab(item.id)}
              aria-label={item.label}
              aria-current={!isMenu && isActive ? 'page' : undefined}
              aria-expanded={isMenu ? drawerOpen : undefined}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: '6px 10px', borderRadius: T.radiusPill, border: 'none',
                background: isActive
                  ? (isMenu ? 'rgba(239,68,68,0.18)' : 'rgba(99,102,241,0.22)')
                  : 'transparent',
                cursor: 'pointer',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                position: 'relative', minWidth: '48px',
              }}
            >
              {item.badge && !isMenu && (
                <span style={{
                  position: 'absolute', top: '4px', right: '8px',
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: T.green,
                }} />
              )}
              <item.icon
                size={20}
                color={isActive ? (isMenu ? T.red : T.accentLight) : 'rgba(255,255,255,0.42)'}
              />
              <span style={{
                fontSize: '9px', fontWeight: isActive ? 700 : 500,
                color: isActive ? (isMenu ? T.red : T.accentLight) : 'rgba(255,255,255,0.3)',
                lineHeight: 1,
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}