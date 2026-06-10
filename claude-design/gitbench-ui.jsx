// GitBench — UI building blocks (theme-parametrized)
// Exports: AppWindow, Sidebar, DiffFile, DiffBlock, TypeSample

const I = {
  chevron: (open, c) => (
    <svg width="8" height="8" viewBox="0 0 8 8" style={{ flex: "none", transform: open ? "rotate(90deg)" : "none", opacity: .7 }}>
      <path d="M2.5 1 L6 4 L2.5 7" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  ),
  dot: (c) => <span style={{ width: 7, height: 7, borderRadius: 99, background: c, flex: "none" }}></span>,
};

function Tok({ t, tok }) {
  return tok.map(([cls, txt], i) => {
    if (cls === "hlA") return <span key={i} style={{ background: t.addWord, borderRadius: 2, color: t.syn.pl }}>{txt}</span>;
    if (cls === "hlD") return <span key={i} style={{ background: t.delWord, borderRadius: 2, color: t.syn.pl }}>{txt}</span>;
    return <span key={i} style={{ color: t.syn[cls] || t.syn.pl }}>{txt}</span>;
  });
}

// mode: "classic" | "bars" | "word"
function DiffLine({ t, line, mode, mono, dense }) {
  const h = dense ? 20 : 24;
  const fs = dense ? 11.5 : 12.5;
  const gw = dense ? 34 : 42;
  const base = { display: "flex", alignItems: "center", height: h, fontFamily: mono, fontSize: fs, lineHeight: 1, whiteSpace: "pre" };
  const gut = (n, bg) => (
    <span style={{ width: gw, flex: "none", textAlign: "right", paddingRight: 10, color: t.gutterText, fontSize: fs - 1.5, background: bg || "transparent", alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>{n || ""}</span>
  );

  if (line.t === "hunk") {
    return (
      <div style={{ ...base, background: t.hunkBg, color: t.hunkText, fontSize: fs - 1, paddingLeft: gw * 2 + 18, height: h + 2 }}>{line.text}</div>
    );
  }

  const isAdd = line.t === "add", isDel = line.t === "del";
  let rowBg = "transparent", gutBg = null, barColor = null, sign = " ";
  if (isAdd) { sign = "+"; }
  if (isDel) { sign = "−"; }

  if (mode === "classic") {
    if (isAdd) { rowBg = t.addBg; gutBg = t.addGutter; }
    if (isDel) { rowBg = t.delBg; gutBg = t.delGutter; }
  } else if (mode === "bars") {
    if (isAdd) { rowBg = t.addBg; barColor = t.addGutter; }
    if (isDel) { rowBg = t.delBg; barColor = t.delGutter; }
  } else if (mode === "word") {
    if (isAdd) rowBg = t.addBg;
    if (isDel) rowBg = t.delBg;
  }

  return (
    <div style={{ ...base, background: rowBg }}>
      {mode === "bars" && <span style={{ width: 3, alignSelf: "stretch", background: barColor || "transparent", flex: "none" }}></span>}
      {gut(line.old, gutBg)}
      {gut(line.nw, gutBg)}
      <span style={{ width: 18, flex: "none", textAlign: "center", color: isAdd ? t.addText : isDel ? t.delText : "transparent", fontWeight: 500 }}>{sign}</span>
      <span style={{ overflow: "hidden" }}><Tok t={t} tok={line.tok}></Tok></span>
    </div>
  );
}

function PlusMinus({ t, add, del, fs }) {
  return (
    <span style={{ display: "inline-flex", gap: 6, fontFamily: t.mono, fontSize: fs || 11, fontVariantNumeric: "tabular-nums" }}>
      <span style={{ color: t.addText }}>+{add}</span>
      <span style={{ color: t.delText }}>−{del}</span>
    </span>
  );
}

function FileHeader({ t, file, dense }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, height: dense ? 34 : 40, padding: "0 14px", background: t.panel, borderBottom: `1px solid ${t.borderSoft}`, borderTop: `1px solid ${t.border}`, position: "sticky", top: 0 }}>
      {I.chevron(true, t.dim)}
      <span style={{ fontFamily: t.mono, fontSize: 12 }}>
        <span style={{ color: t.faint }}>{file.dir}</span>
        <span style={{ color: t.text, fontWeight: 500 }}>{file.name}</span>
      </span>
      <span style={{ flex: 1 }}></span>
      <PlusMinus t={t} add={file.add} del={file.del}></PlusMinus>
    </div>
  );
}

function DiffFile({ t, file, mode, mono, dense, clip }) {
  const lines = clip ? file.lines.slice(0, clip) : file.lines;
  return (
    <div>
      <FileHeader t={t} file={file} dense={dense}></FileHeader>
      <div style={{ background: t.bg, padding: "2px 0 10px" }}>
        {lines.map((ln, i) => <DiffLine key={i} t={t} line={ln} mode={mode} mono={mono || t.mono} dense={dense}></DiffLine>)}
      </div>
    </div>
  );
}

// Bare diff block (for the coloring-style section)
function DiffBlock({ t, lines, mode, mono, dense }) {
  return (
    <div style={{ background: t.bg, padding: "6px 0", borderRadius: 6, overflow: "hidden", border: `1px solid ${t.border}` }}>
      {lines.map((ln, i) => <DiffLine key={i} t={t} line={ln} mode={mode} mono={mono || t.mono} dense={dense}></DiffLine>)}
    </div>
  );
}

// ---- Sidebar -----------------------------------------------------------

function WorktreeHeader({ t, w, dense, open }) {
  const pad = dense ? "5px 10px" : "8px 10px";
  return (
    <div style={{ padding: pad, borderRadius: 6, background: open ? t.accentBg : "transparent", display: "flex", flexDirection: "column", gap: dense ? 1 : 3 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {I.chevron(open, open ? t.accent : t.dim)}
        <span style={{ fontSize: dense ? 12 : 13, fontWeight: 600, color: open ? t.text : t.dim, letterSpacing: "-0.01em" }}>{w.name}</span>
        <span style={{ flex: 1 }}></span>
        <span style={{ fontSize: 10.5, color: t.dim, background: t.badgeBg, borderRadius: 99, padding: "2px 7px", fontVariantNumeric: "tabular-nums" }}>{w.files}</span>
      </div>
      {!dense && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 15 }}>
          <span style={{ fontSize: 11, color: t.faint, fontFamily: t.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.branch}</span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 15 }}>
        <PlusMinus t={t} add={w.add} del={w.del} fs={dense ? 10 : 10.5}></PlusMinus>
        <span style={{ flex: 1 }}></span>
        <span style={{ fontSize: 10.5, color: t.faint }}>{w.when}</span>
      </div>
    </div>
  );
}

function FileRow({ t, f, dense, active }) {
  // Filename always stays intact; the directory part is what truncates.
  return (
    <div style={{ display: "flex", alignItems: "center", height: dense ? 22 : 27, padding: "0 8px 0 25px", borderRadius: 5, background: active ? t.accentBg : "transparent", fontSize: dense ? 11.5 : 12, fontFamily: t.mono, whiteSpace: "nowrap" }}>
      <span style={{ color: t.faint, overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto", minWidth: 0 }}>{f.dir}</span>
      <span style={{ color: active ? t.text : t.dim, flex: "none" }}>{f.name}</span>
      <span style={{ flex: "1 0 8px" }}></span>
      <PlusMinus t={t} add={f.add} del={f.del} fs={dense ? 9.5 : 10}></PlusMinus>
    </div>
  );
}

function Sidebar({ t, dense, width }) {
  return (
    <div style={{ width: width || 252, flex: "none", background: t.sidebar, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", fontFamily: t.ui }}>
      <div style={{ padding: dense ? "8px 8px 4px" : "10px 8px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
        <WorktreeHeader t={t} w={WORKTREES[0]} dense={dense} open={true}></WorktreeHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "2px 0 6px" }}>
          {CHANGED_FILES.map((f, i) => <FileRow key={i} t={t} f={f} dense={dense} active={i === 0}></FileRow>)}
        </div>
        {WORKTREES.slice(1).map((w) => <WorktreeHeader key={w.id} t={t} w={w} dense={dense} open={false}></WorktreeHeader>)}
      </div>
    </div>
  );
}

// ---- Window chrome + full app ------------------------------------------

function Traffic() {
  return (
    <div style={{ display: "flex", gap: 8, flex: "none" }}>
      <span style={{ width: 12, height: 12, borderRadius: 99, background: "#ff5f57" }}></span>
      <span style={{ width: 12, height: 12, borderRadius: 99, background: "#febc2e" }}></span>
      <span style={{ width: 12, height: 12, borderRadius: 99, background: "#28c840" }}></span>
    </div>
  );
}

function Seg({ t, items, active }) {
  return (
    <div style={{ display: "flex", background: t.badgeBg, borderRadius: 6, padding: 2, gap: 2 }}>
      {items.map((it) => (
        <span key={it} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 4, color: it === active ? t.text : t.faint, background: it === active ? t.panel : "transparent", fontWeight: it === active ? 500 : 400 }}>{it}</span>
      ))}
    </div>
  );
}

function TitleBar({ t }) {
  return (
    <div style={{ height: 44, display: "flex", alignItems: "center", gap: 14, padding: "0 16px", background: t.chrome, borderBottom: `1px solid ${t.border}`, fontFamily: t.ui }}>
      <Traffic></Traffic>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: t.text, letterSpacing: "-0.01em" }}>GitBench</span>
      <span style={{ fontSize: 11.5, color: t.faint, fontFamily: t.mono }}>~/dev/gitbench</span>
      <span style={{ flex: 1 }}></span>
      <Seg t={t} items={["Unified", "Split"]} active="Unified"></Seg>
    </div>
  );
}

function AppWindow({ t, dense, mode, width, height }) {
  return (
    <div data-screen-label={`GitBench · ${t.label}`} style={{ width: width || 1240, height: height || 800, background: t.bg, borderRadius: 10, overflow: "hidden", border: `1px solid ${t.border}`, display: "flex", flexDirection: "column", boxShadow: t.light ? "0 18px 50px rgba(40,35,25,.14)" : "0 18px 50px rgba(0,0,0,.5)" }}>
      <TitleBar t={t}></TitleBar>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Sidebar t={t} dense={dense}></Sidebar>
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <DiffFile t={t} file={DIFFS[0]} mode={mode} dense={dense}></DiffFile>
          <DiffFile t={t} file={DIFFS[1]} mode={mode} dense={dense}></DiffFile>
          <DiffFile t={t} file={DIFFS[2]} mode={mode} dense={dense} clip={3}></DiffFile>
        </div>
      </div>
    </div>
  );
}

// ---- Typography sample ---------------------------------------------------

function TypeSample({ t, mono, label, note }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontFamily: t.ui }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{label}</span>
        <span style={{ fontSize: 11, color: t.faint }}>{note}</span>
      </div>
      <DiffBlock t={t} lines={DIFFS[1].lines.slice(2, 10)} mode="classic" mono={mono}></DiffBlock>
    </div>
  );
}

Object.assign(window, { AppWindow, Sidebar, DiffFile, DiffBlock, TypeSample, DiffLine, PlusMinus });
