// GitBench prototype — interactive app shell (sidebar, toolbar, scroll-spy, tweaks)
// Depends on: gitbench-native.jsx (MAC_THEMES), gitbench-proto-data.jsx (PROTO_WORKTREES),
// gitbench-proto-diff.jsx (ProtoFileSection), tweaks-panel.jsx

const { useState, useRef, useEffect, useMemo, useCallback } = React;

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const GB_ACCENTS = ["#0a6ce8", "#953d96", "#f7821b", "#48a54c"];

const GB_MONOS = {
  "SF Mono (system)": "ui-monospace, 'SF Mono', Menlo, monospace",
  "JetBrains Mono": "'JetBrains Mono', monospace",
  "Geist Mono": "'Geist Mono', monospace",
};

// ---- persisted UI state ---------------------------------------------------
const GB_LS_KEY = "gitbench_proto_v1";
function loadUiState() {
  try { return JSON.parse(localStorage.getItem(GB_LS_KEY)) || {}; } catch (e) { return {}; }
}

// ---- sidebar pieces -------------------------------------------------------

function PChevron({ open, c }) {
  return (
    <svg width="9" height="9" viewBox="0 0 8 8" style={{ flex: "none", transform: open ? "rotate(90deg)" : "none", transition: "transform .15s ease" }}>
      <path d="M2.5 1 L6 4 L2.5 7" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  );
}

function PWorktreeRow({ t, w, sel, onClick, onMenu }) {
  const [hov, setHov] = useState(false);
  const openMenu = (e) => { e.preventDefault(); e.stopPropagation(); onMenu && onMenu(e.clientX, e.clientY, w); };
  return (
    <div onClick={onClick} onContextMenu={openMenu} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", flexDirection: "column", gap: 1, padding: "5px 9px", borderRadius: 6, cursor: "default", background: sel ? t.selBg : hov ? t.rowSel : "transparent", transition: "background .12s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <PChevron open={sel} c={sel ? "rgba(255,255,255,.85)" : t.dim}></PChevron>
        <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? t.selText : t.text }}>{w.name}</span>
        <span style={{ flex: 1 }}></span>
        {hov && onMenu && (
          <span onClick={openMenu} title="Seçenekler" style={{ width: 18, height: 16, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", background: sel ? "rgba(255,255,255,.22)" : t.badgeBg }}>
            <svg width="10" height="3" viewBox="0 0 10 3">{[1.5, 5, 8.5].map((cx) => <circle key={cx} cx={cx} cy="1.5" r="1.1" fill={sel ? "#fff" : t.dim}></circle>)}</svg>
          </span>
        )}
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

function PFileRow({ t, f, active, depth, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", height: 25, padding: `0 9px 0 ${26 + (depth || 0) * 14}px`, borderRadius: 5, cursor: "default", background: active ? t.rowSel : hov ? (t.light ? "rgba(0,0,0,.04)" : "rgba(255,255,255,.05)") : "transparent", fontFamily: t.mono, fontSize: 11.5, whiteSpace: "nowrap", transition: "background .1s ease" }}>
      {depth == null && <span style={{ color: t.faint, overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto", minWidth: 0 }}>{f.dir}</span>}
      <span style={{ color: active ? t.text : t.dim, flex: "none", fontWeight: active ? 500 : 400 }}>{f.name}</span>
      <span style={{ flex: "1 0 8px" }}></span>
      <span style={{ display: "inline-flex", gap: 5, fontSize: 10, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: t.addText }}>+{f.add}</span>
        <span style={{ color: t.delText }}>−{f.del}</span>
      </span>
    </div>
  );
}

// Build folder tree from flat list
function buildTree(files) {
  const root = { dirs: {}, files: [] };
  files.forEach((f, idx) => {
    const parts = f.dir.split("/").filter(Boolean);
    let node = root;
    for (const p of parts) {
      node.dirs[p] = node.dirs[p] || { dirs: {}, files: [] };
      node = node.dirs[p];
    }
    node.files.push({ ...f, idx });
  });
  return root;
}

function PTreeFolder({ t, name, node, depth, activeIdx, onPick }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 6, height: 24, padding: `0 9px 0 ${26 + depth * 14}px`, cursor: "default", borderRadius: 5 }}>
        <PChevron open={open} c={t.faint}></PChevron>
        <span style={{ fontSize: 12, color: t.dim, fontFamily: t.ui, fontWeight: 500 }}>{name}</span>
      </div>
      {open && <PTreeNode t={t} node={node} depth={depth + 1} activeIdx={activeIdx} onPick={onPick}></PTreeNode>}
    </div>
  );
}

function PTreeNode({ t, node, depth, activeIdx, onPick }) {
  return (
    <div>
      {Object.entries(node.dirs).map(([name, child]) => (
        <PTreeFolder key={name} t={t} name={name} node={child} depth={depth} activeIdx={activeIdx} onPick={onPick}></PTreeFolder>
      ))}
      {node.files.map((f) => (
        <PFileRow key={f.dir + f.name} t={t} f={f} depth={depth} active={f.idx === activeIdx} onClick={() => onPick(f.idx)}></PFileRow>
      ))}
    </div>
  );
}

function PListToggle({ t, mode, onChange }) {
  return (
    <div style={{ display: "flex", gap: 2, background: t.badgeBg, borderRadius: 5, padding: 1.5 }}>
      {["flat", "tree"].map((m) => (
        <span key={m} onClick={() => onChange(m)} style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".03em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, cursor: "default", color: m === mode ? t.text : t.faint, background: m === mode ? (t.light ? "#ffffff" : "#5a5a62") : "transparent", boxShadow: m === mode ? "0 1px 2px rgba(0,0,0,.15)" : "none" }}>{m === "flat" ? "Düz" : "Ağaç"}</span>
      ))}
    </div>
  );
}

function PSidebar({ t, wts, sel, onSelect, activeIdx, onPickFile, listMode, open, onWtMenu, project, onProjMenu }) {
  const selWt = wts.find((w) => w.id === sel);
  const tree = useMemo(() => (selWt ? buildTree(selWt.filesList) : null), [selWt]);
  return (
    <div style={{ width: open ? 264 : 0, flex: "none", overflow: "hidden", transition: "width .22s ease", display: "flex", minHeight: 0 }}>
    <div style={{ width: 264, flex: "none", background: t.sidebar, backdropFilter: "blur(28px) saturate(1.6)", WebkitBackdropFilter: "blur(28px) saturate(1.6)", borderRight: `1px solid ${t.light ? "rgba(0,0,0,.10)" : "rgba(255,255,255,.07)"}`, display: "flex", flexDirection: "column", fontFamily: t.ui, minHeight: 0 }}>
      <div style={{ display: "flex", gap: 8, flex: "none", padding: "18px 0 14px 16px" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: 99, background: c, boxShadow: "inset 0 0 0 .5px rgba(0,0,0,.15)" }}></span>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 12px 6px 18px" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: t.faint, letterSpacing: ".02em", textTransform: "uppercase" }}>{project ? project.name : "Worktrees"}</span>
        {project && (
          <span onClick={(e) => { e.stopPropagation(); onProjMenu && onProjMenu(e.clientX, e.clientY); }} title="Proje seçenekleri" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 14, borderRadius: 4, background: t.badgeBg }}>
            <svg width="7" height="5" viewBox="0 0 8 5"><path d="M1 1 L4 4 L7 1" fill="none" stroke={t.dim} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          </span>
        )}
      </div>
      <div style={{ padding: "0 9px 64px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0 }}>
        {wts.map((w) => (
          <React.Fragment key={w.id}>
            <PWorktreeRow t={t} w={w} sel={w.id === sel} onClick={() => onSelect(w.id)} onMenu={onWtMenu}></PWorktreeRow>
            {w.id === sel && (
              <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "2px 0 8px" }}>
                {listMode === "flat"
                  ? w.filesList.map((f, i) => <PFileRow key={f.dir + f.name} t={t} f={f} active={i === activeIdx} onClick={() => onPickFile(i)}></PFileRow>)
                  : <PTreeNode t={t} node={tree} depth={0} activeIdx={activeIdx} onPick={onPickFile}></PTreeNode>}
              </div>
            )}
          </React.Fragment>
        ))}
        {wts.length === 0 && (
          <div style={{ padding: "22px 14px", fontSize: 11.5, color: t.faint, textAlign: "center", lineHeight: 1.5 }}>Bu projede worktree kalmadı.<br></br>Terminalden <span style={{ fontFamily: t.mono }}>git worktree add</span> ile ekleyebilirsin.</div>
        )}
      </div>
    </div>
    </div>
  );
}

// Floating pill over the bottom of the sidebar: sidebar toggle + flat/tree switch
function PSidebarFloatBar({ t, open, onOpen, listMode, onListMode }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position: "absolute", bottom: 14, left: open ? 132 : 14, transform: open ? "translateX(-50%)" : "none", zIndex: 11,
        display: "flex", alignItems: "center", gap: 8, padding: "5px 7px", borderRadius: 10, fontFamily: t.ui,
        background: t.light ? "rgba(250,250,251,.78)" : "rgba(40,41,46,.78)",
        backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        boxShadow: hov ? "0 10px 32px rgba(0,0,0,.32), 0 0 0 .5px rgba(0,0,0,.22)" : "0 5px 18px rgba(0,0,0,.22), 0 0 0 .5px rgba(0,0,0,.18)",
        outline: t.light ? "none" : "1px solid rgba(255,255,255,.10)", outlineOffset: -1,
        opacity: hov ? 1 : .92, transition: "opacity .15s ease, box-shadow .15s ease, background .2s ease" }}>
      <div onClick={() => onOpen(!open)} title={open ? "Sidebar'ı gizle" : "Sidebar'ı göster"}
        style={{ width: 26, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default", background: t.light ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.07)" }}>
        <svg width="15" height="12" viewBox="0 0 17 14" style={{ opacity: .65 }}>
          <rect x="0.5" y="0.5" width="16" height="13" rx="3" fill="none" stroke={t.text} strokeWidth="1.2"></rect>
          <line x1="6" y1="1" x2="6" y2="13" stroke={t.text} strokeWidth="1.2"></line>
          {open && <rect x="1.5" y="1.5" width="3.6" height="11" rx="1.6" fill={t.text} opacity=".45"></rect>}
        </svg>
      </div>
      {open && <PListToggle t={t} mode={listMode} onChange={onListMode}></PListToggle>}
    </div>
  );
}

// ---- toolbar --------------------------------------------------------------

function PSegmented({ t, items, active, onChange }) {
  return (
    <div style={{ display: "flex", background: t.light ? "rgba(0,0,0,.055)" : "rgba(255,255,255,.075)", borderRadius: 7, padding: 1.5 }}>
      {items.map((it) => (
        <span key={it.v} onClick={() => onChange(it.v)} style={{ fontSize: 11.5, padding: "3.5px 12px", borderRadius: 5.5, cursor: "default", color: it.v === active ? t.text : t.dim, background: it.v === active ? (t.light ? "#ffffff" : "#5a5a62") : "transparent", boxShadow: it.v === active ? "0 1px 2.5px rgba(0,0,0,.18), inset 0 0 0 .5px rgba(0,0,0,.04)" : "none", fontWeight: 500, transition: "background .12s ease" }}>{it.label}</span>
      ))}
    </div>
  );
}

function PThemeToggle({ t, light, onChange }) {
  return (
    <div onClick={() => onChange(!light)} title="Tema değiştir" style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default", background: t.light ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.07)" }}>
      {light ? (
        <svg width="13" height="13" viewBox="0 0 14 14"><circle cx="7" cy="7" r="3" fill="none" stroke={t.dim} strokeWidth="1.4"></circle>{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (<line key={a} x1="7" y1="0.8" x2="7" y2="2.4" stroke={t.dim} strokeWidth="1.3" strokeLinecap="round" transform={`rotate(${a} 7 7)`}></line>))}</svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 14 14"><path d="M11.5 8.6 A5 5 0 1 1 5.4 2.5 A4 4 0 0 0 11.5 8.6 Z" fill="none" stroke={t.dim} strokeWidth="1.4" strokeLinejoin="round"></path></svg>
      )}
    </div>
  );
}

// Floating control bar — hovers over the bottom of the diff pane.
// Rests as a compact pill; brightens on hover.
function PFloatBar({ t, wt, view, onView, light, onLight }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position: "absolute", bottom: 14, left: "50%", transform: `translateX(-50%) translateY(${hov ? 0 : 2}px)`, zIndex: 10,
        display: "flex", alignItems: "center", gap: 12, padding: "6px 8px 6px 14px", borderRadius: 11, fontFamily: t.ui,
        background: t.light ? "rgba(250,250,251,.78)" : "rgba(40,41,46,.78)",
        backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        boxShadow: hov ? "0 10px 32px rgba(0,0,0,.32), 0 0 0 .5px rgba(0,0,0,.22)" : "0 5px 18px rgba(0,0,0,.22), 0 0 0 .5px rgba(0,0,0,.18)",
        outline: t.light ? "none" : "1px solid rgba(255,255,255,.10)", outlineOffset: -1,
        opacity: hov ? 1 : .92, transition: "opacity .15s ease, box-shadow .15s ease, transform .15s ease, background .2s ease" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, whiteSpace: "nowrap" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: t.text, letterSpacing: "-0.01em" }}>{wt.name}</span>
        <span style={{ fontSize: 10.5, color: t.faint }}>{wt.filesList.length} dosya</span>
        <span style={{ display: "inline-flex", gap: 5, fontFamily: t.mono, fontSize: 10.5, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ color: t.addText }}>+{wt.add}</span>
          <span style={{ color: t.delText }}>−{wt.del}</span>
        </span>
      </div>
      <span style={{ width: 1, height: 16, background: t.light ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.12)", flex: "none" }}></span>
      <PSegmented t={t} items={[{ v: "unified", label: "Unified" }, { v: "split", label: "Split" }]} active={view} onChange={onView}></PSegmented>
      <PThemeToggle t={t} light={light} onChange={onLight}></PThemeToggle>
    </div>
  );
}

Object.assign(window, { PSidebar, PSidebarFloatBar, PToolbar, PFloatBar, GB_ACCENTS, GB_MONOS, GB_LS_KEY, loadUiState, hexA });

function PToolbar({ t, wt, view, onView, light, onLight }) {
  return (
    <div style={{ height: 50, flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "0 16px", background: t.light ? "rgba(252,252,253,.9)" : "rgba(36,37,42,.9)", borderBottom: `1px solid ${t.border}`, fontFamily: t.ui }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.text, letterSpacing: "-0.01em" }}>{wt.name}</span>
        <span style={{ fontSize: 10.5, color: t.faint }}>gitbench — {wt.filesList.length} changed files</span>
      </div>
      <span style={{ flex: 1 }}></span>
      <PSegmented t={t} items={[{ v: "unified", label: "Unified" }, { v: "split", label: "Split" }]} active={view} onChange={onView}></PSegmented>
      <PThemeToggle t={t} light={light} onChange={onLight}></PThemeToggle>
    </div>
  );
}
