/**
 * Floating vibrancy control pill anchored to the bottom of a relatively-positioned pane.
 * GitBench's replacement for a top toolbar.
 */
export interface FloatBarProps {
  children: React.ReactNode;
  /** Horizontal anchor. Default "center". */
  position?: "left" | "center" | "right";
  style?: React.CSSProperties;
}
