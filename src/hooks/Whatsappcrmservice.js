// hooks/useWhatsappCRM.js
// ─────────────────────────────────────────────────────────────────
// Utilisez dans WhatsAppCRM.jsx comme ceci :
//   import { useWhatsappCRM } from '../hooks/useWhatsappCRM'
//   const { contacts, addContact, sendMessage, ... } = useWhatsappCRM()
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase' // ← adaptez ce chemin si besoin

export function useWhatsappCRM() {

  // ── STATE ────────────────────────────────────────────────────────
  const [contacts,   setContacts]   = useState([])
  const [campaigns,  setCampaigns]  = useState([])
  const [notifs,     setNotifs]     = useState([])
  const [webhook,    setWebhook]    = useState('')
  const [connected,  setConnected]  = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  // ── LOAD ALL DATA ────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [c, cam, n, settings] = await Promise.all([
        supabase.from('whatsapp_contacts').select('*').order('created_at', { ascending: false }),
        supabase.from('whatsapp_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('whatsapp_notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('whatsapp_settings').select('*').maybeSingle(),
      ])
      if (c.error)        throw c.error
      if (cam.error)      throw cam.error
      if (n.error)        throw n.error

      setContacts(c.data   || [])
      setCampaigns(cam.data || [])
      setNotifs(n.data     || [])

      if (settings.data?.webhook_url) {
        setWebhook(settings.data.webhook_url)
        setConnected(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── CONTACTS ─────────────────────────────────────────────────────
  const addContact = useCallback(async (contact) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .insert({ ...contact, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setContacts(prev => [data, ...prev])
    return data
  }, [])

  const deleteContact = useCallback(async (id) => {
    const { error } = await supabase
      .from('whatsapp_contacts')
      .delete()
      .eq('id', id)
    if (error) throw error
    setContacts(prev => prev.filter(c => c.id !== id))
  }, [])

  // ── MESSAGES (via webhook Make.com) ──────────────────────────────
  const sendMessage = useCallback(async ({ to, name, message }) => {
    if (!webhook) return { success: false, reason: 'no_webhook' }
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, name, message, timestamp: new Date().toISOString() }),
      })
      return { success: res.ok }
    } catch (err) {
      return { success: false, reason: err.message }
    }
  }, [webhook])

  // ── CAMPAGNES ─────────────────────────────────────────────────────
  const createCampaign = useCallback(async ({ name, message, recipientIds }) => {
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Enregistre la campagne en base
    const { data: cam, error } = await supabase
      .from('whatsapp_campaigns')
      .insert({
        user_id:    user.id,
        name,
        message,
        status:     'envoyé',
        sent_count: recipientIds.length,
        launched_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error

    // 2. Envoie le message à chaque destinataire via webhook
    for (const id of recipientIds) {
      const contact = contacts.find(c => c.id === id)
      if (contact) {
        await sendMessage({ to: contact.phone, name: contact.name, message })
      }
    }

    setCampaigns(prev => [cam, ...prev])
    return cam
  }, [contacts, sendMessage])

  // ── NOTIFICATIONS / AUTOMATISATIONS ──────────────────────────────
  const addNotification = useCallback(async ({ name, trigger_type }) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .insert({ user_id: user.id, name, trigger_type, active: true })
      .select()
      .single()
    if (error) throw error
    setNotifs(prev => [data, ...prev])
    return data
  }, [])

  const toggleNotification = useCallback(async (id, currentActive) => {
    const { error } = await supabase
      .from('whatsapp_notifications')
      .update({ active: !currentActive })
      .eq('id', id)
    if (error) throw error
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, active: !currentActive } : n))
  }, [])

  // ── WEBHOOK (paramètres) ──────────────────────────────────────────
  const saveWebhook = useCallback(async (url) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('whatsapp_settings')
      .upsert({
        user_id:     user.id,
        webhook_url: url,
        updated_at:  new Date().toISOString(),
      })
    if (error) throw error
    setWebhook(url)
    setConnected(true)
  }, [])

  // ── STATS (calculées, pas stockées) ──────────────────────────────
  const stats = {
    totalContacts:  contacts.length,
    activeContacts: contacts.filter(c => c.status === 'actif').length,
    sentCampaigns:  campaigns.filter(c => c.status === 'envoyé').length,
    totalMessages:  campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0),
    activeNotifs:   notifs.filter(n => n.active).length,
  }

  // ── RETURN ────────────────────────────────────────────────────────
  return {
    // State
    contacts,
    campaigns,
    notifs,
    webhook,
    connected,
    loading,
    error,
    stats,

    // Actions contacts
    addContact,
    deleteContact,

    // Actions messages
    sendMessage,

    // Actions campagnes
    createCampaign,

    // Actions notifications
    addNotification,
    toggleNotification,

    // Actions paramètres
    saveWebhook,

    // Utilitaires
    reload: loadAll,
  }
}