import React from "react";

function MenuItem({ it, onClose }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={(e) => { e.stopPropagation(); onClose && onClose(); it.onClick && it.onClick(); }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "4.5px 9px", borderRadius: 5.5, cursor: "default", userSelect: "none",
        background: hov ? "var(--gb-accent)" : "transparent",
        color: hov ? "#fff" : it.destructive ? "var(--gb-destructive)" : "var(--gb-text)",
        fontSize: "var(--gb-text-md)", transition: "background var(--gb-dur-fast) var(--gb-ease)" }}>
      <span style={{ flex: 1 }}>{it.label}</span>
      {it.hint && <span style={{ fontSize: "var(--gb-text-xs)", color: hov ? "rgba(255,255,255,.7)" : "var(--gb-faint)" }}>{it.hint}</span>}
    </div>
  );
}

/**
 * macOS context menu. Items: { label, hint?, destructive?, onClick? } or "—" separator.
 * Positions at x/y when given (fixed overlay); otherwise renders inline.
 */
export function ContextMenu({ items, x = null, y = null, onClose }) {
  const surface = (
    <div style={{ minWidth: 208, background: "var(--gb-surface-menu)", backdropFilter: "var(--gb-vibrancy)", WebkitBackdropFilter: "var(--gb-vibrancy)",
      borderRadius: "var(--gb-radius-menu)", padding: 4.5, boxShadow: "var(--gb-shadow-menu)", fontFamily: "var(--gb-font-ui)", boxSizing: "border-box" }}>
      {items.map((it, i) => it === "—" ? (
        <div key={i} style={{ height: 1, background: "var(--gb-row-sel)", margin: "4px 9px" }}></div>
      ) : (
        <MenuItem key={i} it={it} onClose={onClose}></MenuItem>
      ))}
    </div>
  );
  if (x == null || y == null) return surface;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose && onClose(); }}>
      <div style={{ position: "absolute", left: Math.min(x, window.innerWidth - 230), top: Math.min(y, window.innerHeight - items.length * 30 - 20) }}>
        {surface}
      </div>
    </div>
  );
}
