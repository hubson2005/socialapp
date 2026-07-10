import React from "react";
import DrawerItem from "./DrawerItem";
import { NAV_LOCK } from "./constants";
import { T } from "./theme";

export default function DrawerSection({
  group,
  activeSection,
  isNavLocked,
  handleDrawerNav,
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      {/* Titre */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          paddingLeft: 6,
        }}
      >
        <div
          style={{
            width: 5,
            height: 18,
            borderRadius: 999,
            background: T.gradient,
          }}
        />

        <span
          style={{
            color: T.textGhost,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".14em",
            textTransform: "uppercase",
          }}
        >
          {group.label}
        </span>
      </div>

      {/* Items */}

      {group.items.map((item) => {
        const active = activeSection === item.id;

        const locked = isNavLocked(item.id);

        const lockPlan = NAV_LOCK[item.id];

        const lockColor =
          lockPlan === "business"
            ? "#F7C948"
            : "#FF8C00";

        const lockLabel =
          lockPlan === "business"
            ? "BUSINESS"
            : "PRO";

        return (
          <DrawerItem
            key={item.id}
            item={item}
            active={active}
            locked={locked}
            lockLabel={lockLabel}
            lockColor={lockColor}
            onClick={() => handleDrawerNav(item.id)}
          />
        );
      })}
    </div>
  );
}