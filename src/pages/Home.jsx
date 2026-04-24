import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Logo_SocialApp.png';

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
      features: ['1 profil autorisé', '3 liens', 'QR code personnalisé', 'Page publique'],
      popular: false,
    },
    {
      name: 'PRO',
      price: '15 000',
      period: '12 mois',
      color: '#ff6b35',
      features: ['3 profils autorisés', '7 liens', '1 Carte PVC avec logo & QR code', 'Page publique', 'Support standard'],
      popular: true,
    },
    {
      name: 'BUSINESS',
      price: '22 000',
      period: '12 mois',
      color: '#f7c948',
      features: ['5 profils autorisés', '15 liens', '2 Cartes PVC avec logo & QR code', 'Personnalisation avancée', 'Support prioritaire'],
      popular: false,
    },
    {
      name: 'ÉVÉNEMENT',
      price: '5 000',
      period: 'mois',
      color: '#22c55e',
      features: [
        'Compte à rebours en temps réel',
        'Image & détails de l\'événement',
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
    { icon: '👤', title: 'Créez votre profil', desc: 'Inscrivez-vous et configurez votre profil en moins de 2 minutes. Ajoutez votre photo, nom et bio.' },
    { icon: '🔗', title: 'Ajoutez vos réseaux', desc: 'Connectez tous vos réseaux sociaux : Facebook, Instagram, TikTok, WhatsApp et bien plus encore.' },
    { icon: '📲', title: 'Partagez votre QR code', desc: 'Téléchargez votre QR code et imprimez-le sur vos cartes, affiches ou goodies. Un scan suffit !' },
  ];

  const testimonials = [
    { name: 'Kofi Mensah', role: 'Influenceur', text: "Depuis que j'utilise SocialApp, mes abonnés Instagram ont augmenté de 40% en 2 mois. Un outil indispensable !", avatar: 'K' },
    { name: 'Aminata Diallo', role: 'Gérante PME', text: "Je distribue mes cartes PVC à chaque événement. Mes clients scannent et me retrouvent partout. Génial !", avatar: 'A' },
    { name: 'Jean-Baptiste Ouédraogo', role: 'Artiste', text: "Simple, rapide et efficace. Mon QR code remplace toute ma bio Instagram. Je recommande à 100% !", avatar: 'J' },
  ];

  const faqs = [
    { q: "Comment fonctionne le QR code ?", a: "Votre QR code est un lien unique qui dirige vers votre page publique SocialApp. Quand quelqu'un le scanne, il voit tous vos réseaux et peut vous suivre en un clic." },
    { q: "Puis-je modifier mon profil après la création ?", a: "Oui, vous pouvez modifier votre profil, vos liens et votre design à tout moment depuis votre tableau de bord. Les changements sont appliqués instantanément." },
    { q: "Comment je reçois ma carte PVC ?", a: "Après votre souscription aux offres PRO ou BUSINESS, notre équipe vous contacte pour récupérer vos informations et vous livrer votre carte sous 7 jours ouvrés." },
    { q: "Mon QR code expire-t-il ?", a: "Non, votre QR code est valable pour toute la durée de votre abonnement. À la fin de votre abonnement, vous pouvez renouveler pour continuer à l'utiliser." },
    { q: "Comment fonctionne l'option Événement ?", a: "L'option Événement s'ajoute à votre offre existante. Elle active un mode spécial sur votre page publique avec compte à rebours, image, détails et bouton de réservation. À partir de 5 000 FCFA/mois." },
    { q: "Comment vous contacter pour souscrire ?", a: "Contactez-nous directement sur WhatsApp au +225 05 06 45 81 27 ou cliquez sur le bouton de support en bas de votre page publique." },
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
        }
      `}</style>

      {/* NAV */}
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

      {/* HERO */}
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
              Un QR code magique qui ouvre <strong style={{ color: 'white' }}>TOUS vos réseaux</strong> en un seul scan. Fini les bios surchargées !
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

      {/* STATS */}
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

      {/* HOW IT WORKS */}
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

      {/* ✅ MODE ÉVÉNEMENT */}
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
              Un profil spécial avec compte à rebours pour vos événements, concerts et lancements
            </p>
          </div>

          <div className="event-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
            {/* Phone mockup */}
            <div className="reveal d1" style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '220px', background: '#0f0a1e', borderRadius: '32px', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden', padding: '16px', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,255,255,0.1)', margin: '0 auto 8px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: 'white' }}>T</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>TESTE</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>création digitale</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg,#ff6b35,#f7c948)', borderRadius: '14px', padding: '12px', textAlign: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '100px', padding: '2px 8px', fontSize: '8px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'white', display: 'inline-block' }} />
                    ÉVÉNEMENT
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'white', lineHeight: '1.2' }}>Abidjan Street Food Festival</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', marginTop: '3px' }}>📍 Sofitel Ivoire</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px', marginBottom: '10px' }}>
                  {[{v:'32',l:'J'},{v:'05',l:'H'},{v:'47',l:'M'},{v:'12',l:'S'}].map(({v,l}) => (
                    <div key={l} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 3px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#ff6b35', lineHeight: 1 }}>{v}</div>
                      <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginTop: '2px' }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'linear-gradient(135deg,#ff6b35,#f7c948)', borderRadius: '10px', padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: 'white' }}>
                  🎟️ Réserver ma place
                </div>
              </div>
            </div>

            {/* Features list */}
            <div className="reveal d2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '⚡', title: 'Création simple et rapide', desc: 'Renseignez titre, description, visuel, date et lieu. Votre événement est prêt en quelques secondes.' },
                { icon: '⏱', title: 'Compte à rebours en temps réel', desc: 'Un décompte live jours/heures/min/sec visible sur votre page publique jusqu\'au jour J.' },
                { icon: '🎨', title: 'Personnalisation complète', desc: 'Choisissez vos couleurs de fond parmi des presets ou créez les vôtres. Ajoutez une image attractive.' },
                { icon: '🎟', title: 'Réservation en 1 clic', desc: 'Bouton direct vers votre lien de billetterie ou formulaire d\'inscription.' },
                { icon: '📊', title: 'Engagement et interaction', desc: 'Communiquez avec votre audience, partagez des mises à jour et créez une connexion forte.' },
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

      {/* PRICING */}
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
              <div key={i} className={`reveal card-hover d${i+1}`} style={{
                background: p.event ? 'rgba(34,197,94,0.06)' : p.popular ? 'rgba(255,107,53,0.08)' : 'rgba(255,255,255,0.03)',
                border: p.event ? '2px solid rgba(34,197,94,0.4)' : p.popular ? '2px solid rgba(255,107,53,0.5)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px', padding: '30px', position: 'relative'
              }}>
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
                {p.priceLabel && (
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{p.priceLabel}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '34px', fontWeight: '800', letterSpacing: '-1px' }}>{p.price}</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>FCFA</span>
                </div>
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
                  href="https://wa.me/2250506458127"
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
          <p className="reveal" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginTop: '28px' }}>
            Paiement via Mobile Money · Contactez-nous sur WhatsApp au +225 05 06 45 81 27
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
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

      {/* CTA */}
      <section style={{ padding: '80px 40px' }}>
        <div className="reveal" style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,107,53,0.08),rgba(247,201,72,0.08))', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '32px', padding: '60px 40px' }}>
          <img src={logo} alt="SocialApp" style={{ width: '72px', height: '72px', borderRadius: '18px', objectFit: 'cover', marginBottom: '24px' }} />
          <h2 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '14px' }}>Votre QR code sur une carte de visite</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', marginBottom: '8px' }}>
            <strong style={{ color: '#f7c948' }}>+30 à 50% de followers</strong> en un clin d'œil !
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '32px' }}>Connect. Share. Discover.</p>
          <button onClick={() => navigate('/login')} style={{ padding: '16px 44px', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: '800', fontSize: '17px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Commencer gratuitement →
          </button>
        </div>
      </section>

      {/* FAQ */}
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

      {/* FOOTER */}
      <footer style={{ padding: '32px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="SocialApp" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
          <span style={{ fontWeight: '700', fontSize: '15px' }}>SocialApp</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Connect. Share. Discover. © 2026</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="https://wa.me/2250506458127" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '100px', color: '#25D366', fontWeight: '600', fontSize: '13px', textDecoration: 'none' }}>
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