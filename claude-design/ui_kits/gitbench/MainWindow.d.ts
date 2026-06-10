/**
 * GitBench main window: vibrancy worktree sidebar (accordion + scroll-spy file list),
 * infinite diff stream with sticky headers, floating control pill, context menu +
 * remove-confirm flow. Self-contained with mock data.
 * @startingPoint section="GitBench" subtitle="Ana pencere — sidebar + diff akışı" viewport="1280x800"
 */
export interface MainWindowProps {
  /** Current theme (affects the theme-toggle icon only; theme itself comes from data-theme). */
  light?: boolean;
  /** Renders the theme toggle in the float bar when provided. */
  onToggleTheme?: () => void;
  /** Renders the project-close chevron next to the project name when provided. */
  onCloseProject?: () => void;
  /** Window size in px. Defaults 1240×760. */
  width?: number;
  height?: number;
}
