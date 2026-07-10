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
 *
 * NOUVELLE CORRECTION :
 *  [C11] Bug : le tiroir se refermait puis se rouvrait instantanément quand on
 *        tapait sur le bouton "Menu" de la tab bar flottante pour le fermer.
 *        Cause : le listener "clic extérieur" ne vérifiait que `drawerRef`.
 *        Comme la tab bar flottante (<nav>) est physiquement en dehors du
 *        tiroir, un tap sur "Menu" déclenchait d'abord `mousedown` → le
 *        listener global voyait un clic hors du tiroir → setDrawerOpen(false)
 *        — PUIS `click` se déclenchait juste après → handleTab('__menu__')
 *        → setDrawerOpen(v => !v) repartant de `false` (déjà appliqué) →
 *        repassait à `true`. Le tiroir ne pouvait donc jamais se fermer via
 *        son propre bouton toggle une fois ouvert (seuls le swipe, le bouton
 *        X ou un tap sur le fond fonctionnaient). Fix : ajout de `navRef` sur
 *        la tab bar flottante, incluse dans la vérification "clic extérieur"
 *        pour qu'un tap sur n'importe quel bouton de la tab bar (Menu compris)
 *        ne soit plus jamais traité comme "extérieur au composant".
 *
 * RAPPEL IMPORTANT (bug côté composant parent, pas dans ce fichier) :
 *  Le Dashboard ADMIN (Dashboard.jsx) rendait <MobileNav .../> sans jamais
 *  passer la prop `isAdmin`. Comme `isAdmin` vaut `false` par défaut et que
 *  `plan` n'était pas passé non plus (`currentOrder` retombe à 0, le rang le
 *  plus bas), TOUTES les sections listées dans NAV_LOCK (CRM, Automatisations,
 *  Intégrations, Analytics, Live, Événement) se retrouvaient verrouillées sur
 *  mobile pour le compte admin lui-même, alors que sur desktop le Dashboard
 *  admin utilise le composant Sidebar (sans aucune logique de plan) et affiche
 *  donc tout normalement. Fix à appliquer dans Dashboard.jsx :
 *
 *    <MobileNav
 *      activeSection={activeSection}
 *      onNavigate={setActiveSection}
 *      profile={localProfile}
 *      isAdmin={isAdmin}
 *    />
 *
 * PALETTE :
 *  [C12] Accent aligné sur UserSidebar.jsx (magenta → orange, dérivé du logo
 *        SocialApp).
 *  [C13] Fond du tiroir ET de la tab bar flottante alignés sur UserSidebar :
 *        dégradé de marque magenta→orange recouvert d'un voile noir semi-
 *        opaque (scrim) pour garantir la lisibilité du texte, avec des états
 *        actifs en surimpression blanche plutôt qu'en teinte magenta (qui se
 *        fondait dans un fond déjà coloré). Les boutons utilitaires (image de
 *        fond, suppression) reprennent exactement les mêmes couleurs que le
 *        footer de UserSidebar.jsx pour une cohérence totale desktop/mobile.
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
  Zap,
  Sparkles,
  Link2,
  Menu,
  Lock,
} from 'lucide-react';
import { PLAN_ORDER } from './UserSidebar';
import DrawerSection from "./mobile-nav/DrawerSection";
import DrawerHeader from "./mobile-nav/DrawerHeader";
import DrawerFooter from "./mobile-nav/DrawerFooter";
import FloatingTabBar from "./mobile-nav/FloatingTabBar";

// ─── Design tokens ────────────────────────────────────────────
// [C13] Même fond que UserSidebar.jsx : dégradé de marque + voile noir.
const BRAND_BG = 'linear-gradient(180deg, rgba(8,4,14,0.72), rgba(8,4,14,0.72)), linear-gradient(180deg,#db2777,#f97316)';

const T = {
  bg:           BRAND_BG,
  border:       'rgba(255,255,255,0.12)',
  borderSubtle: 'rgba(255,255,255,0.1)',
  text:         'white',
  textMuted:    'rgba(255,255,255,0.7)',
  textDim:      'rgba(255,255,255,0.5)',
  textGhost:    'rgba(255,255,255,0.4)',
  accent:       '#db2777',
  accentEnd:    '#f97316',
  accentLight:  '#f472b6',
  imageAccent:  '#f9a8d4',
  activeBg:     'rgba(255,255,255,0.14)',
  activeBgSoft: 'rgba(255,255,255,0.16)',
  activeBar:    'linear-gradient(180deg,#f472b6,#fdba74)',
  red:          '#f87171',
  redBg:        'rgba(239,68,68,0.12)',
  redBorder:    'rgba(239,68,68,0.35)',
  green:        '#22c55e',
  orange:       '#ff8c00',
  lockPro:      '#ff8c00',
  lockBusiness: '#f7c948',
  radius:       '13px',
  radiusPill:   '999px',
};

// FIX — [C2] avait renommé la clé 'événement' → 'evenement' *dans ce
// fichier uniquement*. UserSidebar.jsx (source de vérité pour le plan
// utilisateur et les mêmes libellés PRO/BUSINESS) garde 'événement' avec
// accent, exactement la clé utilisée par PLAN_LIMITS côté UserDashboard.
// Deux définitions divergentes du même mapping plan → rang = un
// utilisateur en offre "Événement" se retrouvait mal classé selon qu'il
// regardait le dashboard desktop ou le tiroir mobile. On importe
// désormais PLAN_ORDER depuis UserSidebar comme unique source de vérité.
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
  FORMS:        'forms',        // ← ajouté
  ANALYTICS:    'analytics',
  SETTINGS:     'settings',
  MENU:         '__menu__',
};

// FIX — verrouillage par plan aligné sur USER_NAV (UserSidebar.jsx) :
// avant, ces mêmes sections étaient verrouillées sur desktop (icône
// cadenas, navigation bloquée) mais librement accessibles depuis le
// tiroir mobile — un utilisateur BASIC pouvait ouvrir CRM, Automatisations,
// Intégrations, Analytics ou le Live simplement en passant par mobile.
const NAV_LOCK = {
  [NAV_IDS.EVENT]:        'pro',
  [NAV_IDS.ANALYTICS]:    'pro',
  [NAV_IDS.REALTIME]:     'pro',
  [NAV_IDS.CRM]:          'business',
  [NAV_IDS.AUTOMATIONS]:  'business',
  [NAV_IDS.INTEGRATIONS]: 'business',
};

// FIX — l'icône "Profils/Plateformes" différait entre la tab bar (Layers)
// et le tiroir (Link2) pour le même identifiant `platforms`, cassant la
// reconnaissance visuelle d'un endroit à l'autre. Alignée sur l'icône
// utilisée par UserSidebar (Link2).
const TAB_ITEMS = [
  { id: NAV_IDS.OVERVIEW,  label: 'Dashboard', icon: LayoutDashboard },
  { id: NAV_IDS.CRM,       label: 'Leads',     icon: Users            },
  { id: NAV_IDS.PLATFORMS, label: 'Profils',   icon: Link2            },
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
      { id: NAV_IDS.FORMS,       label: 'Formulaires',  icon: FileText     },
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
  onBgUpload,
  onBgRemove,
  bgImageUrl,
  uploadingBg,
  onUpgrade,
  isAdmin = false,

  userEmail,
  onSignOut,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef  = useRef(null);
  const navRef     = useRef(null); // [C11] tab bar flottante, exclue du "clic extérieur"
  const fileInputRef = useRef(null); // [C4] pour reset l'input après sélection

  const currentOrder = PLAN_ORDER[plan] ?? 0;
  const isMaxPlan    = currentOrder >= MAX_PLAN_ORDER;

  const isNavLocked = (id) => {
    if (isAdmin) return false; // FIX — un compte admin n'est jamais restreint par le plan
    const required = NAV_LOCK[id];
    if (!required) return false;
    return currentOrder < (PLAN_ORDER[required] ?? 99);
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
  // [C11] On exclut désormais À LA FOIS drawerRef ET navRef (la tab bar
  // flottante). Sans ça, un tap sur le bouton "Menu" pour refermer le
  // tiroir déclenchait d'abord ce handler via `mousedown` (le bouton
  // Menu est hors de drawerRef → fermeture), PUIS le `click` du bouton
  // lui-même via handleTab rouvrait aussitôt le tiroir (toggle sur un
  // état déjà passé à false) : le tiroir ne pouvait jamais se fermer par
  // ce biais. Idem potentiellement pour les autres boutons de la tab bar.
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
const handleSignOut = () => {
  setDrawerOpen(false);

  setTimeout(() => {
    onSignOut?.();
  }, 180);
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
          // dvh plutôt que vh : évite qu'iOS Safari recalcule la hauteur
          // pendant l'apparition/disparition de la barre d'adresse.
          maxHeight: '82dvh',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
          background: T.bg,
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          borderRadius: '24px 24px 0 0',
          border: `1px solid ${T.border}`, borderBottom: 'none',
          boxShadow: '0 -12px 60px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          // Le sheet lui-même touche le bas de l'écran : on pousse tout
          // son contenu interne au-dessus du home indicator / de la barre
          // de gestes Android via le padding du footer plutôt qu'ici, pour
          // ne pas décaler tout le fond du panneau.
        }}
      >
      <DrawerHeader
    profile={profile}
    avatarInitial={avatarInitial}
    userEmail={userEmail}
    plan={plan}
    currentOrder={currentOrder}
    maxPlanOrder={MAX_PLAN_ORDER}
    onClose={() => setDrawerOpen(false)}
/>
        {/* Scrollable list */}
<div
  onTouchMove={(e) => e.stopPropagation()}
  style={{
    flex: 1,
    overflowY: "auto",
    minHeight: 0,
    padding: "8px 12px 8px",
    overscrollBehavior: "contain",
    WebkitOverflowScrolling: "touch",
  }}
>
  {SIDEBAR_GROUPS.map((group) => (
    <DrawerSection
      key={group.label}
      group={group}
      activeSection={activeSection}
      isNavLocked={isNavLocked}
      handleDrawerNav={handleDrawerNav}
    />
  ))}
</div>

<DrawerFooter
  onBgUpload={onBgUpload}
  onBgRemove={handleBgRemove}
  bgImageUrl={bgImageUrl}
  uploadingBg={uploadingBg}
  fileInputRef={fileInputRef}
  handleFileChange={handleFileChange}
  handleSignOut={handleSignOut}
  userEmail={userEmail}
  onSignOut={onSignOut}
/>

</div>

<FloatingTabBar
  navRef={navRef}
  TAB_ITEMS={TAB_ITEMS}
  NAV_IDS={NAV_IDS}
  activeSection={activeSection}
  drawerOpen={drawerOpen}
  handleTab={handleTab}
  isNavLocked={isNavLocked}
/>

</>
);
}