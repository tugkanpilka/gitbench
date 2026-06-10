import React from "react";

/** Diff +/− stat pair. Always SF Mono, tabular, real minus sign. */
export function DiffStat({ add, del, size = 10.5, onSelection = false, style }) {
  return (
    <span style={{ display: "inline-flex", gap: 6, fontFamily: "var(--gb-font-mono)", fontSize: size, fontVariantNumeric: "tabular-nums", ...style }}>
      <span style={{ color: onSelection ? "#b8f0c5" : "var(--gb-add-text)" }}>+{add}</span>
      <span style={{ color: onSelection ? "#ffd1cc" : "var(--gb-del-text)" }}>−{del}</span>
    </span>
  );
}
