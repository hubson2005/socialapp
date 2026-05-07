import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Logo_SocialApp.png';
import eventMockup from '../assets/MODE_EVENEMENT.png'; // ← nouvelle image

export default function Home() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

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
      price: '10 000',
      period: '11 mois',
      color: '#6366f1',
      features: ['1 profil autorisé', '3 liens', '1 mois offert au mode événement', 'Page publique'],
      popular: false,
    },
    {
      name: 'PRO',
      price: '15 000',
      period: '12 mois',
      subtitle: 'Pour influenceur, restaurant, petite startup, etc...',
      color: '#ff6b35',
      features: [
        '2 profils autorisés',
        '7 liens',
        '1 Carte NFC ou PVC simple (selon la disponibilité avec logo & QR code)',
        'Recevez tous les 1 ou 3 mois un rapport détaillé (vues, clics, liens performants)',
        '1 mois offert au mode événement',
        'Page publique',
        'Support standard',
      ],
      popular: true,
    },
    {
      name: 'BUSINESS',
      price: '22 000',
      period: '12 mois',
      color: '#f7c948',
      features: [
        '2 profils autorisés',
        '10 liens',
        'Personnalisation du QR code avec votre logo',
        '2 Cartes NFC ou PVC simple (selon la disponibilité avec logo & QR code)',
        'Personnalisation avancée',
        'Recevez tous les 1 ou 3 mois un rapport détaillé (vues, clics, liens performants)',
        '1 mois offert au mode événement',
        'Page publique',
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
        'Compte à rebours en temps réel',
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

  const steps = [
    { icon: '👤', title: 'Créez votre profil en 2 minutes chrono', desc: 'nscrivez-vous, ajoutez votre photo, votre bio et vos liens. Votre espace personnalisé est prêt à conquérir votre audience en un temps record.' },
    { icon: '🔗', title: 'Centralisez tous vos réseaux', desc: 'Connectez instantanément Facebook, Instagram, TikTok, WhatsApp et tous vos profils essentiels en un seul espace. Un seul lien, une présence totale.' },
    { icon: '📲', title: 'Partagez votre QR code', desc: 'Téléchargez votre QR code et  Intégrez-le facilement sur vos supports de communication : cartes de visite, flyers, affiches de concert, invitations de mariage ou cadeaux personnalisés.' },
  ];

  const testimonials = [
    { name: 'Koffi Mensah', role: 'Influenceur', text: "Depuis que j'utilise SocialApp, mes abonnés Instagram ont augmenté de 40% en 2 mois. Un outil indispensable !", avatar: 'K' },
    { name: 'Dorine Ouattara', role: 'Gérante PME', text: "Je présente ma carte  PVC avec Qr code à chaque événement. Mes clients scannent et me retrouvent partout. Génial !", avatar: 'A' },
    { name: 'Jean-Baptiste KOUAMÉ', role: 'Artiste', text: "Simple, rapide et efficace. Mon QR code remplace toute ma bio Instagram. Je recommande à 100% !", avatar: 'J' },
  ];

  const faqs = [
    { q: "Comment fonctionne le QR code ?", a: "Votre QR code est une passerelle unique vers votre page publique SocialApp. Un simple scan suffit à vos visiteurs pour accéder à tous vos réseaux et vous suivre en un clic." },
    { q: "Puis-je modifier mon profil après la création ?", a: "Absolument. Vous gardez le contrôle total : modifiez votre profil, vos liens et votre design à tout moment depuis votre tableau de bord. Les mises à jour sont instantanées." },
    { q: "Comment je reçois ma carte PVC ?", a: "Dès votre souscription aux offres PRO ou BUSINESS, notre équipe vous contacte pour personnaliser votre carte. Recevez-la directement chez vous sous 7 jours ouvrés." },
    { q: "Mon QR code expire-t-il ?", a: "Votre code est actif durant toute la durée de votre abonnement. Il vous suffit de renouveler votre souscription pour continuer à l'utiliser sans interruption." },
    { q: "En quoi consiste la fonctionnalité « Événement » ?", a: "C'est le mode idéal pour booster vos lancement ! Elle transforme votre page avec un compte à rebours, des détails complets et un bouton de réservation. Disponible à partir de 5 000 FCFA/mois." },
    { q: "Comment vous contacter pour souscrire ?", a: "Besoin d'aide ou envie de vous lancer ? Contactez-nous directement sur WhatsApp au +225 05 06 45 81 27 ou utilisez le bouton de support en bas de votre page publique." },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#060412', color: 'white', overflowX: 'hidden', minHeight: '100vh' }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; }
        .reveal { opacity: 0; transform: translateY(32px); transition: all 0.7s cubic-bezier(0.16,1,0.3,1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .d1 { transition-delay: 0.1s; }
        .d2 { transition-delay: 0.2s; }
        .d3 { transition-delay: 0.3s; }
        .d4 { transition-delay: 0.4s; }
        .card-hover { transition: transform 0.3s, box-shadow 0.3s; cursor: default; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
        .float { animation: float 5s ease-in-out infinite; }
        .float2 { animation: float 5s ease-in-out 1.5s infinite; }
        .float3 { animation: float 5s ease-in-out 3s infinite; }
        .float4 { animation: float 5s ease-in-out 0.8s infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr!important;}
          .features-grid{grid-template-columns:1fr!important;}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
          .steps-grid{grid-template-columns:1fr!important;}
          .plans-grid{grid-template-columns:1fr!important;}
          .event-grid{grid-template-columns:1fr!important;}
          .testi-grid{grid-template-columns:1fr!important;}
          .nav-links{display:none!important;}
          .hero-title{font-size:38px!important;}
          .qr-mockup{display:none!important;}
          .event-mockup-img{width:260px!important;}
        }
      `}</style>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(6,4,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="SocialApp" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} />
          <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px' }}>SocialApp</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: '28px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
          <a href="#how" style={{ color: 'inherit', textDecoration: 'none' }}>Comment ça marche</a>
          <a href="#event" style={{ color: 'inherit', textDecoration: 'none' }}>Mode Événement</a>
          <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Tarifs</a>
          <a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>FAQ</a>
        </div>
        <button onClick={() => navigate('/login')} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '100px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Connexion →
        </button>
      </nav>

      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 40px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,107,53,0.12), transparent)', pointerEvents: 'none' }} />
        <div className="hero-grid" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: '100px', padding: '6px 16px', fontSize: '13px', color: '#ff6b35', fontWeight: '600', marginBottom: '24px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff6b35', display: 'inline-block', animation: 'dot 2s infinite' }} />
              Votre QR CODE Ultime
            </div>
            <h1 className="hero-title" style={{ fontSize: '60px', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-2px', marginBottom: '24px' }}>
              Découvrez<br />
              <span style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c948)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SocialApp</span>
            </h1>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginBottom: '16px' }}>
              Un seul QR code pour <strong style={{ color: 'white' }}>TOUS VOS RÉSEAUX SOCIAUX, LIENS ET ÉVÉNEMENTS</strong> en un seul scan.
              <br /><br />
                   SocialApp.Work vous permet de créer un QR code unique qui centralise <strong style={{ color: 'white' }}>tous vos contenus importants</strong>.  
                   Plus besoin de multiplier les codes, adresses ou numéros : tout est accessible depuis une seule page simple et mobile.
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '40px' }}>Connect. Share. Discover.</p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/login')} style={{ padding: '15px 34px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: '700', fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Créer mon QR code →
              </button>
              <a href="#pricing" style={{ padding: '15px 34px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', color: 'white', fontWeight: '600', fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                Voir les tarifs
              </a>
            </div>
          </div>

          <div className="qr-mockup" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="float" style={{ position: 'relative' }}>
              <div style={{ width: '240px', height: '240px', background: 'white', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="180" height="180" viewBox="0 0 200 200">
                  <rect x="10" y="10" width="70" height="70" rx="8" fill="none" stroke="#060412" strokeWidth="6"/>
                  <rect x="25" y="25" width="40" height="40" rx="4" fill="#060412"/>
                  <rect x="120" y="10" width="70" height="70" rx="8" fill="none" stroke="#060412" strokeWidth="6"/>
                  <rect x="135" y="25" width="40" height="40" rx="4" fill="#060412"/>
                  <rect x="10" y="120" width="70" height="70" rx="8" fill="none" stroke="#060412" strokeWidth="6"/>
                  <rect x="25" y="135" width="40" height="40" rx="4" fill="#060412"/>
                  <rect x="100" y="100" width="12" height="12" fill="#060412"/>
                  <rect x="118" y="100" width="12" height="12" fill="#ff6b35"/>
                  <rect x="136" y="100" width="12" height="12" fill="#060412"/>
                  <rect x="154" y="100" width="12" height="12" fill="#f7c948"/>
                  <rect x="100" y="118" width="12" height="12" fill="#f7c948"/>
                  <rect x="118" y="118" width="12" height="12" fill="#060412"/>
                  <rect x="136" y="118" width="12" height="12" fill="#ff6b35"/>
                  <rect x="100" y="136" width="12" height="12" fill="#060412"/>
                  <rect x="154" y="136" width="12" height="12" fill="#f7c948"/>
                  <rect x="100" y="154" width="12" height="12" fill="#ff6b35"/>
                  <rect x="118" y="172" width="12" height="12" fill="#f7c948"/>
                  <rect x="172" y="172" width="12" height="12" fill="#ff6b35"/>
                </svg>
              </div>
              <div className="float2" style={{ position: 'absolute', top: '-20px', right: '-50px', background: 'linear-gradient(135deg,#1877F2,#0d5dbf)', borderRadius: '14px', padding: '10px 14px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>f Facebook</div>
              <div className="float3" style={{ position: 'absolute', bottom: '10px', right: '-55px', background: 'linear-gradient(135deg,#E1306C,#833AB4)', borderRadius: '14px', padding: '10px 14px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>📷 Instagram</div>
              <div className="float4" style={{ position: 'absolute', bottom: '-15px', left: '-45px', background: 'linear-gradient(135deg,#25D366,#128C7E)', borderRadius: '14px', padding: '10px 14px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>WhatsApp</div>
              <div className="float2" style={{ position: 'absolute', top: '20px', left: '-55px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '10px 14px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>♪ TikTok</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="stats-grid reveal" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '32px', textAlign: 'center' }}>
          {[
            { v: '+30%', l: 'de followers en moyenne', c: '#ff6b35' },
            { v: '1 scan', l: 'pour tout partager', c: '#f7c948' },
            { v: '∞', l: 'plateformes supportées', c: '#ff6b35' },
            { v: '100%', l: 'personnalisable', c: '#f7c948' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '46px', fontWeight: '800', color: s.c, letterSpacing: '-2px', lineHeight: 1 }}>{s.v}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '8px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '12px' }}>
              Comment ça <span style={{ background: 'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>marche ?</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '17px' }}>3 étapes simples pour booster votre présence en ligne</p>
          </div>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
            {steps.map((s, i) => (
              <div key={i} className={`reveal card-hover d${i+1}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg,rgba(255,107,53,0.15),rgba(247,201,72,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>{s.icon}</div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', margin: '0 auto 16px' }}>{i+1}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>{s.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.7' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mode Événement ────────────────────────────────────────────────── */}
      <section id="event" style={{ padding: '100px 40px', background: 'rgba(34,197,94,0.03)', borderTop: '1px solid rgba(34,197,94,0.1)', borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: '100px', padding: '6px 16px', fontSize: '13px', color: '#ff6b35', fontWeight: '600', marginBottom: '20px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff6b35', display: 'inline-block', animation: 'pulse-dot 1.5s infinite' }} />
              Nouvelle fonctionnalité
            </div>
            <h2 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '12px' }}>
              Mode <span style={{ background: 'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Événement</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '17px', maxWidth: '540px', margin: '0 auto' }}>
              Créez une page événementielle interactive et un QR code unique pour vos lancements
            </p>
          </div>

          <div className="event-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>

            {/* ✅ Nouvelle image à la place du mockup codé en dur */}
            <div className="reveal d1" style={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={eventMockup}
                alt="Mode Événement SocialApp"
                className="event-mockup-img float"
                style={{
                  width: '320px',
                  maxWidth: '100%',
                  borderRadius: '24px',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
                  objectFit: 'contain',
                }}
              />
            </div>

            <div className="reveal d2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '⚡', title: 'Création simple et rapide', desc: 'Lancez votre page événementielle en quelques minutes. Idéal pour les concerts, conférences et festivals en Côte divoire et en Afrique.' },
                { icon: '⏱', title: 'Compte à rebours en temps réel', desc: "Un compte à rebours dynamique visible sur votre profil jusqu'au jour J." },
                { icon: '🎨', title: 'Personnalisation complète', desc: 'Choisissez vos couleurs de fond parmi des presets ou créez les vôtres. Ajoutez une image attractive.' },
                { icon: '🎟', title: 'Réservation en 1 clic', desc: "Optimisez votre billetterie : lien direct vers votre plateforme d'inscription ou paiement mobile." },
                { icon: '📊', title: 'Engagement et interaction', desc: 'Boostez votre audience avec une interface fluide, parfaitement adaptée au mobile.' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '3px' }}>{f.title}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
              <a href="#pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', textDecoration: 'none', marginTop: '8px', width: 'fit-content' }}>
                Voir l'offre Événement →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" style={{ padding: '100px 40px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '12px' }}>
              Nos <span style={{ background: 'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>tarifs</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '17px' }}>Choisissez l'offre qui correspond à vos besoins</p>
          </div>

          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px', alignItems: 'start' }}>
            {plans.map((p, i) => (
              <div
                key={i}
                className={`reveal card-hover d${i+1}`}
                style={{
                  background: p.event ? 'rgba(34,197,94,0.06)' : p.popular ? 'rgba(255,107,53,0.08)' : 'rgba(255,255,255,0.03)',
                  border: p.event ? '2px solid rgba(34,197,94,0.4)' : p.popular ? '2px solid rgba(255,107,53,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '24px',
                  padding: '30px',
                  position: 'relative'
                }}
              >
                {p.popular && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', borderRadius: '100px', padding: '5px 18px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                    ⭐ Plus populaire
                  </div>
                )}
                {p.event && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#22c55e,#16a34a)', borderRadius: '100px', padding: '5px 18px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', color: 'white' }}>
                    🎉 Nouveau
                  </div>
                )}
                <div style={{ fontSize: '13px', fontWeight: '700', color: p.color, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>{p.name}</div>
                {p.priceLabel && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{p.priceLabel}</div>}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '34px', fontWeight: '800', letterSpacing: '-1px' }}>{p.price}</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>FCFA</span>
                </div>
                {p.subtitle && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginBottom: '12px', lineHeight: '1.4' }}>{p.subtitle}</div>}
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>/ {p.period}</div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginBottom: '24px' }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                      <span style={{ color: p.color, flexShrink: 0, marginTop: '2px' }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
                <a
                  href="https://wa.me/2250576031212"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', width: '100%', padding: '13px',
                    background: p.event ? 'linear-gradient(135deg,#22c55e,#16a34a)' : p.popular ? 'linear-gradient(135deg,#ff6b35,#f7c948)' : 'rgba(255,255,255,0.07)',
                    border: (!p.popular && !p.event) ? '1px solid rgba(255,255,255,0.15)' : 'none',
                    borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '14px',
                    cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', textAlign: 'center',
                  }}
                >
                  {p.event ? 'Promouvoir un événement' : 'Choisir ' + p.name}
                </a>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: '1100px', margin: '34px auto 0', padding: '28px', background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(247,201,72,0.06))', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '24px', boxShadow: '0 18px 50px rgba(0,0,0,0.18)', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b35, #f7c948)' }} />
              <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>Options complémentaires</span>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                'Vous avez la possibilité de créer plusieurs profils distincts sous une même identité, idéal pour les entreprises disposant de plusieurs collaborateurs.',
                'Vous avez également la possibilité de faire imprimer, pour chaque membre de votre personnel, une carte NFC ou une carte PVC simple.',
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 18px', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(247,201,72,0.2))', color: '#f7c948', fontWeight: '800' }}>{i+1}</div>
                  <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: '14px', lineHeight: '1.7' }}>
                    {text}
                    <div style={{ marginTop: '4px', color: 'rgba(255,255,255,0.48)', fontSize: '13px' }}>(Option non incluse dans les offres tarifaires.)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="reveal" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginTop: '28px' }}>
            Paiement via Mobile Money · Contactez-nous sur WhatsApp au +225 05 76 03 12 12
          </p>
        </div>
      </section>

      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '12px' }}>
              Ils nous font <span style={{ background: 'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>confiance</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '17px' }}>Ce que disent nos utilisateurs</p>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
            {testimonials.map((t, i) => (
              <div key={i} className={`reveal card-hover d${i+1}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '28px' }}>
                <div style={{ fontSize: '24px', marginBottom: '16px', color: '#f7c948' }}>★★★★★</div>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.7', marginBottom: '20px', fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{t.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 40px' }}>
        <div className="reveal" style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,107,53,0.08),rgba(247,201,72,0.08))', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '32px', padding: '60px 40px' }}>
          <img src={logo} alt="SocialApp" style={{ width: '72px', height: '72px', borderRadius: '18px', objectFit: 'cover', marginBottom: '24px' }} />
          <h2 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '14px' }}>QR Code SocialApp : Votre networking 2.0</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', marginBottom: '8px' }}>
            <strong style={{ color: '#f7c948' }}>Un seul scan, un accès total : boostez votre visibilité de 30 à 50% instantanément.</strong> Networking fluide, connexion intelligente, impact immédiat. Passez au réseautage nouvelle génération.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '32px' }}>Connect. Share. Discover.</p>
          <button onClick={() => navigate('/login')} style={{ padding: '16px 44px', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: '800', fontSize: '17px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Commencer gratuitement →
          </button>
        </div>
      </section>

      <section id="faq" style={{ padding: '80px 40px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '12px' }}>
              Questions <span style={{ background: 'linear-gradient(135deg,#ff6b35,#f7c948)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>fréquentes</span>
            </h2>
          </div>
          <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                >
                  {f.q}
                  <span style={{ fontSize: '20px', flexShrink: 0, marginLeft: '16px', color: '#ff6b35', transition: 'transform 0.3s', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 20px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.7' }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ padding: '32px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="SocialApp" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
          <span style={{ fontWeight: '700', fontSize: '15px' }}>SocialApp</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Connect. Share. Discover. © 2026 SocialApp.</p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Tous Droits Réservés.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="https://wa.me/2250576031212" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '100px', color: '#25D366', fontWeight: '600', fontSize: '13px', textDecoration: 'none' }}>
            WhatsApp
          </a>
          <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Se connecter
          </button>
        </div>
      </footer>
    </div>
  );
}