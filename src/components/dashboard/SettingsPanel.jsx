import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Loader2, ShieldCheck, Globe, Bell, Eye, EyeOff, MousePointerClick,
  CalendarClock, Activity, Check, Lock, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import { subscribeToPush, ensurePushSubscription } from '../../lib/push';

// ─── Traductions (paramètres uniquement) ─────────────────────────────────────
const TRANSLATIONS = {
  fr: {
    eyebrow: 'Compte', title: 'Paramètres', session_secure: 'Session sécurisée',
    tab_password: 'Sécurité', tab_language: 'Langue', tab_notifications: 'Notifications',
    password_title: 'Changer le mot de passe', password_hint: 'Au moins 10 caractères, avec un chiffre et un symbole',
    password_new: 'Nouveau mot de passe', password_confirm: 'Confirmer le mot de passe',
    password_btn: 'Mettre à jour le mot de passe',
    password_short: 'Mot de passe trop court (6 car. min)',
    password_mismatch: 'Les mots de passe ne correspondent pas',
    password_success: 'Mot de passe mis à jour !', password_error: 'Erreur : ',
    crit_length: '10+ caractères', crit_number: 'Un chiffre', crit_symbol: 'Un symbole',
    lang_title: "Langue de l'interface", lang_sub: 'Choisissez votre langue préférée',
    lang_success: 'Langue mise à jour — rechargement du dashboard',
    notif_title: 'Notifications', notif_on: 'Push activées sur cet appareil', notif_off: 'Push désactivées',
    notif_enable: 'Activer', notif_enabled_success: 'Notifications push activées !',
    notif_view: 'Nouvelle visite', notif_view_desc: 'Alerte à chaque vue de profil',
    notif_click: 'Clic sur un lien', notif_click_desc: "Alerte lors d'un clic",
    notif_expiry: 'Expiration du profil', notif_expiry_desc: 'Rappel avant expiration',
    notif_threshold: 'Seuil de regroupement', notif_threshold_every: 'Tous les {n} visiteurs',
    pref_saved: 'Préférence sauvegardée',
    pref_error: 'Erreur de sauvegarde : ',
    loading: 'Chargement des paramètres…',
  },
  en: {
    eyebrow: 'Account', title: 'Settings', session_secure: 'Session secure',
    tab_password: 'Security', tab_language: 'Language', tab_notifications: 'Notifications',
    password_title: 'Change password', password_hint: 'At least 10 characters, with a number and a symbol',
    password_new: 'New password', password_confirm: 'Confirm password',
    password_btn: 'Update password', password_short: 'Password too short (6 chars min)',
    password_mismatch: 'Passwords do not match', password_success: 'Password updated!',
    password_error: 'Error: ',
    crit_length: '10+ characters', crit_number: 'A number', crit_symbol: 'A symbol',
    lang_title: 'Interface language',
    lang_sub: 'Choose your preferred language', lang_success: 'Language updated',
    notif_title: 'Notifications', notif_on: 'Push enabled on this device', notif_off: 'Push disabled',
    notif_enable: 'Enable', notif_enabled_success: 'Push notifications enabled!',
    notif_view: 'New visit', notif_view_desc: 'Alert on each profile view',
    notif_click: 'Link click', notif_click_desc: 'Alert on each link click',
    notif_expiry: 'Profile expiration', notif_expiry_desc: 'Reminder before expiration',
    notif_threshold: 'Grouping threshold', notif_threshold_every: 'Every {n} visitors',
    pref_saved: 'Preference saved',
    pref_error: 'Save error: ',
    loading: 'Loading settings…',
  },
  es: {
    eyebrow: 'Cuenta', title: 'Configuración', session_secure: 'Sesión segura',
    tab_password: 'Seguridad', tab_language: 'Idioma', tab_notifications: 'Notificaciones',
    password_title: 'Cambiar contraseña', password_hint: 'Al menos 10 caracteres, con un número y un símbolo',
    password_new: 'Nueva contraseña', password_confirm: 'Confirmar contraseña',
    password_btn: 'Actualizar contraseña', password_short: 'Contraseña demasiado corta (mín. 6 car.)',
    password_mismatch: 'Las contraseñas no coinciden', password_success: '¡Contraseña actualizada!',
    password_error: 'Error: ',
    crit_length: '10+ caracteres', crit_number: 'Un número', crit_symbol: 'Un símbolo',
    lang_title: 'Idioma de la interfaz',
    lang_sub: 'Elige tu idioma preferido', lang_success: 'Idioma actualizado',
    notif_title: 'Notificaciones', notif_on: 'Push activadas en este dispositivo', notif_off: 'Push desactivadas',
    notif_enable: 'Activar', notif_enabled_success: '¡Notificaciones push activadas!',
    notif_view: 'Nueva visita', notif_view_desc: 'Alerta en cada vista de perfil',
    notif_click: 'Clic en enlace', notif_click_desc: 'Alerta en cada clic',
    notif_expiry: 'Expiración de perfil', notif_expiry_desc: 'Recordatorio antes de expirar',
    notif_threshold: 'Umbral de agrupación', notif_threshold_every: 'Cada {n} visitantes',
    pref_saved: 'Preferencia guardada',
    pref_error: 'Error al guardar: ',
    loading: 'Cargando ajustes…',
  },
  ar: {
    eyebrow: 'الحساب', title: 'الإعدادات', session_secure: 'الجلسة آمنة',
    tab_password: 'الأمان', tab_language: 'اللغة', tab_notifications: 'الإشعارات',
    password_title: 'تغيير كلمة المرور', password_hint: '10 أحرف على الأقل، مع رقم ورمز',
    password_new: 'كلمة المرور الجديدة', password_confirm: 'تأكيد كلمة المرور',
    password_btn: 'تحديث كلمة المرور', password_short: 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)',
    password_mismatch: 'كلمتا المرور غير متطابقتين', password_success: 'تم تحديث كلمة المرور!',
    password_error: 'خطأ: ',
    crit_length: '10 أحرف أو أكثر', crit_number: 'رقم', crit_symbol: 'رمز',
    lang_title: 'لغة الواجهة', lang_sub: 'اختر لغتك المفضلة',
    lang_success: 'تم تحديث اللغة',
    notif_title: 'الإشعارات', notif_on: 'الإشعارات مفعّلة على هذا الجهاز', notif_off: 'الإشعارات معطّلة',
    notif_enable: 'تفعيل', notif_enabled_success: 'تم تفعيل إشعارات الدفع!',
    notif_view: 'زيارة جديدة', notif_view_desc: 'تنبيه عند كل مشاهدة للملف الشخصي',
    notif_click: 'نقر على رابط', notif_click_desc: 'تنبيه عند كل نقر',
    notif_expiry: 'انتهاء صلاحية الملف', notif_expiry_desc: 'تذكير قبل انتهاء الصلاحية',
    notif_threshold: 'حد التجميع', notif_threshold_every: 'كل {n} زوار',
    pref_saved: 'تم حفظ التفضيل',
    pref_error: 'خطأ في الحفظ: ',
    loading: 'جارٍ تحميل الإعدادات…',
  },
  pt: {
    eyebrow: 'Conta', title: 'Configurações', session_secure: 'Sessão segura',
    tab_password: 'Segurança', tab_language: 'Idioma', tab_notifications: 'Notificações',
    password_title: 'Alterar senha', password_hint: 'Pelo menos 10 caracteres, com um número e um símbolo',
    password_new: 'Nova senha', password_confirm: 'Confirmar senha',
    password_btn: 'Atualizar senha', password_short: 'Senha muito curta (mín. 6 car.)',
    password_mismatch: 'As senhas não coincidem', password_success: 'Senha atualizada!',
    password_error: 'Erro: ',
    crit_length: '10+ caracteres', crit_number: 'Um número', crit_symbol: 'Um símbolo',
    lang_title: 'Idioma da interface',
    lang_sub: 'Escolha seu idioma preferido', lang_success: 'Idioma atualizado',
    notif_title: 'Notificações', notif_on: 'Push ativadas neste dispositivo', notif_off: 'Push desativadas',
    notif_enable: 'Ativar', notif_enabled_success: 'Notificações push ativadas!',
    notif_view: 'Nova visita', notif_view_desc: 'Alerta a cada visualização de perfil',
    notif_click: 'Clique em link', notif_click_desc: 'Alerta a cada clique',
    notif_expiry: 'Expiração do perfil', notif_expiry_desc: 'Lembrete antes da expiração',
    notif_threshold: 'Limite de agrupamento', notif_threshold_every: 'A cada {n} visitantes',
    pref_saved: 'Preferência salva',
    pref_error: 'Erro ao salvar: ',
    loading: 'Carregando configurações…',
  },
};

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];

const THRESHOLD_STEPS = [1, 5, 10, 25, 50];

const DEFAULT_SETTINGS = {
  language: 'fr',
  notif_view: true,
  notif_click: true,
  notif_expiry: true,
  notif_threshold: 10,
};

const LEGACY_KEYS = {
  language: 'app_language',
  notif_view: 'notif_view',
  notif_click: 'notif_click',
  notif_expiry: 'notif_expiry',
  notif_threshold: 'notif_threshold',
};

function readLegacySettings() {
  try {
    if (localStorage.getItem('legacy_settings_migrated') === 'true') return null;
    const patch = {};
    let found = false;
    if (localStorage.getItem(LEGACY_KEYS.language) !== null) { patch.language = localStorage.getItem(LEGACY_KEYS.language); found = true; }
    if (localStorage.getItem(LEGACY_KEYS.notif_view) !== null) { patch.notif_view = localStorage.getItem(LEGACY_KEYS.notif_view) !== 'false'; found = true; }
    if (localStorage.getItem(LEGACY_KEYS.notif_click) !== null) { patch.notif_click = localStorage.getItem(LEGACY_KEYS.notif_click) !== 'false'; found = true; }
    if (localStorage.getItem(LEGACY_KEYS.notif_expiry) !== null) { patch.notif_expiry = localStorage.getItem(LEGACY_KEYS.notif_expiry) !== 'false'; found = true; }
    if (localStorage.getItem(LEGACY_KEYS.notif_threshold) !== null) {
      const n = parseInt(localStorage.getItem(LEGACY_KEYS.notif_threshold), 10);
      if (!Number.isNaN(n)) { patch.notif_threshold = n; found = true; }
    }
    return found ? patch : null;
  } catch { return null; }
}

function clearLegacySettings() {
  try {
    Object.values(LEGACY_KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.setItem('legacy_settings_migrated', 'true');
  } catch {}
}

// ─── Styles injectés une seule fois : hover/focus/anim que l'inline ne peut pas exprimer.
function GlobalStyles() {
  return (
    <style>{`
      .sp-fade-in { animation: sp-fade-in .4s cubic-bezier(.2,.7,.3,1) both; }
      @keyframes sp-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @media (prefers-reduced-motion: reduce) { .sp-fade-in { animation: none; } }

      .sp-tab { transition: color .15s ease; }
      .sp-tab[data-active="true"] { color: white; }
      .sp-tab:not([data-active="true"]):hover { color: rgba(255,255,255,0.75); }

      .sp-lang-btn { transition: transform .12s ease, border-color .12s ease, background .12s ease; }
      .sp-lang-btn:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.22); }

      .sp-row:hover { background: rgba(255,255,255,0.02); }

      .sp-input, .sp-btn, .sp-lang-btn, .sp-tab, .sp-icon-btn, .sp-slider { outline: none; }
      .sp-input:focus-visible, .sp-btn:focus-visible, .sp-lang-btn:focus-visible,
      .sp-tab:focus-visible, .sp-icon-btn:focus-visible, .sp-slider:focus-visible {
        box-shadow: 0 0 0 2px rgba(139,92,246,0.55);
      }
      .sp-input:focus { border-color: rgba(139,92,246,0.5) !important; background: rgba(255,255,255,0.08) !important; }

      .sp-btn:not(:disabled):hover { filter: brightness(1.08); }
      .sp-btn:not(:disabled):active { transform: translateY(1px); }

      .sp-crit-enter { animation: sp-crit-in .2s ease both; }
      @keyframes sp-crit-in { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }

      .sp-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 100px; background: rgba(255,255,255,0.1); }
      .sp-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
        background: #a78bfa; border: 2px solid #0b0b14; cursor: pointer; margin-top: -6px;
        box-shadow: 0 0 0 3px rgba(167,139,250,0.18), 0 2px 6px rgba(0,0,0,0.4);
      }
      .sp-slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #a78bfa; border: 2px solid #0b0b14; cursor: pointer; }
      .sp-slider::-moz-range-track { height: 4px; border-radius: 100px; background: rgba(255,255,255,0.1); }
    `}</style>
  );
}

function Toggle({ value, onChange, disabled }) {
  return (
    <button
      type="button" className="sp-icon-btn" onClick={() => !disabled && onChange(!value)} disabled={disabled} aria-pressed={value}
      style={{
        width: '42px', height: '24px', borderRadius: '100px',
        background: value ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: disabled ? 'default' : 'pointer', position: 'relative',
        transition: 'background 0.25s', flexShrink: 0, opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute',
        top: '3px', left: value ? '21px' : '3px', transition: 'left 0.22s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </button>
  );
}

function Row({ icon: Icon, label, desc, right }) {
  return (
    <div className="sp-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', transition: 'background .15s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '13px', minWidth: 0, flex: 1 }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color="rgba(255,255,255,0.4)" />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>{label}</p>
          {desc && <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '11.5px', margin: '2px 0 0' }}>{desc}</p>}
        </div>
      </div>
      <div style={{ flexShrink: 0, marginLeft: '12px' }}>{right}</div>
    </div>
  );
}

function Criterion({ met, label }) {
  return (
    <div className="sp-crit-enter" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '15px', height: '15px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: met ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)', transition: 'background .2s ease',
      }}>
        {met ? <Check size={9} color="#22c55e" strokeWidth={3} /> : <X size={9} color="rgba(255,255,255,0.25)" strokeWidth={3} />}
      </div>
      <span style={{ fontSize: '11.5px', color: met ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', transition: 'color .2s ease' }}>{label}</span>
    </div>
  );
}

const CARD_SHADOW = '0 12px 28px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.24)';
const cardStyle = (isRtl) => ({
  background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.022))',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '18px',
  boxShadow: CARD_SHADOW,
  overflow: 'hidden',
  direction: isRtl ? 'rtl' : 'ltr',
});

/**
 * SettingsPanel — fichier unique partagé par le dashboard admin ET le dashboard user.
 * Préférences persistées dans Supabase (table `user_settings`, RLS par user_id),
 * avec cache localStorage namespacé par user.id pour un affichage instantané.
 * Le changement de langue dispatch `app_language_change` (écouté par useLanguage()).
 */
export default function SettingsPanel() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('password');

  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const cacheKey = useRef(null);

  const { language, notif_view: notifView, notif_click: notifClick, notif_expiry: notifExpiry, notif_threshold: threshold } = settings;

  const t = useCallback((key, vars = {}) => {
    const str = (TRANSLATIONS[language] || TRANSLATIONS.fr)[key] || key;
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), str);
  }, [language]);

  const isRtl = language === 'ar';
  const [notifGranted, setNotifGranted] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const criteria = useMemo(() => ({
    length: newPwd.length >= 10,
    number: /[0-9]/.test(newPwd),
    symbol: /[^a-zA-Z0-9]/.test(newPwd),
  }), [newPwd]);

  // ── Chargement initial : identité + cache local + valeurs serveur ──────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) { setLoading(false); return; }

      setUserId(user.id);
      cacheKey.current = `user_settings_${user.id}`;

      try {
        const cached = localStorage.getItem(cacheKey.current);
        if (cached) setSettings(prev => ({ ...prev, ...JSON.parse(cached) }));
      } catch {}

      const { data, error } = await supabase
        .from('user_settings')
        .select('language, notif_view, notif_click, notif_expiry, notif_threshold')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data) {
        setSettings(data);
        try { localStorage.setItem(cacheKey.current, JSON.stringify(data)); } catch {}
        clearLegacySettings();
      } else if (!error && !data) {
        const legacyPatch = readLegacySettings();
        const initial = legacyPatch ? { ...DEFAULT_SETTINGS, ...legacyPatch } : DEFAULT_SETTINGS;

        const { error: insertError } = await supabase.from('user_settings').insert({ user_id: user.id, ...initial });

        if (!insertError) {
          setSettings(initial);
          try { localStorage.setItem(cacheKey.current, JSON.stringify(initial)); } catch {}
          clearLegacySettings();
          if (legacyPatch) {
            window.dispatchEvent(new CustomEvent('app_language_change', { detail: { language: initial.language } }));
          }
        }
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback(async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try { if (cacheKey.current) localStorage.setItem(cacheKey.current, JSON.stringify(next)); } catch {}

    if (!userId) return;
    const { error } = await supabase.from('user_settings').upsert({ user_id: userId, ...next }, { onConflict: 'user_id' });
    if (error) { toast.error(t('pref_error') + error.message); }
  }, [settings, userId, t]);

  const handleLanguageChange = async (code) => {
    await persist({ language: code });
    window.dispatchEvent(new CustomEvent('app_language_change', { detail: { language: code } }));
    toast.success(TRANSLATIONS[code]?.lang_success || 'Language updated');
  };

  const handlePasswordChange = async () => {
    if (!newPwd || newPwd.length < 6) { toast.error(t('password_short')); return; }
    if (newPwd !== confirmPwd) { toast.error(t('password_mismatch')); return; }
    setPwdLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdLoading(false);
    if (error) { toast.error(t('password_error') + error.message); return; }
    toast.success(t('password_success'));
    setNewPwd(''); setConfirmPwd('');
  };

  const saveNotifPref = (key, value) => {
    persist({ [key]: value });
    window.dispatchEvent(new CustomEvent('app_notif_prefs_change', { detail: { key, value } }));
    toast.success(t('pref_saved'));
  };

  const handleThresholdSlide = (rawIndex) => {
    const idx = Math.round(Number(rawIndex));
    const n = THRESHOLD_STEPS[Math.max(0, Math.min(THRESHOLD_STEPS.length - 1, idx))];
    if (n !== threshold) saveNotifPref('notif_threshold', n);
  };
  const thresholdIndex = Math.max(0, THRESHOLD_STEPS.indexOf(threshold));

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '11px 13px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: 'white', fontSize: '12.5px',
    transition: 'border-color .15s ease, background .15s ease',
  };

  const TABS = [
    { key: 'password', icon: ShieldCheck, label: t('tab_password') },
    { key: 'language', icon: Globe, label: t('tab_language') },
    { key: 'notifications', icon: Bell, label: t('tab_notifications') },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '640px' }}>
        <div style={{ height: '32px', width: '160px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ height: '280px', borderRadius: '18px', background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))', backgroundSize: '200% 100%', border: '1px solid rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
          <Loader2 size={14} className="animate-spin" /> {t('loading')}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '640px', direction: isRtl ? 'rtl' : 'ltr' }} className="sp-fade-in">
      <GlobalStyles />

      {/* ── En-tête + statut ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>{t('eyebrow')}</p>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t('title')}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 14px 5px 5px', borderRadius: '100px', background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(34,197,94,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={11} color="#22c55e" strokeWidth={3} />
          </div>
          <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{t('session_secure')}</span>
        </div>
      </div>

      {/* ── Onglets segmentés ── */}
      <div role="tablist" style={{ display: 'flex', gap: '2px', padding: '4px', background: 'rgba(255,255,255,0.035)', borderRadius: '13px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key} role="tab" aria-selected={active} className="sp-tab" data-active={active}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 15px', borderRadius: '10px',
                border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                color: active ? 'white' : 'rgba(255,255,255,0.45)',
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Sécurité / mot de passe ── */}
      {activeTab === 'password' && (
        <div style={cardStyle(isRtl)} className="sp-fade-in">
          <div style={{ padding: '20px 22px 4px' }}>
            <p style={{ color: 'white', fontSize: '15px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>{t('password_title')}</p>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '12px', margin: '4px 0 0' }}>{t('password_hint')}</p>
          </div>
          <form
            autoComplete="off"
            onSubmit={e => { e.preventDefault(); handlePasswordChange(); }}
            style={{ padding: '16px 22px 22px', display: 'flex', flexDirection: 'column', gap: '11px' }}
          >
            <input type="text" name="username-fake" autoComplete="username" style={{ display: 'none' }} readOnly tabIndex={-1} />

            <div style={{ position: 'relative' }}>
              <Lock size={13} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: '13px', pointerEvents: 'none' }} />
              <input
                className="sp-input" type={showPwd ? 'text' : 'password'} name="new-pwd" autoComplete="new-password"
                value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder={t('password_new')}
                style={{ ...inputStyle, [isRtl ? 'paddingRight' : 'paddingLeft']: '34px', [isRtl ? 'paddingLeft' : 'paddingRight']: '34px' }}
              />
              <button
                type="button" className="sp-icon-btn" onClick={() => setShowPwd(s => !s)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'left' : 'right']: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                {showPwd ? <EyeOff size={14} color="rgba(255,255,255,0.4)" /> : <Eye size={14} color="rgba(255,255,255,0.4)" />}
              </button>
            </div>

            {newPwd.length > 0 && (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '2px 2px 4px' }}>
                <Criterion met={criteria.length} label={t('crit_length')} />
                <Criterion met={criteria.number} label={t('crit_number')} />
                <Criterion met={criteria.symbol} label={t('crit_symbol')} />
              </div>
            )}

            <input
              className="sp-input" type={showPwd ? 'text' : 'password'} name="confirm-pwd" autoComplete="new-password"
              value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder={t('password_confirm')}
              style={inputStyle}
            />

            <button
              type="submit" className="sp-btn" disabled={pwdLoading || !newPwd || !confirmPwd}
              style={{
                marginTop: '6px', padding: '11px', borderRadius: '10px', border: 'none',
                background: newPwd && confirmPwd ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)',
                color: newPwd && confirmPwd ? 'white' : 'rgba(255,255,255,0.3)',
                fontSize: '12.5px', fontWeight: 700, letterSpacing: '-0.01em',
                cursor: newPwd && confirmPwd ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                boxShadow: newPwd && confirmPwd ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                transition: 'filter .15s ease, transform .1s ease',
              }}
            >
              {pwdLoading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
              {t('password_btn')}
            </button>
          </form>
        </div>
      )}

      {/* ── Langue ── */}
      {activeTab === 'language' && (
        <div style={cardStyle(isRtl)} className="sp-fade-in">
          <div style={{ padding: '20px 22px 4px' }}>
            <p style={{ color: 'white', fontSize: '15px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>{t('lang_title')}</p>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '12px', margin: '4px 0 0' }}>{t('lang_sub')}</p>
          </div>
          <div style={{ padding: '16px 22px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '9px' }}>
            {LANGUAGES.map(lang => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code} className="sp-lang-btn" onClick={() => handleLanguageChange(lang.code)}
                  style={{
                    position: 'relative', padding: '12px 13px', borderRadius: '12px',
                    border: '1px solid ' + (active ? 'rgba(139,92,246,0.55)' : 'rgba(255,255,255,0.09)'),
                    background: active ? 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(139,92,246,0.1))' : 'rgba(255,255,255,0.03)',
                    boxShadow: active ? '0 4px 14px rgba(99,102,241,0.2)' : 'none',
                    display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '17px', lineHeight: 1 }}>{lang.flag}</span>
                  <span style={{ color: active ? '#c4b5fd' : 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: active ? 700 : 500 }}>{lang.label}</span>
                  {active && <Check size={12} color="#c4b5fd" style={{ position: 'absolute', top: '9px', right: '9px' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Notifications ── */}
      {activeTab === 'notifications' && (
        <div style={cardStyle(isRtl)} className="sp-fade-in">
          <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div>
              <p style={{ color: 'white', fontSize: '15px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>{t('notif_title')}</p>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '12px', margin: '4px 0 0' }}>{notifGranted ? t('notif_on') : t('notif_off')}</p>
            </div>
            {!notifGranted && (
              <button
                className="sp-btn" onClick={async () => {
                  const ok = await subscribeToPush();
                  setNotifGranted(typeof Notification !== 'undefined' && Notification.permission === 'granted');
                  if (ok) toast.success(t('notif_enabled_success'));
                  else toast.error(t('pref_error') + 'abonnement push échoué');
                }}
                style={{ padding: '7px 13px', background: 'rgba(34,197,94,0.13)', border: '1px solid rgba(34,197,94,0.32)', borderRadius: '9px', color: '#22c55e', fontSize: '11px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
              >
                {t('notif_enable')}
              </button>
            )}
          </div>
          <Row icon={Eye}               label={t('notif_view')}   desc={t('notif_view_desc')}   right={<Toggle value={notifView}   onChange={v => saveNotifPref('notif_view',   v)} />} />
          <Row icon={MousePointerClick} label={t('notif_click')}  desc={t('notif_click_desc')}  right={<Toggle value={notifClick}  onChange={v => saveNotifPref('notif_click',  v)} />} />
          <Row icon={CalendarClock}     label={t('notif_expiry')} desc={t('notif_expiry_desc')} right={<Toggle value={notifExpiry} onChange={v => saveNotifPref('notif_expiry', v)} />} />

          <div style={{ padding: '17px 22px 22px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '13px', marginBottom: '14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={14} color="rgba(255,255,255,0.4)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 600, margin: 0 }}>{t('notif_threshold')}</p>
                <p style={{ color: '#a78bfa', fontSize: '11.5px', margin: '2px 0 0', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {t('notif_threshold_every', { n: threshold })}
                </p>
              </div>
            </div>

            <input
              className="sp-slider" type="range" min={0} max={THRESHOLD_STEPS.length - 1} step={1}
              value={thresholdIndex} onChange={e => handleThresholdSlide(e.target.value)}
              style={{ width: '100%', display: 'block' }}
              aria-label={t('notif_threshold')}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              {THRESHOLD_STEPS.map(n => (
                <span key={n} style={{ fontSize: '10.5px', fontVariantNumeric: 'tabular-nums', color: n === threshold ? '#a78bfa' : 'rgba(255,255,255,0.28)', fontWeight: n === threshold ? 700 : 400 }}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}