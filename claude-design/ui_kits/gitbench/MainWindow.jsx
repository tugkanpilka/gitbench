import React from "react";
import { SegmentedControl } from "../../components/core/SegmentedControl";
import { DiffStat } from "../../components/core/DiffStat";
import { WorktreeRow } from "../../components/navigation/WorktreeRow";
import { FileRow } from "../../components/navigation/FileRow";
import { DiffFileHeader } from "../../components/diff/DiffFileHeader";
import { HunkHeader } from "../../components/diff/HunkHeader";
import { DiffLine } from "../../components/diff/DiffLine";
import { ContextMenu } from "../../components/overlays/ContextMenu";
import { AlertDialog } from "../../components/overlays/AlertDialog";
import { FloatBar, FloatBarDivider } from "../../components/overlays/FloatBar";

// --- compact mock data -------------------------------------------------
const L = (type, oldNo, newNo, tokens) => ({ type, oldNo, newNo, tokens });
const MW_LINES = [
  { hunk: '@@ -14,9 +14,16 @@ import { verifyToken } from "./token"' },
  L("ctx", 14, 14, [["kw","import"],["pl"," { "],["fn","verifyToken"],["pl"," } "],["kw","from"],["pl"," "],["str",'"./token"'],["pl",";"]]),
  L("ctx", 15, 15, [["pl",""]]),
  L("del", 16, null, [["kw","export function "],["fn","authMiddleware"],["pl","(req): "],["hlD","boolean"],["pl"," {"]]),
  L("del", 17, null, [["pl","  "],["kw","return"],["pl"," "],["fn","verifyToken"],["pl","(token);"]]),
  L("add", null, 16, [["kw","export "],["hlA","async "],["kw","function "],["fn","authMiddleware"],["pl","(req) {"]]),
  L("add", null, 17, [["pl","  "],["kw","const"],["pl"," token = "],["fn","readBearer"],["pl","(req."],["pr","headers"],["pl",");"]]),
  L("add", null, 18, [["pl","  "],["kw","const"],["pl"," session = "],["kw","await"],["pl"," "],["fn","verifyToken"],["pl","(token);"]]),
  L("add", null, 19, [["pl","  "],["kw","return"],["pl"," "],["ty","AuthResult"],["pl","."],["fn","ok"],["pl","(session);"]]),
  L("ctx", 18, 20, [["pl","}"]]),
];
const SE_LINES = [
  { hunk: "@@ -8,7 +8,10 @@ const SESSION_TTL = 60 * 30" },
  L("ctx", 8, 8, [["kw","const"],["pl"," SESSION_TTL = "],["num","60"],["pl"," * "],["num","30"],["pl",";"]]),
  L("del", 9, null, [["kw","export function "],["fn","createSession"],["pl","(userId) {"]]),
  L("add", null, 9, [["kw","export async function "],["fn","createSession"],["pl","(userId) {"]]),
  L("add", null, 10, [["pl","  "],["kw","const"],["pl"," id = "],["kw","await"],["pl"," crypto."],["fn","randomUUID"],["pl","();"]]),
  L("ctx", 10, 11, [["pl","}"]]),
];
const RM_LINES = [
  { hunk: "@@ -42,2 +42,4 @@ ## Authentication" },
  L("ctx", 42, 42, [["pl","## Authentication"]]),
  L("add", null, 43, [["pl","Sessions are now async and stored server-side."]]),
];
const VL_LINES = [
  { hunk: "@@ -9,7 +9,12 @@ export function VirtualList({ rows })" },
  L("ctx", 9, 9, [["kw","export function "],["fn","VirtualList"],["pl","({ rows }) {"]]),
  L("del", 10, null, [["pl","  "],["kw","return"],["pl"," rows."],["fn","map"],["pl","(r => <"],["ty","Row"],["pl"," />);"]]),
  L("add", null, 10, [["pl","  "],["kw","const"],["pl"," [a, b] = "],["fn","visibleRange"],["pl","(vp, rows."],["pr","length"],["pl",");"]]),
  L("add", null, 11, [["pl","  "],["kw","return"],["pl"," rows."],["fn","slice"],["pl","(a, b)."],["fn","map"],["pl","(r => <"],["ty","Row"],["pl"," />);"]]),
  L("ctx", 11, 12, [["pl","}"]]),
];

const DATA = [
  { id: "auth", name: "auth-refactor", branch: "agent/auth-refactor", add: 124, del: 56, when: "2m", files: [
    { dir: "src/auth/", name: "middleware.ts", add: 42, del: 18, lines: MW_LINES },
    { dir: "src/auth/", name: "session.ts", add: 31, del: 12, lines: SE_LINES },
    { dir: "", name: "README.md", add: 2, del: 0, lines: RM_LINES },
  ]},
  { id: "virt", name: "diff-virtualization", branch: "agent/diff-virtualization", add: 38, del: 12, when: "14m", files: [
    { dir: "src/diff/", name: "VirtualList.tsx", add: 24, del: 8, lines: VL_LINES },
    { dir: "src/diff/", name: "useViewport.ts", add: 10, del: 2, lines: SE_LINES },
  ]},
  { id: "flicker", name: "empty-state-flicker", branch: "fix/empty-state-flicker", add: 9, del: 3, when: "3h", files: [
    { dir: "src/ui/", name: "EmptyState.tsx", add: 7, del: 2, lines: VL_LINES },
    { dir: "src/ui/", name: "WorktreeList.tsx", add: 2, del: 1, lines: RM_LINES },
  ]},
];

/** GitBench main window — vibrancy sidebar + infinite diff stream + float bars. */
export function MainWindow({ light = false, onToggleTheme, onCloseProject, width = 1240, height = 760 }) {
  const [wts, setWts] = React.useState(DATA);
  const [sel, setSel] = React.useState(DATA[0].id);
  const [view, setView] = React.useState("unified");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [collapsed, setCollapsed] = React.useState({});
  const [menu, setMenu] = React.useState(null);
  const [confirm, setConfirm] = React.useState(null);
  const scrollRef = React.useRef(null);
  const secRefs = React.useRef([]);

  const wt = wts.find((w) => w.id === sel) || wts[0] || null;

  const pick = (i) => {
    const el = scrollRef.current, s = secRefs.current[i];
    if (el && s) el.scrollTo({ top: s.offsetTop, behavior: "smooth" });
    setActiveIdx(i);
  };
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    let idx = 0;
    secRefs.current.forEach((s, i) => { if (s && s.offsetTop <= el.scrollTop + 60) idx = i; });
    setActiveIdx(idx);
  };
  const selectWt = (id) => { setSel(id); setActiveIdx(0); setCollapsed({}); secRefs.current = []; if (scrollRef.current) scrollRef.current.scrollTop = 0; };
  const openMenu = (x, y, w) => setMenu({ x, y, items: [
    { label: "Finder'da Göster" },
    { label: "Terminalde Aç", hint: "⌥⌘T" },
    "—",
    { label: "Worktree'yi Kaldır…", destructive: true, onClick: () => setConfirm(w) },
  ]});
  const removeWt = (w) => {
    setConfirm(null);
    setWts((list) => {
      const next = list.filter((x) => x.id !== w.id);
      if (w.id === sel && next.length) selectWt(next[0].id);
      return next;
    });
  };

  return (
    <div data-screen-label="GitBench" style={{ width, height, borderRadius: "var(--gb-radius-window)", overflow: "hidden", display: "flex", position: "relative",
      boxShadow: "var(--gb-shadow-window)", outline: "1px solid var(--gb-window-edge)", outlineOffset: -1, fontFamily: "var(--gb-font-ui)" }}>
      {/* sidebar */}
      <div style={{ width: "var(--gb-sidebar-w)", flex: "none", background: "var(--gb-sidebar)", backdropFilter: "var(--gb-vibrancy)", WebkitBackdropFilter: "var(--gb-vibrancy)",
        borderRight: "1px solid var(--gb-sidebar-edge)", display: "flex", flexDirection: "column", minHeight: 0, boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: 8, flex: "none", padding: "18px 0 14px 16px" }}>
          <span style={{ width: 12, height: 12, borderRadius: 99, background: "var(--gb-traffic-red)", boxShadow: "var(--gb-shadow-traffic)" }}></span>
          <span style={{ width: 12, height: 12, borderRadius: 99, background: "var(--gb-traffic-yellow)", boxShadow: "var(--gb-shadow-traffic)" }}></span>
          <span style={{ width: 12, height: 12, borderRadius: 99, background: "var(--gb-traffic-green)", boxShadow: "var(--gb-shadow-traffic)" }}></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 12px 6px 18px" }}>
          <span style={{ fontSize: "var(--gb-text-xs)", fontWeight: 600, color: "var(--gb-faint)", letterSpacing: "var(--gb-tracking-caps)", textTransform: "uppercase" }}>gitbench</span>
          {onCloseProject && (
            <span onClick={onCloseProject} title="Projeyi Kapat" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 14, borderRadius: 4, background: "var(--gb-badge-bg)", cursor: "default" }}>
              <svg width="7" height="5" viewBox="0 0 8 5"><path d="M1 1 L4 4 L7 1" fill="none" stroke="var(--gb-dim)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </span>
          )}
        </div>
        <div style={{ padding: "0 9px 56px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0 }}>
          {wts.map((w) => (
            <React.Fragment key={w.id}>
              <WorktreeRow name={w.name} branch={w.branch} files={w.files.length} add={w.add} del={w.del} when={w.when}
                selected={w.id === sel} onClick={() => selectWt(w.id)} onMenu={(x, y) => openMenu(x, y, w)}></WorktreeRow>
              {w.id === sel && (
                <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "2px 0 8px" }}>
                  {w.files.map((f, i) => <FileRow key={f.dir + f.name} dir={f.dir} name={f.name} add={f.add} del={f.del} active={i === activeIdx} onClick={() => pick(i)}></FileRow>)}
                </div>
              )}
            </React.Fragment>
          ))}
          {wts.length === 0 && <div style={{ padding: "22px 14px", fontSize: "var(--gb-text-sm)", color: "var(--gb-faint)", textAlign: "center", lineHeight: 1.5 }}>Bu projede worktree kalmadı.</div>}
        </div>
      </div>

      {/* diff stream */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--gb-bg)", position: "relative" }}>
        <div ref={scrollRef} onScroll={onScroll} style={{ flex: 1, minHeight: 0, overflowY: "auto", position: "relative" }}>
          {wt && wt.files.map((f, i) => (
            <div key={wt.id + f.name} ref={(el) => { secRefs.current[i] = el; }}>
              <DiffFileHeader dir={f.dir} name={f.name} add={f.add} del={f.del} collapsed={!!collapsed[i]} onToggle={() => setCollapsed((c) => ({ ...c, [i]: !c[i] }))}></DiffFileHeader>
              {!collapsed[i] && (
                <div style={{ padding: "2px 0 12px" }}>
                  {f.lines.map((ln, j) => ln.hunk
                    ? <HunkHeader key={j} text={ln.hunk}></HunkHeader>
                    : <DiffLine key={j} type={ln.type} oldNo={ln.oldNo} newNo={ln.newNo} tokens={ln.tokens}></DiffLine>)}
                </div>
              )}
            </div>
          ))}
          {wt && <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--gb-text-sm)", color: "var(--gb-faint)" }}>{wt.files.length} dosya · +{wt.add} −{wt.del}</div>}
          {!wt && <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--gb-text-lg)", color: "var(--gb-dim)", fontWeight: 600 }}>Worktree yok</div>}
        </div>
        {wt && (
          <FloatBar>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 7, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: "var(--gb-text-md)", fontWeight: 600, color: "var(--gb-text)", letterSpacing: "var(--gb-tracking-tight)" }}>{wt.name}</span>
              <span style={{ fontSize: "var(--gb-text-2xs)", color: "var(--gb-faint)" }}>{wt.files.length} dosya</span>
              <DiffStat add={wt.add} del={wt.del}></DiffStat>
            </span>
            <FloatBarDivider></FloatBarDivider>
            <SegmentedControl items={[{ value: "unified", label: "Unified" }, { value: "split", label: "Split" }]} value={view} onChange={setView}></SegmentedControl>
            {onToggleTheme && (
              <span onClick={onToggleTheme} title="Tema değiştir" style={{ width: 28, height: 28, borderRadius: "var(--gb-radius-control)", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--gb-control-bg)", cursor: "default" }}>
                <img src={light ? "../../assets/icons/sun.svg" : "../../assets/icons/moon.svg"} width="13" height="13" alt="tema" style={{ opacity: .7, filter: light ? "none" : "invert(1)" }}></img>
              </span>
            )}
          </FloatBar>
        )}
      </div>

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)}></ContextMenu>}
      {confirm && (
        <AlertDialog
          icon={<img src="../../assets/gitbench-icon.svg" width="52" height="52" alt=""></img>}
          title={`“${confirm.name}” kaldırılsın mı?`}
          body={<span>Worktree klasörü diskten silinecek. <span style={{ fontFamily: "var(--gb-font-mono)", fontSize: 10.5 }}>{confirm.branch}</span> dalı silinmez.</span>}
          confirmLabel="Kaldır"
          onCancel={() => setConfirm(null)} onConfirm={() => removeWt(confirm)}></AlertDialog>
      )}
    </div>
  );
}
