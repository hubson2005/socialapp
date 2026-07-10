import React from "react";
import { Image, Loader2, LogOut, X } from "lucide-react";
import { T } from "./theme";

export default function DrawerFooter({
  onBgUpload,
  onBgRemove,
  bgImageUrl,
  uploadingBg,
  fileInputRef,
  handleFileChange,
  handleSignOut,
  userEmail,
  onSignOut,
}) {
  return (
    <div
      style={{
        padding: "20px",
        paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
        borderTop: `1px solid ${T.border}`,
        background: "rgba(255,255,255,.02)",
        backdropFilter: "blur(20px)",
        flexShrink: 0,
      }}
    >
      {onBgUpload && (
        <div
          style={{
            background: "rgba(255,255,255,.04)",
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: 16,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              color: "#FFF",
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 4,
            }}
          >
            Personnalisation
          </div>

          <div
            style={{
              color: T.textMuted,
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            Choisissez une image de fond.
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <label
              style={{
                flex: 1,
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                padding: "14px",
                borderRadius: 14,
                cursor: uploadingBg
                  ? "not-allowed"
                  : "pointer",
                background: T.gradient,
                color: "#FFF",
                fontWeight: 600,
              }}
            >
              {uploadingBg ? (
                <Loader2
                  size={18}
                  style={{
                    animation:
                      "mobile-nav-spin 1s linear infinite",
                  }}
                />
              ) : (
                <Image size={18} />
              )}

              {bgImageUrl
                ? "Changer le fond"
                : "Ajouter un fond"}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploadingBg}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "inherit",
                }}
              />
            </label>

            {bgImageUrl && (
              <button
                onClick={onBgRemove}
                disabled={uploadingBg}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  border: "none",
                  background: "rgba(239,68,68,.15)",
                  color: "#EF4444",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {onSignOut && (
        <div
          style={{
            background: "rgba(255,255,255,.04)",
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: 16,
          }}
        >
          {userEmail && (
            <div
              style={{
                color: T.textMuted,
                fontSize: 12,
                marginBottom: 14,
              }}
            >
              {userEmail}
            </div>
          )}

          <button
            onClick={handleSignOut}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              border: "none",
              background: "rgba(239,68,68,.15)",
              color: "#EF4444",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
            }}
          >
            <LogOut size={18} />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}