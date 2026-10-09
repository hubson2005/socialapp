import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Helmet } from 'react-helmet-async';
import logo from '../assets/Logo_SocialApp.png';
import eventMockup from '../assets/MODE_EVENEMENT.png';
import eventMockupWebp from '../assets/MODE_EVENEMENT.webp';
import marketplaceWoman from '../assets/marketplace-woman.png';
import tempsReelMockup from '../assets/TEMPS_REEL.png';
import tempsReelMockupWebp from '../assets/TEMPS_REEL.webp';
import leadsCrmMockup from '../assets/LEADS_CRM.png';
import leadsCrmMockupWebp from '../assets/LEADS_CRM.webp';
import profilMockup from '../assets/INTERFACE_SOCIALAPP.png';
import tabletWebp from '../assets/DASHBOARD_TABLETTE.webp';
import tabletPng from '../assets/DASHBOARD_TABLETTE.png';
import EventQuickCreateModal from '../components/EventQuickCreateModal';

/* ─────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────── */
// Activité des 7 derniers jours : [jour, vues, clics] (chaque série a sa propre échelle)
const DAYS = [['Sam', 64, 1], ['Dim', 4, 1], ['Lun', 61, 1], ['Mar', 123, 27], ['Mer', 52, 10], ['Jeu', 117, 17], ['Ven', 29, 32]];
const MAX_V = Math.max(...DAYS.map((d) => d[1]));
const MAX_C = Math.max(...DAYS.map((d) => d[2]));

const NAV_LINKS = [['#f', 'Fonctionnalités'], ['#crm', 'CRM'], ['#m', 'Boutique'], ['#t', 'Tarifs'], ['#q', 'FAQ']];

const PLANS = [
  {
    name: 'BASIC', price: '10 000', color: '#6d4fe0',
    subtitle: 'Particulier, Petit commerce, Étudiants, Freelances',
    bg: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.25)',
    btn: { background: 'rgba(99,102,241,.2)', color: '#3b2fb0' },
    features: [
      'Une carte de visite digitale', '09 liens sociaux', 'QR Code personnalisable',
      '02 imports autorisés (PDF, plaquette, brochure, etc.)', "Marketplace : ajout jusqu'à 07 articles",
      '05 formulaires personnalisés', 'Calendrier de réservation',
    ],
  },
  {
    name: 'PRO', price: '15 000', color: '#e0561f', popular: true,
    subtitle: 'Prestataires de services, Professions libérales, Créateurs de contenu, Automobile, Commerçants, Événementiel',
    bg: 'rgba(255,107,53,.1)', border: '2px solid rgba(255,107,53,.55)',
    features: [
      'Une carte de visite digitale', '12 liens sociaux', 'Carte NFC (logo + QR CODE)',
      'Analytics & statistiques détaillées', 'Stat temps réel — flux visiteurs live',
      'Calendrier de réservation (RDV en ligne)', 'Formulaires personnalisés illimités',
      "Marketplace : ajout jusqu'à 10 articles", '5 imports autorisés (flyers, plaquettes, brochures, etc.)',
      'QR Code personnalisable', 'Support standard',
    ],
  },
  {
    name: 'BUSINESS', price: '39 900', monthly: '3 990', offer: '2 mois offerts', color: '#a87800',
    subtitle: 'PME, Grandes entreprises, Agences de communication, Événementiel, institutions, banques et assurances',
    bg: 'rgba(247,201,72,.14)', border: '1px solid rgba(214,160,0,.4)',
    btn: { background: 'linear-gradient(135deg,#d98a0b,#f7c948)' },
    features: [
      'Une carte de visite digitale', 'Carte NFC (logo + QR CODE)', 'Analytics avancés complets',
      'CRM & Pipeline de leads', 'CRM WhatsApp complet', 'Campagnes WhatsApp IA (génération automatique)',
      'Calendrier de réservation illimité', 'Formulaires illimités', 'Automatisations',
      'Toutes les intégrations (HubSpot, Pipedrive, Google Analytics, Shopify, PostgreSQL, Salesforce, etc.)',
      "Marketplace : ajout d'articles illimité", '10 imports autorisés (flyers, plaquettes, brochures, etc.)',
      'QR Code personnalisable', 'Tracking IP', 'Support VIP prioritaire',
    ],
  },
  {
    name: 'ÉVÉNEMENT', price: '3 500', color: '#16a34a', isEvent: true,
    subtitle: 'Salons, mariages, soirées, lancements — une carte dédiée à votre événement, avec son propre lien',
    bg: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', btnClass: 'sa-gr',
    features: [
      'Page publique dédiée (lien propre /e/...)', 'Compte à rebours en direct', 'Galerie photos & vidéos',
      'QR code à télécharger', 'Formulaire de contact / RSVP', 'Analytics (vues, contacts, demandes)',
    ],
  },
];

const FAQS = [
  { q: "C'est quoi exactement SocialApp ?", a: "SocialApp est votre profil digital tout-en-un : un lien unique et un QR code qui regroupe tous vos réseaux sociaux, WhatsApp, votre boutique et vos événements. Un seul scan, vos clients trouvent tout." },
  { q: 'Combien ça coûte ?', a: "10 000 FCFA/an (BASIC), 15 000 FCFA/an (PRO). L'offre BUSINESS est à 3 990 FCFA/mois ou 39 900 FCFA/an (10 mois payés pour 12 : 2 mois offerts). Module Événement disponible à 3 500 FCFA, quel que soit votre plan. Paiement Mobile Money, Wave ou Orange Money — sans carte bancaire." },
  { q: "Qu'est-ce que le CRM ?", a: 'Le CRM intégré (offre BUSINESS) vous permet de capturer et gérer vos prospects. Tags intelligents (Prospect, Chaud, Client, Froid), notes, historique et export CSV. Transformez chaque visiteur en opportunité.' },
  { q: 'Je peux vendre mes produits ?', a: 'Oui ! La marketplace affiche vos produits avec photos, prix et description. 7 articles (BASIC), 10 (PRO), illimités (BUSINESS). Vos clients commandent via WhatsApp. Zéro commission.' },
  { q: 'Le QR code peut-il être modifié sans le réimprimer ?', a: 'Oui ! Modifiez vos liens, votre boutique ou votre WhatsApp à tout moment — votre QR code sur vos flyers et cartes reste valide à vie.' },
  { q: "C'est quoi le mode Événement ?", a: 'Une page publique dédiée à votre événement, avec son propre lien — compte à rebours en direct, galerie photos & vidéos, QR code téléchargeable, formulaire de contact ou RSVP. Disponible à 3 500 FCFA, quel que soit votre plan, via le bouton "Créez un évent".' },
  { q: 'Comment créer un événement rapidement ?', a: 'Cliquez sur "Créez un évent" en haut de la page, remplissez le petit formulaire (titre, date ou salon, lieu), puis activez votre carte. Le lien public et le QR code deviennent disponibles dès l\'activation.' },
  { q: 'Comment je reçois ma carte PVC ou NFC ?', a: 'Dès votre souscription PRO ou BUSINESS, notre équipe vous contacte sur WhatsApp pour personnaliser votre carte. Réception sous 7 jours.' },
  { q: 'Comment payer ?', a: 'Paiement via Mobile Money (Orange Money, Wave, MTN). Contactez-nous sur WhatsApp au +225 05 76 03 12 12. Aucune carte bancaire requise.' },
];

/* ─────────────────────────────────────────────
   BASCULE MENSUEL / ANNUEL
───────────────────────────────────────────── */
function BillingToggle({ value, onChange }) {
  const btn = (active) => ({
    padding: '9px 20px', borderRadius: '100px', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontWeight: 700, fontSize: '13px',
    color: active ? '#2a1305' : '#7b788a',
    background: active ? 'linear-gradient(135deg,#ff6b35,#f7c948)' : 'transparent',
  });
  return (
    <div style={{ display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '100px', background: '#fff', border: '1px solid rgba(29,26,43,.12)' }}>
      <button type="button" aria-pressed={value === 'monthly'} style={btn(value === 'monthly')} onClick={() => onChange('monthly')}>Mensuel</button>
      <button type="button" aria-pressed={value === 'annual'} style={btn(value === 'annual')} onClick={() => onChange('annual')}>
        Annuel <span style={{ fontSize: '11px', marginLeft: '4px' }}>2 mois offerts</span>
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CARTE D'OFFRE (page + modal)
───────────────────────────────────────────── */
function PlanCard({ p, billing, onChoose }) {
  const isMonthly = !!p.monthly && billing === 'monthly';
  return (
    <div className="sa-card sa-pn" style={{ background: p.bg, border: p.border, marginTop: p.popular ? '14px' : 0 }}>
      {p.popular && <div className="sa-pop sa-g">Plus populaire</div>}
      <h5 style={{ color: p.color }}>{p.name}</h5>
      <div className="sa-pr">{isMonthly ? p.monthly : p.price} <small>FCFA</small></div>
      <div className="sa-sb2">{p.isEvent ? 'par événement · Quel que soit votre plan' : (isMonthly ? '/ Paiement mensuel' : '/ Paiement annuel')}</div>
      {p.monthly && !isMonthly && (
        <div>
          <div style={{ fontSize: '11px', color: '#5d5a6e', marginBottom: '6px' }}>10 mois payés sur 12 · au lieu de <b>{p.monthly} F</b> × 12</div>
          <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: '#15803d', background: 'rgba(34,197,94,.14)', border: '1px solid rgba(34,197,94,.3)', borderRadius: '100px', padding: '3px 10px', marginBottom: '8px' }}>{p.offer}</span>
        </div>
      )}
      {p.monthly && isMonthly && (
        <div style={{ fontSize: '11px', color: '#5d5a6e', marginBottom: '8px' }}>Passez à l'annuel : <b style={{ color: '#15803d' }}>39 900 F</b> ({p.offer})</div>
      )}
      <div className="sa-sj">{p.subtitle}</div>
      <hr />
      {p.features.map((f) => <div className="sa-f" key={f}>{f}</div>)}
      <button type="button" className={'sa-btn ' + (p.btnClass || '')} style={p.btn} onClick={() => onChoose(p)}>
        {p.isEvent ? 'Créer mon événement →' : `Choisir ${p.name}${isMonthly ? ' (mensuel)' : ''} →`}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODAL DE SÉLECTION D'OFFRE
───────────────────────────────────────────── */
function PlanModal({ onClose, onSelect, billing, setBilling }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="sa-ov" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sa-md" role="dialog" aria-modal="true" aria-label="Choisissez votre offre">
        <button type="button" className="sa-mx" aria-label="Fermer" onClick={onClose}>×</button>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '8px' }}>Démarrez avec l'offre qui vous convient</h2>
          <p style={{ color: '#5d5a6e', fontSize: '14px', marginBottom: '18px' }}>Paiement Mobile Money · Wave · Orange Money · Sans carte bancaire</p>
          <BillingToggle value={billing} onChange={setBilling} />
          <div style={{ fontSize: '11px', color: '#7b788a', marginTop: '8px' }}>Le paiement mensuel est disponible pour l'offre BUSINESS</div>
        </div>
        <div className="sa-mg">
          {PLANS.filter((p) => !p.isEvent).map((p) => <PlanCard key={p.name} p={p} billing={billing} onChoose={(pl) => onSelect(pl.name.toLowerCase(), pl.monthly ? billing : 'annual')} />)}
        </div>
        <p style={{ textAlign: 'center', color: '#7b788a', fontSize: '12px', marginTop: '24px' }}>Besoin d'aide ? WhatsApp <b>+225 05 76 03 12 12</b></p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO : tablette (dashboard) puis téléphone (profil public), en boucle
───────────────────────────────────────────── */
function HeroDevices() {
  const rows = [
    { l: 'WhatsApp', c: '#25D366', i: 'chat' },
    { l: 'Instagram', c: '#E1306C', i: 'image' },
    { l: 'Boutique', c: '#ff6b35', i: 'bag' },
    { l: 'Facebook', c: '#1877F2', t: 'f' },
  ];
  const Ic = ({ n }) => <svg className="sa-i"><use href={'#i-' + n} /></svg>;
  return (
    <div className="sa-dvw" aria-label="Aperçu du tableau de bord et du profil public SocialApp">
      <div className="sa-dv">
        <div className="sa-dv-tab">
          <div className="sa-tstage">
            <picture>
              <source srcSet={tabletWebp} type="image/webp" />
              <img src={tabletPng} alt="Tablette affichant le tableau de bord Analytics" width="1976" height="1312" decoding="async" />
            </picture>
            <div className="sa-tchart" role="img" aria-label="Activité des 7 derniers jours : vues et clics par jour">
              <div className="sa-tt">Activité — 7 derniers jours</div>
              <div className="sa-tleg"><span><i className="sa-lv" />Vues</span><span><i className="sa-lc" />Clics</span></div>
              <div className="sa-tplot">
                {DAYS.map(([j, v, c], i) => (
                  <div className="sa-tday" key={j}>
                    <div className="sa-tbar sa-tv" style={{ '--h': (v / MAX_V * 100).toFixed(1) + 'px', '--i': i, '--k': 0 }} />
                    <div className="sa-tbar sa-tc" style={{ '--h': (c / MAX_C * 100).toFixed(1) + 'px', '--i': i, '--k': 1 }} />
                    <div className="sa-tlab">{j}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sa-dv-phone">
          <div className="sa-dv-pbez">
            <div className="sa-dv-notch" />
            <div className="sa-dv-pscr">
              <div className="sa-dv-cover" />
              <div className="sa-dv-av sa-g">D</div>
              <div className="sa-dv-pname">Dorine Fashion <span style={{ color: '#22c55e' }}><Ic n="badge" /></span></div>
              <div className="sa-dv-pbio">Mode &amp; accessoires · Abidjan</div>
              <div className="sa-dv-links">
                {rows.map((r, i) => (
                  <div className="sa-dv-link" key={r.l} style={{ animationDelay: i * 90 + 'ms' }}>
                    <span style={{ background: r.c }}>{r.i ? <Ic n={r.i} /> : r.t}</span>{r.l}<em>›</em>
                  </div>
                ))}
              </div>
              <div className="sa-dv-shop">
                <div style={{ animationDelay: '420ms' }}><i style={{ background: 'linear-gradient(135deg,#f6b58f,#e8845a)' }} /><b>14 000 F</b></div>
                <div style={{ animationDelay: '500ms' }}><i style={{ background: 'linear-gradient(135deg,#c9b8f5,#8f7be0)' }} /><b>10 000 F</b></div>
              </div>
            </div>
          </div>
        </div>

        <div className="sa-dv-fb sa-dv-b1"><b>Nouveau lead !</b><small>Kofi M. · via QR Code</small></div>
        <div className="sa-dv-fb sa-dv-b2"><small>Vues aujourd'hui</small><b style={{ fontSize: '22px', color: '#ff6b35' }}>+247</b><small style={{ color: '#16a34a' }}>↑ 34% vs hier</small></div>
        <div className="sa-dv-fb sa-dv-b3"><b>Commande WhatsApp</b><small>Robe Ankara · 8 500 FCFA</small></div>

        <div className="sa-dv-pills">
          <span className="sa-dv-p1"><Ic n="chart" /> Tableau de bord</span>
          <span className="sa-dv-p2"><Ic n="user" /> Profil public</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=Inter:wght@500;600;700&display=swap');
.sa-p{font-family:'Sora',system-ui,sans-serif;color:#1d1a2b;line-height:1.6;background-color:#f8f5ef;background-image:radial-gradient(900px 600px at 80% 0,rgba(255,107,53,.16),transparent 70%),radial-gradient(700px 600px at 0 22%,rgba(167,139,250,.16),transparent 70%),radial-gradient(800px 600px at 100% 45%,rgba(247,201,72,.2),transparent 70%),radial-gradient(800px 600px at 0 70%,rgba(236,72,153,.1),transparent 70%),radial-gradient(900px 600px at 70% 100%,rgba(255,107,53,.14),transparent 70%)}
.sa-p *{box-sizing:border-box}.sa-p a{color:inherit;text-decoration:none}
.sa-w{max-width:1280px;margin:0 auto;padding:0 40px}
.sa-g{background:linear-gradient(135deg,#ff6b35,#f7c948)}
.sa-gt{background:linear-gradient(135deg,#f0501a,#f2a900);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.sa-nav{position:sticky;top:0;z-index:5;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(248,245,239,.85);backdrop-filter:blur(20px);border-bottom:1px solid rgba(29,26,43,.08)}
.sa-brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px}
.sa-mk{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff}
.sa-lk{display:flex;gap:28px;font-size:13px;color:#5d5a6e}
.sa-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 24px;border:0;border-radius:100px;font:700 13px 'Sora',sans-serif;color:#2a1305;cursor:pointer;background:linear-gradient(135deg,#ff6b35,#f7c948)}
.sa-btn.sa-l{min-height:56px;padding:0 38px;font-size:16px;border-radius:14px;box-shadow:0 10px 28px rgba(255,107,53,.35)}
.sa-btn.sa-s{background:#fff;color:#1d1a2b;border:1px solid rgba(29,26,43,.15)}
.sa-btn.sa-gr{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}
.sa-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:100px;font-size:12px;font-weight:700;margin-bottom:18px}
.sa-dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.sa-ttl .sa-ln{display:block;overflow:hidden;padding-bottom:.14em;margin-bottom:-.14em}
.sa-ttl .sa-ln>span{display:block;transform:translateY(110%);opacity:0;animation:sa-up 1s cubic-bezier(.2,.8,.2,1) forwards,sa-flow 9s ease-in-out 1.4s infinite alternate;background-size:220% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.sa-ttl .sa-l1{background-image:linear-gradient(100deg,#f0501a 0%,#f2a900 45%,#f0501a 100%);animation-delay:.15s,1.4s}
.sa-ttl .sa-l2{background-image:linear-gradient(100deg,#7c5cf0 0%,#f0501a 45%,#f2a900 75%,#7c5cf0 100%);animation-delay:.45s,1.4s}
@keyframes sa-up{to{transform:none;opacity:1}}
@keyframes sa-flow{from{background-position:0 0}to{background-position:100% 0}}
@media(prefers-reduced-motion:reduce){.sa-ttl .sa-ln>span{animation:none;transform:none;opacity:1}}
.sa-i{width:1em;height:1em;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;vertical-align:-.12em}
.sa-ic{color:#2b2740}.sa-rw .sa-ic{color:#fff}.sa-rw .sa-ic svg{width:9px;height:9px}.sa-sb span{color:#4a4660}
.sa-hero{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center;padding:80px 0 90px}
.sa-p h1{margin:0;font-size:62px;line-height:1.02;letter-spacing:-3px;font-weight:900}
.sa-p h1 span{display:block}
.sa-p h1.sa-ttl .sa-l2 span{display:inline}
.sa-pitch{font-size:14px;color:#5d5a6e;line-height:1.8;margin:22px 0 14px;max-width:540px;padding:14px 18px;background:rgba(255,255,255,.7);border:1px solid rgba(29,26,43,.08);border-radius:14px}
.sa-tag{font-size:20px;font-weight:700;margin:12px 0 18px;line-height:1.3}
.sa-ck{display:flex;gap:10px;align-items:center;font-size:13px;color:#3d3a4f;margin-bottom:8px}
.sa-ck i{width:20px;height:20px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font:800 9px 'Sora';color:#fff;font-style:normal;background:linear-gradient(135deg,#ff6b35,#f7c948)}
.sa-cta{display:flex;gap:14px;flex-wrap:wrap;margin:26px 0}
.sa-av{display:flex;align-items:center;gap:14px;font-size:13px;color:#5d5a6e}
.sa-av div div{width:32px;height:32px;border-radius:50%;border:2px solid #f8f5ef;margin-left:-10px;color:#fff;font:800 12px 'Sora';display:flex;align-items:center;justify-content:center}
.sa-av div div:first-child{margin-left:0}
.sa-card{background:rgba(255,255,255,.82);border:1px solid rgba(29,26,43,.08);border-radius:24px;box-shadow:0 24px 60px -24px rgba(80,50,20,.25)}
.sa-st{position:relative}
.sa-fb{position:absolute;background:#fff;border:1px solid rgba(29,26,43,.1);border-radius:14px;padding:10px 14px;box-shadow:0 14px 34px rgba(60,40,20,.18);font-size:11px;z-index:2}
.sa-fb b{display:block;font-size:11px}.sa-fb span{color:#7b788a;font-size:10px}
.sa-top{height:44px;display:flex;align-items:center;gap:7px;padding:0 16px;border-bottom:1px solid rgba(29,26,43,.07)}
.sa-top i{width:10px;height:10px;border-radius:50%}
.sa-top em{flex:1;margin-left:10px;background:#f1ede4;border-radius:6px;padding:3px 10px;font:10px 'Sora';color:#7b788a;font-style:normal}
.sa-db{display:grid;grid-template-columns:52px 1fr;min-height:330px}
.sa-sb{border-right:1px solid rgba(29,26,43,.07);padding:10px 0;display:flex;flex-direction:column;gap:8px;align-items:center;font-size:14px}
.sa-sb span.sa-a{background:rgba(99,102,241,.15);border-radius:9px}
.sa-sb span{width:34px;height:34px;display:flex;align-items:center;justify-content:center}
.sa-dc{padding:14px;display:flex;flex-direction:column;gap:11px}
.sa-mc{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.sa-mc div{background:#f5f1e8;border-radius:12px;padding:10px;text-align:center;font-size:8px;color:#7b788a}
.sa-mc b{display:block;font-size:18px;font-weight:900;line-height:1}
.sa-bar{display:flex;align-items:center;gap:8px;font-size:9px;color:#7b788a;margin-top:5px}.sa-bar u{flex:1;height:5px;border-radius:3px;background:#e8e3d7;overflow:hidden;text-decoration:none}.sa-bar u i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#6366f1,#a78bfa)}
.sa-chip{padding:4px 8px;border-radius:7px;font-size:9px;font-weight:700}
.sa-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center;padding:48px 40px;border-top:1px solid rgba(29,26,43,.07);border-bottom:1px solid rgba(29,26,43,.07);background:rgba(255,255,255,.4)}
.sa-stats b{display:block;font-size:48px;font-weight:900;letter-spacing:-2px;line-height:1}.sa-stats span{font-size:13px;color:#7b788a}
.sa-sec{padding:100px 0}
.sa-hd{text-align:center;max-width:700px;margin:0 auto 60px}
.sa-p h2{margin:0 0 16px;font-size:42px;line-height:1.1;letter-spacing:-1.5px;font-weight:900}
.sa-sub{font-size:16px;color:#5d5a6e;line-height:1.75;margin:0}
.sa-two{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.sa-it{display:flex;gap:14px;margin:0 0 16px}.sa-it b{display:block;font-size:15px;margin-bottom:3px}.sa-it span{font-size:13px;color:#5d5a6e;line-height:1.6}
.sa-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex:none}
.sa-pl{display:inline-flex;margin-top:12px;padding:10px 16px;border-radius:12px;font-size:13px;font-weight:700}
.sa-fg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.sa-fc{padding:30px}.sa-fc .sa-ic{width:54px;height:54px;font-size:24px;border-radius:16px;margin-bottom:18px}.sa-fc h3{margin:0 0 10px;font-size:17px}.sa-fc p{margin:0;font-size:13px;color:#5d5a6e;line-height:1.75}
.sa-ft{display:inline-block;margin-top:14px;padding:4px 10px;border-radius:100px;font-size:10px;font-weight:700}
.sa-tint1{background:linear-gradient(135deg,rgba(236,72,153,.1),rgba(99,102,241,.07))}.sa-tint2{background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(14,165,233,.08))}.sa-tint3{background:linear-gradient(180deg,rgba(255,107,53,.1),transparent)}
.sa-mock{padding:26px;min-height:330px}
.sa-mock h4{margin:0 0 14px;font-size:14px}
.sa-phone{width:240px;margin:0 auto;background:#1a1218;border-radius:36px;padding:9px;box-shadow:0 0 0 5px #e9e2d3,0 30px 60px rgba(60,40,20,.3);color:#fff}
.sa-scr{background:#150d10;border-radius:28px;padding:22px 10px 12px}
.sa-pg{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
.sa-pg div{border-radius:11px;background:rgba(255,255,255,.06);overflow:hidden;font-size:9px;font-weight:800}
.sa-pg i{display:block;height:52px;font-style:normal;font-size:22px;text-align:center;line-height:52px}.sa-pg b{display:block;padding:5px 7px}
.sa-rw{display:flex;gap:8px;align-items:center;font-size:8px;font-weight:600;background:rgba(255,255,255,.05);border-radius:8px;padding:5px 8px;margin-top:5px}
.sa-pls{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;align-items:start;padding-top:16px}
.sa-pn{padding:30px;position:relative}
.sa-pn h5{margin:0 0 14px;font-size:11px;letter-spacing:2.5px;font-weight:700}
.sa-pr{font-size:38px;font-weight:900;letter-spacing:-1.5px}.sa-pr small{font-size:14px;font-weight:500;color:#7b788a;letter-spacing:0}
.sa-pn .sa-sb2{font-size:12px;color:#7b788a;margin:2px 0 8px}.sa-pn .sa-sj{font-size:12px;color:#5d5a6e;line-height:1.55;min-height:56px;margin-bottom:18px}
.sa-pn .sa-f{display:flex;gap:8px;font-size:12px;color:#3d3a4f;margin-bottom:9px}.sa-pn .sa-f::before{content:'✓';font-weight:700}
.sa-pn hr{border:0;border-top:1px solid rgba(29,26,43,.09);margin:0 0 16px}
.sa-pn .sa-btn{width:100%;border-radius:14px;margin-top:10px;min-height:48px}
.sa-pop{position:absolute;top:-15px;left:50%;transform:translateX(-50%);padding:6px 18px;border-radius:100px;font-size:11px;font-weight:700;color:#2a1305;white-space:nowrap}
.sa-stp{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.sa-stp .sa-card{padding:32px;text-align:center}.sa-stp h3{margin:0 0 10px;font-size:18px}.sa-stp p{margin:0;font-size:14px;color:#5d5a6e}
.sa-nm{width:40px;height:40px;border-radius:50%;margin:12px auto 16px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#2a1305}
.sa-tg{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.sa-tg .sa-card{padding:28px}.sa-tg p{margin:12px 0 18px;font-size:14px;line-height:1.8;font-style:italic;color:#3d3a4f}
.sa-fin{max-width:900px;margin:0 auto;border-radius:32px;padding:72px 56px;text-align:center;background:linear-gradient(135deg,rgba(255,107,53,.2),rgba(167,139,250,.18) 55%,rgba(247,201,72,.22));border:1px solid rgba(29,26,43,.08)}
.sa-fin h2{font-size:42px}
.sa-fq{max-width:740px;margin:0 auto}.sa-fq div{background:rgba(255,255,255,.75);border:1px solid rgba(29,26,43,.08);border-radius:16px;padding:18px 22px;margin-bottom:10px}.sa-fq b{display:flex;justify-content:space-between;font-size:14px}.sa-fq b::after{content:'+';color:#ff6b35;font-size:20px;line-height:1}.sa-fq span{display:block;margin-top:8px;font-size:13px;color:#5d5a6e;line-height:1.7}
.sa-foot{position:relative;border-top:1px solid rgba(29,26,43,.08);background:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,232,214,.55) 60%,rgba(233,228,250,.6));padding:64px 40px 28px}
.sa-fi{max-width:1280px;margin:0 auto}
.sa-fcta{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;padding:28px 32px;margin-bottom:48px;border-radius:20px;background:rgba(255,255,255,.75);border:1px solid rgba(29,26,43,.08)}
.sa-fcta b{display:block;font-size:20px;letter-spacing:-.5px}.sa-fcta span{font-size:13px;color:#5d5a6e}
.sa-fgd{display:grid;grid-template-columns:1.7fr 1fr 1fr 1fr 1.2fr;gap:40px;margin-bottom:40px;font-size:13px;color:#5d5a6e}
.sa-fgd h6{margin:0 0 18px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#1d1a2b;font-weight:700}
.sa-fgd a{display:block;margin-bottom:11px}.sa-fgd a:hover{color:#c2410c}
.sa-fgd p{margin:0 0 16px;line-height:1.8;max-width:330px}
.sa-pay{display:flex;gap:8px;flex-wrap:wrap}.sa-pay span{padding:5px 12px;border-radius:100px;font-size:11px;font-weight:600;background:#fff;border:1px solid rgba(29,26,43,.1);color:#3d3a4f}
.sa-cp{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid rgba(29,26,43,.1);padding-top:22px;font-size:12px;color:#7b788a}
.sa-cp div{display:flex;gap:22px;flex-wrap:wrap}
.sa-fg .sa-fc{position:relative;overflow:hidden;transition:translate .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s,border-color .4s,background .4s}
.sa-fg .sa-fc::before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,#ff6b35,#f7c948);transform:scaleX(0);transform-origin:left;transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.sa-fg .sa-fc .sa-ic{transition:translate .45s cubic-bezier(.2,.8,.2,1),rotate .45s cubic-bezier(.2,.8,.2,1),scale .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s}
.sa-fg .sa-fc .sa-ft{transition:translate .35s,box-shadow .35s}
@media(hover:hover){
.sa-fg .sa-fc:hover{translate:0 -8px;border-color:rgba(255,107,53,.35);background:#fff;box-shadow:0 30px 60px -24px rgba(120,60,20,.32)}
.sa-fg .sa-fc:hover::before{transform:scaleX(1)}
.sa-fg .sa-fc:hover .sa-ic{translate:0 -3px;rotate:-6deg;scale:1.08;box-shadow:0 10px 22px -8px rgba(60,40,20,.35)}
.sa-fg .sa-fc:hover .sa-ft{translate:4px 0}
}
.sa-fg .sa-fc:active{translate:0 -3px}
@keyframes sa-cardIn{from{opacity:0;transform:translateY(40px) scale(.96)}to{opacity:1;transform:none}}
@keyframes sa-icIn{from{transform:scale(.6) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}
@supports (animation-timeline:view()){
.sa-fg .sa-fc{animation:sa-cardIn linear both;animation-timeline:view();animation-range:entry 4% entry 46%}
.sa-fg .sa-fc:nth-child(3n+2){animation-range:entry 11% entry 53%}
.sa-fg .sa-fc:nth-child(3n){animation-range:entry 18% entry 60%}
.sa-fg .sa-fc .sa-ic{animation:sa-icIn linear both;animation-timeline:view();animation-range:entry 20% entry 60%}
}
@media(prefers-reduced-motion:reduce){.sa-fg .sa-fc,.sa-fg .sa-fc .sa-ic{animation:none!important;transition:none}}

.sa-pls .sa-pn{transform-origin:50% 100%;transition:translate .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s}
.sa-pls .sa-pn:nth-child(2)::after{content:'';position:absolute;inset:-2px;border-radius:inherit;pointer-events:none;animation:sa-halo 3.2s ease-in-out infinite}
.sa-pop{background-size:220% 100%;animation:sa-sheen 4s linear infinite}
.sa-pn .sa-btn{transition:filter .25s,box-shadow .25s}.sa-pn .sa-btn:hover{filter:brightness(1.06);box-shadow:0 10px 24px -8px rgba(255,107,53,.5)}
@media(hover:hover){.sa-pls .sa-pn:hover{translate:0 -10px;box-shadow:0 36px 70px -26px rgba(90,50,20,.4)}}
@keyframes sa-halo{0%,100%{box-shadow:0 0 0 0 rgba(255,107,53,.4)}60%{box-shadow:0 0 0 14px rgba(255,107,53,0)}}
@keyframes sa-sheen{from{background-position:0 0}to{background-position:-220% 0}}
@keyframes sa-planIn{from{opacity:0;transform:perspective(900px) rotateX(16deg) translateY(56px)}to{opacity:1;transform:none}}

.sa-stp .sa-card{position:relative;transition:translate .35s,box-shadow .35s}
@media(hover:hover){.sa-stp .sa-card:hover{translate:0 -6px}}
.sa-stp .sa-card:not(:last-child)::after{content:'';position:absolute;top:114px;right:-24px;width:24px;height:2px;background:linear-gradient(90deg,#ff6b35,#f7c948);transform-origin:left}
@keyframes sa-fromL{from{opacity:0;transform:translateX(-70px)}to{opacity:1;transform:none}}
@keyframes sa-fromB{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:none}}
@keyframes sa-fromR{from{opacity:0;transform:translateX(70px)}to{opacity:1;transform:none}}
@keyframes sa-pop{0%{transform:scale(0)}70%{transform:scale(1.22)}100%{transform:scale(1)}}
@keyframes sa-draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}

.sa-tg .sa-card{transition:translate .35s,box-shadow .35s}
@media(hover:hover){.sa-tg .sa-card:hover{translate:0 -4px;box-shadow:0 28px 56px -26px rgba(240,160,0,.45)}}
@keyframes sa-focusIn{from{opacity:0;filter:blur(12px);transform:scale(1.06)}to{opacity:1;filter:blur(0);transform:none}}
@keyframes sa-stars{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@supports (animation-timeline:view()){
.sa-pls .sa-pn{animation:sa-planIn linear both;animation-timeline:view();animation-range:entry 0% entry 48%}
.sa-pls .sa-pn:nth-child(2){animation-range:entry 8% entry 56%}
.sa-pls .sa-pn:nth-child(3){animation-range:entry 16% entry 64%}
.sa-pls .sa-pn:nth-child(4){animation-range:entry 24% entry 72%}
.sa-stp .sa-card:nth-child(1){animation:sa-fromL linear both;animation-timeline:view();animation-range:entry 0% entry 50%}
.sa-stp .sa-card:nth-child(2){animation:sa-fromB linear both;animation-timeline:view();animation-range:entry 8% entry 58%}
.sa-stp .sa-card:nth-child(3){animation:sa-fromR linear both;animation-timeline:view();animation-range:entry 16% entry 66%}
.sa-stp .sa-nm{animation:sa-pop linear both;animation-timeline:view();animation-range:entry 30% entry 75%}
.sa-stp .sa-card:not(:last-child)::after{animation:sa-draw linear both;animation-timeline:view();animation-range:entry 45% entry 85%}
.sa-tg .sa-card{animation:sa-focusIn linear both;animation-timeline:view();animation-range:entry 0% entry 55%}
.sa-tg .sa-card:nth-child(2){animation-range:entry 10% entry 65%}
.sa-tg .sa-card:nth-child(3){animation-range:entry 20% entry 75%}
.sa-tg .sa-card>div:first-child{animation:sa-stars linear both;animation-timeline:view();animation-range:entry 35% entry 80%}
}
@media(max-width:960px){.sa-stp .sa-card::after{display:none}}
@media(prefers-reduced-motion:reduce){.sa-pls .sa-pn,.sa-stp .sa-card,.sa-stp .sa-nm,.sa-stp .sa-card::after,.sa-tg .sa-card,.sa-tg .sa-card>div:first-child,.sa-pop,.sa-pls .sa-pn::after{animation:none!important;transition:none}}

.sa-stats>div{position:relative}
.sa-stats>div:not(:last-child)::after{content:'';position:absolute;right:-16px;top:12%;height:76%;width:1px;background:linear-gradient(180deg,transparent,rgba(29,26,43,.22),transparent);transform-origin:top}
.sa-stats b{display:block}
@keyframes sa-statIn{from{opacity:0;transform:translateY(46%);letter-spacing:.14em;filter:blur(6px)}to{opacity:1;transform:none;letter-spacing:-2px;filter:none}}
@keyframes sa-lblIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes sa-lineDown{from{transform:scaleY(0)}to{transform:scaleY(1)}}

.sa-fq div{position:relative;overflow:hidden;transition:background .3s,border-color .3s}
.sa-fq div::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#ff6b35,#f7c948);transform:scaleY(0);transform-origin:top;transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.sa-fq b::after{transition:transform .35s cubic-bezier(.2,.8,.2,1)}
@media(hover:hover){.sa-fq div:hover{background:#fff;border-color:rgba(255,107,53,.3)}.sa-fq div:hover::before{transform:scaleY(1)}.sa-fq div:hover b::after{transform:rotate(90deg)}}
@keyframes sa-unroll{from{clip-path:inset(0 0 100% 0);opacity:0}to{clip-path:inset(0 0 0 0);opacity:1}}

.sa-fin{background-size:200% 200%;animation:sa-drift 14s ease-in-out infinite alternate}
.sa-fin .sa-btn.sa-l:not(.sa-s){animation:sa-ring 2.8s ease-out infinite}
@keyframes sa-drift{from{background-position:0 0}to{background-position:100% 100%}}
@keyframes sa-ring{0%,100%{box-shadow:0 10px 28px rgba(255,107,53,.35),0 0 0 0 rgba(255,107,53,.45)}70%{box-shadow:0 10px 28px rgba(255,107,53,.35),0 0 0 18px rgba(255,107,53,0)}}
@keyframes sa-expand{from{opacity:0;transform:scale(.9);border-radius:90px}to{opacity:1;transform:none;border-radius:32px}}
@keyframes sa-rise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
@supports (animation-timeline:view()){
.sa-stats>div b{animation:sa-statIn linear both;animation-timeline:view();animation-range:entry 0% entry 70%}
.sa-stats>div span{animation:sa-lblIn linear both;animation-timeline:view();animation-range:entry 40% entry 90%}
.sa-stats>div:nth-child(2) b{animation-range:entry 6% entry 76%}
.sa-stats>div:nth-child(3) b{animation-range:entry 12% entry 82%}
.sa-stats>div:nth-child(4) b{animation-range:entry 18% entry 88%}
.sa-stats>div:not(:last-child)::after{animation:sa-lineDown linear both;animation-timeline:view();animation-range:entry 30% entry 100%}
.sa-fq div{animation:sa-unroll linear both;animation-timeline:view();animation-range:entry 0% entry 55%}
.sa-fin{animation:sa-expand linear both,sa-drift 14s ease-in-out infinite alternate;animation-timeline:view(),auto;animation-range:entry 0% entry 60%,normal}
.sa-fin>*{animation:sa-rise linear both;animation-timeline:view();animation-range:entry 25% entry 65%}
.sa-fin>:nth-child(2){animation-range:entry 32% entry 72%}
.sa-fin>:nth-child(3){animation-range:entry 39% entry 79%}
.sa-fin>:nth-child(4){animation-range:entry 46% entry 86%}
.sa-fin>div .sa-btn.sa-l:not(.sa-s){animation:sa-ring 2.8s ease-out infinite;animation-timeline:auto;animation-range:normal}
}
@media(max-width:960px){.sa-stats>div::after{display:none}.sa-stats b{letter-spacing:-1px}}
@media(prefers-reduced-motion:reduce){.sa-stats>div b,.sa-stats>div span,.sa-stats>div::after,.sa-fq div,.sa-fin,.sa-fin>*,.sa-fin .sa-btn{animation:none!important;transition:none}}
@media(max-width:960px){.sa-w{padding:0 20px}.sa-nav{padding:0 20px}.sa-lk{display:none}.sa-hero,.sa-two,.sa-fg,.sa-pls,.sa-stp,.sa-tg,.sa-fgd{grid-template-columns:1fr}.sa-hero{gap:48px;padding:48px 0}.sa-p h1{font-size:40px;letter-spacing:-2px}.sa-p h2,.sa-fin h2{font-size:30px}.sa-sec{padding:64px 0}.sa-stats{grid-template-columns:repeat(2,1fr);padding:36px 20px}.sa-fb{display:none}.sa-fin{padding:48px 24px}.sa-cp,.sa-cp div{flex-direction:column;align-items:flex-start;gap:8px}.sa-foot{padding:48px 20px 24px}.sa-fcta{padding:24px}}


.sa-p{overflow-x:clip;-webkit-text-size-adjust:100%;text-size-adjust:100%;-webkit-tap-highlight-color:transparent}
.sa-nav{-webkit-backdrop-filter:blur(20px);padding-left:max(40px,env(safe-area-inset-left));padding-right:max(40px,env(safe-area-inset-right))}
.sa-foot{padding-bottom:max(28px,env(safe-area-inset-bottom))}

.sa-burger{display:none;width:44px;height:44px;border-radius:12px;border:1px solid rgba(29,26,43,.15);background:#fff;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;flex:none}
.sa-burger span{display:block;width:18px;height:2px;border-radius:2px;background:#1d1a2b;transition:transform .25s,opacity .25s}
.sa-burger.sa-on span:nth-child(1){transform:translateY(6px) rotate(45deg)}
.sa-burger.sa-on span:nth-child(2){opacity:0}
.sa-burger.sa-on span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
.sa-mmenu{display:none;position:absolute;top:100%;left:0;right:0;background:#fbf9f4;border-bottom:1px solid rgba(29,26,43,.1);box-shadow:0 24px 40px -20px rgba(60,40,20,.3);padding:8px 20px 20px}
.sa-mmenu a{display:block;padding:15px 4px;font-size:15px;font-weight:600;color:#2b2740;border-bottom:1px solid rgba(29,26,43,.08)}
.sa-p h1{font-size:clamp(34px,5.4vw,62px)}
.sa-p h2,.sa-fin h2{font-size:clamp(26px,3.6vw,42px)}
.sa-p img,.sa-p svg{max-width:100%}
@media(max-width:1100px){
.sa-pls{grid-template-columns:1fr 1fr}
.sa-fgd{grid-template-columns:repeat(3,1fr)}.sa-fgd>div:first-child{grid-column:1/-1}
.sa-w{padding:0 32px}
}
@media(max-width:960px){
.sa-nav{padding-left:max(20px,env(safe-area-inset-left));padding-right:max(20px,env(safe-area-inset-right))}
.sa-burger{display:flex}.sa-mmenu.sa-open{display:block}
.sa-fg{grid-template-columns:1fr 1fr}
.sa-tg{grid-template-columns:1fr 1fr}.sa-tg .sa-card:last-child{grid-column:1/-1}
.sa-stp{grid-template-columns:repeat(3,1fr);gap:16px}.sa-stp .sa-card{padding:24px 16px}.sa-stp h3{font-size:16px}
.sa-fgd{grid-template-columns:1fr 1fr;gap:32px}.sa-fgd>div:last-child{grid-column:1/-1}
.sa-stage{max-width:620px;margin:0 auto;width:100%;padding-left:0}
.sa-two>.sa-phone,.sa-hero .sa-st{margin-left:auto;margin-right:auto}
.sa-hero{padding-top:36px}
}
@media(max-width:640px){
.sa-w{padding:0 18px}
.sa-fg,.sa-pls,.sa-tg,.sa-stp{grid-template-columns:1fr}
.sa-tg .sa-card:last-child{grid-column:auto}
.sa-fgd{grid-template-columns:1fr 1fr}
.sa-btn.sa-l{width:100%;padding:0 20px;min-height:54px;font-size:15px;white-space:normal;text-align:center}
.sa-cta{flex-direction:column;gap:12px}.sa-cta .sa-btn{width:100%}
.sa-nav .sa-btn.sa-s,.sa-nav .sa-btn.sa-gr,.sa-nav .sa-btn{min-height:40px;padding:0 14px;font-size:12px}
.sa-nb{gap:8px!important}
.sa-mc{grid-template-columns:repeat(2,1fr)}
.sa-db{grid-template-columns:44px 1fr}
.sa-proof,.sa-av{flex-wrap:wrap}
.sa-hd{margin-bottom:40px}.sa-sec{padding:56px 0}
.sa-fcta{flex-direction:column;align-items:flex-start}.sa-fcta .sa-btn{width:100%}.sa-fcta>div{width:100%}
.sa-fq div{padding:16px 18px}
.sa-pn{padding:26px 22px}
.sa-stats b{font-size:36px}
}
@media(max-width:430px){.sa-bt{display:none}.sa-stats{gap:24px 12px}.sa-stats b{font-size:32px}.sa-p h1{font-size:34px;letter-spacing:-1.5px}.sa-fgd{grid-template-columns:1fr}.sa-phone{width:220px}}
@media(max-width:340px){.sa-nav .sa-btn.sa-gr{display:none}}
@media(hover:none){.sa-fg .sa-fc:active,.sa-pls .sa-pn:active,.sa-stp .sa-card:active,.sa-tg .sa-card:active{translate:0 -2px}}
@media(min-width:1600px){.sa-w,.sa-fi,.sa-fgd,.sa-cp{max-width:1400px}}
.sa-mmenu .sa-mcta{display:flex;margin-top:18px;min-height:50px;padding:0 24px;border:0;font-size:15px;color:#2a1305}
@media(max-width:960px){.sa-nc{display:none!important}}

.sa-p [id]{scroll-margin-top:72px}
.sa-nav{padding-top:env(safe-area-inset-top);height:calc(64px + env(safe-area-inset-top))}
:where(.sa-p button){font-family:inherit}
:where(.sa-p *){margin:0;padding:0}
.sa-fqb{all:unset;display:block;width:100%;cursor:pointer;box-sizing:border-box}
.sa-fqb:focus-visible b{outline:2px solid #ff6b35;outline-offset:4px;border-radius:6px}
.sa-fq .sa-fqi.open b::after{transform:rotate(45deg)!important}
.sa-lnk{background:none;border:0;padding:0;margin:0 0 11px;font:inherit;color:inherit;cursor:pointer;text-align:left;display:block}
.sa-lnk:hover{color:#c2410c}
.sa-btn:focus-visible,.sa-burger:focus-visible{outline:2px solid #1d1a2b;outline-offset:3px}
.sa-float{animation:sa-mkfloat 5s ease-in-out infinite}
@keyframes sa-mkfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.sa-mpwrap{display:flex;align-items:center;justify-content:center}
.sa-mpwoman{height:400px;margin-right:-46px;position:relative;z-index:1;filter:drop-shadow(0 20px 34px rgba(0,0,0,.3))}
.sa-mpwrap .sa-phone{position:relative;z-index:2;margin:0;flex:none}
.sa-ov{position:fixed;inset:0;z-index:9999;background:rgba(29,26,43,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px}
.sa-md{position:relative;width:100%;max-width:1040px;max-height:92vh;overflow-y:auto;border-radius:28px;padding:40px 32px;background-color:#f8f5ef;background-image:radial-gradient(600px 400px at 90% 0,rgba(255,107,53,.16),transparent 70%),radial-gradient(600px 400px at 0 100%,rgba(167,139,250,.16),transparent 70%);border:1px solid rgba(29,26,43,.1);box-shadow:0 40px 120px rgba(29,26,43,.4)}
.sa-mx{position:absolute;top:16px;right:16px;width:40px;height:40px;border-radius:50%;border:1px solid rgba(29,26,43,.15);background:#fff;font-size:22px;line-height:1;cursor:pointer;color:#1d1a2b}
.sa-mg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:start;padding-top:16px}
@media(max-width:900px){.sa-mg{grid-template-columns:1fr}.sa-md{padding:56px 18px 24px}}
@media(max-width:640px){.sa-mpwoman{height:250px;margin-right:-26px}.sa-mpwrap .sa-phone{width:190px}}
@media(prefers-reduced-motion:reduce){.sa-float{animation:none}}
.sa-dvw{--k:1;width:calc(560px*var(--k));height:calc(486px*var(--k));margin:0 auto;position:relative}
.sa-dv{position:absolute;left:0;top:0;width:560px;height:486px;transform:scale(var(--k));transform-origin:0 0}
.sa-dv::before{content:'';position:absolute;left:50%;top:44%;width:440px;height:440px;margin:-220px 0 0 -220px;border-radius:50%;background:radial-gradient(circle,rgba(255,107,53,.22),transparent 70%);filter:blur(40px)}
.sa-dv-tab,.sa-dv-phone{position:absolute;opacity:0;will-change:transform,opacity}
.sa-dv-tab{left:20px;top:56px;width:520px;height:352px;animation:sa-dvTab 14s ease-in-out infinite}
.sa-dv-phone{left:164px;top:6px;width:232px;height:468px;animation:sa-dvPhone 14s ease-in-out infinite}
.sa-dv-bez{height:100%;padding:12px;border-radius:30px;background:#1c1a24;box-shadow:0 40px 80px -30px rgba(60,30,10,.55),inset 0 0 0 2px #36333f}
.sa-dv-scr{height:100%;display:grid;grid-template-columns:44px 1fr;background:#fff;border-radius:19px;overflow:hidden}
.sa-dv-side{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 0;background:#fbf9f4;border-right:1px solid #eee9de}
.sa-dv-side span{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#6b6874}
.sa-dv-side span.a{background:rgba(99,102,241,.14);color:#4f46e5}
.sa-dv-main{display:flex;flex-direction:column;gap:9px;padding:12px 14px;min-width:0;color:#1d1a2b}
.sa-dv-h{display:flex;justify-content:space-between;align-items:center}
.sa-dv-h b{display:block;font-size:13px}.sa-dv-h small{font-size:9px;color:#7b788a}
.sa-dv-live{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:100px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);font-size:9px;font-weight:700;color:#16a34a}
.sa-dv-live i{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:sa-dvBlink 1.6s infinite}
.sa-dv-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.sa-dv-kpi div{background:#f5f1e8;border-radius:11px;padding:8px;text-align:center}
.sa-dv-kpi b{display:block;font-size:19px;font-weight:900;line-height:1.1}.sa-dv-kpi small{font-size:8px;color:#7b788a}
.sa-dv-two{display:grid;grid-template-columns:1.3fr 1fr;gap:8px;flex:1;min-height:0}
.sa-dv-box{background:#f5f1e8;border-radius:11px;padding:9px;display:flex;flex-direction:column;gap:6px;min-height:0}
.sa-dv-box>small{font-size:9px;font-weight:700;color:#5d5a6e}
.sa-dv-bars{flex:1;display:flex;align-items:flex-end;gap:6px}
.sa-dv-bars i{flex:1;border-radius:4px 4px 0 0;background:#e3d6bf;transform-origin:bottom;animation:sa-dvBar 14s ease-out infinite}
.sa-dv-bars i:last-child{background:#1d1a2b}
.sa-dv-ctry{display:flex;align-items:center;gap:6px}.sa-dv-ctry em{font-style:normal;font-size:9px;color:#7b788a;width:16px}
.sa-dv-ctry u{flex:1;height:5px;border-radius:3px;background:#e3dccb;overflow:hidden}.sa-dv-ctry u i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#6366f1,#a78bfa)}
.sa-dv-chips{display:flex;gap:5px}.sa-dv-chips span{padding:4px 8px;border-radius:7px;font-size:9px;font-weight:700}
.sa-dv-pbez{position:relative;height:100%;padding:9px;border-radius:38px;background:#1c1a24;box-shadow:0 40px 80px -30px rgba(60,30,10,.6),inset 0 0 0 2px #36333f}
.sa-dv-notch{position:absolute;top:15px;left:50%;width:62px;height:16px;margin-left:-31px;border-radius:10px;background:#1c1a24;z-index:2}
.sa-dv-pscr{position:relative;height:100%;border-radius:30px;overflow:hidden;background:#fbf9f4;padding:0 14px;color:#1d1a2b}
.sa-dv-cover{position:absolute;left:0;right:0;top:0;height:92px;background:linear-gradient(135deg,#ffd9c2,#f7c948 60%,#e9e1fb)}
.sa-dv-av{position:relative;width:54px;height:54px;margin:62px auto 0;border-radius:16px;border:3px solid #fbf9f4;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#2a1305}
.sa-dv-pname{text-align:center;margin-top:8px;font-size:13px;font-weight:800}
.sa-dv-pname .sa-i{width:13px;height:13px;vertical-align:-2px}
.sa-dv-pbio{text-align:center;font-size:9px;color:#7b788a;margin:2px 0 12px}
.sa-dv-links{display:flex;flex-direction:column;gap:7px}
.sa-dv-link{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:#fff;border:1px solid #eee9de;font-size:11px;font-weight:700;box-shadow:0 4px 10px -6px rgba(60,40,20,.25);opacity:0;animation:sa-dvRow 14s ease-out infinite}
.sa-dv-link span{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800}
.sa-dv-link span .sa-i{width:13px;height:13px}.sa-dv-link em{margin-left:auto;font-style:normal;color:#b7b2a6;font-size:14px}
.sa-dv-shop{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.sa-dv-shop div{border-radius:12px;background:#fff;border:1px solid #eee9de;overflow:hidden;opacity:0;animation:sa-dvRow 14s ease-out infinite}
.sa-dv-shop i{display:block;height:52px}.sa-dv-shop b{display:block;padding:5px 8px;font-size:10px}
.sa-dv-fb{position:absolute;z-index:3;padding:10px 14px;border-radius:14px;background:#fff;border:1px solid rgba(29,26,43,.1);box-shadow:0 16px 36px rgba(60,40,20,.2);opacity:0}
.sa-dv-fb b{display:block;font-size:11px}.sa-dv-fb small{display:block;font-size:10px;color:#7b788a}
.sa-dv-b1{left:372px;top:34px;animation:sa-dvB1 14s ease-in-out infinite}
.sa-dv-b2{left:454px;top:236px;text-align:center;animation:sa-dvB1 14s ease-in-out infinite .15s}
.sa-dv-b3{left:12px;top:372px;animation:sa-dvB3 14s ease-in-out infinite}
.sa-dv-pills{position:absolute;left:0;right:0;top:442px;display:flex;justify-content:center;gap:10px}
.sa-dv-pills span{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:100px;font-size:12px;font-weight:700;border:1px solid rgba(29,26,43,.12)}
.sa-dv-p1{animation:sa-dvP1 14s steps(1,end) infinite}.sa-dv-p2{animation:sa-dvP2 14s steps(1,end) infinite}
@keyframes sa-dvTab{0%{opacity:0;transform:translateX(70px) scale(.94)}7%,43%{opacity:1;transform:none}50%,100%{opacity:0;transform:translateX(-70px) scale(.94)}}
@keyframes sa-dvPhone{0%,50%{opacity:0;transform:translateX(70px) scale(.94)}57%,93%{opacity:1;transform:none}100%{opacity:0;transform:translateX(-70px) scale(.94)}}
@keyframes sa-dvBar{0%,6%{transform:scaleY(0)}18%,100%{transform:scaleY(1)}}
@keyframes sa-dvRow{0%,56%{opacity:0;transform:translateY(10px)}63%,93%{opacity:1;transform:none}100%{opacity:0}}
@keyframes sa-dvB1{0%,12%{opacity:0;transform:translateY(12px) scale(.95)}18%,42%{opacity:1;transform:none}48%,100%{opacity:0;transform:translateY(-6px)}}
@keyframes sa-dvB3{0%,62%{opacity:0;transform:translateY(12px) scale(.95)}68%,92%{opacity:1;transform:none}98%,100%{opacity:0}}
@keyframes sa-dvBlink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes sa-dvP1{0%{background:#1d1a2b;color:#fff;border-color:#1d1a2b}50%{background:rgba(255,255,255,.75);color:#5d5a6e;border-color:rgba(29,26,43,.12)}}
@keyframes sa-dvP2{0%{background:rgba(255,255,255,.75);color:#5d5a6e;border-color:rgba(29,26,43,.12)}50%{background:#1d1a2b;color:#fff;border-color:#1d1a2b}}
.sa-dvw:hover .sa-dv *,.sa-dvw:hover .sa-dv{animation-play-state:paused}
@media(max-width:1100px){.sa-dvw{--k:.86}}
@media(max-width:960px){.sa-dvw{--k:1}}
@media(max-width:640px){.sa-dvw{--k:.64}}
@media(max-width:430px){.sa-dvw{--k:.54}}
@media(prefers-reduced-motion:reduce){.sa-dv-tab{opacity:1;animation:none}.sa-dv-phone,.sa-dv-fb,.sa-dv-pills{display:none}.sa-dv-bars i{animation:none}}

.sa-dv-tab{left:10px;top:60px;width:540px;height:359px}
.sa-tstage{position:absolute;left:0;top:0;width:1976px;height:1312px;transform:scale(.27328);transform-origin:0 0;filter:drop-shadow(0 110px 110px rgba(60,30,10,.3))}
.sa-tstage picture{display:block}
.sa-tstage img{position:absolute;left:0;top:0;width:1976px;height:1312px;max-width:none;display:block}
.sa-tchart{position:absolute;left:0;top:0;width:1850px;height:215px;transform-origin:0 0;transform:matrix3d(1.012488429,0.1702374219,0,0.0001253177483,0.2278952721,0.9780024482,0,-6.036104797e-05,0,0,1,0,232.6,377.6,0,1);background:#fefefe;border-radius:18px;box-shadow:0 0 0 1px #fefefe;font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif}
.sa-tt{position:absolute;left:21px;top:20px;font-size:21px;font-weight:700;color:#0f172a;letter-spacing:-.01em;line-height:28px;white-space:nowrap}
.sa-tleg{position:absolute;right:16px;top:22px;display:flex;gap:22px;font-size:14px;font-weight:500;color:#0f172a;line-height:22px}
.sa-tleg i{display:inline-block;width:14px;height:14px;border-radius:3px;margin-right:8px;vertical-align:-2px}
.sa-lv{background:#fe6b19}.sa-lc{background:#17b154}
.sa-tplot{position:absolute;left:14px;right:16px;top:72px;height:100px;display:flex;align-items:flex-end}
.sa-tday{flex:1;min-width:0;display:flex;align-items:flex-end;justify-content:center;gap:4px;height:100%;position:relative}
.sa-tbar{width:124px;height:var(--h);min-height:3px;border-radius:7px;animation:sa-rise 14s cubic-bezier(.22,1,.36,1) infinite both;animation-delay:calc(var(--i)*110ms + var(--k)*60ms)}
.sa-tv{background:#fe6b19}.sa-tc{background:#17b154}
.sa-tlab{position:absolute;left:0;right:0;top:108px;text-align:center;font-size:15px;font-weight:500;color:#475569}
@keyframes sa-rise{0%,7%{height:0}18%{height:var(--h)}44%{height:var(--h)}50%,100%{height:0}}
@media(prefers-reduced-motion:reduce){.sa-tbar{animation:none}}

`;

/* ─────────────────────────────────────────────
   PAGE D'ACCUEIL
───────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [billing, setBilling] = useState('annual'); // 'annual' | 'monthly'

  const handleCTA = () => { if (user) { navigate('/dashboard'); } else { setShowPlanModal(true); } };
  const openEvent = () => setShowEventModal(true);
  const handlePlanSelect = (planSlug, billingCycle = 'annual') => {
    setShowPlanModal(false);
    const extra = billingCycle === 'monthly' ? '&billing=monthly' : '';
    navigate(`/login?plan=${encodeURIComponent(planSlug)}${extra}`);
  };
  const choosePlan = (p) => (p.isEvent ? openEvent() : handlePlanSelect(p.name.toLowerCase(), p.monthly ? billing : 'annual'));
  const goTop = () => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // referme le menu mobile si l'écran s'élargit
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 960) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // fond clair le temps que la page d'accueil est affichée (évite le flash sombre / le rebond iOS)
  useEffect(() => {
    const b = document.body, h = document.documentElement;
    const pb = b.style.background, ph = h.style.background;
    b.style.background = '#f8f5ef'; h.style.background = '#f8f5ef';
    return () => { b.style.background = pb; h.style.background = ph; };
  }, []);

  return (
    <>
      <Helmet>
        <title>SocialApp - Votre profil digital et CRM tout-en-un | Côte d'Ivoire</title>
        <meta name="description" content="SocialApp est une plateforme SaaS ivoirienne de profil digital intelligent. CRM, QR Code, Marketplace, Analytics temps réel. Pour professionnels, commerçants et créateurs. Dès 10 000 FCFA/an." />
        <meta name="keywords" content="profil digital Côte d'Ivoire, QR code business Abidjan, lien en bio, carte digitale, CRM leads, marketplace Côte d'Ivoire, CRM WhatsApp, analytics profil, événement, SocialApp, page de liens Afrique, carte NFC" />
        <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
        <link rel="canonical" href="https://www.socialapp.work/" />
        <meta name="theme-color" content="#f8f5ef" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.socialapp.work/" />
        <meta property="og:title" content="SocialApp - Profil Digital & CRM tout-en-un | Côte d'Ivoire" />
        <meta property="og:description" content="Plateforme SaaS ivoirienne : profil digital, CRM prospects, QR Code, marketplace et analytics. Tout depuis un seul tableau de bord." />
        <meta property="og:image" content="https://www.socialapp.work/og-preview.jpg" />
        <meta property="og:locale" content="fr_CI" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SocialApp - Profil Digital & CRM | Côte d'Ivoire" />
        <meta name="twitter:description" content="Créez votre profil digital, gérez vos prospects CRM et boostez vos ventes. Dès 10 000 FCFA." />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'SocialApp',
          url: 'https://www.socialapp.work', applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web', inLanguage: 'fr',
          description: 'Plateforme SaaS de profil digital tout-en-un avec QR code, CRM, marketplace et analytics pour entrepreneurs ivoiriens.',
          areaServed: { '@type': 'Country', name: "Côte d'Ivoire" },
          offers: [
            { '@type': 'Offer', name: 'BASIC', price: '10000', priceCurrency: 'XOF' },
            { '@type': 'Offer', name: 'PRO', price: '15000', priceCurrency: 'XOF' },
            { '@type': 'Offer', name: 'BUSINESS (annuel)', price: '39900', priceCurrency: 'XOF' },
            { '@type': 'Offer', name: 'BUSINESS (mensuel)', price: '3990', priceCurrency: 'XOF' },
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: "Combien coûte SocialApp en Côte d'Ivoire ?", acceptedAnswer: { '@type': 'Answer', text: 'Les offres commencent à 10 000 FCFA/an (BASIC), 15 000 FCFA/an (PRO) et BUSINESS à 3 990 FCFA/mois ou 39 900 FCFA/an (2 mois offerts). Paiement Mobile Money.' } },
            { '@type': 'Question', name: 'Puis-je vendre mes produits sur SocialApp ?', acceptedAnswer: { '@type': 'Answer', text: 'Oui, marketplace intégrée avec 0% de commission. 7 articles (BASIC), 10 (PRO), illimités (BUSINESS).' } },
            { '@type': 'Question', name: "C'est quoi le CRM SocialApp ?", acceptedAnswer: { '@type': 'Answer', text: "Gestion de leads avec tags, notes, pipeline et export CSV. Disponible avec l'offre BUSINESS." } },
          ],
        })}</script>
      </Helmet>

      <style>{CSS}</style>

      {showPlanModal && <PlanModal onClose={() => setShowPlanModal(false)} onSelect={handlePlanSelect} billing={billing} setBilling={setBilling} />}
      {showEventModal && <EventQuickCreateModal onClose={() => setShowEventModal(false)} />}

      <div className="sa-p">
<svg width="0" height="0" style={{position:"absolute"}} aria-hidden="true">
<defs>
<symbol id="i-link" viewBox="0 0 24 24">
<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5">
</path>
</symbol>
<symbol id="i-chart" viewBox="0 0 24 24">
<path d="M3 3v18h18M7 16v-5M12 16V7M17 16v-8">
</path>
</symbol>
<symbol id="i-trend" viewBox="0 0 24 24">
<path d="M3 17l6-6 4 4 8-8M15 7h6v6">
</path>
</symbol>
<symbol id="i-live" viewBox="0 0 24 24">
<circle cx="12" cy="12" r="2">
</circle>
<path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5">
</path>
</symbol>
<symbol id="i-users" viewBox="0 0 24 24">
<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8">
</path>
<circle cx="9" cy="7" r="4">
</circle>
</symbol>
<symbol id="i-bag" viewBox="0 0 24 24">
<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0">
</path>
</symbol>
<symbol id="i-calendar" viewBox="0 0 24 24">
<rect x="3" y="4" width="18" height="18" rx="2">
</rect>
<path d="M16 2v4M8 2v4M3 10h18">
</path>
</symbol>
<symbol id="i-form" viewBox="0 0 24 24">
<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8">
</path>
</symbol>
<symbol id="i-bolt" viewBox="0 0 24 24">
<path d="M13 2 3 14h9l-1 8 10-12h-9z">
</path>
</symbol>
<symbol id="i-ticket" viewBox="0 0 24 24">
<path d="M2 9a3 3 0 0 1 0 6v3h20v-3a3 3 0 0 1 0-6V6H2zM13 6v12">
</path>
</symbol>
<symbol id="i-tag" viewBox="0 0 24 24">
<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z">
</path>
<circle cx="7" cy="7" r="1">
</circle>
</symbol>
<symbol id="i-note" viewBox="0 0 24 24">
<rect x="8" y="2" width="8" height="4" rx="1">
</rect>
<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2">
</path>
</symbol>
<symbol id="i-download" viewBox="0 0 24 24">
<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3">
</path>
</symbol>
<symbol id="i-globe" viewBox="0 0 24 24">
<circle cx="12" cy="12" r="10">
</circle>
<path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20">
</path>
</symbol>
<symbol id="i-image" viewBox="0 0 24 24">
<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z">
</path>
<circle cx="12" cy="13" r="4">
</circle>
</symbol>
<symbol id="i-phone" viewBox="0 0 24 24">
<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z">
</path>
</symbol>
<symbol id="i-chat" viewBox="0 0 24 24">
<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l1.9-5.4A8.4 8.4 0 1 1 21 11.5z">
</path>
</symbol>
<symbol id="i-sliders" viewBox="0 0 24 24">
<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6">
</path>
</symbol>
<symbol id="i-badge" viewBox="0 0 24 24">
<path d="M12 2l2.4 1.8 3-.2 1 2.8 2.5 1.7-.9 2.9.9 2.9-2.5 1.7-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8-2.5-1.7.9-2.9-.9-2.9 2.5-1.7 1-2.8 3 .2z">
</path>
<path d="m9 12 2 2 4-4">
</path>
</symbol>
<symbol id="i-qr" viewBox="0 0 24 24">
<rect x="3" y="3" width="7" height="7">
</rect>
<rect x="14" y="3" width="7" height="7">
</rect>
<rect x="3" y="14" width="7" height="7">
</rect>
<path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4">
</path>
</symbol>
<symbol id="i-clock" viewBox="0 0 24 24">
<circle cx="12" cy="12" r="10">
</circle>
<path d="M12 6v6l4 2">
</path>
</symbol>
<symbol id="i-coin" viewBox="0 0 24 24">
<circle cx="12" cy="12" r="10">
</circle>
<path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2">
</path>
</symbol>
<symbol id="i-user" viewBox="0 0 24 24">
<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2">
</path>
<circle cx="12" cy="7" r="4">
</circle>
</symbol>
<symbol id="i-send" viewBox="0 0 24 24">
<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z">
</path>
</symbol>
</defs>
</svg> <nav className="sa-nav">
<div className="sa-brand" role="button" tabIndex={0} aria-label="Retour à l'accueil SocialApp" style={{ cursor: 'pointer' }} onClick={goTop} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goTop(); }}>
<div className="sa-mk sa-g" style={{ overflow: 'hidden' }}><img src={logo} alt="SocialApp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div><span className="sa-bt">SocialApp</span>
</div>
<div className="sa-lk">{NAV_LINKS.map(([h, l]) => <a key={h} href={h}>{l}</a>)}</div>
<div className="sa-nb" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
<button type="button" className="sa-btn sa-gr" onClick={openEvent}>Créez un évent</button>
<button type="button" className="sa-btn sa-nc" onClick={handleCTA}>{user ? 'Mon dashboard →' : 'Commencer →'}</button>
<button type="button" className={'sa-burger' + (menuOpen ? ' on' : '')} aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}><span /><span /><span /></button>
</div>
<div className={'sa-mmenu' + (menuOpen ? ' open' : '')}>
{NAV_LINKS.map(([h, l]) => <a key={h} href={h} onClick={() => setMenuOpen(false)}>{l}</a>)}
<button type="button" className="sa-btn sa-mcta" onClick={() => { setMenuOpen(false); handleCTA(); }}>{user ? 'Mon dashboard →' : 'Commencer →'}</button>
</div>
</nav> <div className="sa-w">
<header className="sa-hero">
<div>
<h1 className="sa-ttl">
<span className="sa-ln">
<span className="sa-l1">Votre profil digital</span>
</span>
<span className="sa-ln">
<span className="sa-l2">et CRM <span style={{whiteSpace:"nowrap"}}>tout-en-un.</span>
</span>
</span>
</h1>
<div className="sa-pitch">SocialApp est une plateforme tout-en-un qui permet aux entrepreneurs, entreprises, commerciaux et créateurs de contenu de créer un profil professionnel digital, <b>partager leurs contacts via QR Code,</b> collecter des prospects et gérer leurs relations clients grâce à un CRM intégré.</div>
<p className="sa-tag">Transformez chaque scan en contact,<br />client ou opportunité.</p>
<div className="sa-ck">
<i>✓</i>Créez votre carte de visite digitale professionnel avec QR CODE en quelques minutes</div>
<div className="sa-ck">
<i>✓</i>Partagez vos coordonnées, réseaux sociaux et services via un QR Code unique</div>
<div className="sa-ck">
<i>✓</i>Collectez automatiquement les contacts et prospects intéressés</div>
<div className="sa-ck">
<i>✓</i>Gérez vos clients et opportunités avec un CRM intégré</div>
<div className="sa-ck">
<i>✓</i>Suivez vos statistiques, visites, clics et performances en temps réel</div>
<div className="sa-cta">
<button type="button" className="sa-btn sa-l" onClick={handleCTA}>{user ? 'Mon tableau de bord →' : 'Créer ma carte de visite gratuitement →'}</button>
<a className="sa-btn sa-s sa-l" style={{boxShadow:"none",fontSize:"15px",padding:"0 28px"}} href="#f">Voir les fonctionnalités</a>
</div>
<div className="sa-av">
<div style={{display:"flex"}}>
<div style={{background:"#ff6b35"}}>K</div>
<div style={{background:"#a78bfa"}}>D</div>
<div style={{background:"#22c55e"}}>J</div>
<div style={{background:"#f0a500"}}>A</div>
<div style={{background:"#0ea5e9"}}>M</div>
</div>
<span>
<b style={{fontSize:"15px",color:"#1d1a2b"}}>+500 utilisateurs</b> sur SocialApp<br />
<span style={{color:"#f0a500"}}>★★★★★</span> 4.9/5</span>
</div>
</div>
<HeroDevices />
</header>
</div>
<div className="sa-stats">
<div>
<b className="sa-gt">+30%</b>
<span>de followers en plus</span>
</div>
<div>
<b className="sa-gt">1 scan</b>
<span>pour tout partager</span>
</div>
<div>
<b style={{background:"linear-gradient(135deg,#16a34a,#4ade80)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>∞</b>
<span>produits avec Business</span>
</div>
<div>
<b style={{background:"linear-gradient(135deg,#9333ea,#d946ef)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>100%</b>
<span>personnalisable</span>
</div>
</div>
<section className="sa-sec">
<div className="sa-w sa-two">
<div>
<div className="sa-badge" style={{background:"rgba(255,107,53,.12)",border:"1px solid rgba(255,107,53,.3)",color:"#c2410c"}}>
<span className="sa-dot">
</span>Profil digital</div>
<h2>Un seul lien pour<br />
<span className="sa-gt">toute votre présence Digitale</span>
</h2>
<p className="sa-sub" style={{marginBottom:"28px"}}>Votre carte de visite digitale SocialApp regroupe vos réseaux sociaux, votre WhatsApp, votre boutique et vos coordonnées sur une seule page personnalisable, accessible par lien ou QR code.</p>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(255,107,53,.12)"}}>
<svg className="sa-i">
<use href="#i-sliders">
</use>
</svg>
</div>
<div>
<b>Personnalisation complète</b>
<span>Couleurs, photo, username unique. Un profil à votre image, sans code.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(99,102,241,.12)"}}>
<svg className="sa-i">
<use href="#i-phone">
</use>
</svg>
</div>
<div>
<b>Accessible partout</b>
<span>Lien direct ou QR code à scanner, imprimable sur carte de visite ou vitrine.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(34,197,94,.12)"}}>
<svg className="sa-i">
<use href="#i-badge">
</use>
</svg>
</div>
<div>
<b>Badge vérifié</b>
<span>Renforcez la confiance de vos visiteurs dès le premier coup d'œil.</span>
</div>
</div>
<span className="sa-pl" style={{background:"rgba(99,102,241,.12)",color:"#4f46e5"}}>✓ Inclus dans toutes les offres</span>
</div>
<div style={{display:"flex",justifyContent:"center",alignItems:"center"}}><img src={profilMockup} alt="Profil digital SocialApp" loading="lazy" className="sa-float" style={{ width: '80%', maxWidth: '480px', objectFit: 'contain', filter: 'drop-shadow(0 40px 80px rgba(255,107,53,.25))' }} /></div>
</div>
</section>
<section className="sa-sec" id="f" style={{paddingTop:"20px"}}>
<div className="sa-w">
<div className="sa-hd">
<div className="sa-badge" style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.3)",color:"#4f46e5"}}>
<span className="sa-dot">
</span>Plateforme tout-en-un</div>
<h2>Tout ce dont vous avez besoin<br />
<span className="sa-gt">depuis une seule plateforme</span>
</h2>
<p className="sa-sub">Dashboard complet, analytics temps réel, CRM, automatisations — conçu pour les entrepreneurs ivoiriens.</p>
</div>
<div className="sa-fg">
<div className="sa-card sa-fc">
<div className="sa-ic" style={{background:"rgba(99,102,241,.14)"}}>
<svg className="sa-i">
<use href="#i-link">
</use>
</svg>
</div>
<h3>Page de liens personnalisée</h3>
<p>Créez votre carte de visite digitale avec WhatsApp, Instagram, TikTok, Facebook, YouTube sur une seule page avec username personnalisé et badge vérifié.</p>
<span className="sa-ft" style={{background:"rgba(99,102,241,.14)",color:"#4f46e5"}}>✓ Toutes les offres</span>
</div>
<div className="sa-card sa-fc">
<div className="sa-ic" style={{background:"rgba(34,197,94,.14)"}}>
<svg className="sa-i">
<use href="#i-chart">
</use>
</svg>
</div>
<h3>Analytics & Temps réel</h3>
<p>Vues, clics par lien, pays des visiteurs, flux live. Sachez exactement qui scanne votre QR code et d'où.</p>
<span className="sa-ft" style={{background:"rgba(255,107,53,.14)",color:"#c2410c"}}>PRO & BUSINESS</span>
</div>
<div className="sa-card sa-fc">
<div className="sa-ic" style={{background:"rgba(245,158,11,.16)"}}>
<svg className="sa-i">
<use href="#i-bag">
</use>
</svg>
</div>
<h3>Marketplace intégrée</h3>
<p>Photos, prix barrés, badges promo. Vos clients commandent sur WhatsApp. Zéro commission sur vos ventes.</p>
<span className="sa-ft" style={{background:"rgba(34,197,94,.14)",color:"#15803d"}}>✓ Toutes les offres</span>
</div>
<div className="sa-card sa-fc">
<div className="sa-ic" style={{background:"rgba(236,72,153,.14)"}}>
<svg className="sa-i">
<use href="#i-users">
</use>
</svg>
</div>
<h3>CRM & Pipeline de leads</h3>
<p>Capturez, tagguez et suivez vos prospects. Pipeline avec statuts Prospect, Chaud, Client. Export CSV.</p>
<span className="sa-ft" style={{background:"rgba(247,201,72,.28)",color:"#8a6100"}}>BUSINESS</span>
</div>
<div className="sa-card sa-fc">
<div className="sa-ic" style={{background:"rgba(255,107,53,.14)"}}>
<svg className="sa-i">
<use href="#i-ticket">
</use>
</svg>
</div>
<h3>Mode Événement</h3>
<p>Compte à rebours live, galerie photos & vidéos (50 Mo), bouton réservation. Parfait pour soirées, salons et concerts.</p>
<span className="sa-ft" style={{background:"rgba(34,197,94,.14)",color:"#15803d"}}>Option — 3 500 FCFA</span>
</div>
<div className="sa-card sa-fc">
<div className="sa-ic" style={{background:"rgba(93,202,165,.2)"}}>
<svg className="sa-i">
<use href="#i-calendar">
</use>
</svg>
</div>
<h3>Calendrier de réservation</h3>
<p>Vos clients réservent un créneau ou une place directement depuis votre profil public, sans échange de messages.</p>
<span className="sa-ft" style={{background:"rgba(34,197,94,.14)",color:"#15803d"}}>✓ Toutes les offres</span>
</div>
<div className="sa-card sa-fc">
<div className="sa-ic" style={{background:"rgba(59,130,246,.14)"}}>
<svg className="sa-i">
<use href="#i-form">
</use>
</svg>
</div>
<h3>Formulaires personnalisés</h3>
<p>Créez des formulaires sur mesure (contact, devis, inscription) et recevez les réponses directement dans votre dashboard.</p>
<span className="sa-ft" style={{background:"rgba(34,197,94,.14)",color:"#15803d"}}>✓ Toutes les offres</span>
</div>
<div className="sa-card sa-fc">
<div className="sa-ic" style={{background:"rgba(37,211,102,.16)"}}>
<svg className="sa-i">
<use href="#i-send">
</use>
</svg>
</div>
<h3>Campagnes WhatsApp IA</h3>
<p>Décrivez votre offre, l'IA génère vos messages de campagne (promo, relance, nouveauté) prêts à envoyer.</p>
<span className="sa-ft" style={{background:"rgba(247,201,72,.28)",color:"#8a6100"}}>BUSINESS</span>
</div>
<div className="sa-card sa-fc">
<div className="sa-ic" style={{background:"rgba(139,92,246,.14)"}}>
<svg className="sa-i">
<use href="#i-bolt">
</use>
</svg>
</div>
<h3>Automatisations & Intégrations</h3>
<p>Automatisez vos réponses, connectez vos outils. Webhooks, notifications push, flux temps réel.</p>
<span className="sa-ft" style={{background:"rgba(247,201,72,.28)",color:"#8a6100"}}>BUSINESS</span>
</div>
</div>
</div>
</section>
<section className="sa-sec sa-tint1" id="crm">
<div className="sa-w sa-two">
<div style={{display:"flex",justifyContent:"center",alignItems:"center"}}><picture><source srcSet={leadsCrmMockupWebp} type="image/webp" /><img src={leadsCrmMockup} alt="Leads & CRM SocialApp" loading="lazy" className="sa-float" style={{ width: '100%', maxWidth: '640px', objectFit: 'contain', filter: 'drop-shadow(0 40px 80px rgba(236,72,153,.25))' }} /></picture></div>
<div>
<div className="sa-badge" style={{background:"rgba(236,72,153,.12)",border:"1px solid rgba(236,72,153,.3)",color:"#be185d"}}>
<span className="sa-dot">
</span>CRM intégré</div>
<h2>Transformez vos visiteurs<br />en <span className="sa-gt">clients fidèles</span>
</h2>
<p className="sa-sub" style={{marginBottom:"28px"}}>Chaque scan de votre QR code est une opportunité. Capturez vos leads, suivez leur parcours et concluez plus de ventes — tout depuis votre dashboard.</p>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(236,72,153,.12)"}}>
<svg className="sa-i">
<use href="#i-tag">
</use>
</svg>
</div>
<div>
<b>Tags intelligents</b>
<span>Prospect, Chaud, Client, Froid, Perdu. Filtrez et agissez en priorité.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(99,102,241,.12)"}}>
<svg className="sa-i">
<use href="#i-note">
</use>
</svg>
</div>
<div>
<b>Notes & historique</b>
<span>Ajoutez des notes sur chaque contact. Gardez le contexte de vos échanges.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(34,197,94,.12)"}}>
<svg className="sa-i">
<use href="#i-download">
</use>
</svg>
</div>
<div>
<b>Export CSV</b>
<span>Exportez tous vos leads en un clic. Compatible Excel & Google Sheets.</span>
</div>
</div>
<span className="sa-pl" style={{background:"rgba(247,201,72,.3)",color:"#8a6100"}}>Disponible avec l'offre BUSINESS</span>
</div>
</div>
</section>
<section className="sa-sec sa-tint2" id="a">
<div className="sa-w sa-two">
<div>
<div className="sa-badge" style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.3)",color:"#4f46e5"}}>
<span className="sa-dot">
</span>Analytics avancés</div>
<h2>Analysez chaque<br />interaction <span className="sa-gt">en temps réel</span>
</h2>
<p className="sa-sub" style={{marginBottom:"28px"}}>Sachez exactement qui visite votre profil, d'où ils viennent et sur quels liens ils cliquent. Des données actionnables pour optimiser votre présence digitale.</p>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(99,102,241,.14)"}}>
<svg className="sa-i">
<use href="#i-globe">
</use>
</svg>
</div>
<div>
<b>Statistiques géographiques</b>
<span>Visualisez d'où viennent vos visiteurs, pays par pays.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(34,197,94,.14)"}}>
<svg className="sa-i">
<use href="#i-live">
</use>
</svg>
</div>
<div>
<b>Flux visiteurs en direct</b>
<span>Voir qui est sur votre page maintenant, en temps réel.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(245,158,11,.16)"}}>
<svg className="sa-i">
<use href="#i-chart">
</use>
</svg>
</div>
<div>
<b>Top liens & taux de clic</b>
<span>Identifiez vos liens les plus performants.</span>
</div>
</div>
<span className="sa-pl" style={{background:"rgba(255,107,53,.12)",color:"#c2410c"}}>Disponible avec PRO & BUSINESS</span>
</div>
<div style={{display:"flex",justifyContent:"center",alignItems:"center"}}><picture><source srcSet={tempsReelMockupWebp} type="image/webp" /><img src={tempsReelMockup} alt="Analytics temps réel SocialApp" loading="lazy" className="sa-float" style={{ width: '100%', maxWidth: '640px', objectFit: 'contain', filter: 'drop-shadow(0 40px 80px rgba(99,102,241,.3))' }} /></picture></div>
</div>
</section>
<section className="sa-sec sa-tint3" id="m">
<div className="sa-w">
<div className="sa-hd">
<div className="sa-badge" style={{background:"rgba(255,107,53,.12)",border:"1px solid rgba(255,107,53,.3)",color:"#c2410c"}}>
<span className="sa-dot">
</span>Marketplace </div>
<h2>Votre boutique directement<br />sur votre <span className="sa-gt">profil public</span>
</h2>
<p className="sa-sub">Vendez sans créer un site web. Photos, prix barrés, badges promo. Vos clients commandent sur WhatsApp. Zéro commission.</p>
</div>
<div className="sa-two">
<div className="sa-mpwrap"><img src={marketplaceWoman} alt="Cliente ravie utilisant SocialApp" loading="lazy" className="sa-float sa-mpwoman" /><div className="sa-phone">
<div className="sa-scr">
<div style={{textAlign:"center"}}>
<div className="sa-mk sa-g" style={{margin:"0 auto 5px"}}>S</div>
<b style={{fontSize:"10.5px"}}>SocialApp <span style={{color:"#22c55e"}}>
<svg className="sa-i">
<use href="#i-badge">
</use>
</svg>
</span>
</b>
<div style={{fontSize:"7px",opacity:".5"}}>Votre boutique, votre profil</div>
<div className="sa-g" style={{display:"inline-block",marginTop:"6px",fontSize:"7px",fontWeight:"700",color:"#2a1305",padding:"4px 11px",borderRadius:"20px"}}>Ouvrir ma boutique →</div>
</div>
<div className="sa-pg">
<div>
<i style={{background:"linear-gradient(135deg,#5a4a63,#241a2b)"}}>
</i>
<b>14 000 F <s style={{opacity:".4",fontWeight:"500"}}>20 000 F</s>
</b>
</div>
<div>
<i style={{background:"linear-gradient(135deg,#7a4a3a,#2e1f18)"}}>
</i>
<b>10 000 F</b>
</div>
<div>
<i style={{background:"linear-gradient(135deg,#3a4a5a,#1a232e)"}}>
<svg className="sa-i">
<use href="#i-phone">
</use>
</svg>
</i>
<b>180 000 F</b>
</div>
<div>
<i style={{background:"linear-gradient(135deg,#4a3a5a,#20182e)"}}>
</i>
<b>9 000 F</b>
</div>
</div>
<div className="sa-rw">
<span className="sa-ic" style={{width:"14px",height:"14px",borderRadius:"4px",fontSize:"7px",background:"#ff6b35"}}>
<svg className="sa-i">
<use href="#i-phone">
</use>
</svg>
</span>Téléphone</div>
<div className="sa-rw">
<span className="sa-ic" style={{width:"14px",height:"14px",borderRadius:"4px",fontSize:"7px",background:"#25D366"}}>
<svg className="sa-i">
<use href="#i-chat">
</use>
</svg>
</span>WhatsApp</div>
</div>
</div>
</div>
<div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(255,107,53,.12)"}}>
<svg className="sa-i">
<use href="#i-image">
</use>
</svg>
</div>
<div>
<b>Photos, prix & badges promotionnels</b>
<span>Prix barrés, réductions en %, badge disponible/épuisé.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(34,197,94,.12)"}}>
<svg className="sa-i">
<use href="#i-coin">
</use>
</svg>
</div>
<div>
<b>Zéro commission — toujours</b>
<span>100% de vos ventes vous reviennent. SocialApp ne prend rien.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(37,211,102,.14)"}}>
<svg className="sa-i">
<use href="#i-phone">
</use>
</svg>
</div>
<div>
<b>Commandes directes sur WhatsApp</b>
<span>Bouton de contact direct. Votre client vous écrit en 1 tap.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(245,158,11,.16)"}}>
<svg className="sa-i">
<use href="#i-form">
</use>
</svg>
</div>
<div>
<b>Documents PDF joints</b>
<span>Menus, catalogues, brochures — accessibles sur votre profil.</span>
</div>
</div>
<button type="button" className="sa-btn sa-l" style={{marginTop:"12px"}} onClick={handleCTA}>Ouvrir ma boutique →</button>
</div>
</div>
</div>
</section>
<section className="sa-sec" id="e">
<div className="sa-w sa-two">
<div>
<div className="sa-badge" style={{background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.3)",color:"#15803d"}}>
<span className="sa-dot">
</span>Soirées, salons & concerts</div>
<h2>Mode <span className="sa-gt">Événement</span>
</h2>
<p className="sa-sub" style={{marginBottom:"28px"}}>Créez une page d'événement dédiée en 2 minutes, avec son propre lien — compte à rebours live, galerie médias, réservation en ligne.</p>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(34,197,94,.16)"}}>
<svg className="sa-i">
<use href="#i-clock">
</use>
</svg>
</div>
<div>
<b>Compte à rebours en direct</b>
<span>Jours, heures, minutes, secondes — en temps réel.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(255,107,53,.14)"}}>
<svg className="sa-i">
<use href="#i-image">
</use>
</svg>
</div>
<div>
<b>Galerie photos & vidéos</b>
<span>Carrousel jusqu'à 50 Mo pour présenter l'ambiance.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(247,201,72,.28)"}}>
<svg className="sa-i">
<use href="#i-ticket">
</use>
</svg>
</div>
<div>
<b>Bouton de réservation</b>
<span>Redirigez vers votre lien de paiement ou de billets.</span>
</div>
</div>
<div className="sa-it">
<div className="sa-ic" style={{background:"rgba(139,92,246,.14)"}}>
<svg className="sa-i">
<use href="#i-sliders">
</use>
</svg>
</div>
<div>
<b>Couleurs personnalisables</b>
<span>Sunset, Océan, Rose, Forêt — adaptez l'ambiance.</span>
</div>
</div>
<div style={{background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.25)",borderRadius:"14px",padding:"16px 20px",marginTop:"8px"}}>
<b style={{fontSize:"22px",color:"#16a34a",fontWeight:"900"}}>3 500 FCFA</b>
<div style={{fontSize:"13px",color:"#5d5a6e",marginTop:"4px"}}>par événement · Quel que soit votre plan</div>
</div>
</div>
<div style={{display:"flex",justifyContent:"center",alignItems:"center"}}><picture><source srcSet={eventMockupWebp} type="image/webp" /><img src={eventMockup} alt="Mode Événement SocialApp" loading="lazy" className="sa-float" style={{ width: '320px', maxWidth: '100%', borderRadius: '24px', boxShadow: '0 40px 80px rgba(0,0,0,.35)', objectFit: 'contain' }} /></picture></div>
</div>
</section> <section className="sa-sec" id="t" style={{ background: 'rgba(255,255,255,.35)' }}>
<div className="sa-w">
<div className="sa-hd" style={{ marginBottom: '36px' }}>
<h2>Des prix faits pour <span className="sa-gt">l'Afrique</span></h2>
<p className="sa-sub">Paiement Mobile Money · Pas de carte bancaire nécessaire</p>
<div style={{ marginTop: '20px' }}><BillingToggle value={billing} onChange={setBilling} /></div>
<div style={{ fontSize: '12px', color: '#7b788a', marginTop: '10px' }}>Le paiement mensuel est disponible pour l'offre BUSINESS</div>
</div>
<div className="sa-pls">{PLANS.map((p) => <PlanCard key={p.name} p={p} billing={billing} onChoose={choosePlan} />)}</div>
<p style={{ textAlign: 'center', color: '#7b788a', fontSize: '13px', marginTop: '28px' }}>Questions ? WhatsApp <b>+225 05 76 03 12 12</b></p>
</div>
</section> <section className="sa-sec">
<div className="sa-w">
<div className="sa-hd">
<h2>Prêt en <span className="sa-gt">5 minutes</span>
</h2>
<p className="sa-sub">Créez votre carte de visite digitale complète en quelques étapes simples.</p>
</div>
<div className="sa-stp">
<div className="sa-card">
<div style={{fontSize:"32px",color:"#c2410c"}}>
<svg className="sa-i">
<use href="#i-user">
</use>
</svg>
</div>
<div className="sa-nm sa-g">1</div>
<h3>Créez votre carte de visite digitale</h3>
<p>Nom, photo, bio, vos liens sociaux. En 5 minutes votre vitrine est prête.</p>
</div>
<div className="sa-card">
<div style={{fontSize:"32px",color:"#c2410c"}}>
<svg className="sa-i">
<use href="#i-bag">
</use>
</svg>
</div>
<div className="sa-nm sa-g">2</div>
<h3>Ajoutez vos produits</h3>
<p>Photos, prix, descriptions. Votre boutique est visible directement sur votre page.</p>
</div>
<div className="sa-card">
<div style={{fontSize:"32px",color:"#c2410c"}}>
<svg className="sa-i">
<use href="#i-qr">
</use>
</svg>
</div>
<div className="sa-nm sa-g">3</div>
<h3>Partagez votre QR code</h3>
<p>Sur vos flyers, cartes de visite, vitrine. Un scan et vos clients trouvent tout.</p>
</div>
</div>
</div>
</section>
<section className="sa-sec" style={{paddingTop:"20px"}}>
<div className="sa-w">
<div className="sa-hd">
<h2>Ils utilisent déjà <span className="sa-gt">SocialApp</span>
</h2>
<p className="sa-sub">Ce qu'ils en disent</p>
</div>
<div className="sa-tg">
<div className="sa-card">
<div style={{color:"#f0a500",letterSpacing:"3px",fontSize:"18px"}}>★★★★★</div>
<p>"Depuis que j'utilise SocialApp, mes abonnés Instagram ont augmenté de 40% en 2 mois. Les analytics me montrent d'où viennent mes visiteurs. Indispensable !"</p>
<b>Koffi Mensah</b>
<div style={{fontSize:"12px",color:"#7b788a"}}>Influenceur · Abidjan</div>
</div>
<div className="sa-card">
<div style={{color:"#f0a500",letterSpacing:"3px",fontSize:"18px"}}>★★★★★</div>
<p>"Mes clients scannent mon QR code, voient mes produits et me contactent sur WhatsApp. Le CRM m'aide à suivre mes prospects. Mon business a vraiment décollé !"</p>
<b>Dorine Ouattara</b>
<div style={{fontSize:"12px",color:"#7b788a"}}>Commerçante · Cocody</div>
</div>
<div className="sa-card">
<div style={{color:"#f0a500",letterSpacing:"3px",fontSize:"18px"}}>★★★★★</div>
<p>"J'ai organisé ma soirée avec le mode Événement. Le compte à rebours et la réservation ont boosté mes ventes de billets de 60%. Je recommande !"</p>
<b>Jean-Baptiste K.</b>
<div style={{fontSize:"12px",color:"#7b788a"}}>Organisateur · Plateau</div>
</div>
</div>
</div>
</section>
<section className="sa-sec" style={{paddingTop:"20px"}}>
<div className="sa-w">
<div className="sa-fin">
<h2>Prêt à transformer votre<br />
<span className="sa-gt">présence digitale ?</span>
</h2>
<p className="sa-sub" style={{maxWidth:"560px",margin:"0 auto 32px",fontSize:"18px"}}>Rejoignez des centaines d'entrepreneurs ivoiriens et Africains qui utilisent SocialApp pour partager leurs réseaux, vendre leurs produits et gérer leurs leads.</p>
<div style={{display:"flex",gap:"16px",justifyContent:"center",flexWrap:"wrap"}}>
<button type="button" className="sa-btn sa-l" onClick={handleCTA}>{user ? 'Accéder à mon dashboard →' : 'Créer ma carte de visite gratuitement →'}</button>
<a className="sa-btn sa-s sa-l" style={{boxShadow:"none",fontSize:"15px",padding:"0 32px"}} href="#t">Voir les offres</a>
</div>
<p style={{color:"#7b788a",fontSize:"13px",margin:"20px 0 0"}}>Paiement Mobile Money · Wave · Orange Money</p>
</div>
</div>
</section> <section className="sa-sec" id="q" style={{ paddingTop: '20px' }}>
<div className="sa-w">
<div className="sa-hd" style={{ marginBottom: '40px' }}><h2>Questions <span className="sa-gt">fréquentes</span></h2></div>
<div className="sa-fq">{FAQS.map((f, i) => (
<div key={i} className={'sa-fqi' + (openFaq === i ? ' open' : '')}>
<button type="button" className="sa-fqb" aria-expanded={openFaq === i} onClick={() => setOpenFaq((v) => (v === i ? null : i))}><b>{f.q}</b></button>
{openFaq === i && <span>{f.a}</span>}
</div>))}</div>
</div>
</section> <footer className="sa-foot">
<div className="sa-fi">
<div className="sa-fcta">
<div>
<b>Prêt à lancer votre carte de visite digitale ?</b>
<span>Mise en ligne en 5 minutes · Paiement Mobile Money, sans carte bancaire</span>
</div>
<div style={{display:"flex",gap:"12px",flexWrap:"wrap"}}>
<button type="button" className="sa-btn" onClick={handleCTA}>{user ? 'Mon dashboard →' : 'Commencer →'}</button>
<a className="sa-btn sa-s" href="https://wa.me/2250576031212">Nous écrire sur WhatsApp</a>
</div>
</div>
<div className="sa-fgd">
<div>
<div className="sa-brand" style={{marginBottom:"16px",color:"#1d1a2b"}}>
<div className="sa-mk sa-g" style={{width:"32px",height:"32px",overflow:"hidden"}}><img src={logo} alt="SocialApp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>SocialApp</div>
<p>Plateforme SaaS ivoirienne : profil digital, CRM, QR Code et marketplace pour développer votre activité. Accessible partout en Afrique.</p>
<div className="sa-pay">
<span>Orange Money</span>
<span>Wave</span>
<span>MTN</span>
</div>
</div>
<div>
<h6>Plateforme</h6>
<a href="#f">Fonctionnalités</a>
<a href="#crm">CRM</a>
<a href="#a">Analytics</a>
<a href="#m">Boutique</a>
<a href="#e">Mode Événement</a>
</div>
<div>
<h6>Offres</h6>
<a href="#t">BASIC · 10 000 F</a>
<a href="#t">PRO · 15 000 F</a>
<a href="#t">BUSINESS · 39 900 F</a>
<a href="#t">ÉVÉNEMENT · 3 500 F</a>
</div>
<div>
<h6>Compte</h6>
<button type="button" className="sa-lnk" onClick={handleCTA}>{user ? 'Mon dashboard' : 'Se connecter'}</button>
<button type="button" onClick={handleCTA}>Créer ma carte</button>
<a href="#q">Questions fréquentes</a>
<a href="/privacy-policy">Politique de confidentialité</a>
<a href="/terms-of-service">Conditions d'utilisation</a>
</div>
<div>
<h6>Contact</h6>
<a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer">+225 05 76 03 12 12</a>
<a>Côte d'Ivoire</a>
</div>
</div>
<div className="sa-cp">
<span>© 2026 SocialApp · Tous droits réservés · Côte d'Ivoire </span>
<div>
<a href="/privacy-policy">Confidentialité</a>
<a href="/terms-of-service">Conditions</a>
<span>Mobile Money · Wave · Orange Money</span>
</div>
</div>
</div>
</footer>
      </div>
    </>
  );
}