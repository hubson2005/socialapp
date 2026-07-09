import React, { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { FIELD_TYPES } from './FormBuilder';

const typeMeta = (type) => FIELD_TYPES.find(f => f.type === type) || FIELD_TYPES[0];

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 13px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px', color: 'white',
  fontSize: '13px', outline: 'none',
};

// ─── Rendu d'un champ individuel (lecture / test) ──────────────────────────
function PreviewField({ field, value, onChange }) {
  const meta = typeMeta(field.type);

  const label = (
    <label style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
      {field.label || meta.label}
      {field.required && <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>}
    </label>
  );

  switch (field.type) {
    case 'textarea':
      return (
        <div>
          {label}
          <textarea
            rows={3}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          {label}
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={{ ...inputStyle, appearance: 'auto' }}
          >
            <option value="" disabled>Sélectionner...</option>
            {field.options.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );

    case 'radio':
      return (
        <div>
          {label}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {field.options.map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '12.5px' }}>
                <input
                  type="radio"
                  name={field.id}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <div>
          {label}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {field.options.map((opt, i) => {
              const checked = Array.isArray(value) && value.includes(opt);
              return (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '12.5px' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const current = Array.isArray(value) ? value : [];
                      onChange(checked ? current.filter(v => v !== opt) : [...current, opt]);
                    }}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>
      );

    case 'date':
      return (
        <div>
          {label}
          <input type="date" value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle} />
        </div>
      );

    case 'file':
      return (
        <div>
          {label}
          <input type="file" onChange={e => onChange(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: '8px' }} />
        </div>
      );

    case 'email':
      return (
        <div>
          {label}
          <input type="email" placeholder={field.placeholder} value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle} />
        </div>
      );

    case 'phone':
      return (
        <div>
          {label}
          <input type="tel" placeholder={field.placeholder} value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle} />
        </div>
      );

    default: // text
      return (
        <div>
          {label}
          <input type="text" placeholder={field.placeholder} value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle} />
        </div>
      );
  }
}

// ─── FormPreview principal ──────────────────────────────────────────────────
// `form`  : { title, description, fields, bg_color, thank_you_message, redirect_url }
// `mode`  : 'preview' (dans l'éditeur, non soumissible) | 'public' (formulaire réel, soumissible)
// `onSubmit` : callback appelé avec les valeurs, uniquement utile en mode 'public'
export default function FormPreview({ form, mode = 'preview', onSubmit }) {
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const fields = form?.fields || [];

  const setFieldValue = (id, val) => setValues(v => ({ ...v, [id]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode !== 'public') return; // pas de vraie soumission en aperçu
    const missing = fields.find(f => f.required && !values[f.id]);
    if (missing) return;
    if (onSubmit) await onSubmit(values);
    setSubmitted(true);
    if (form.redirect_url) {
      window.location.href = form.redirect_url;
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <p style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>
          {form.thank_you_message || 'Merci pour votre réponse !'}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '18px', padding: '22px',
    }}>
      <div style={{
        width: '10px', height: '10px', borderRadius: '3px', marginBottom: '12px',
        background: form?.bg_color || '#F97316',
      }} />
      <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 800, margin: '0 0 6px' }}>
        {form?.title || 'Sans titre'}
      </h3>
      {form?.description && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', margin: '0 0 18px' }}>
          {form.description}
        </p>
      )}

      {fields.length === 0 ? (
        <div style={{
          border: '2px dashed rgba(255,255,255,0.12)', borderRadius: '14px',
          padding: '28px 16px', textAlign: 'center', marginTop: '10px',
        }}>
          <ListChecks size={20} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>
            Aucun champ pour l'instant — ajoutez-en dans le Constructeur
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '6px' }}>
          {fields.map(field => (
            <PreviewField
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={val => setFieldValue(field.id, val)}
            />
          ))}

          {mode === 'public' && (
            <button
              type="submit"
              style={{
                marginTop: '6px', padding: '11px', borderRadius: '11px', border: 'none',
                background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 55%,#a855f7 100%)',
                color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Envoyer
            </button>
          )}
          {mode === 'preview' && (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10.5px', textAlign: 'center', margin: 0 }}>
              Mode aperçu — soumission désactivée
            </p>
          )}
        </form>
      )}
    </div>
  );
}
