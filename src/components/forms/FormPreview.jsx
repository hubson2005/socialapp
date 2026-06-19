import React, { useState } from 'react';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';

// ─── Rendu d'un champ individuel selon son type ─────────────────────────────
function FieldRenderer({ field, value, onChange, disabled }) {
  const baseInputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
  };

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          rows={3}
          style={{ ...baseInputStyle, resize: 'none' }}
        />
      );
    case 'email':
      return (
        <input
          type="email"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || 'nom@exemple.com'}
          disabled={disabled}
          style={baseInputStyle}
        />
      );
    case 'phone':
      return (
        <input
          type="tel"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || '+225 XX XX XX XX XX'}
          disabled={disabled}
          style={baseInputStyle}
        />
      );
    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          style={baseInputStyle}
        />
      );
    case 'file':
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '10px', cursor: disabled ? 'default' : 'pointer' }}>
          <Upload size={14} color="rgba(255,255,255,0.4)" />
          <span style={{ color: value ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '12.5px' }}>
            {value?.name || 'Choisir un fichier'}
          </span>
          <input
            type="file"
            disabled={disabled}
            onChange={e => onChange(e.target.files?.[0] || null)}
            style={{ display: 'none' }}
          />
        </label>
      );
    case 'select':
      return (
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          style={{ ...baseInputStyle, cursor: disabled ? 'default' : 'pointer' }}
        >
          <option value="" style={{ background: '#0a0817' }}>Sélectionnez...</option>
          {(field.options || []).map((opt, i) => (
            <option key={i} value={opt} style={{ background: '#0a0817' }}>{opt}</option>
          ))}
        </select>
      );
    case 'radio':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(field.options || []).map((opt, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: disabled ? 'default' : 'pointer' }}>
              <input
                type="radio"
                name={field.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
                disabled={disabled}
                style={{ accentColor: '#6366f1', width: '15px', height: '15px' }}
              />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12.5px' }}>{opt}</span>
            </label>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(field.options || []).map((opt, i) => {
            const arr = Array.isArray(value) ? value : [];
            const checked = arr.includes(opt);
            return (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: disabled ? 'default' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => {
                    const next = checked ? arr.filter(o => o !== opt) : [...arr, opt];
                    onChange(next);
                  }}
                  style={{ accentColor: '#6366f1', width: '15px', height: '15px' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12.5px' }}>{opt}</span>
              </label>
            );
          })}
        </div>
      );
    default: // text
      return (
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          style={baseInputStyle}
        />
      );
  }
}

// ─── FormPreview ─────────────────────────────────────────────────────────────
// mode "preview" (dans le dashboard, lecture-seule, pas de soumission réelle)
// mode "live" (page publique réelle, soumet via onSubmit fourni par le parent)
export default function FormPreview({ form, mode = 'preview', onSubmit, submitting = false }) {
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const fields = form?.fields || [];
  const bgColor = form?.bg_color || '#F97316';

  const updateValue = (fieldId, val) => {
    setValues(prev => ({ ...prev, [fieldId]: val }));
    setErrors(prev => ({ ...prev, [fieldId]: null }));
  };

  const validate = () => {
    const newErrors = {};
    fields.forEach(f => {
      if (f.required) {
        const v = values[f.id];
        const empty = f.type === 'checkbox' ? !(Array.isArray(v) && v.length) : !v;
        if (empty) newErrors[f.id] = 'Ce champ est requis';
      }
      if (f.type === 'email' && values[f.id]) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(values[f.id])) newErrors[f.id] = 'Email invalide';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'preview') return; // pas de vraie soumission en mode aperçu dashboard
    if (!validate()) return;
    onSubmit?.(values, () => setSubmitted(true));
  };

  if (submitted) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '40px 24px', textAlign: 'center' }}>
        <CheckCircle2 size={36} color="#22c55e" style={{ margin: '0 auto 14px' }} />
        <p style={{ color: 'white', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>
          {form?.thank_you_message || 'Merci pour votre réponse !'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', overflow: 'hidden' }}>
      <div style={{ height: '6px', background: bgColor, flexShrink: 0 }} />
      <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 800, margin: '0 0 6px' }}>
            {form?.title || 'Formulaire sans titre'}
          </h3>
          {form?.description && (
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12.5px', margin: 0, lineHeight: 1.5 }}>
              {form.description}
            </p>
          )}
        </div>

        {fields.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12.5px', textAlign: 'center', padding: '20px 0' }}>
            Ce formulaire ne contient aucun champ pour le moment.
          </p>
        ) : (
          fields.map(field => (
            <div key={field.id}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                {field.label || 'Champ sans titre'}
                {field.required && <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>}
              </label>
              <FieldRenderer
                field={field}
                value={values[field.id]}
                onChange={(v) => updateValue(field.id, v)}
                disabled={mode === 'preview'}
              />
              {errors[field.id] && (
                <p style={{ color: '#f87171', fontSize: '11px', margin: '5px 0 0' }}>{errors[field.id]}</p>
              )}
            </div>
          ))
        )}

        <button
          type="submit"
          disabled={mode === 'preview' || submitting || fields.length === 0}
          style={{
            marginTop: '6px',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: mode === 'preview' ? 'rgba(255,255,255,0.08)' : bgColor,
            color: mode === 'preview' ? 'rgba(255,255,255,0.35)' : 'white',
            fontSize: '13px',
            fontWeight: 700,
            cursor: mode === 'preview' || fields.length === 0 ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
          {mode === 'preview' ? 'Aperçu — soumission désactivée' : 'Envoyer'}
        </button>
      </div>
    </form>
  );
}