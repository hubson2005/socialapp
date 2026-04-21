import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const heroRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", background: '#060412', color: 'white', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .reveal { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.16,1,0.3,1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }
        .glow-btn { position: relative; overflow: hidden; }
        .glow-btn::before { content: ''; position: absolute; inset: -2px; background: linear-gradient(135deg, #ff6b35, #f7c948, #ff6b35); border-radius: inherit; z-index: -1; animation: spin 3s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-8px); box-shadow: 0 24px 60px rgba(255,107,53,0.2); }
        .float { animation: float 6s ease-in-out infinite; }
        .float-delay { animation: float 6s ease-in-out 2s infinite; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .qr-pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.4); } 50% { box-shadow: 0 0 0 20px rgba(255,107,53,0); } }
        .noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); }
        @media (max-width: 768px) {
          .hero-title { font-size: 42px !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .nav-links { display: none !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(6,4,18,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/favicon.jpg" alt="logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} onError={e => e.target.style.display='none'} />
          <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px' }}>SocialApp</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: '32px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Fonctionnalités</a>
          <a href="#stats" style={{ color: 'inherit', textDecoration: 'none' }}>Résultats</a>
          <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Tarifs</a>
        </div>
        <button onClick={() => navigate('/login')} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '100px', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Connexion →
        </button>
      </nav>

      {/* HERO */}
      <section ref={heroRef} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 40px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,107,53,0.15), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(247,201,72,0.08), transparent 70%)', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: '100px', padding: '6px 16px', fontSize: '13px', color: '#ff6b35', fontWeight: '600', marginBottom: '24px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff6b35', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Votre QR CODE Ultime
            </div>
            <h1 className="hero-title" style={{ fontSize: '64px', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-2px', marginBottom: '24px' }}>
              Découvrez<br />
              <span style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c948)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SocialApp</span>
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginBottom: '16px', fontWeight: '300' }}>
              Un QR code magique qui ouvre <strong style={{ color: 'white', fontWeight: '500' }}>TOUS vos réseaux</strong> en un seul scan. Fini les bios surchargées !
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.4)', letterSpacing: '3px', fontWeight: '500', marginBottom: '40px', textTransform: 'uppercase' }}>
              Connect. Share. Discover.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/login')} className="glow-btn" style={{ padding: '16px 36px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: '700', fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Créer mon QR code →
              </button>
              <button style={{ padding: '16px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', fontWeight: '600', fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Voir la démo
              </button>
            </div>
          </div>

          {/* QR MOCKUP */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div className="float" style={{ position: 'relative' }}>
              <div className="qr-pulse" style={{ width: '280px', height: '280px', background: 'white', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
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
                  <rect x="154" y="118" width="12" height="12" fill="#060412"/>
                  <rect x="172" y="118" width="12" height="12" fill="#060412"/>
                  <rect x="100" y="136" width="12" height="12" fill="#060412"/>
                  <rect x="118" y="136" width="12" height="12" fill="#060412"/>
                  <rect x="136" y="136" width="12" height="12" fill="#060412"/>
                  <rect x="154" y="136" width="12" height="12" fill="#f7c948"/>
                  <rect x="100" y="154" width="12" height="12" fill="#ff6b35"/>
                  <rect x="118" y="154" width="12" height="12" fill="#060412"/>
                  <rect x="136" y="154" width="12" height="12" fill="#060412"/>
                  <rect x="154" y="154" width="12" height="12" fill="#060412"/>
                  <rect x="172" y="154" width="12" height="12" fill="#060412"/>
                  <rect x="100" y="172" width="12" height="12" fill="#060412"/>
                  <rect x="118" y="172" width="12" height="12" fill="#f7c948"/>
                  <rect x="136" y="172" width="12" height="12" fill="#060412"/>
                  <rect x="172" y="172" width="12" height="12" fill="#ff6b35"/>
                </svg>
              </div>
              {/* Floating badges */}
              <div className="float-delay" style={{ position: 'absolute', top: '-20px', right: '-40px', background: 'linear-gradient(135deg, #1877F2, #0d5dbf)', borderRadius: '14px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', boxShadow: '0 8px 32px rgba(24,119,242,0.4)', whiteSpace: 'nowrap' }}>
                f Facebook
              </div>
              <div className="float" style={{ position: 'absolute', bottom: '20px', right: '-50px', background: 'linear-gradient(135deg, #E1306C, #833AB4)', borderRadius: '14px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', boxShadow: '0 8px 32px rgba(225,48,108,0.4)', animationDelay: '1s', whiteSpace: 'nowrap' }}>
                📷 Instagram
              </div>
              <div className="float-delay" style={{ position: 'absolute', bottom: '-10px', left: '-40px', background: 'linear-gradient(135deg, #25D366, #128C7E)', borderRadius: '14px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', boxShadow: '0 8px 32px rgba(37,211,102,0.4)', whiteSpace: 'nowrap' }}>
                WhatsApp
              </div>
              <div className="float" style={{ position: 'absolute', top: '30px', left: '-50px', background: 'linear-gradient(135deg, #000, #333)', borderRadius: '14px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', animationDelay: '3s', whiteSpace: 'nowrap' }}>
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
              <div style={{ fontSize: '52px', fontWeight: '800', letterSpacing: '-2px', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '8px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-2px', marginBottom: '16px' }}>
              Pourquoi ça <span style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c948)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>change tout ?</span>
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.5)', fontSize: '18px' }}>Tout ce dont vous avez besoin, en un seul QR code.</p>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
            {[
              { emoji: '⚡', title: 'Ultra-simple', desc: 'Un scan = Facebook, Insta, WhatsApp, TikTok... Tout d\'un coup ! Parfait pour influenceurs, PME et events.', delay: 'reveal-delay-1' },
              { emoji: '🎨', title: 'Personnalisé à fond', desc: 'Thèmes mobiles, designs pros, couleurs personnalisées. Votre QR code reflète votre identité.', delay: 'reveal-delay-2' },
              { emoji: '🌍', title: 'Partout', desc: 'Imprimez sur cartes de visite, affiches, goodies... Votre présence digitale, partout dans le monde réel.', delay: 'reveal-delay-3' },
            ].map((f, i) => (
              <div key={i} className={`reveal card-hover ${f.delay}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px', cursor: 'default' }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>{f.emoji}</div>
                <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>{f.title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', fontSize: '15px' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 40px' }}>
        <div className="reveal" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(247,201,72,0.1))', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '32px', padding: '64px 40px' }}>
          <div style={{ fontSize: '56px', marginBottom: '24px' }}>📱</div>
          <h2 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '16px' }}>Votre QR code sur une carte de visite</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: '18px', marginBottom: '8px' }}>
            <strong style={{ color: '#f7c948' }}>+30 à 50% de followers</strong> en un clin d'œil !
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.4)', fontSize: '14px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '36px' }}>Connect. Share. Discover.</p>
          <button onClick={() => navigate('/login')} style={{ padding: '18px 48px', background: 'linear-gradient(135deg, #ff6b35, #f7c948)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: '800', fontSize: '18px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.5px' }}>
            Commencer gratuitement →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/favicon.jpg" alt="logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} onError={e => e.target.style.display='none'} />
          <span style={{ fontWeight: '700', fontSize: '16px' }}>SocialApp</span>
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Connect. Share. Discover. © 2026</p>
        <button onClick={() => navigate('/login')} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Se connecter
        </button>
      </footer>
    </div>
  );
}