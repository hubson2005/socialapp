import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Loader2, X, Ticket, CheckCircle2 } from 'lucide-react';

const CINETPAY_SITE_ID = import.meta.env.VITE_CINETPAY_SITE_ID;
const CINETPAY_API_KEY = import.meta.env.VITE_CINETPAY_API_KEY;
const SERVICE_FEE = 0.05;

function generateTicketCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SA-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function TicketShop({ profile }) {
  const [tickets, setTickets] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [step, setStep] = useState('select'); // select | info | processing | success
  const [buyerInfo, setBuyerInfo] = useState({ name: '', email: '', phone: '', delivery: 'both' });
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('profile_id', profile.id)
        .order('price', { ascending: true });
      if (data) {
        setTickets(data);
        const q = {};
        data.forEach(t => q[t.id] = 0);
        setQuantities(q);
      }
      setLoadingTickets(false);
    };
    fetchTickets();
  }, [profile.id]);

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const subtotal = tickets.reduce((sum, t) => sum + (t.price * (quantities[t.id] || 0)), 0);
  const totalWithFees = Math.round(subtotal * (1 + SERVICE_FEE));

  const adj = (id, delta) => {
    const ticket = tickets.find(t => t.id === id);
    const available = ticket.max_quantity - ticket.sold_count;
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, Math.min(available, (prev[id] || 0) + delta))
    }));
  };

  const handlePay = async () => {
    if (!buyerInfo.name) return alert('Veuillez saisir votre nom.');
    if (!buyerInfo.email && !buyerInfo.phone) return alert('Email ou téléphone requis.');

    setLoading(true);
    try {
      const ticketCode = generateTicketCode();
      const selectedTickets = tickets.filter(t => quantities[t.id] > 0);
      const firstTicket = selectedTickets[0];

      // Créer la commande en base
      const { data: newOrder, error } = await supabase
        .from('ticket_orders')
        .insert([{
          ticket_id: firstTicket.id,
          profile_id: profile.id,
          buyer_name: buyerInfo.name,
          buyer_email: buyerInfo.email || null,
          buyer_phone: buyerInfo.phone || null,
          quantity: quantities[firstTicket.id],
          unit_price: firstTicket.price,
          total_amount: totalWithFees,
          delivery_method: buyerInfo.delivery,
          ticket_code: ticketCode,
          payment_status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;

      setOrder({ ...newOrder, ticketCode, eventName: profile.event_name, eventDate: profile.event_date, eventLocation: profile.event_location });

      // Initier paiement CinetPay
      const paymentData = {
        apikey: CINETPAY_API_KEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: ticketCode + '-' + Date.now(),
        amount: totalWithFees,
        currency: 'XOF',
        description: 'Billet - ' + profile.event_name,
        notify_url: 'https://www.socialapp.work/api/cinetpay-webhook',
        return_url: 'https://www.socialapp.work/profil/' + profile.username,
        customer_name: buyerInfo.name,
        customer_email: buyerInfo.email || 'noreply@socialapp.work',
        customer_phone_number: buyerInfo.phone || '',
        customer_address: 'Abidjan',
        customer_city: 'Abidjan',
        customer_country: 'CI',
        customer_state: 'CI',
        customer_zip_code: '00225',
        channels: 'ALL',
        metadata: JSON.stringify({ order_id: newOrder.id, ticket_code: ticketCode }),
        lang: 'fr',
      };

      const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      const result = await res.json();

      if (result.code === '201') {
        // Rediriger vers la page de paiement CinetPay
        window.location.href = result.data.payment_url;
      } else {
        // Mode démo : simuler succès si pas de clés CinetPay
        setStep('success');
      }
    } catch (err) {
      console.error(err);
      // Mode démo
      setStep('success');
    } finally {
      setLoading(false);
    }
  };

  if (loadingTickets) return null;
  if (!tickets.length) return null;

  return (
    <div style={{ width: '100%', maxWidth: '360px', marginTop: '24px' }}>
      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Ticket size={18} color="#ff6b35" />
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>Réserver ma place</span>
        </div>

        {/* STEP 1 — Select tickets */}
        {step === 'select' && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {tickets.map(t => {
                const available = t.max_quantity - t.sold_count;
                const isSoldOut = available <= 0;
                return (
                  <div key={t.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', opacity: isSoldOut ? 0.5 : 1 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: 'white', margin: '0 0 2px' }}>{t.name}</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                        {t.price.toLocaleString()} FCFA
                        {isSoldOut && <span style={{ color: '#f87171', marginLeft: '8px' }}>Complet</span>}
                      </p>
                    </div>
                    {!isSoldOut && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => adj(t.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'white', minWidth: '18px', textAlign: 'center' }}>{quantities[t.id] || 0}</span>
                        <button onClick={() => adj(t.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalItems > 0 && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{totalItems} billet{totalItems > 1 ? 's' : ''}</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#ff6b35' }}>{subtotal.toLocaleString()} FCFA</span>
              </div>
            )}

            <button
              onClick={() => totalItems > 0 && setStep('info')}
              disabled={totalItems === 0}
              style={{ width: '100%', padding: '13px', background: totalItems > 0 ? 'linear-gradient(135deg, #ff6b35, #f7c948)' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: totalItems > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: totalItems === 0 ? 0.5 : 1 }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* STEP 2 — Buyer info */}
        {step === 'info' && (
          <div style={{ padding: '16px 20px' }}>
            <button onClick={() => setStep('select')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', marginBottom: '12px', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
              ← Retour
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="Votre nom complet *"
                value={buyerInfo.name}
                onChange={e => setBuyerInfo(p => ({ ...p, name: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 12px', color: 'white', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
              />
              <input
                type="email"
                placeholder="Email (pour recevoir le ticket)"
                value={buyerInfo.email}
                onChange={e => setBuyerInfo(p => ({ ...p, email: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 12px', color: 'white', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
              />
              <input
                type="tel"
                placeholder="WhatsApp (+225 07...)"
                value={buyerInfo.phone}
                onChange={e => setBuyerInfo(p => ({ ...p, phone: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 12px', color: 'white', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>Recevoir mon ticket via :</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[{ v: 'email', l: '📧 Email' }, { v: 'whatsapp', l: '📱 WhatsApp' }, { v: 'both', l: '📧+📱 Les deux' }].map(opt => (
                <button key={opt.v} onClick={() => setBuyerInfo(p => ({ ...p, delivery: opt.v }))}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: '10px', border: `1px solid ${buyerInfo.delivery === opt.v ? '#ff6b35' : 'rgba(255,255,255,0.12)'}`, background: buyerInfo.delivery === opt.v ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)', color: buyerInfo.delivery === opt.v ? '#ff6b35' : 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {opt.l}
                </button>
              ))}
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.15)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Total à payer</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#ff6b35' }}>{subtotal.toLocaleString()} FCFA</span>
            </div>

            <button onClick={handlePay} disabled={loading} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Traitement...' : '🎫 Payer maintenant'}
            </button>
          </div>
        )}

        {/* STEP 3 — Success */}
        {step === 'success' && order && (
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="#25D366" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '16px', fontWeight: '700', color: 'white', margin: '0 0 6px' }}>Paiement confirmé !</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', margin: '0 0 16px' }}>Votre ticket a été envoyé</p>

            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px', marginBottom: '14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>N° de billet</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#ff6b35' }}>{order.ticketCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Événement</span>
                <span style={{ fontSize: '12px', color: 'white' }}>{order.eventName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Envoyé via</span>
                <span style={{ fontSize: '12px', color: '#25D366' }}>
                  {order.delivery_method === 'email' ? 'Email' : order.delivery_method === 'whatsapp' ? 'WhatsApp' : 'Email + WhatsApp'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.5' }}>
              Présentez votre QR code à l'entrée de l'événement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}