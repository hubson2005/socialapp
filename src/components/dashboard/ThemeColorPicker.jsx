import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Palette, Check } from 'lucide-react';

/**
 * ThemeColorPicker — bouton de la barre du haut (pastille + palette + libellé
 * « Template carte ») qui ouvre le choix du fond du profil public. Remplace
 * l'ancienne grille de pastilles « Thème de fond - profile public » + section
 * « Personnalisé » (Couleur 1/2) par 3 modèles : Savane, Hibiscus, Lagon.
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
 *
 * [FIX MOBILE] Le menu était en position:absolute ancré au bord droit du bouton
 * palette ; sur mobile ce bouton n'est pas au bord de l'écran, donc le menu
 * débordait à gauche. Sur < 768px il passe en position:fixed, calé sur l'écran
 * (marges 12px), sous la topbar et au-dessus de la MobileNav.
 *
 * [MINIATURES] Chaque modèle est présenté comme une miniature de profil complet
 * (fond, bandes, avatar, nom, boutons de liens), en 3 colonnes.
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

// Fond du modèle (même esprit que la page publique)
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

// Miniature d'un profil complet : fond du modèle + avatar + nom + boutons de liens.
// L'avatar et le nom sont ceux de l'utilisateur (repli : disque d'accent / barre grise).
function MiniProfile({ t, profile }) {
  const name = profile?.display_name;
  const avatar = profile?.avatar_url;
  const pill = {
    display: 'flex', alignItems: 'center', gap: '3px', width: '100%', height: '10px', boxSizing: 'border-box',
    padding: '0 3px', borderRadius: '99px', background: 'rgba(255,255,255,.92)',
    boxShadow: '0 1px 2px rgba(0,0,0,.12)',
  };
  const dot = { width: '5px', height: '5px', borderRadius: '50%', background: t.accent, flexShrink: 0 };
  const bar = (w, c = 'rgba(17,24,39,.25)') => ({ display: 'block', width: w, height: '2px', borderRadius: '2px', background: c });

  return (
    <span
      aria-hidden="true"
      style={{ display: 'block', position: 'relative', width: '100%', aspectRatio: '9 / 16', borderRadius: '10px', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)', ...previewStyle(t) }}
    >
      <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '24% 9% 0' }}>
        <span style={{ width: '30%', aspectRatio: '1', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', background: avatar ? `center / cover url("${avatar}")` : t.accent, flexShrink: 0 }} />
        {name
          ? <span style={{ maxWidth: '100%', fontSize: '7px', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          : <span style={bar('50%', 'rgba(17,24,39,.55)')} />}
        <span style={bar('65%')} />
        <span style={{ height: '3px' }} />
        {[0, 1, 2, 3].map(i => (
          <span key={i} style={pill}><span style={dot} /><span style={bar(`${70 - i * 10}%`)} /></span>
        ))}
      </span>
    </span>
  );
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
        .tcp-card{display:flex;flex-direction:column;align-items:stretch;gap:6px;width:100%;box-sizing:border-box;padding:5px;
          background:transparent;border:2px solid transparent;border-radius:14px;cursor:pointer;
          text-align:center;font-family:inherit;touch-action:manipulation;transition:border-color .15s,background .15s;}
        .tcp-card:active{background:rgba(99,102,241,.06);}
        .tcp-card:focus-visible,.tcp-trigger:focus-visible{outline:2px solid #6366f1;outline-offset:2px;}
        .tcp-card[aria-checked="true"]{border-color:#111827;background:rgba(17,24,39,.04);}
        @media (hover:hover){.tcp-card:hover{background:rgba(17,24,39,.05);}}
        /* Libellé « Template carte » : masqué sur mobile (< 768px) pour ne pas
           surcharger la topbar ; l'infobulle (title) reste disponible. */
        .tcp-label{font-size:11px;font-weight:600;color:#454b5a;white-space:nowrap;}
        @media (max-width:767px){.tcp-label{display:none;}}

        /* Menu déroulant — desktop : ancré sous le bouton, aligné à droite. */
        .tcp-pop{
          position:absolute; top:calc(100% + 8px); right:0; z-index:60;
          width:min(340px, calc(100vw - 24px));
          max-height:min(80dvh, 520px);
        }
        /* Mobile : détaché du bouton et calé sur l'écran (marges 12px),
           sous la topbar, au-dessus de la MobileNav (~130px). */
        @media (max-width:767px){
          .tcp-pop{
            position:fixed;
            top:calc(env(safe-area-inset-top, 0px) + 62px);
            left:12px; right:12px; width:auto;
            max-height:calc(100dvh - env(safe-area-inset-top, 0px) - 62px - 140px);
          }
        }
      `}</style>

      {/* Déclencheur : pastille (fond actuel) + palette + libellé */}
      <button
        type="button"
        className="tcp-trigger"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Template carte"
        title="Template carte"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: open ? '#e4e6f0' : '#eef0f5', border: '1px solid #dde0ea', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', minHeight: '34px' }}
      >
        <span aria-hidden="true" style={{ width: '20px', height: '20px', borderRadius: '50%', background: `linear-gradient(135deg,${bg1},${bg2})`, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.18)' }} />
        <Palette size={15} color="#454b5a" />
        <span className="tcp-label">Template carte</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Template carte"
          className="tcp-pop"
          style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', boxSizing: 'border-box', background: '#ffffff', border: '1px solid #e6e8f0', borderRadius: '18px', padding: '14px', boxShadow: '0 20px 50px rgba(15,23,42,.18)' }}
        >
          <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#6b7280' }}>
            Modèle de fond · profil public
          </p>

          <div role="radiogroup" aria-label="Modèles" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
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
                  <span style={{ position: 'relative', display: 'block' }}>
                    <MiniProfile t={t} profile={profile} />
                    {selected && (
                      <span aria-hidden="true" style={{ position: 'absolute', top: '5px', right: '5px', width: '18px', height: '18px', borderRadius: '50%', background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={11} />
                      </span>
                    )}
                  </span>
                  <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#111827' }}>{t.name}</span>
                  <span style={{ display: 'block', fontSize: '10.5px', lineHeight: 1.3, color: '#6b7280' }}>{t.desc}</span>
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