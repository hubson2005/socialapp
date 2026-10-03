// src/lib/phone.js
// Même logique que la fonction SQL normalize_phone_ci.
export function normalizePhone(raw = '') {
  const s = String(raw).trim();
  const d = s.replace(/\D/g, '');
  if (!d) return '';
  if (s.startsWith('+')) return d;            // international explicite
  if (d.startsWith('00')) return d.slice(2);  // 00 33 ...
  if (d.length === 10) return '225' + d;      // local ivoirien, 0 conservé
  return d;                                   // déjà 225..., ou autre pays
}

export const isValidPhone = (raw) => {
  const n = normalizePhone(raw);
  return n.length >= 10 && n.length <= 15;
};