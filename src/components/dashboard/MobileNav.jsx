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
 *  [C14] Nouvelle charte sombre : fond bleu-nuit, en-tête, badge d'offre,
 *        rangée de stats optionnelle, sous-titres descriptifs, groupe
 *        PERSONNALISATION (image de fond), groupe PARAMÈTRES.
 *  [C15] En-tête en ligne ; tab bar masquée tant que le tiroir est ouvert.
 *  [C16] Footer nettoyé : email + "Se déconnecter" déplacés en bas du tiroir.
 *  [C17] Props alignées sur UserDashboard.jsx : userEmail / onSignOut.
 *  [C18] Bouton "Se déconnecter" placé sous la ligne email.
 *  [C19] Calendrier (booking) verrouillé : plans Pro et Business uniquement.
 *  [C20] FIX — NAV_IDS.CRM 'crm' → 'leads' (aligné sur le `case 'leads'`
 *        du switch de rendu du dashboard).
 *  [C21] FIX — Groupe "Administration" (Gestion des comptes) ajouté,
 *        `adminOnly`, filtré selon la prop `isAdmin`.
 *  [C22] Tab bar "pilule" mobile + tablette (CSS injecté une seule fois,
 *        NAV_CSS ; id du <style> : 'mobile-nav-styles').
 *  [C23] Les fonctionnalités PRO / BUSINESS verrouillées ne sont plus
 *        visibles du tout pour un plan inférieur (tab bar + tiroir).
 *  [C24] Tab bar complétée par des fonctionnalités accessibles.
 *
 *  [C25] Alignement sur la nouvelle UserSidebar.jsx :
 *        - Couleurs du logo : indigo #4b4bf0 (fond de l'élément actif) et
 *          orange #ff8a1f (trait, icône active, plan, tab bar active), sur
 *          fond bleu nuit uni #0a1028 (plus de dégradé ni de flou).
 *        - Icônes identiques à la sidebar : Temps réel = Activity,
 *          Intégrations = GitBranch, Analytics = BarChart2 ; trait 1.75.
 *        - Libellés de groupe 11px, "Se déconnecter" en ligne neutre.
 *        - Id du <style> changé ('mobile-nav-styles-v2') pour que le
 *          nouveau CSS soit bien injecté après un rechargement à chaud.
 *
 *  [C26] Module Événement aligné sur UserSidebar.jsx : vendu à l'unité,
 *        indépendant du plan. L'entrée reste visible dans le tiroir avec un
 *        cadenas (badge MODULE) tant que la prop `hasEventAccess` est fausse
 *        (admin excepté) ; le clic appelle onUpgrade('event').
 *
 *  [C27] Studio visuel (id 'visual-studio') : image + QR code tracké (IP),
 *        réservé au plan BUSINESS, aligné sur UserSidebar.jsx. Groupe
 *        « Gestion commerciale » du tiroir.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  FileText,
  Activity,
  BarChart2,
  Settings,
  CalendarDays,
  CalendarClock,
  Zap,
  GitBranch,
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
  CheckSquare,
} from 'lucide-react';
import { PLAN_ORDER } from './UserSidebar';

// ─── Design tokens ────────────────────────────────────────────
// [C25] Palette issue du logo SocialApp (identique à UserSidebar.jsx).
const T = {
  bg:           '#0a1028',                  // bleu nuit uni
  panel:        '#0f1733',
  border:       'rgba(255,255,255,0.10)',
  borderSubtle: 'rgba(255,255,255,0.08)',
  text:         '#ffffff',
  textMuted:    '#aab3d0',
  textDim:      '#7e88b0',
  textGhost:    '#6c76a0',
  accent:       '#4b4bf0',                  // indigo du logo
  orange:       '#ff8a1f',                  // orange du logo
  activeBg:     'rgba(75,75,240,0.22)',
  activeBgSoft: 'rgba(75,75,240,0.30)',
  tile:         'rgba(255,255,255,0.06)',
  red:          '#f87171',
  redBg:        'rgba(239,68,68,0.10)',
  redBorder:    'rgba(239,68,68,0.30)',
  green:        '#22c55e',
  lockPro:      '#ff8a1f',
  lockBusiness: '#f7c948',
  radius:       '10px',
  radiusPill:   '999px',
};

const MAX_PLAN_ORDER = Math.max(...Object.values(PLAN_ORDER));

const ICON_STROKE = 1.75;

// ─── [C22] Styles de la tab bar (injectés une seule fois) ────
const NAV_ACCENT = T.orange;
const NAV_ACCENT_GLOW = 'rgba(255,138,31,.18)';
const NAV_BAR_BG = T.panel;

const NAV_CSS = `
.mn-bar{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:calc(100% - 24px);max-width:650px;height:78px;z-index:38;transition:transform .25s ease,opacity .25s ease}
.mn-bar.is-hidden{transform:translateX(-50%) translateY(24px);opacity:0;pointer-events:none}
.mn-bar-inner{width:100%;height:100%;display:flex;align-items:center;justify-content:space-around;padding:5px 6px;background:${NAV_BAR_BG};border:1px solid rgba(255,255,255,0.08);border-radius:40px;box-shadow:0 8px 24px rgba(0,0,0,.35);box-sizing:border-box}
.mn-item{position:relative;width:20%;height:68px;border:none;background:transparent;color:#8a94b8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;font-family:inherit;transition:color .25s ease,transform .25s ease;-webkit-tap-highlight-color:transparent}
@media (hover:hover){.mn-item:hover{color:#fff}}
.mn-item:focus-visible .mn-icon{outline:2px solid ${NAV_ACCENT};outline-offset:2px}
.mn-icon{position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all .25s ease}
.mn-icon svg{width:22px;height:22px}
.mn-item.active{color:#fff}
.mn-item.active .mn-icon{width:52px;height:52px;margin-top:-3px;border:2px solid ${NAV_ACCENT};background:${NAV_BAR_BG};box-shadow:0 0 0 1px ${NAV_ACCENT_GLOW}}
.mn-item.active .mn-icon svg{color:${NAV_ACCENT}}
.mn-item.locked{opacity:.55}
.mn-label{font-size:10px;line-height:1;white-space:nowrap}
.mn-dot{position:absolute;top:7px;right:6px;width:7px;height:7px;border-radius:50%;background:${T.green};border:2px solid ${NAV_BAR_BG};box-sizing:content-box}

@media (min-width:501px){
  .mn-bar{bottom:calc(22px + env(safe-area-inset-bottom,0px));width:min(92%,650px);height:92px}
  .mn-bar-inner{padding:8px 14px;border-radius:46px}
  .mn-item{width:100px;height:76px}
  .mn-icon{width:48px;height:48px}
  .mn-icon svg{width:24px;height:24px}
  .mn-item.active .mn-icon{width:62px;height:62px;border-width:3px}
  .mn-label{font-size:12px}
  .mn-dot{top:9px;right:8px}
}
@media (min-width:768px){
  .mn-drawer{width:min(640px,100%);margin-left:auto;margin-right:auto}
}
@media (prefers-reduced-motion:reduce){
  .mn-bar,.mn-item,.mn-icon{transition:none}
}
`;

// ─── Config navigation ────────────────────────────────────────
const NAV_IDS = {
  OVERVIEW:     'overview',
  // [FIX C20] 'crm' → 'leads' : aligné sur le `case 'leads'` du switch de
  // rendu du dashboard (<LeadsCRMPanel />).
  CRM:          'leads',
  TASKS:        'tasks',
  PLATFORMS:    'platforms',
  REALTIME:     'realtime',
  AUTOMATIONS:  'automations',
  INTEGRATIONS: 'integrations',
  VISUAL_STUDIO: 'visual-studio', // [C27]
  EVENT:        'event',
  MARKETPLACE:  'marketplace',
  DOCUMENTS:    'documents',
  BOOKING:      'booking',
  FORMS:        'forms',
  ANALYTICS:    'analytics',
  SETTINGS:     'settings',
  // [C21] Aligné sur le `case 'accounts'` de Dashboard.jsx
  // (<UserActivationPanel/>, "Gestion des comptes").
  ACCOUNTS:     'accounts',
  MENU:         '__menu__',
};

// Verrouillage par plan, aligné sur USER_NAV (UserSidebar.jsx).
// [C19] Calendrier (BOOKING) réservé aux plans Pro et Business.
// NAV_IDS.ACCOUNTS n'y figure pas : réservé aux admins (filtré via SIDEBAR_GROUPS).
const NAV_LOCK = {
  [NAV_IDS.EVENT]:        'event', // [C26] module payant, indépendant du plan
  [NAV_IDS.ANALYTICS]:    'pro',
  [NAV_IDS.REALTIME]:     'pro',
  [NAV_IDS.BOOKING]:      'pro',
  [NAV_IDS.CRM]:          'business',
  [NAV_IDS.TASKS]:        'business',
  [NAV_IDS.AUTOMATIONS]:  'business',
  [NAV_IDS.INTEGRATIONS]: 'business',
  [NAV_IDS.VISUAL_STUDIO]: 'business', // [C27]
};

// [C25] Icônes alignées sur UserSidebar (Activity pour Temps réel).
const TAB_ITEMS = [
  { id: NAV_IDS.OVERVIEW,  label: 'Dashboard', icon: LayoutDashboard },
  { id: NAV_IDS.CRM,       label: 'Leads',     icon: Users            },
  { id: NAV_IDS.PLATFORMS, label: 'Liens',     icon: Link2            },
  { id: NAV_IDS.REALTIME,  label: 'Live',      icon: Activity, badge: '●' },
  { id: NAV_IDS.MENU,      label: 'Menu',      icon: Menu             },
];

// [C14] Chaque item porte une `description` (sous-titre dans le tiroir).
// [C21] Groupe "Administration" marqué `adminOnly: true`.
// [C25] Icônes identiques à la sidebar.
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
      { id: NAV_IDS.CRM,          label: 'Leads / CRM',     icon: Users,       description: 'Gérez vos prospects et clients' },
      { id: NAV_IDS.TASKS,        label: 'Tâches',          icon: CheckSquare, description: 'Relances et rappels à faire' },
      { id: NAV_IDS.AUTOMATIONS,  label: 'Automatisations', icon: Zap,         description: 'Workflows et scénarios' },
      { id: NAV_IDS.INTEGRATIONS, label: 'Intégrations',    icon: GitBranch,   description: 'Connectez vos outils préférés' },
      { id: NAV_IDS.VISUAL_STUDIO, label: 'Studio visuel',   icon: Image,       description: 'Image avec QR code tracké' },
    ],
  },
  {
    label: 'Contenu',
    items: [
      { id: NAV_IDS.PLATFORMS,   label: 'Plateformes', icon: Link2,         description: 'Vos réseaux et liens connectés' },
      { id: NAV_IDS.EVENT,       label: 'Événement',   icon: CalendarDays,  description: 'Créez et gérez vos événements' },
      { id: NAV_IDS.MARKETPLACE, label: 'Marketplace', icon: ShoppingBag,   description: 'Vendez vos produits et services' },
      { id: NAV_IDS.DOCUMENTS,   label: 'Documents',   icon: FileText,      description: 'Vos fichiers et ressources' },
      { id: NAV_IDS.BOOKING,     label: 'Calendrier',  icon: CalendarClock, description: 'Réservations et disponibilités' },
      { id: NAV_IDS.FORMS,       label: 'Formulaires', icon: FileText,      description: 'Collectez des informations' },
    ],
  },
  {
    label: 'Notifications',
    items: [
      { id: NAV_IDS.REALTIME,  label: 'Temps réel', icon: Activity,  badge: 'LIVE', description: "Suivez l'activité en direct" },
      { id: NAV_IDS.ANALYTICS, label: 'Analytics',  icon: BarChart2, description: 'Statistiques et performances' },
    ],
  },
  {
    label: 'Administration',
    adminOnly: true,
    items: [
      { id: NAV_IDS.ACCOUNTS, label: 'Gestion des comptes', icon: Users, description: 'Activez et gérez les comptes utilisateurs' },
    ],
  },
  {
    label: 'Paramètres',
    items: [
      { id: NAV_IDS.SETTINGS, label: 'Paramètres du compte', icon: Settings, description: 'Gérez votre compte et vos préférences' },
    ],
  },
];

const GROUP_LABEL_STYLE = {
  color: T.textGhost, fontSize: '11px', fontWeight: 500,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  padding: '12px 10px 6px', margin: 0,
};

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
  userEmail,    // [C17] optionnel — email affiché dans le footer
  onSignOut,    // [C17] optionnel — () => void, affiche "Se déconnecter" si fourni
  isAdmin = false,
  hasEventAccess = false, // [C26] admin || limits.hasEvent || event_module_paid (calculé dans UserDashboard)
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
    // [C26] Module Événement : déverrouillé uniquement par l'accès au module.
    if (required === 'event') return !hasEventAccess;
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

  // ── [C9] + [C22] Injection unique des styles (keyframe + tab bar) ──
  useEffect(() => {
    const styleId = 'mobile-nav-styles-v2';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent =
        '@keyframes mobile-nav-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }' +
        NAV_CSS;
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
    if (isNavLocked(id)) {
      if (id === NAV_IDS.EVENT) { setDrawerOpen(false); onUpgrade?.('event'); return; }
      onUpgrade?.();
      return;
    }
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
  // LOGIQUE DE RENDU DE LA PHOTO DE PROFIL INCHANGÉE.
  const avatarInitial = profile?.display_name?.charAt(0)?.toUpperCase() || '?';

  // [C21] Groupes visibles : on retire "Administration" si isAdmin est faux.
  // [C23] Les fonctionnalités verrouillées par le plan (PRO / BUSINESS) ne sont
  // plus affichées du tout : on retire les items verrouillés, puis les groupes
  // devenus vides. isNavLocked() renvoie toujours false pour un admin.
  const visibleGroups = SIDEBAR_GROUPS
    .filter(group => !group.adminOnly || isAdmin)
    .map(group => ({
      ...group,
      // [C26] « Événement » reste visible avec un cadenas pour inviter à acheter le module.
      items: group.items.filter(item => !isNavLocked(item.id) || item.id === NAV_IDS.EVENT),
    }))
    .filter(group => group.items.length > 0);

  // [C23] Même règle pour la tab bar (l'onglet "Menu" est toujours conservé).
  // [C24] La barre est complétée par des fonctionnalités accessibles : on prend
  // les 4 premiers onglets NON verrouillés de la liste de candidats (ordre de
  // priorité) + "Menu". BASIC : Dashboard, Liens, Boutique, Formulaires, Menu.
  const TAB_MAX = 4;
  const tabCandidates = [
    ...TAB_ITEMS.filter(item => item.id !== NAV_IDS.MENU),
    { id: NAV_IDS.MARKETPLACE, label: 'Boutique',    icon: ShoppingBag },
    { id: NAV_IDS.FORMS,       label: 'Formulaires', icon: FileText    },
    { id: NAV_IDS.DOCUMENTS,   label: 'Documents',   icon: FileText    },
  ];
  const visibleTabs = [
    ...tabCandidates.filter(item => !isNavLocked(item.id)).slice(0, TAB_MAX),
    ...TAB_ITEMS.filter(item => item.id === NAV_IDS.MENU),
  ];

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 39,
          background: 'rgba(0,0,0,0.6)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Drawer — [C22] classe mn-drawer : centré sur tablette (≥768px) */}
      <div
        ref={drawerRef}
        className="mn-drawer"
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
          borderRadius: '20px 20px 0 0',
          border: `1px solid ${T.border}`, borderBottom: 'none',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Header — [C15] en ligne, logique avatar inchangée */}
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
              width: '40px', height: '40px', borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} strokeWidth={ICON_STROKE} color={T.textMuted} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: T.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 600, color: T.text,
              overflow: 'hidden', flexShrink: 0,
            }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : avatarInitial
              }
            </div>

            <div style={{ minWidth: 0 }}>
              <p style={{ color: T.text, fontSize: '18px', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
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
              background: 'rgba(255,138,31,0.12)',
              border: '1px solid rgba(255,138,31,0.35)',
            }}>
              <Crown size={11} strokeWidth={ICON_STROKE} color={T.orange} />
              <span style={{ color: T.orange, fontSize: '11px', fontWeight: 600 }}>
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
            borderRadius: '12px',
            border: `1px solid ${T.borderSubtle}`,
            background: 'rgba(255,255,255,0.03)',
            display: 'grid',
            gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
            flexShrink: 0,
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                {s.icon && <s.icon size={18} strokeWidth={ICON_STROKE} color={s.color || T.orange} />}
                <span style={{ color: T.text, fontSize: '17px', fontWeight: 600, lineHeight: 1 }}>{s.value}</span>
                <span style={{ color: T.textDim, fontSize: '11px' }}>{s.label}</span>
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
          {visibleGroups.map(group => (
            <div key={group.label} style={{ marginBottom: '2px' }}>
              <p style={GROUP_LABEL_STYLE}>{group.label}</p>
              {group.items.map(item => {
                const isActive = activeSection === item.id;
                const locked   = isNavLocked(item.id);
                const on       = isActive && !locked;
                const lockPlan = NAV_LOCK[item.id];
                const lockColor = lockPlan === 'business' ? T.lockBusiness : T.lockPro;
                const lockLabel = lockPlan === 'business' ? 'BUSINESS' : lockPlan === 'event' ? 'MODULE' : 'PRO';
                return (
                  <button
                    key={item.id}
                    onClick={() => handleDrawerNav(item.id)}
                    aria-current={on ? 'page' : undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: T.radius, border: 'none',
                      background: on ? T.activeBg : 'transparent',
                      cursor: 'pointer', marginBottom: '2px', position: 'relative',
                      opacity: locked ? 0.55 : 1, fontFamily: 'inherit',
                    }}
                  >
                    {on && (
                      <div style={{
                        position: 'absolute', left: 0, top: '10px', bottom: '10px',
                        width: '3px', background: T.orange, borderRadius: 0,
                      }} />
                    )}
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '9px',
                      background: on ? T.activeBgSoft : T.tile,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {locked
                        ? <Lock size={16} strokeWidth={ICON_STROKE} color="rgba(255,255,255,0.4)" />
                        : <item.icon size={18} strokeWidth={ICON_STROKE} color={on ? T.orange : T.textDim} />
                      }
                    </div>
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <p style={{
                        color: on ? T.text : T.textMuted,
                        fontSize: '14px', fontWeight: on ? 600 : 500,
                        margin: 0, lineHeight: 1.25,
                      }}>
                        {item.label}
                      </p>
                      {item.description && (
                        <p style={{ color: T.textGhost, fontSize: '12px', margin: '2px 0 0', lineHeight: 1.25 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    {locked ? (
                      <span style={{
                        flexShrink: 0, background: lockColor + '20', border: '1px solid ' + lockColor + '55',
                        borderRadius: '6px', padding: '2px 6px', fontSize: '9px', fontWeight: 600,
                        color: lockColor, textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {lockLabel}
                      </span>
                    ) : item.badge ? (
                      <span style={{
                        background: T.green, color: '#04210f',
                        fontSize: '9px', fontWeight: 700,
                        padding: '2px 6px', borderRadius: '6px', flexShrink: 0,
                      }}>
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight size={14} strokeWidth={ICON_STROKE} color="rgba(255,255,255,0.3)" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Personnalisation — Image de fond, en item de liste avec bouton "Modifier" */}
          {onBgUpload && (
            <div style={{ marginBottom: '2px' }}>
              <p style={GROUP_LABEL_STYLE}>Personnalisation</p>
              <div style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: T.radius,
              }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '9px',
                  background: T.tile,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {uploadingBg
                    ? <Loader2 size={17} strokeWidth={ICON_STROKE} color={T.orange} style={{ animation: 'mobile-nav-spin 1s linear infinite' }} />
                    : <Image size={18} strokeWidth={ICON_STROKE} color={T.textDim} />
                  }
                </div>
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <p style={{ color: T.textMuted, fontSize: '14px', fontWeight: 500, margin: 0 }}>Image de fond</p>
                  <p style={{ color: T.textGhost, fontSize: '12px', margin: '2px 0 0' }}>
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
                      borderRadius: '8px',
                      cursor: uploadingBg ? 'not-allowed' : 'pointer',
                      opacity: uploadingBg ? 0.5 : 1,
                    }}
                  >
                    <X size={13} strokeWidth={ICON_STROKE} color={T.red} />
                  </button>
                )}

                <label style={{
                  flexShrink: 0, position: 'relative',
                  display: 'flex', alignItems: 'center',
                  padding: '7px 14px', borderRadius: T.radiusPill,
                  background: T.activeBg, border: '1px solid rgba(75,75,240,0.45)',
                  cursor: uploadingBg ? 'not-allowed' : 'pointer',
                  opacity: uploadingBg ? 0.7 : 1,
                }}>
                  <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}>
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

        {/* Footer — [C16]/[C18] email + "Se déconnecter" + "Changer d'offre" */}
        {(userEmail || onSignOut || (!isMaxPlan && onUpgrade)) && (
          <div style={{
            padding: '12px 20px calc(16px + env(safe-area-inset-bottom))',
            borderTop: `1px solid ${T.borderSubtle}`,
            flexShrink: 0,
          }}>
            {userEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Mail size={13} strokeWidth={ICON_STROKE} color={T.textGhost} />
                <span style={{ color: T.textGhost, fontSize: '12px' }}>{userEmail}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              {onSignOut && (
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    height: '42px', padding: '0 10px', margin: '0 -10px',
                    borderRadius: T.radius, background: 'transparent', border: 'none',
                    color: T.textMuted, fontSize: '14px', fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <LogOut size={18} strokeWidth={ICON_STROKE} color={T.textDim} />
                  Se déconnecter
                </button>
              )}

              {!isMaxPlan && onUpgrade && (
                <button
                  onClick={onUpgrade}
                  style={{
                    background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                    color: T.orange, fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
                  }}
                >
                  <Crown size={12} strokeWidth={ICON_STROKE} /> Changer d'offre
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Tab Bar — [C22] design pilule, mobile + tablette */}
      <nav
        ref={navRef}
        aria-label="Navigation principale"
        className={`mn-bar${drawerOpen ? ' is-hidden' : ''}`}
      >
        <div className="mn-bar-inner">
          {visibleTabs.map(item => {
            const isMenu   = item.id === NAV_IDS.MENU;
            const locked   = !isMenu && isNavLocked(item.id);
            const isActive = isMenu ? drawerOpen : (activeSection === item.id && !locked);
            return (
              <button
                key={item.id}
                type="button"
                className={`mn-item${isActive ? ' active' : ''}${locked ? ' locked' : ''}`}
                onClick={() => handleTab(item.id)}
                tabIndex={drawerOpen ? -1 : 0}
                aria-label={item.label + (locked ? ' (verrouillé)' : '')}
                aria-current={!isMenu && isActive ? 'page' : undefined}
                aria-expanded={isMenu ? drawerOpen : undefined}
              >
                <span className="mn-icon">
                  {locked
                    ? <Lock aria-hidden="true" strokeWidth={ICON_STROKE} />
                    : <item.icon aria-hidden="true" strokeWidth={ICON_STROKE} />
                  }
                  {item.badge && !isMenu && !locked && (
                    <span className="mn-dot" role="status" aria-label="En direct" />
                  )}
                </span>
                <span className="mn-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}