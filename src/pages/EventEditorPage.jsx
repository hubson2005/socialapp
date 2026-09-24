import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import EventPanel from '../components/EventPanel';
import EventQRCode from '../components/EventQRCode';
import EventActivateButton from '../components/EventActivateButton';

export default function EventEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const [event, setEvent] = useState(null);

  useEffect(() => {
    if (isNew) { setEvent(null); return; }
    supabase.from('events').select('id, slug, is_activated').eq('id', id).single()
      .then(({ data }) => setEvent(data || null));
  }, [id, isNew]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Link to="/dashboard/events" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>
        ← Mes événements
      </Link>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <EventPanel eventId={isNew ? null : id} />

        {event && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 200 }}>
            <EventQRCode slug={event.slug} size={160} />
            {!event.is_activated && <EventActivateButton eventId={event.id} />}
          </div>
        )}
      </div>
    </div>
  );
}