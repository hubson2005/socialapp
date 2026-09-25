import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';

const STATUS_LABEL = { programme: 'Programmé', actif: 'Actif', archive: 'Archivé' };

const STATUS_CLASS = {
  programme: 'bg-indigo-500/15 text-indigo-400',
  actif: 'bg-green-500/15 text-green-400',
  archive: 'bg-white/5 text-zinc-400',
};

const TYPE_LABEL = { mariage: 'Mariage', custom: 'Personnalisé', expo_temp: 'Carte exposant' };

export default function EventsDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('events')
      .select('id, slug, type, title, status, is_activated, event_date, expires_at')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setEvents(data || []));
  }, [user]);

  return (
    <div className="min-h-screen bg-[#111215] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Mes événements</h1>
          <Link
            to="/dashboard/events/new"
            className="bg-orange-500 hover:bg-orange-600 transition px-4 py-2.5 rounded-xl font-semibold text-sm"
          >
            + Nouvel événement
          </Link>
        </div>

        {events === null && <p className="text-zinc-400 text-sm">Chargement...</p>}

        {events?.length === 0 && (
          <div className="bg-[#1a1c21] border border-white/10 rounded-2xl p-10 text-center">
            <p className="text-zinc-400 text-sm mb-4">Aucun événement pour l'instant.</p>
            <Link to="/dashboard/events/new" className="bg-orange-500 hover:bg-orange-600 transition px-4 py-2.5 rounded-xl font-semibold text-sm">
              Créer mon premier événement
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {events?.map((ev) => (
            <Link
              key={ev.id}
              to={`/dashboard/events/${ev.id}`}
              className="flex items-center justify-between bg-[#1a1c21] border border-white/10 hover:border-white/20 transition rounded-2xl px-5 py-4"
            >
              <div>
                <p className="font-semibold text-sm">{ev.title}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {TYPE_LABEL[ev.type]}{!ev.is_activated ? ' · non activé' : ''}
                </p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_CLASS[ev.status]}`}>
                {STATUS_LABEL[ev.status]}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}