import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function EventActivateButton({ eventId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('geniuspay-checkout', {
        body: { event_id: eventId, plan: 'evenement' },
      });
      if (fnError || !data?.checkoutUrl) throw new Error(fnError?.message || 'Réponse invalide');
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError("Impossible de démarrer le paiement, réessayez.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleActivate}
        disabled={loading}
        className="w-full h-10 rounded-xl font-semibold text-sm text-white bg-orange-500 hover:bg-orange-600 transition disabled:opacity-60"
      >
        {loading ? 'Redirection...' : 'Activer ma carte événement'}
      </button>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}