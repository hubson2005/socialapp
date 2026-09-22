import { supabase } from '../supabase';

const DRAFT_KEY = 'sa_event_draft';

/** Slug lisible + court suffixe aléatoire pour éviter les collisions. */
export function makeSlug(title) {
  const base = (title || 'evenement')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

/**
 * Construit l'objet brouillon à partir du formulaire rapide.
 * Ce même objet est soit inséré directement (utilisateur connecté),
 * soit passé en metadata à supabase.auth.signUp (utilisateur non connecté).
 */
export function buildEventDraft({ type, title, location, eventDate, editionId }) {
  return {
    slug: makeSlug(title),
    type,
    title,
    location: location || null,
    event_date: type === 'expo_temp' ? null : (eventDate || null),
    edition_id: type === 'expo_temp' ? (editionId || null) : null,
  };
}

/** Persiste le brouillon le temps que l'utilisateur confirme son email. */
export function saveDraftLocally(draft) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (_) {}
}

export function readLocalDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

export function clearLocalDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch (_) {}
}

/** Utilisateur déjà connecté : création immédiate. */
export async function createEventNow(draft, userId) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      owner_user_id: userId,
      slug: draft.slug,
      type: draft.type,
      title: draft.title,
      location: draft.location,
      event_date: draft.event_date,
      edition_id: draft.edition_id,
    })
    .select()
    .single();
  return { data, error };
}