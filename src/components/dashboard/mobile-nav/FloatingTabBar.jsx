import React from "react";
import { Lock } from "lucide-react";
import { T } from "./theme";

export default function FloatingTabBar({
  navRef,
  TAB_ITEMS,
  NAV_IDS,
  activeSection,
  drawerOpen,
  handleTab,
  isNavLocked,
}) {
  return (
    <nav
      ref={navRef}
      aria-label="Navigation principale"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(18px + env(safe-area-inset-bottom))",
        transform: "translateX(-50%)",
        zIndex: 38,

        width: "calc(100% - 28px)",
        maxWidth: 430,

        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",

        padding: 10,

        borderRadius: 24,

        background: "rgba(13,18,33,.92)",

        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",

        border: `1px solid ${T.border}`,

        boxShadow: T.shadow,
      }}
    >
      {TAB_ITEMS.map((item) => {
        const isMenu = item.id === NAV_IDS.MENU;

        const locked =
          !isMenu && isNavLocked(item.id);

        const active = isMenu
          ? drawerOpen
          : activeSection === item.id && !locked;

        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => handleTab(item.id)}
            style={{
              flex: 1,

              border: "none",

              background: active
                ? T.gradient
                : "transparent",

              borderRadius: 18,

              minHeight: 58,

              display: "flex",
              flexDirection: "column",

              alignItems: "center",

              justifyContent: "center",

              gap: 5,

              cursor: "pointer",

              transition: ".25s",

              transform: active
                ? "translateY(-4px)"
                : "none",

              opacity: locked ? .55 : 1,

              position: "relative",
            }}
          >
            {item.badge &&
              !locked &&
              !isMenu && (
                <div
                  style={{
                    position: "absolute",

                    top: 8,

                    right: 16,

                    width: 8,

                    height: 8,

                    borderRadius: 999,

                    background: T.success,

                    boxShadow:
                      "0 0 10px #22C55E",
                  }}
                />
              )}

            {locked ? (
              <Lock
                size={20}
                color="rgba(255,255,255,.40)"
              />
            ) : (
              <Icon
                size={22}
                color={
                  active
                    ? "#FFF"
                    : "rgba(255,255,255,.55)"
                }
              />
            )}

            <span
              style={{
                color: active
                  ? "#FFF"
                  : T.textMuted,

                fontSize: 10,

                fontWeight: active
                  ? 700
                  : 500,
              }}
            >
              {item.label}
            </span>

            {active && (
              <div
                style={{
                  position: "absolute",

                  bottom: 4,

                  width: 20,

                  height: 4,

                  borderRadius: 999,

                  background: "#FFF",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}