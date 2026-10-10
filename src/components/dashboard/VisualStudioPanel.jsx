import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Upload, Download, Copy, Trash2, Loader2, RefreshCw, Plus, Power, FileDown,
  MousePointerClick, Link2, Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';

/**
 * VisualStudioPanel — « Studio visuel »
 * ─────────────────────────────────────────────────────────────────
 * 1. Importer une image
 * 2. Créer un lien tracké (socialapp.work/r/xxxxxxx) ou en choisir un
 * 3. Incruster le QR code + le lien sous / sur l'image, télécharger le PNG
 * 4. Publier l'image : chaque clic ou scan passe par le lien, qui enregistre
 *    l'IP complète, le pays / la ville (approx.), l'appareil, le navigateur,
 *    et le réseau d'origine, puis redirige vers la destination.
 *
 * Usage : <VisualStudioPanel profileId={id} />
 *
 * Prérequis : npm i qrcode · table tracked_links / tracked_clicks (tracked_links.sql)
 *             · route Vercel api/r.mjs + règle /r/:code dans vercel.json
 *
 * Responsive : mobile d'abord (1 colonne), tablette (2 colonnes), champs 16px
 * (pas de zoom iOS), safe-areas, cibles tactiles ≥ 44px, marge sous la barre flottante.
 * ─────────────────────────────────────────────────────────────────
 */

// Domaine utilisé dans les liens courts et les QR codes
const SHORT_BASE = 'https://socialapp.work';

const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // sans caractères ambigus (0/o, 1/l/i)
const makeCode = (len = 7) => {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
};

const normalizeUrl = (raw) => {
  let v = (raw || '').trim();
  if (!v) throw new Error('Saisissez l’adresse de destination');
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = 'https://' + v;
  let u;
  try { u = new URL(v); } catch { throw new Error('Adresse de destination invalide'); }
  if (!/^https?:$/.test(u.protocol)) throw new Error('Seules les adresses http(s) sont acceptées');
  return u.toString();
};

const shortUrlOf = (code) => `${SHORT_BASE}/r/${code}`;
const stripScheme = (u) => u.replace(/^https?:\/\//, '');

const flagEmoji = (code) => {
  try {
    return code && code.length === 2
      ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => c.charCodeAt(0) + 127397))
      : '🌐';
  } catch { return '🌐'; }
};

const fmtDate = (iso) => (iso
  ? new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—');

/* ───────────────────────── Composition de l'image ───────────────────────── */
// <draw>
const MONTHLY_QUOTA = 3; // doit correspondre au trigger SQL tracked_link_quota_check
const MAX_SIDE = 2048; // limite la taille du canvas (mémoire des téléphones)

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawComposite(canvas, img, opts) {
  const { shortUrl, position, sizePct, showText, caption } = opts;
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const W = Math.round(img.naturalWidth * scale);
  const H = Math.round(img.naturalHeight * scale);
  const base = Math.min(W, H);

  // QR code net : taille de module entière (bords francs = scan fiable)
  const target = Math.max(96, Math.round((base * sizePct) / 100));
  const modules = QRCode.create(shortUrl, { errorCorrectionLevel: 'M' }).modules.size;
  const moduleScale = Math.max(2, Math.floor(target / modules));
  const qr = modules * moduleScale;
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, shortUrl, {
    errorCorrectionLevel: 'M', margin: 0, scale: moduleScale,
    color: { dark: '#111827', light: '#ffffff' },
  });

  const pad = Math.round(qr * 0.14); // zone de silence autour du QR
  const label = stripScheme(shortUrl);
  const font = (px, w = 600) => `${w} ${px}px "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif`;
  const ctx = canvas.getContext('2d');

  if (position === 'bar') {
    // Bande blanche sous l'image : QR à gauche, texte à droite
    const barH = qr + pad * 2;
    canvas.width = W;
    canvas.height = H + barH;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H + barH);
    ctx.drawImage(img, 0, 0, W, H);
    ctx.drawImage(qrCanvas, pad, H + pad, qr, qr);

    const textX = pad * 2 + qr;
    const maxTextW = W - textX - pad;
    let fs = Math.max(14, Math.round(barH * 0.2));
    ctx.fillStyle = '#111827';
    ctx.textBaseline = 'alphabetic';
    ctx.font = font(fs, 700);
    while (ctx.measureText(caption).width > maxTextW && fs > 10) { fs -= 1; ctx.font = font(fs, 700); }
    const capY = H + barH / 2 - (showText ? fs * 0.2 : -fs * 0.35);
    ctx.fillText(caption, textX, capY);
    if (showText) {
      let fs2 = Math.max(12, Math.round(fs * 0.8));
      ctx.font = font(fs2, 500);
      while (ctx.measureText(label).width > maxTextW && fs2 > 9) { fs2 -= 1; ctx.font = font(fs2, 500); }
      ctx.fillStyle = '#6366f1';
      ctx.fillText(label, textX, capY + fs2 * 1.5);
    }
    return { width: W, height: H + barH };
  }

  // Pastille blanche posée sur l'image (bas-droite ou bas-gauche)
  canvas.width = W;
  canvas.height = H;
  ctx.drawImage(img, 0, 0, W, H);

  let fs = Math.max(10, Math.round(qr * 0.14));
  let textH = 0;
  if (showText) {
    ctx.font = font(fs, 600);
    while (ctx.measureText(label).width > qr && fs > 8) { fs -= 1; ctx.font = font(fs, 600); }
    textH = fs + Math.round(pad * 0.5);
  }
  const plateW = qr + pad * 2;
  const plateH = qr + pad * 2 + textH;
  const m = Math.round(base * 0.03);
  const x = position === 'bl' ? m : W - plateW - m;
  const y = H - plateH - m;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = Math.round(pad * 0.9);
  ctx.shadowOffsetY = Math.round(pad * 0.25);
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x, y, plateW, plateH, Math.round(pad * 0.9));
  ctx.fill();
  ctx.restore();

  ctx.drawImage(qrCanvas, x + pad, y + pad, qr, qr);
  if (showText) {
    ctx.fillStyle = '#111827';
    ctx.textBaseline = 'alphabetic';
    ctx.font = font(fs, 600);
    ctx.textAlign = 'center';
    ctx.fillText(label, x + plateW / 2, y + pad + qr + pad * 0.35 + fs);
    ctx.textAlign = 'start';
  }
  return { width: W, height: H };
}
// </draw>

/* ───────────────────────── Styles responsives ───────────────────────── */
const CSS = `
.vsp-root{
  box-sizing:border-box; width:100%; margin:0 auto; max-width:1040px;
  padding:16px; padding-left:max(16px, env(safe-area-inset-left)); padding-right:max(16px, env(safe-area-inset-right));
  padding-bottom:calc(120px + env(safe-area-inset-bottom));
  color:#151329; -webkit-text-size-adjust:100%; text-size-adjust:100%; -webkit-tap-highlight-color:transparent;
}
.vsp-root *, .vsp-root *::before, .vsp-root *::after{ box-sizing:border-box; }
.vsp-root button{ font-family:inherit; touch-action:manipulation; }
.vsp-h2{ margin:0; font-size:20px; font-weight:800; }
.vsp-sub{ margin:4px 0 14px; font-size:13px; color:#6b7280; }

.vsp-card{ background:#fff; border:1px solid #e6e8f0; border-radius:16px; padding:14px; box-shadow:0 1px 2px rgba(16,18,40,.04), 0 1px 8px rgba(16,18,40,.03); min-width:0; }
.vsp-card + .vsp-card{ margin-top:12px; }
.vsp-step{ display:flex; align-items:center; gap:8px; margin:0 0 10px; font-size:14px; font-weight:700; }
.vsp-step i{ display:inline-flex; width:22px; height:22px; border-radius:999px; background:#6366f1; color:#fff; font-style:normal; font-size:12px; align-items:center; justify-content:center; flex-shrink:0; }

.vsp-grid{ display:grid; grid-template-columns:1fr; gap:12px; }
.vsp-grid > .vsp-card{ margin-top:0; }
.vsp-col{ display:grid; gap:12px; align-content:start; min-width:0; }
.vsp-col > .vsp-card{ margin-top:0; }

.vsp-input{
  width:100%; min-height:46px; padding:10px 12px; border-radius:10px; border:1px solid #d1d5db;
  background:#fff; color:#111827; font-size:16px; line-height:1.3; font-family:inherit;
  -webkit-appearance:none; appearance:none; outline:none;
}
.vsp-input:focus{ border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.15); }
.vsp-label{ display:block; margin:10px 0 5px; font-size:12px; font-weight:700; color:#6b7280; }
.vsp-label:first-of-type{ margin-top:0; }

.vsp-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:46px; padding:0 16px;
  border-radius:10px; border:1px solid #d1d5db; background:#fff; color:#374151; font-size:14px; font-weight:700; cursor:pointer;
}
.vsp-btn.primary{ background:#6366f1; border-color:#6366f1; color:#fff; }
.vsp-btn.block{ width:100%; margin-top:12px; }
.vsp-btn:disabled{ opacity:.5; cursor:not-allowed; }
.vsp-icon{
  display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; flex-shrink:0;
  border-radius:10px; border:1px solid #e5e7eb; background:#fff; color:#374151; cursor:pointer;
}
.vsp-icon.danger{ color:#ef4444; border-color:#ef444455; background:#ef444414; }
.vsp-icon.on{ color:#16a34a; border-color:#22c55e55; background:#22c55e14; }

.vsp-drop{
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; text-align:center;
  min-height:112px; padding:14px; border:2px dashed #c7cbe0; border-radius:14px; background:#f8f9fc; color:#6b7280; cursor:pointer; font-size:13px;
}
.vsp-drop b{ color:#151329; font-size:14px; }
.vsp-file{ position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; }

.vsp-seg{ display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; }
.vsp-seg button{ min-height:46px; padding:6px; border-radius:10px; border:1px solid #d1d5db; background:#fff; color:#374151; font-size:13px; font-weight:700; cursor:pointer; }
.vsp-seg button.on{ border-color:#6366f1; background:rgba(99,102,241,.1); color:#4f46e5; }
.vsp-range{ width:100%; height:44px; accent-color:#6366f1; }
.vsp-check{ display:flex; align-items:center; gap:10px; min-height:44px; font-size:14px; cursor:pointer; }
.vsp-check input{ width:20px; height:20px; accent-color:#6366f1; }

.vsp-preview{ display:flex; justify-content:center; align-items:flex-start; background:
  repeating-conic-gradient(#f1f2f7 0% 25%, #fafbfd 0% 50%) 0 0 / 18px 18px; border:1px solid #e6e8f0; border-radius:12px; padding:8px; min-height:140px; }
.vsp-preview canvas{ display:block; max-width:100%; height:auto; max-height:70vh; border-radius:6px; }
.vsp-hint{ margin:8px 0 0; font-size:12px; color:#6b7280; line-height:1.45; }
.vsp-warn{ color:#b45309; }

.vsp-links{ display:grid; grid-template-columns:1fr; gap:8px; }
.vsp-link{
  display:grid; gap:8px; padding:12px; border:1px solid #e6e8f0; border-radius:14px; background:#fff; cursor:pointer; min-width:0;
}
.vsp-link.sel{ border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
.vsp-link.off{ opacity:.6; }
.vsp-link-top{ display:flex; align-items:center; gap:8px; min-width:0; }
.vsp-link-name{ flex:1; min-width:0; font-weight:700; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.vsp-badge{ flex-shrink:0; padding:3px 9px; border-radius:999px; background:rgba(99,102,241,.1); color:#4f46e5; font-size:12px; font-weight:700; }
.vsp-url{ font-size:12px; color:#6366f1; font-weight:600; overflow-wrap:anywhere; }
.vsp-dest{ font-size:12px; color:#6b7280; overflow-wrap:anywhere; }
.vsp-actions{ display:flex; flex-wrap:wrap; gap:6px; }

.vsp-stats{ display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:12px; }
.vsp-stat{ background:#f8f9fc; border:1px solid #e6e8f0; border-radius:12px; padding:10px; text-align:center; min-width:0; }
.vsp-stat b{ display:block; font-size:20px; font-weight:800; }
.vsp-stat span{ font-size:11px; color:#6b7280; }

.vsp-clicks{ display:grid; grid-template-columns:1fr; gap:8px; }
.vsp-click{ padding:10px 12px; border:1px solid #e6e8f0; border-radius:12px; background:#fff; display:grid; gap:3px; min-width:0; }
.vsp-click.bot{ opacity:.55; background:#f8f9fc; }
.vsp-ip{ font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:14px; font-weight:700; overflow-wrap:anywhere; }
.vsp-meta{ font-size:12px; color:#6b7280; overflow-wrap:anywhere; }
.vsp-tag{ display:inline-block; margin-left:6px; padding:1px 7px; border-radius:999px; background:#e5e7eb; color:#4b5563; font-size:10px; font-weight:700; vertical-align:middle; }
.vsp-tools{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:12px; }
.vsp-tools .vsp-check{ flex:1; min-width:160px; }
.vsp-empty{ text-align:center; color:#9ca3af; font-size:13px; padding:22px 8px; }

@media (min-width:640px){
  .vsp-root{ padding:20px; padding-bottom:calc(120px + env(safe-area-inset-bottom)); }
  .vsp-links{ grid-template-columns:repeat(2, minmax(0,1fr)); }
  .vsp-clicks{ grid-template-columns:repeat(2, minmax(0,1fr)); }
}
@media (min-width:900px){
  .vsp-grid{ grid-template-columns:minmax(0,5fr) minmax(0,6fr); align-items:start; }
}
@media (max-width:360px){
  .vsp-root{ padding-left:max(12px, env(safe-area-inset-left)); padding-right:max(12px, env(safe-area-inset-right)); }
  .vsp-card{ padding:12px; }
}
@media (max-height:500px) and (orientation:landscape){
  .vsp-root{ padding-bottom:calc(90px + env(safe-area-inset-bottom)); }
}
`;

/* ───────────────────────── Composant ───────────────────────── */
export default function VisualStudioPanel({ profileId }) {
  const [links, setLinks]         = useState([]);
  const [loadingLinks, setLL]     = useState(true);
  const [selectedId, setSelected] = useState(null);
  const [clicks, setClicks]       = useState([]);
  const [loadingClicks, setLC]    = useState(false);
  const [hideBots, setHideBots]   = useState(true);
  const [usedThisMonth, setUsed] = useState(0);

  const [img, setImg]             = useState(null);
  const [imgName, setImgName]     = useState('');
  const [name, setName]           = useState('');
  const [dest, setDest]           = useState('');
  const [creating, setCreating]   = useState(false);

  const [position, setPosition]   = useState('br');
  const [sizePct, setSizePct]     = useState(22);
  const [showText, setShowText]   = useState(true);
  const [caption, setCaption]     = useState('Scannez pour accéder au lien');
  const [drawing, setDrawing]     = useState(false);

  const canvasRef = useRef(null);
  const fileRef   = useRef(null);

  const activeLink = useMemo(() => links.find((l) => l.id === selectedId) || null, [links, selectedId]);
  const previewUrl = activeLink ? shortUrlOf(activeLink.code) : shortUrlOf('exemple');

  /* ── Chargement des liens ── */
  const loadLinks = useCallback(async () => {
    if (!profileId) return;
    setLL(true);
    const { data, error } = await supabase
      .from('tracked_links').select('*')
      .eq('profile_id', String(profileId))
      .order('created_at', { ascending: false });
    if (error) toast.error('Chargement des liens : ' + error.message);
    else setLinks(data || []);
    setLL(false);
  }, [profileId]);
  useEffect(() => { loadLinks(); }, [loadLinks]);

  /* ── Quota mensuel (compteur jamais décrémenté côté base) ── */
  const loadQuota = useCallback(async () => {
    const d = new Date();
    const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const { data } = await supabase.from('tracked_link_quota').select('n').eq('month', month).maybeSingle();
    setUsed(data?.n || 0);
  }, []);
  useEffect(() => { loadQuota(); }, [loadQuota]);

  /* ── Chargement des clics du lien sélectionné ── */
  const loadClicks = useCallback(async (id) => {
    if (!id) { setClicks([]); return; }
    setLC(true);
    const { data, error } = await supabase
      .from('tracked_clicks').select('*')
      .eq('link_id', id)
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) toast.error('Chargement des clics : ' + error.message);
    else setClicks(data || []);
    setLC(false);
  }, []);
  useEffect(() => { loadClicks(selectedId); }, [selectedId, loadClicks]);

  /* ── Aperçu de l'image composée ── */
  useEffect(() => {
    if (!img || !canvasRef.current) return undefined;
    let cancelled = false;
    setDrawing(true);
    drawComposite(canvasRef.current, img, { shortUrl: previewUrl, position, sizePct, showText, caption })
      .catch((e) => { if (!cancelled) toast.error('Aperçu : ' + e.message); })
      .finally(() => { if (!cancelled) setDrawing(false); });
    return () => { cancelled = true; };
  }, [img, previewUrl, position, sizePct, showText, caption]);

  /* ── Import de l'image ── */
  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast.error('Choisissez un fichier image'); return; }
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { setImg(im); setImgName(file.name.replace(/\.[^.]+$/, '')); };
    im.onerror = () => { URL.revokeObjectURL(url); toast.error('Image illisible'); };
    im.src = url;
  };

  /* ── Création d'un lien ── */
  const createLink = async () => {
    if (creating) return;
    if (usedThisMonth >= MONTHLY_QUOTA) { toast.error(`Quota atteint : ${MONTHLY_QUOTA} liens par mois. Il se renouvelle le 1er du mois prochain.`); return; }
    let destination;
    try { destination = normalizeUrl(dest); } catch (e) { toast.error(e.message); return; }
    setCreating(true);
    let created = null;
    for (let i = 0; i < 4 && !created; i++) {
      const { data, error } = await supabase
        .from('tracked_links')
        .insert({
          profile_id: String(profileId),
          code: makeCode(),
          name: name.trim() || stripScheme(destination).slice(0, 60),
          destination_url: destination,
        })
        .select().single();
      if (!error) created = data;
      else if (error.code !== '23505') { toast.error(error.message); break; }
    }
    if (created) {
      setLinks((prev) => [created, ...prev]);
      setSelected(created.id);
      setName(''); setDest('');
      setUsed((n) => n + 1);
      toast.success('Lien créé : ' + shortUrlOf(created.code));
    }
    setCreating(false);
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); toast.success('Copié'); }
    catch { toast.error('Copie impossible'); }
  };

  const toggleActive = async (l) => {
    const next = !l.active;
    setLinks((prev) => prev.map((x) => (x.id === l.id ? { ...x, active: next } : x)));
    const { error } = await supabase.from('tracked_links').update({ active: next }).eq('id', l.id);
    if (error) {
      setLinks((prev) => prev.map((x) => (x.id === l.id ? { ...x, active: l.active } : x)));
      toast.error(error.message);
    }
  };

  const removeLink = async (l) => {
    if (!window.confirm(`Supprimer « ${l.name} » et tous ses clics ? Les images déjà publiées avec ce QR code ne redirigeront plus.`)) return;
    const { error } = await supabase.from('tracked_links').delete().eq('id', l.id);
    if (error) { toast.error(error.message); return; }
    setLinks((prev) => prev.filter((x) => x.id !== l.id));
    if (selectedId === l.id) { setSelected(null); setClicks([]); }
  };

  /* ── Téléchargement du PNG ── */
  const download = () => {
    if (!activeLink) { toast.error('Créez ou sélectionnez un lien d’abord'); return; }
    canvasRef.current?.toBlob((blob) => {
      if (!blob) { toast.error('Export impossible'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${imgName || 'image'}-${activeLink.code}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  };

  /* ── Export CSV des clics ── */
  const exportCsv = () => {
    const rows = visibleClicks;
    if (!rows.length) { toast.error('Aucun clic à exporter'); return; }
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Date', 'IP', 'Pays', 'Region', 'Ville', 'Appareil', 'Systeme', 'Navigateur', 'Source', 'Referent', 'Robot'];
    const body = rows.map((c) => [c.created_at, c.ip, c.country, c.region, c.city, c.device, c.os, c.browser, c.source, c.referrer, c.is_bot ? 'oui' : 'non'].map(esc).join(','));
    const blob = new Blob(['﻿' + [head.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clics-${activeLink?.code || 'lien'}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  const visibleClicks = useMemo(() => (hideBots ? clicks.filter((c) => !c.is_bot) : clicks), [clicks, hideBots]);
  const stats = useMemo(() => {
    const human = clicks.filter((c) => !c.is_bot);
    const ips = new Set(human.map((c) => c.ip).filter(Boolean));
    const countries = new Set(human.map((c) => c.country).filter(Boolean));
    return { total: human.length, ips: ips.size, countries: countries.size };
  }, [clicks]);

  return (
    <div className="vsp-root">
      <style>{CSS}</style>

      <h2 className="vsp-h2">Studio visuel</h2>
      <p className="vsp-sub">Ajoutez un QR code tracké à vos images, publiez-les et voyez qui clique.</p>

      <div className="vsp-grid">
        {/* ── Colonne gauche : réglages ── */}
        <div className="vsp-col">
          <div className="vsp-card">
            <h3 className="vsp-step"><i>1</i> Image</h3>
            <label className="vsp-drop" htmlFor="vsp-file">
              <ImageIcon size={26} />
              <b>{img ? 'Changer l’image' : 'Importer une image'}</b>
              <span>{img ? `${imgName} · ${img.naturalWidth}×${img.naturalHeight}px` : 'PNG, JPG ou WebP'}</span>
            </label>
            <input id="vsp-file" ref={fileRef} className="vsp-file" type="file" accept="image/*" onChange={onFile} />
          </div>

          <div className="vsp-card">
            <h3 className="vsp-step"><i>2</i> Lien tracké</h3>
            <label className="vsp-label" htmlFor="vsp-name">Nom (pour vous repérer)</label>
            <input id="vsp-name" className="vsp-input" placeholder="Ex : Promo octobre" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            <label className="vsp-label" htmlFor="vsp-dest">Où doit mener le clic ?</label>
            <input id="vsp-dest" className="vsp-input" placeholder="https://socialapp.work/mon-profil" value={dest}
              inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="done"
              onChange={(e) => setDest(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createLink()} />
            <button type="button" className="vsp-btn primary block" onClick={createLink} disabled={creating || !dest.trim() || usedThisMonth >= MONTHLY_QUOTA}>
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Créer le lien tracké
            </button>
            <p className="vsp-hint">Ou touchez un lien existant dans la liste plus bas pour le réutiliser.</p>
          </div>

          <div className="vsp-card">
            <h3 className="vsp-step"><i>3</i> Incrustation</h3>
            <span className="vsp-label">Emplacement du QR code</span>
            <div className="vsp-seg" role="radiogroup" aria-label="Emplacement">
              {[['br', 'Bas droite'], ['bl', 'Bas gauche'], ['bar', 'Bande sous l’image']].map(([id, lbl]) => (
                <button type="button" key={id} role="radio" aria-checked={position === id} className={position === id ? 'on' : ''} onClick={() => setPosition(id)}>{lbl}</button>
              ))}
            </div>
            <label className="vsp-label" htmlFor="vsp-size">Taille du QR code : {sizePct}%</label>
            <input id="vsp-size" className="vsp-range" type="range" min="18" max="36" step="1" value={sizePct} onChange={(e) => setSizePct(Number(e.target.value))} />
            <label className="vsp-check">
              <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} />
              Afficher le lien sous le QR code
            </label>
            {position === 'bar' && (
              <>
                <label className="vsp-label" htmlFor="vsp-cap">Texte de la bande</label>
                <input id="vsp-cap" className="vsp-input" value={caption} maxLength={60} onChange={(e) => setCaption(e.target.value)} />
              </>
            )}
            <p className="vsp-hint">Gardez 20 % ou plus : les réseaux compressent l’image, et un QR code trop petit ne se scanne plus.</p>
          </div>
        </div>

        {/* ── Colonne droite : aperçu ── */}
        <div className="vsp-col">
          <div className="vsp-card">
            <h3 className="vsp-step"><i>4</i> Aperçu et téléchargement</h3>
            <div className="vsp-preview">
              {img ? <canvas ref={canvasRef} aria-label="Aperçu de l’image avec QR code" />
                   : <div className="vsp-empty">Importez une image pour voir l’aperçu</div>}
            </div>
            {img && !activeLink && (
              <p className="vsp-hint vsp-warn">Aperçu avec un lien d’exemple. Créez ou sélectionnez un lien pour activer le téléchargement.</p>
            )}
            {img && activeLink && (
              <p className="vsp-hint">Lien utilisé : <b>{stripScheme(previewUrl)}</b></p>
            )}
            <button type="button" className="vsp-btn primary block" onClick={download} disabled={!img || !activeLink || drawing}>
              {drawing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Télécharger le PNG
            </button>
          </div>
        </div>
      </div>

      {/* ── Mes liens ── */}
      <div className="vsp-card" style={{ marginTop: 12 }}>
        <h3 className="vsp-step" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Link2 size={16} /> Mes liens trackés ({links.length}) · {usedThisMonth}/{MONTHLY_QUOTA} ce mois-ci</span>
          <button type="button" className="vsp-icon" aria-label="Actualiser" onClick={loadLinks}><RefreshCw size={16} /></button>
        </h3>
        {loadingLinks ? (
          <div className="vsp-empty"><Loader2 size={18} className="animate-spin" /></div>
        ) : links.length === 0 ? (
          <div className="vsp-empty">Aucun lien pour le moment. Créez-en un à l’étape 2.</div>
        ) : (
          <div className="vsp-links">
            {links.map((l) => (
              <div key={l.id} className={`vsp-link ${selectedId === l.id ? 'sel' : ''} ${l.active ? '' : 'off'}`}
                   role="button" tabIndex={0} onClick={() => setSelected(l.id)}
                   onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(l.id)}>
                <div className="vsp-link-top">
                  <span className="vsp-link-name">{l.name || l.code}</span>
                  <span className="vsp-badge"><MousePointerClick size={11} style={{ verticalAlign: '-1px' }} /> {l.clicks || 0}</span>
                </div>
                <div className="vsp-url">{stripScheme(shortUrlOf(l.code))}</div>
                <div className="vsp-dest">→ {l.destination_url}</div>
                <div className="vsp-dest">Dernier clic : {fmtDate(l.last_click_at)}{l.active ? '' : ' · désactivé'}</div>
                <div className="vsp-actions" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="vsp-icon" aria-label="Copier le lien" onClick={() => copy(shortUrlOf(l.code))}><Copy size={16} /></button>
                  <button type="button" className={`vsp-icon ${l.active ? 'on' : ''}`} aria-label={l.active ? 'Désactiver le lien' : 'Activer le lien'} onClick={() => toggleActive(l)}><Power size={16} /></button>
                  <button type="button" className="vsp-icon danger" aria-label="Supprimer le lien" onClick={() => removeLink(l)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Clics ── */}
      {activeLink && (
        <div className="vsp-card">
          <h3 className="vsp-step" style={{ justifyContent: 'space-between' }}>
            <span>Clics · {activeLink.name || activeLink.code}</span>
            <button type="button" className="vsp-icon" aria-label="Actualiser les clics" onClick={() => loadClicks(activeLink.id)}><RefreshCw size={16} /></button>
          </h3>

          <div className="vsp-stats">
            <div className="vsp-stat"><b>{stats.total}</b><span>Clics</span></div>
            <div className="vsp-stat"><b>{stats.ips}</b><span>IP uniques</span></div>
            <div className="vsp-stat"><b>{stats.countries}</b><span>Pays</span></div>
          </div>

          <div className="vsp-tools">
            <label className="vsp-check">
              <input type="checkbox" checked={hideBots} onChange={(e) => setHideBots(e.target.checked)} />
              Masquer les robots ({clicks.filter((c) => c.is_bot).length}) — aperçus de liens
            </label>
            <button type="button" className="vsp-btn" onClick={exportCsv}><FileDown size={16} /> Export CSV</button>
          </div>

          {loadingClicks ? (
            <div className="vsp-empty"><Loader2 size={18} className="animate-spin" /></div>
          ) : visibleClicks.length === 0 ? (
            <div className="vsp-empty">Aucun clic enregistré pour l’instant.</div>
          ) : (
            <div className="vsp-clicks">
              {visibleClicks.map((c) => (
                <div key={c.id} className={`vsp-click ${c.is_bot ? 'bot' : ''}`}>
                  <div className="vsp-ip">{c.ip || 'IP inconnue'}{c.is_bot && <span className="vsp-tag">robot</span>}</div>
                  <div className="vsp-meta">{flagEmoji(c.country)} {[c.city, c.region, c.country].filter(Boolean).join(', ') || 'Lieu inconnu'}</div>
                  <div className="vsp-meta">{[c.device, c.os, c.browser].filter(Boolean).join(' · ')}</div>
                  <div className="vsp-meta">{c.source ? `Via ${c.source} · ` : ''}{fmtDate(c.created_at)}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}