import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Plus, Trash2, Loader2, Ticket } from 'lucide-react';
import { toast } from 'sonner';

export default function TicketManager({ profileId }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTicket, setNewTicket] = useState({ name: '', price: '', max_quantity: 100 });

  useEffect(() => {
    if (profileId) fetchTickets();
  }, [profileId]);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('profile_id', profileId)
      .order('price', { ascending: true });
    if (data) setTickets(data);
    setLoading(false);
  };

  const addTicket = async () => {
    if (!newTicket.name.trim() || !newTicket.price) {
      toast.error('Nom et prix requis'); return;
    }
    setSaving(true);
    const { error } = await supabase.from('event_tickets').insert([{
      profile_id: profileId,
      name: newTicket.name.trim(),
      price: parseInt(newTicket.price),
      max_quantity: parseInt(newTicket.max_quantity) || 100,
      sold_count: 0,
    }]);
    if (error) { toast.error('Erreur : ' + error.message); }
    else {
      toast.success('Catégorie ajoutée !');
      setNewTicket({ name: '', price: '', max_quantity: 100 });
      fetchTickets();
    }
    setSaving(false);
  };

  const deleteTicket = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    await supabase.from('event_tickets').delete().eq('id', id);
    toast.success('Catégorie supprimée');
    fetchTickets();
  };

  return (
    <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.15)', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Ticket size={14} color="#ff6b35" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>Catégories de billets</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <Loader2 size={18} color="#ff6b35" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {tickets.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {tickets.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'white', margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                      {t.price.toLocaleString()} FCFA · {t.sold_count}/{t.max_quantity} vendus
                    </p>
                  </div>
                  <button onClick={() => deleteTicket(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder="Nom (ex: VIP, Grand Public)"
              value={newTicket.name}
              onChange={e => setNewTicket(p => ({ ...p, name: e.target.value }))}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', color: 'white', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                placeholder="Prix (FCFA)"
                value={newTicket.price}
                onChange={e => setNewTicket(p => ({ ...p, price: e.target.value }))}
                style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', color: 'white', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
              />
              <input
                type="number"
                placeholder="Qté max"
                value={newTicket.max_quantity}
                onChange={e => setNewTicket(p => ({ ...p, max_quantity: e.target.value }))}
                style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', color: 'white', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <button
              onClick={addTicket}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(255,107,53,0.2)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: '10px', color: '#ff6b35', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
              Ajouter une catégorie
            </button>
          </div>
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}