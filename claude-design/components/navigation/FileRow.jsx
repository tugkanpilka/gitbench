import React from "react";
import { DiffStat } from "../core/DiffStat";

/** Sidebar changed-file row. Filename never truncates; the dir prefix does. */
export function FileRow({ dir = "", name, add, del, active = false, depth = null, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", height: "var(--gb-row-h)", padding: `0 9px 0 ${26 + (depth || 0) * 14}px`, borderRadius: "var(--gb-radius-row)", cursor: "default", userSelect: "none",
        background: active ? "var(--gb-row-sel)" : hov ? "var(--gb-hover)" : "transparent",
        fontFamily: "var(--gb-font-mono)", fontSize: "var(--gb-code-sm)", whiteSpace: "nowrap",
        transition: "background var(--gb-dur-quick) var(--gb-ease)" }}>
      {depth == null && <span style={{ color: "var(--gb-faint)", overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto", minWidth: 0 }}>{dir}</span>}
      <span style={{ color: active ? "var(--gb-text)" : "var(--gb-dim)", flex: "none", fontWeight: active ? 500 : 400 }}>{name}</span>
      <span style={{ flex: "1 0 8px" }}></span>
      <DiffStat add={add} del={del} size={10}></DiffStat>
    </div>
  );
}
