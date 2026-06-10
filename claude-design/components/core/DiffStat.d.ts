/**
 * +N −M diff stat pair. Use everywhere change volume is shown (rows, headers, float bar).
 */
export interface DiffStatProps {
  add: number;
  del: number;
  /** Font size in px. Default 10.5. */
  size?: number;
  /** True inside accent selection pill (switches to pastel tints). */
  onSelection?: boolean;
  style?: React.CSSProperties;
}
