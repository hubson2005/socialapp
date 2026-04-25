import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Loader2, X, Phone, Mail, User, CheckCircle } from 'lucide-react';

const SERVICE_FEE_RATE = 0.05;

function generateTicketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function TicketShop({ profileId, eventName, onClose }) {
  const [tickets, setTickets] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [step, setStep] = useState('select');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', delivery: 'both' });

  useEffect(() => {
    fetchTickets();
  }, [profileId]);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('profile_id', profileId)
      .order('price', { ascending: true });
    if (data) {
      setTickets(data);
      const q = {};
      data.forEach(t => { q[t.id] = 0; });
      setQuantities(q);
    }
    setLoading(false);
  };

  const adjust = (id, delta) => {
    const ticket = tickets.find(t => t.id === id);
    const remaining = ticket.max_quantity - ticket.sold_count;
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, Math.min(remaining, (prev[id] || 0) + delta)) }));
  };

  const getSubtotal = () => tickets.reduce((sum, t) => sum + t.price * (quantities[t.id] || 0), 0);
  const getTotalVisible = () => getSubtotal();
  const getTotalReal = () => Math.round(getSubtotal() * (1 + SERVICE_FEE_RATE));
  const getTotalQuantity = () => Object.values(quantities).reduce((s, q) => s + q, 0);

  const handleInfoSubmit = () => {
    if (!form.name.trim()) { alert('Veuillez entrer votre nom.'); return; }
    if (form.delivery !== 'whatsapp' && !form.email.trim()) { alert('Veuillez entrer votre email.'); return; }
    if (form.delivery !== 'email' && !form.phone.trim()) { alert('Veuillez entrer votre numéro WhatsApp.'); return; }
    setStep('payment');
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const ticketCode = generateTicketCode();
      const selectedTicket = tickets.find(t => (quantities[t.id] || 0) > 0);
      const qty = quantities[selectedTicket.id];

      const { data: orderData, error } = await supabase
        .from('ticket_orders')
        .insert([{
          ticket_id: selectedTicket.id,
          profile_id: profileId,
          buyer_name: form.name,
          buyer_email: form.email || null,
          buyer_phone: form.phone || null,
          quantity: qty,
          unit_price: selectedTicket.price,
          total_amount: getTotalReal(),
          delivery_method: form.delivery,
          ticket_code: ticketCode,
          payment_status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;

      await new Promise(r => setTimeout(r, 1500));

      await supabase
        .from('ticket_orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderData.id);

      await supabase
        .from('event_tickets')
        .update({ sold_count: selectedTicket.sold_count + qty })
        .eq('id', selectedTicket.id);

      setOrder({ ...orderData, ticket_code: ticketCode });
      setStep('success');
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const input = (type, value, onChange, placeholder, Icon) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '0 14px' }}>
      <Icon size={14} color="rgba(255,255,255,0.35)" />
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '14px', padding: '12px 0', fontFamily: 'inherit' }} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', background: '#0f0a1e', borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: '16px', fontWeight: '700', color: 'white', margin: 0 }}>
              {step === 'select' && '  Choisir mes billets'}
              {step === 'info' && '  Mes informations'}
              {step === 'payment' && '  Paiement'}
              {step === 'success' && '  Ticket confirmé'}
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>{eventName}</p>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>

          {/* SELECT */}
          {step === 'select' && (
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Loader2 size={24} color="#ff6b35" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : tickets.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>Aucun billet disponible.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {tickets.map(ticket => {
                      const remaining = ticket.max_quantity - ticket.sold_count;
                      const qty = quantities[ticket.id] || 0;
                      return (
                        <div key={ticket.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: '0 0 2px' }}>{ticket.name}</p>
                            <p style={{ fontSize: '15px', fontWeight: '800', color: '#ff6b35', margin: '0 0 3px' }}>{ticket.price.toLocaleString()} FCFA</p>
                            <p style={{ fontSize: '11px', color: remaining < 10 ? '#f97316' : 'rgba(255,255,255,0.3)', margin: 0 }}>{remaining} place{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button onClick={() => adjust(ticket.id, -1)} disabled={qty === 0} style={{ width: '30px', height: '30px', borderRadius: '50%', background: qty > 0 ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: qty > 0 ? '#ff6b35' : 'rgba(255,255,255,0.3)', fontSize: '18px', cursor: qty > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>−</button>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: 'white', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                            <button onClick={() => adjust(ticket.id, 1)} disabled={remaining === 0} style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,107,53,0.2)', border: '1px solid rgba(255,107,53,0.3)', color: '#ff6b35', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {getTotalQuantity() > 0 && (
                    <div style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 2px' }}>{getTotalQuantity()} billet{getTotalQuantity() > 1 ? 's' : ''}</p>
                        <p style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>{getTotalVisible().toLocaleString()} FCFA</p>
                      </div>
                      <button onClick={() => setStep('info')} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Continuer →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* INFO */}
          {step === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Nom complet *</label>
                {input('text', form.name, e => setForm(p => ({ ...p, name: e.target.value })), 'Jean Kouassi', User)}
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Recevoir mon ticket via</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ v: 'email', l: '  Email' }, { v: 'whatsapp', l: '  WhatsApp' }, { v: 'both', l: '  Les deux' }].map(opt => (
                    <button key={opt.v} onClick={() => setForm(p => ({ ...p, delivery: opt.v }))} style={{ flex: 1, padding: '10px 6px', borderRadius: '10px', border: '1px solid ' + (form.delivery === opt.v ? 'rgba(255,107,53,0.5)' : 'rgba(255,255,255,0.1)'), background: form.delivery === opt.v ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.03)', color: form.delivery === opt.v ? '#ff6b35' : 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: form.delivery === opt.v ? '700' : '400', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              {(form.delivery === 'email' || form.delivery === 'both') && (
                <div>
                  <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Email *</label>
                  {input('email', form.email, e => setForm(p => ({ ...p, email: e.target.value })), 'jean@email.com', Mail)}
                </div>
              )}
              {(form.delivery === 'whatsapp' || form.delivery === 'both') && (
                <div>
                  <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Numéro WhatsApp *</label>
                  {input('tel', form.phone, e => setForm(p => ({ ...p, phone: e.target.value })), '+225 07 XX XX XX XX', Phone)}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button onClick={() => setStep('select')} style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>← Retour</button>
                <button onClick={handleInfoSubmit} style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Passer au paiement →</button>
              </div>
            </div>
          )}

          {/* PAYMENT */}
          {step === 'payment' && (
            <div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{getTotalQuantity()} billet{getTotalQuantity() > 1 ? 's' : ''}</span>
                  <span style={{ fontSize: '14px', color: 'white', fontWeight: '700' }}>{getTotalVisible().toLocaleString()} FCFA</span>
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Envoi → {form.name} · {form.delivery === 'both' ? 'Email + WhatsApp' : form.delivery}</span>
              </div>

              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>Mode de paiement :</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {[
                  { label: 'Mobile Money', sub: 'Orange · Wave · MTN · Moov', bg: 'linear-gradient(135deg,#FF6200,#FF8C00)', icon: ' ' },
                  { label: 'Carte bancaire', sub: 'Visa · Mastercard', bg: 'linear-gradient(135deg,#1A73E8,#0d5dbf)', icon: ' ' },
                ].map((m, i) => (
                  <button key={i} onClick={handlePayment} disabled={processing} style={{ padding: '16px 12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', cursor: processing ? 'not-allowed' : 'pointer', textAlign: 'center', fontFamily: 'inherit', opacity: processing ? 0.5 : 1 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: m.bg, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{m.icon}</div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'white', margin: '0 0 3px' }}>{m.label}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{m.sub}</p>
                  </button>
                ))}
              </div>

              {processing && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Loader2 size={24} color="#ff6b35" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Traitement en cours...</p>
                </div>
              )}
              {!processing && (
                <button onClick={() => setStep('info')} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>← Retour</button>
              )}
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && order && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(37,211,102,0.15)', border: '2px solid rgba(37,211,102,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} color="#25D366" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: '0 0 6px' }}>Paiement confirmé !</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>
                Ticket envoyé via {form.delivery === 'both' ? 'Email & WhatsApp' : form.delivery}
              </p>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px', textAlign: 'left' }}>
                {[
                  { l: 'Événement', v: eventName },
                  { l: 'Acheteur', v: form.name },
                  { l: 'Montant payé', v: getTotalVisible().toLocaleString() + ' FCFA', color: '#ff6b35' },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{r.l}</span>
                    <span style={{ fontSize: '12px', color: r.color || 'white', fontWeight: r.color ? '700' : '400' }}>{r.v}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>Code billet</p>
                  <p style={{ fontSize: '20px', fontWeight: '800', color: 'white', letterSpacing: '3px', margin: 0, fontFamily: 'monospace' }}>{order.ticket_code}</p>
                </div>
              </div>
              <div style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#25D366', margin: 0 }}>
                   {form.delivery === 'email' ? form.email : form.delivery === 'whatsapp' ? form.phone : form.email + ' & ' + form.phone}
                </p>
              </div>
              <button onClick={onClose} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Fermer</button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

