import React, { useState } from 'react';
import {
  Loader2, ShieldCheck, Globe, Bell, Eye, MousePointerClick,
  CalendarClock, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';

// ─── Traductions (paramètres uniquement) ─────────────────────────────────────
const TRANSLATIONS = {
  fr: {
    title: 'Paramètres', subtitle: 'Sécurité, langue et préférences de notification',
    password_title: 'Changer le mot de passe', password_sub: 'Sécurisez votre compte',
    password_new: 'Nouveau mot de passe', password_confirm: 'Confirmer le mot de passe',
    password_btn: 'Mettre à jour le mot de passe',
    password_short: 'Mot de passe trop court (6 car. min)',
    password_mismatch: 'Les mots de passe ne correspondent pas',
    password_success: 'Mot de passe mis à jour !', password_error: 'Erreur : ',
    lang_title: "Langue de l'interface", lang_sub: 'Choisissez votre langue préférée',
    lang_success: 'Langue mise à jour — rechargement du dashboard',
    notif_title: 'Notifications', notif_on: '🟢 Push activées', notif_off: '🔴 Push désactivées',
    notif_enable: 'Activer', notif_enabled_success: 'Notifications push activées !',
    notif_view: 'Nouvelle visite', notif_view_desc: 'Alerte à chaque vue de profil',
    notif_click: 'Clic sur un lien', notif_click_desc: "Alerte lors d'un clic",
    notif_expiry: 'Expiration du profil', notif_expiry_desc: 'Rappel avant expiration',
    notif_threshold: 'Seuil de regroupement', notif_threshold_desc: 'Notifier tous les {n} visiteurs',
    pref_saved: 'Préférence sauvegardée',
  },
  en: {
    title: 'Settings', subtitle: 'Security, language and notification preferences',
    password_title: 'Change password', password_sub: 'Secure your account',
    password_new: 'New password', password_confirm: 'Confirm password',
    password_btn: 'Update password', password_short: 'Password too short (6 chars min)',
    password_mismatch: 'Passwords do not match', password_success: 'Password updated!',
    password_error: 'Error: ', lang_title: 'Interface language',
    lang_sub: 'Choose your preferred language', lang_success: 'Language updated',
    notif_title: 'Notifications', notif_on: '🟢 Push enabled', notif_off: '🔴 Push disabled',
    notif_enable: 'Enable', notif_enabled_success: 'Push notifications enabled!',
    notif_view: 'New visit', notif_view_desc: 'Alert on each profile view',
    notif_click: 'Link click', notif_click_desc: 'Alert on each link click',
    notif_expiry: 'Profile expiration', notif_expiry_desc: 'Reminder before expiration',
    notif_threshold: 'Grouping threshold', notif_threshold_desc: 'Notify every {n} visitors',
    pref_saved: 'Preference saved',
  },
  es: {
    title: 'Configuración', subtitle: 'Seguridad, idioma y preferencias de notificación',
    password_title: 'Cambiar contraseña', password_sub: 'Asegure su cuenta',
    password_new: 'Nueva contraseña', password_confirm: 'Confirmar contraseña',
    password_btn: 'Actualizar contraseña', password_short: 'Contraseña demasiado corta (mín. 6 car.)',
    password_mismatch: 'Las contraseñas no coinciden', password_success: '¡Contraseña actualizada!',
    password_error: 'Error: ', lang_title: 'Idioma de la interfaz',
    lang_sub: 'Elige tu idioma preferido', lang_success: 'Idioma actualizado',
    notif_title: 'Notificaciones', notif_on: '🟢 Push activadas', notif_off: '🔴 Push desactivadas',
    notif_enable: 'Activar', notif_enabled_success: '¡Notificaciones push activadas!',
    notif_view: 'Nueva visita', notif_view_desc: 'Alerta en cada vista de perfil',
    notif_click: 'Clic en enlace', notif_click_desc: 'Alerta en cada clic',
    notif_expiry: 'Expiración de perfil', notif_expiry_desc: 'Recordatorio antes de expirar',
    notif_threshold: 'Umbral de agrupación', notif_threshold_desc: 'Notificar cada {n} visitantes',
    pref_saved: 'Preferencia guardada',
  },
  ar: {
    title: 'الإعدادات', subtitle: 'الأمان واللغة وتفضيلات الإشعارات',
    password_title: 'تغيير كلمة المرور', password_sub: 'حماية حسابك',
    password_new: 'كلمة المرور الجديدة', password_confirm: 'تأكيد كلمة المرور',
    password_btn: 'تحديث كلمة المرور', password_short: 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)',
    password_mismatch: 'كلمتا المرور غير متطابقتين', password_success: 'تم تحديث كلمة المرور!',
    password_error: 'خطأ: ', lang_title: 'لغة الواجهة', lang_sub: 'اختر لغتك المفضلة',
    lang_success: 'تم تحديث اللغة',
    notif_title: 'الإشعارات', notif_on: '🟢 الإشعارات مفعّلة', notif_off: '🔴 الإشعارات معطّلة',
    notif_enable: 'تفعيل', notif_enabled_success: 'تم تفعيل إشعارات الدفع!',
    notif_view: 'زيارة جديدة', notif_view_desc: 'تنبيه عند كل مشاهدة للملف الشخصي',
    notif_click: 'نقر على رابط', notif_click_desc: 'تنبيه عند كل نقر',
    notif_expiry: 'انتهاء صلاحية الملف', notif_expiry_desc: 'تذكير قبل انتهاء الصلاحية',
    notif_threshold: 'حد التجميع', notif_threshold_desc: 'إشعار كل {n} زوار',
    pref_saved: 'تم حفظ التفضيل',
  },
  pt: {
    title: 'Configurações', subtitle: 'Segurança, idioma e preferências de notificação',
    password_title: 'Alterar senha', password_sub: 'Proteja sua conta',
    password_new: 'Nova senha', password_confirm: 'Confirmar senha',
    password_btn: 'Atualizar senha', password_short: 'Senha muito curta (mín. 6 car.)',
    password_mismatch: 'As senhas não coincidem', password_success: 'Senha atualizada!',
    password_error: 'Erro: ', lang_title: 'Idioma da interface',
    lang_sub: 'Escolha seu idioma preferido', lang_success: 'Idioma atualizado',
    notif_title: 'Notificações', notif_on: '🟢 Push ativadas', notif_off: '🔴 Push desativadas',
    notif_enable: 'Ativar', notif_enabled_success: 'Notificações push ativadas!',
    notif_view: 'Nova visita', notif_view_desc: 'Alerta a cada visualização de perfil',
    notif_click: 'Clique em link', notif_click_desc: 'Alerta a cada clique',
    notif_expiry: 'Expiração do perfil', notif_expiry_desc: 'Lembrete antes da expiração',
    notif_threshold: 'Limite de agrupamento', notif_threshold_desc: 'Notificar a cada {n} visitantes',
    pref_saved: 'Preferência salva',
  },
};

const LANGUAGES = [
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'ar', label: '🇲🇦 العربية' },
  { code: 'pt', label: '🇧🇷 Português' },
];

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width: '44px', height: '24px', borderRadius: '100px', background: value ? '#6366f1' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: value ? '23px' : '3px', transition: 'left 0.3s' }} />
    </button>
  );
}

function Row({ icon: Icon, label, desc, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
        <Icon size={15} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500, margin: 0 }}>{label}</p>
          {desc && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0' }}>{desc}</p>}
        </div>
      </div>
      <div style={{ flexShrink: 0, marginLeft: '12px' }}>{right}</div>
    </div>
  );
}

/**
 * UserSettingsPanel — utilisable dans les deux dashboards.
 * La section "profils" a été retirée : elle appartient à la section "Profils" dédiée.
 *
 * Le changement de langue dispatch `app_language_change` →
 * le hook `useLanguage()` dans chaque dashboard re-rend l'interface entière.
 */
export default function UserSettingsPanel() {
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [pwdLoading,  setPwdLoading]  = useState(false);
  const [language,    setLanguage]    = useState(() => {
    try { return localStorage.getItem('app_language') || 'fr'; } catch { return 'fr'; }
  });
  const [notifView,   setNotifView]   = useState(() => {
    try { return localStorage.getItem('notif_view')   !== 'false'; } catch { return true; }
  });
  const [notifClick,  setNotifClick]  = useState(() => {
    try { return localStorage.getItem('notif_click')  !== 'false'; } catch { return true; }
  });
  const [notifExpiry, setNotifExpiry] = useState(() => {
    try { return localStorage.getItem('notif_expiry') !== 'false'; } catch { return true; }
  });
  const [threshold,   setThreshold]   = useState(() => {
    try { return parseInt(localStorage.getItem('notif_threshold') || '10'); } catch { return 10; }
  });

  const t = (key, vars = {}) => {
    const str = (TRANSLATIONS[language] || TRANSLATIONS.fr)[key] || key;
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), str);
  };

  const isRtl = language === 'ar';
  const notifGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';

  // ── Changement de langue : persiste + propage à tout le dashboard ──────────
  const handleLanguageChange = (code) => {
    setLanguage(code);
    try { localStorage.setItem('app_language', code); } catch {}
    // L'event est capté par useLanguage() dans chaque dashboard → re-render global
    window.dispatchEvent(new CustomEvent('app_language_change', { detail: { language: code } }));
    toast.success(TRANSLATIONS[code]?.lang_success || 'Language updated');
  };

  const handlePasswordChange = async () => {
    if (!newPwd || newPwd.length < 6) { toast.error(t('password_short')); return; }
    if (newPwd !== confirmPwd)        { toast.error(t('password_mismatch')); return; }
    setPwdLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdLoading(false);
    if (error) { toast.error(t('password_error') + error.message); return; }
    toast.success(t('password_success'));
    setNewPwd(''); setConfirmPwd('');
  };

  const saveNotifPref = (key, value) => {
    if (key === 'view')      { setNotifView(value);   try { localStorage.setItem('notif_view',      String(value)); } catch {} }
    if (key === 'click')     { setNotifClick(value);  try { localStorage.setItem('notif_click',     String(value)); } catch {} }
    if (key === 'expiry')    { setNotifExpiry(value); try { localStorage.setItem('notif_expiry',    String(value)); } catch {} }
    if (key === 'threshold') { setThreshold(value);   try { localStorage.setItem('notif_threshold', String(value)); } catch {} }
    toast.success(t('pref_saved'));
  };

  const sectionStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '18px',
    overflow: 'hidden',
    direction: isRtl ? 'rtl' : 'ltr',
  };

  const sectionHeader = { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px', direction: isRtl ? 'rtl' : 'ltr' }}>

      <div>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>{t('title')}</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>{t('subtitle')}</p>
      </div>

      {/* ── Mot de passe ── */}
      <div style={sectionStyle}>
        <div style={sectionHeader}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={15} color="#a78bfa" />
          </div>
          <div>
            <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: 0 }}>{t('password_title')}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0' }}>{t('password_sub')}</p>
          </div>
        </div>
        <form autoComplete="off" onSubmit={e => { e.preventDefault(); handlePasswordChange(); }}
          style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: '9px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <input type="text" name="username-fake" autoComplete="username" style={{ display: 'none' }} readOnly tabIndex={-1} />
          <input type="password" name="new-pwd" autoComplete="new-password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder={t('password_new')}
            style={{ marginTop: '8px', width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '12px', outline: 'none' }} />
          <input type="password" name="confirm-pwd" autoComplete="new-password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder={t('password_confirm')}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '12px', outline: 'none' }} />
          <button type="submit" disabled={pwdLoading || !newPwd || !confirmPwd}
            style={{ marginTop: '4px', padding: '10px', background: newPwd && confirmPwd ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '10px', color: newPwd && confirmPwd ? 'white' : 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 600, cursor: newPwd && confirmPwd ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {pwdLoading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
            {t('password_btn')}
          </button>
        </form>
      </div>

      {/* ── Langue ── */}
      <div style={sectionStyle}>
        <div style={sectionHeader}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={15} color="#38bdf8" />
          </div>
          <div>
            <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: 0 }}>{t('lang_title')}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0' }}>{t('lang_sub')}</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {LANGUAGES.map(lang => (
            <button key={lang.code} onClick={() => handleLanguageChange(lang.code)}
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid ' + (language === lang.code ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)'), background: language === lang.code ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)', color: language === lang.code ? '#38bdf8' : 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: language === lang.code ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notifications ── */}
      <div style={sectionStyle}>
        <div style={{ ...sectionHeader, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={15} color="#22c55e" />
            </div>
            <div>
              <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: 0 }}>{t('notif_title')}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0' }}>{notifGranted ? t('notif_on') : t('notif_off')}</p>
            </div>
          </div>
          {!notifGranted && (
            <button onClick={async () => { const p = await Notification.requestPermission(); if (p === 'granted') toast.success(t('notif_enabled_success')); }}
              style={{ padding: '7px 12px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '9px', color: '#22c55e', fontSize: '11px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              {t('notif_enable')}
            </button>
          )}
        </div>
        <Row icon={Eye}               label={t('notif_view')}   desc={t('notif_view_desc')}   right={<Toggle value={notifView}   onChange={v => saveNotifPref('view',   v)} />} />
        <Row icon={MousePointerClick} label={t('notif_click')}  desc={t('notif_click_desc')}  right={<Toggle value={notifClick}  onChange={v => saveNotifPref('click',  v)} />} />
        <Row icon={CalendarClock}     label={t('notif_expiry')} desc={t('notif_expiry_desc')} right={<Toggle value={notifExpiry} onChange={v => saveNotifPref('expiry', v)} />} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <Activity size={15} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500, margin: 0 }}>{t('notif_threshold')}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0' }}
                dangerouslySetInnerHTML={{ __html: t('notif_threshold_desc', { n: `<strong style="color:#a78bfa">${threshold}</strong>` }) }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            {[1, 5, 10, 25, 50].map(n => (
              <button key={n} onClick={() => saveNotifPref('threshold', n)}
                style={{ width: '30px', height: '28px', borderRadius: '8px', border: '1px solid ' + (threshold === n ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)'), background: threshold === n ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)', color: threshold === n ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: threshold === n ? 700 : 400, cursor: 'pointer' }}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

