import React from "react";
import { X, Crown } from "lucide-react";
import { T } from "./theme";

export default function DrawerHeader({
  profile,
  avatarInitial,
  userEmail,
  plan,
  currentOrder,
  maxPlanOrder,
  onClose,
}) {
  return (
    <>
      {/* Handle */}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: 14,
          paddingBottom: 8,
        }}
      >
        <div
          style={{
            width: 48,
            height: 5,
            borderRadius: 999,
            background: "rgba(255,255,255,.18)",
          }}
        />
      </div>

      <div
        style={{
          padding: 22,
          borderBottom: `1px solid ${T.border}`,
          background: "linear-gradient(180deg,#1A2238,#141B2E)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "center",
            }}
          >
            {/* Avatar */}

            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                overflow: "hidden",
                background: T.gradient,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#FFF",
                fontSize: 28,
                fontWeight: 800,
                boxShadow: "0 12px 30px rgba(88,101,242,.35)",
                flexShrink: 0,
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                avatarInitial
              )}
            </div>

            {/* Infos */}

            <div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#FFF",
                }}
              >
                {profile?.display_name || "Mon profil"}
              </div>

              {profile?.username && (
                <div
                  style={{
                    marginTop: 4,
                    color: T.textMuted,
                    fontSize: 13,
                  }}
                >
                  @{profile.username}
                </div>
              )}

              {userEmail && (
                <div
                  style={{
                    marginTop: 8,
                    color: T.textGhost,
                    fontSize: 12,
                  }}
                >
                  {userEmail}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 14,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    background: "rgba(88,101,242,.18)",
                    color: "#A5B4FC",
                    padding: "6px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {(plan || "FREE").toUpperCase()}
                </div>

                {currentOrder === maxPlanOrder && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(255,215,0,.12)",
                      color: "#FFD54A",
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <Crown size={12} />
                    PREMIUM
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Close */}

          <button
            onClick={onClose}
            style={{
              width: 46,
              height: 46,
              borderRadius: 16,
              background: "rgba(255,255,255,.05)",
              border: `1px solid ${T.border}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} color="rgba(255,255,255,.75)" />
          </button>

        </div>
      </div>
    </>
  );
}