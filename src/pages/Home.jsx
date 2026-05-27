import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Helmet } from "react-helmet-async"; // ✅ FIX 8 : migré de react-helmet vers react-helmet-async (react-helmet n'est plus maintenu)
import logo from '../assets/Logo_SocialApp.png';
import eventMockup from '../assets/MODE_EVENEMENT.png';
import interfaceMockup from '../assets/INTERFACE_SOCIALAPP.png';
import marketplaceMockup from '../assets/MARKETPLACE.png';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  const handleCTA = () => navigate(user ? '/dashboard' : '/login');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const plans = [
    {
      name: 'BASIC',
      subtitle: 'particulier, petit commerce, entrepreneur débutant…',
      price: '10 000',
      period: 'Paiement annuel',
      color: '#6366f1',
      features: ['1 profil', '3 liens', 'Page publique', 'Import 01 fichier PDF sur votre profil', 'Marketplace (ajout de 4 articles)'],
      popular: false,
    },
    {
      name: 'PRO',
      price: '15 000',
      period: 'Paiement annuel',
      subtitle: 'Professionels, Influenceurs, restaurants, Hôtels, boutiques en ligne…',
      color: '#ff6b35',
      features: [
        '2 profils',
        '7 liens',
        '1 Carte NFC ou PVC (avec ton logo & QR code)',
        'Statistiques détaillées des vues, clics, top liens',
        'Marketplace ajout de 10 articles',
        'import de 3 fichiers PDFs sur votre profil',
        'Support standard',
      ],
      popular: true,
    },
    {
      name: 'BUSINESS',
      subtitle: 'Grandes entreprises, agences, marques établies…', // ✅ FIX 7 : subtitle ajouté pour cohérence visuelle entre les cartes
      price: '25 000',
      period: 'Paiement annuel',
      color: '#f7c948',
      features: [
        '2 profils',
        '10 liens',
        '2 Carte NFC ou PVC (avec ton logo & QR code)',
        'Personnalisation avancée',
        'Statistiques détaillées des vues, clics, top liens',
        'Marketplace ajout de 10 articles',
        '1 mois offert mode événement',
        'Statistiques détaillées des visiteurs par pays',
        'import de 5 fichiers PDFs sur votre profil',
        'Support prioritaire',
      ],
      popular: false,
    },
    {
      name: 'ÉVÉNEMENT',
      price: '5 000',
      period: 'par événement',
      color: '#22c55e',
      features: [
        'Compte à rebours en direct',
        "Image & détails de l'événement",
        'Bouton "Réserver ma place"',
        'Couleurs personnalisables',
        'Partageable via QR code',
      ],
      popular: false,
      event: true,
      priceLabel: 'à partir de',
    },
  ];

  const faqs = [
    { q: "C'est quoi exactement SocialApp ?", a: "SocialApp c'est un lien unique et un QR code qui regroupe tous tes réseaux sociaux, ton WhatsApp, ta boutique et tes événements. Tu partages ce lien ou ce QR code, et tes clients trouvent tout en un seul endroit." },
    { q: "Comment fonctionne la boutique marketplace ?", a: "Tu peux mettre jusqu'à 10 produits sur ton profil public avec photos, prix et description. Tes clients voient tes articles directement sur ta page et te contactent pour commander. Zéro commission, c'est entre toi et ton client." },
    { q: "Comment fonctionne le QR code ?", a: "Ton QR code pointe directement sur ta page publique SocialApp. Un seul scan et tes visiteurs voient tous tes liens, ta boutique et tes infos de contact. Tu mets ce QR code sur tes flyers, ta vitrine ou tes cartes de visite." },
    { q: "Je peux changer mon profil après la création ?", a: "Oui, tu changes tout à tout moment depuis ton tableau de bord. Les modifications sont visibles en temps réel sur ta page publique." },
    { q: "Comment je reçois ma carte PVC ?", a: "Dès ta souscription aux offres PRO ou BUSINESS, notre équipe te contacte sur WhatsApp pour personnaliser ta carte. Tu la reçois chez toi sous 7 jours." },
    { q: "Le QR code expire ?", a: "Ton QR code reste actif pendant toute la durée de ton abonnement. Tu renouvelles, il continue de fonctionner sans interruption." },
    { q: "C'est quoi le mode Événement ?", a: "C'est parfait pour promouvoir une soirée, un concert ou une conférence. Ta page affiche un compte à rebours, les détails de l'événement et un bouton pour réserver. Disponible à partir de 5 000 FCFA." },
    { q: "Comment payer ?", a: "Tu paies via Mobile Money (Orange Money, Wave, MTN). Contacte-nous sur WhatsApp au +225 05 76 03 12 12 pour finaliser ta souscription." },
  ];

  const testimonials = [
    { name: 'Koffi Mensah', role: 'Influenceur', text: "Depuis que j'utilise SocialApp, mes abonnés Instagram ont augmenté de 40% en 2 mois. Un outil indispensable !", avatar: 'K' },
    { name: 'Dorine Ouattara', role: 'Commerçante en ligne', text: "Mes clients scannent mon QR code, découvrent mes produits puis me contactent directement sur WhatsApp. SocialApp a simplifié tout mon business. Génial !", avatar: 'D' },
    { name: 'Jean-Baptiste KOUAMÉ', role: 'Artiste', text: "Simple, rapide et efficace. Mon QR code remplace toute ma bio Instagram. Je recommande à 100% !", avatar: 'J' },
  ];

  return (
    <>
      <Helmet>
        <title>SocialApp – Ton qr code, ta boutique, ton business en Côte d'Ivoire</title>
        <meta name="description" content="Un seul QR code pour partager ton WhatsApp, tes réseaux et vendre tes produits en Côte d'Ivoire." />
        <meta name="keywords" content="QR code business, WhatsApp business, marketplace Côte d'Ivoire, SocialApp" />
        <meta property="og:title" content="SocialApp – Ton qr code, ta boutique, ton business" />
        <meta property="og:description" content="Un seul QR code pour tout partager et vendre en Côte d'Ivoire." />
        <meta property="og:image" content="https://www.socialapp.work/preview.jpg" />
        <meta property="og:url" content="https://www.socialapp.work/" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div style={{ fontFamily: "'Sora', system-ui, sans-serif", background: '#060412', color: 'white', overflowX: 'hidden', minHeight: '100vh' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          .reveal { opacity: 0; transform: translateY(32px); transition: all 0.7s cubic-bezier(0.16,1,0.3,1); }
          .reveal.visible { opacity: 1; transform: translateY(0); }
          .d1{transition-delay:0.1s} .d2{transition-delay:0.2s} .d3{transition-delay:0.3s} .d4{transition-delay:0.4s}
          .card-hover { transition: transform 0.3s, box-shadow 0.3s; }
          .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,0.35); }
          .float { animation: float 5s ease-in-out infinite; }
          /* ✅ FIX 3 : suppression de la classe float2 inutilisée */
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
          @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .fade-in { animation: fadeIn 0.8s ease both; }
          @media(max-width:768px){
          .qr-title{ font-size:22px !important; white-space:normal !important; line-height:1.3 !important;}
            .hero-grid{grid-template-columns:1fr!important;}
            .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
            .steps-grid{grid-template-columns:1fr!important;}
            .market-grid{grid-template-columns:1fr!important;}
            .event-grid{grid-template-columns:1fr!important;}
            .plans-grid{grid-template-columns:1fr!important;}
            .testi-grid{grid-template-columns:1fr!important;}
            .nav-links{display:none!important;}
            .hero-title{font-size:36px!important; letter-spacing:-1px!important;}
            .hero-mockup{width:280px!important; margin-top:32px;}
          }
        `}</style>

        {/* ── NAV ── */}
        <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'14px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(6,4,18,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <img src={logo} alt="SocialApp" style={{ width:'36px', height:'36px', borderRadius:'10px', objectFit:'cover' }} />
            <span style={{ fontWeight:'800', fontSize:'18px', letterSpacing:'-0.5px' }}>SocialApp</span>
          </div>
          <div className="nav-links" style={{ display:'flex', gap:'24px', fontSize:'14px', color:'rgba(255,255,255,0.55)' }}>
            <a href="#how" style={{ color:'inherit', textDecoration:'none' }}>Comment ça marche</a>
            <a href="#marketplace" style={{ color:'inherit', textDecoration:'none' }}>Boutique</a>
            <a href="#event" style={{ color:'inherit', textDecoration:'none' }}>Événement</a>
            <a href="#pricing" style={{ color:'inherit', textDecoration:'none' }}>Tarifs</a>
            <a href="#faq" style={{ color:'inherit', textDecoration:'none' }}>FAQ</a>
          </div>
          {user ? (
            // ✅ FIX 5 : type="button" ajouté sur tous les boutons pour éviter les soumissions accidentelles
            <button type="button" onClick={() => navigate('/dashboard')} style={{ padding:'10px 22px', background:'linear-gradient(135deg,#22c55e,#16a34a)', border:'none', borderRadius:'100px', color:'white', fontWeight:'700', fontSize:'14px', cursor:'pointer', fontFamily:'inherit' }}>
              Mon tableau de bord →
            </button>
          ) : (
            <button type="button" onClick={() => navigate('/login')} style={{ padding:'10px 22px', background:'linear-gradient(135deg,#ff6b35,#f7c948)', border:'none', borderRadius:'100px', color:'white', fontWeight:'700', fontSize:'14px', cursor:'pointer', fontFamily:'inherit' }}>
              Connexion →
            </button>
          )}
        </nav>

        {/* ── HERO ── */}
        <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', padding:'120px 32px 80px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,107,53,0.13), transparent)', pointerEvents:'none' }} />
          <div className="hero-grid" style={{ maxWidth:'1200px', margin:'0 auto', width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'80px', alignItems:'center' }}>

            <div className="fade-in">
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,107,53,0.1)', border:'1px solid rgba(255,107,53,0.3)', borderRadius:'100px', padding:'6px 16px', fontSize:'13px', color:'#ff6b35', fontWeight:'700', marginBottom:'24px' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#ff6b35', display:'inline-block', animation:'dot 2s infinite' }} />
                Fait pour la Côte d'Ivoire 🇨🇮
              </div>

              <h1 className="hero-title" style={{ fontSize:'58px', fontWeight:'900', lineHeight:'1.05', letterSpacing:'-2px', marginBottom:'22px' }}>
                Ton qr code.<br />
                Ta boutique.<br />
                <span style={{ background:'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Ton business.</span>
              </h1>

              <p style={{ fontSize:'17px', color:'rgba(255,255,255,0.6)', lineHeight:'1.8', marginBottom:'32px', maxWidth:'460px' }}>
                Crée <strong style={{ color:'white' }}>ton profil en 2 minutes,</strong> partage ton QR code et <strong style={{ color:'white' }}> reçois tes clients </strong> sur WhatsApp ou vers ta boutique.<br /><br />
                Un seul QR code à scanner. Tes clients trouvent ton WhatsApp, ta boutique, tes réseaux — <strong style={{ color:'#f7c948' }}>tout ça en 3 secondes.</strong>
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'36px' }}>
                {[
                  '✅ WhatsApp, TikTok, Instagram, Facebook — tout au même endroit',
                  '🛍️ Vends tes produits directement sur ton profil',
                  '📲 1 QR code sur ta carte de visite ou ton flyer',
                ].map((item, i) => (
                  <div key={i} style={{ fontSize:'14px', color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', gap:'8px' }}>{item}</div>
                ))}
              </div>

              <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
                {/* ✅ FIX 5 : type="button" */}
                <button type="button" onClick={handleCTA} style={{ padding:'15px 34px', background:'linear-gradient(135deg,#ff6b35,#f7c948)', border:'none', borderRadius:'14px', color:'white', fontWeight:'800', fontSize:'16px', cursor:'pointer', fontFamily:'inherit' }}>
                  {user ? 'Mon tableau de bord →' : 'Créer mon profil gratuitement →'}
                </button>
                <a href="#pricing" style={{ padding:'15px 28px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'14px', color:'rgba(255,255,255,0.8)', fontWeight:'600', fontSize:'15px', textDecoration:'none', display:'inline-flex', alignItems:'center' }}>
                  Voir les prix
                </a>
              </div>
              <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'12px', marginTop:'14px' }}>Paiement Mobile Money · Wave · Orange Money</p>
            </div>

            <div style={{ display:'flex', justifyContent:'center' }}>
              {/* Image hero : pas de lazy loading car elle est above the fold */}
              <img src={interfaceMockup} alt="Interface SocialApp" className="hero-mockup float"
                style={{ width:'460px', maxWidth:'100%', objectFit:'contain', filter:'drop-shadow(0 40px 80px rgba(255,107,53,0.2))' }}
              />
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section style={{ padding:'50px 32px', borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="stats-grid reveal" style={{ maxWidth:'1100px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'32px', textAlign:'center' }}>
            {[
              { v:'+30%', l:'de followers en plus', c:'#ff6b35' },
              { v:'1 scan', l:'pour tout partager', c:'#f7c948' },
              { v:'10', l:'produits dans ta boutique', c:'#ff6b35' },
              { v:'100%', l:'personnalisable', c:'#f7c948' },
            ].map((s,i) => (
              <div key={i}>
                <div style={{ fontSize:'44px', fontWeight:'800', color:s.c, letterSpacing:'-2px', lineHeight:1 }}>{s.v}</div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', marginTop:'8px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMMENT ÇA MARCHE ── */}
        <section id="how" style={{ padding:'100px 32px' }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:'60px' }}>
              <h2 style={{ fontSize:'40px', fontWeight:'800', letterSpacing:'-1.5px', marginBottom:'12px' }}>
                C'est simple comme <span style={{ background:'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>bonjour</span>
              </h2>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'16px' }}>Tu es prêt en moins de 5 minutes</p>
            </div>
            <div className="steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px' }}>
              {[
                { icon:'👤', n:'1', title:'Tu crées ton profil', desc:"Tu entres ton nom, tu ajoutes ta photo et tu mets tous tes liens — WhatsApp, TikTok, Instagram. 5 minutes et c'est fait." },
                { icon:'🛍️', n:'2', title:'Tu ajoutes tes produits', desc:"Tu mets les photos, les prix et les descriptions de tes produits. Tes clients voient tout directement sur ta page." },
                { icon:'📲', n:'3', title:'Tu partages ton QR code', desc:"Tu mets ton QR code sur ta carte de visite, ton flyer ou ta vitrine. Un scan et tes clients te trouvent partout." },
              ].map((s,i) => (
                <div key={i} className={`reveal card-hover d${i+1}`} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'24px', padding:'36px', textAlign:'center' }}>
                  <div style={{ width:'64px', height:'64px', borderRadius:'20px', background:'linear-gradient(135deg,rgba(255,107,53,0.15),rgba(247,201,72,0.15))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px', margin:'0 auto 16px' }}>{s.icon}</div>
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#ff6b35,#f7c948)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', margin:'0 auto 16px' }}>{s.n}</div>
                  <h3 style={{ fontSize:'19px', fontWeight:'700', marginBottom:'10px' }}>{s.title}</h3>
                  <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'14px', lineHeight:'1.7' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MARKETPLACE ── */}
        <section id="marketplace" style={{ padding:'100px 32px', background:'linear-gradient(180deg, rgba(255,107,53,0.04) 0%, transparent 100%)', borderTop:'1px solid rgba(255,107,53,0.1)', borderBottom:'1px solid rgba(255,107,53,0.1)' }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:'60px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,107,53,0.12)', border:'1px solid rgba(255,107,53,0.3)', borderRadius:'100px', padding:'6px 16px', fontSize:'13px', color:'#ff6b35', fontWeight:'700', marginBottom:'20px' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#ff6b35', display:'inline-block', animation:'dot 1.5s infinite' }} />
                Nouvelle fonctionnalité 🔥
              </div>
              <h2 style={{ fontSize:'40px', fontWeight:'800', letterSpacing:'-1.5px', marginBottom:'16px' }}>
                Ta boutique directement<br />sur ton <span style={{ background:'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>profil public</span>
              </h2>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'16px', maxWidth:'560px', margin:'0 auto' }}>
                Maintenant avec SocialApp, tu peux vendre tes produits directement sur ta page. Tes clients voient tes articles, les prix et te contactent pour commander. <strong style={{ color:'white' }}>Zéro commission.</strong>
              </p>
            </div>

            <div className="market-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'center' }}>
              <div className="reveal d1" style={{ display:'flex', justifyContent:'center' }}>
                {/* ✅ FIX 4 : lazy loading ajouté sur les images sous le fold */}
                <img
                  src={marketplaceMockup}
                  alt="Boutique SocialApp sur mobile"
                  loading="lazy"
                  className="float"
                  style={{
                    width: '320px',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 40px 80px rgba(255,107,53,0.25))',
                    borderRadius: '32px',
                  }}
                />
              </div>

              <div className="reveal d2" style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                {[
                  { icon:'📸', title:'Ajoute tes produits avec photos', desc:"Tu mets la photo, le prix, le prix barré et une petite description. Tes clients voient directement ce que tu vends." },
                  { icon:'💰', title:'Zéro commission, zéro frais cachés', desc:"Tu vends, l'argent va directement chez toi. SocialApp ne prend rien sur tes ventes. C'est ton business." },
                  { icon:'📱', title:'Tes clients commandent sur WhatsApp', desc:"Quand un client veut un article, il te contacte directement. Simple et direct comme on aime en Côte d'Ivoire." },
                  { icon:'🏷️', title:"Jusqu'à 10 produits sur ton profil", desc:"Tu mets en avant tes meilleures ventes avec prix barrés, badges de réduction et indication de disponibilité." },
                  { icon:'🔗', title:'Tout sur une seule page', desc:"Tes réseaux sociaux, ta boutique, tes contacts — tout ça sur une seule page que tu partages avec un QR code." },
                ].map((f,i) => (
                  <div key={i} style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(255,107,53,0.1)', border:'1px solid rgba(255,107,53,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{f.icon}</div>
                    <div>
                      <div style={{ fontSize:'15px', fontWeight:'700', marginBottom:'4px' }}>{f.title}</div>
                      <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:'1.6' }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
                {/* ✅ FIX 5 : type="button" */}
                <button type="button" onClick={handleCTA} style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'13px 26px', background:'linear-gradient(135deg,#ff6b35,#f7c948)', border:'none', borderRadius:'12px', color:'white', fontWeight:'700', fontSize:'14px', cursor:'pointer', fontFamily:'inherit', marginTop:'8px', width:'fit-content' }}>
                  Ouvrir ma boutique gratuitement →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── MODE ÉVÉNEMENT ── */}
        <section id="event" style={{ padding:'100px 32px' }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:'60px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'100px', padding:'6px 16px', fontSize:'13px', color:'#22c55e', fontWeight:'700', marginBottom:'20px' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'dot 1.5s infinite' }} />
                Pour tes soirées et événements
              </div>
              <h2 style={{ fontSize:'40px', fontWeight:'800', letterSpacing:'-1.5px', marginBottom:'14px' }}>
                Mode <span style={{ background:'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Événement</span>
              </h2>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'16px', maxWidth:'500px', margin:'0 auto' }}>
                Tu organises une soirée, un concert ou une conférence ? Crée une page d'événement en 2 minutes avec compte à rebours et lien de réservation.
              </p>
            </div>
            <div className="event-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'center' }}>
              <div className="reveal d1" style={{ display:'flex', justifyContent:'center' }}>
                {/* ✅ FIX 4 : lazy loading */}
                <img src={eventMockup} alt="Mode Événement SocialApp" loading="lazy" className="float"
                  style={{ width:'320px', maxWidth:'100%', borderRadius:'24px', boxShadow:'0 40px 80px rgba(0,0,0,0.5)', objectFit:'contain' }}
                />
              </div>
              <div className="reveal d2" style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
                {[
                  { icon:'⏱', title:'Compte à rebours en direct', desc:"Tes invités voient exactement combien de jours, d'heures et de minutes il reste avant l'événement." },
                  { icon:'🎨', title:'Tu personnalises les couleurs', desc:"Tu choisis les couleurs de ta page pour qu'elle corresponde au style de ton événement." },
                  { icon:'🎟', title:'Bouton de réservation directe', desc:"Un bouton pour que tes invités réservent leur place ou paient directement." },
                  { icon:'📲', title:'Un QR code pour inviter tout le monde', desc:"Tu mets le QR code sur tes flyers et invitations. Un scan et les gens ont toutes les infos." },
                ].map((f,i) => (
                  <div key={i} style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{f.icon}</div>
                    <div>
                      <div style={{ fontSize:'15px', fontWeight:'700', marginBottom:'3px' }}>{f.title}</div>
                      <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:'1.6' }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
                <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'14px', padding:'16px 20px', marginTop:'8px' }}>
                  <div style={{ fontSize:'22px', fontWeight:'800', color:'#22c55e' }}>5 000 FCFA</div>
                  <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', marginTop:'4px' }}>par événement · Paiement Mobile Money</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TARIFS ── */}
        <section id="pricing" style={{ padding:'100px 32px', background:'rgba(255,255,255,0.01)' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:'60px' }}>
              <h2 style={{ fontSize:'40px', fontWeight:'800', letterSpacing:'-1.5px', marginBottom:'12px' }}>
                Des prix faits pour <span style={{ background:'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>l'Afrique</span>
              </h2>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'16px' }}>Paiement Mobile Money · Pas de carte bancaire nécessaire</p>
            </div>
            <div className="plans-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'20px', alignItems:'start' }}>
              {plans.map((p,i) => (
                <div key={i} className={`reveal card-hover d${i+1}`}
                  style={{ background: p.event?'rgba(34,197,94,0.06)':p.popular?'rgba(255,107,53,0.08)':'rgba(255,255,255,0.03)', border: p.event?'2px solid rgba(34,197,94,0.4)':p.popular?'2px solid rgba(255,107,53,0.5)':'1px solid rgba(255,255,255,0.08)', borderRadius:'24px', padding:'28px', position:'relative' }}
                >
                  {p.popular && <div style={{ position:'absolute', top:'-14px', left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#ff6b35,#f7c948)', borderRadius:'100px', padding:'5px 18px', fontSize:'12px', fontWeight:'700', whiteSpace:'nowrap' }}>⭐ Plus populaire</div>}
                  {p.event && <div style={{ position:'absolute', top:'-14px', left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#22c55e,#16a34a)', borderRadius:'100px', padding:'5px 18px', fontSize:'12px', fontWeight:'700', whiteSpace:'nowrap', color:'white' }}>🎉 Événements</div>}
                  <div style={{ fontSize:'12px', fontWeight:'700', color:p.color, textTransform:'uppercase', letterSpacing:'2px', marginBottom:'12px' }}>{p.name}</div>
                  {p.priceLabel && <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginBottom:'2px' }}>{p.priceLabel}</div>}
                  <div style={{ display:'flex', alignItems:'baseline', gap:'5px', marginBottom:'4px' }}>
                    <span style={{ fontSize:'32px', fontWeight:'800', letterSpacing:'-1px' }}>{p.price}</span>
                    <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)' }}>FCFA</span>
                  </div>
                  {p.subtitle && <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', marginBottom:'10px', lineHeight:'1.4' }}>{p.subtitle}</div>}
                  <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', marginBottom:'22px' }}>/ {p.period}</div>
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:'18px', marginBottom:'22px' }}>
                    {p.features.map((f,j) => (
                      <div key={j} style={{ display:'flex', alignItems:'flex-start', gap:'8px', marginBottom:'9px', fontSize:'13px', color:'rgba(255,255,255,0.75)' }}>
                        <span style={{ color:p.color, flexShrink:0, marginTop:'1px' }}>✓</span>{f}
                      </div>
                    ))}
                  </div>
                  {/* ✅ FIX 2 : encodeURIComponent pour encoder correctement "événement" dans l'URL */}
                  {/* ✅ FIX 5 : type="button" */}
                  <button
                    type="button"
                    onClick={() => navigate(`/login?plan=${encodeURIComponent(p.name.toLowerCase())}`)}
                    style={{ display:'block', width:'100%', padding:'12px', background: p.event?'linear-gradient(135deg,#22c55e,#16a34a)':p.popular?'linear-gradient(135deg,#ff6b35,#f7c948)':'rgba(255,255,255,0.07)', border:(!p.popular&&!p.event)?'1px solid rgba(255,255,255,0.15)':'none', borderRadius:'12px', color:'white', fontWeight:'700', fontSize:'14px', cursor:'pointer', fontFamily:'inherit' }}
                  >
                    {p.event ? 'Promouvoir mon événement' : `Choisir ${p.name}`}
                  </button>
                </div>
              ))}
            </div>
            <p className="reveal" style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'13px', marginTop:'28px' }}>
              💬 Des questions ? Écris-nous sur WhatsApp au <strong style={{ color:'rgba(255,255,255,0.6)' }}>+225 05 76 03 12 12</strong>
            </p>
          </div>
        </section>

        {/* ── QR CODE MODIFIABLE ── */}
        <section style={{ padding:'40px 32px 20px', position:'relative', overflow:'hidden' }}>
          <div style={{
            position:'absolute',
            left:'5%',
            top:'50%',
            transform:'translateY(-50%)',
            width:'220px',
            height:'3px',
            background:'linear-gradient(90deg, transparent, #a855f7)',
            filter:'blur(2px)',
            opacity:0.9,
          }} />
          <div style={{
            position:'absolute',
            right:'5%',
            top:'50%',
            transform:'translateY(-50%)',
            width:'220px',
            height:'3px',
            background:'linear-gradient(90deg, #ff6b35, transparent)',
            filter:'blur(2px)',
            opacity:0.9,
          }} />
          <div className="reveal" style={{ maxWidth:'1400px', margin:'0 auto', textAlign:'center', position:'relative', zIndex:2 }}>
            <h2
              className="qr-title"
              style={{
                fontSize:'36px',
                fontWeight:'900',
                lineHeight:'1.1',
                letterSpacing:'-2px',
                textTransform:'uppercase',
                whiteSpace:'nowrap',
                textShadow:'0 0 25px rgba(255,255,255,0.08)',
              }}
            >
              <span style={{ color:'#ffffff' }}>QR CODE</span>
              <span style={{ background:'linear-gradient(135deg,#a855f7,#d946ef)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{' '}MODIFIABLE</span>
              <span style={{ color:'#ffffff' }}>{' '}SANS</span>
              <span style={{ background:'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{' '}RÉIMPRESSION</span>
            </h2>
            <p style={{ marginTop:'14px', color:'rgba(255,255,255,0.5)', fontSize:'16px' }}>
              Modifie tes liens, ta boutique ou ton WhatsApp sans changer ton QR code.
            </p>
          </div>
        </section>

        {/* ── TÉMOIGNAGES ── */}
        <section style={{ padding:'100px 32px' }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:'60px' }}>
              <h2 style={{ fontSize:'40px', fontWeight:'800', letterSpacing:'-1.5px', marginBottom:'12px' }}>
                Ils utilisent déjà <span style={{ background:'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>SocialApp</span>
              </h2>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'16px' }}>Ce qu'ils en disent</p>
            </div>
            <div className="testi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px' }}>
              {testimonials.map((t,i) => (
                <div key={i} className={`reveal card-hover d${i+1}`} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'24px', padding:'28px' }}>
                  <div style={{ fontSize:'22px', marginBottom:'16px', color:'#f7c948' }}>★★★★★</div>
                  <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'15px', lineHeight:'1.7', marginBottom:'20px', fontStyle:'italic' }}>"{t.text}"</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg,#ff6b35,#f7c948)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'16px', flexShrink:0 }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontWeight:'700', fontSize:'14px' }}>{t.name}</div>
                      <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section style={{ padding:'60px 32px' }}>
          <div className="reveal" style={{ maxWidth:'680px', margin:'0 auto', textAlign:'center', background:'linear-gradient(135deg,rgba(255,107,53,0.08),rgba(247,201,72,0.06))', border:'1px solid rgba(255,107,53,0.2)', borderRadius:'32px', padding:'60px 40px' }}>
            <div style={{ fontSize:'48px', marginBottom:'20px' }}>🚀</div>
            <h2 style={{ fontSize:'34px', fontWeight:'800', letterSpacing:'-1px', marginBottom:'14px' }}>
              Prêt à booster ton business ?
            </h2>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'16px', lineHeight:'1.8', marginBottom:'32px' }}>
              Rejoins des centaines d'entrepreneurs ivoiriens qui utilisent SocialApp pour partager leurs réseaux et vendre leurs produits. <strong style={{ color:'#f7c948' }}>C'est simple, c'est rapide, c'est fait pour toi.</strong>
            </p>
            {/* ✅ FIX 5 : type="button" */}
            <button type="button" onClick={handleCTA} style={{ padding:'16px 44px', background:'linear-gradient(135deg,#ff6b35,#f7c948)', border:'none', borderRadius:'14px', color:'white', fontWeight:'800', fontSize:'17px', cursor:'pointer', fontFamily:'inherit', display:'block', width:'100%', marginBottom:'14px' }}>
              {user ? 'Accéder à mon dashboard →' : 'Créer mon profil gratuitement →'}
            </button>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'13px' }}>Paiement Mobile Money · Wave · MTN Money</p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" style={{ padding:'80px 32px' }}>
          <div style={{ maxWidth:'720px', margin:'0 auto' }}>
            <div className="reveal" style={{ textAlign:'center', marginBottom:'50px' }}>
              <h2 style={{ fontSize:'40px', fontWeight:'800', letterSpacing:'-1.5px', marginBottom:'12px' }}>
                Tu as des <span style={{ background:'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>questions ?</span>
              </h2>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'15px' }}>On répond à tout</p>
            </div>
            <div className="reveal" style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {faqs.map((f,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', overflow:'hidden' }}>
                  {/* ✅ FIX 1 : pattern fonctionnel (prev => ...) pour éviter la stale closure */}
                  {/* ✅ FIX 5 : type="button" */}
                  {/* ✅ FIX 6 : aria-expanded pour l'accessibilité */}
                  <button
                    type="button"
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(prev => prev === i ? null : i)}
                    style={{ width:'100%', padding:'18px 22px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:'none', color:'white', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', textAlign:'left', gap:'16px' }}
                  >
                    {f.q}
                    <span style={{ fontSize:'20px', flexShrink:0, color:'#ff6b35', transition:'transform 0.3s', transform:openFaq===i?'rotate(45deg)':'rotate(0)', display:'inline-block' }} aria-hidden="true">+</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding:'0 22px 18px', color:'rgba(255,255,255,0.6)', fontSize:'14px', lineHeight:'1.7' }}>{f.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ padding:'32px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <img src={logo} alt="SocialApp" style={{ width:'28px', height:'28px', borderRadius:'6px', objectFit:'cover' }} />
            <span style={{ fontWeight:'700', fontSize:'15px' }}>SocialApp</span>
          </div>
          <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'12px' }}>© 2026 SocialApp · Tous droits réservés</p>
          <div style={{ display:'flex', gap:'12px' }}>
            <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer"
              style={{ padding:'10px 20px', background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.3)', borderRadius:'100px', color:'#25D366', fontWeight:'600', fontSize:'13px', textDecoration:'none' }}>
              WhatsApp
            </a>
            {/* ✅ FIX 5 : type="button" */}
            <button type="button" onClick={handleCTA} style={{ padding:'10px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'100px', color:'white', fontWeight:'600', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
              {user ? 'Mon dashboard' : 'Se connecter'}
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}