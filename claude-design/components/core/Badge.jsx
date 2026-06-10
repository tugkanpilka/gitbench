import React from "react";

/** Count badge pill — file counts on worktree rows. Inverts on accent selection. */
export function Badge({ children, onSelection = false, style }) {
  return (
    <span style={{ fontFamily: "var(--gb-font-ui)", fontSize: "var(--gb-text-2xs)", fontWeight: 500,
      color: onSelection ? "rgba(255,255,255,.9)" : "var(--gb-dim)",
      background: onSelection ? "rgba(255,255,255,.22)" : "var(--gb-badge-bg)",
      borderRadius: "var(--gb-radius-full)", padding: "1.5px 7px", fontVariantNumeric: "tabular-nums", ...style }}>
      {children}
    </span>
  );
}
