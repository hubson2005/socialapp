import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import EventPanel from '../components/dashboard/EventPanel';
import EventQRCode from '../components/EventQRCode';
import EventActivateButton from '../components/EventActivateButton';

const CTA_LABEL = {
  mariage: 'Confirmer ma présence',
  custom: "S'inscrire",
  expo_temp: "Contacter l'exposant",
};

export default function EventEditorPage() {
  const { id } = useParams();
  const isNew = !id;

  const [event, setEvent] = useState(null);
  const [preview, setPreview] = useState(null);
  const [stats, setStats] = useState({ views: 0, contacts: 0, demandes: 0 });
  const [rsvps, setRsvps] = useState([]);

  useEffect(() => {
    if (isNew) return;

    supabase.from('events').select('id, slug, is_activated, type').eq('id', id).single()
      .then(({ data }) => setEvent(data || null));

    supabase.from('event_stats').select('views, contacts').eq('event_id', id)
      .then(({ data }) => {
        const totals = (data || []).reduce(
          (acc, row) => ({ views: acc.views + (row.views || 0), contacts: acc.contacts + (row.contacts || 0) }),
          { views: 0, contacts: 0 },
        );
        setStats((s) => ({ ...s, ...totals }));
      });

    supabase.from('event_leads').select('id', { count: 'exact', head: true }).eq('event_id', id)
      .then(({ count }) => setStats((s) => ({ ...s, demandes: count || 0 })));

    supabase.from('event_rsvps').select('id, name, guests, created_at').eq('event_id', id)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setRsvps(data || []));
  }, [id, isNew]);

  return (
    <div className="min-h-screen bg-[#111215] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <Link to="/dashboard/events" className="text-sm text-zinc-400 hover:text-white transition">
              ← Mes événements
            </Link>
            <h1 className="text-2xl font-bold mt-2">{preview?.title || 'Nouvel événement'}</h1>
          </div>
        </div>

        {!isNew && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard title="Vues" value={stats.views} />
            <StatCard title="Contacts" value={stats.contacts} />
            <StatCard title="Demandes" value={stats.demandes} />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <EventPanel eventId={isNew ? null : id} onChange={setPreview} />
          </div>

          <div className="flex flex-col gap-6">
            {preview && (
              <div className="bg-[#1a1c21] border border-white/10 rounded-2xl overflow-hidden">
                <div
                  className="relative h-40"
                  style={{
                    background: preview.bgImage
                      ? `linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.65)), url(${preview.bgImage}) center/cover`
                      : preview.images?.[0]
                        ? `linear-gradient(180deg, transparent, rgba(0,0,0,.5)), url(${preview.images[0]}) center/cover`
                        : `linear-gradient(135deg, ${preview.color1}, ${preview.color2})`,
                  }}
                >
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="font-bold text-lg leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,.8)' }}>{preview.title || 'Titre de l\'événement'}</p>
                    <p className="text-xs text-white/80 mt-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,.8)' }}>{preview.location}</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {preview.description && <p whitespace-pre-wrap className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{preview.description}</p>}
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-xl py-2.5 text-sm font-semibold opacity-90 cursor-default"
                    style={{ background: `linear-gradient(135deg, ${preview.color1}, ${preview.color2})` }}
                  >
                    {CTA_LABEL[preview.type]}
                  </button>
                </div>
              </div>
            )}

            {event && (
              <div className="bg-[#1a1c21] border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3">
                <EventQRCode slug={event.slug} size={150} />
                {!event.is_activated && <EventActivateButton eventId={event.id} />}
              </div>
            )}

            {event?.type === 'mariage' && rsvps.length > 0 && (
              <div className="bg-[#1a1c21] border border-white/10 rounded-2xl p-5">
                <p className="font-semibold text-sm mb-4">🎟️ Invités récents</p>
                <div className="flex flex-col gap-3">
                  {rsvps.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-[#22252c] border border-white/10 rounded-xl px-3 py-2">
                      <p className="text-sm">{r.name || 'Invité'}</p>
                      <p className="text-xs text-zinc-400">👥 {r.guests}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-[#1a1c21] border border-white/10 rounded-2xl p-5">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}