import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Palette, Check } from 'lucide-react';

/**
 * ThemeColorPicker — bouton de la barre du haut (pastille + palette) qui ouvre
 * le choix du fond du profil public. Remplace l'ancienne grille de pastilles
 * « Thème de fond - profile public » + section « Personnalisé » (Couleur 1/2)
 * par 3 modèles : Savane, Hibiscus, Lagon.
 *
 * MÊME API qu'avant : <ThemeColorPicker profile={localProfile} onUpdate={updateLocal} />
 * → UserDashboard.jsx n'a pas à changer.
 *
 * Stockage : link_profiles.theme_color = « bg1|bg2|idModèle » (ex. « #f6efe3|#e9dcc6|savane »).
 * Aucune migration SQL. Les anciens profils (« bg1|bg2 » seul) s'affichent comme avant,
 * sans modèle coché. PublicProfile.jsx ignore déjà le 3e segment.
 *
 * ⚠️ Les modèles sont dupliqués dans PublicProfile.jsx (BG_TEMPLATES, voir le patch)
 * — garder les deux listes synchronisées.
 */
const TEMPLATES = [
  { id: 'savane',   name: 'Savane',   desc: 'Crème et orange',       bg1: '#f6efe3', bg2: '#e9dcc6', accent: '#e8a25f', motif: true, band: true,  dia: true },
  { id: 'hibiscus', name: 'Hibiscus', desc: 'Rose poudré et corail', bg1: '#fff2ef', bg2: '#ffd8de', accent: '#d6336c', motif: true, band: true,  dia: true },
  { id: 'lagon',    name: 'Lagon',    desc: 'Aqua clair et bleu',    bg1: '#eafaf7', bg2: '#c2eae3', accent: '#0f9d94', motif: true, band: false, dia: true },
];

const uri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const bogolanTile = (c, op) => uri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" opacity="${op}">
    <path d="M18 8 V28 M8 18 H28" stroke="${c}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M54 44 L64 54 L54 64 L44 54 Z" fill="none" stroke="${c}" stroke-width="1.6"/>
    <circle cx="54" cy="18" r="2.6" fill="${c}"/><circle cx="18" cy="54" r="2.6" fill="${c}"/>
  </svg>`
);
const latticeTile = (c, op) => uri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="56" viewBox="0 0 40 56" opacity="${op}">
    <path d="M0 14 L20 0 L40 14 L20 28 Z M0 42 L20 28 L40 42 L20 56 Z" fill="none" stroke="${c}" stroke-width="1.6"/>
  </svg>`
);

// Miniature du modèle (même esprit que la page publique)
function previewStyle(t) {
  const layers = [], rep = [], pos = [], size = [];
  if (t.band) {
    const tile = latticeTile(t.accent, 0.6);
    layers.push(tile, tile);
    rep.push('repeat-x', 'repeat-x');
    pos.push('0 0', '0 100%');
    size.push('20px 28px', '20px 28px');
  }
  if (t.motif) {
    layers.push(bogolanTile(t.accent, 0.35));
    rep.push('repeat');
    pos.push('0 0');
    size.push('36px 36px');
  }
  layers.push('radial-gradient(circle at 50% 20%, rgba(255,255,255,0.8), transparent 60%)');
  layers.push(`linear-gradient(160deg,${t.bg1},${t.bg2})`);
  rep.push('no-repeat', 'no-repeat');
  pos.push('0 0', '0 0');
  size.push('100% 100%', '100% 100%');
  return {
    backgroundImage: layers.join(','),
    backgroundRepeat: rep.join(','),
    backgroundPosition: pos.join(','),
    backgroundSize: size.join(','),
  };
}

export default function ThemeColorPicker({ profile, onUpdate }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const themeColor = profile?.theme_color || '';
  const [bg1 = '#0f0a1e', bg2 = '#2d1b69', currentId = ''] = useMemo(() => themeColor.split('|'), [themeColor]);
  const hasImage = !!profile?.bg_image_url;

  // Fermeture : clic/touch en dehors + Échap
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (t) => {
    if (onUpdate) onUpdate({ theme_color: `${t.bg1}|${t.bg2}|${t.id}` });
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <style>{`
        .tcp-card{display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;padding:8px;
          background:transparent;border:2px solid transparent;border-radius:16px;cursor:pointer;
          text-align:left;font-family:inherit;touch-action:manipulation;transition:border-color .15s,background .15s;}
        .tcp-card:active{background:rgba(99,102,241,.06);}
        .tcp-card:focus-visible,.tcp-trigger:focus-visible{outline:2px solid #6366f1;outline-offset:2px;}
        .tcp-card[aria-checked="true"]{border-color:#111827;background:rgba(17,24,39,.04);}
        @media (hover:hover){.tcp-card:hover{background:rgba(17,24,39,.05);}}
      `}</style>

      {/* Déclencheur : pastille (fond actuel) + palette */}
      <button
        type="button"
        className="tcp-trigger"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Modèle de fond du profil public"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: open ? '#e4e6f0' : '#eef0f5', border: '1px solid #dde0ea', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', minHeight: '34px' }}
      >
        <span aria-hidden="true" style={{ width: '20px', height: '20px', borderRadius: '50%', background: `linear-gradient(135deg,${bg1},${bg2})`, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.18)' }} />
        <Palette size={15} color="#454b5a" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Modèle de fond du profil public"
          style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60, width: 'min(300px, calc(100vw - 24px))', maxHeight: 'min(80dvh, 520px)', overflowY: 'auto', boxSizing: 'border-box', background: '#ffffff', border: '1px solid #e6e8f0', borderRadius: '18px', padding: '14px', boxShadow: '0 20px 50px rgba(15,23,42,.18)' }}
        >
          <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#6b7280' }}>
            Modèle de fond · profil public
          </p>

          <div role="radiogroup" aria-label="Modèles" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {TEMPLATES.map((t) => {
              const selected = t.id === currentId;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className="tcp-card"
                  onClick={() => choose(t)}
                >
                  <span
                    aria-hidden="true"
                    style={{ width: '84px', height: '64px', flexShrink: 0, borderRadius: '12px', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)', ...previewStyle(t) }}
                  />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#111827' }}>{t.name}</span>
                    <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{t.desc}</span>
                  </span>
                  {selected && (
                    <span aria-hidden="true" style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {hasImage && (
            <p style={{ margin: '10px 2px 0', fontSize: '11.5px', lineHeight: 1.5, color: '#b45309' }}>
              Une image de fond est active : elle remplace le modèle sur le profil public.
            </p>
          )}
        </div>
      )}
    </div>
  );
}