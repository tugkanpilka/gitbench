import React from "react";

/**
 * One unified diff line. Tokens are [cls, text] pairs; cls maps to --gb-syn-* vars,
 * plus "hlA"/"hlD" word-level highlight classes.
 */
export function DiffLine({ type = "ctx", oldNo = null, newNo = null, tokens = [], mode = "classic" }) {
  const isAdd = type === "add", isDel = type === "del";
  let rowBg = "transparent", gutBg = null, bar = null;
  if (mode === "classic") {
    if (isAdd) { rowBg = "var(--gb-add-bg)"; gutBg = "var(--gb-add-gutter)"; }
    if (isDel) { rowBg = "var(--gb-del-bg)"; gutBg = "var(--gb-del-gutter)"; }
  } else if (mode === "bars") {
    if (isAdd) { rowBg = "var(--gb-add-bg)"; bar = "var(--gb-add-gutter)"; }
    if (isDel) { rowBg = "var(--gb-del-bg)"; bar = "var(--gb-del-gutter)"; }
  } else if (mode === "word") {
    if (isAdd) rowBg = "var(--gb-add-bg)";
    if (isDel) rowBg = "var(--gb-del-bg)";
  }
  const gut = (n) => (
    <span style={{ width: "var(--gb-gutter-w)", flex: "none", textAlign: "right", paddingRight: 10, color: "var(--gb-gutter-text)", fontSize: "var(--gb-code-gutter)", background: gutBg || "transparent", alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "flex-end", boxSizing: "border-box" }}>{n || ""}</span>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", height: "var(--gb-diff-line-h)", fontFamily: "var(--gb-font-mono)", fontSize: "var(--gb-code)", lineHeight: 1, whiteSpace: "pre", background: rowBg }}>
      {mode === "bars" && <span style={{ width: 3, alignSelf: "stretch", background: bar || "transparent", flex: "none" }}></span>}
      {gut(oldNo)}
      {gut(newNo)}
      <span style={{ width: "var(--gb-sign-w)", flex: "none", textAlign: "center", color: isAdd ? "var(--gb-add-text)" : isDel ? "var(--gb-del-text)" : "transparent", fontWeight: 500 }}>{isAdd ? "+" : isDel ? "−" : " "}</span>
      <span style={{ overflow: "hidden" }}>
        {tokens.map(([cls, txt], i) => {
          if (cls === "hlA") return <span key={i} style={{ background: "var(--gb-add-word)", borderRadius: 2, color: "var(--gb-syn-pl)" }}>{txt}</span>;
          if (cls === "hlD") return <span key={i} style={{ background: "var(--gb-del-word)", borderRadius: 2, color: "var(--gb-syn-pl)" }}>{txt}</span>;
          return <span key={i} style={{ color: `var(--gb-syn-${cls}, var(--gb-syn-pl))` }}>{txt}</span>;
        })}
      </span>
    </div>
  );
}
