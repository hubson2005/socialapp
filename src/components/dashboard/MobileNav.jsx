/**
 * MobileNav.jsx — Hybride Tab Bar + Drawer pour SocialApp
 *
 * CORRECTIONS APPLIQUÉES (historique) :
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
 *  [C11] Fix double-toggle du tiroir via le bouton "Menu" (navRef exclu du
 *        listener "clic extérieur")
 *  [C12] Accent aligné sur UserSidebar.jsx (magenta → orange)
 *  [C13] Fond du tiroir/tab bar aligné sur UserSidebar (dégradé + voile noir)
 *
 * REFONTE VISUELLE :
 *  [C14] Nouvelle charte sombre indigo/violet (maquette fournie) :
 *        - Fond du tiroir et de la tab bar : bleu-nuit quasi opaque au lieu
 *          du dégradé magenta→orange (l'ancien fond restait spécifique à
 *          UserSidebar et n'était plus jugé cohérent avec la nouvelle
 *          identité mobile).
 *        - En-tête restructuré en colonne (avatar au-dessus du nom, plus
 *          large) au lieu d'une ligne avatar+nom. LE BLOC DE RENDU DE LA
 *          PHOTO DE PROFIL (avatar_url ? <img> : initiale) N'A PAS ÉTÉ
 *          MODIFIÉ — seule sa taille/son emplacement dans le layout changent.
 *        - Ajout d'un badge d'offre ("Premium+"…) dérivé de la prop `limits`
 *          existante, et d'une ligne email (prop `profile.email`, optionnelle).
 *        - Ajout d'une rangée de statistiques (prop `stats`, optionnelle —
 *          tableau de { icon, value, label, color }), affichée uniquement
 *          si fournie pour ne rien casser chez les appelants existants.
 *        - Chaque item de navigation affiche désormais un sous-titre
 *          descriptif (label + description), comme sur la maquette.
 *        - "Image de fond" déplacée dans un groupe PERSONNALISATION, sous
 *          forme d'item de liste avec bouton pilule "Modifier" (au lieu de
 *          la zone d'upload permanente) — logique d'upload/suppression
 *          inchangée (toujours [C4]/[C7]/[C8]).
 *        - Nouveau groupe PARAMÈTRES : "Paramètres du compte" (ancien item
 *          Settings, renommé) + "Se déconnecter" (nouvelle prop `onLogout`,
 *          optionnelle, bouton rouge en bas de liste).
 *        - Tab bar flottante réalignée sur la même palette indigo pour la
 *          cohérence visuelle drawer/tab bar.
 *
 *  [C15] Ajustements demandés après retour :
 *        - En-tête repassé en ligne (avatar à côté du nom, comme la
 *          version d'origine) au lieu de la mise en page verticale.
 *        - Tab bar flottante masquée (fade + léger décalage vers le bas,
 *          pointer-events désactivés) tant que le tiroir est ouvert, pour
 *          éviter la superposition visuelle avec le tiroir plein écran.
 *
 *  [C16] Footer nettoyé :
 *        - Suppression du bloc "X liens · Y produits" (retour utilisateur).
 *        - Email et bouton "Se déconnecter" déplacés du header/de la liste
 *          vers ce même footer, en bas du tiroir. Le lien "Changer
 *          d'offre" reste affiché à côté quand applicable.
 *
 *  [C17] Alignement des noms de props sur UserDashboard.jsx : celui-ci
 *        passait déjà `userEmail={user?.email}` et `onSignOut={handleSignOut}`
 *        à <MobileNav /> (mêmes noms que pour <UserSidebar />), alors que
 *        ce composant attendait encore `profile.email` / `onLogout`
 *        (issus d'une itération précédente, jamais branchés côté parent).
 *        Résultat : email et bouton "Se déconnecter" ne s'affichaient
 *        jamais malgré des props bien passées depuis le Dashboard. Fix :
 *        `onLogout` → `onSignOut`, `profile.email` → `userEmail` (prop
 *        dédiée, plus besoin de la faire transiter par `profile`).
 *
 *  [C18] Footer — bouton "Se déconnecter" trop imposant (pleine largeur,
 *        fond quasi transparent) : réduit à sa largeur naturelle, fond
 *        rouge plein (opaque) pour un meilleur contraste, et repositionné
 *        sous la ligne email au lieu d'être aligné à côté d'elle sur une
 *        rangée horizontale forcée en pleine largeur.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  FileText,
  Radio,
  BarChart3,
  Settings,
  CalendarDays,
  CalendarClock,
  Zap,
  Sparkles,
  Link2,
  Menu,
  X,
  ChevronRight,
  Image,
  Loader2,
  Crown,
  Lock,
  Mail,
  LogOut,
} from 'lucide-react';
import { PLAN_ORDER } from './UserSidebar';

// ─── Design tokens ────────────────────────────────────────────
// [C14] Fond bleu-nuit quasi opaque (remplace le dégradé magenta→orange).
const BRAND_BG = 'linear-gradient(180deg, rgba(10,11,26,0.98), rgba(10,11,26,0.98))';

const T = {
  bg:           BRAND_BG,
  panel:        '#12142c',
  border:       'rgba(255,255,255,0.10)',
  borderSubtle: 'rgba(255,255,255,0.08)',
  text:         'white',
  textMuted:    'rgba(255,255,255,0.7)',
  textDim:      'rgba(255,255,255,0.5)',
  textGhost:    'rgba(255,255,255,0.38)',
  accent:       '#6366f1',
  accentEnd:    '#8b5cf6',
  accentLight:  '#a78bfa',
  imageAccent:  '#c4b5fd',
  activeBg:     'rgba(99,102,241,0.16)',
  activeBgSoft: 'rgba(99,102,241,0.22)',
  activeBar:    'linear-gradient(180deg,#818cf8,#a78bfa)',
  red:          '#f87171',
  redBg:        'rgba(239,68,68,0.10)',
  redBorder:    'rgba(239,68,68,0.30)',
  green:        '#22c55e',
  orange:       '#f7b955',
  lockPro:      '#ff8c00',
  lockBusiness: '#f7c948',
  radius:       '13px',
  radiusPill:   '999px',
};

// FIX — [C2] avait renommé la clé 'événement' → 'evenement' *dans ce
// fichier uniquement*. UserSidebar.jsx (source de vérité pour le plan
// utilisateur) garde 'événement' avec accent. On importe PLAN_ORDER depuis
// UserSidebar comme unique source de vérité.
const MAX_PLAN_ORDER = Math.max(...Object.values(PLAN_ORDER));

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
  BOOKING:      'booking',
  FORMS:        'forms',
  ANALYTICS:    'analytics',
  SETTINGS:     'settings',
  MENU:         '__menu__',
};

// Verrouillage par plan, aligné sur USER_NAV (UserSidebar.jsx).
const NAV_LOCK = {
  [NAV_IDS.EVENT]:        'pro',
  [NAV_IDS.ANALYTICS]:    'pro',
  [NAV_IDS.REALTIME]:     'pro',
  [NAV_IDS.CRM]:          'business',
  [NAV_IDS.AUTOMATIONS]:  'business',
  [NAV_IDS.INTEGRATIONS]: 'business',
};

// Icône "Profils/Plateformes" alignée sur UserSidebar (Link2).
const TAB_ITEMS = [
  { id: NAV_IDS.OVERVIEW,  label: 'Dashboard', icon: LayoutDashboard },
  { id: NAV_IDS.CRM,       label: 'Leads',     icon: Users            },
  { id: NAV_IDS.PLATFORMS, label: 'Profils',   icon: Link2            },
  { id: NAV_IDS.REALTIME,  label: 'Live',      icon: Radio, badge: '●' },
  { id: NAV_IDS.MENU,      label: 'Menu',      icon: Menu             },
];

// [C14] Chaque item porte désormais une `description` (sous-titre affiché
// dans le tiroir, comme sur la maquette).
const SIDEBAR_GROUPS = [
  {
    label: 'Navigation',
    items: [
      { id: NAV_IDS.OVERVIEW, label: 'Dashboard', icon: LayoutDashboard, description: "Vue d'ensemble de votre activité" },
    ],
  },
  {
    label: 'Gestion commerciale',
    items: [
      { id: NAV_IDS.CRM,          label: 'Leads / CRM',     icon: Users,    description: 'Gérez vos prospects et clients' },
      { id: NAV_IDS.AUTOMATIONS,  label: 'Automatisations', icon: Zap,      description: 'Workflows et scénarios' },
      { id: NAV_IDS.INTEGRATIONS, label: 'Intégrations',    icon: Sparkles, description: 'Connectez vos outils préférés' },
    ],
  },
  {
    label: 'Contenu',
    items: [
      { id: NAV_IDS.PLATFORMS,   label: 'Plateformes', icon: Link2,        description: 'Vos réseaux et liens connectés' },
      { id: NAV_IDS.EVENT,       label: 'Événement',   icon: CalendarDays, description: 'Créez et gérez vos événements' },
      { id: NAV_IDS.MARKETPLACE, label: 'Marketplace', icon: ShoppingBag,  description: 'Vendez vos produits et services' },
      { id: NAV_IDS.DOCUMENTS,   label: 'Documents',   icon: FileText,     description: 'Vos fichiers et ressources' },
      { id: NAV_IDS.BOOKING,     label: 'Calendrier',  icon: CalendarClock, description: 'Réservations et disponibilités' },
      { id: NAV_IDS.FORMS,       label: 'Formulaires', icon: FileText,     description: 'Collectez des informations' },
    ],
  },
  {
    label: 'Notifications',
    items: [
      { id: NAV_IDS.REALTIME,  label: 'Temps réel', icon: Radio,     badge: 'LIVE', description: "Suivez l'activité en direct" },
      { id: NAV_IDS.ANALYTICS, label: 'Analytics',  icon: BarChart3, description: 'Statistiques et performances' },
    ],
  },
  {
    label: 'Paramètres',
    items: [
      { id: NAV_IDS.SETTINGS, label: 'Paramètres du compte', icon: Settings, description: 'Gérez votre compte et vos préférences' },
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
  stats,        // [C14] optionnel — [{ icon, value, label, color }, ...]
  onBgUpload,   // (file: File) => void
  onBgRemove,   // () => void
  bgImageUrl,
  uploadingBg,
  onUpgrade,
  userEmail,    // [C17] optionnel — email affiché dans le footer (aligné sur la prop envoyée par UserDashboard.jsx, ex-profile.email)
  onSignOut,    // [C17] optionnel — () => void, affiche "Se déconnecter" si fourni (aligné sur la prop envoyée par UserDashboard.jsx, ex-onLogout)
  isAdmin = false,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef  = useRef(null);
  const navRef     = useRef(null); // [C11]
  const fileInputRef = useRef(null); // [C4]

  const currentOrder = PLAN_ORDER[plan] ?? 0;
  const isMaxPlan    = currentOrder >= MAX_PLAN_ORDER;

  const isNavLocked = (id) => {
    if (isAdmin) return false;
    const required = NAV_LOCK[id];
    if (!required) return false;
    return currentOrder < (PLAN_ORDER[required] ?? 99);
  };

  // ── Swipe-to-close ──────────────────────────────────────────
  const touchStartY = useRef(0);
  const touchMoveY  = useRef(null); // [C6]

  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchMoveY.current  = null;
  };
  const onTouchMove = (e) => {
    touchMoveY.current = e.touches[0].clientY;
  };
  const onTouchEnd = () => {
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
      const inDrawer = drawerRef.current && drawerRef.current.contains(e.target);
      const inNav    = navRef.current && navRef.current.contains(e.target);
      if (!inDrawer && !inNav) {
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
    if (isNavLocked(id)) { setDrawerOpen(false); onUpgrade?.(); return; }
    setDrawerOpen(false);
    onNavigate(id);
  };

  const handleDrawerNav = (id) => {
    if (isNavLocked(id)) { onUpgrade?.(); return; }
    setDrawerOpen(false);
    onNavigate(id);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onBgUpload) {
      onBgUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBgRemove = () => {
    if (onBgRemove) onBgRemove();
  };

  const handleLogout = () => {
    if (onSignOut) {
      setDrawerOpen(false);
      onSignOut();
    }
  };

  // ── Avatar initiale ──────────────────────────────────────────
  // [C14] LOGIQUE DE RENDU DE LA PHOTO DE PROFIL INCHANGÉE — seuls la
  // taille et l'emplacement dans le layout ont été adaptés à la maquette.
  const avatarInitial = profile?.display_name?.charAt(0)?.toUpperCase() || '?';

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 39,
          background: 'rgba(0,0,0,0.6)',
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
          maxHeight: '88dvh',
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
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Header — [C14] mise en page verticale, logique avatar inchangée */}
        <div style={{
          padding: '4px 20px 16px',
          borderBottom: `1px solid ${T.borderSubtle}`,
          flexShrink: 0,
          position: 'relative',
        }}>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Fermer le menu"
            style={{
              position: 'absolute', top: '4px', right: '20px',
              width: '40px', height: '40px', borderRadius: '9px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={15} color="rgba(255,255,255,0.7)" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: `linear-gradient(135deg,${T.accent},${T.accentEnd})`,
              boxShadow: `0 0 0 5px rgba(99,102,241,0.10)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 800, color: T.text,
              overflow: 'hidden', flexShrink: 0,
            }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : avatarInitial
              }
            </div>

            <div style={{ minWidth: 0 }}>
              <p style={{ color: T.text, fontSize: '18px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                {profile?.display_name || 'Mon profil'}
              </p>
              {profile?.username && (
                <p style={{ color: T.textDim, fontSize: '13px', margin: '2px 0 0' }}>
                  @{profile.username}
                </p>
              )}
            </div>
          </div>

          {limits && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              marginTop: '10px', padding: '4px 10px',
              borderRadius: T.radiusPill,
              background: (limits.color || T.orange) + '22',
              border: `1px solid ${(limits.color || T.orange)}55`,
            }}>
              <Crown size={11} color={limits.color || T.orange} />
              <span style={{ color: limits.color || T.orange, fontSize: '11px', fontWeight: 700 }}>
                {limits.label}{!isMaxPlan ? '+' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Stats — [C14] optionnel, n'apparaît que si `stats` est fourni */}
        {stats && stats.length > 0 && (
          <div style={{
            margin: '14px 20px 2px',
            padding: '16px 6px',
            borderRadius: '16px',
            border: `1px solid ${T.borderSubtle}`,
            background: 'rgba(255,255,255,0.03)',
            display: 'grid',
            gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
            flexShrink: 0,
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                {s.icon && <s.icon size={18} color={s.color || T.accentLight} />}
                <span style={{ color: T.text, fontSize: '17px', fontWeight: 800, lineHeight: 1 }}>{s.value}</span>
                <span style={{ color: T.textDim, fontSize: '10px' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Scrollable list */}
        <div
          onTouchMove={e => e.stopPropagation()}
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
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
                const locked   = isNavLocked(item.id);
                const lockPlan = NAV_LOCK[item.id];
                const lockColor = lockPlan === 'business' ? T.lockBusiness : T.lockPro;
                const lockLabel = lockPlan === 'business' ? 'BUSINESS' : 'PRO';
                return (
                  <button
                    key={item.id}
                    onClick={() => handleDrawerNav(item.id)}
                    aria-current={isActive && !locked ? 'page' : undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '11px 12px', borderRadius: T.radius, border: 'none',
                      background: isActive && !locked ? T.activeBg : 'transparent',
                      cursor: 'pointer', marginBottom: '2px', position: 'relative',
                      opacity: locked ? 0.55 : 1,
                    }}
                  >
                    {isActive && !locked && (
                      <div style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        width: '3px', height: '30px',
                        background: T.activeBar,
                        borderRadius: '0 3px 3px 0',
                      }} />
                    )}
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      background: isActive && !locked ? T.activeBgSoft : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {locked
                        ? <Lock size={15} color="rgba(255,255,255,0.4)" />
                        : <item.icon size={17} color={isActive ? 'white' : 'rgba(255,255,255,0.6)'} />
                      }
                    </div>
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <p style={{
                        color: isActive && !locked ? T.text : T.textMuted,
                        fontSize: '14px', fontWeight: isActive && !locked ? 700 : 600,
                        margin: 0, lineHeight: 1.25,
                      }}>
                        {item.label}
                      </p>
                      {item.description && (
                        <p style={{ color: T.textDim, fontSize: '11.5px', margin: '2px 0 0', lineHeight: 1.25 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    {locked ? (
                      <span style={{
                        flexShrink: 0, background: lockColor + '20', border: '1px solid ' + lockColor + '55',
                        borderRadius: '6px', padding: '2px 6px', fontSize: '8px', fontWeight: 700,
                        color: lockColor, textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {lockLabel}
                      </span>
                    ) : item.badge ? (
                      <span style={{
                        background: T.green, color: T.text,
                        fontSize: '8px', fontWeight: 700,
                        padding: '2px 6px', borderRadius: '6px', flexShrink: 0,
                      }}>
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Personnalisation — Image de fond, en item de liste avec bouton "Modifier" */}
          {onBgUpload && (
            <div style={{ marginBottom: '4px' }}>
              <p style={{
                color: T.textGhost, fontSize: '9px', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '10px 10px 4px', margin: 0,
              }}>
                Personnalisation
              </p>
              <div style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 12px', borderRadius: T.radius,
              }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {uploadingBg
                    ? <Loader2 size={16} color={T.imageAccent} style={{ animation: 'mobile-nav-spin 1s linear infinite' }} />
                    : <Image size={17} color={T.imageAccent} />
                  }
                </div>
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <p style={{ color: T.textMuted, fontSize: '14px', fontWeight: 600, margin: 0 }}>Image de fond</p>
                  <p style={{ color: T.textDim, fontSize: '11.5px', margin: '2px 0 0' }}>
                    Personnalisez l'apparence de votre espace
                  </p>
                </div>

                {bgImageUrl && (
                  <button
                    onClick={handleBgRemove}
                    disabled={uploadingBg}
                    aria-label="Supprimer l'image de fond"
                    style={{
                      width: '30px', height: '30px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: T.redBg, border: `1px solid ${T.redBorder}`,
                      borderRadius: '9px',
                      cursor: uploadingBg ? 'not-allowed' : 'pointer',
                      opacity: uploadingBg ? 0.5 : 1,
                    }}
                  >
                    <X size={12} color={T.red} />
                  </button>
                )}

                <label style={{
                  flexShrink: 0, position: 'relative',
                  display: 'flex', alignItems: 'center',
                  padding: '7px 14px', borderRadius: T.radiusPill,
                  background: T.activeBg, border: `1px solid rgba(99,102,241,0.35)`,
                  cursor: uploadingBg ? 'not-allowed' : 'pointer',
                  opacity: uploadingBg ? 0.7 : 1,
                }}>
                  <span style={{ color: T.accentLight, fontSize: '11.5px', fontWeight: 700 }}>
                    {bgImageUrl ? 'Modifier' : 'Ajouter'}
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
              </div>
            </div>
          )}
        </div>

        {/* Footer — [C16] email + "Se déconnecter" (déplacés depuis le
            header / la liste) ; le bloc "X liens · Y produits" a été
            retiré à la demande. Le lien "Changer d'offre" est conservé
            s'il y a lieu.
            [C18] Bouton "Se déconnecter" réduit à sa largeur naturelle
            (au lieu de flex:1 pleine largeur), fond rouge plein/opaque
            (au lieu de quasi transparent), et positionné sous l'email
            au lieu d'être aligné à côté sur une rangée. */}
        {(userEmail || onSignOut || (!isMaxPlan && onUpgrade)) && (
          <div style={{
            padding: '12px 20px calc(16px + env(safe-area-inset-bottom))',
            borderTop: `1px solid ${T.borderSubtle}`,
            flexShrink: 0,
          }}>
            {userEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Mail size={13} color={T.textGhost} />
                <span style={{ color: T.textDim, fontSize: '12.5px' }}>{userEmail}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              {onSignOut && (
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: T.radius,
                    background: 'rgba(239,68,68,0.85)', border: '1px solid rgba(239,68,68,0.9)',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={13} color="white" />
                  <span style={{ color: 'white', fontSize: '12.5px', fontWeight: 700 }}>Se déconnecter</span>
                </button>
              )}

              {!isMaxPlan && onUpgrade && (
                <button
                  onClick={onUpgrade}
                  style={{
                    background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
                    color: T.orange, fontSize: '11px', fontWeight: 700,
                  }}
                >
                  <Crown size={11} /> Changer d'offre
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Tab Bar */}
      <nav
        ref={navRef}
        aria-label="Navigation principale"
        style={{
          position: 'fixed',
          bottom: 'calc(16px + env(safe-area-inset-bottom))',
          left: '50%',
          // [C15] Tab bar masquée (translate + fade) quand le tiroir est
          // ouvert, pour ne pas se superposer visuellement au tiroir.
          transform: drawerOpen ? 'translateX(-50%) translateY(24px)' : 'translateX(-50%) translateY(0)',
          opacity: drawerOpen ? 0 : 1,
          pointerEvents: drawerOpen ? 'none' : 'auto',
          transition: 'transform 0.25s ease, opacity 0.25s ease',
          zIndex: 38,
          background: T.bg,
          border: '1px solid rgba(255,255,255,0.14)',
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
          const locked   = !isMenu && isNavLocked(item.id);
          const isActive = isMenu ? drawerOpen : (activeSection === item.id && !locked);
          return (
            <button
              key={item.id}
              onClick={() => handleTab(item.id)}
              aria-label={item.label + (locked ? ' (verrouillé)' : '')}
              aria-current={!isMenu && isActive ? 'page' : undefined}
              aria-expanded={isMenu ? drawerOpen : undefined}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: '6px 10px', borderRadius: T.radiusPill, border: 'none',
                background: isActive
                  ? (isMenu ? 'rgba(239,68,68,0.2)' : T.activeBgSoft)
                  : 'transparent',
                cursor: 'pointer',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                position: 'relative', minWidth: '48px', minHeight: '44px',
                opacity: locked ? 0.55 : 1,
              }}
            >
              {item.badge && !isMenu && !locked && (
                <span style={{
                  position: 'absolute', top: '4px', right: '8px',
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: T.green,
                }} />
              )}
              {locked
                ? <Lock size={18} color="rgba(255,255,255,0.4)" />
                : <item.icon size={20} color={isActive ? (isMenu ? T.red : 'white') : 'rgba(255,255,255,0.55)'} />
              }
              <span style={{
                fontSize: '9px', fontWeight: isActive ? 700 : 500,
                color: isActive ? (isMenu ? T.red : 'white') : 'rgba(255,255,255,0.45)',
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