import React, { useState } from 'react';
import { supabase } from '../supabase';
import { MessageCircle, User, Phone, Send, Check, Loader2 } from 'lucide-react';

export default function ContactForm({ profileId, profileName }) {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim()) { setError('Veuillez entrer votre nom.'); return; }
    if (!form.phone.trim()) { setError('Veuillez entrer votre numéro WhatsApp.'); return; }
    if (!form.message.trim()) { setError('Veuillez écrire un message.'); return; }

    setLoading(true);
    try {
      const { error: dbErr } = await supabase.from('profile_contacts').insert([{
        profile_id: Number(profileId),
        name: form.name.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        is_read: false,
      }]);
      if (dbErr) throw dbErr;
      setSent(true);
    } catch (err) {
      setError('Erreur : ' + (err.message || 'réessayez'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ width: '100%', maxWidth: '384px', margin: '8px 0 20px' }}>
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(34,197,94,0.2)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Check size={24} color="#22c55e" />
          </div>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Message envoyé !</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
            {profileName || 'Le propriétaire'} vous répondra prochainement sur votre WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '384px', margin: '8px 0 20px' }}>
      {/* Titre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageCircle size={14} color="white" />
        </div>
        <h2 style={{ color: 'white', fontSize: '15px', fontWeight: 800, margin: 0, letterSpacing: '0.04em' }}>
          Me contacter
        </h2>
      </div>

      {/* Formulaire */}
      <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Nom */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            <User size={11} /> Votre nom
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="ex : Kouassi Jean"
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '11px 14px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; e.target.style.background = 'rgba(34,197,94,0.05)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            <Phone size={11} /> WhatsApp
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600, userSelect: 'none' }}>+</span>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="225 07 00 00 00 00"
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '11px 14px 11px 28px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; e.target.style.background = 'rgba(34,197,94,0.05)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            <MessageCircle size={11} /> Message
          </label>
          <textarea
            value={form.message}
            onChange={e => set('message', e.target.value)}
            placeholder="Écrivez votre message..."
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '11px 14px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
            onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; e.target.style.background = 'rgba(34,197,94,0.05)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
          />
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
            <p style={{ color: '#f87171', fontSize: '12px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Bouton envoi */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px', background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: '14px', color: loading ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 6px 20px rgba(34,197,94,0.3)' }}
        >
          {loading
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Envoi...</>
            : <><Send size={15} /> Envoyer le message</>
          }
        </button>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', margin: 0 }}>
          🔒 Votre numéro est uniquement partagé avec {profileName || 'le propriétaire'}
        </p>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

