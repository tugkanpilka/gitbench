/**
 * One unified diff line with double gutter, sign column and syntax tokens.
 * @startingPoint section="Components" subtitle="Unified diff satırı — 3 renklendirme modu" viewport="700x220"
 */
export interface DiffLineProps {
  type?: "ctx" | "add" | "del";
  /** Old-file line number; null for added lines. */
  oldNo?: number | null;
  /** New-file line number; null for deleted lines. */
  newNo?: number | null;
  /** [cls, text] pairs; cls ∈ kw|fn|str|num|cm|ty|pr|pl|hlA|hlD. */
  tokens: [string, string][];
  /** Coloring style: classic (row+gutter fill), bars (left strip), word (weak row, strong word highlight). */
  mode?: "classic" | "bars" | "word";
}
