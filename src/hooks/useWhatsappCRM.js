// src/hooks/useWhatsappCRM.js
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ── Templates de notifications Boost ──────────────────────────────
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

export function useWhatsappCRM() {
  const [contacts,  setContacts]  = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [notifs,    setNotifs]    = useState([])
  const [webhook,   setWebhook]   = useState('')
  const [connected, setConnected] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  // ── Computed stats ─────────────────────────────────────────────
  const stats = {
    totalContacts:  contacts.length,
    activeContacts: contacts.filter(c => c.status === 'actif').length,
    sentCampaigns:  campaigns.filter(c => c.status === 'envoyé').length,
    totalMessages:  campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0),
    activeNotifs:   notifs.filter(n => n.active).length,
  }

  // ── Load all data ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [cRes, camRes, nRes, wRes] = await Promise.all([
          supabase.from('whatsapp_contacts').select('*').order('created_at', { ascending: false }),
          supabase.from('whatsapp_campaigns').select('*').order('created_at', { ascending: false }),
          supabase.from('whatsapp_notifications').select('*').order('created_at', { ascending: false }),
          supabase.from('whatsapp_settings').select('*').limit(1).single(),
        ])

        if (cRes.error   && cRes.error.code !== 'PGRST116')   throw cRes.error
        if (camRes.error && camRes.error.code !== 'PGRST116') throw camRes.error
        if (nRes.error   && nRes.error.code !== 'PGRST116')   throw nRes.error

        setContacts(cRes.data   || [])
        setCampaigns(camRes.data || [])
        setNotifs(nRes.data     || [])

        const wh = wRes.data?.webhook_url || ''
        setWebhook(wh)
        setConnected(!!wh)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Add contact ────────────────────────────────────────────────
  const addContact = async ({ name, phone, email, tag }) => {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .insert([{ name, phone, email: email || null, tag, status: 'actif' }])
      .select()
      .single()
    if (error) throw error
    setContacts(prev => [data, ...prev])
    return data
  }

  // ── Send message (via Make.com webhook) ───────────────────────
  const sendMessage = async ({ to, name, message }) => {
    if (!webhook) return { reason: 'no_webhook' }
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, name, message }),
      })
      // Log dans Supabase
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
      .single()
    if (camErr) throw camErr

    // Envoi réel si webhook configuré
    if (webhook) {
      await Promise.allSettled(
        recipients.map(c =>
          fetch(webhook, {
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
      .single()
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
      .single()
    if (error) throw error
    setNotifs(prev => prev.map(n => n.id === id ? data : n))
  }

  // ── Save webhook URL ───────────────────────────────────────────
  const saveWebhook = async (url) => {
    const { error } = await supabase
      .from('whatsapp_settings')
      .upsert([{ id: 1, webhook_url: url }])
    if (error) throw error
    setWebhook(url)
    setConnected(!!url)
  }

  return {
    contacts, campaigns, notifs,
    webhook, connected, loading, error, stats,
    addContact, sendMessage,
    createCampaign,
    addNotification, toggleNotification,
    saveWebhook,
  }
}