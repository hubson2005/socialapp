/**
 * lib/formContact.js
 * ─────────────────────────────────────────────────────────────────
 * Extrait les coordonnées du visiteur (nom, e-mail, téléphone) d'une
 * soumission de formulaire.
 *
 * Les réponses sont stockées par identifiant de champ (UUID) :
 *   values = { "e8f157b7-…": "0758523215", "a0a94008-…": "Awa" }
 * On retrouve donc chaque donnée grâce au TYPE du champ défini dans
 * form.fields ('phone', 'email'), et au libellé pour le nom.
 * ─────────────────────────────────────────────────────────────────
 */

const NAME_HINT = /\b(nom|name|pr[ée]nom|first ?name|full ?name|identit[ée])\b/i;

const clean = (v) => {
  if (Array.isArray(v)) v = v.join(', ');
  return v == null ? '' : String(v).trim();
};

export function extractFormContact(fields, values) {
  const list = Array.isArray(fields) ? fields : [];
  const val  = (f) => clean(values?.[f.id]);

  const phone = list.filter(f => f.type === 'phone').map(val).find(Boolean) || '';
  const email = list.filter(f => f.type === 'email').map(val).find(Boolean) || '';

  // Nom : uniquement un champ texte dont le libellé évoque un nom (pas de supposition :
  // sans libellé explicite, l'action create_lead retombe sur son nom par défaut).
  const named = list.find(f => f.type === 'text' && val(f) && NAME_HINT.test(`${f.label || ''} ${f.placeholder || ''}`));
  const name  = named ? val(named) : '';

  return { name, email, phone };
}
