import React, { useState } from 'react';
import { ListChecks, ArrowRight, Check } from 'lucide-react';
import { FIELD_TYPES } from './FormBuilder';

const typeMeta = (type) => FIELD_TYPES.find(f => f.type === type) || FIELD_TYPES[0];

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 13px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', color: 'white',
  fontSize: '13px', outline: 'none',
  transition: 'border-color 0.15s ease, background 0.15s ease',
};

// ─── Styles injectés une seule fois : hover/focus que l'inline ne peut pas exprimer.
function GlobalStyles() {
  return (
    <style>{`
      .fp-preview input[type="text"], .fp-preview input[type="email"], .fp-preview input[type="tel"],
      .fp-preview input[type="date"], .fp-preview textarea, .fp-preview select {
        outline: none;
      }
      .fp-preview input[type="text"]:focus, .fp-preview input[type="email"]:focus,
      .fp-preview input[type="tel"]:focus, .fp-preview input[type="date"]:focus,
      .fp-preview textarea:focus, .fp-preview select:focus {
        border-color: rgba(139,92,246,0.55) !important;
        background: rgba(139,92,246,0.06) !important;
      }
      .fp-choice { transition: border-color .12s ease, background .12s ease; }
      .fp-choice:hover { border-color: rgba(255,255,255,0.22); }
      .fp-choice[data-checked="true"] { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.09); }

      .fp-submit { transition: filter .15s ease, transform .1s ease; }
      .fp-submit:not(:disabled):hover { filter: brightness(1.08); }
      .fp-submit:not(:disabled):active { transform: translateY(1px); }

      .fp-file-label { transition: border-color .12s ease, background .12s ease; cursor: pointer; }
      .fp-file-label:hover { border-color: rgba(255,255,255,0.22); }
    `}</style>
  );
}

function RequiredMark() {
  return <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>;
}

// ─── Rendu d'un champ individuel (lecture / test) ──────────────────────────
function PreviewField({ field, value, onChange }) {
  const meta = typeMeta(field.type);

  const label = (
    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
      {field.label || meta.label}
      {field.required && <RequiredMark />}
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
            {field.options.map((opt, i) => {
              const checked = value === opt;
              return (
                <label
                  key={i}
                  className="fp-choice"
                  data-checked={checked}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                    padding: '10px 12px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.09)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <input
                    type="radio"
                    name={field.id}
                    checked={checked}
                    onChange={() => onChange(opt)}
                    style={{ width: '15px', height: '15px', accentColor: '#8b5cf6', flexShrink: 0 }}
                  />
                  <span style={{ color: checked ? 'white' : 'rgba(255,255,255,0.65)', fontSize: '12.5px', fontWeight: checked ? 600 : 400 }}>{opt}</span>
                </label>
              );
            })}
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
                <label
                  key={i}
                  className="fp-choice"
                  data-checked={checked}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                    padding: '10px 12px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.09)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const current = Array.isArray(value) ? value : [];
                      onChange(checked ? current.filter(v => v !== opt) : [...current, opt]);
                    }}
                    style={{ width: '15px', height: '15px', accentColor: '#8b5cf6', flexShrink: 0 }}
                  />
                  <span style={{ color: checked ? 'white' : 'rgba(255,255,255,0.65)', fontSize: '12.5px', fontWeight: checked ? 600 : 400 }}>{opt}</span>
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
          <label
            className="fp-file-label"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 13px', borderRadius: '10px',
              border: '1px dashed rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.03)',
              fontSize: '12px', color: 'rgba(255,255,255,0.5)',
            }}
          >
            {value?.name || 'Choisir un fichier…'}
            <input
              type="file"
              onChange={e => onChange(e.target.files?.[0] || null)}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
            />
          </label>
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
  const [submitting, setSubmitting] = useState(false);
  const fields = form?.fields || [];

  const setFieldValue = (id, val) => setValues(v => ({ ...v, [id]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode !== 'public') return; // pas de vraie soumission en aperçu
    const missing = fields.find(f => f.required && !values[f.id]);
    if (missing) return;
    setSubmitting(true);
    if (onSubmit) await onSubmit(values);
    setSubmitting(false);
    setSubmitted(true);
    if (form.redirect_url) {
      window.location.href = form.redirect_url;
    }
  };

  if (submitted) {
    return (
      <div className="fp-preview" style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '18px', padding: '40px 22px', textAlign: 'center',
      }}>
        <GlobalStyles />
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 14px',
          background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={19} color="#22c55e" strokeWidth={2.5} />
        </div>
        <p style={{ color: 'white', fontSize: '14px', fontWeight: 700, margin: 0 }}>
          {form.thank_you_message || 'Merci pour votre réponse !'}
        </p>
      </div>
    );
  }

  return (
    <div className="fp-preview" style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '18px', overflow: 'hidden',
      boxShadow: '0 12px 28px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.24)',
    }}>
      <GlobalStyles />
      <div style={{ height: '4px', background: form?.bg_color || '#F97316' }} />

      <div style={{ padding: '24px 22px' }}>
        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          {form?.title || 'Sans titre'}
        </h3>
        {form?.description && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', margin: '0 0 20px' }}>
            {form.description}
          </p>
        )}

        {fields.length === 0 ? (
          <div style={{
            border: '1.5px dashed rgba(255,255,255,0.12)', borderRadius: '14px',
            padding: '28px 16px', textAlign: 'center', marginTop: form?.description ? 0 : '10px',
          }}>
            <ListChecks size={20} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 8px' }} />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>
              Aucun champ pour l'instant — ajoutez-en dans le Constructeur
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                disabled={submitting}
                className="fp-submit"
                style={{
                  marginTop: '4px', padding: '12px', borderRadius: '11px', border: 'none',
                  background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 55%,#a855f7 100%)',
                  color: 'white', fontSize: '13px', fontWeight: 700,
                  cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.75 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 8px 20px -6px rgba(139,92,246,0.55)',
                }}
              >
                Envoyer {!submitting && <ArrowRight size={14} />}
              </button>
            )}
            {mode === 'preview' && (
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10.5px', textAlign: 'center', margin: 0 }}>
                Mode aperçu — soumission désactivée
              </p>
            )}
          </form>
        )}

        {mode === 'public' && (
          <p style={{ textAlign: 'center', fontSize: '10.5px', color: 'rgba(255,255,255,0.22)', margin: '18px 0 0' }}>
            Propulsé par SocialApp
          </p>
        )}
      </div>
    </div>
  );
}