import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  ImagePlus,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/supabase";
import useMediaQuery from "@/hooks/useMediaQuery";

const MAX_SIZE_KB       = 2000;
const MAX_VIDEO_SIZE_KB = 51200;

const isVideoUrl = (url) =>
  /\.(mp4|webm|ogg|mov|avi|mkv|quicktime)$/i.test(url || "");

// ─── EventMediaCarousel ───────────────────────────────────────────────────────
// Utilisé à la fois dans la zone d'édition (médias uploadés) et dans
// EventPreviewCard (aperçu public) — reste en overlay sombre volontaire
// (le média lui-même est souvent sombre/coloré, les contrôles doivent
// rester lisibles dessus quelle que soit l'image).
function EventMediaCarousel({ medias = [], onRemove, adminMode = false }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  const urls = medias
    .map((m) => (typeof m === "string" ? m : m?.url))
    .filter(Boolean);

  const currentUrl = urls[current];
  const isVid = isVideoUrl(currentUrl);

  useEffect(() => { setCurrent(0); }, [urls.length]);

  useEffect(() => {
    if (urls.length <= 1 || isVid) return;
    intervalRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % urls.length);
    }, 3500);
    return () => clearInterval(intervalRef.current);
  }, [urls.length, isVid]);

  const goTo = (idx) => {
    clearInterval(intervalRef.current);
    setCurrent(idx);
    if (!isVideoUrl(urls[idx])) {
      intervalRef.current = setInterval(() => {
        setCurrent((p) => (p + 1) % urls.length);
      }, 3500);
    }
  };

  if (!urls.length) return null;

  return (
    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "#000", width: "100%", minWidth: 0 }}>
      <AnimatePresence mode="wait">
        {isVid ? (
          <motion.video key={current} src={currentUrl} controls muted loop playsInline
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
        ) : (
          <motion.img key={current} src={currentUrl} alt=""
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
        )}
      </AnimatePresence>

      {isVid && (
        <div style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(99,102,241,0.85)", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", color: "white", fontWeight: 700 }}>
          ▶ Vidéo
        </div>
      )}

      {urls.length > 1 && (
        <div style={{ position: "absolute", top: "8px", right: adminMode ? "44px" : "8px", background: "rgba(0,0,0,0.55)", borderRadius: "6px", padding: "2px 8px", fontSize: "11px", color: "white", fontWeight: 600 }}>
          {current + 1}/{urls.length}
        </div>
      )}

      {adminMode && onRemove && (
        <button type="button" onClick={() => onRemove(current)} style={{ position: "absolute", top: "8px", right: "8px", width: "26px", height: "26px", borderRadius: "50%", background: "rgba(0,0,0,0.65)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={13} color="white" />
        </button>
      )}

      {urls.length > 1 && (
        <>
          <button type="button" onClick={() => goTo((current - 1 + urls.length) % urls.length)}
            style={{ position: "absolute", left: "6px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={15} color="white" />
          </button>
          <button type="button" onClick={() => goTo((current + 1) % urls.length)}
            style={{ position: "absolute", right: adminMode ? "40px" : "6px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronRight size={15} color="white" />
          </button>
        </>
      )}

      {urls.length > 1 && (
        <div style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "90%" }}>
          {urls.map((u, i) => (
            <button key={i} type="button" onClick={() => goTo(i)} style={{
              width: i === current ? "16px" : "5px", height: "5px", borderRadius: "3px",
              background: isVideoUrl(u)
                ? i === current ? "#a5b4fc" : "rgba(165,180,252,0.4)"
                : i === current ? "white"   : "rgba(255,255,255,0.4)",
              border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s", flexShrink: 0,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

const formatEventDate = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    let s = d.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch {
    return null;
  }
};

// ─── EventPreviewCard ──────────────────────────────────────────────────────
// Aperçu en direct de la carte événement telle qu'elle apparaîtra publiquement :
// se met à jour instantanément à chaque frappe/upload, sans appel réseau.
// [INCHANGÉ] Ce composant reproduit fidèlement la carte publique (dégradé
// coloré + texte blanc) — c'est un aperçu, pas une zone de contenu du
// dashboard : il doit rester tel qu'il apparaîtra sur le profil public,
// pas basculer vers le thème clair du dashboard.
function EventPreviewCard({ profile }) {
  const medias = Array.isArray(profile.event_images)
    ? profile.event_images
    : profile.event_image_url
    ? [profile.event_image_url]
    : [];

  const c1 = profile.event_color1 || "#ff6b35";
  const c2 = profile.event_color2 || "#f7c948";

  const name        = profile.event_name?.trim();
  const location     = profile.event_location?.trim();
  const description  = profile.event_description?.trim();
  const formattedDate = formatEventDate(profile.event_date);

  return (
    <div style={{
      borderRadius: "20px", overflow: "hidden", position: "relative",
      background: `linear-gradient(160deg, ${c1}, ${c2})`,
      boxShadow: "0 16px 40px -14px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.08) inset",
      border: "1px solid rgba(255,255,255,0.1)",
    }}>
      {medias.length > 0 ? (
        <EventMediaCarousel medias={medias} adminMode={false} />
      ) : (
        <div style={{
          aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.12)",
        }}>
          <CalendarDays size={30} color="rgba(255,255,255,0.4)" />
        </div>
      )}

      <div style={{
        padding: "16px 17px 18px",
        background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 100%)",
      }}>
        {name ? (
          <h3 style={{ color: "white", fontSize: "18px", fontWeight: 800, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.25 }}>
            {name}
          </h3>
        ) : (
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", fontStyle: "italic", margin: 0 }}>
            Nom de l'événement…
          </p>
        )}

        {formattedDate && (
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px", margin: "9px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={12} style={{ flexShrink: 0 }} /> {formattedDate}
          </p>
        )}

        {location && (
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px", margin: "6px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={12} style={{ flexShrink: 0 }} /> {location}
          </p>
        )}

        {description && (
          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "12px", margin: "11px 0 0", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── EventPanel ───────────────────────────────────────────────────────────────
// [FIX THÈME] La colonne d'édition (header, blocs infos/couleurs/médias,
// champs de saisie) était calquée sur l'ancien fond sombre du dashboard
// (rgba(255,255,255,0.0x) + texte blanc). Repassée en thème clair,
// cohérent avec le fond #f4f5fa désormais utilisé par le dashboard.
// EventPreviewCard (colonne de droite) reste inchangée — voir commentaire
// sur ce composant.
export default function EventPanel({ localProfile, updateLocal, isActivated }) {
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Ref unique sur l'input — déclenché depuis le header ET la zone vide
  const fileInputRef = useRef(null);

  const eventMedias = Array.isArray(localProfile.event_images)
    ? localProfile.event_images
    : localProfile.event_image_url
    ? [localProfile.event_image_url]
    : [];

  const videoCount = eventMedias.filter((u) => isVideoUrl(typeof u === "string" ? u : u?.url)).length;
  const imgCount   = eventMedias.length - videoCount;

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      const isVid = file.type.startsWith("video/");
      if (file.size / 1024 > (isVid ? MAX_VIDEO_SIZE_KB : MAX_SIZE_KB)) {
        toast.error(`${file.name} dépasse ${isVid ? "50 Mo" : "2 Mo"}`);
        e.target.value = "";
        return;
      }
    }

    setUploadingMedia(true);
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const ext  = file.name.split(".").pop();
          const pre  = file.type.startsWith("video/") ? "event-video" : "event-img";
          const name = `${pre}-${localProfile.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error } = await supabase.storage.from("avatars").upload(name, file, { upsert: true });
          if (error) throw error;
          const { data } = supabase.storage.from("avatars").getPublicUrl(name);
          return data.publicUrl;
        })
      );
      const merged = [...eventMedias, ...urls];
      updateLocal({ event_images: merged, event_image_url: merged[0] });
      toast.success(urls.length + " fichier(s) ajouté(s) !");
    } catch (err) {
      toast.error("Erreur : " + err.message);
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveMedia = (idx) => {
    const updated = eventMedias.filter((_, i) => i !== idx);
    updateLocal({ event_images: updated, event_image_url: updated[0] || null });
  };

  const EVENT_COLOR_PRESETS = [
    { c1: "#ff6b35", c2: "#f7c948" },
    { c1: "#0ea5e9", c2: "#6366f1" },
    { c1: "#10b981", c2: "#065f46" },
    { c1: "#ec4899", c2: "#8b5cf6" },
    { c1: "#1e1b4b", c2: "#312e81" },
    { c1: "#ef4444", c2: "#b91c1c" },
  ];

  const inputStyle = {
    width: "100%", minWidth: 0, padding: "10px 12px",
    background: "#f6f7fb", border: "1px solid #e6e8f0",
    borderRadius: "10px", color: "#161a2e", fontSize: "13px", outline: "none",
    boxSizing: "border-box",
  };

  const previewLabelStyle = {
    color: "#8a90a2", fontSize: "10.5px", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 9px",
    display: "flex", alignItems: "center", gap: "6px",
  };

  const previewBlock = (
    <div style={{ width: "100%", minWidth: 0 }}>
      <p style={previewLabelStyle}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
        Aperçu en direct
      </p>
      <EventPreviewCard profile={localProfile} />
    </div>
  );

  return (
    <div style={{
      display: "flex", flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "18px" : "22px",
      width: "100%", maxWidth: isMobile ? "680px" : "1000px",
      alignItems: "flex-start", minWidth: 0,
    }}>

      {/* ── Colonne édition ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", minWidth: 0, flex: isMobile ? "none" : "1 1 auto" }}>

        {/* Header */}
        <div>
          <h2 style={{ color: "#161a2e", fontSize: "18px", fontWeight: 800, margin: 0 }}>Mode Événement</h2>
          <p style={{ color: "#8a90a2", fontSize: "12px", margin: "4px 0 0" }}>
            Ajoutez des images ou vidéos de votre événement
          </p>
        </div>

        {/* Aperçu — affiché ici sur mobile, juste sous le header, pour rester visible sans scroller */}
        {isMobile && previewBlock}

        {/* Infos événement */}
        <div style={{ background: "#ffffff", border: "1px solid #e6e8f0", borderRadius: "18px", padding: isMobile ? "14px" : "16px", display: "flex", flexDirection: "column", gap: "12px", width: "100%", minWidth: 0, overflow: "hidden", boxSizing: "border-box", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
          <input type="text" value={localProfile.event_name || ""} onChange={(e) => updateLocal({ event_name: e.target.value })} placeholder="Nom de l'événement" style={inputStyle} />

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px", width: "100%", minWidth: 0 }}>
            <input type="datetime-local" value={localProfile.event_date || ""} onChange={(e) => updateLocal({ event_date: e.target.value })} style={inputStyle} />

            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f6f7fb", border: "1px solid #e6e8f0", borderRadius: "10px", padding: "10px 12px", width: "100%", minWidth: 0, overflow: "hidden", boxSizing: "border-box" }}>
              <MapPin size={14} color="#9095a5" style={{ flexShrink: 0 }} />
              <input type="text" value={localProfile.event_location || ""} onChange={(e) => updateLocal({ event_location: e.target.value })} placeholder="Lieu" style={{ background: "transparent", border: "none", color: "#161a2e", fontSize: "13px", outline: "none", flex: 1, width: "100%", minWidth: 0 }} />
            </div>
          </div>

         <textarea value={localProfile.event_description || ""} onChange={(e) => updateLocal({ event_description: e.target.value })} placeholder="Description..." rows={3} style={{ ...inputStyle, resize: "none" }} />

          {/* Lien de réservation externe (Calendly, Wave, formulaire, etc.) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f6f7fb", border: "1px solid #e6e8f0", borderRadius: "10px", padding: "10px 12px", width: "100%", minWidth: 0, overflow: "hidden", boxSizing: "border-box" }}>
            <Calendar size={14} color="#9095a5" style={{ flexShrink: 0 }} />
            <input
              type="url"
              value={localProfile.event_booking_url || ""}
              onChange={(e) => updateLocal({ event_booking_url: e.target.value })}
              placeholder="Lien de réservation (https://...)"
              style={{ background: "transparent", border: "none", color: "#161a2e", fontSize: "13px", outline: "none", flex: 1, width: "100%", minWidth: 0 }}
            />
          </div>
        </div>

        {/* Couleurs */}
        <div style={{ background: "#ffffff", border: "1px solid #e6e8f0", borderRadius: "18px", padding: isMobile ? "14px" : "16px", width: "100%", minWidth: 0, overflow: "hidden", boxSizing: "border-box", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {EVENT_COLOR_PRESETS.map((p, i) => (
              <button key={i} onClick={() => updateLocal({ event_color1: p.c1, event_color2: p.c2 })} style={{
                width: "32px", height: "32px", borderRadius: "9px",
                background: `linear-gradient(135deg,${p.c1},${p.c2})`,
                border: localProfile.event_color1 === p.c1 ? "3px solid #6366f1" : "3px solid transparent",
                boxShadow: localProfile.event_color1 === p.c1 ? "0 0 0 1px rgba(99,102,241,0.25)" : "none",
                cursor: "pointer", flexShrink: 0,
              }} />
            ))}
          </div>
        </div>

        {/* ── Médias ── */}
        <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "18px", padding: isMobile ? "14px" : "16px", width: "100%", minWidth: 0, overflow: "hidden", boxSizing: "border-box" }}>

          {/* Header médias — bouton "+" toujours à droite */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <ImagePlus size={14} color="#6b7280" />
            <span style={{ color: "#454b5a", fontSize: "12px", fontWeight: 600 }}>Médias</span>

            {imgCount > 0 && (
              <span style={{ background: "#eef0f5", borderRadius: "6px", padding: "1px 6px", fontSize: "10px", color: "#454b5a", fontWeight: 600 }}>
                🖼 {imgCount}
              </span>
            )}
            {videoCount > 0 && (
              <span style={{ background: "rgba(99,102,241,0.18)", borderRadius: "6px", padding: "1px 6px", fontSize: "10px", color: "#4338ca", fontWeight: 600 }}>
                ▶ {videoCount}
              </span>
            )}

            {/* Bouton "+ Ajouter" — toujours visible, aligné à droite */}
            <button
              type="button"
              disabled={uploadingMedia}
              onClick={() => fileInputRef.current?.click()}
              style={{
                marginLeft: "auto",
                display: "flex", alignItems: "center", gap: "5px",
                padding: "5px 10px",
                background: "rgba(99,102,241,0.14)",
                border: "1px solid rgba(99,102,241,0.35)",
                borderRadius: "8px",
                color: "#4338ca",
                fontSize: "11px", fontWeight: 700,
                cursor: uploadingMedia ? "wait" : "pointer",
                opacity: uploadingMedia ? 0.6 : 1,
                transition: "all .15s",
                flexShrink: 0,
              }}
            >
              {uploadingMedia
                ? <Loader2 size={11} className="animate-spin" />
                : <Plus size={11} />
              }
              {uploadingMedia ? "Envoi…" : "Ajouter"}
            </button>
          </div>

          {/* Input unique — déclenché par ref depuis le header et la zone vide */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            style={{ display: "none" }}
            onChange={handleMediaUpload}
            disabled={uploadingMedia}
          />

          {/* Carousel si médias existants */}
          {eventMedias.length > 0 && (
            <EventMediaCarousel medias={eventMedias} onRemove={handleRemoveMedia} adminMode />
          )}

          {/* Zone vide — clique aussi sur l'input via le ref */}
          {eventMedias.length === 0 && (
            <div
              onClick={() => !uploadingMedia && fileInputRef.current?.click()}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                background: "#f9fafc",
                border: "2px dashed #dde0ea",
                borderRadius: "14px",
                padding: isMobile ? "20px" : "28px",
                cursor: uploadingMedia ? "wait" : "pointer",
                opacity: uploadingMedia ? 0.7 : 1,
                userSelect: "none",
              }}
            >
              {uploadingMedia ? (
                <Loader2 size={20} color="#6366f1" className="animate-spin" />
              ) : (
                <>
                  <ImagePlus size={18} color="#a2a7b5" />
                  <p style={{ color: "#8a90a2", fontSize: "12px", margin: 0, textAlign: "center" }}>
                    Cliquez ou utilisez le bouton Ajouter
                  </p>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── Colonne aperçu — desktop uniquement, reste visible pendant le scroll ── */}
      {!isMobile && (
        <div style={{ width: "300px", flexShrink: 0, position: "sticky", top: "20px" }}>
          {previewBlock}
        </div>
      )}

    </div>
  );
}