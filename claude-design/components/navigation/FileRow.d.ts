/**
 * Changed-file row under a selected worktree. Flat mode shows the dir prefix (truncates first);
 * tree mode passes depth and hides the prefix. Active = gray secondary selection.
 */
export interface FileRowProps {
  /** Directory prefix shown in flat mode, e.g. "src/auth/". Truncates before the name does. */
  dir?: string;
  name: string;
  add: number;
  del: number;
  /** Gray secondary selection (scroll-spy target). */
  active?: boolean;
  /** Tree-mode indent level; null/undefined = flat mode with dir prefix. */
  depth?: number | null;
  onClick?: () => void;
}
