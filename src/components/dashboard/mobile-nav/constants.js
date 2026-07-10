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
} from "lucide-react";

export const NAV_IDS = {
  OVERVIEW: "overview",
  CRM: "crm",
  PLATFORMS: "platforms",
  REALTIME: "realtime",
  AUTOMATIONS: "automations",
  INTEGRATIONS: "integrations",
  EVENT: "event",
  MARKETPLACE: "marketplace",
  DOCUMENTS: "documents",
  FORMS: "forms",
  ANALYTICS: "analytics",
  SETTINGS: "settings",
  MENU: "__menu__",
};

export const NAV_LOCK = {
  [NAV_IDS.EVENT]: "pro",
  [NAV_IDS.ANALYTICS]: "pro",
  [NAV_IDS.REALTIME]: "pro",
  [NAV_IDS.CRM]: "business",
  [NAV_IDS.AUTOMATIONS]: "business",
  [NAV_IDS.INTEGRATIONS]: "business",
};

export const TAB_ITEMS = [
  {
    id: NAV_IDS.OVERVIEW,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: NAV_IDS.CRM,
    label: "Leads",
    icon: Users,
  },
  {
    id: NAV_IDS.PLATFORMS,
    label: "Profils",
    icon: Link2,
  },
  {
    id: NAV_IDS.REALTIME,
    label: "Live",
    icon: Radio,
    badge: "●",
  },
  {
    id: NAV_IDS.MENU,
    label: "Menu",
    icon: Menu,
  },
];

export const SIDEBAR_GROUPS = [
  {
    label: "Dashboard",
    items: [
      {
        id: NAV_IDS.OVERVIEW,
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    label: "CRM",
    items: [
      {
        id: NAV_IDS.CRM,
        label: "Leads / CRM",
        icon: Users,
      },
      {
        id: NAV_IDS.AUTOMATIONS,
        label: "Automatisations",
        icon: Zap,
      },
      {
        id: NAV_IDS.INTEGRATIONS,
        label: "Intégrations",
        icon: Sparkles,
      },
    ],
  },

  {
    label: "Contenu",
    items: [
      {
        id: NAV_IDS.PLATFORMS,
        label: "Plateformes",
        icon: Link2,
      },
      {
        id: NAV_IDS.EVENT,
        label: "Événement",
        icon: CalendarDays,
      },
      {
        id: NAV_IDS.MARKETPLACE,
        label: "Marketplace",
        icon: ShoppingBag,
      },
      {
        id: NAV_IDS.DOCUMENTS,
        label: "Documents",
        icon: FileText,
      },
      {
        id: NAV_IDS.FORMS,
        label: "Formulaires",
        icon: FileText,
      },
    ],
  },

  {
    label: "Notifications",
    items: [
      {
        id: NAV_IDS.REALTIME,
        label: "Temps réel",
        icon: Radio,
        badge: "LIVE",
      },
      {
        id: NAV_IDS.ANALYTICS,
        label: "Analytics",
        icon: BarChart3,
      },
    ],
  },

  {
    label: "Administration",
    items: [
      {
        id: NAV_IDS.SETTINGS,
        label: "Paramètres",
        icon: Settings,
      },
    ],
  },
];