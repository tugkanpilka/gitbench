import React from "react";

/** macOS segmented control — e.g. Unified / Split diff toggle. */
export function SegmentedControl({ items, value, onChange, style }) {
  return (
    <div style={{ display: "flex", background: "var(--gb-control-bg)", borderRadius: "var(--gb-radius-control)", padding: 1.5, ...style }}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <span key={it.value} onClick={() => onChange && onChange(it.value)}
            style={{ fontFamily: "var(--gb-font-ui)", fontSize: "var(--gb-text-sm)", padding: "3.5px 12px", borderRadius: 5.5, cursor: "default", userSelect: "none",
              color: active ? "var(--gb-text)" : "var(--gb-dim)", fontWeight: 500,
              background: active ? "var(--gb-control-active)" : "transparent",
              boxShadow: active ? "var(--gb-shadow-seg)" : "none",
              transition: "background var(--gb-dur-quick) var(--gb-ease)" }}>
            {it.label}
          </span>
        );
      })}
    </div>
  );
}
