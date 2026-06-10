// ─── WhatsAppPanel.jsx ────────────────────────────────────────────────────────
// Phase 5 — Notifications WhatsApp Business
// Place ce fichier dans src/components/dashboard/WhatsAppPanel.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase';
import { toast } from 'sonner';
import {
  MessageCircle, Check, X, Loader2, Bell, BellOff,
  Send, Phone, CheckCircle, XCircle, Clock, Zap,
  Users, TrendingUp, RefreshCw, Eye,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── Templates de messages ────────────────────────────────────────────────────
const MESSAGE_TEMPLATES = {
  boost_activated: (profile, boost) =>
    `🚀 *Félicitations ${profile.display_name} !*\n\n` +
    `Votre profil SocialApp est maintenant *sponsorisé* sur ${(boost.networks || []).join(', ')}.\n\n` +
    `✅ Offre : *${boost.boost_type}*\n` +
    `📅 Durée : *${boost.duration_days} jours*\n` +
    `🌐 Votre profil : https://socialapp.work/${profile.username || 'profil'}\n\n` +
    `Suivez vos statistiques en temps réel sur votre dashboard.\n` +
    `👉 socialapp.work/dashboard`,

  boost_completed: (profile, boost) =>
    `📊 *Rapport de fin de boost*\n\n` +
    `Bonjour ${profile.display_name},\n\n` +
    `Votre boost *${boost.boost_type}* est terminé.\n\n` +
    `🎯 Résultats disponibles dans votre dashboard :\n` +
    `👉 socialapp.work/dashboard\n\n` +
    `Relancez un boost pour maintenir votre visibilité ! 🚀`,

  new_lead: (profile, lead) =>
    `🔥 *Nouveau prospect détecté !*\n\n` +
    `Bonjour ${profile.display_name},\n\n` +
    `Un visiteur a manifesté de l'intérêt pour votre profil.\n\n` +
    `👤 *${lead.name || 'Contact'}*\n` +
    (lead.email ? `📧 ${lead.email}\n` : '') +
    (lead.phone ? `📞 ${lead.phone}\n` : '') +
    `\nVoir tous vos leads :\n👉 socialapp.work/dashboard`,

  view_milestone: (profile, count) =>
    `👀 *${count} vues sur votre profil !*\n\n` +
    `Bonjour ${profile.display_name},\n\n` +
    `Votre profil SocialApp vient d'atteindre *${count} visites*.\n\n` +
    `🌐 https://socialapp.work/${profile.username || 'profil'}\n\n` +
    `Boostez votre visibilité pour encore plus de résultats ! 🚀`,

  weekly_report: (profile, stats) =>
    `📈 *Rapport hebdomadaire SocialApp*\n\n` +
    `Bonjour ${profile.display_name},\n\n` +
    `Voici vos stats de la semaine :\n\n` +
    `👁️ Vues profil : *${stats.views}*\n` +
    `🔗 Clics liens : *${stats.clicks}*\n` +
    `🔥 Nouveaux leads : *${stats.leads}*\n\n` +
    `Dashboard complet :\n👉 socialapp.work/dashboard`,
};

// ─── NotifToggle ──────────────────────────────────────────────────────────────
function NotifToggle({ label, desc, icon: Icon, color, value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px',
      background: value ? color + '0d' : 'rgba(255,255,255,0.03)',
      border: '1px solid ' + (value ? color + '33' : 'rgba(255,255,255,0.07)'),
      borderRadius: '14px', transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: value ? color + '22' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={value ? color : 'rgba(255,255,255,0.3)'} />
        </div>
        <div>
          <p style={{ color: 'white', fontSize: '12px', fontWeight: 700, margin: 0 }}>{label}</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>{desc}</p>
        </div>
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: '42px', height: '23px', borderRadius: '100px',
        background: value ? color : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s', flexShrink: 0,
      }}>
        <div style={{ width: '17px', height: '17px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: value ? '22px' : '3px', transition: 'left 0.25s' }} />
      </button>
    </div>
  );
}

// ─── NotifHistoryItem ─────────────────────────────────────────────────────────
function NotifHistoryItem({ notif }) {
  const statusColor = { pending: '#f59e0b', sent: '#22c55e', failed: '#ef4444', delivered: '#6366f1' };
  const statusIcon = { pending: Clock, sent: Check, failed: XCircle, delivered: CheckCircle };
  const StatusIcon = statusIcon[notif.status] || Clock;
  const typeLabel = {
    boost_activated: '🚀 Boost activé',
    boost_completed: '📊 Boost terminé',
    new_lead: '🔥 Nouveau lead',
    view_milestone: '👀 Jalon de vues',
    weekly_report: '📈 Rapport hebdo',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
    }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FaWhatsapp size={14} color="#25d366" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'white', fontSize: '12px', fontWeight: 600, margin: 0 }}>
          {typeLabel[notif.notification_type] || notif.notification_type}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '2px 0 0' }}>
          {notif.recipient_phone} · {new Date(notif.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <StatusIcon size={11} color={statusColor[notif.status] || '#f59e0b'} />
        <span style={{ color: statusColor[notif.status] || '#f59e0b', fontSize: '10px', fontWeight: 600, textTransform: 'capitalize' }}>{notif.status}</span>
      </div>
    </div>
  );
}

// ─── WhatsAppPanel principal ──────────────────────────────────────────────────
export default function WhatsAppPanel({ profile, onUpdate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testType, setTestType] = useState('boost_activated');
  const [phone, setPhone] = useState(profile?.whatsapp_phone || '');
  const [notifyLead, setNotifyLead] = useState(profile?.notify_new_lead ?? true);
  const [notifyBoost, setNotifyBoost] = useState(profile?.notify_boost ?? true);
  const [notifyWeekly, setNotifyWeekly] = useState(profile?.notify_weekly ?? true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('wa_boost_notifications')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(data || []);
      setLoading(false);
    })();
  }, [profile?.id]);

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      await supabase.from('link_profiles').update({
        whatsapp_phone: phone,
        notify_new_lead: notifyLead,
        notify_boost: notifyBoost,
        notify_weekly: notifyWeekly,
      }).eq('id', profile.id);
      onUpdate?.({ whatsapp_phone: phone, notify_new_lead: notifyLead, notify_boost: notifyBoost, notify_weekly: notifyWeekly });
      toast.success('✅ Préférences WhatsApp sauvegardées !');
    } catch (err) {
      toast.error('Erreur : ' + err.message);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSendTest = async () => {
    const target = testPhone || phone;
    if (!target) { toast.error('Entrez un numéro WhatsApp'); return; }
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const fakeBoost = { boost_type: 'standard', networks: ['facebook', 'instagram'], duration_days: 7 };
      const message = MESSAGE_TEMPLATES[testType]?.(profile, fakeBoost) || 'Test SocialApp';

      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ phone: target, message, profile_id: profile.id, notification_type: testType }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('✅ Message WhatsApp envoyé !');
        setNotifications(prev => [{ id: Date.now(), notification_type: testType, recipient_phone: target, status: 'sent', created_at: new Date().toISOString() }, ...prev]);
      } else {
        throw new Error(result.error || 'Erreur envoi');
      }
    } catch (err) {
      toast.error('Erreur : ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length,
    failed: notifications.filter(n => n.status === 'failed').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '680px' }}>

      {/* Header */}
      <div>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>
          <FaWhatsapp style={{ display: 'inline', marginRight: '8px', color: '#25d366' }} />
          WhatsApp Business
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
          Notifications automatiques pour vos boosts et leads
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
        {[
          ['Envoyées', stats.total, Send, '#25d366'],
          ['Livrées', stats.sent, CheckCircle, '#6366f1'],
          ['Échecs', stats.failed, XCircle, '#ef4444'],
        ].map(([label, value, Icon, color]) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600 }}>{label.toUpperCase()}</span>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={12} color={color} />
              </div>
            </div>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 900 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Configuration téléphone */}
      <div style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={14} color="#25d366" />
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 800, margin: 0 }}>Numéro WhatsApp</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>+</span>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="225XXXXXXXXXX (avec indicatif)"
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px 11px 26px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: 'white', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <button onClick={handleSavePrefs} disabled={savingPrefs} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '11px 18px', background: '#25d366', border: 'none', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            {savingPrefs ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Sauvegarder
          </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>
          Format international sans le + : ex. 2250700000000 pour la Côte d'Ivoire
        </p>
      </div>

      {/* Préférences notifications */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Bell size={14} color="rgba(255,255,255,0.5)" />
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 800, margin: 0 }}>Notifications automatiques</h3>
        </div>
        <NotifToggle label="Nouveau lead" desc="Alerte dès qu'un visiteur devient prospect" icon={Users} color="#f59e0b" value={notifyLead} onChange={setNotifyLead} />
        <NotifToggle label="Boost activé / terminé" desc="Confirmation et rapport de fin de boost" icon={Zap} color="#25d366" value={notifyBoost} onChange={setNotifyBoost} />
        <NotifToggle label="Rapport hebdomadaire" desc="Stats de la semaine chaque lundi matin" icon={TrendingUp} color="#6366f1" value={notifyWeekly} onChange={setNotifyWeekly} />
      </div>

      {/* Test d'envoi */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Send size={14} color="rgba(255,255,255,0.5)" />
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 800, margin: 0 }}>Tester l'envoi</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, margin: '0 0 5px' }}>TYPE DE MESSAGE</p>
            <select value={testType} onChange={e => setTestType(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '12px', outline: 'none' }}>
              <option value="boost_activated" style={{ background: '#0a0817' }}>🚀 Boost activé</option>
              <option value="boost_completed" style={{ background: '#0a0817' }}>📊 Boost terminé</option>
              <option value="new_lead" style={{ background: '#0a0817' }}>🔥 Nouveau lead</option>
              <option value="view_milestone" style={{ background: '#0a0817' }}>👀 Jalon de vues</option>
              <option value="weekly_report" style={{ background: '#0a0817' }}>📈 Rapport hebdo</option>
            </select>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, margin: '0 0 5px' }}>NUMÉRO (optionnel)</p>
            <input type="tel" value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder={phone || '225XXXXXXXXXX'} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '12px', outline: 'none' }} />
          </div>
        </div>

        {/* Aperçu du message */}
        <div style={{ background: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.12)', borderRadius: '12px', padding: '12px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, margin: '0 0 6px' }}>APERÇU DU MESSAGE</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-line' }}>
            {MESSAGE_TEMPLATES[testType]?.(profile, { boost_type: 'standard', networks: ['facebook', 'instagram'], duration_days: 7 }) || ''}
          </p>
        </div>

        <button onClick={handleSendTest} disabled={sending || (!phone && !testPhone)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '12px', background: (!phone && !testPhone) ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#25d366,#128c7e)', border: 'none', borderRadius: '12px', color: (!phone && !testPhone) ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '13px', fontWeight: 700, cursor: (!phone && !testPhone) ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
          {sending ? <Loader2 size={14} className="animate-spin" /> : <FaWhatsapp size={14} />}
          {sending ? 'Envoi en cours…' : 'Envoyer le test WhatsApp'}
        </button>
      </div>

      {/* Historique */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={14} color="rgba(255,255,255,0.4)" />
            <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 800, margin: 0 }}>Historique</h3>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{notifications.length} notification(s)</span>
        </div>
        {loading
          ? <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 size={16} className="animate-spin" color="rgba(255,255,255,0.3)" /></div>
          : notifications.length === 0
            ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', padding: '16px', margin: 0 }}>Aucune notification envoyée</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {notifications.map(n => <NotifHistoryItem key={n.id} notif={n} />)}
              </div>
        }
      </div>
    </div>
  );
}