import React from "react";
import { DiffStat } from "../core/DiffStat";

/** Sticky file header above each diff section in the scroll stream. */
export function DiffFileHeader({ dir = "", name, add, del, collapsed = false, onToggle, sticky = true }) {
  return (
    <div onClick={onToggle}
      style={{ display: "flex", alignItems: "center", gap: 9, height: "var(--gb-file-header-h)", padding: "0 14px",
        background: "var(--gb-panel)", borderBottom: "1px solid var(--gb-border-soft)", borderTop: "1px solid var(--gb-border)",
        position: sticky ? "sticky" : "static", top: 0, zIndex: 2, cursor: onToggle ? "default" : "auto", userSelect: "none", boxSizing: "border-box" }}>
      <svg width="8" height="8" viewBox="0 0 8 8" style={{ flex: "none", transform: collapsed ? "none" : "rotate(90deg)", transition: "transform var(--gb-dur-base) var(--gb-ease)" }}>
        <path d="M2.5 1 L6 4 L2.5 7" fill="none" stroke="var(--gb-dim)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
      <span style={{ fontFamily: "var(--gb-font-mono)", fontSize: "var(--gb-code)" }}>
        <span style={{ color: "var(--gb-faint)" }}>{dir}</span>
        <span style={{ color: "var(--gb-text)", fontWeight: 500 }}>{name}</span>
      </span>
      <span style={{ flex: 1 }}></span>
      <DiffStat add={add} del={del} size={11}></DiffStat>
    </div>
  );
}
