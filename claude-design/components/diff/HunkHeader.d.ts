/**
 * Hunk header band inside a diff. Indented past the double gutter.
 */
export interface HunkHeaderProps {
  /** Raw hunk text, e.g. "@@ -14,9 +14,16 @@ import …". */
  text: string;
}
