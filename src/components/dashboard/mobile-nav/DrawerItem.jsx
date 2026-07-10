import React from "react";
import { ChevronRight, Lock } from "lucide-react";
import { T } from "./theme";

export default function DrawerItem({
  item,
  active,
  locked,
  lockLabel,
  lockColor,
  onClick,
}) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,

        padding: "14px 16px",

        marginBottom: 10,

        border: "none",
        borderRadius: 18,

        cursor: "pointer",

        transition: "all .25s ease",

        background: active
          ? T.gradient
          : "rgba(255,255,255,.03)",

        color: "#FFF",

        boxShadow: active
          ? "0 12px 30px rgba(88,101,242,.25)"
          : "none",

        opacity: locked ? .65 : 1,
      }}
    >
      {/* Icône */}

      <div
        style={{
          width: 46,
          height: 46,

          borderRadius: 14,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          background: active
            ? "rgba(255,255,255,.18)"
            : "rgba(255,255,255,.05)",

          flexShrink: 0,
        }}
      >
        {locked ? (
          <Lock size={18} color="rgba(255,255,255,.5)" />
        ) : (
          <Icon size={20} color="#FFF" />
        )}
      </div>

      {/* Texte */}

      <div
        style={{
          flex: 1,
          textAlign: "left",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: "#FFF",
          }}
        >
          {item.label}
        </div>

        {item.description && (
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: T.textMuted,
            }}
          >
            {item.description}
          </div>
        )}
      </div>

      {/* Badge */}

      {locked ? (
        <div
          style={{
            padding: "5px 10px",

            borderRadius: 999,

            background: `${lockColor}20`,
            border: `1px solid ${lockColor}55`,

            color: lockColor,

            fontSize: 10,

            fontWeight: 700,

            letterSpacing: ".05em",
          }}
        >
          {lockLabel}
        </div>
      ) : item.badge ? (
        <div
          style={{
            background: "#22C55E",
            color: "#FFF",

            padding: "5px 10px",

            borderRadius: 999,

            fontSize: 10,

            fontWeight: 700,
          }}
        >
          {item.badge}
        </div>
      ) : (
        <ChevronRight
          size={16}
          color="rgba(255,255,255,.30)"
        />
      )}
    </button>
  );
}