import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Helmet } from "react-helmet-async";
import logo from '../assets/Logo_SocialApp.png';
import eventMockup from '../assets/MODE_EVENEMENT.png';
import eventMockupWebp from '../assets/MODE_EVENEMENT.webp';
import marketplaceMockup from '../assets/MARKETPLACE.png';
import marketplaceMockupWebp from '../assets/MARKETPLACE.webp';
import tempsReelMockup from '../assets/TEMPS_REEL.png';
import tempsReelMockupWebp from '../assets/TEMPS_REEL.webp';
import leadsCrmMockup from '../assets/LEADS_CRM.png';
import leadsCrmMockupWebp from '../assets/LEADS_CRM.webp';

/* ─────────────────────────────────────────────
   MODAL DE SÉLECTION D'OFFRE
───────────────────────────────────────────── */
function PlanModal({ onClose, onSelect }) {
  const plans = [
    {
      name: 'BASIC', emoji: '⚡', price: '10 000', color: '#a78bfa',
      subtitle: 'Particulier, petit commerce, entrepreneur débutant',
      bg: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.25)',
      features: ['1 profil · 3 liens sociaux', 'Page publique', 'QR Code standard', '1 import PDF', 'Marketplace (4 produits)'],
    },
    {
      name: 'PRO', emoji: '🚀', price: '15 000', color: '#ff6b35', popular: true,
      subtitle: 'Professionnels, influenceurs, restaurants, hôtels, boutiques',
      bg: 'rgba(255,107,53,.1)', border: '2px solid rgba(255,107,53,.55)',
      features: ['1 profil · 8 liens sociaux', '1 Carte NFC ou PVC', 'Analytics & stats détaillées', 'Temps réel — visiteurs live', 'Mode Événement inclus', 'Calendrier de réservation (RDV en ligne)', 'Formulaires personnalisés (3)', 'Marketplace (10 produits)', 'Support standard'],
    },
    {
      name: 'BUSINESS', emoji: '💼', price: '25 000', color: '#f7c948',
      subtitle: 'Grandes entreprises, agences com, marques établies',
      bg: 'rgba(247,201,72,.06)', border: '1px solid rgba(247,201,72,.28)',
      features: ['1 profil · 17 liens sociaux', '1 Carte NFC ou PVC', 'CRM & Pipeline de leads', 'CRM WHATSAPP', 'Campagnes WhatsApp IA', 'Calendrier de réservation illimité', 'Formulaires illimités', 'Automatisations', 'Marketplace illimitée', 'Support VIP prioritaire'],
    },
  ];

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div onClick={handleBackdrop} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#0a0818', border: '1px solid rgba(255,255,255,.1)', borderRadius: '28px', padding: '40px 36px', maxWidth: '940px', width: '100%', boxShadow: '0 40px 120px rgba(0,0,0,.8)', maxHeight: '92vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '18px', right: '20px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '50%', width: '34px', height: '34px', color: 'rgba(255,255,255,.6)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', lineHeight: 1 }}>×</button>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,107,53,.1)', border: '1px solid rgba(255,107,53,.3)', borderRadius: '100px', padding: '5px 14px', fontSize: '11px', color: '#ff6b35', fontWeight: '700', marginBottom: '14px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff6b35' }} />
            Choisissez votre offre
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-1px', color: '#fff', marginBottom: '8px' }}>Démarrez avec l'offre qui vous convient</h2>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '14px' }}>Paiement Mobile Money · Wave · Orange Money · Sans carte bancaire</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px' }} className="sa-modal-plans">
          {plans.map((p, i) => (
            <div key={i} style={{ background: p.bg, border: p.border, borderRadius: '22px', padding: p.popular ? '36px 24px 24px' : '24px', position: 'relative', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', marginTop: p.popular ? '14px' : '0' }} className="sa-modal-plan" onClick={() => onSelect(p.name.toLowerCase())}>
              {p.popular && (<div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', borderRadius: '100px', padding: '5px 16px', fontSize: '11px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(255,107,53,.4)' }}>⭐ Plus populaire</div>)}
              <div style={{ fontSize: '11px', fontWeight: '700', color: p.color, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>{p.emoji} {p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '-1px' }}>{p.price}</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)' }}>FCFA</span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)', marginBottom: '6px' }}>/ Paiement annuel</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)', marginBottom: '18px', lineHeight: '1.5', minHeight: '32px' }}>{p.subtitle}</div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,.08)', marginBottom: '14px' }} />
              {p.features.map((f, j) => (<div key={j} style={{ display: 'flex', gap: '7px', marginBottom: '8px', fontSize: '12px', color: 'rgba(255,255,255,.7)', alignItems: 'flex-start' }}><span style={{ color: p.color, flexShrink: 0 }}>✓</span>{f}</div>))}
              <button type="button" style={{ display: 'block', width: '100%', marginTop: '16px', padding: '13px', borderRadius: '12px', border: 'none', background: p.popular ? 'linear-gradient(135deg,#ff6b35,#f7c948)' : 'rgba(255,255,255,.1)', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform .15s, box-shadow .15s' }} className="sa-modal-btn">Choisir {p.name} →</button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: '12px', marginTop: '24px' }}>💬 Besoin d'aide ? WhatsApp <strong style={{ color: 'rgba(255,255,255,.5)' }}>+225 05 76 03 12 12</strong></p>
      </div>
      <style>{`
        @media(max-width:700px){.sa-modal-plans{grid-template-columns:1fr!important}}
        .sa-modal-plan:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(0,0,0,.5)}
        .sa-modal-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,107,53,.3)}
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const handleCTA = () => { if (user) { navigate('/dashboard'); } else { setShowPlanModal(true); } };
  const handlePlanSelect = (planSlug) => { setShowPlanModal(false); navigate(`/login?plan=${encodeURIComponent(planSlug)}`); };

  useEffect(() => {
    const obs = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('sa-vis', e.isIntersecting)), { threshold: 0.08 });
    document.querySelectorAll('.sa-rv').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const plans = [
    { name: 'BASIC', emoji: '⚡', price: '10 000', color: '#a78bfa', subtitle: 'Particulier, petit commerce, entrepreneur débutant', bg: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.22)', btnBg: 'rgba(99,102,241,.25)', btnBorder: '1px solid rgba(99,102,241,.45)', features: ['1 profil · 3 liens sociaux', 'Page publique', 'QR Code standard', '1 import PDF', 'Marketplace (4 produits)'] },
    { name: 'PRO', emoji: '🚀', price: '15 000', color: '#ff6b35', popular: true, subtitle: 'Professionnels, influenceurs, restaurants, hôtels, boutiques', bg: 'rgba(255,107,53,.09)', border: '2px solid rgba(255,107,53,.55)', btnBg: 'linear-gradient(135deg,#ff6b35,#f7c948)', btnBorder: 'none', features: ['1 profil · 8 liens sociaux', '1 Carte NFC ou PVC (logo + QR CODE)', 'Analytics & statistiques détaillées', 'Temps réel — flux visiteurs live', 'Mode Événement inclus', 'Calendrier de réservation (RDV en ligne)', 'Formulaires personnalisés (3)', 'Marketplace (10 produits)', '3 imports PDFs', 'QR Code premium', 'Support standard'] },
    { name: 'BUSINESS', emoji: '💼', price: '25 000', color: '#f7c948', subtitle: 'Grandes entreprises, agences com, marques établies', bg: 'rgba(247,201,72,.06)', border: '1px solid rgba(247,201,72,.28)', btnBg: 'linear-gradient(135deg,#b45309,#f7c948)', btnBorder: 'none', features: ['1 profil · 17 liens sociaux', '1 Carte NFC ou PVC (logo + QR CODE)', 'Analytics avancés complets', 'CRM & Pipeline de leads', 'CRM WHATSAPP', 'Campagnes WhatsApp IA (génération automatique)', 'Calendrier de réservation illimité', 'Formulaires illimités', 'Automatisations', 'Toutes les intégrations', 'Marketplace illimitée', '10 imports PDFs', 'QR Code dynamique', '1 mois Événement offert', 'Support VIP prioritaire'] },
  ];

  const faqs = [
    { q: "C'est quoi exactement SocialApp ?", a: "SocialApp est votre profil digital tout-en-un : un lien unique et un QR code qui regroupe tous vos réseaux sociaux, WhatsApp, votre boutique et vos événements. Un seul scan, vos clients trouvent tout." },
    { q: "Combien ça coûte ?", a: "10 000 FCFA/an (BASIC), 15 000 FCFA/an (PRO), 25 000 FCFA/an (BUSINESS). Module Événement disponible à 5 000 FCFA. Paiement Mobile Money, Wave ou Orange Money — sans carte bancaire." },
    { q: "Qu'est-ce que le CRM ?", a: "Le CRM intégré (offre BUSINESS) vous permet de capturer et gérer vos prospects. Tags intelligents (Prospect, Chaud, Client, Froid), notes, historique et export CSV. Transformez chaque visiteur en opportunité." },
    { q: "Je peux vendre mes produits ?", a: "Oui ! La marketplace affiche vos produits avec photos, prix et description. 4 produits (BASIC), 10 (PRO), illimités (BUSINESS). Vos clients commandent via WhatsApp. Zéro commission." },
    { q: "Le QR code peut-il être modifié sans le réimprimer ?", a: "Oui ! Modifiez vos liens, votre boutique ou votre WhatsApp à tout moment — votre QR code sur vos flyers et cartes reste valide à vie." },
    { q: "C'est quoi le mode Événement ?", a: "Transformez votre profil en page d'événement : compte à rebours en direct, galerie photos & vidéos (50 Mo), bouton de réservation, couleurs personnalisables. Inclus dès PRO ou 5 000 FCFA." },
    { q: "Comment je reçois ma carte PVC ou NFC ?", a: "Dès votre souscription PRO ou BUSINESS, notre équipe vous contacte sur WhatsApp pour personnaliser votre carte. Réception sous 7 jours." },
    { q: "Comment payer ?", a: "Paiement via Mobile Money (Orange Money, Wave, MTN). Contactez-nous sur WhatsApp au +225 05 76 03 12 12. Aucune carte bancaire requise." },
  ];

  const S = {
    page: { fontFamily: "'Sora',system-ui,sans-serif", background: '#04020e', color: '#fff', overflowX: 'hidden', minHeight: '100vh' },
    nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', background: 'rgba(4,2,14,.88)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(255,255,255,.06)' },
    navLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
    navIcon: { width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900', color: '#fff', flexShrink: 0, overflow: 'hidden' },
    navLinks: { display: 'flex', gap: '28px', fontSize: '13px', color: 'rgba(255,255,255,.5)' },
    navCta: { padding: '9px 22px', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', border: 'none', borderRadius: '100px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform .15s,box-shadow .15s' },
    hero: { minHeight: '100vh', padding: '100px 48px 80px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' },
    heroGrid: { maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '72px', alignItems: 'center' },
    heroBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,107,53,.1)', border: '1px solid rgba(255,107,53,.3)', borderRadius: '100px', padding: '6px 16px', fontSize: '12px', color: '#ff6b35', fontWeight: '700', marginBottom: '20px' },
    heroH1Big: { fontSize: '64px', fontWeight: '900', lineHeight: '1.0', letterSpacing: '-3px', display: 'block', background: 'linear-gradient(135deg,#ff6b35 0%,#f7c948 50%,#fff 100%)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
    heroTagline: { fontSize: '20px', fontWeight: '700', color: 'rgba(255,255,255,.9)', margin: '12px 0 14px', lineHeight: '1.3' },
    heroPitch: { fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: '1.8', marginBottom: '18px', maxWidth: '540px', padding: '14px 18px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '14px' },
    heroSub: { fontSize: '15px', color: 'rgba(255,255,255,.55)', lineHeight: '1.85', marginBottom: '24px', maxWidth: '520px' },
    heroCheck: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,.72)', marginBottom: '8px' },
    heroCheckDot: { width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', flexShrink: 0, color: '#fff', fontWeight: '800' },
    bpri: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 38px', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: '800', fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', transition: 'transform .2s,box-shadow .2s' },
    bsec: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 28px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '14px', color: 'rgba(255,255,255,.8)', fontWeight: '600', fontSize: '15px', textDecoration: 'none', transition: 'all .2s' },
    dashWrap: { position: 'relative', width: '100%' },
    dashGlow: { position: 'absolute', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,107,53,.22),transparent 70%)', filter: 'blur(55px)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' },
    dashFrame: { background: 'rgba(10,8,24,.97)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.04)' },
    dashTopbar: { height: '44px', background: 'rgba(4,2,16,.7)', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px' },
    dashDot: { width: '10px', height: '10px', borderRadius: '50%' },
    dashUrl: { flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: '6px', height: '22px', margin: '0 12px', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '10px', color: 'rgba(255,255,255,.35)' },
    dashBody: { display: 'grid', gridTemplateColumns: '52px 1fr', height: '340px' },
    dashSidebar: { background: 'rgba(6,4,18,.97)', borderRight: '1px solid rgba(255,255,255,.06)', padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' },
    dashNavIcon: { width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'pointer' },
    dashContent: { padding: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '11px' },
    miniCards: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '7px' },
    miniCard: { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '10px', textAlign: 'center' },
    sec: { padding: '100px 48px' },
    secInner: { maxWidth: '1400px', margin: '0 auto' },
    secHead: { textAlign: 'center', marginBottom: '64px' },
    secLabel: { display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '100px', padding: '6px 16px', fontSize: '12px', fontWeight: '700', marginBottom: '18px' },
    secTitle: { fontSize: '44px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '16px', lineHeight: '1.08' },
    secSub: { color: 'rgba(255,255,255,.45)', fontSize: '16px', maxWidth: '560px', margin: '0 auto', lineHeight: '1.75' },
    fcard: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '24px', padding: '30px', transition: 'all .25s' },
    ficon: { width: '54px', height: '54px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' },
    ctaOuter: { position: 'relative', overflow: 'hidden', borderRadius: '32px', padding: '80px 60px', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,107,53,.12) 0%,rgba(139,92,246,.1) 50%,rgba(247,201,72,.08) 100%)', border: '1px solid rgba(255,255,255,.1)', maxWidth: '900px', margin: '0 auto', boxShadow: '0 0 80px rgba(255,107,53,.15), 0 0 160px rgba(139,92,246,.08)' },
    faqItem: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden', marginBottom: '10px' },
    faqQ: { width: '100%', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: '16px' },
  };

  const GradText = ({ children, from = '#ff6b35', to = '#f7c948' }) => (
    <span style={{ background: `linear-gradient(135deg,${from},${to})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{children}</span>
  );

  const SectionLabel = ({ children, bg, border, color, dotBg }) => (
    <div style={{ ...S.secLabel, background: bg, border, color }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotBg, animation: 'sa-dot 1.5s infinite' }} />
      {children}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>SocialApp - Votre profil digital et CRM tout-en-un | Côte d'Ivoire</title>
        <meta name="description" content="SocialApp est une plateforme SaaS ivoirienne de profil digital intelligent. CRM, QR Code, Marketplace, Analytics temps réel. Pour professionnels, commerçants et créateurs. Dès 10 000 FCFA/an." />
        <meta name="keywords" content="profil digital Côte d'Ivoire, QR code business Abidjan, lien en bio, carte digitale, CRM leads, marketplace Côte d'Ivoire, CRM WhatsApp, analytics profil, événement, SocialApp, page de liens Afrique, carte NFC" />
        <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
        <link rel="canonical" href="https://www.socialapp.work/" />
        <meta name="theme-color" content="#ff6b35" />
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
          "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "SocialApp",
          "url": "https://www.socialapp.work", "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web", "inLanguage": "fr",
          "description": "Plateforme SaaS de profil digital tout-en-un avec QR code, CRM, marketplace et analytics pour entrepreneurs ivoiriens.",
          "areaServed": { "@type": "Country", "name": "Côte d'Ivoire" },
          "offers": [
            { "@type": "Offer", "name": "BASIC", "price": "10000", "priceCurrency": "XOF" },
            { "@type": "Offer", "name": "PRO", "price": "15000", "priceCurrency": "XOF" },
            { "@type": "Offer", "name": "BUSINESS", "price": "25000", "priceCurrency": "XOF" },
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Combien coûte SocialApp en Côte d'Ivoire ?", "acceptedAnswer": { "@type": "Answer", "text": "Les offres commencent à 10 000 FCFA/an (BASIC), 15 000 FCFA/an (PRO) et 25 000 FCFA/an (BUSINESS). Paiement Mobile Money." } },
            { "@type": "Question", "name": "Puis-je vendre mes produits sur SocialApp ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, marketplace intégrée avec 0% de commission. 4 produits (BASIC), 10 (PRO), illimités (BUSINESS)." } },
            { "@type": "Question", "name": "C'est quoi le CRM SocialApp ?", "acceptedAnswer": { "@type": "Answer", "text": "Gestion de leads avec tags, notes, pipeline et export CSV. Disponible avec l'offre BUSINESS." } },
          ]
        })}</script>
      </Helmet>

      <div style={S.page}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
          *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
          body{-webkit-font-smoothing:antialiased}
          @keyframes sa-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
          @keyframes sa-dot{0%,100%{opacity:1}50%{opacity:.3}}
          @keyframes sa-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,107,53,.5)}70%{box-shadow:0 0 0 18px rgba(255,107,53,0)}}
          @keyframes sa-glow{0%,100%{opacity:.7}50%{opacity:1}}
          @keyframes sa-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
          @keyframes sa-fadeup{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
          .sa-rv{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
          .sa-vis{opacity:1!important;transform:translateY(0)!important}
          .sa-d1{transition-delay:.08s}.sa-d2{transition-delay:.16s}.sa-d3{transition-delay:.24s}.sa-d4{transition-delay:.32s}
          .sa-float{animation:sa-float 5s ease-in-out infinite}
          .sa-pulse-btn{animation:sa-pulse 2.5s infinite}
          .sa-nav-link{color:rgba(255,255,255,.5);text-decoration:none;transition:color .2s;font-size:13px}
          .sa-nav-link:hover{color:#fff}
          .sa-bpri:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(255,107,53,.45)!important}
          .sa-bsec:hover{background:rgba(255,255,255,.1)!important;border-color:rgba(255,255,255,.3)!important}
          .sa-fcard:hover{transform:translateY(-6px);border-color:rgba(255,255,255,.16)!important;background:rgba(255,255,255,.07)!important}
          .sa-plan:hover{transform:translateY(-8px)}
          .sa-step:hover{transform:translateY(-6px);border-color:rgba(255,255,255,.16)!important}
          .sa-tcard:hover{transform:translateY(-4px);border-color:rgba(255,255,255,.15)!important}
          .sa-faq:hover{border-color:rgba(255,255,255,.14)!important}
          .sa-lead:hover{background:rgba(255,255,255,.07)!important}
          .sa-dash-icon.active{background:rgba(99,102,241,.25)}
          .sa-dash-icon:hover:not(.active){background:rgba(255,255,255,.06)}
          .sa-plan-pro::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.04) 50%,transparent 60%);transform:translateX(-100%);animation:sa-shimmer 3s infinite;border-radius:24px}
          .sa-ftag{display:inline-flex;align-items:center;gap:4px;margin-top:14px;padding:4px 10px;border-radius:100px;font-size:10px;font-weight:700}
          .sa-fbadge{position:absolute;background:rgba(10,8,24,.95);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 14px;box-shadow:0 16px 40px rgba(0,0,0,.5);backdrop-filter:blur(20px)}
          .sa-footer-link{color:rgba(255,255,255,.35);font-size:12px;text-decoration:none;transition:color .2s}
          .sa-footer-link:hover{color:rgba(255,255,255,.7)}
          @media(max-width:960px){
            .sa-hero-grid,.sa-twocol,.sa-plans,.sa-fg3,.sa-tgrid,.sa-steps{grid-template-columns:1fr!important}
            .sa-stats-grid{grid-template-columns:repeat(2,1fr)!important}
            .sa-hero-h1{font-size:40px!important;letter-spacing:-2px!important}
            .sa-nav-links{display:none!important}
            .sa-hero-sec{padding:100px 20px 60px!important}
            .sa-sec{padding:70px 20px!important}
            .sa-dash-mockup{margin-top:48px!important}
            .sa-fbadge{display:none!important}
            .sa-cta-outer{padding:48px 24px!important}
            .sa-nav-brand-text{display:none!important}
            .sa-nav-cta{padding:7px 16px!important;font-size:12px!important}
            .sa-mockup-overflow{width:100%!important;max-width:100%!important}
            .sa-footer-top{flex-direction:column!important;align-items:center!important;text-align:center!important}
            .sa-footer-legal{flex-direction:column!important;text-align:center!important;gap:14px!important}
            .sa-footer-legal-links{flex-direction:column!important;gap:10px!important}
            .sa-footer-legal-links .sa-footer-dot{display:none!important}
          }
          @media(max-width:480px){
            .sa-dash-mockup .sa-dash-body{grid-template-columns:44px 1fr!important;height:auto!important}
            .sa-dash-mockup .sa-mini-cards{grid-template-columns:repeat(2,1fr)!important}
          }
        `}</style>

        {/* ── Modal sélection d'offre ── */}
        {showPlanModal && (<PlanModal onClose={() => setShowPlanModal(false)} onSelect={handlePlanSelect} />)}

        {/* ════════════ NAV ════════════ */}
        <nav style={S.nav}>
          <div style={S.navLogo}>
            <div style={S.navIcon}><img src={logo} alt="SocialApp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
            <span className="sa-nav-brand-text" style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-.5px' }}>SocialApp</span>
          </div>
          <div className="sa-nav-links" style={S.navLinks}>
            {[['#features', 'Fonctionnalités'], ['#crm', 'CRM'], ['#marketplace', 'Boutique'], ['#event', 'Événement'], ['#pricing', 'Tarifs'], ['#faq', 'FAQ']].map(([h, l]) => (<a key={h} href={h} className="sa-nav-link">{l}</a>))}
          </div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button type="button" style={S.navCta} className="sa-bpri sa-nav-cta" onClick={handleCTA}>Commencer →</button>
          </div>
        </nav>

        {/* ════════════ HERO ════════════ */}
        <section style={{ ...S.hero }} className="sa-hero-sec">
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%,rgba(255,107,53,.14),transparent),radial-gradient(ellipse 50% 40% at 80% 60%,rgba(168,85,247,.09),transparent),radial-gradient(ellipse 40% 30% at 10% 80%,rgba(59,130,246,.07),transparent)', pointerEvents: 'none' }} />

          <div style={{ ...S.heroGrid, maxWidth: '1400px' }} className="sa-hero-grid">
            {/* ── LEFT ── */}
            <div style={{ animation: 'sa-fadeup .9s ease both' }}>
              <div style={S.heroBadge}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff6b35', animation: 'sa-dot 2s infinite' }} />
                Fait pour la Côte d'Ivoire 🇨🇮
              </div>
              <h1>
                <span style={S.heroH1Big} className="sa-hero-h1">Votre profil digital</span>
                <span style={{ ...S.heroH1Big, background: 'linear-gradient(135deg,#a78bfa 0%,#ff6b35 50%,#f7c948 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }} className="sa-hero-h1">et CRM tout-en-un.</span>
              </h1>
              <div style={S.heroPitch}>
                SocialApp est une plateforme tout-en-un qui permet aux entrepreneurs, entreprises, commerciaux et créateurs de contenu de créer un profil professionnel digital, <strong style={{ color: 'rgba(255,255,255,.85)' }}>partager leurs contacts via QR Code,</strong> collecter des prospects et gérer leurs relations clients grâce à un CRM intégré.
              </div>
              <p style={S.heroTagline}>Transformez chaque scan en contact,<br />client ou opportunité.</p>
              <div style={{ marginBottom: '32px' }}>
                {[
                  'Créez votre profil professionnel en quelques minutes',
                  'Partagez vos coordonnées, réseaux sociaux et services via un QR Code unique',
                  'Collectez automatiquement les contacts et prospects intéressés',
                  'Gérez vos clients et opportunités avec un CRM intégré',
                  'Suivez vos statistiques, visites, clics et performances en temps réel',
                ].map((t, i) => (
                  <div key={i} style={S.heroCheck}>
                    <div style={S.heroCheckDot}>✓</div>
                    {t}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
                <button type="button" style={S.bpri} className="sa-bpri sa-pulse-btn" onClick={handleCTA}>
                  {user ? 'Mon tableau de bord →' : 'Créer mon profil gratuitement →'}
                </button>
                <a href="#features" style={S.bsec} className="sa-bsec">Voir les fonctionnalités</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {['#ff6b35', '#a78bfa', '#22c55e', '#f7c948', '#0ea5e9'].map((c, i) => (
                    <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg,${c},${c}99)`, border: '2px solid #04020e', marginLeft: i === 0 ? 0 : '-10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#fff', zIndex: 5 - i, position: 'relative', flexShrink: 0 }}>
                      {['K', 'D', 'J', 'A', 'M'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>+500 utilisateurs</span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>sur SocialApp</span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                    {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#f7c948', fontSize: '12px' }}>★</span>)}
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', marginLeft: '4px' }}>4.9/5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Dashboard mockup ── */}
            <div style={S.dashWrap} className="sa-dash-mockup">
              <div style={S.dashGlow} />
              <div className="sa-fbadge" style={{ top: '-18px', right: '-18px', animation: 'sa-float 4s ease-in-out infinite .5s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(34,197,94,.2)', border: '1px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>👤</div>
                  <div><div style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>Nouveau lead !</div><div style={{ fontSize: '10px', color: 'rgba(255,255,255,.4)' }}>Kofi M. · via QR Code</div></div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', marginLeft: '6px', animation: 'sa-dot 1.5s infinite' }} />
                </div>
              </div>
              <div className="sa-fbadge" style={{ top: '50%', right: '-28px', transform: 'translateY(-50%)', animation: 'sa-float 5s ease-in-out infinite .8s' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.5)', marginBottom: '2px' }}>Vues aujourd'hui</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#ff6b35' }}>+247</div>
                  <div style={{ fontSize: '10px', color: '#22c55e', fontWeight: '600' }}>↑ 34% vs hier</div>
                </div>
              </div>
              <div className="sa-fbadge" style={{ bottom: '-14px', left: '-18px', animation: 'sa-float 4.5s ease-in-out infinite 1.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🛍️</span>
                  <div><div style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>Commande WhatsApp</div><div style={{ fontSize: '10px', color: 'rgba(255,255,255,.4)' }}>Robe Ankara · 8 500 FCFA</div></div>
                </div>
              </div>
              <div style={S.dashFrame} className="sa-float">
                <div style={S.dashTopbar}>
                  <div style={{ ...S.dashDot, background: '#ef4444' }} /><div style={{ ...S.dashDot, background: '#f59e0b' }} /><div style={{ ...S.dashDot, background: '#22c55e' }} />
                  <div style={S.dashUrl}>🔒 socialapp.work/dashboard</div>
                  <div style={{ display: 'flex', gap: '4px' }}><div style={{ width: '18px', height: '12px', background: 'rgba(255,255,255,.1)', borderRadius: '3px' }} /><div style={{ width: '18px', height: '12px', background: 'rgba(255,255,255,.1)', borderRadius: '3px' }} /></div>
                </div>
                <div style={S.dashBody} className="sa-dash-body">
                  <div style={S.dashSidebar}>
                    {[['📊', true], ['📈', false], ['🔴', false], ['👥', false], ['🛍️', false], ['🎉', false], ['📄', false]].map(([icon, active], i) => (<div key={i} style={{ ...S.dashNavIcon, background: active ? 'rgba(99,102,241,.25)' : 'transparent' }} className="sa-dash-icon">{icon}</div>))}
                    <div style={{ flex: 1 }} /><div style={S.dashNavIcon} className="sa-dash-icon">⚙️</div>
                  </div>
                  <div style={S.dashContent}>
                    <div><div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>Dashboard</div><div style={{ fontSize: '9px', color: 'rgba(255,255,255,.35)' }}>Bienvenue · Dorine Fashion</div></div>
                    <div style={S.miniCards} className="sa-mini-cards">
                      {[['450', '#6366f1', 'Vues'], ['89', '#f59e0b', 'Clics'], ['22%', '#22c55e', 'CTR'], ['12', '#ec4899', 'Leads']].map(([v, c, l]) => (<div key={l} style={S.miniCard}><div style={{ fontSize: '18px', fontWeight: '900', color: c, lineHeight: 1 }}>{v}</div><div style={{ fontSize: '8px', color: 'rgba(255,255,255,.4)', marginTop: '3px' }}>{l}</div></div>))}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '10px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,.5)', marginBottom: '8px' }}>🌍 Top pays</div>
                      {[['🇨🇮 CI', '85%', '#6366f1,#a78bfa'], ['🇫🇷 FR', '40%', '#0ea5e9,#6366f1'], ['🇸🇳 SN', '25%', '#0ea5e9,#6366f1']].map(([l, w, g]) => (<div key={l} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}><div style={{ fontSize: '9px', color: 'rgba(255,255,255,.4)', width: '36px' }}>{l}</div><div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,.07)', borderRadius: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: w, background: `linear-gradient(90deg,${g})`, borderRadius: '3px' }} /></div></div>))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'sa-dot 1.5s infinite', flexShrink: 0 }} />
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#22c55e' }}>3 visiteurs en direct</div>
                      <div style={{ marginLeft: 'auto', fontSize: '9px', color: 'rgba(255,255,255,.3)' }}>🇨🇮 🇫🇷 🇧🇯</div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {[['4 Prospects', 'rgba(99,102,241,.15)', 'rgba(99,102,241,.3)', '#a78bfa'], ['2 Chauds 🔥', 'rgba(239,68,68,.15)', 'rgba(239,68,68,.3)', '#f87171'], ['6 Clients ✅', 'rgba(34,197,94,.15)', 'rgba(34,197,94,.3)', '#4ade80']].map(([l, bg, bd, c]) => (<div key={l} style={{ padding: '4px 8px', borderRadius: '7px', background: bg, border: `1px solid ${bd}`, color: c, fontSize: '9px', fontWeight: '700' }}>{l}</div>))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════ STATS ════════════ */}
        <div style={{ padding: '48px 48px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.01)' }}>
          <div className="sa-stats-grid sa-rv" style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '32px', textAlign: 'center' }}>
            {[['+30%', 'gt', 'de followers en plus'], ['1 scan', 'gt', 'pour tout partager'], ['∞', 'gt-gr', 'produits avec Business'], ['100%', 'gt-pu', 'personnalisable']].map(([v, cls, l]) => (
              <div key={l}>
                <div style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', lineHeight: 1, background: cls === 'gt' ? 'linear-gradient(135deg,#ff6b35,#f7c948)' : cls === 'gt-gr' ? 'linear-gradient(135deg,#22c55e,#86efac)' : 'linear-gradient(135deg,#a855f7,#d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{v}</div>
                <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px', marginTop: '8px' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════ FEATURES ════════════ */}
        <section id="features" style={{ ...S.sec }} className="sa-sec">
          <div style={S.secInner}>
            <div style={S.secHead} className="sa-rv">
              <SectionLabel bg="rgba(99,102,241,.1)" border="1px solid rgba(99,102,241,.3)" color="#a78bfa" dotBg="#a78bfa">Plateforme tout-en-un</SectionLabel>
              <h2 style={S.secTitle}>Tout ce dont vous avez besoin<br /><GradText>depuis une seule plateforme</GradText></h2>
              <p style={S.secSub}>Dashboard complet, analytics temps réel, CRM, automatisations — conçu pour les entrepreneurs ivoiriens.</p>
            </div>
            <div className="sa-fg3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
              {[
                { icon: '🔗', bg: 'rgba(99,102,241,.15)', title: 'Page de liens personnalisée', desc: 'WhatsApp, Instagram, TikTok, Facebook, YouTube sur une seule page avec username personnalisé et badge vérifié.', tag: '✓ Toutes les offres', tagBg: 'rgba(99,102,241,.15)', tagBd: 'rgba(99,102,241,.3)', tagC: '#a78bfa' },
                { icon: '📊', bg: 'rgba(34,197,94,.15)', title: 'Analytics & Temps réel', desc: "Vues, clics par lien, pays des visiteurs, flux live. Sachez exactement qui scanne votre QR code et d'où.", tag: '🚀 PRO & BUSINESS', tagBg: 'rgba(255,107,53,.15)', tagBd: 'rgba(255,107,53,.3)', tagC: '#ff6b35' },
                { icon: '🛍️', bg: 'rgba(245,158,11,.15)', title: 'Marketplace intégrée', desc: 'Photos, prix barrés, badges promo. Vos clients commandent sur WhatsApp. Zéro commission sur vos ventes.', tag: '✓ Toutes les offres', tagBg: 'rgba(34,197,94,.15)', tagBd: 'rgba(34,197,94,.3)', tagC: '#22c55e' },
                { icon: '👥', bg: 'rgba(236,72,153,.15)', title: 'CRM & Pipeline de leads', desc: 'Capturez, tagguez et suivez vos prospects. Pipeline avec statuts Prospect, Chaud, Client. Export CSV.', tag: '💼 BUSINESS', tagBg: 'rgba(247,201,72,.15)', tagBd: 'rgba(247,201,72,.3)', tagC: '#f7c948' },
                { icon: '🎉', bg: 'rgba(255,107,53,.15)', title: 'Mode Événement', desc: 'Compte à rebours live, galerie photos & vidéos (50 Mo), bouton réservation. Parfait pour soirées et concerts.', tag: '🚀 PRO & BUSINESS', tagBg: 'rgba(255,107,53,.15)', tagBd: 'rgba(255,107,53,.3)', tagC: '#ff6b35' },
                { icon: '📅', bg: 'rgba(93,202,165,.15)', title: 'Calendrier de réservation', desc: 'Vos clients réservent un créneau ou une place directement depuis votre profil public, sans échange de messages.', tag: '🚀 PRO & BUSINESS', tagBg: 'rgba(255,107,53,.15)', tagBd: 'rgba(255,107,53,.3)', tagC: '#ff6b35' },
                { icon: '📝', bg: 'rgba(59,130,246,.15)', title: 'Formulaires personnalisés', desc: 'Créez des formulaires sur mesure (contact, devis, inscription) et recevez les réponses directement dans votre dashboard.', tag: '🚀 PRO & BUSINESS', tagBg: 'rgba(255,107,53,.15)', tagBd: 'rgba(255,107,53,.3)', tagC: '#ff6b35' },
                { icon: '🤖', bg: 'rgba(37,211,102,.15)', title: 'Campagnes WhatsApp IA', desc: "Décrivez votre offre, l'IA génère vos messages de campagne (promo, relance, nouveauté) prêts à envoyer.", tag: '💼 BUSINESS', tagBg: 'rgba(247,201,72,.15)', tagBd: 'rgba(247,201,72,.3)', tagC: '#f7c948' },
                { icon: '⚡', bg: 'rgba(139,92,246,.15)', title: 'Automatisations & Intégrations', desc: 'Automatisez vos réponses, connectez vos outils. Webhooks, notifications push, flux temps réel.', tag: '💼 BUSINESS', tagBg: 'rgba(247,201,72,.15)', tagBd: 'rgba(247,201,72,.3)', tagC: '#f7c948' },
              ].map((f, i) => (
                <div key={i} style={S.fcard} className={`sa-fcard sa-rv sa-d${(i % 4) + 1}`}>
                  <div style={{ ...S.ficon, background: f.bg }}>{f.icon}</div>
                  <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '10px' }}>{f.title}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', lineHeight: '1.75' }}>{f.desc}</div>
                  <div className="sa-ftag" style={{ background: f.tagBg, border: `1px solid ${f.tagBd}`, color: f.tagC }}>{f.tag}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════ CRM ════════════ */}
        <section id="crm" style={{ ...S.sec, background: 'linear-gradient(135deg,rgba(236,72,153,.05),rgba(99,102,241,.04))', borderTop: '1px solid rgba(236,72,153,.1)', borderBottom: '1px solid rgba(236,72,153,.1)' }} className="sa-sec">
          <div style={S.secInner}>
            <div className="sa-twocol sa-rv" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <picture>
                  <source srcSet={leadsCrmMockupWebp} type="image/webp" />
                  <img src={leadsCrmMockup} alt="Leads & CRM SocialApp" loading="lazy" className="sa-float sa-mockup-overflow" style={{ width: '110%', maxWidth: '700px', objectFit: 'contain', filter: 'drop-shadow(0 40px 80px rgba(236,72,153,.25))' }} />
                </picture>
              </div>
              <div>
                <SectionLabel bg="rgba(236,72,153,.1)" border="1px solid rgba(236,72,153,.3)" color="#f472b6" dotBg="#f472b6">CRM intégré</SectionLabel>
                <h2 style={S.secTitle}>Transformez vos visiteurs<br />en <GradText>clients fidèles</GradText></h2>
                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.55)', lineHeight: '1.85', marginBottom: '28px' }}>Chaque scan de votre QR code est une opportunité. Capturez vos leads, suivez leur parcours et concluez plus de ventes — tout depuis votre dashboard.</p>
                {[
                  { icon: '🏷️', bg: 'rgba(236,72,153,.1)', bd: 'rgba(236,72,153,.2)', title: 'Tags intelligents', desc: 'Prospect, Chaud, Client, Froid, Perdu. Filtrez et agissez en priorité.' },
                  { icon: '📋', bg: 'rgba(99,102,241,.1)', bd: 'rgba(99,102,241,.2)', title: 'Notes & historique', desc: 'Ajoutez des notes sur chaque contact. Gardez le contexte de vos échanges.' },
                  { icon: '📥', bg: 'rgba(34,197,94,.1)', bd: 'rgba(34,197,94,.2)', title: 'Export CSV', desc: 'Exportez tous vos leads en un clic. Compatible Excel & Google Sheets.' },
                ].map((f, i) => (<div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}><div style={{ width: '40px', height: '40px', borderRadius: '12px', background: f.bg, border: `1px solid ${f.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{f.icon}</div><div><div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{f.title}</div><div style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', lineHeight: '1.6' }}>{f.desc}</div></div></div>))}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(247,201,72,.12)', border: '1px solid rgba(247,201,72,.3)', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', color: '#f7c948', fontWeight: '600' }}>💼 Disponible avec l'offre BUSINESS</div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════ ANALYTICS ════════════ */}
        <section id="analytics" style={{ ...S.sec, background: 'linear-gradient(135deg,rgba(99,102,241,.05),rgba(14,165,233,.04))', borderTop: '1px solid rgba(99,102,241,.1)', borderBottom: '1px solid rgba(99,102,241,.1)' }} className="sa-sec">
          <div style={S.secInner}>
            <div className="sa-twocol sa-rv" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
              <div>
                <SectionLabel bg="rgba(99,102,241,.1)" border="1px solid rgba(99,102,241,.3)" color="#a78bfa" dotBg="#a78bfa">Analytics avancés</SectionLabel>
                <h2 style={S.secTitle}>Analysez chaque<br />interaction <GradText>en temps réel</GradText></h2>
                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.55)', lineHeight: '1.85', marginBottom: '28px' }}>Sachez exactement qui visite votre profil, d'où ils viennent et sur quels liens ils cliquent. Des données actionnables pour optimiser votre présence digitale.</p>
                {[
                  { icon: '🌍', bg: 'rgba(99,102,241,.12)', bd: 'rgba(99,102,241,.25)', title: 'Statistiques géographiques', desc: "Visualisez d'où viennent vos visiteurs, pays par pays." },
                  { icon: '🔴', bg: 'rgba(34,197,94,.12)', bd: 'rgba(34,197,94,.25)', title: 'Flux visiteurs en direct', desc: 'Voir qui est sur votre page maintenant, en temps réel.' },
                  { icon: '📊', bg: 'rgba(245,158,11,.12)', bd: 'rgba(245,158,11,.25)', title: 'Top liens & taux de clic', desc: 'Identifiez vos liens les plus performants.' },
                ].map((f, i) => (<div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}><div style={{ width: '40px', height: '40px', borderRadius: '12px', background: f.bg, border: `1px solid ${f.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{f.icon}</div><div><div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{f.title}</div><div style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', lineHeight: '1.6' }}>{f.desc}</div></div></div>))}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,107,53,.12)', border: '1px solid rgba(255,107,53,.3)', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', color: '#ff6b35', fontWeight: '600' }}>🚀 Disponible avec PRO & BUSINESS</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <picture>
                  <source srcSet={tempsReelMockupWebp} type="image/webp" />
                  <img src={tempsReelMockup} alt="Analytics temps réel SocialApp" loading="lazy" className="sa-float sa-mockup-overflow" style={{ width: '120%', maxWidth: '700px', objectFit: 'contain', filter: 'drop-shadow(0 40px 80px rgba(99,102,241,.3))' }} />
                </picture>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════ MARKETPLACE ════════════ */}
        <section id="marketplace" style={{ ...S.sec, background: 'linear-gradient(180deg,rgba(255,107,53,.04) 0%,transparent 100%)', borderTop: '1px solid rgba(255,107,53,.1)', borderBottom: '1px solid rgba(255,107,53,.1)' }} className="sa-sec">
          <div style={S.secInner}>
            <div style={S.secHead} className="sa-rv">
              <SectionLabel bg="rgba(255,107,53,.1)" border="1px solid rgba(255,107,53,.3)" color="#ff6b35" dotBg="#ff6b35">Marketplace 🔥</SectionLabel>
              <h2 style={S.secTitle}>Votre boutique directement<br />sur votre <GradText>profil public</GradText></h2>
              <p style={S.secSub}>Vendez sans créer un site web. Photos, prix barrés, badges promo. Vos clients commandent sur WhatsApp. Zéro commission.</p>
            </div>
            <div className="sa-twocol" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <picture>
                  <source srcSet={marketplaceMockupWebp} type="image/webp" />
                  <img src={marketplaceMockup} alt="Boutique SocialApp sur mobile" loading="lazy" className="sa-float" style={{ width: '320px', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 40px 80px rgba(255,107,53,.28))', borderRadius: '32px' }} />
                </picture>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {[
                  { icon: '📸', bg: 'rgba(255,107,53,.1)', bd: 'rgba(255,107,53,.2)', title: 'Photos, prix & badges promotionnels', desc: 'Prix barrés, réductions en %, badge disponible/épuisé.' },
                  { icon: '💰', bg: 'rgba(34,197,94,.1)', bd: 'rgba(34,197,94,.2)', title: 'Zéro commission — toujours', desc: '100% de vos ventes vous reviennent. SocialApp ne prend rien.' },
                  { icon: '📱', bg: 'rgba(37,211,102,.1)', bd: 'rgba(37,211,102,.2)', title: 'Commandes directes sur WhatsApp', desc: 'Bouton de contact direct. Votre client vous écrit en 1 tap.' },
                  { icon: '📄', bg: 'rgba(245,158,11,.1)', bd: 'rgba(245,158,11,.2)', title: 'Documents PDF joints', desc: 'Menus, catalogues, brochures — accessibles sur votre profil.' },
                ].map((f, i) => (<div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}><div style={{ width: '42px', height: '42px', borderRadius: '12px', background: f.bg, border: `1px solid ${f.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{f.icon}</div><div><div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{f.title}</div><div style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', lineHeight: '1.6' }}>{f.desc}</div></div></div>))}
                <button type="button" style={{ ...S.bpri, width: 'fit-content', animation: 'none' }} className="sa-bpri" onClick={handleCTA}>Ouvrir ma boutique →</button>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════ ÉVÉNEMENT ════════════ */}
        <section id="event" style={S.sec} className="sa-sec">
          <div style={S.secInner}>
            <div className="sa-twocol" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
              <div>
                <SectionLabel bg="rgba(34,197,94,.1)" border="1px solid rgba(34,197,94,.3)" color="#22c55e" dotBg="#22c55e">Soirées & Concerts</SectionLabel>
                <h2 style={S.secTitle}>Mode <GradText>Événement</GradText></h2>
                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.55)', lineHeight: '1.85', marginBottom: '28px' }}>Transformez votre profil en page d'événement en 2 minutes. Compte à rebours live, galerie médias, réservation en ligne.</p>
                {[
                  { icon: '⏱', bg: 'rgba(34,197,94,.15)', title: 'Compte à rebours en direct', desc: 'Jours, heures, minutes, secondes — en temps réel.' },
                  { icon: '📸', bg: 'rgba(255,107,53,.15)', title: 'Galerie photos & vidéos', desc: "Carrousel jusqu'à 50 Mo pour présenter l'ambiance." },
                  { icon: '🎟', bg: 'rgba(247,201,72,.15)', title: 'Bouton de réservation', desc: 'Redirigez vers votre lien de paiement ou de billets.' },
                  { icon: '🎨', bg: 'rgba(139,92,246,.15)', title: 'Couleurs personnalisables', desc: "Sunset, Océan, Rose, Forêt — adaptez l'ambiance." },
                ].map((f, i) => (<div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}><div style={{ width: '38px', height: '38px', borderRadius: '10px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{f.icon}</div><div><div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '3px' }}>{f.title}</div><div style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>{f.desc}</div></div></div>))}
                <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: '14px', padding: '16px 20px', marginTop: '8px' }}>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#22c55e' }}>5 000 FCFA</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', marginTop: '4px' }}>par événement · Ou inclus dès l'offre PRO</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <picture>
                  <source srcSet={eventMockupWebp} type="image/webp" />
                  <img src={eventMockup} alt="Mode Événement SocialApp" loading="lazy" className="sa-float" style={{ width: '320px', maxWidth: '100%', borderRadius: '24px', boxShadow: '0 40px 80px rgba(0,0,0,.5)', objectFit: 'contain', animationDuration: '5.5s' }} />
                </picture>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════ OFFRES ════════════ */}
        <section id="pricing" style={{ ...S.sec, background: 'rgba(255,255,255,.01)' }} className="sa-sec">
          <div style={S.secInner}>
            <div style={S.secHead} className="sa-rv">
              <h2 style={S.secTitle}>Des prix faits pour <GradText>l'Afrique</GradText></h2>
              <p style={S.secSub}>Paiement Mobile Money · Pas de carte bancaire nécessaire</p>
            </div>
            <div className="sa-plans sa-rv" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '22px', alignItems: 'start', paddingTop: '16px' }}>
              {plans.map((p, i) => (
                <div key={i} className={`sa-plan${p.popular ? ' sa-plan-pro' : ''}`} style={{ borderRadius: '26px', padding: p.popular ? '44px 32px 32px' : '32px', position: 'relative', background: p.bg, border: p.border, transition: 'transform .25s,box-shadow .25s', overflow: 'visible', marginTop: p.popular ? '14px' : '0' }}>
                  {p.popular && (<div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', borderRadius: '100px', padding: '6px 20px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', color: '#fff', boxShadow: '0 4px 16px rgba(255,107,53,.4)', zIndex: 2 }}>⭐ Plus populaire</div>)}
                  <div style={{ fontSize: '11px', fontWeight: '700', color: p.color, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '16px' }}>{p.emoji} {p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '6px' }}><span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '-1.5px' }}>{p.price}</span><span style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)' }}>FCFA</span></div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.35)', marginBottom: '8px' }}>/ Paiement annuel</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)', lineHeight: '1.55', marginBottom: '22px', minHeight: '36px' }}>{p.subtitle}</div>
                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,.08)', marginBottom: '20px' }} />
                  {p.features.map((f, j) => (<div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,.75)' }}><span style={{ color: p.color, flexShrink: 0 }}>✓</span><span>{f}</span></div>))}
                  <button type="button" onClick={() => handlePlanSelect(p.name.toLowerCase())} style={{ display: 'block', width: '100%', padding: '14px', border: p.btnBorder, borderRadius: '14px', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', background: p.btnBg, marginTop: '8px', transition: 'transform .2s,box-shadow .2s' }}>Choisir {p.name} →</button>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '13px', marginTop: '24px' }} className="sa-rv">💬 Questions ? WhatsApp <strong style={{ color: 'rgba(255,255,255,.6)' }}>+225 05 76 03 12 12</strong></p>
          </div>
        </section>

        {/* ════════════ COMMENT ÇA MARCHE ════════════ */}
        <section id="how" style={{ ...S.sec, background: 'rgba(255,255,255,.01)' }} className="sa-sec">
          <div style={S.secInner}>
            <div style={S.secHead} className="sa-rv">
              <h2 style={S.secTitle}>Prêt en <GradText>5 minutes</GradText></h2>
              <p style={S.secSub}>Créez votre profil digital complet en quelques étapes simples.</p>
            </div>
            <div className="sa-steps sa-rv" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
              {[
                { icon: '👤', n: '1', title: 'Créez votre profil', desc: 'Nom, photo, bio, vos liens sociaux. En 5 minutes votre vitrine est prête.' },
                { icon: '🛍️', n: '2', title: 'Ajoutez vos produits', desc: 'Photos, prix, descriptions. Votre boutique est visible directement sur votre page.' },
                { icon: '📲', n: '3', title: 'Partagez votre QR code', desc: 'Sur vos flyers, cartes de visite, vitrine. Un scan et vos clients trouvent tout.' },
              ].map((s, i) => (<div key={i} className={`sa-step sa-d${i + 1}`} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '24px', padding: '32px', textAlign: 'center', transition: 'all .25s', cursor: 'default' }}><div style={{ fontSize: '36px', marginBottom: '14px' }}>{s.icon}</div><div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900', margin: '0 auto 18px' }}>{s.n}</div><h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>{s.title}</h3><p style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: '1.7' }}>{s.desc}</p></div>))}
            </div>
          </div>
        </section>

        {/* ════════════ TÉMOIGNAGES ════════════ */}
        <section style={S.sec} className="sa-sec">
          <div style={S.secInner}>
            <div style={S.secHead} className="sa-rv">
              <h2 style={S.secTitle}>Ils utilisent déjà <GradText>SocialApp</GradText></h2>
              <p style={S.secSub}>Ce qu'ils en disent</p>
            </div>
            <div className="sa-tgrid sa-rv" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '22px' }}>
              {[
                { init: 'K', name: 'Koffi Mensah', role: 'Influenceur · Abidjan', text: '"Depuis que j\'utilise SocialApp, mes abonnés Instagram ont augmenté de 40% en 2 mois. Les analytics me montrent d\'où viennent mes visiteurs. Indispensable !"' },
                { init: 'D', name: 'Dorine Ouattara', role: 'Commerçante · Cocody', text: '"Mes clients scannent mon QR code, voient mes produits et me contactent sur WhatsApp. Le CRM m\'aide à suivre mes prospects. Mon business a vraiment décollé !"' },
                { init: 'J', name: 'Jean-Baptiste K.', role: 'Organisateur · Plateau', text: '"J\'ai organisé ma soirée avec le mode Événement. Le compte à rebours et la réservation ont boosté mes ventes de billets de 60%. Je recommande !"' },
              ].map((t, i) => (<div key={i} className={`sa-tcard sa-d${i + 1}`} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '24px', padding: '28px', transition: 'all .2s' }}><div style={{ color: '#f7c948', fontSize: '18px', letterSpacing: '3px', marginBottom: '14px' }}>★★★★★</div><p style={{ color: 'rgba(255,255,255,.7)', fontSize: '14px', lineHeight: '1.8', marginBottom: '18px', fontStyle: 'italic' }}>{t.text}</p><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0, color: '#fff' }}>{t.init}</div><div><div style={{ fontWeight: '700', fontSize: '14px' }}>{t.name}</div><div style={{ color: 'rgba(255,255,255,.4)', fontSize: '12px' }}>{t.role}</div></div></div></div>))}
            </div>
          </div>
        </section>

        {/* ════════════ CTA FINAL ════════════ */}
        <section style={{ padding: '60px 48px' }} className="sa-sec">
          <div style={S.ctaOuter} className="sa-cta-outer sa-rv">
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,107,53,.12)', filter: 'blur(60px)', animation: 'sa-glow 3s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(139,92,246,.1)', filter: 'blur(60px)', animation: 'sa-glow 3s ease-in-out infinite .8s', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(247,201,72,.05)', filter: 'blur(80px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {['#ff6b35', '#a78bfa', '#22c55e', '#f7c948', '#0ea5e9'].map((c, i) => (<div key={i} style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg,${c},${c}99)`, border: '2.5px solid rgba(10,8,24,.9)', marginLeft: i === 0 ? 0 : '-10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#fff', zIndex: 5 - i, position: 'relative', flexShrink: 0 }}>{['K', 'D', 'J', 'A', 'M'][i]}</div>))}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>+500 utilisateurs sur SocialApp</div>
                  <div style={{ display: 'flex', gap: '2px', marginTop: '4px', alignItems: 'center' }}>
                    {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#f7c948', fontSize: '13px' }}>★</span>)}
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)', marginLeft: '5px' }}>4.9/5</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '52px', marginBottom: '24px' }}>🚀</div>
              <h2 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '16px', lineHeight: '1.08' }}>
                Prêt à transformer votre<br /><GradText>présence digitale ?</GradText>
              </h2>
              <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '18px', lineHeight: '1.85', marginBottom: '40px', maxWidth: '560px', margin: '0 auto 40px' }}>
                Rejoignez des centaines d'entrepreneurs ivoiriens qui utilisent SocialApp pour partager leurs réseaux, vendre leurs produits et gérer leurs leads.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                <button type="button" style={{ ...S.bpri, fontSize: '17px', padding: '18px 48px' }} className="sa-bpri sa-pulse-btn" onClick={handleCTA}>
                  {user ? 'Accéder à mon dashboard →' : 'Créer mon profil gratuitement →'}
                </button>
                <a href="#pricing" style={{ ...S.bsec, fontSize: '15px', padding: '17px 32px' }} className="sa-bsec">Voir les offres</a>
              </div>
              <p style={{ color: 'rgba(255,255,255,.35)', fontSize: '13px', marginTop: '12px' }}>Paiement Mobile Money · Wave · Orange Money</p>
            </div>
          </div>
        </section>

        {/* ════════════ FAQ ════════════ */}
        <section id="faq" style={{ padding: '80px 48px' }} className="sa-sec">
          <div style={{ maxWidth: '740px', margin: '0 auto' }}>
            <div style={{ ...S.secHead, marginBottom: '48px' }} className="sa-rv">
              <h2 style={S.secTitle}>Questions <GradText>fréquentes</GradText></h2>
            </div>
            <div className="sa-rv">
              {faqs.map((f, i) => (
                <div key={i} style={S.faqItem} className="sa-faq">
                  <button type="button" aria-expanded={openFaq === i} style={S.faqQ} onClick={() => setOpenFaq(prev => prev === i ? null : i)}>
                    {f.q}
                    <span style={{ fontSize: '20px', flexShrink: 0, color: '#ff6b35', transition: 'transform .3s', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)', display: 'inline-block' }}>+</span>
                  </button>
                  {openFaq === i && (<div style={{ padding: '0 22px 18px', color: 'rgba(255,255,255,.55)', fontSize: '14px', lineHeight: '1.8' }}>{f.a}</div>)}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════ FOOTER ════════════ */}
        <footer style={{ padding: '40px 48px 28px', borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.25)' }}>
          {/* Ligne logo + liens */}
          <div className="sa-footer-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ ...S.navIcon, width: '30px', height: '30px', borderRadius: '8px', fontSize: '14px' }}>
                <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontWeight: '800', fontSize: '16px' }}>SocialApp</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', background: 'rgba(37,211,102,.1)', border: '1px solid rgba(37,211,102,.3)', borderRadius: '100px', color: '#25D366', fontWeight: '600', fontSize: '13px', textDecoration: 'none' }}>WhatsApp</a>
              <button type="button" onClick={handleCTA} style={{ padding: '10px 20px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '100px', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>{user ? 'Mon dashboard' : 'Se connecter'}</button>
            </div>
          </div>

          {/* À propos mini */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: '20px', marginBottom: '20px' }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', lineHeight: '1.8', maxWidth: '780px' }}>
              <strong style={{ color: 'rgba(255, 255, 255, 0.85)' }}>À propos de SocialApp</strong> — Plateforme SaaS développée en Côte d'Ivoire 🇨🇮 qui aide les professionnels et entreprises à créer un profil digital public, gérer leurs prospects, suivre leurs statistiques et développer leur activité grâce à des outils CRM, QR Codes et automatisations intégrés. Données sécurisées · Mobile Money accepté · Mis en ligne en 5 min · Accessible partout en Afrique.
            </p>
          </div>

          {/* Ligne légale */}
          <div className="sa-footer-legal" style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '12px' }}>© 2026 SocialApp · Tous droits réservés · Côte d'Ivoire 🇨🇮</p>
            <div className="sa-footer-legal-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <a href="/privacy-policy" className="sa-footer-link">Politique de confidentialité</a>
              <span className="sa-footer-dot" style={{ color: 'rgba(255,255,255,.15)', fontSize: '12px' }}>·</span>
              <a href="/terms-of-service" className="sa-footer-link">Conditions d'utilisation</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}