/**
 * GitBench button. "plain" is the welcome-window list style (accent icon, left aligned);
 * "primary"/"destructive" are filled pill buttons; "secondary" is the gray alert button.
 * @startingPoint section="Components" subtitle="Native macOS buton — 4 varyant" viewport="700x220"
 */
export interface ButtonProps {
  /** Visual style. Default "plain". */
  variant?: "primary" | "plain" | "secondary" | "destructive";
  /** Optional leading glyph (string or node), e.g. "＋". Accent-colored in plain variant. */
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
