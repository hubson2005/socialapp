import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', color: '#E1306C', emoji: '📸' },
  { key: 'facebook', label: 'Facebook', color: '#1877F2', emoji: '👥' },
  { key: 'twitter', label: 'Twitter / X', color: '#1DA1F2', emoji: '🐦' },
  { key: 'tiktok', label: 'TikTok', color: '#010101', emoji: '🎵' },
  { key: 'youtube', label: 'YouTube', color: '#FF0000', emoji: '▶️' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2', emoji: '💼' },
  { key: 'snapchat', label: 'Snapchat', color: '#FFFC00', emoji: '👻' },
  { key: 'whatsapp', label: 'WhatsApp', color: '#25D366', emoji: '💬' },
  { key: 'telegram', label: 'Telegram', color: '#2CA5E0', emoji: '✈️' },
  { key: 'github', label: 'GitHub', color: '#6e5494', emoji: '🐙' },
  { key: 'website', label: 'Site web', color: '#6366f1', emoji: '🌐' },
  { key: 'email', label: 'Email', color: '#EA4335', emoji: '✉️' },
  { key: 'phone', label: 'Téléphone', color: '#34A853', emoji: '📞' },
  { key: 'other', label: 'Autre lien', color: '#888', emoji: '🔗' },
];

export default function AddPlatformDialog({ open, onOpenChange, onSelect, existingPlatforms = [] }) {
  const [search, setSearch] = useState('');

  if (!open) return null;

  const filtered = PLATFORMS.filter(
    (p) =>
      p.label.toLowerCase().includes(search.toLowerCase()) &&
      !existingPlatforms.includes(p.key)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm">Ajouter une plateforme</h3>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              autoFocus
              className="bg-transparent text-sm flex-1 focus:outline-none placeholder-muted-foreground"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Aucune plateforme trouvée</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.key}
                onClick={() => { onSelect(p.key); setSearch(''); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <span className="text-lg">{p.emoji}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{p.label}</span>
                </div>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
