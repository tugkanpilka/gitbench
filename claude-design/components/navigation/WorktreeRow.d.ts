/**
 * Sidebar worktree row: name + count badge, mono branch path + relative time, +/− stats.
 * Selected state is the macOS source-list accent pill. Right-click / hover ··· opens the context menu.
 * @startingPoint section="Components" subtitle="Worktree source-list satırı" viewport="300x180"
 */
export interface WorktreeRowProps {
  name: string;
  /** Mono branch path, e.g. "agent/auth-refactor". */
  branch: string;
  /** Changed file count (badge). */
  files: number;
  add: number;
  del: number;
  /** Relative time label, e.g. "2m", "1h". */
  when: string;
  selected?: boolean;
  onClick?: () => void;
  /** If set, enables right-click + hover ··· menu; receives cursor x/y. */
  onMenu?: (x: number, y: number) => void;
}
