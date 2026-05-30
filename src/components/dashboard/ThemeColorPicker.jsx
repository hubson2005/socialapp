import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';

const PRESETS = [
  { label: 'Violet', value: '#4f46e5|#7c3aed' },
  { label: 'Nuit', value: '#0f0a1e|#2d1b69' },
  { label: 'Océan', value: '#0c4a6e|#0ea5e9' },
  { label: 'Forêt', value: '#14532d|#16a34a' },
  { label: 'Coucher', value: '#7c2d12|#ea580c' },
  { label: 'Rose', value: '#831843|#db2777' },
  { label: 'Ardoise', value: '#1e293b|#475569' },
  { label: 'Noir', value: '#000000|#1a1a2e' },
  { label: 'violet', value: '#3d1152|#44134c' },
  { label: 'beige', value: '#D2B48C|#e5cab1' },
];

export default function ThemeColorPicker({ profile, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = profile.theme_color || '#4f46e5|#7c3aed';

  const getColors = (val) => {
    if (val?.includes('|')) return val.split('|');
    return [val, val];
  };

  const [c1, c2] = getColors(current);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
      >
        <div
          className="w-4 h-4 rounded-full"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        />
        <Palette className="w-3.5 h-3.5 text-white" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-2xl p-3 shadow-2xl w-52">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Thème de fond</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {PRESETS.map((p) => {
              const [pc1, pc2] = p.value.split('|');
              const isActive = current === p.value;
              return (
                <button
                  key={p.value}
                  title={p.label}
                  onClick={() => { onUpdate({ theme_color: p.value }); setOpen(false); }}
                  className={`w-10 h-10 rounded-xl transition-all ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105'}`}
                  style={{ background: `linear-gradient(135deg, ${pc1}, ${pc2})` }}
                />
              );
            })}
          </div>

          {/* Custom color inputs */}
          <p className="text-xs font-semibold text-muted-foreground mb-2">Personnalisé</p>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Couleur 1</label>
              <input
                type="color"
                value={c1}
                onChange={(e) => onUpdate({ theme_color: `${e.target.value}|${c2}` })}
                className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Couleur 2</label>
              <input
                type="color"
                value={c2}
                onChange={(e) => onUpdate({ theme_color: `${c1}|${e.target.value}` })}
                className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


