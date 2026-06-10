/**
 * Count badge pill (file counts etc). Set onSelection when rendered inside an accent selection pill.
 */
export interface BadgeProps {
  children: React.ReactNode;
  /** True when inside an accent-colored selection (inverts to translucent white). */
  onSelection?: boolean;
  style?: React.CSSProperties;
}
