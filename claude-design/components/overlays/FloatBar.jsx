import React from "react";

/**
 * Floating vibrancy pill that hovers over content (bottom of a pane).
 * GitBench has no top toolbar — controls live in these.
 */
export function FloatBar({ children, position = "center", style }) {
  const [hov, setHov] = React.useState(false);
  const pos = position === "left" ? { left: 14 } : position === "right" ? { right: 14 } : { left: "50%", transform: "translateX(-50%)" };
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position: "absolute", bottom: 14, zIndex: 10, ...pos,
        display: "flex", alignItems: "center", gap: 12, padding: "6px 8px 6px 14px", borderRadius: "var(--gb-radius-float)", fontFamily: "var(--gb-font-ui)",
        background: "var(--gb-surface-float)", backdropFilter: "var(--gb-vibrancy-float)", WebkitBackdropFilter: "var(--gb-vibrancy-float)",
        boxShadow: hov ? "var(--gb-shadow-float-hover)" : "var(--gb-shadow-float)",
        opacity: hov ? 1 : .92, transition: "opacity var(--gb-dur-base) var(--gb-ease), box-shadow var(--gb-dur-base) var(--gb-ease)", ...style }}>
      {children}
    </div>
  );
}

/** Thin vertical divider for use inside a FloatBar. */
export function FloatBarDivider() {
  return <span style={{ width: 1, height: 16, background: "var(--gb-row-sel)", flex: "none" }}></span>;
}
