// src/hooks/useWhatsappCRM.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useWhatsappCRM() {
  const [contacts,  setContacts]  = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [notifs,    setNotifs]    = useState([])
  const [webhook,   setWebhook]   = useState('')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  // ── Chargement initial ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [
          { data: c,  error: e1 },
          { data: ca, error: e2 },
          { data: n,  error: e3 },
          { data: s,  error: e4 },
        ] = await Promise.all([
          supabase.from('whatsapp_contacts').select('*').order('created_at', { ascending: false }),
          supabase.from('whatsapp_campaigns').select('*').order('created_at', { ascending: false }),
          supabase.from('whatsapp_notifications').select('*').order('created_at', { ascending: false }),
          supabase.from('whatsapp_settings').select('*').maybeSingle(),
        ])
        if (e1) throw e1
        if (e2) throw e2
        if (e3) throw e3
        if (e4) throw e4
        setContacts(c  || [])
        setCampaigns(ca || [])
        setNotifs(n    || [])
        setWebhook(s?.webhook_url || '')
      } catch (err) {
        setError(err.message || 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Stats calculées ─────────────────────────────────────────────
  const stats = {
    totalContacts:  contacts.length,
    activeContacts: contacts.filter(c => c.status === 'actif').length,
    sentCampaigns:  campaigns.filter(c => c.status === 'envoyé').length,
    totalMessages:  campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0),
    activeNotifs:   notifs.filter(n => n.active).length,
  }

  const connected = Boolean(webhook)

  // ── Ajouter un contact ──────────────────────────────────────────
  const addContact = useCallback(async ({ name, phone, email, tag }) => {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .insert({ name, phone, email: email || null, tag: tag || 'Client', status: 'actif' })
      .select()
      .single()
    if (error) throw error
    setContacts(prev => [data, ...prev])
    return data
  }, [])

  // ── Envoyer un message via webhook Make.com ─────────────────────
  const sendMessage = useCallback(async ({ to, name, message }) => {
    if (!webhook) return { reason: 'no_webhook' }
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, name, message }),
      })
      // Mettre à jour last_msg_at du contact
      const contact = contacts.find(c => c.phone === to)
      if (contact) {
        await supabase
          .from('whatsapp_contacts')
          .update({ last_msg_at: new Date().toISOString() })
          .eq('id', contact.id)
        setContacts(prev =>
          prev.map(c => c.id === contact.id ? { ...c, last_msg_at: new Date().toISOString() } : c)
        )
      }
      return { reason: 'sent' }
    } catch {
      return { reason: 'error' }
    }
  }, [webhook, contacts])

  // ── Créer une campagne et envoyer via webhook ───────────────────
  const createCampaign = useCallback(async ({ name, message, recipientIds }) => {
    const recipients = contacts.filter(c => recipientIds.includes(c.id))

    // Créer la campagne en base
    const { data: campaign, error } = await supabase
      .from('whatsapp_campaigns')
      .insert({
        name,
        message,
        status: 'envoyé',
        sent_count: recipients.length,
        launched_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error

    // Envoyer via webhook si configuré
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

    setCampaigns(prev => [campaign, ...prev])
    return campaign
  }, [contacts, webhook])

  // ── Ajouter une automatisation ──────────────────────────────────
  const addNotification = useCallback(async ({ name, trigger_type }) => {
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .insert({ name, trigger_type: trigger_type || 'Automatique', active: true })
      .select()
      .single()
    if (error) throw error
    setNotifs(prev => [data, ...prev])
    return data
  }, [])

  // ── Activer / désactiver une automatisation ─────────────────────
  const toggleNotification = useCallback(async (id, currentActive) => {
    const { error } = await supabase
      .from('whatsapp_notifications')
      .update({ active: !currentActive })
      .eq('id', id)
    if (error) throw error
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, active: !currentActive } : n))
  }, [])

  // ── Sauvegarder le webhook ──────────────────────────────────────
  const saveWebhook = useCallback(async (url) => {
    const { error } = await supabase
      .from('whatsapp_settings')
      .upsert({ webhook_url: url, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) throw error
    setWebhook(url)
  }, [])

  return {
    contacts,
    campaigns,
    notifs,
    webhook,
    connected,
    loading,
    error,
    stats,
    addContact,
    sendMessage,
    createCampaign,
    addNotification,
    toggleNotification,
    saveWebhook,
  }
}