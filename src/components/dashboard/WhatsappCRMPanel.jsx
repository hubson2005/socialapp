// src/components/dashboard/WhatsappCRMPanel.jsx
// Wrapper panel qui intègre la page WhatsAppCRM dans le dashboard
import WhatsAppCRM from '../../pages/WhatsAppCRM'

export default function WhatsappCRMPanel({ profileId }) {
  return <WhatsAppCRM profileId={profileId} />
}