/**
 * PublicBookingPage.jsx — Page dédiée "lien direct" pour un service ou un
 * événement précis (ex: partagé par WhatsApp/SMS), sans le reste du profil
 * (bio, boutique, documents, autres liens...).
 *
 * Route attendue (à ajouter dans le routeur de l'app, cf. instructions) :
 *   /book/:profileId/:type/:itemId
 *   - profileId : l'id (uuid) du profil, tel que stocké dans link_profiles.id
 *   - type      : 'service' ou 'event'
 *   - itemId    : l'id du service (booking_services) ou de l'événement
 *                 (booking_events_public)
 *
 * Réutilise ServiceBookingFlow / EventBookingFlow (désormais exportés
 * depuis PublicBookingWidget.jsx) avec l'item pré-sélectionné : le
 * visiteur arrive directement sur le choix du créneau (service) ou le
 * formulaire d'inscription (événement), sans étape de sélection.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
// PublicBookingWidget.jsx vit dans le même dossier (src/pages/), comme
// PublicProfile.jsx l'importait déjà via '@/pages//PublicBookingWidget'.
import { COLORS, ServiceBookingFlow, EventBookingFlow } from './PublicBookingWidget';

const FONT_STACK = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export default function PublicBookingPage() {
  const { profileId, type, itemId } = useParams();
  const [profile, setProfile] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setNotFound(false);

      const { data: profileData, error: profileErr } = await supabase
        .from('link_profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', profileId)
        .maybeSingle();

      if (cancelled) return;
      if (profileErr || !profileData) { setNotFound(true); setLoading(false); return; }

      let itemData = null;
      if (type === 'service') {
        const { data } = await supabase
          .from('booking_services')
          .select('*')
          .eq('id', itemId)
          .eq('profile_id', profileId)
          .eq('is_active', true)
          .maybeSingle();
        itemData = data;
      } else if (type === 'event') {
        const { data } = await supabase
          .from('booking_events_public')
          .select('*')
          .eq('id', itemId)
          .eq('profile_id', profileId)
          .maybeSingle();
        itemData = data;
      }

      if (cancelled) return;
      if (!itemData) { setNotFound(true); setLoading(false); return; }

      setProfile(profileData);
      setItem(itemData);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [profileId, type, itemId]);

  if (loading) {
    return (
      <div style={wrapOuter}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: FONT_STACK }}>Chargement…</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={wrapOuter}>
        <div style={{ textAlign: 'center', color: 'white', fontFamily: FONT_STACK }}>
          <p style={{ fontSize: 15, marginBottom: 8 }}>Ce lien de réservation n'est plus disponible.</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            Le service ou l'événement a peut-être été retiré ou désactivé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapOuter}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* En-tête minimal : identité du profil, lien vers la page complète */}
        <Link
          to={`/${profile.username}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
            textDecoration: 'none', color: 'white', fontFamily: FONT_STACK,
          }}
        >
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.display_name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
            : <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)' }} />
          }
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{profile.display_name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Voir le profil complet →</div>
          </div>
        </Link>

        {/* Widget, avec l'item déjà présélectionné */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderStrong}`, borderRadius: 18, padding: 24, color: COLORS.text, fontFamily: FONT_STACK }}>
          {type === 'service' && <ServiceBookingFlow profileId={profileId} initialService={item} />}
          {type === 'event' && <EventBookingFlow profileId={profileId} initialEvent={item} />}
        </div>
      </div>
    </div>
  );
}

const wrapOuter = {
  minHeight: '100dvh', background: '#0f0a1e', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
  boxSizing: 'border-box',
};