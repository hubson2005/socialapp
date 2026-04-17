import React, { useState } from 'react';
import { Trash2, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

const PLATFORM_META = {
  instagram: { label: 'Instagram', color: '#E1306C', placeholder: 'https://instagram.com/yourname' },
  facebook: { label: 'Facebook', color: '#1877F2', placeholder: 'https://facebook.com/yourname' },
  twitter: { label: 'Twitter / X', color: '#1DA1F2', placeholder: 'https://x.com/yourname' },
  tiktok: { label: 'TikTok', color: '#010101', placeholder: 'https://tiktok.com/@yourname' },
  youtube: { label: 'YouTube', color: '#FF0000', placeholder: 'https://youtube.com/@yourname' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', placeholder: 'https://linkedin.com/in/yourname' },
  snapchat: { label: 'Snapchat', color: '#FFFC00', placeholder: 'https://snapchat.com/add/yourname' },
  whatsapp: { label: 'WhatsApp', color: '#25D366', placeholder: 'https://wa.me/yourphone' },
  telegram: { label: 'Telegram', color: '#2CA5E0', placeholder: 'https://t.me/yourname' },
  github: { label: 'GitHub', color: '#333', placeholder: 'https://github.com/yourname' },
  website: { label: 'Site web', color: '#6366f1', placeholder: 'https://votresite.com' },
  email: { label: 'Email', color: '#EA4335', placeholder: 'mailto:vous@email.com' },
  phone: { label: 'Téléphone', color: '#34A853', placeholder: 'tel:+2250700000000' },
  other: { label: 'Autre', color: '#888', placeholder: 'https://...' },
};

export default function PlatformCard({ link, index, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const meta = PLATFORM_META[link.platform] || PLATFORM_META.other;

  return (
    <div
      className="bg-white/10 rounded-2xl border border-white/10 overflow-hidden transition-all"
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="w-3.5 h-3.5 text-white/30 shrink-0" />
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: meta.color }}
        />
        <span className="text-white font-medium text-sm flex-1 truncate">{meta.label}</span>
        <button
          onClick={() => onUpdate({ ...link, enabled: !link.enabled })}
          className="text-white/50 hover:text-white transition-colors"
        >
          {link.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-white/50 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onRemove} className="text-white/40 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* URL input always visible */}
      <div className="px-3 pb-2">
        <input
          type="text"
          value={link.url || ''}
          onChange={(e) => onUpdate({ ...link, url: e.target.value })}
          placeholder={meta.placeholder}
          className="w-full bg-black/20 rounded-lg px-3 py-1.5 text-white/80 text-xs placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>

      {/* Expanded: label */}
      {expanded && (
        <div className="px-3 pb-3">
          <input
            type="text"
            value={link.label || ''}
            onChange={(e) => onUpdate({ ...link, label: e.target.value })}
            placeholder="Libellé personnalisé (optionnel)"
            className="w-full bg-black/20 rounded-lg px-3 py-1.5 text-white/80 text-xs placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>
      )}
    </div>
  );
}
