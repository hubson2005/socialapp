/**
 * useDataSaverMode.js
 *
 * Détecte si le visiteur doit recevoir la version allégée ("data-light")
 * du profil public SocialApp — moins d'images, pas de police custom, pas
 * d'animations décoratives.
 *
 * Trois signaux, dans cet ordre de priorité :
 *  1. Préférence manuelle mémorisée (localStorage 'pp_light_mode' = '1'/'0')
 *     — posée par le switch "Mode léger" affiché sur le profil.
 *  2. navigator.connection.saveData — activé automatiquement par Chrome
 *     Android quand l'utilisateur a coché "Économiseur de données" dans
 *     les réglages système. Aucune action du visiteur n'est nécessaire.
 *  3. navigator.connection.effectiveType parmi ['slow-2g','2g','3g'] —
 *     dégradation automatique sur connexion détectée comme lente, même
 *     sans Save-Data activé.
 *
 * Ne lève jamais d'erreur si l'API Network Information n'est pas
 * supportée (Safari, Firefox desktop) : retombe simplement sur false
 * (mode complet).
 *
 * Usage :
 *   const { isLight, setManual, clearManual } = useDataSaverMode();
 */
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pp_light_mode';

function getConnection() {
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

function detectAuto() {
  try {
    const conn = getConnection();
    if (!conn) return false;
    if (conn.saveData) return true;
    if (['slow-2g', '2g', '3g'].includes(conn.effectiveType)) return true;
    return false;
  } catch {
    return false;
  }
}

function readManualPref() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
    return null; // pas de préférence manuelle enregistrée
  } catch {
    return null;
  }
}

export function useDataSaverMode() {
  const [isLight, setIsLight] = useState(() => {
    const manual = readManualPref();
    return manual !== null ? manual : detectAuto();
  });

  // Réagit à un changement de type de connexion en direct (ex. l'utilisateur
  // quitte le wifi pour la 3G en cours de visite) — seulement si aucune
  // préférence manuelle n'a été posée entre-temps.
  useEffect(() => {
    const conn = getConnection();
    if (!conn || !conn.addEventListener) return;
    const onChange = () => {
      if (readManualPref() !== null) return;
      setIsLight(detectAuto());
    };
    conn.addEventListener('change', onChange);
    return () => conn.removeEventListener('change', onChange);
  }, []);

  const setManual = useCallback((value) => {
    try { localStorage.setItem(STORAGE_KEY, value ? '1' : '0'); } catch {}
    setIsLight(value);
  }, []);

  const clearManual = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setIsLight(detectAuto());
  }, []);

  return { isLight, setManual, clearManual };
}