import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Logo_SocialApp.png';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#060412', color: 'white', overflowX: 'hidden', minHeight: '100vh' }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; }
        .reveal { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.16,1,0.3,1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-8px); box-shadow: 0 24px 60px rgba(255,107,53,0.2); }
        .float { animation: float 6s ease-in-out infinite; }
        .float-delay { animation: float 6s ease-in-out 2s infinite; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes qrpulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.4); } 50% { box-shadow: 0 0 0 20px rgba(255,107,53,0); } }
        @keyframes dot-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .nav-links { display: none !important; }
          .hero-title { font-size: 40px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(6,4,18,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="SocialApp" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} />
          <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px' }}>SocialApp</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: '32px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Fonctionnalités</a>
          <a href="#stats" style={{ color: 'inherit', textDecoration: 'none' }}>Résultats</a>
        </div>
        <button onClick={() => navigate('/login')} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '100px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Connexion →
        </button>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 40px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,107,53,0.12), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(247,201,72,0.07), transparent 70%)', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: '100px', padding: '6px 16px', fontSize: '13px', color: '#ff6b35', fontWeight: '600', marginBottom: '24px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff6b35', display: 'inline-block', animation: 'dot-pulse 2s infinite' }} />
              Votre QR CODE Ultime
            </div>
            <h1 className="hero-title" style={{ fontSize: '62px', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-2px', marginBottom: '24px' }}>
              Découvrez<br />
              <span style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c948)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SocialApp</span>
            </h1>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginBottom: '16px', fontWeight: '300' }}>
              Un QR code magique qui ouvre <strong style={{ color: 'white', fontWeight: '600' }}>TOUS vos réseaux</strong> en un seul scan. Fini les bios surchargées !
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', letterSpacing: '4px', fontWeight: '600', marginBottom: '40px', textTransform: 'uppercase' }}>
              Connect. Share. Discover.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/login')} style={{ padding: '16px 36px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: '700', fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Créer mon QR code →
              </button>
              <button style={{ padding: '16px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', fontWeight: '600', fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Voir la démo
              </button>
            </div>
          </div>

          {/* QR MOCKUP */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="float" style={{ position: 'relative' }}>
              <div style={{ width: '260px', height: '260px', background: 'white', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'qrpulse 2s ease-in-out infinite' }}>
                <svg width="190" height="190" viewBox="0 0 200 200">
                  <rect x="10" y="10" width="70" height="70" rx="8" fill="none" stroke="#060412" strokeWidth="6"/>
                  <rect x="25" y="25" width="40" height="40" rx="4" fill="#060412"/>
                  <rect x="120" y="10" width="70" height="70" rx="8" fill="none" stroke="#060412" strokeWidth="6"/>
                  <rect x="135" y="25" width="40" height="40" rx="4" fill="#060412"/>
                  <rect x="10" y="120" width="70" height="70" rx="8" fill="none" stroke="#060412" strokeWidth="6"/>
                  <rect x="25" y="135" width="40" height="40" rx="4" fill="#060412"/>
                  <rect x="100" y="100" width="12" height="12" fill="#060412"/>
                  <rect x="118" y="100" width="12" height="12" fill="#ff6b35"/>
                  <rect x="136" y="100" width="12" height="12" fill="#060412"/>
                  <rect x="154" y="100" width="12" height="12" fill="#060412"/>
                  <rect x="172" y="100" width="12" height="12" fill="#f7c948"/>
                  <rect x="100" y="118" width="12" height="12" fill="#f7c948"/>
                  <rect x="118" y="118" width="12" height="12" fill="#060412"/>
                  <rect x="136" y="118" width="12" height="12" fill="#ff6b35"/>
                  <rect x="100" y="136" width="12" height="12" fill="#060412"/>
                  <rect x="154" y="136" width="12" height="12" fill="#f7c948"/>
                  <rect x="100" y="154" width="12" height="12" fill="#ff6b35"/>
                  <rect x="136" y="154" width="12" height="12" fill="#060412"/>
                  <rect x="172" y="154" width="12" height="12" fill="#060412"/>
                  <rect x="118" y="172" width="12" height="12" fill="#f7c948"/>
                  <rect x="172" y="172" width="12" height="12" fill="#ff6b35"/>
                </svg>
              </div>
              <div className="float-delay" style={{ position: 'absolute', top: '-20px', right: '-50px', background: 'linear-gradient(135deg, #1877F2, #0d5dbf)', borderRadius: '14px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                f Facebook
              </div>
              <div style={{ position: 'absolute', bottom: '20px', right: '-55px', background: 'linear-gradient(135deg, #E1306C, #833AB4)', borderRadius: '14px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', animation: 'float 6s ease-in-out 1s infinite', whiteSpace: 'nowrap' }}>
                📷 Instagram
              </div>
              <div className="float-delay" style={{ position: 'absolute', bottom: '-15px', left: '-45px', background: 'linear-gradient(135deg, #25D366, #128C7E)', borderRadius: '14px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                WhatsApp
              </div>
              <div style={{ position: 'absolute', top: '20px', left: '-55px', background: 'linear-gradient(135deg, #111, #333)', borderRadius: '14px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)', animation: 'float 6s ease-in-out 3s infinite', whiteSpace: 'nowrap' }}>
                ♪ TikTok
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" style={{ padding: '80px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="stats-grid reveal" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '40px', textAlign: 'center' }}>
          {[
            { value: '+30%', label: 'de followers en moyenne', color: '#ff6b35' },
            { value: '1 scan', label: 'pour tout partager', color: '#f7c948' },
            { value: '∞', label: 'plateformes supportées', color: '#ff6b35' },
            { value: '100%', label: 'personnalisable', color: '#f7c948' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-2px', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '8px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '44px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '16px' }}>
              Pourquoi ça <span style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c948)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>change tout ?</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px' }}>Tout ce dont vous avez besoin, en un seul QR code.</p>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
            {[
              { emoji: '⚡', title: 'Ultra-simple', desc: "Un scan = Facebook, Insta, WhatsApp, TikTok... Tout d'un coup ! Parfait pour influenceurs, PME et events.", delay: 'reveal-delay-1' },
              { emoji: '🎨', title: 'Personnalisé à fond', desc: "Thèmes mobiles, designs pros, couleurs personnalisées. Votre QR code reflète votre identité.", delay: 'reveal-delay-2' },
              { emoji: '🌍', title: 'Partout', desc: "Imprimez sur cartes de visite, affiches, goodies... Votre présence digitale dans le monde réel.", delay: 'reveal-delay-3' },
            ].map((f, i) => (
              <div key={i} className={`reveal card-hover ${f.delay}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px', cursor: 'default' }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>{f.emoji}</div>
                <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', fontSize: '15px' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 40px' }}>
        <div className="reveal" style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(247,201,72,0.08))', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '32px', padding: '64px 40px' }}>
          <img src={logo} alt="SocialApp" style={{ width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover', marginBottom: '24px' }} />
          <h2 style={{ fontSize: '38px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '16px' }}>Votre QR code sur une carte de visite</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '18px', marginBottom: '8px' }}>
            <strong style={{ color: '#f7c948' }}>+30 à 50% de followers</strong> en un clin d'œil !
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '36px' }}>Connect. Share. Discover.</p>
          <button onClick={() => navigate('/login')} style={{ padding: '18px 48px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: '800', fontSize: '18px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.5px' }}>
            Commencer gratuitement →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '32px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="SocialApp" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
          <span style={{ fontWeight: '700', fontSize: '16px' }}>SocialApp</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Connect. Share. Discover. © 2026</p>
        <button onClick={() => navigate('/login')} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Se connecter
        </button>
      </footer>
    </div>
  );
}