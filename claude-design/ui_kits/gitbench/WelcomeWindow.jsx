import React from "react";
import { Button } from "../../components/core/Button";

const RECENTS = [
  { id: "gitbench", name: "gitbench", path: "~/dev/gitbench", wts: 4, when: "2 dk önce" },
  { id: "storefront", name: "acme-storefront", path: "~/dev/acme-storefront", wts: 2, when: "dün" },
  { id: "infra", name: "infra-tools", path: "~/work/infra-tools", wts: 1, when: "3 gün önce" },
];

function RecentRow({ p, onOpen }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={() => onOpen(p)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: "var(--gb-radius-control)", cursor: "default",
        background: hov ? "var(--gb-hover)" : "transparent", transition: "background var(--gb-dur-quick) var(--gb-ease)" }}>
      <img src="../../assets/gitbench-icon.svg" width="30" height="30" alt="" style={{ borderRadius: 7, flex: "none" }}></img>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: "var(--gb-text-base)", fontWeight: 600, color: "var(--gb-text)" }}>{p.name}</span>
        <span style={{ fontSize: "var(--gb-text-xs)", color: "var(--gb-faint)", fontFamily: "var(--gb-font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flex: "none" }}>
        <span style={{ fontSize: "var(--gb-text-2xs)", color: "var(--gb-dim)" }}>{p.wts} worktree</span>
        <span style={{ fontSize: "var(--gb-text-2xs)", color: "var(--gb-faint)" }}>{p.when}</span>
      </div>
    </div>
  );
}

/** GitBench welcome window — project picker (the app has no auth). */
export function WelcomeWindow({ onOpen }) {
  const open = onOpen || (() => {});
  return (
    <div data-screen-label="Welcome" style={{ width: 780, height: 470, borderRadius: 12, overflow: "hidden", display: "flex", fontFamily: "var(--gb-font-ui)",
      boxShadow: "var(--gb-shadow-window)", outline: "1px solid var(--gb-window-edge)", outlineOffset: -1 }}>
      <div style={{ flex: "0 0 47%", background: "var(--gb-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", padding: "0 36px", boxSizing: "border-box" }}>
        <div style={{ position: "absolute", top: 18, left: 16, display: "flex", gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: 99, background: "var(--gb-traffic-red)", boxShadow: "var(--gb-shadow-traffic)" }}></span>
          <span style={{ width: 12, height: 12, borderRadius: 99, background: "var(--gb-traffic-yellow)", boxShadow: "var(--gb-shadow-traffic)" }}></span>
          <span style={{ width: 12, height: 12, borderRadius: 99, background: "var(--gb-traffic-green)", boxShadow: "var(--gb-shadow-traffic)" }}></span>
        </div>
        <img src="../../assets/gitbench-icon.svg" width="104" height="104" alt="GitBench"></img>
        <div style={{ fontSize: "var(--gb-text-xl)", fontWeight: 700, color: "var(--gb-text)", letterSpacing: "var(--gb-tracking-tight)", marginTop: 14 }}>GitBench</div>
        <div style={{ fontSize: "var(--gb-text-sm)", color: "var(--gb-faint)", marginTop: 3 }}>Sürüm 0.1.0 (önizleme)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 26, alignSelf: "stretch" }}>
          <Button icon="＋" onClick={() => open(RECENTS[0])}>Depo Aç…</Button>
          <Button icon="⌘" onClick={() => open(RECENTS[0])}>Depo Klonla…</Button>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, background: "var(--gb-sidebar)", backdropFilter: "var(--gb-vibrancy)", WebkitBackdropFilter: "var(--gb-vibrancy)", borderLeft: "1px solid var(--gb-sidebar-edge)", display: "flex", flexDirection: "column", padding: "16px 10px 10px", boxSizing: "border-box" }}>
        <div style={{ fontSize: "var(--gb-text-xs)", fontWeight: 600, color: "var(--gb-faint)", letterSpacing: "var(--gb-tracking-caps)", textTransform: "uppercase", padding: "0 12px 8px" }}>Son Açılanlar</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0 }}>
          {RECENTS.map((p) => <RecentRow key={p.id} p={p} onOpen={open}></RecentRow>)}
        </div>
        <div style={{ marginTop: "auto", padding: "12px 12px 4px", fontSize: "var(--gb-text-xs)", color: "var(--gb-faint)", textAlign: "center" }}>
          ya da bir klasörü buraya sürükle
        </div>
      </div>
    </div>
  );
}
