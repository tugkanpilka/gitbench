import React from "react";

/** Hunk header band: "@@ -14,9 +14,16 @@ …" */
export function HunkHeader({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: "var(--gb-hunk-h)", background: "var(--gb-hunk-bg)", color: "var(--gb-hunk-text)",
      fontFamily: "var(--gb-font-mono)", fontSize: 11, paddingLeft: "calc(var(--gb-gutter-w) * 2 + var(--gb-sign-w))", whiteSpace: "pre" }}>
      {text}
    </div>
  );
}
