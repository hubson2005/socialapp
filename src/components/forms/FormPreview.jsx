import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Plus, Trash2, GripVertical, Type, Mail, Phone, AlignLeft,
  ListChecks, CheckSquare, ChevronDown, Calendar, Paperclip,
  ChevronUp, ChevronDownIcon, Settings2, X,
} from 'lucide-react';

// ─── Types de champs supportés ──────────────────────────────────────────────
export const FIELD_TYPES = [
  { type: 'text',     label: 'Texte court',      icon: Type,        hasOptions: false },
  { type: 'textarea', label: 'Zone de texte',    icon: AlignLeft,   hasOptions: false },
  { type: 'email',    label: 'Email',            icon: Mail,        hasOptions: false },
  { type: 'phone',    label: 'Téléphone',        icon: Phone,       hasOptions: false },
  { type: 'select',   label: 'Liste déroulante', icon: ChevronDown, hasOptions: true  },
  { type: 'radio',    label: 'Choix unique',     icon: ListChecks,  hasOptions: true  },
  { type: 'checkbox', label: 'Cases à cocher',   icon: CheckSquare, hasOptions: true  },
  { type: 'date',     label: 'Date',             icon: Calendar,    hasOptions: false },
  { type: 'file',     label: 'Fichier',          icon: Paperclip,   hasOptions: false },
];

const typeMeta = (type) => FIELD_TYPES.find(f => f.type === type) || FIELD_TYPES[0];

const emptyField = (type = 'text') => ({
  id: crypto.randomUUID(),
  type,
  label: '',
  placeholder: '',
  required: false,
  options: typeMeta(type).hasOptions ? ['Option 1'] : [],
});

// ─── Éditeur d'options (select / radio / checkbox) ──────────────────────────
function OptionsEditor({ options, onChange }) {
  const updateOption = (idx, value) => {
    const next = [...options];
    next[idx] = value;
    onChange(next);
  };

  const addOption = () => onChange([...options, `Option ${options.length + 1}`]);

  const removeOption = (idx) => onChange(options.filter((_, i) => i !== idx));

  // ✅ FIX Risque latent : détection des options vides ou dupliquées
  const duplicates = options
    .map(o => o.trim().toLowerCase())
    .filter((v, i, arr) => v !== '' && arr.indexOf(v) !== i);

  const hasEmpty = options.some(o => o.trim() === '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
      {options.map((opt, idx) => {
        const isDuplicate = opt.trim() !== '' && duplicates.includes(opt.trim().toLowerCase());
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              value={opt}
              onChange={e => updateOption(idx, e.target.value)}
              style={{
                flex: 1, padding: '7px 10px',
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${isDuplicate || opt.trim() === '' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px', color: 'white', fontSize: '12px', outline: 'none',
              }}
            />
            {options.length > 1 && (
              <button
                type="button"
                onClick={() => removeOption(idx)}
                style={{
                  width: '26px', height: '26px', flexShrink: 0, borderRadius: '7px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        );
      })}

      {/* Avertissements inline */}
      {hasEmpty && (
        <p style={{ color: '#f87171', fontSize: '11px', margin: '2px 0 0' }}>
          Une ou plusieurs options sont vides.
        </p>
      )}
      {duplicates.length > 0 && (
        <p style={{ color: '#f87171', fontSize: '11px', margin: '2px 0 0' }}>
          Des options sont identiques — supprimez les doublons.
        </p>
      )}

      <button
        type="button"
        onClick={addOption}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px', alignSelf: 'flex-start',
          padding: '5px 10px', background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.3)', borderRadius: '7px',
          color: '#a78bfa', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
        }}
      >
        <Plus size={11} /> Ajouter une option
      </button>
    </div>
  );
}

// ─── Carte d'un champ individuel ────────────────────────────────────────────
function FieldCard({ field, index, total, onUpdate, onRemove, onMove }) {
  const [expanded, setExpanded] = useState(true);
  // ✅ FIX UX : état de confirmation suppression
  const [confirmDelete, setConfirmDelete] = useState(false);
  const meta = typeMeta(field.type);
  const Icon = meta.icon;

  // ✅ FIX UX : libellé vide → indicateur visuel dans l'en-tête
  const labelMissing = field.label.trim() === '';

  const handleRemoveClick = () => {
    if (confirmDelete) {
      onRemove();
    } else {
      setConfirmDelete(true);
      // Annulation automatique après 3 secondes
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${labelMissing && expanded ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.09)'}`,
      borderRadius: '14px', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
        borderBottom: expanded ? '1px solid rgba(255,255,255,0.07)' : 'none',
      }}>
        <GripVertical size={13} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
        <div style={{
          width: '26px', height: '26px', borderRadius: '7px',
          background: 'rgba(99,102,241,0.15)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={13} color="#a78bfa" />
        </div>
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
          <p style={{
            color: labelMissing ? 'rgba(245,158,11,0.8)' : 'white',
            fontSize: '12.5px', fontWeight: 600, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {field.label || `⚠ Libellé manquant (${meta.label})`}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>
            {meta.label}{field.required && ' · requis'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            type="button" disabled={index === 0} onClick={() => onMove(index, index - 1)}
            aria-label="Monter"
            style={{
              width: '24px', height: '24px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1,
            }}
          >
            <ChevronUp size={12} color="rgba(255,255,255,0.6)" />
          </button>
          <button
            type="button" disabled={index === total - 1} onClick={() => onMove(index, index + 1)}
            aria-label="Descendre"
            style={{
              width: '24px', height: '24px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: index === total - 1 ? 'default' : 'pointer',
              opacity: index === total - 1 ? 0.3 : 1,
            }}
          >
            <ChevronDownIcon size={12} color="rgba(255,255,255,0.6)" />
          </button>
          <button
            type="button" onClick={() => setExpanded(v => !v)}
            aria-label={expanded ? 'Réduire' : 'Développer'}
            style={{
              width: '24px', height: '24px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <Settings2 size={12} color="rgba(255,255,255,0.6)" />
          </button>

          {/* ✅ FIX UX : suppression en deux clics avec confirmation */}
          <button
            type="button"
            onClick={handleRemoveClick}
            aria-label={confirmDelete ? 'Confirmer la suppression' : 'Supprimer le champ'}
            title={confirmDelete ? 'Cliquez à nouveau pour confirmer' : 'Supprimer'}
            style={{
              height: '24px',
              padding: '0 8px',
              borderRadius: '6px',
              background: confirmDelete ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', gap: '4px', transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            <Trash2 size={11} color="#f87171" />
            {confirmDelete && (
              <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 600 }}>
                Confirmer
              </span>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', display: 'block', marginBottom: '4px' }}>
                Libellé du champ *
              </label>
              <input
                type="text"
                value={field.label}
                onChange={e => onUpdate({ ...field, label: e.target.value })}
                placeholder={meta.label}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${labelMissing ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px', color: 'white', fontSize: '12px', outline: 'none',
                }}
              />
              {/* ✅ FIX UX : message d'erreur libellé vide */}
              {labelMissing && (
                <p style={{ color: 'rgba(245,158,11,0.9)', fontSize: '10px', margin: '3px 0 0' }}>
                  Le libellé est requis
                </p>
              )}
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', display: 'block', marginBottom: '4px' }}>
                Texte indicatif
              </label>
              <input
                type="text"
                value={field.placeholder}
                onChange={e => onUpdate({ ...field, placeholder: e.target.value })}
                placeholder="Ex: Votre réponse..."
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', color: 'white', fontSize: '12px', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* ✅ FIX UX accessibilité : toggle avec role="switch", aria-checked, tabIndex, onKeyDown */}
          <label
            style={{
              display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer',
              marginBottom: meta.hasOptions ? '4px' : 0,
            }}
          >
            <div
              role="switch"
              aria-checked={field.required}
              tabIndex={0}
              onClick={() => onUpdate({ ...field, required: !field.required })}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onUpdate({ ...field, required: !field.required })}
              style={{
                width: '32px', height: '18px', borderRadius: '100px',
                background: field.required ? '#6366f1' : 'rgba(255,255,255,0.12)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                outline: 'none', cursor: 'pointer',
              }}
            >
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '3px',
                left: field.required ? '17px' : '3px', transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11.5px' }}>Champ obligatoire</span>
          </label>

          {meta.hasOptions && (
            <OptionsEditor
              options={field.options}
              onChange={(opts) => onUpdate({ ...field, options: opts })}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Menu d'ajout de champ ──────────────────────────────────────────────────
function AddFieldMenu({ onAdd }) {
  const [open, setOpen] = useState(false);
  // ✅ FIX Bug bloquant : ref pour détecter les clics extérieurs et fermer le menu
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  // ✅ Fermeture au clavier (Escape)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          width: '100%', padding: '11px', background: 'rgba(99,102,241,0.1)',
          border: '1px dashed rgba(99,102,241,0.4)', borderRadius: '12px',
          color: '#a78bfa', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
        }}
      >
        <Plus size={14} /> Ajouter un champ
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: '#0a0817', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '14px', padding: '8px', zIndex: 30,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px',
          }}
        >
          {FIELD_TYPES.map(ft => {
            const Icon = ft.icon;
            return (
              <button
                key={ft.type}
                type="button"
                role="menuitem"
                onClick={() => { onAdd(ft.type); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px',
                  background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '9px',
                  color: 'rgba(255,255,255,0.75)', fontSize: '11.5px', fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <Icon size={13} color="#a78bfa" style={{ flexShrink: 0 }} />
                {ft.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FormBuilder principal ──────────────────────────────────────────────────
// ✅ FIX Risque latent : onChange avec valeur par défaut () => {} pour éviter le crash
export default function FormBuilder({ fields = [], onChange = () => {} }) {
  const addField = useCallback((type) => {
    onChange([...fields, emptyField(type)]);
  }, [fields, onChange]);

  const updateField = useCallback((index, updated) => {
    const next = [...fields];
    next[index] = updated;
    onChange(next);
  }, [fields, onChange]);

  const removeField = useCallback((index) => {
    onChange(fields.filter((_, i) => i !== index));
  }, [fields, onChange]);

  const moveField = useCallback((from, to) => {
    if (to < 0 || to >= fields.length) return;
    const next = [...fields];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }, [fields, onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {fields.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '2px dashed rgba(255,255,255,0.12)',
          borderRadius: '16px', padding: '32px 20px', textAlign: 'center',
        }}>
          <ListChecks size={24} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12.5px', margin: 0 }}>
            Aucun champ pour l'instant — ajoutez-en un ci-dessous
          </p>
        </div>
      ) : (
        fields.map((field, idx) => (
          <FieldCard
            key={field.id}
            field={field}
            index={idx}
            total={fields.length}
            onUpdate={(updated) => updateField(idx, updated)}
            onRemove={() => removeField(idx)}
            onMove={moveField}
          />
        ))
      )}
      <AddFieldMenu onAdd={addField} />
    </div>
  );
}