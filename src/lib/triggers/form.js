/**
 * triggers/form.js
 * ─────────────────────────────────────────────────────────────────
 * Déclencheur : soumission d'un formulaire du profil.
 *
 * Appeler depuis le handler de soumission du form builder :
 *
 *   import { triggerFormSubmit } from '@/lib/triggers/form';
 *
 *   const handleSubmit = async (formData) => {
 *     await saveFormResponse(formData);          // sauvegarder les données
 *     await triggerFormSubmit(profile.id, {      // déclencher les automations
 *       name:       formData.name,
 *       email:      formData.email,
 *       phone:      formData.phone,
 *       formId:     form.id,
 *       formTitle:  form.title,
 *     });
 *   };
 * ─────────────────────────────────────────────────────────────────
 */

import { runAutomations } from '../automationEngine';

/**
 * @param {number} profileId
 * @param {Object} [context]  - { name, email, phone, formId, formTitle, … }
 */
export async function triggerFormSubmit(profileId, context = {}) {
  await runAutomations({
    trigger:   'form_submit',
    profileId,
    context: {
      source: 'form_submit',
      visitorName: context.name,
      ...context,
    },
  });
}