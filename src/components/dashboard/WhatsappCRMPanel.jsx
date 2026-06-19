// src/components/dashboard/WhatsappCRMPanel.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import WhatsAppCRM from '../../pages/WhatsAppCRM'

export default function WhatsappCRMPanel({ profileId }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!profileId) return
    supabase
      .from('link_profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle()
      .then(({ data }) => setProfile(data))
  }, [profileId])

  return <WhatsAppCRM profile={profile} />
}
