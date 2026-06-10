// GitBench prototype — diff rendering: unified + split (side-by-side) modes
// Depends on gitbench-ui.jsx (DiffLine, PlusMinus exported to window)

// Pair lines for split view: hunks pass through; del-runs pair with add-runs.
function pairDiffLines(lines) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (ln.t === "hunk") { out.push({ k: "hunk", text: ln.text }); i++; continue; }
    if (ln.t === "ctx") { out.push({ k: "row", left: ln, right: ln }); i++; continue; }
    // collect del run then add run
    const dels = [], adds = [];
    while (i < lines.length && lines[i].t === "del") { dels.push(lines[i]); i++; }
    while (i < lines.length && lines[i].t === "add") { adds.push(lines[i]); i++; }
    const n = Math.max(dels.length, adds.length);
    for (let j = 0; j < n; j++) out.push({ k: "row", left: dels[j] || null, right: adds[j] || null });
  }
  return out;
}

function SplitCell({ t, line, side, mode, mono }) {
  const isChange = line && (line.t === "add" || line.t === "del");
  const isAdd = line && line.t === "add", isDel = line && line.t === "del";
  let bg = "transparent", barColor = null;
  if (isAdd) { bg = t.addBg; barColor = t.addGutter; }
  if (isDel) { bg = t.delBg; barColor = t.delGutter; }
  if (mode === "word" && isChange) bg = isAdd ? t.addBg : t.delBg;
  if (!line) bg = t.light ? "rgba(0,0,0,.025)" : "rgba(255,255,255,.025)";

  const num = line ? (side === "left" ? line.old : line.nw) : null;
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", background: bg, alignSelf: "stretch" }}>
      {mode === "bars" && <span style={{ width: 3, alignSelf: "stretch", background: isChange ? barColor : "transparent", flex: "none" }}></span>}
      <span style={{ width: 40, flex: "none", textAlign: "right", paddingRight: 10, color: t.gutterText, fontSize: 10.5, fontFamily: mono }}>{num || ""}</span>
      <span style={{ width: 14, flex: "none", textAlign: "center", fontSize: 12, fontFamily: mono, color: isAdd ? t.addText : isDel ? t.delText : "transparent" }}>{isAdd ? "+" : isDel ? "−" : " "}</span>
      <span style={{ overflow: "hidden", whiteSpace: "pre", fontFamily: mono, fontSize: 12, lineHeight: 1 }}>
        {line && line.tok.map(([cls, txt], i) => {
          if (cls === "hlA") return <span key={i} style={{ background: side === "right" ? t.addWord : "transparent", borderRadius: 2, color: t.syn.pl }}>{txt}</span>;
          if (cls === "hlD") return <span key={i} style={{ background: side === "left" ? t.delWord : "transparent", borderRadius: 2, color: t.syn.pl }}>{txt}</span>;
          return <span key={i} style={{ color: t.syn[cls] || t.syn.pl }}>{txt}</span>;
        })}
      </span>
    </div>
  );
}

function SplitDiff({ t, lines, mode, mono }) {
  const rows = pairDiffLines(lines);
  return (
    <div>
      {rows.map((r, i) => r.k === "hunk" ? (
        <div key={i} style={{ height: 26, display: "flex", alignItems: "center", background: t.hunkBg, color: t.hunkText, fontSize: 11, fontFamily: mono, paddingLeft: 64, whiteSpace: "pre" }}>{r.text}</div>
      ) : (
        <div key={i} style={{ display: "flex", height: 24 }}>
          <SplitCell t={t} line={r.left} side="left" mode={mode} mono={mono}></SplitCell>
          <span style={{ width: 1, background: t.borderSoft, flex: "none" }}></span>
          <SplitCell t={t} line={r.right} side="right" mode={mode} mono={mono}></SplitCell>
        </div>
      ))}
    </div>
  );
}

// One file section in the scroll stream: sticky header + collapsible body
function ProtoFileSection({ t, file, view, mode, mono, collapsed, onToggle, refCb }) {
  return (
    <div ref={refCb} data-file={file.dir + file.name}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 9, height: 38, padding: "0 14px", background: t.panel, borderBottom: `1px solid ${t.borderSoft}`, borderTop: `1px solid ${t.border}`, position: "sticky", top: 0, zIndex: 2, cursor: "pointer", userSelect: "none" }}>
        <svg width="8" height="8" viewBox="0 0 8 8" style={{ flex: "none", transform: collapsed ? "none" : "rotate(90deg)", transition: "transform .15s ease" }}>
          <path d="M2.5 1 L6 4 L2.5 7" fill="none" stroke={t.dim} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <span style={{ fontFamily: mono, fontSize: 12 }}>
          <span style={{ color: t.faint }}>{file.dir}</span>
          <span style={{ color: t.text, fontWeight: 500 }}>{file.name}</span>
        </span>
        <span style={{ flex: 1 }}></span>
        <PlusMinus t={t} add={file.add} del={file.del}></PlusMinus>
      </div>
      {!collapsed && (
        <div style={{ background: t.bg, padding: "2px 0 12px" }}>
          {view === "split"
            ? <SplitDiff t={t} lines={file.lines} mode={mode} mono={mono}></SplitDiff>
            : file.lines.map((ln, i) => <DiffLine key={i} t={t} line={ln} mode={mode} mono={mono}></DiffLine>)}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ProtoFileSection, SplitDiff, pairDiffLines });
