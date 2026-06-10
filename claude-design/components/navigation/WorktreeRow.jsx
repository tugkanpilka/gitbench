import React from "react";
import { Badge } from "../core/Badge";
import { DiffStat } from "../core/DiffStat";

/** Sidebar worktree row — source-list selection pill with branch + stats. */
export function WorktreeRow({ name, branch, files, add, del, when, selected = false, onClick, onMenu }) {
  const [hov, setHov] = React.useState(false);
  const openMenu = (e) => { e.preventDefault(); e.stopPropagation(); onMenu && onMenu(e.clientX, e.clientY); };
  return (
    <div onClick={onClick} onContextMenu={onMenu ? openMenu : undefined}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", flexDirection: "column", gap: 1, padding: "5px 9px", borderRadius: "var(--gb-radius-item)", cursor: "default", userSelect: "none",
        background: selected ? "var(--gb-sel-bg)" : hov ? "var(--gb-row-sel)" : "transparent",
        fontFamily: "var(--gb-font-ui)", transition: "background var(--gb-dur-quick) var(--gb-ease)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <svg width="9" height="9" viewBox="0 0 8 8" style={{ flex: "none", transform: selected ? "rotate(90deg)" : "none", transition: "transform var(--gb-dur-base) var(--gb-ease)" }}>
          <path d="M2.5 1 L6 4 L2.5 7" fill="none" stroke={selected ? "rgba(255,255,255,.85)" : "var(--gb-dim)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <span style={{ fontSize: "var(--gb-text-base)", fontWeight: selected ? 600 : 400, color: selected ? "var(--gb-sel-text)" : "var(--gb-text)" }}>{name}</span>
        <span style={{ flex: 1 }}></span>
        {hov && onMenu && (
          <span onClick={openMenu} title="Seçenekler" style={{ width: 18, height: 16, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", background: selected ? "rgba(255,255,255,.22)" : "var(--gb-badge-bg)" }}>
            <svg width="10" height="3" viewBox="0 0 10 3">{[1.5, 5, 8.5].map((cx) => <circle key={cx} cx={cx} cy="1.5" r="1.1" fill={selected ? "#fff" : "var(--gb-dim)"}></circle>)}</svg>
          </span>
        )}
        <Badge onSelection={selected}>{files}</Badge>
      </div>
      <div style={{ display: "flex", alignItems: "center", paddingLeft: 16, gap: 8 }}>
        <span style={{ fontSize: "var(--gb-text-xs)", color: selected ? "rgba(255,255,255,.75)" : "var(--gb-faint)", fontFamily: "var(--gb-font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{branch}</span>
        <span style={{ flex: "1 0 6px" }}></span>
        <span style={{ fontSize: "var(--gb-text-2xs)", color: selected ? "rgba(255,255,255,.75)" : "var(--gb-faint)" }}>{when}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", paddingLeft: 16 }}>
        <DiffStat add={add} del={del} onSelection={selected}></DiffStat>
      </div>
    </div>
  );
}
