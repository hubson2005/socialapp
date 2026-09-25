import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';

function useCountdown(target) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!target) return;
    const t = new Date(target).getTime();
    const tick = () => {
      const diff = Math.max(0, t - Date.now());
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

export default function PublicEventPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.from('events').select('*').eq('slug', slug).eq('is_published', true).single()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error || !data) setNotFound(true);
        else setEvent(data);
      });
    return () => { mounted = false; };
  }, [slug]);

  const countdownTarget = event
    ? (event.type === 'expo_temp' ? event.expires_at : event.event_date)
    : null;
  const countdown = useCountdown(countdownTarget);

  const logLead = async (interest) => {
    if (!event) return;
    await supabase.from('event_leads').insert({
      event_id: event.id,
      interest,
      channel: 'whatsapp',
    });
  };

  if (notFound) {
    return <CenteredMessage text="Cet événement n'existe pas ou n'est plus disponible." />;
  }
  if (!event) {
    return <CenteredMessage text="Chargement..." />;
  }

  const ctaLabel = {
    mariage: 'Confirmer ma présence',
    custom: "S'inscrire",
    expo_temp: "Contacter l'exposant",
  }[event.type];

  const countdownLabel = {
    mariage: 'Compte à rebours avant le grand jour',
    custom: "Compte à rebours avant l'événement",
    expo_temp: 'Temps restant avant la fin du salon',
  }[event.type];

  const handleCTA = () => {
    if (event.type === 'custom' && event.ticket_url) {
      window.open(event.ticket_url, '_blank');
      return;
    }
    if (event.whatsapp) {
      logLead(event.type === 'expo_temp' ? 'contact' : 'rsvp');
      window.open(`https://wa.me/${event.whatsapp.replace(/\D/g, '')}`, '_blank');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0818', display: 'flex', justifyContent: 'center', padding: '24px 16px', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 380, width: '100%' }}>
        <div style={{ background: '#141026', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)' }}>

          <div style={{
            height: 150, display: 'flex', alignItems: 'flex-end', padding: 14,
            background: event.bg_image
              ? `linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.65)), url(${event.bg_image}) center/cover`
              : event.images?.[0]
                ? `linear-gradient(180deg, transparent, rgba(0,0,0,.5)), url(${event.images[0]}) center/cover`
                : `linear-gradient(135deg, ${event.color1 || '#ff6b35'}, ${event.color2 || '#f7c948'})`,
          }}>
            <div>
              <p style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,.8)' }}>{event.title}</p>
              <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 12, margin: '2px 0 0', textShadow: '0 1px 4px rgba(0,0,0,.8)' }}>
                {event.location}{event.stand_number ? ` · ${event.stand_number}` : ''}
              </p>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            {countdownTarget && (
              <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '10px 12px', marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', margin: '0 0 8px' }}>{countdownLabel}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, textAlign: 'center' }}>
                  {[['j', countdown.d], ['h', countdown.h], ['min', countdown.m], ['sec', countdown.s]].map(([lbl, val]) => (
                    <div key={lbl}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{val}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.description && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.5, margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>{event.description}</p>
            )}

            {(event.whatsapp || event.ticket_url) && (
              <button type="button" onClick={handleCTA} style={{
                width: '100%', height: 40, borderRadius: 10, border: 'none', marginBottom: 14,
                background: `linear-gradient(135deg, ${event.color1 || '#ff6b35'}, ${event.color2 || '#f7c948'})`,
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                {ctaLabel}
              </button>
            )}

            {event.images?.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {event.images.slice(1, 7).map((src, i) => (
                  <img key={i} src={src} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                ))}
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 14 }}>
          socialapp.work/e/{event.slug}
        </p>
      </div>
    </div>
  );
}

function CenteredMessage({ text }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0818', color: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
      {text}
    </div>
  );
}