/**
 * src/lib/constants.js
 * ─────────────────────────────────────────────────────────────────
 * Source unique de vérité pour tous les identifiants du moteur
 * d'automatisation. Importé par :
 *   - automationEngine.js  (exécution)
 *   - AutomationsPanel.jsx (UI — sauvegarde et affichage)
 *
 * RÈGLE : toujours utiliser ces constantes pour lire/écrire dans
 * la table `automations`. Ne jamais stocker de libellés français
 * dans les champs `trigger`, `action` ou `actions[].type`.
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Déclencheurs ─────────────────────────────────────────────
export const TRIGGERS = {
  WHATSAPP_CLICK:   'whatsapp_click',
  QR_SCAN:          'qr_scan',
  FORM_SUBMIT:      'form_submit',
  NEW_LEAD:         'new_lead',
  PAYMENT_RECEIVED: 'payment_received',
  CALENDLY_BOOKED:  'calendly_booked',
  MARKETPLACE_BUY:  'marketplace_buy',
};

/** Libellés affichés dans l'UI (lecture seule — ne pas stocker en DB) */
export const TRIGGER_LABELS = {
  [TRIGGERS.WHATSAPP_CLICK]:   '📱 Clic WhatsApp',
  [TRIGGERS.QR_SCAN]:          '📷 Scan QR code',
  [TRIGGERS.FORM_SUBMIT]:      '📝 Formulaire rempli',
  [TRIGGERS.NEW_LEAD]:         '👤 Nouveau contact',
  [TRIGGERS.PAYMENT_RECEIVED]: '💰 Paiement reçu',
  [TRIGGERS.CALENDLY_BOOKED]:  '📅 RDV Calendly',
  [TRIGGERS.MARKETPLACE_BUY]:  '🛍️ Achat Marketplace',
};

/** Options pour le <select> déclencheur dans l'AutomationsPanel */
export const TRIGGER_OPTIONS = Object.entries(TRIGGER_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// ─── Actions ──────────────────────────────────────────────────
export const ACTIONS = {
  CREATE_LEAD:    'create_lead',
  CREATE_TASK:    'create_task',
  SEND_WHATSAPP:  'send_whatsapp',
  ADD_SCORE:      'add_score',
  ADD_TAG:        'add_tag',
  NOTIFY_OWNER:   'notify_owner',
};

/** Libellés affichés dans l'UI */
export const ACTION_LABELS = {
  [ACTIONS.CREATE_LEAD]:   '👤 Créer un lead',
  [ACTIONS.CREATE_TASK]:   '✅ Créer une tâche',
  [ACTIONS.SEND_WHATSAPP]: '💬 Envoyer un WhatsApp',
  [ACTIONS.ADD_SCORE]:     '⭐ Modifier le score',
  [ACTIONS.ADD_TAG]:       '🏷️ Ajouter un tag',
  [ACTIONS.NOTIFY_OWNER]:  '🔔 Notifier le propriétaire',
};

/** Options pour le <select> action */
export const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * Champs de configuration affichés selon l'action choisie.
 * Utilisé par l'AutomationsPanel pour rendre le formulaire dynamique.
 *
 * Structure : { [actionKey]: [ { key, label, type, placeholder? } ] }
 */
export const ACTION_CONFIG_FIELDS = {
  [ACTIONS.CREATE_LEAD]: [
    { key: 'status',      label: 'Statut initial',    type: 'select',
      options: ['prospect','qualifié','client','perdu'] },
    { key: 'score',       label: 'Score initial',     type: 'number', placeholder: '50' },
    { key: 'defaultName', label: 'Nom par défaut',    type: 'text',   placeholder: 'Visiteur' },
  ],
  [ACTIONS.CREATE_TASK]: [
    { key: 'taskTitle', label: 'Titre de la tâche', type: 'text', placeholder: 'Rappeler ce contact' },
  ],
  [ACTIONS.SEND_WHATSAPP]: [
    { key: 'message', label: 'Message WhatsApp', type: 'textarea', placeholder: 'Bonjour ! Merci pour votre intérêt. 👋' },
  ],
  [ACTIONS.ADD_SCORE]: [
    { key: 'score', label: 'Points à ajouter (négatif = retrait)', type: 'number', placeholder: '10' },
  ],
  [ACTIONS.ADD_TAG]: [
    { key: 'tag', label: 'Tag à ajouter', type: 'text', placeholder: 'whatsapp' },
  ],
  [ACTIONS.NOTIFY_OWNER]: [
    { key: 'notifTitle', label: 'Titre notification',  type: 'text',     placeholder: 'Nouveau visiteur' },
    { key: 'message',    label: 'Message notification', type: 'textarea', placeholder: 'Un visiteur a cliqué sur WhatsApp.' },
  ],
};