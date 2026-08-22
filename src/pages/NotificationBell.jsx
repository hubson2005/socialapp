import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../supabase';

// [FIX THÈME CLAIR] Ce composant était entièrement stylé pour un fond sombre
// (bouton translucide blanc, panneau quasi-noir, texte blanc). Sur la
// topbar blanche du dashboard, le bouton cloche et son badge devenaient
// quasi invisibles. Palette basculée sur les mêmes tons que le reste du
// dashboard clair (cartes blanches, bordures #e6e8f0, texte #151329).

// ─── Icône + couleur selon le type de notification ────────────────────────────
const TYPE_CONFIG = {
  info:    { icon: Info,         color: '#0284c7', bg: 'rgba(56,189,248,0.14)' },
  success: { icon: CheckCircle2, color: '#16a34a', bg: 'rgba(34,197,94,0.14)'  },
  warning: { icon: AlertTriangle,color: '#b45309', bg: 'rgba(245,158,11,0.14)' },
  error:   { icon: XCircle,      color: '#dc2626', bg: 'rgba(239,68,68,0.14)'  },
};

function formatTime(isoDate) {
  const d = new Date(isoDate);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1)  return 'À l\'instant';
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return `il y a ${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function NotificationRow({ notif, onMarkRead }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;

  const content = (
    <div
      onClick={() => !notif.is_read && onMarkRead(notif.id)}
      style={{
        display: 'flex', gap: '10px', padding: '11px 12px',
        background: notif.is_read ? 'transparent' : 'rgba(99,102,241,0.07)',
        borderRadius: '12px', cursor: notif.is_read ? 'default' : 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: '30px', height: '30px', borderRadius: '9px', background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={14} color={cfg.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <p style={{ color: notif.is_read ? '#6b6f85' : '#151329', fontSize: '12.5px', fontWeight: notif.is_read ? 500 : 700, margin: 0, lineHeight: 1.4 }}>
            {notif.title}
          </p>
          {!notif.is_read && (
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: '4px' }} />
          )}
        </div>
        {notif.message && (
          <p style={{ color: '#6b6f85', fontSize: '11.5px', margin: '3px 0 0', lineHeight: 1.5 }}>
            {notif.message}
          </p>
        )}
        <p style={{ color: '#9a9db0', fontSize: '10.5px', margin: '5px 0 0' }}>
          {formatTime(notif.created_at)}
        </p>
      </div>
    </div>
  );

  if (notif.link) {
    return <a href={notif.link} style={{ textDecoration: 'none', display: 'block' }}>{content}</a>;
  }
  return content;
}

export default function NotificationBell() {
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [notifGranted, setNotifGranted] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const panelRef = useRef(null);
  const bellRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Chargement initial + identification de l'utilisateur ──────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) { setLoading(false); return; }
      setUserId(user.id);
      await loadNotifications(user.id);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const loadNotifications = async (uid) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(30);
    if (!error) setNotifications(data || []);
  };

  // ── Temps réel : nouvelle notification → ajout instantané + petit toast ───
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        toast(payload.new.title, { description: payload.new.message || undefined });
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Fermeture au clic extérieur ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return;
    const previous = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    if (error) {
      setNotifications(previous);
      toast.error('Erreur : ' + error.message);
    }
  }, [userId, unreadCount, notifications]);

  const requestPushPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setNotifGranted(p === 'granted');
    if (p === 'granted') toast.success('Notifications navigateur activées !');
    else if (p === 'denied') toast.error('Permission refusée par le navigateur');
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={bellRef}
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative', width: '38px', height: '38px', borderRadius: '11px',
          background: open ? '#ede9fe' : '#eef0f6',
          border: '1px solid ' + (open ? '#c7cdfb' : '#e6e8f0'),
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <Bell size={16} color={open ? '#7c3aed' : '#6b6f85'} />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: '-4px', right: '-4px', minWidth: '17px', height: '17px',
            borderRadius: '9px', background: '#ef4444', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '0 4px', border: '2px solid #ffffff',
          }}>
            <span style={{ color: 'white', fontSize: '9px', fontWeight: 700, lineHeight: 1 }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              background: '#ffffff',
              border: '1px solid #e6e8f0', borderRadius: '18px',
              width: '340px', maxWidth: '90vw', zIndex: 50,
              boxShadow: '0 16px 48px rgba(15,23,42,0.16)', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 14px 10px' }}>
              <span style={{ color: '#151329', fontSize: '13px', fontWeight: 700 }}>
                Notifications {unreadCount > 0 && <span style={{ color: '#7c3aed' }}>({unreadCount})</span>}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} title="Tout marquer comme lu"
                    style={{ background: '#f1f2f7', border: 'none', cursor: 'pointer', color: '#6b7280', width: '26px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCheck size={13} />
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  style={{ background: '#f1f2f7', border: 'none', cursor: 'pointer', color: '#6b7280', width: '26px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0 8px 8px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9a9db0', fontSize: '12px' }}>
                  Chargement…
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: '#9a9db0', fontSize: '12px' }}>
                  <Bell size={22} color="#c7cdfb" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0 }}>Aucune notification pour le moment</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {notifications.map(n => (
                    <NotificationRow key={n.id} notif={n} onMarkRead={markAsRead} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer : activer les notifications navigateur (optionnel) */}
            {!notifGranted && (
              <div style={{ borderTop: '1px solid #e6e8f0', padding: '10px 14px' }}>
                <button onClick={requestPushPermission} style={{
                  width: '100%', padding: '9px', background: 'rgba(99,102,241,0.08)',
                  border: '1px dashed rgba(99,102,241,0.35)', borderRadius: '10px',
                  color: '#7c3aed', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <Bell size={12} /> Activer les alertes navigateur
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}