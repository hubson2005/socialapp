// src/lib/phone.js
// Même logique de normalisation que la fonction SQL normalize_phone_ci.
export function normalizePhone(raw = '') {
  const s = String(raw).trim();
  const d = s.replace(/\D/g, '');
  if (!d) return '';
  if (s.startsWith('+')) return d;            // international explicite
  if (d.startsWith('00')) return d.slice(2);  // 00 33 ...
  if (d.length === 10) return '225' + d;      // local ivoirien, 0 conservé
  return d;                                   // déjà 225..., ou autre pays
}

// Indicatifs reconnus SANS « + » (Afrique de l'Ouest / centrale francophone, Maghreb, France).
const KNOWN_COUNTRY_CODES = ['33', '212', '213', '216', '220', '221', '223', '224', '226', '227',
  '228', '229', '231', '232', '233', '234', '235', '237', '241', '242', '243'];

const CI_HINT = 'ex. 07 58 52 32 15';

/**
 * Contrôle strict d'un numéro de téléphone.
 *  - Côte d'Ivoire (+225) : exactement 10 chiffres après l'indicatif (depuis 2021).
 *  - Autres pays : saisie internationale (+ ou 00) ou indicatif connu, 8 à 15 chiffres.
 *  - Format local incomplet (commence par 0 sans faire 10 chiffres) : refusé.
 * @returns {{ ok: boolean, normalized: string, reason: string }}
 */
export function checkPhone(raw = '') {
  const s = String(raw ?? '').trim();
  if (!s) return { ok: false, normalized: '', reason: 'Numéro vide' };
  if (/[^\d\s+().-]/.test(s)) {
    return { ok: false, normalized: '', reason: 'Le numéro ne doit contenir que des chiffres' };
  }
  const n = normalizePhone(s);
  const explicitIntl = s.startsWith('+') || s.replace(/\D/g, '').startsWith('00');
  const bad = (reason) => ({ ok: false, normalized: n, reason });

  if (n.startsWith('225')) {
    if (n.length === 13) return { ok: true, normalized: n, reason: '' };
    return bad(n.length < 13
      ? `Numéro ivoirien incomplet : 10 chiffres attendus (${CI_HINT})`
      : `Numéro ivoirien trop long : 10 chiffres attendus (${CI_HINT})`);
  }
  if (n.startsWith('0')) {
    return bad(`Numéro incomplet : 10 chiffres attendus pour la Côte d’Ivoire (${CI_HINT}), ou ajoutez l’indicatif (ex. +221…)`);
  }
  if (!explicitIntl && !KNOWN_COUNTRY_CODES.some(cc => n.startsWith(cc))) {
    return bad('Indicatif du pays manquant (ex. +221…)');
  }
  if (n.length < 8 || n.length > 15) {
    return bad('Numéro international invalide (8 à 15 chiffres avec l’indicatif)');
  }
  return { ok: true, normalized: n, reason: '' };
}

export const isValidPhone = (raw) => checkPhone(raw).ok;
