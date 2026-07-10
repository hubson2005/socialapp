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
 *  [C15] Fond bleu nuit foncé — remplace le dégradé magenta→orange par un
 *        bleu nuit uni (`#0a0e1f`), aligné sur le nouveau fond de
 *        UserSidebar.jsx. Les accents (états actifs, avatar, barre de
 *        sélection, image de fond) sont recalés sur un bleu indigo
 *        (`#3b4ff0`) au lieu du magenta/orange pour rester cohérents avec
 *        ce fond sombre plutôt que de jurer dessus.
 *
 * NOUVEAU :
 *  [C14] Email du compte + bouton "Se déconnecter" déplacés en bas du tiroir
 *        (sous les infos de plan), pour rester cohérent avec UserSidebar.jsx
 *        où le même bloc a été déplacé en bas de la sidebar desktop/tablette.
 *        Props ajoutées : `userEmail` et `onSignOut`. Le bloc ne s'affiche
 *        que si `onSignOut` est fourni (comportement optionnel, pas de crash
 *        si le parent ne le passe pas encore).
 *  [C16] Bloc "Infos plan" (offre / prix / liens & produits / "Changer
 *        d'offre") entièrement supprimé du footer du tiroir, quel que soit
 *        le plan (BASIC, PRO, BUSINESS) — demande explicite : ce bloc ne
 *        doit plus s'afficher du tout dans le MobileNav. La prop `limits`
 *        reste acceptée (pas de breaking change côté parent) mais n'est
 *        simplement plus utilisée pour ce rendu ; `isMaxPlan`/`onUpgrade`
 *        ne sont plus consommés ici, seul `currentOrder` (via `plan`) reste
 *        utile pour le verrouillage de navigation (NAV_LOCK).
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
  Lock,
  LogOut,
} from 'lucide-react';
import { PLAN_ORDER } from './UserSidebar';

// ─── Design tokens ────────────────────────────────────────────
// [C15] Fond bleu nuit uni, aligné sur UserSidebar.jsx (remplace l'ancien
// dégradé de marque magenta→orange + voile noir).
const BRAND_BG = '#0a0e1f';

const T = {
  bg:           BRAND_BG,
  border:       'rgba(255,255,255,0.12)',
  borderSubtle: 'rgba(255,255,255,0.1)',
  text:         'white',
  textMuted:    'rgba(255,255,255,0.7)',
  textDim:      'rgba(255,255,255,0.5)',
  textGhost:    'rgba(255,255,255,0.4)',
  accent:       '#3b4ff0',
  accentEnd:    '#8b5cf6',
  accentLight:  '#8b9bff',
  imageAccent:  '#8b9bff',
  activeBg:     'rgba(59,79,240,0.2)',
  activeBgSoft: 'rgba(59,79,240,0.28)',
  activeBar:    'linear-gradient(180deg,#3b4ff0,#8b5cf6)',
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
  limits, // [C16] toujours accepté (compat parent) mais plus rendu dans le footer
  onBgUpload,   // (file: File) => void  — [C4] le composant extrait le File lui-même
  onBgRemove,   // () => void            — [C7] appelé uniquement si fourni
  bgImageUrl,
  uploadingBg,
  onUpgrade,    // [C5] () => void — remplace le lien href="/"
  isAdmin = false,
  // ✅ [C14] email du compte + déconnexion, alignés sur UserSidebar.jsx
  userEmail,
  onSignOut,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef  = useRef(null);
  const navRef     = useRef(null); // [C11] tab bar flottante, exclue du "clic extérieur"
  const fileInputRef = useRef(null); // [C4] pour reset l'input après sélection

  const currentOrder = PLAN_ORDER[plan] ?? 0;

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

  // [C14] Ferme le tiroir avant de déclencher la déconnexion (évite un
  // tiroir resté ouvert derrière l'écran de login après redirection).
  const handleSignOut = () => {
    setDrawerOpen(false);
    onSignOut?.();
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
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)' }} />
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
              background: `linear-gradient(135deg,${T.accent},${T.accentEnd})`,
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
              width: '40px', height: '40px', borderRadius: '9px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={15} color="rgba(255,255,255,0.7)" />
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
                        width: '3px', height: '22px',
                        background: T.activeBar,
                        borderRadius: '0 3px 3px 0',
                      }} />
                    )}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: isActive && !locked ? T.activeBgSoft : 'rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {locked
                        ? <Lock size={15} color="rgba(255,255,255,0.4)" />
                        : <item.icon size={16} color={isActive ? 'white' : 'rgba(255,255,255,0.6)'} />
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
        </div>

        {/* Footer : Image de fond + Déconnexion (bloc "Infos plan" retiré — [C16]) */}
        <div style={{
          padding: '12px 16px calc(20px + env(safe-area-inset-bottom))',
          borderTop: `1px solid ${T.borderSubtle}`,
          flexShrink: 0,
        }}>

          {/* Bouton image de fond — [C4] onChange extrait le File, [C7] remove guardé */}
          {onBgUpload && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                background: bgImageUrl ? 'rgba(59,79,240,0.16)' : 'rgba(255,255,255,0.07)',
                border: '1px solid ' + (bgImageUrl ? 'rgba(59,79,240,0.4)' : 'rgba(255,255,255,0.1)'),
                borderRadius: '10px', padding: '9px 12px',
                cursor: uploadingBg ? 'not-allowed' : 'pointer',
                position: 'relative', opacity: uploadingBg ? 0.7 : 1,
              }}>
                {uploadingBg
                  ? <Loader2 size={14} color={T.imageAccent} style={{ animation: 'mobile-nav-spin 1s linear infinite' }} />
                  : <Image size={14} color={bgImageUrl ? T.imageAccent : 'rgba(255,255,255,0.45)'} />
                }
                <span style={{
                  color: bgImageUrl ? T.imageAccent : 'rgba(255,255,255,0.45)',
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
                    width: '40px', height: '40px',
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

          {/* ✅ [C14] email du compte + déconnexion, alignés sur
              le bloc équivalent en bas de UserSidebar.jsx (desktop/tablette). */}
          {onSignOut && (
            <div style={{ paddingTop: '10px', borderTop: `1px solid ${T.borderSubtle}` }}>
              {userEmail && (
                <p style={{
                  color: T.textDim, fontSize: '11px', margin: '0 0 8px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {userEmail}
                </p>
              )}
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '11px', background: T.redBg, border: `1px solid ${T.redBorder}`,
                  borderRadius: '10px', color: T.red, fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <LogOut size={14} /> Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Tab Bar */}
      <nav
        ref={navRef}
        aria-label="Navigation principale"
        style={{
          position: 'fixed',
          // FIX iOS — évite que la barre flottante chevauche le home
          // indicator / la barre de gestes Android en bas d'écran.
          bottom: 'calc(16px + env(safe-area-inset-bottom))',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 38,
          background: T.bg,
          border: '1px solid rgba(255,255,255,0.16)',
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

