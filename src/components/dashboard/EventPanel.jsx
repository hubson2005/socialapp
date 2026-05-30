import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  ImagePlus,
  X,
  ChevronLeft,
  ChevronRight,
  Video,
  MapPin,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/supabase";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const MAX_SIZE_KB = 2000;
const MAX_VIDEO_SIZE_KB = 51200;

const isVideoUrl = (url) =>
  /\.(mp4|webm|ogg|mov|avi|mkv|quicktime)$/i.test(url || "");

// ─────────────────────────────────────────────────────────────
// Event Media Carousel
// ─────────────────────────────────────────────────────────────

function EventMediaCarousel({
  medias = [],
  onRemove,
  adminMode = false,
}) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  const urls = medias
    .map((m) => (typeof m === "string" ? m : m?.url))
    .filter(Boolean);

  const currentUrl = urls[current];
  const isVid = isVideoUrl(currentUrl);

  useEffect(() => {
    setCurrent(0);
  }, [urls.length]);

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
    <div
      style={{
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#000",
        width: "100%",
        minWidth: 0,
      }}
    >
      <AnimatePresence mode="wait">
        {isVid ? (
          <motion.video
            key={current}
            src={currentUrl}
            controls
            muted
            loop
            playsInline
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              width: "100%",
              aspectRatio: "16/9",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <motion.img
            key={current}
            src={currentUrl}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              width: "100%",
              aspectRatio: "16/9",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}
      </AnimatePresence>

      {isVid && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            background: "rgba(99,102,241,0.85)",
            borderRadius: "6px",
            padding: "2px 8px",
            fontSize: "10px",
            color: "white",
            fontWeight: 700,
          }}
        >
          ▶ Vidéo
        </div>
      )}

      {urls.length > 1 && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: adminMode ? "44px" : "8px",
            background: "rgba(0,0,0,0.55)",
            borderRadius: "6px",
            padding: "2px 8px",
            fontSize: "11px",
            color: "white",
            fontWeight: 600,
          }}
        >
          {current + 1}/{urls.length}
        </div>
      )}

      {adminMode && onRemove && (
        <button
          type="button"
          onClick={() => onRemove(current)}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.65)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={13} color="white" />
        </button>
      )}

      {urls.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              goTo((current - 1 + urls.length) % urls.length)
            }
            style={{
              position: "absolute",
              left: "6px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.45)",
              border: "none",
              borderRadius: "50%",
              width: "26px",
              height: "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={15} color="white" />
          </button>

          <button
            type="button"
            onClick={() => goTo((current + 1) % urls.length)}
            style={{
              position: "absolute",
              right: adminMode ? "40px" : "6px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.45)",
              border: "none",
              borderRadius: "50%",
              width: "26px",
              height: "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={15} color="white" />
          </button>
        </>
      )}

      {urls.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
            maxWidth: "90%",
          }}
        >
          {urls.map((u, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              style={{
                width: i === current ? "16px" : "5px",
                height: "5px",
                borderRadius: "3px",
                background: isVideoUrl(u)
                  ? i === current
                    ? "#a5b4fc"
                    : "rgba(165,180,252,0.4)"
                  : i === current
                  ? "white"
                  : "rgba(255,255,255,0.4)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Event Panel
// ─────────────────────────────────────────────────────────────

export default function EventPanel({
  localProfile,
  updateLocal,
  isActivated,
}) {
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const isMobile = useMediaQuery("(max-width: 640px)");

  const eventMedias = Array.isArray(localProfile.event_images)
    ? localProfile.event_images
    : localProfile.event_image_url
    ? [localProfile.event_image_url]
    : [];

  const videoCount = eventMedias.filter((u) =>
    isVideoUrl(typeof u === "string" ? u : u?.url)
  ).length;

  const imgCount = eventMedias.length - videoCount;

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    for (const file of files) {
      const isVid = file.type.startsWith("video/");

      if (
        file.size / 1024 >
        (isVid ? MAX_VIDEO_SIZE_KB : MAX_SIZE_KB)
      ) {
        toast.error(
          `${file.name} dépasse ${
            isVid ? "50 Mo" : "2 Mo"
          }`
        );

        e.target.value = "";
        return;
      }
    }

    setUploadingMedia(true);

    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const ext = file.name.split(".").pop();

          const pre = file.type.startsWith("video/")
            ? "event-video"
            : "event-img";

          const name = `${pre}-${localProfile.id}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;

          const { error } = await supabase.storage
            .from("avatars")
            .upload(name, file, {
              upsert: true,
            });

          if (error) throw error;

          const { data } = supabase.storage
            .from("avatars")
            .getPublicUrl(name);

          return data.publicUrl;
        })
      );

      const merged = [...eventMedias, ...urls];

      updateLocal({
        event_images: merged,
        event_image_url: merged[0],
      });

      toast.success(urls.length + " fichier(s) ajouté(s) !");
    } catch (err) {
      toast.error("Erreur : " + err.message);
    } finally {
      setUploadingMedia(false);
      e.target.value = "";
    }
  };

  const handleRemoveMedia = (idx) => {
    const updated = eventMedias.filter((_, i) => i !== idx);

    updateLocal({
      event_images: updated,
      event_image_url: updated[0] || null,
    });
  };

  const EVENT_COLOR_PRESETS = [
    { c1: "#ff6b35", c2: "#f7c948" },
    { c1: "#0ea5e9", c2: "#6366f1" },
    { c1: "#10b981", c2: "#065f46" },
    { c1: "#ec4899", c2: "#8b5cf6" },
    { c1: "#1e1b4b", c2: "#312e81" },
    { c1: "#ef4444", c2: "#b91c1c" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        maxWidth: "680px",
        minWidth: 0,
      }}
    >
      {/* HEADER */}
      <div>
        <h2
          style={{
            color: "white",
            fontSize: "18px",
            fontWeight: 800,
            margin: 0,
          }}
        >
          Mode Événement
        </h2>

        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "12px",
            margin: "4px 0 0",
          }}
        >
          Ajoutez des images ou vidéos de votre événement
        </p>
      </div>

      {/* INFOS EVENT */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          padding: isMobile ? "14px" : "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <input
          type="text"
          value={localProfile.event_name || ""}
          onChange={(e) =>
            updateLocal({
              event_name: e.target.value,
            })
          }
          placeholder="Nom de l'événement"
          style={{
            width: "100%",
            minWidth: 0,
            padding: "10px 12px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            color: "white",
            fontSize: "13px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "1fr 1fr",
            gap: "10px",
            width: "100%",
            minWidth: 0,
          }}
        >
          <input
            type="datetime-local"
            value={localProfile.event_date || ""}
            onChange={(e) =>
              updateLocal({
                event_date: e.target.value,
              })
            }
            style={{
              width: "100%",
              minWidth: 0,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              color: "white",
              fontSize: "13px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding: "10px 12px",
              width: "100%",
              minWidth: 0,
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <MapPin
              size={14}
              color="rgba(255,255,255,0.3)"
              style={{ flexShrink: 0 }}
            />

            <input
              type="text"
              value={localProfile.event_location || ""}
              onChange={(e) =>
                updateLocal({
                  event_location: e.target.value,
                })
              }
              placeholder="Lieu"
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "13px",
                outline: "none",
                flex: 1,
                width: "100%",
                minWidth: 0,
              }}
            />
          </div>
        </div>

        <textarea
          value={localProfile.event_description || ""}
          onChange={(e) =>
            updateLocal({
              event_description: e.target.value,
            })
          }
          placeholder="Description..."
          rows={3}
          style={{
            width: "100%",
            minWidth: 0,
            padding: "10px 12px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            color: "white",
            fontSize: "13px",
            outline: "none",
            resize: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* COLORS */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          padding: isMobile ? "14px" : "16px",
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {EVENT_COLOR_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() =>
                updateLocal({
                  event_color1: p.c1,
                  event_color2: p.c2,
                })
              }
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                background: `linear-gradient(135deg,${p.c1},${p.c2})`,
                border:
                  localProfile.event_color1 === p.c1
                    ? "3px solid white"
                    : "3px solid transparent",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* MEDIA */}
      <div
        style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "18px",
          padding: isMobile ? "14px" : "16px",
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <ImagePlus size={14} color="rgba(255,255,255,0.5)" />

          <span
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Médias
          </span>

          {imgCount > 0 && (
            <span
              style={{
                background: "rgba(255,255,255,0.12)",
                borderRadius: "6px",
                padding: "1px 6px",
                fontSize: "10px",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
              }}
            >
              🖼 {imgCount}
            </span>
          )}

          {videoCount > 0 && (
            <span
              style={{
                background: "rgba(99,102,241,0.3)",
                borderRadius: "6px",
                padding: "1px 6px",
                fontSize: "10px",
                color: "#a5b4fc",
                fontWeight: 600,
              }}
            >
              ▶ {videoCount}
            </span>
          )}
        </div>

        {eventMedias.length > 0 ? (
          <EventMediaCarousel
            medias={eventMedias}
            onRemove={handleRemoveMedia}
            adminMode
          />
        ) : (
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.04)",
              border: "2px dashed rgba(255,255,255,0.15)",
              borderRadius: "14px",
              padding: isMobile ? "20px" : "28px",
              cursor: "pointer",
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            {uploadingMedia ? (
              <Loader2
                size={20}
                color="rgba(99,102,241,0.8)"
                className="animate-spin"
              />
            ) : (
              <>
                <ImagePlus
                  size={18}
                  color="rgba(255,255,255,0.4)"
                />

                <p
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "13px",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  Ajouter images ou vidéos
                </p>
              </>
            )}

            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleMediaUpload}
              disabled={uploadingMedia}
            />
          </label>
        )}
      </div>
    </div>
  );
}

