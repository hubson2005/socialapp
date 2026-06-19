// src/hooks/useWhatsappCRM.js
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ENV_WEBHOOK = import.meta.env.VITE_MAKE_WEBHOOK_URL || ''

// ── Templates de notifications Boost (automatisations) ─────────────
export const BOOST_NOTIF_TEMPLATES = [
  {
    id: 'boost_new_follower',
    label: 'Nouveau follower',
    trigger_type: 'new_follower',
    message: '🎉 Bonjour {{nom}} ! Vous avez un nouveau follower sur SocialApp. Consultez votre profil : {{lien}}',
  },
  {
    id: 'boost_promo_active',
    label: 'Boost activé',
    trigger_type: 'boost_active',
    message: '🚀 Salut {{nom}} ! Votre boost est en ligne. Suivez vos résultats ici : {{lien}}',
  },
  {
    id: 'boost_expiry',
    label: 'Boost expiré',
    trigger_type: 'boost_expired',
    message: '⏳ Bonjour {{nom}}, votre boost SocialApp a expiré. Renouvelez-le ici : {{lien}}',
  },
  {
    id: 'boost_payment_confirm',
    label: 'Paiement confirmé',
    trigger_type: 'payment_confirmed',
    message: '✅ Paiement reçu ! Votre boost {{plan}} est activé. Merci {{nom}} 🙏',
  },
  {
    id: 'boost_payment_failed',
    label: 'Paiement échoué',
    trigger_type: 'payment_failed',
    message: '❌ Bonjour {{nom}}, votre paiement n\'a pas abouti. Réessayez ici : {{lien}}',
  },
]

// ── Générateurs de messages pour les notifications de boost ────────
export const BOOST_NOTIF_BUILDERS = {
  boost_activated: (profile, boost) =>
    `🚀 Salut ${profile?.display_name || ''} ! Votre boost est activé sur ${boost?.networks?.join(', ') || 'vos réseaux'} pour ${boost?.duration_days || ''} jours.`,
  boost_completed: (profile) =>
    `📊 Salut ${profile?.display_name || ''}, votre boost SocialApp est terminé. Consultez vos résultats sur votre dashboard !`,
  new_lead: (profile, lead) =>
    `🔥 Nouveau lead pour ${profile?.display_name || ''} : ${lead?.name || ''} (${lead?.phone || lead?.email || ''})`,
  view_milestone: (profile, count) =>
    `👀 Bravo ${profile?.display_name || ''} ! Votre profil vient d'atteindre ${count} vues.`,
  weekly_report: (profile, stats) =>
    `📈 Rapport hebdo ${profile?.display_name || ''} : ${stats?.views || 0} vues, ${stats?.clicks || 0} clics, ${stats?.leads || 0} leads.`,
}

export function useWhatsappCRM(profileId) {
  const [contacts,    setContacts]    = useState([])
  const [campaigns,   setCampaigns]   = useState([])
  const [notifs,      setNotifs]      = useState([])
  const [webhook,     setWebhook]     = useState(ENV_WEBHOOK)
  const [connected,   setConnected]   = useState(!!ENV_WEBHOOK)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [boostNotifs, setBoostNotifs] = useState([])

  // ── Computed stats ─────────────────────────────────────────────
  const stats = {
    totalContacts:   contacts.length,
    activeContacts:  contacts.filter(c => c.status === 'actif').length,
    sentCampaigns:   campaigns.filter(c => c.status === 'envoyé').length,
    totalMessages:   campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0),
    activeNotifs:    notifs.filter(n => n.active).length,
    boostNotifsSent: boostNotifs.length,
  }

  // ── Load all data ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [cRes, camRes, nRes, wRes, bnRes] = await Promise.all([
          supabase.from('whatsapp_contacts').select('*').order('created_at', { ascending: false }),
          supabase.from('whatsapp_campaigns').select('*').order('created_at', { ascending: false }),
          supabase.from('whatsapp_notifications').select('*').order('created_at', { ascending: false }),
          supabase.from('whatsapp_settings').select('*').limit(1).maybeSingle(),
          profileId
            ? supabase.from('wa_boost_notifications').select('*').eq('profile_id', profileId).order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null }),
        ])

        if (cRes.error   && cRes.error.code !== 'PGRST116') throw cRes.error
        if (camRes.error && camRes.error.code !== 'PGRST116') throw camRes.error
        if (nRes.error   && nRes.error.code !== 'PGRST116') throw nRes.error
        if (bnRes.error  && bnRes.error.code !== 'PGRST116') throw bnRes.error

        setContacts(cRes.data   || [])
        setCampaigns(camRes.data || [])
        setNotifs(nRes.data     || [])
        setBoostNotifs(bnRes.data || [])

        // Priorité : webhook sauvegardé en DB > variable d'env
        const dbWebhook = wRes.data?.webhook_url || ''
        const activeWebhook = dbWebhook || ENV_WEBHOOK
        setWebhook(activeWebhook)
        setConnected(!!activeWebhook)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profileId])

  // ── Add contact ────────────────────────────────────────────────
  const addContact = async ({ name, phone, email, tag }) => {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .insert([{ name, phone, email: email || null, tag, status: 'actif' }])
      .select()
      .maybeSingle()
    if (error) throw error
    setContacts(prev => [data, ...prev])
    return data
  }

  // ── Send message (via Make.com webhook) ───────────────────────
  const sendMessage = async ({ to, name, message }) => {
    const wh = webhook || ENV_WEBHOOK
    if (!wh) return { reason: 'no_webhook' }
    try {
      await fetch(wh, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, name, message }),
      })
      await supabase.from('whatsapp_messages').insert([{
        contact_phone: to,
        message,
        direction: 'out',
      }])
      return { reason: 'sent' }
    } catch (e) {
      throw new Error('Erreur envoi : ' + e.message)
    }
  }

  // ── Create & launch campaign ───────────────────────────────────
  const createCampaign = async ({ name, message, recipientIds }) => {
    const recipients = contacts.filter(c => recipientIds.includes(c.id))
    const wh = webhook || ENV_WEBHOOK

    const { data: cam, error: camErr } = await supabase
      .from('whatsapp_campaigns')
      .insert([{
        name,
        message,
        status: 'envoyé',
        sent_count: recipients.length,
        read_count: 0,
        launched_at: new Date().toISOString(),
      }])
      .select()
      .maybeSingle()
    if (camErr) throw camErr

    if (wh) {
      await Promise.allSettled(
        recipients.map(c =>
          fetch(wh, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: c.phone, name: c.name, message }),
          })
        )
      )
    }

    setCampaigns(prev => [cam, ...prev])
    return cam
  }

  // ── Add notification / automation ─────────────────────────────
  const addNotification = async ({ name, trigger_type }) => {
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .insert([{ name, trigger_type, active: true }])
      .select()
      .maybeSingle()
    if (error) throw error
    setNotifs(prev => [data, ...prev])
    return data
  }

  // ── Toggle notification active state ──────────────────────────
  const toggleNotification = async (id, currentActive) => {
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .update({ active: !currentActive })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw error
    setNotifs(prev => prev.map(n => n.id === id ? data : n))
  }

  // ── Save webhook URL ───────────────────────────────────────────
  const saveWebhook = async (url) => {
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr) throw userErr
    const { error } = await supabase
      .from('whatsapp_settings')
      .upsert([{ user_id: userData.user.id, webhook_url: url }], { onConflict: 'user_id' })
    if (error) throw error
    setWebhook(url)
    setConnected(!!url)
  }

  // ── Send boost notification (Make.com webhook + log) ───────────
  const sendBoostNotification = async ({ profile, boost, notificationType, recipientPhone }) => {
    const buildMsg = BOOST_NOTIF_BUILDERS[notificationType]
    const message = buildMsg
      ? buildMsg(profile, boost)
      : `Notification SocialApp : ${notificationType}`

    const wh = webhook || ENV_WEBHOOK
    let status = 'failed'
    let errorMessage = null

    if (wh) {
      try {
        await fetch(wh, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: recipientPhone, name: profile?.display_name, message }),
        })
        status = 'sent'
      } catch (e) {
        errorMessage = e.message
      }
    } else {
      errorMessage = 'no_webhook'
    }

    const { data, error } = await supabase
      .from('wa_boost_notifications')
      .insert([{
        profile_id: profileId,
        boost_id: boost?.id || null,
        notification_type: notificationType,
        recipient_phone: recipientPhone,
        message_body: message,
        status,
        error_message: errorMessage,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      }])
      .select()
      .maybeSingle()
    if (error) throw error

    setBoostNotifs(prev => [data, ...prev])
    if (status === 'failed') throw new Error(
      errorMessage === 'no_webhook'
        ? 'Configurez le webhook Make.com dans Paramètres'
        : errorMessage
    )
    return data
  }

  return {
    contacts, campaigns, notifs, boostNotifs,
    webhook, connected, loading, error, stats,
    addContact, sendMessage,
    createCampaign,
    addNotification, toggleNotification,
    saveWebhook,
    sendBoostNotification,
  }
}