import React, { useState } from 'react';
import { Trash2, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { PLATFORMS } from './AddPlatformDialog';

// [FIX THÈME] Carte calquée sur l'ancien fond sombre (rgba(255,255,255,0.25)
// + texte blanc) — quasi invisible sur le fond clair du dashboard. Repassée
// en carte blanche opaque, cohérente avec PlatformsPanel (dans
// UserDashboard.jsx) qui l'englobe.
export default function PlatformCard({ link, index, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  const meta = PLATFORMS[link.platform] || {
    label: link.platform || 'Autre',
    color: '#444e60',
    placeholder: 'https://...',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#8B8B8B"/>
        <path d="M13.5 8.5l2-2a2.1 2.1 0 0 1 3 3l-2 2a2.1 2.1 0 0 1-2.8.1l-.7.7c.9.9 2.3 1 3.2.1l2-2a3.1 3.1 0 0 0-4.4-4.4l-2 2c-.9.9-.9 2.3 0 3.2l.7-.7a2.1 2.1 0 0 1 0-3z" fill="white"/>
        <path d="M10.5 15.5l-2 2a2.1 2.1 0 0 1-3-3l2-2a2.1 2.1 0 0 1 2.8-.1l.7-.7c-.9-.9-2.3-1-3.2-.1l-2 2a3.1 3.1 0 0 0 4.4 4.4l2-2c.9-.9.9-2.3 0-3.2l-.7.7a2.1 2.1 0 0 1 0 3z" fill="white"/>
      </svg>
    ),
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e6e8f0',
        borderLeft: '3px solid ' + meta.color,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        transition: 'all 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px' }}>

        {/* Grip */}
        <GripVertical style={{ width: '14px', height: '14px', color: '#c3c8d6', flexShrink: 0, cursor: 'grab' }} />

        {/* Icône SVG de la plateforme */}
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {meta.icon}
        </div>

        {/* Label */}
        <span style={{
          color: '#161a2e', fontWeight: 600, fontSize: '13px',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {link.label || meta.label}
        </span>

        {/* Toggle visible */}
        <button
          onClick={() => onUpdate({ ...link, enabled: !link.enabled })}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
            color: link.enabled ? '#6b7280' : '#c3c8d6',
            display: 'flex', alignItems: 'center',
          }}
          title={link.enabled ? 'Masquer' : 'Afficher'}
        >
          {link.enabled
            ? <Eye style={{ width: '14px', height: '14px' }} />
            : <EyeOff style={{ width: '14px', height: '14px' }} />
          }
        </button>

        {/* Toggle expand */}
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
            color: '#9095a5',
            display: 'flex', alignItems: 'center',
          }}
        >
          {expanded
            ? <ChevronUp style={{ width: '14px', height: '14px' }} />
            : <ChevronDown style={{ width: '14px', height: '14px' }} />
          }
        </button>

        {/* Supprimer */}
        <button
          onClick={onRemove}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
            color: '#c3c8d6',
            display: 'flex', alignItems: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#c3c8d6'}
          title="Supprimer"
        >
          <Trash2 style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* URL — toujours visible */}
      <div style={{ padding: '0 12px 10px' }}>
        <input
          type="text"
          value={link.url || ''}
          onChange={(e) => onUpdate({ ...link, url: e.target.value })}
          placeholder={meta.placeholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#f6f7fb',
            border: '1px solid #e6e8f0',
            borderRadius: '10px',
            padding: '7px 12px',
            color: '#161a2e',
            fontSize: '12px',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
          onBlur={(e) => e.target.style.borderColor = '#e6e8f0'}
        />
      </div>

      {/* Libellé personnalisé — visible si expanded */}
      {expanded && (
        <div style={{ padding: '0 12px 12px' }}>
          <input
            type="text"
            value={link.label || ''}
            onChange={(e) => onUpdate({ ...link, label: e.target.value })}
            placeholder="Libellé personnalisé (optionnel)"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#f6f7fb',
              border: '1px solid #e6e8f0',
              borderRadius: '10px',
              padding: '7px 12px',
              color: '#161a2e',
              fontSize: '12px',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e6e8f0'}
          />
          <p style={{ color: '#9095a5', fontSize: '10px', margin: '5px 0 0', lineHeight: 1.4 }}>
            Ce texte remplace le nom de la plateforme sur votre profil public.
          </p>
        </div>
      )}
    </div>
  );
}