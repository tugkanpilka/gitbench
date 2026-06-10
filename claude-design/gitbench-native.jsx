// GitBench — Native macOS direction (D)
// Full-height vibrancy sidebar (traffic lights inside), NSToolbar, source-list
// selection pills, SF Pro / SF Mono system stacks, Xcode-ruhlu syntax.

const MAC_THEMES = {
  macLight: {
    label: "macOS Light",
    ui: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
    mono: "ui-monospace, 'SF Mono', Menlo, monospace",
    bg: "#ffffff", panel: "#f5f5f7", sidebar: "rgba(238,238,240,.62)",
    border: "#d9d9de", borderSoft: "#e8e8ec",
    text: "#1d1d1f", dim: "#6e6e73", faint: "#9b9ba1",
    accent: "#0a6ce8", accentBg: "rgba(10,108,232,.10)",
    selBg: "#0a6ce8", selText: "#ffffff",
    rowSel: "rgba(0,0,0,.07)",
    addBg: "#e9f6ec", addGutter: "#d3ebd8", addText: "#1e8a3c", addWord: "#c4e8cb",
    delBg: "#fdedec", delGutter: "#f6d6d3", delText: "#c5403a", delWord: "#f6d0cc",
    hunkBg: "#eef3fb", hunkText: "#5a76a8",
    gutterText: "#b3b3b9", lineHover: "rgba(0,0,0,.02)",
    syn: { kw: "#a13bb0", fn: "#3263c8", str: "#c43a31", num: "#2b3acb", cm: "#7a8793", ty: "#4a21b0", pr: "#0f7d72", pl: "#222226" },
    badgeBg: "rgba(0,0,0,.06)",
    light: true,
  },
  macDark: {
    label: "macOS Dark",
    ui: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
    mono: "ui-monospace, 'SF Mono', Menlo, monospace",
    bg: "#1f2025", panel: "#27282e", sidebar: "rgba(44,44,50,.55)",
    border: "#3a3a42", borderSoft: "#2c2d34",
    text: "#e8e8ed", dim: "#9a9aa2", faint: "#67676f",
    accent: "#2e8bff", accentBg: "rgba(46,139,255,.16)",
    selBg: "#2466d1", selText: "#ffffff",
    rowSel: "rgba(255,255,255,.09)",
    addBg: "rgba(82,196,118,.13)", addGutter: "rgba(82,196,118,.22)", addText: "#5fcb82", addWord: "rgba(82,196,118,.32)",
    delBg: "rgba(255,105,97,.12)", delGutter: "rgba(255,105,97,.20)", delText: "#ff7b72", delWord: "rgba(255,105,97,.30)",
    hunkBg: "#252a36", hunkText: "#7d90ba",
    gutterText: "#55555e", lineHover: "rgba(255,255,255,.02)",
    syn: { kw: "#ff7ab2", fn: "#6bb7ff", str: "#ff8a70", num: "#d9c97c", cm: "#7f8c98", ty: "#dabaff", pr: "#78c2b3", pl: "#dfdfe4" },
    badgeBg: "rgba(255,255,255,.08)",
  },
};

// ---- pieces --------------------------------------------------------------

function MacChevron({ open, c }) {
  return (
    <svg width="9" height="9" viewBox="0 0 8 8" style={{ flex: "none", transform: open ? "rotate(90deg)" : "none" }}>
      <path d="M2.5 1 L6 4 L2.5 7" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  );
}

function MacWorktreeRow({ t, w, sel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "5px 9px", borderRadius: 6, background: sel ? t.selBg : "transparent" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <MacChevron open={sel} c={sel ? "rgba(255,255,255,.85)" : t.dim}></MacChevron>
        <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? t.selText : t.text }}>{w.name}</span>
        <span style={{ flex: 1 }}></span>
        <span style={{ fontSize: 10.5, fontWeight: 500, color: sel ? "rgba(255,255,255,.9)" : t.dim, background: sel ? "rgba(255,255,255,.22)" : t.badgeBg, borderRadius: 99, padding: "1.5px 7px", fontVariantNumeric: "tabular-nums" }}>{w.files}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", paddingLeft: 16, gap: 8 }}>
        <span style={{ fontSize: 11, color: sel ? "rgba(255,255,255,.75)" : t.faint, fontFamily: t.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.branch}</span>
        <span style={{ flex: "1 0 6px" }}></span>
        <span style={{ fontSize: 10.5, color: sel ? "rgba(255,255,255,.75)" : t.faint }}>{w.when}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", paddingLeft: 16 }}>
        <span style={{ display: "inline-flex", gap: 6, fontFamily: t.mono, fontSize: 10.5, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ color: sel ? "#b8f0c5" : t.addText }}>+{w.add}</span>
          <span style={{ color: sel ? "#ffd1cc" : t.delText }}>−{w.del}</span>
        </span>
      </div>
    </div>
  );
}

function MacFileRow({ t, f, active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: 25, padding: "0 9px 0 26px", borderRadius: 5, background: active ? t.rowSel : "transparent", fontFamily: t.mono, fontSize: 11.5, whiteSpace: "nowrap" }}>
      <span style={{ color: t.faint, overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto", minWidth: 0 }}>{f.dir}</span>
      <span style={{ color: t.text, flex: "none" }}>{f.name}</span>
      <span style={{ flex: "1 0 8px" }}></span>
      <span style={{ display: "inline-flex", gap: 5, fontSize: 10, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: t.addText }}>+{f.add}</span>
        <span style={{ color: t.delText }}>−{f.del}</span>
      </span>
    </div>
  );
}

function MacTraffic() {
  return (
    <div style={{ display: "flex", gap: 8, flex: "none", padding: "18px 0 14px 16px" }}>
      <span style={{ width: 12, height: 12, borderRadius: 99, background: "#ff5f57", boxShadow: "inset 0 0 0 .5px rgba(0,0,0,.15)" }}></span>
      <span style={{ width: 12, height: 12, borderRadius: 99, background: "#febc2e", boxShadow: "inset 0 0 0 .5px rgba(0,0,0,.15)" }}></span>
      <span style={{ width: 12, height: 12, borderRadius: 99, background: "#28c840", boxShadow: "inset 0 0 0 .5px rgba(0,0,0,.15)" }}></span>
    </div>
  );
}

function MacSidebar({ t }) {
  return (
    <div style={{ width: 264, flex: "none", background: t.sidebar, backdropFilter: "blur(28px) saturate(1.6)", WebkitBackdropFilter: "blur(28px) saturate(1.6)", borderRight: `1px solid ${t.light ? "rgba(0,0,0,.10)" : "rgba(255,255,255,.07)"}`, display: "flex", flexDirection: "column", fontFamily: t.ui }}>
      <MacTraffic></MacTraffic>
      <div style={{ fontSize: 11, fontWeight: 600, color: t.faint, letterSpacing: ".02em", padding: "2px 18px 6px", textTransform: "uppercase" }}>Worktrees</div>
      <div style={{ padding: "0 9px", display: "flex", flexDirection: "column", gap: 2 }}>
        <MacWorktreeRow t={t} w={WORKTREES[0]} sel={true}></MacWorktreeRow>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "2px 0 8px" }}>
          {CHANGED_FILES.map((f, i) => <MacFileRow key={i} t={t} f={f} active={i === 0}></MacFileRow>)}
        </div>
        {WORKTREES.slice(1).map((w) => <MacWorktreeRow key={w.id} t={t} w={w} sel={false}></MacWorktreeRow>)}
      </div>
    </div>
  );
}

function MacSegmented({ t, items, active }) {
  return (
    <div style={{ display: "flex", background: t.light ? "rgba(0,0,0,.055)" : "rgba(255,255,255,.075)", borderRadius: 7, padding: 1.5 }}>
      {items.map((it) => (
        <span key={it} style={{ fontSize: 11.5, padding: "3.5px 12px", borderRadius: 5.5, color: it === active ? t.text : t.dim, background: it === active ? (t.light ? "#ffffff" : "#5a5a62") : "transparent", boxShadow: it === active ? "0 1px 2.5px rgba(0,0,0,.18), inset 0 0 0 .5px rgba(0,0,0,.04)" : "none", fontWeight: 500 }}>{it}</span>
      ))}
    </div>
  );
}

function MacToolbar({ t }) {
  return (
    <div style={{ height: 50, flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "0 16px", background: t.light ? "rgba(252,252,253,.9)" : "rgba(36,37,42,.9)", borderBottom: `1px solid ${t.border}`, fontFamily: t.ui }}>
      <svg width="17" height="14" viewBox="0 0 17 14" style={{ flex: "none", opacity: .55 }}>
        <rect x="0.5" y="0.5" width="16" height="13" rx="3" fill="none" stroke={t.text} strokeWidth="1.2"></rect>
        <line x1="6" y1="1" x2="6" y2="13" stroke={t.text} strokeWidth="1.2"></line>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.text, letterSpacing: "-0.01em" }}>auth-refactor</span>
        <span style={{ fontSize: 10.5, color: t.faint }}>gitbench — 8 changed files</span>
      </div>
      <span style={{ flex: 1 }}></span>
      <MacSegmented t={t} items={["Unified", "Split"]} active="Unified"></MacSegmented>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: t.light ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.07)", borderRadius: 7, padding: "4.5px 10px", width: 150 }}>
        <svg width="11" height="11" viewBox="0 0 12 12" style={{ opacity: .5 }}>
          <circle cx="5" cy="5" r="3.6" fill="none" stroke={t.text} strokeWidth="1.3"></circle>
          <line x1="7.8" y1="7.8" x2="10.6" y2="10.6" stroke={t.text} strokeWidth="1.3" strokeLinecap="round"></line>
        </svg>
        <span style={{ fontSize: 11.5, color: t.faint }}>Search</span>
      </div>
    </div>
  );
}

// Desktop backdrop + window (vibrancy needs something colorful behind it)
function MacWindow({ t }) {
  const desktop = t.light
    ? "radial-gradient(900px 600px at 18% 12%, #ffd9a8 0%, transparent 55%), radial-gradient(1000px 700px at 85% 25%, #ffb3c8 0%, transparent 60%), radial-gradient(1100px 800px at 50% 95%, #9ec5ff 0%, transparent 65%), #e8edf5"
    : "radial-gradient(900px 600px at 18% 12%, #4a3a78 0%, transparent 55%), radial-gradient(1000px 700px at 85% 25%, #7a3358 0%, transparent 60%), radial-gradient(1100px 800px at 50% 95%, #1f4d7a 0%, transparent 65%), #14151c";
  return (
    <div data-screen-label={`GitBench · ${t.label}`} style={{ width: 1320, height: 880, background: desktop, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 1240, height: 800, borderRadius: 11, overflow: "hidden", display: "flex", boxShadow: "0 30px 70px rgba(0,0,0,.45), 0 0 0 .5px rgba(0,0,0,.3)", outline: t.light ? "none" : "1px solid rgba(255,255,255,.12)", outlineOffset: -1 }}>
        <MacSidebar t={t}></MacSidebar>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: t.bg }}>
          <MacToolbar t={t}></MacToolbar>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <DiffFile t={t} file={DIFFS[0]} mode="classic"></DiffFile>
            <DiffFile t={t} file={DIFFS[1]} mode="classic"></DiffFile>
            <DiffFile t={t} file={DIFFS[2]} mode="classic" clip={3}></DiffFile>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MAC_THEMES, MacWindow, MacSidebar });
