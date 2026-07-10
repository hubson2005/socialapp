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

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

import { PLAN_ORDER } from "./UserSidebar";

/* ===========================================================
   PREMIUM DESIGN SYSTEM
=========================================================== */

const BRAND_BG = "#090B17";

const T = {
  // Couleurs principales
  bg: BRAND_BG,
  surface: "#111827",
  surface2: "#181F34",

  // Texte
  text: "#FFFFFF",
  textMuted: "#D1D5DB",
  textDim: "#94A3B8",
  textGhost: "#64748B",

  // Bordures
  border: "rgba(255,255,255,.08)",
  borderSubtle: "rgba(255,255,255,.05)",

  // Accent
  accent: "#5865F2",
  accentEnd: "#7C5CFF",
  accentLight: "#A5B4FC",

  // Etats actifs
  activeBg: "rgba(88,101,242,.15)",
  activeBgSoft: "rgba(88,101,242,.25)",
  activeBar: "linear-gradient(180deg,#5865F2,#7C5CFF)",

  // Statuts
  green: "#22C55E",
  orange: "#F59E0B",
  red: "#EF4444",

  redBg: "rgba(239,68,68,.10)",
  redBorder: "rgba(239,68,68,.25)",

  lockPro: "#818CF8",
  lockBusiness: "#FFD54A",

  imageAccent: "#A5B4FC",

  radius: 18,
  radiusSmall: 14,
  radiusLarge: 24,
  radiusPill: 999,

  shadow:
    "0 20px 60px rgba(0,0,0,.45)",

  card:
    "linear-gradient(180deg,#171E31 0%,#111827 100%)",
};

/* ===========================================================
   STYLES RÉUTILISABLES
=========================================================== */

const CARD_STYLE = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: T.radiusLarge,
  boxShadow: T.shadow,
  padding: 18,
};

const ICON_BOX = {
  width: 52,
  height: 52,
  borderRadius: 16,
  background: "rgba(255,255,255,.05)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

/* ===========================================================
   PLAN
=========================================================== */

const MAX_PLAN_ORDER = Math.max(...Object.values(PLAN_ORDER));

const SIDEBAR_GROUPS = [
  {
    label: "Dashboard",

    items: [
      {
        id: NAV_IDS.OVERVIEW,
        label: "Dashboard",
        description: "Vue d'ensemble de votre activité",
        icon: LayoutDashboard,
        color: "#5865F2",
      },
    ],
  },

  {
    label: "Gestion",

    items: [
      {
        id: NAV_IDS.CRM,
        label: "Leads / CRM",
        description: "Gérez vos prospects",
        icon: Users,
        color: "#3B82F6",
      },

      {
        id: NAV_IDS.AUTOMATIONS,
        label: "Automatisations",
        description: "Créez vos workflows",
        icon: Zap,
        color: "#8B5CF6",
      },

      {
        id: NAV_IDS.INTEGRATIONS,
        label: "Intégrations",
        description: "Connectez vos applications",
        icon: Sparkles,
        color: "#06B6D4",
      },
    ],
  },

  {
    label: "Contenu",

    items: [
      {
        id: NAV_IDS.PLATFORMS,
        label: "Profils",
        description: "Tous vos profils sociaux",
        icon: Link2,
        color: "#10B981",
      },

      {
        id: NAV_IDS.EVENT,
        label: "Évènements",
        description: "Créez vos évènements",
        icon: CalendarDays,
        color: "#F59E0B",
      },

      {
        id: NAV_IDS.MARKETPLACE,
        label: "Marketplace",
        description: "Votre boutique",
        icon: ShoppingBag,
        color: "#EC4899",
      },

      {
        id: NAV_IDS.DOCUMENTS,
        label: "Documents",
        description: "Vos fichiers",
        icon: FileText,
        color: "#64748B",
      },

      {
        id: NAV_IDS.FORMS,
        label: "Formulaires",
        description: "Collectez des informations",
        icon: FileText,
        color: "#14B8A6",
      },
    ],
  },

  {
    label: "Analyse",

    items: [
      {
        id: NAV_IDS.REALTIME,
        label: "Temps réel",
        description: "Suivez vos activités",
        icon: Radio,
        badge: "LIVE",
        color: "#EF4444",
      },

      {
        id: NAV_IDS.ANALYTICS,
        label: "Analytics",
        description: "Consultez vos statistiques",
        icon: BarChart3,
        color: "#6366F1",
      },
    ],
  },

  {
    label: "Paramètres",

    items: [
      {
        id: NAV_IDS.SETTINGS,
        label: "Paramètres",
        description: "Configuration du compte",
        icon: Settings,
        color: "#94A3B8",
      },
    ],
  },
];

    // ── Fermeture au clic extérieur ──────────────────────────────
  useEffect(() => {
    if (!drawerOpen) return;

    const handler = (e) => {
      const target = e.target;

      const inDrawer =
        drawerRef.current?.contains(target);

      const inNav =
        navRef.current?.contains(target);

      if (!inDrawer && !inNav) {
        setDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [drawerOpen]);

  // ── Verrouillage du body ─────────────────────────────────────
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [drawerOpen]);

  // ── Keyframe du loader ───────────────────────────────────────
  useEffect(() => {
    const styleId = "mobile-nav-spin-keyframe";

    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");

    style.id = styleId;

    style.textContent = `
      @keyframes mobile-nav-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;

    document.head.appendChild(style);
  }, []);

  // ── Navigation Tab Bar ───────────────────────────────────────
  const handleTab = (id) => {
    if (id === NAV_IDS.MENU) {
      setDrawerOpen((v) => !v);
      return;
    }

    if (isNavLocked(id)) {
      setDrawerOpen(false);
      onUpgrade?.();
      return;
    }

    setDrawerOpen(false);

    setTimeout(() => {
      onNavigate(id);
    }, 180);
  };

  // ── Navigation Drawer ────────────────────────────────────────
  const handleDrawerNav = (id) => {
    if (isNavLocked(id)) {
      onUpgrade?.();
      return;
    }

    setDrawerOpen(false);

    setTimeout(() => {
      onNavigate(id);
    }, 180);
  };

  // ── Upload image de fond ─────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];

    if (file && onBgUpload) {
      await Promise.resolve(onBgUpload(file));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Suppression image de fond ────────────────────────────────
  const handleBgRemove = () => {
    onBgRemove?.();
  };

  // ── Déconnexion ──────────────────────────────────────────────
  const handleSignOut = () => {
    setDrawerOpen(false);

    setTimeout(() => {
      onSignOut?.();
    }, 180);
  };

    // ── Avatar initiale ──────────────────────────────────────────
  const avatarInitial =
    profile?.display_name?.charAt(0)?.toUpperCase() || "?";

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ===========================
          BACKDROP
      ============================ */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 39,
          background: "rgba(0,0,0,.65)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "all .35s ease",
        }}
      />

      {/* ===========================
          DRAWER
      ============================ */}

      <div
        ref={drawerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,

          maxHeight: "88dvh",

          transform: drawerOpen
            ? "translateY(0)"
            : "translateY(100%)",

          transition:
            "transform .45s cubic-bezier(.22,1,.36,1)",

          background:
            "linear-gradient(180deg,#161D30 0%,#0B1020 100%)",

          borderRadius: "32px 32px 0 0",

          border: `1px solid ${T.border}`,

          borderBottom: "none",

          boxShadow:
            "0 -25px 80px rgba(0,0,0,.65)",

          backdropFilter: "blur(35px)",

          WebkitBackdropFilter: "blur(35px)",

          display: "flex",
          flexDirection: "column",

          overflow: "hidden",
        }}
      >
        {/* ===========================
            HANDLE
        ============================ */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 14,
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              width: 48,
              height: 5,
              borderRadius: 999,
              background: "rgba(255,255,255,.16)",
            }}
          />
        </div>

        {/* ===========================
            HEADER PREMIUM
        ============================ */}

        <div
          style={{
            padding: 22,

            borderBottom: `1px solid ${T.border}`,

            background:
              "linear-gradient(180deg,#1A2238,#141B2E)",

            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 18,
                alignItems: "center",
              }}
            >
              {/* Avatar */}

              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 22,

                  overflow: "hidden",

                  background:
                    "linear-gradient(135deg,#5865F2,#7C5CFF)",

                  display: "flex",

                  justifyContent: "center",

                  alignItems: "center",

                  color: "#FFF",

                  fontWeight: 800,

                  fontSize: 28,

                  boxShadow:
                    "0 12px 30px rgba(88,101,242,.35)",

                  flexShrink: 0,
                }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  avatarInitial
                )}
              </div>

              {/* Infos */}

              <div>

                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#FFF",
                  }}
                >
                  {profile?.display_name || "Mon profil"}
                </div>

                {profile?.username && (
                  <div
                    style={{
                      marginTop: 5,
                      color: T.textDim,
                      fontSize: 13,
                    }}
                  >
                    @{profile.username}
                  </div>
                )}

                {userEmail && (
                  <div
                    style={{
                      marginTop: 10,
                      color: T.textGhost,
                      fontSize: 12,
                    }}
                  >
                    {userEmail}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      background:
                        "rgba(88,101,242,.18)",

                      color: "#A5B4FC",

                      padding: "6px 12px",

                      borderRadius: 999,

                      fontSize: 11,

                      fontWeight: 700,
                    }}
                  >
                    {(plan || "FREE").toUpperCase()}
                  </div>

                  {currentOrder === MAX_PLAN_ORDER && (
                    <div
                      style={{
                        background:
                          "rgba(255,215,0,.14)",

                        color: "#FFD54A",

                        padding: "6px 12px",

                        borderRadius: 999,

                        display: "flex",

                        alignItems: "center",

                        gap: 6,

                        fontSize: 11,

                        fontWeight: 700,
                      }}
                    >
                      <Crown size={12} />

                      PREMIUM
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton fermer */}

            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Fermer"
              style={{
                width: 46,
                height: 46,

                borderRadius: 16,

                background:
                  "rgba(255,255,255,.06)",

                border: `1px solid ${T.border}`,

                display: "flex",

                justifyContent: "center",

                alignItems: "center",

                cursor: "pointer",
              }}
            >
              <X
                size={18}
                color="rgba(255,255,255,.75)"
              />
            </button>
          </div>
        </div>

{/* ===========================
    SCROLLABLE LIST
=========================== */}

<div
  onTouchMove={(e) => e.stopPropagation()}
  style={{
    flex: 1,
    overflowY: "auto",
    minHeight: 0,
    padding: "18px",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
  }}
>
  {SIDEBAR_GROUPS.map((group) => (
    <div key={group.label} style={{ marginBottom: 28 }}>

      {/* TITRE DE SECTION */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          paddingLeft: 6,
        }}
      >
        <div
          style={{
            width: 5,
            height: 18,
            borderRadius: 999,
            background: T.activeBar,
          }}
        />

        <span
          style={{
            color: T.textGhost,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {group.label}
        </span>
      </div>

      {group.items.map((item) => {
        const isActive = activeSection === item.id;
        const locked = isNavLocked(item.id);

        const lockPlan = NAV_LOCK[item.id];
        const lockColor =
          lockPlan === "business"
            ? T.lockBusiness
            : T.lockPro;

        const lockLabel =
          lockPlan === "business"
            ? "BUSINESS"
            : "PRO";

        return (
          <button
            key={item.id}
            onClick={() => handleDrawerNav(item.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",

              padding: 16,

              marginBottom: 12,

              borderRadius: 18,

              border: isActive
                ? "1px solid rgba(88,101,242,.35)"
                : `1px solid ${T.border}`,

              background: isActive
                ? "linear-gradient(135deg,#1D2B64,#141B2E)"
                : T.card,

              boxShadow: isActive
                ? "0 15px 35px rgba(88,101,242,.20)"
                : "none",

              cursor: "pointer",

              transition: ".25s",
            }}
          >
            {/* ICÔNE */}

            <div
              style={{
                width: 52,
                height: 52,

                borderRadius: 16,

                marginRight: 16,

                background: isActive
                  ? "linear-gradient(135deg,#5865F2,#7C5CFF)"
                  : "rgba(255,255,255,.05)",

                display: "flex",

                justifyContent: "center",

                alignItems: "center",

                flexShrink: 0,
              }}
            >
              {locked ? (
                <Lock
                  size={20}
                  color="rgba(255,255,255,.45)"
                />
              ) : (
                <item.icon
                  size={20}
                  color="white"
                />
              )}
            </div>

            {/* TEXTE */}

            <div
              style={{
                flex: 1,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  color: "#FFF",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {item.label}
              </div>

              {item.description && (
                <div
                  style={{
                    marginTop: 5,
                    color: T.textDim,
                    fontSize: 12,
                  }}
                >
                  {item.description}
                </div>
              )}
            </div>

            {/* BADGE */}

            {locked ? (
              <div
                style={{
                  padding: "6px 12px",

                  borderRadius: 999,

                  background:
                    lockPlan === "business"
                      ? "rgba(255,215,0,.12)"
                      : "rgba(88,101,242,.15)",

                  border:
                    lockPlan === "business"
                      ? "1px solid rgba(255,215,0,.25)"
                      : "1px solid rgba(88,101,242,.25)",

                  color: lockColor,

                  fontSize: 10,

                  fontWeight: 700,

                  letterSpacing: ".05em",
                }}
              >
                {lockLabel}
              </div>
            ) : item.badge ? (
              <div
                style={{
                  padding: "6px 12px",

                  borderRadius: 999,

                  background: "rgba(34,197,94,.15)",

                  color: "#22C55E",

                  fontWeight: 700,

                  fontSize: 10,
                }}
              >
                {item.badge}
              </div>
            ) : (
              <ChevronRight
                size={18}
                color="rgba(255,255,255,.25)"
              />
            )}
          </button>
        );
      })}
    </div>
  ))}
</div>
        
{/* ===========================
    FOOTER PREMIUM
=========================== */}

<div
  style={{
    padding: "20px",
    paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
    borderTop: `1px solid ${T.border}`,
    background: "rgba(255,255,255,.02)",
    backdropFilter: "blur(20px)",
    flexShrink: 0,
  }}
>
  {/* PERSONNALISATION */}

  {onBgUpload && (
    <div
      style={{
        ...CARD_STYLE,
        marginBottom: 18,
        padding: 16,
      }}
    >
      <div
        style={{
          color: "#FFF",
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        Personnalisation
      </div>

      <div
        style={{
          color: T.textDim,
          fontSize: 12,
          marginBottom: 16,
        }}
      >
        Personnalisez votre espace avec une image de fond.
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <label
          style={{
            flex: 1,
            position: "relative",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,

            padding: "14px",

            borderRadius: 16,

            cursor: uploadingBg
              ? "not-allowed"
              : "pointer",

            background: bgImageUrl
              ? "linear-gradient(135deg,#5865F2,#7C5CFF)"
              : "rgba(255,255,255,.05)",

            border: `1px solid ${T.border}`,
          }}
        >
          {uploadingBg ? (
            <Loader2
              size={18}
              color="white"
              style={{
                animation:
                  "mobile-nav-spin 1s linear infinite",
              }}
            />
          ) : (
            <Image size={18} color="white" />
          )}

          <span
            style={{
              color: "#FFF",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {bgImageUrl
              ? "Changer le fond"
              : "Ajouter un fond"}
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={uploadingBg}
            onChange={handleFileChange}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              width: "100%",
              height: "100%",
              cursor: "inherit",
            }}
          />
        </label>

        {bgImageUrl && (
          <button
            onClick={handleBgRemove}
            disabled={uploadingBg}
            style={{
              width: 52,
              height: 52,

              borderRadius: 16,

              background: T.redBg,

              border: `1px solid ${T.redBorder}`,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              cursor: uploadingBg
                ? "not-allowed"
                : "pointer",

              opacity: uploadingBg ? .5 : 1,
            }}
          >
            <X
              size={18}
              color={T.red}
            />
          </button>
        )}
      </div>
    </div>
  )}

  {/* COMPTE */}

  {onSignOut && (
    <div
      style={{
        ...CARD_STYLE,
        padding: 16,
      }}
    >
      {userEmail && (
        <div
          style={{
            color: T.textDim,
            fontSize: 12,
            marginBottom: 14,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {userEmail}
        </div>
      )}

      <button
        onClick={handleSignOut}
        style={{
          width: "100%",

          display: "flex",
          justifyContent: "center",
          alignItems: "center",

          gap: 10,

          padding: "14px",

          borderRadius: 16,

          border: `1px solid ${T.redBorder}`,

          background:
            "linear-gradient(180deg,rgba(239,68,68,.18),rgba(239,68,68,.08))",

          color: T.red,

          fontWeight: 700,

          fontSize: 14,

          cursor: "pointer",

          transition: ".25s",
        }}
      >
        <LogOut size={17} />

        Se déconnecter
      </button>
    </div>
  )}
</div>

</div>

      {/* ===========================
          PREMIUM FLOATING TAB BAR
      ============================ */}

      <nav
        ref={navRef}
        aria-label="Navigation principale"
        style={{
          position: "fixed",
          left: "50%",
          bottom: "calc(18px + env(safe-area-inset-bottom))",
          transform: "translateX(-50%)",
          zIndex: 38,

          width: "calc(100% - 28px)",
          maxWidth: 430,

          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",

          padding: "10px",

          borderRadius: 24,

          background: "rgba(13,18,33,.92)",

          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",

          border: "1px solid rgba(255,255,255,.08)",

          boxShadow:
            "0 20px 50px rgba(0,0,0,.45)",
        }}
      >
        {TAB_ITEMS.map((item) => {
          const isMenu = item.id === NAV_IDS.MENU;

          const locked =
            !isMenu && isNavLocked(item.id);

          const isActive = isMenu
            ? drawerOpen
            : activeSection === item.id && !locked;

          return (
            <button
              key={item.id}
              onClick={() => handleTab(item.id)}
              aria-label={
                item.label +
                (locked ? " (verrouillé)" : "")
              }
              aria-current={
                !isMenu && isActive
                  ? "page"
                  : undefined
              }
              aria-expanded={
                isMenu
                  ? drawerOpen
                  : undefined
              }
              style={{
                flex: 1,

                display: "flex",
                flexDirection: "column",

                alignItems: "center",

                justifyContent: "center",

                gap: 5,

                minHeight: 58,

                border: "none",

                borderRadius: 18,

                cursor: "pointer",

                background: isActive
                  ? "linear-gradient(135deg,#5865F2,#7C5CFF)"
                  : "transparent",

                transition: "all .25s ease",

                transform: isActive
                  ? "translateY(-4px)"
                  : "translateY(0)",

                position: "relative",

                opacity: locked ? .55 : 1,
              }}
            >
              {/* Badge LIVE */}

              {item.badge &&
                !locked &&
                !isMenu && (
                  <div
                    style={{
                      position: "absolute",

                      top: 8,

                      right: 18,

                      width: 8,

                      height: 8,

                      borderRadius: 999,

                      background: "#22C55E",

                      boxShadow:
                        "0 0 12px #22C55E",
                    }}
                  />
                )}

              {/* Icône */}

              {locked ? (
                <Lock
                  size={20}
                  color="rgba(255,255,255,.35)"
                />
              ) : (
                <item.icon
                  size={22}
                  color={
                    isActive
                      ? "#FFF"
                      : "rgba(255,255,255,.55)"
                  }
                />
              )}

              {/* Texte */}

              <span
                style={{
                  fontSize: 10,

                  fontWeight: isActive
                    ? 700
                    : 500,

                  color: isActive
                    ? "#FFF"
                    : "rgba(255,255,255,.55)",

                  letterSpacing: ".02em",
                }}
              >
                {item.label}
              </span>

              {/* Barre active */}

              {isActive && (
                <div
                  style={{
                    position: "absolute",

                    bottom: 4,

                    width: 22,

                    height: 4,

                    borderRadius: 999,

                    background: "#FFF",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}