/**
 * MobileNav.jsx — Hybride Tab Bar + Drawer pour SocialApp
 *
 * CORRECTIONS APPLIQUÉES (sessions précédentes) :
 *  [C1]  Suppression de l'import `useTranslation` inutilisé
 *  [C4]  onBgUpload : extraction de e.target.files[0] dans le composant + reset input
 *  [C5]  Lien "Changer d'offre" remplacé par prop callback onUpgrade
 *  [C6]  Swipe-to-close : reset touchMoveY à null, vérification explicite avant calcul
 *  [C7]  Guard sur onBgRemove avant appel (évite crash si prop absente)
 *  [C8]  Bouton remove bg désactivé pendant uploadingBg
 *  [C9]  @keyframes spin sorti du JSX et injecté une seule fois via useEffect
 *  [C14] iOS/Android : tab bar flottante et footer du drawer ignoraient le
 *        home indicator / la barre de gestes → env(safe-area-inset-bottom) ajouté.
 *  [C15] iOS Safari : drawer en 82vh (bug barre d'adresse rétractable) → 82dvh.
 *
 * RESYNCHRONISATION AVEC UserSidebar.jsx (cette session) :
 *  Ce fichier n'utilise plus de config partagée séparée : les items, labels,
 *  icônes, groupes et niveaux de verrouillage sont recopiés à l'identique
 *  depuis USER_NAV / PLAN_ORDER de UserSidebar.jsx. Si tu ajoutes/modifies un
 *  item côté desktop, reporte le changement ici aussi (même id, même label,
 *  même icône, même `locked`).
 *
 *  [C11] Item "WhatsApp CRM" manquant → ajouté (label exact "WhatsApp CRM")
 *  [C12] Verrouillage par plan absent → ajouté (Lock + badge, nav bloquée)
 *  [C13] Icônes désynchronisées vs desktop → réalignées :
 *        Analytics (BarChart3→BarChart2), Temps réel (Radio→Activity),
 *        Intégrations (Sparkles→GitBranch), Plateformes (Layers→Link2)
 *  [C17] Label "CRM / Leads" corrigé (était "Leads / CRM", ordre inversé
 *        par rapport au desktop)
 *  [C18] "Formulaires" (forms) manquant du groupe Contenu → ajouté
 *  [C19] Clé de plan 'événement' (accentuée) alignée sur PLAN_ORDER du
 *        desktop — ce fichier ne redéfinit plus sa propre clé 'evenement'
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Link2,
  CalendarDays,
  ShoppingBag,
  FileText,
  BarChart2,
  Activity,
  Users,
  Zap,
  GitBranch,
  MessageCircle,
  Settings,
  Menu,
  X,
  ChevronRight,
  Image,
  Loader2,
  Crown,
  Lock,
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
  business:     '#f7c948',
  pro:          '#ff8c00',
  radius:       '13px',
  radiusPill:   '999px',
};

// [C19] Identique à UserSidebar.jsx — clé accentuée 'événement'
const PLAN_ORDER = { basic: 0, 'événement': 0, pro: 1, business: 2 };
const MAX_PLAN_ORDER = Math.max(...Object.values(PLAN_ORDER));

// ─── Items du drawer — copie 1:1 des entrées pertinentes de USER_NAV ──────
// (les items "hidden" côté desktop — meta, boost, boost-analytics,
// promotions — restent exclus ici aussi, en test admin uniquement)
const SIDEBAR_GROUPS = [
  {
    label: 'Dashboard',
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, locked: null },
    ],
  },
  {
    label: 'CRM',
    items: [
      { id: 'crm',          label: 'CRM / Leads',     icon: Users,         locked: 'business' }, // [C17]
      { id: 'whatsapp-crm', label: 'WhatsApp CRM',    icon: MessageCircle, locked: 'business' }, // [C11]
      { id: 'automations',  label: 'Automatisations', icon: Zap,           locked: 'business' },
      { id: 'integrations', label: 'Intégrations',    icon: GitBranch,     locked: 'business' }, // [C13]
    ],
  },
  {
    label: 'Contenu',
    items: [
      { id: 'platforms',   label: 'Plateformes', icon: Link2,        locked: null  }, // [C13]
      { id: 'event',       label: 'Événement',   icon: CalendarDays, locked: 'pro' },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag,  locked: null  },
      { id: 'documents',   label: 'Documents',   icon: FileText,     locked: null  },
      { id: 'forms',       label: 'Formulaires', icon: FileText,     locked: null  }, // [C18]
    ],
  },
  {
    label: 'Notifications',
    items: [
      { id: 'realtime',  label: 'Temps réel', icon: Activity,  locked: 'pro' }, // [C13]
      { id: 'analytics', label: 'Analytics',  icon: BarChart2, locked: 'pro' }, // [C13]
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'settings', label: 'Paramètres', icon: Settings, locked: null },
    ],
  },
];

// ─── Tab bar — mêmes ids/icônes que le drawer, labels raccourcis pour l'espace ──
const TAB_ITEMS = [
  { id: 'overview',  label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crm',       label: 'Leads',     icon: Users            }, // [C13] cohérent avec drawer
  { id: 'platforms', label: 'Profils',   icon: Link2            }, // [C13] Layers→Link2
  { id: 'realtime',  label: 'Live',      icon: Activity, badge: '●' }, // [C13] Radio→Activity
  { id: '__menu__',  label: 'Menu',      icon: Menu             },
];

// ─── MobileNav ───────────────────────────────────────────────
// NOTE TABLETTE : ce composant est conçu pour les écrans téléphone
// uniquement (tab bar flottante + bottom sheet). Le breakpoint-switcher
// parent doit le monter uniquement pour isMobile=true — UserSidebar gère
// déjà la tablette via sa prop isTablet (largeurs 72/240px).
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

  // [C12] Même logique que UserSidebar.isNavLocked
  const isNavLocked = (item) => {
    if (!item.locked) return false;
    return currentOrder < (PLAN_ORDER[item.locked] ?? 99);
  };

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
    if (id === '__menu__') { setDrawerOpen(v => !v); return; }
    setDrawerOpen(false);
    onNavigate(id);
  };

  // [C12] Bloque la navigation si l'item est verrouillé pour le plan courant
  const handleDrawerNav = (id, locked) => {
    if (locked) return;
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
          maxHeight: '82dvh', // [C15] dvh — évite le bug Safari iOS (barre d'adresse rétractable)
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
          background: T.bg,
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          borderRadius: '24px 24px 0 0',
          border: `1px solid ${T.border}`, borderBottom: 'none',
          boxShadow: '0 -12px 60px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          paddingBottom: 'env(safe-area-inset-bottom)', // [C14]
          boxSizing: 'border-box',
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
                const locked   = isNavLocked(item);
                const lockColor = item.locked === 'business' ? T.business : T.pro;
                const lockLabel = item.locked === 'business' ? 'BUSINESS' : 'PRO';

                return (
                  <button
                    key={item.id}
                    onClick={() => handleDrawerNav(item.id, locked)}
                    aria-current={isActive && !locked ? 'page' : undefined}
                    aria-disabled={locked || undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '11px 12px', borderRadius: T.radius, border: 'none',
                      background: isActive && !locked ? T.accentBg : 'transparent',
                      cursor: locked ? 'default' : 'pointer',
                      opacity: locked ? 0.45 : 1,
                      marginBottom: '2px', position: 'relative',
                    }}
                  >
                    {isActive && !locked && (
                      <div style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        width: '3px', height: '22px',
                        background: `linear-gradient(180deg,${T.accent},#8b5cf6)`,
                        borderRadius: '0 3px 3px 0',
                      }} />
                    )}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: isActive && !locked ? T.accentBgHover : 'rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {locked
                        ? <Lock size={15} color="rgba(255,255,255,0.35)" />
                        : <item.icon size={16} color={isActive ? T.accentLight : 'rgba(255,255,255,0.5)'} />
                      }
                    </div>
                    <span style={{
                      color: isActive && !locked ? T.text : T.textMuted,
                      fontSize: '13.5px', fontWeight: isActive && !locked ? 700 : 500,
                      flex: 1, textAlign: 'left',
                    }}>
                      {item.label}
                    </span>
                    {locked ? (
                      <span style={{
                        flexShrink: 0,
                        background: lockColor + '18',
                        border: '1px solid ' + lockColor + '44',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        fontSize: '8px',
                        color: lockColor,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>
                        {lockLabel}
                      </span>
                    ) : item.id === 'realtime' ? (
                      <span style={{
                        background: T.green, color: T.text,
                        fontSize: '8px', fontWeight: 700,
                        padding: '2px 6px', borderRadius: '6px', flexShrink: 0,
                      }}>
                        LIVE
                      </span>
                    ) : (
                      <ChevronRight size={13} color="rgba(255,255,255,0.2)" />
                    )}
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
          position: 'fixed',
          bottom: 'calc(16px + env(safe-area-inset-bottom))', // [C14]
          left: '50%', transform: 'translateX(-50%)',
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
          const isMenu   = item.id === '__menu__';
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