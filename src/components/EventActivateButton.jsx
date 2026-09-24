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
    <div>
      <button
        type="button"
        onClick={handleActivate}
        disabled={loading}
        style={{
          width: '100%', height: 40, borderRadius: 'var(--radius)', border: 'none',
          background: 'linear-gradient(135deg,#ff6b35,#f7c948)', color: '#fff',
          fontWeight: 600, fontSize: 13, cursor: 'pointer',
        }}
      >
        {loading ? 'Redirection...' : 'Activer ma carte événement'}
      </button>
      {error && <p style={{ color: 'var(--text-danger)', fontSize: 12, marginTop: 8 }}>{error}</p>}
    </div>
  );
}