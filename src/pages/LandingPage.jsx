import { useState, useEffect } from "react";

const features = [
  { icon: "✦", label: "Invitation digitale élégante" },
  { icon: "💬", label: "RSVP via WhatsApp" },
  { icon: "📊", label: "Gestion des invités en temps réel" },
  { icon: "🔗", label: "Partage par lien ou QR code" },
  { icon: "📱", label: "Compatible mobile" },
  { icon: "🌍", label: "Pensé pour l'Afrique francophone" },
];

const steps = [
  {
    number: "01",
    title: "Créez votre événement",
    text: "Ajoutez le nom, la date, le lieu, les photos et le message de votre invitation en quelques minutes.",
    img: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80",
    alt: "Création d'un événement sur tablette en Afrique",
  },
  {
    number: "02",
    title: "Partagez sur WhatsApp",
    text: "Envoyez le lien à vos invités en un clic sur WhatsApp ou via QR code imprimable.",
    img: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80",
    alt: "Partage WhatsApp sur smartphone",
  },
  {
    number: "03",
    title: "Suivez les réponses",
    text: "Consultez les confirmations RSVP et gérez vos invités depuis votre tableau de bord en temps réel.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    alt: "Dashboard de suivi des invités",
  },
];

const faqs = [
  {
    q: "Comment créer une invitation de mariage en Côte d'Ivoire ?",
    a: "Il suffit de remplir les informations de l'événement, d'ajouter vos photos et de partager le lien avec vos invités. Tout se fait en moins de 10 minutes.",
  },
  {
    q: "Est-ce que les invités peuvent répondre sur WhatsApp ?",
    a: "Oui, le RSVP peut être envoyé directement sur WhatsApp pour faciliter les réponses, sans application à télécharger.",
  },
  {
    q: "La page fonctionne-t-elle sur téléphone ?",
    a: "Oui, la landing page est conçue mobile-first pour offrir une expérience fluide sur tout smartphone.",
  },
  {
    q: "Puis-je utiliser un QR code ?",
    a: "Oui, vous pouvez générer un QR code à imprimer sur vos faire-part ou à afficher le jour J.",
  },
];

const testimonials = [
  {
    name: "Awa Koné",
    role: "Mariée, Abidjan",
    text: "Notre invitation a été envoyée à plus de 300 personnes en 5 minutes sur WhatsApp. Un gain de temps incroyable !",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&q=80",
  },
  {
    name: "Emmanuel Diabaté",
    role: "Organisateur événements, Yamoussoukro",
    text: "Le tableau de bord en temps réel m'a permis de gérer les confirmations sans stress. Je recommande à 100%.",
    avatar: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=80&q=80",
  },
  {
    name: "Fatoumata Bamba",
    role: "Responsable RH, Bouaké",
    text: "Parfait pour nos événements d'entreprise. Interface simple, résultats professionnels.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80",
  },
];

const eventTypes = [
  { label: "Mariage", img: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80" },
  { label: "Anniversaire", img: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400&q=80" },
  { label: "Fiançailles", img: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&q=80" },
  { label: "Événement Corporate", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80" },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [count, setCount] = useState({ events: 0, guests: 0, cities: 0 });

  useEffect(() => {
    const targets = { events: 800, guests: 4000, cities: 12 };
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount({
        events: Math.round(targets.events * ease),
        guests: Math.round(targets.guests * ease),
        cities: Math.round(targets.cities * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  return (
    <main
      style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
      className="min-h-screen bg-[#0c0e12] text-white overflow-x-hidden"
    >
      {/* ── Google Font import via style tag ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'Playfair Display', serif; }
        .sans { font-family: 'DM Sans', sans-serif; }
        .hero-glow { background: radial-gradient(ellipse 80% 60% at 60% 40%, rgba(251,146,60,0.13) 0%, transparent 70%); }
        .card-glow:hover { box-shadow: 0 0 40px rgba(251,146,60,0.12); }
        .step-img { transition: transform 0.4s cubic-bezier(0.23,1,0.32,1); }
        .step-card:hover .step-img { transform: scale(1.04); }
        details[open] summary { color: #fb923c; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .float { animation: float 4s ease-in-out infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .badge-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; margin-right:8px; box-shadow:0 0 6px #22c55e; }
        .grain::after {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.35;
        }
      `}</style>

      <div className="grain" />

      {/* ── NAV ── */}
      <nav className="sans sticky top-0 z-50 border-b border-white/5 bg-[#0c0e12]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-black font-bold text-sm">E</div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Event<span className="text-orange-400">Manager</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm text-gray-400">
            <a href="#how" className="hover:text-white transition">Fonctionnement</a>
            <a href="#events" className="hover:text-white transition">Événements</a>
            <a href="#temoignages" className="hover:text-white transition">Témoignages</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>
          <a
            href="#contact"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400 transition"
          >
            Commencer →
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-glow relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* LEFT */}
          <div className="fade-up">
            <span className="sans mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-300 uppercase tracking-widest">
              <span className="badge-dot" />
              Invitation digitale · Côte d'Ivoire & Afrique
            </span>

            <h1 className="serif mt-4 text-5xl font-bold leading-tight sm:text-6xl">
              Vos événements,{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                sublimés
              </span>{" "}
              en digital
            </h1>

            <p className="sans mt-6 max-w-lg text-base leading-relaxed text-gray-400">
              Mariages, anniversaires, fiançailles, lancements d'entreprise — créez une page d'invitation
              en quelques minutes, partagez via WhatsApp et gérez vos invités en temps réel depuis Abidjan
              jusqu'à Dakar.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="sans inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 font-semibold text-black transition hover:bg-orange-400 hover:scale-[1.02] active:scale-[0.98]"
              >
                Créer mon événement
                <span>→</span>
              </a>
              <a
                href="#how"
                className="sans inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 font-semibold text-white transition hover:bg-white/5"
              >
                <span className="text-orange-400">▶</span> Voir comment ça marche
              </a>
            </div>

            {/* Features pill list */}
            <ul className="mt-10 flex flex-wrap gap-2">
              {features.map((f) => (
                <li
                  key={f.label}
                  className="sans flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-gray-300"
                >
                  <span>{f.icon}</span> {f.label}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — Mock Dashboard */}
          <div className="float relative">
            {/* Real event photo background */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80"
                alt="Mariage africain élégant, Abidjan"
                className="h-72 w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e12] via-[#0c0e12]/60 to-transparent" />

              {/* Overlay card */}
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-[#0f1115]/90 p-5 backdrop-blur-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="sans text-xs uppercase tracking-widest text-orange-300">Invitation Live</p>
                    <h2 className="serif mt-1 text-xl font-semibold">Mariage Sarah & Kevin</h2>
                    <p className="sans mt-0.5 text-xs text-gray-400">Sofitel Abidjan Hôtel Ivoire · 15 Août 2026</p>
                  </div>
                  <span className="sans flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400">
                    <span className="badge-dot" style={{ width: 6, height: 6, margin: 0, marginRight: 4 }} />
                    Live
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Invités", value: "287" },
                    { label: "Confirmés", value: "194" },
                    { label: "En attente", value: "93" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/8 bg-black/30 p-3 text-center">
                      <p className="serif text-lg font-bold text-orange-400">{stat.value}</p>
                      <p className="sans text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <a
                  href="#contact"
                  className="sans mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-black"
                >
                  Confirmer ma présence
                </a>
              </div>
            </div>

            {/* Floating badge */}
            <div className="sans absolute -right-3 -top-3 rounded-2xl border border-orange-500/30 bg-[#0f1115] px-3 py-2 text-xs shadow-xl">
              <p className="text-gray-400">RSVP via</p>
              <p className="font-semibold text-green-400">WhatsApp ✓</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-3 divide-x divide-white/8 rounded-2xl border border-white/8 bg-white/3">
          {[
            { value: count.events.toLocaleString("fr-FR"), label: "Événements créés" },
            { value: count.guests.toLocaleString("fr-FR") + "+", label: "Invités gérés" },
            { value: count.cities + " villes", label: "En Côte d'Ivoire & Afrique" },
          ].map((s) => (
            <div key={s.label} className="py-6 text-center">
              <p className="serif text-3xl font-bold text-orange-400">{s.value}</p>
              <p className="sans mt-1 text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TYPES D'ÉVÉNEMENTS ── */}
      <section id="events" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="sans mb-2 text-xs uppercase tracking-widest text-orange-400">Pour chaque occasion</p>
            <h2 className="serif text-3xl font-bold">Tous vos événements,{" "}
              <span className="text-orange-400">une seule plateforme</span>
            </h2>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {eventTypes.map((ev) => (
            <div
              key={ev.label}
              className="card-glow group relative overflow-hidden rounded-2xl border border-white/8 cursor-pointer transition"
            >
              <img
                src={ev.img}
                alt={ev.label}
                className="h-52 w-full object-cover transition duration-500 group-hover:scale-105 opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <p className="serif text-lg font-semibold">{ev.label}</p>
                <p className="sans text-xs text-orange-300 mt-0.5">Créer →</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── POURQUOI ── */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-white/8 bg-white/3">
          <div className="grid lg:grid-cols-2">
            <div className="p-10 lg:p-14">
              <p className="sans mb-3 text-xs uppercase tracking-widest text-orange-400">Pourquoi EventManager ?</p>
              <h2 className="serif text-3xl font-bold leading-snug">
                Conçu pour l'Afrique,{" "}
                <span className="text-orange-400">là où WhatsApp est roi</span>
              </h2>
              <p className="sans mt-5 text-gray-400 leading-relaxed">
                En Côte d'Ivoire et en Afrique francophone, WhatsApp est le canal de communication
                numéro un. EventManager est né de cette réalité : invitations instantanées, RSVP
                sans friction, gestion sans application supplémentaire à installer.
              </p>
              <ul className="sans mt-6 space-y-3 text-sm text-gray-300">
                {[
                  "✓ Optimisé pour les connexions mobiles (3G/4G)",
                  "✓ Pages légères et rapides même en zone rurale",
                  "✓ Support en français ivoirien & francophone",
                  "✓ Paiement local disponible (Mobile Money)",
                ].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="relative hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=80"
                alt="Famille africaine utilisant un smartphone pour une invitation"
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e12]/80 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="sans mb-2 text-xs uppercase tracking-widest text-orange-400">Simple & rapide</p>
          <h2 className="serif text-3xl font-bold">Comment ça marche</h2>
          <p className="sans mt-3 text-gray-400">3 étapes, moins de 10 minutes</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="step-card group rounded-3xl border border-white/8 bg-white/3 overflow-hidden transition hover:border-orange-500/30"
            >
              <div className="overflow-hidden h-44">
                <img
                  src={step.img}
                  alt={step.alt}
                  className="step-img h-44 w-full object-cover opacity-70"
                />
              </div>
              <div className="p-6">
                <p className="serif text-4xl font-black text-orange-500/30">{step.number}</p>
                <h3 className="serif mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="sans mt-2 text-sm text-gray-400 leading-relaxed">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DÉMO DASHBOARD SCREENSHOT ── */}
      <section id="demo" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/8 bg-white/3 p-6 sm:p-10">
          <div className="mb-8">
            <p className="sans mb-2 text-xs uppercase tracking-widest text-orange-400">Aperçu du produit</p>
            <h2 className="serif text-2xl font-bold">Votre tableau de bord en action</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {/* Main dashboard mock */}
            <div className="md:col-span-2 overflow-hidden rounded-2xl border border-white/8">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80"
                alt="Dashboard analytics EventManager"
                className="w-full h-64 object-cover opacity-80"
              />
              <div className="bg-[#13161d] p-5">
                <div className="flex items-center justify-between">
                  <p className="sans text-sm font-medium">Aperçu des confirmations</p>
                  <span className="sans rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs text-orange-300">En direct</span>
                </div>
                <div className="mt-3 flex gap-4">
                  {[
                    { color: "bg-green-500", label: "Confirmés", pct: "67%" },
                    { color: "bg-orange-400", label: "En attente", pct: "22%" },
                    { color: "bg-red-400", label: "Déclinés", pct: "11%" },
                  ].map((b) => (
                    <div key={b.label} className="flex-1">
                      <div className="sans mb-1 flex justify-between text-xs text-gray-400">
                        <span>{b.label}</span><span>{b.pct}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/8">
                        <div className={`h-1.5 rounded-full ${b.color}`} style={{ width: b.pct }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Side: Invitation preview */}
            <div className="overflow-hidden rounded-2xl border border-white/8">
              <img
                src="https://images.unsplash.com/photo-1578926288207-a90a5366759d?w=400&q=80"
                alt="Aperçu invitation digitale africaine"
                className="h-full min-h-48 w-full object-cover opacity-75"
              />
              <div className="absolute-ish bg-[#13161d] p-5">
                <p className="sans text-xs text-gray-400">Aperçu invitation</p>
                <p className="serif mt-1 text-base font-semibold">Mariage Sarah & Kevin</p>
                <div className="sans mt-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-xs text-white font-bold">W</span>
                  <span className="text-xs text-gray-300">Partagé sur WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section id="temoignages" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="sans mb-2 text-xs uppercase tracking-widest text-orange-400">Ils nous font confiance</p>
          <h2 className="serif text-3xl font-bold">Ce que disent nos clients</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="card-glow rounded-2xl border border-white/8 bg-white/3 p-6 transition">
              <p className="serif text-3xl text-orange-500/40">"</p>
              <p className="sans mt-1 text-sm text-gray-300 leading-relaxed">{t.text}</p>
              <div className="mt-5 flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="sans text-sm font-semibold">{t.name}</p>
                  <p className="sans text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <p className="sans mb-2 text-xs uppercase tracking-widest text-orange-400">Questions fréquentes</p>
          <h2 className="serif text-3xl font-bold">FAQ</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={faq.q}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="cursor-pointer rounded-2xl border border-white/8 bg-white/3 px-6 py-5 transition hover:border-orange-500/20"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="sans text-sm font-medium">{faq.q}</p>
                <span className="sans shrink-0 text-orange-400 text-lg">{openFaq === i ? "−" : "+"}</span>
              </div>
              {openFaq === i && (
                <p className="sans mt-3 text-sm text-gray-400 leading-relaxed border-t border-white/8 pt-3">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-500/5">
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&q=80"
            alt="Fête africaine, ambiance festive"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
          <div className="relative p-10 lg:p-16">
            <div className="lg:max-w-2xl">
              <p className="sans mb-3 text-xs uppercase tracking-widest text-orange-300">Prêt à commencer ?</p>
              <h2 className="serif text-4xl font-bold leading-tight">
                Lancez votre page d'invitation{" "}
                <span className="text-orange-400">dès aujourd'hui</span>
              </h2>
              <p className="sans mt-5 text-gray-300 leading-relaxed">
                Rejoignez des milliers d'organisateurs à Abidjan, Dakar, Douala et dans toute l'Afrique
                francophone qui font confiance à EventManager pour leurs événements.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="https://wa.me/22500000000"
                  className="sans inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-7 py-3.5 font-semibold text-white transition hover:bg-green-400"
                >
                  <span className="text-lg">💬</span> Nous contacter sur WhatsApp
                </a>
                <a
                  href="#how"
                  className="sans inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 font-semibold text-white transition hover:bg-white/5"
                >
                  En savoir plus
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between">
          <div className="sans flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500 text-black font-bold text-xs">E</div>
            <span className="text-sm font-semibold">Event<span className="text-orange-400">Manager</span></span>
          </div>
          <p className="sans text-xs text-gray-500">
            © 2026 EventManager · Abidjan, Côte d'Ivoire · Fait pour l'Afrique 🌍
          </p>
          <div className="sans flex gap-4 text-xs text-gray-500">
            <a href="#" className="hover:text-white transition">Confidentialité</a>
            <a href="#" className="hover:text-white transition">CGU</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

