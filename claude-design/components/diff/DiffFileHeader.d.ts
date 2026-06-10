/**
 * Sticky file header for a diff section. Click toggles collapse (chevron rotates).
 */
export interface DiffFileHeaderProps {
  /** Directory prefix, e.g. "src/auth/". */
  dir?: string;
  name: string;
  add: number;
  del: number;
  collapsed?: boolean;
  onToggle?: () => void;
  /** Default true — header sticks to the top of the scroll container. */
  sticky?: boolean;
}
