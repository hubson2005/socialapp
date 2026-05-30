import { useState, useEffect } from "react";
import {
  CalendarDays,
  MapPin,
  Clock3,
  Image,
  Users,
  MessageCircle,
  QrCode,
  Plus,
  Eye,
  BarChart3,
} from "lucide-react";

export default function EventManager({ profileId }) {
  const [eventData, setEventData] = useState({
    title: "Mariage Sarah & Kevin",
    date: "12 Août 2026",
    location: "Sofitel Abidjan Hôtel Ivoire",
    description:
      "Nous serons heureux de vous compter parmi nous pour célébrer cette journée exceptionnelle.",
    whatsapp: "2250700000000",
  });

  const [gallery, setGallery] = useState([
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200&auto=format&fit=crop",
  ]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    guests: 1,
  });

  const [stats, setStats] = useState({
    scans: 0,
    confirmed: 0,
    views: 0,
    clicks: 0,
  });

  // VIEW COUNT
  useEffect(() => {
    setStats((prev) => ({
      ...prev,
      views: prev.views + 1,
    }));
  }, []);

  // RSVP WHATSAPP
  const handleRSVP = () => {
    if (!form.name || !form.phone) {
      alert("Veuillez remplir votre nom et téléphone.");
      return;
    }

    const cleanNumber = eventData.whatsapp.replace(/\D/g, "");

    const message = `
Bonjour 👋🏾

Je confirme ma présence à votre événement.

👤 Nom : ${form.name}
📞 Téléphone : ${form.phone}
👥 Nombre de personnes : ${form.guests}
`;

    const encodedMessage = encodeURIComponent(message);

    window.open(
      `https://wa.me/${cleanNumber}?text=${encodedMessage}`,
      "_blank"
    );

    setStats((prev) => ({
      ...prev,
      confirmed: prev.confirmed + 1,
      clicks: prev.clicks + 1,
    }));
  };

  // QUICK RSVP BUTTON
  const confirmPresence = () => {
    setStats((prev) => ({
      ...prev,
      confirmed: prev.confirmed + 1,
      clicks: prev.clicks + 1,
    }));

    const cleanNumber = eventData.whatsapp.replace(/\D/g, "");

    const message = encodeURIComponent(
      `Bonjour 👋🏾 Je confirme ma présence à ${eventData.title}`
    );

    window.open(
      `https://wa.me/${cleanNumber}?text=${message}`,
      "_blank"
    );
  };

  // IMAGE UPLOAD
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const imageUrl = URL.createObjectURL(file);

      setGallery((prev) => [...prev, imageUrl]);
    });
  };

  // IMAGE DELETE
  const removeImage = (indexToRemove) => {
    setGallery((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // DOWNLOAD QR CODE
  const downloadQRCode = async () => {
    try {
      setStats((prev) => ({
        ...prev,
        scans: prev.scans + 1,
      }));

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https://socialapp.work/event/${profileId}`;

      const response = await fetch(qrUrl);

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${eventData.title}-qr-code.png`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur téléchargement QR :", error);
      alert("Impossible de télécharger le QR Code.");
    }
  };

  return (
    <div className="min-h-screen bg-[#111215] text-white p-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarDays className="text-orange-500" />
            Event Premium Dashboard
          </h1>

          <p className="text-zinc-400 mt-2">
            Gérez votre événement, vos RSVP et vos invités depuis un seul
            dashboard.
          </p>
        </div>

        <button
          onClick={downloadQRCode}
          className="bg-orange-500 hover:bg-orange-600 transition px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
        >
          <QrCode size={18} />
          Télécharger QR Code
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<QrCode size={20} />}
          title="Scans QR"
          value={stats.scans}
        />

        <StatCard
          icon={<Users size={20} />}
          title="RSVP Confirmés"
          value={stats.confirmed}
        />

        <StatCard
          icon={<Eye size={20} />}
          title="Vues Profil"
          value={stats.views}
        />

        <StatCard
          icon={<BarChart3 size={20} />}
          title="Interactions"
          value={stats.clicks}
        />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* EVENT SETTINGS */}
        <div className="xl:col-span-2 bg-[#1a1c21] border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">
            Informations événement
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Nom événement
              </label>

              <input
                type="text"
                value={eventData.title}
                onChange={(e) =>
                  setEventData({
                    ...eventData,
                    title: e.target.value,
                  })
                }
                className="w-full bg-[#22252c] border border-white/10 rounded-xl px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Date événement
              </label>

              <input
                type="text"
                value={eventData.date}
                onChange={(e) =>
                  setEventData({
                    ...eventData,
                    date: e.target.value,
                  })
                }
                className="w-full bg-[#22252c] border border-white/10 rounded-xl px-4 py-3 outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm text-zinc-400 mb-2 block">
              Localisation
            </label>

            <input
              type="text"
              value={eventData.location}
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  location: e.target.value,
                })
              }
              className="w-full bg-[#22252c] border border-white/10 rounded-xl px-4 py-3 outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="text-sm text-zinc-400 mb-2 block">
              Description
            </label>

            <textarea
              rows="4"
              value={eventData.description}
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  description: e.target.value,
                })
              }
              className="w-full bg-[#22252c] border border-white/10 rounded-xl px-4 py-3 outline-none resize-none"
            />
          </div>

          <div className="mt-4">
            <label className="text-sm text-zinc-400 mb-2 block">
              Numéro WhatsApp RSVP
            </label>

            <input
              type="text"
              value={eventData.whatsapp}
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  whatsapp: e.target.value,
                })
              }
              className="w-full bg-[#22252c] border border-white/10 rounded-xl px-4 py-3 outline-none"
            />
          </div>
        </div>

        {/* LIVE PREVIEW */}
        <div className="bg-[#1a1c21] border border-white/10 rounded-2xl overflow-hidden">
          <div className="relative h-56 overflow-hidden">
            <img
              src={gallery[0]}
              alt="event"
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/40" />

            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-orange-500/90 inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-3">
                RSVP OUVERT
              </div>

              <h2 className="text-2xl font-bold">
                {eventData.title}
              </h2>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <Clock3 size={16} className="text-orange-500" />
              {eventData.date}
            </div>

            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <MapPin size={16} className="text-orange-500" />
              {eventData.location}
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">
              {eventData.description}
            </p>

            <button
              onClick={confirmPresence}
              className="w-full bg-orange-500 hover:bg-orange-600 transition rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              Confirmer ma présence
            </button>
          </div>
        </div>
      </div>

      {/* GALLERY */}
      <div className="mt-8 bg-[#1a1c21] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Image className="text-orange-500" />
              Galerie événement
            </h2>

            <p className="text-sm text-zinc-400 mt-1">
              Ajoutez plusieurs images pour votre profil public.
            </p>
          </div>

          <label className="bg-orange-500 hover:bg-orange-600 transition px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 text-sm font-semibold">
            <Plus size={16} />
            Ajouter images

            <input
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={handleImageUpload}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.map((img, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group"
            >
              <img
                src={img}
                alt="gallery"
                className="w-full h-full object-cover"
              />

              <button
                onClick={() => removeImage(index)}
                className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RSVP */}
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* FORM */}
        <div className="bg-[#1a1c21] border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            💌 RSVP WhatsApp
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nom complet"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              className="w-full bg-[#22252c] border border-white/10 rounded-xl px-4 py-3 outline-none"
            />

            <input
              type="tel"
              placeholder="Téléphone"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
              className="w-full bg-[#22252c] border border-white/10 rounded-xl px-4 py-3 outline-none"
            />

            <input
              type="number"
              placeholder="Nombre de personnes"
              value={form.guests}
              onChange={(e) =>
                setForm({
                  ...form,
                  guests: e.target.value,
                })
              }
              className="w-full bg-[#22252c] border border-white/10 rounded-xl px-4 py-3 outline-none"
            />

            <button
              onClick={handleRSVP}
              className="w-full bg-green-500 hover:bg-green-600 transition rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              Envoyer RSVP WhatsApp
            </button>
          </div>
        </div>

        {/* GUESTS */}
        <div className="bg-[#1a1c21] border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">
            🎟️ Invités récents
          </h2>

          <div className="space-y-4">
            {[
              {
                name: "Awa Traoré",
                guests: 2,
                status: "Confirmé",
              },
              {
                name: "Kevin Kouassi",
                guests: 4,
                status: "En attente",
              },
              {
                name: "Sarah Yao",
                guests: 1,
                status: "Confirmé",
              },
            ].map((guest, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-[#22252c] border border-white/10 rounded-xl px-4 py-3"
              >
                <div>
                  <h3 className="font-semibold">
                    {guest.name}
                  </h3>

                  <p className="text-sm text-zinc-400">
                    👥 {guest.guests} personne(s)
                  </p>
                </div>

                <div
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    guest.status === "Confirmé"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-orange-500/20 text-orange-400"
                  }`}
                >
                  {guest.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-[#1a1c21] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>

          <h3 className="text-3xl font-bold mt-2">
            {value}
          </h3>
        </div>

        <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

