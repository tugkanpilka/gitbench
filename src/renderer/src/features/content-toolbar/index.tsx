import { DiffStat } from '../../shared/ui/diff-stat';
import { MoonIcon, SidebarIcon, SunIcon } from '../../shared/ui/icons';
import { SegmentedControl } from '../../shared/ui/segmented-control';
import type { ContentToolbarProps } from './index.types';
import styles from './index.module.scss';

const VIEW_ITEMS = [
  { value: 'unified', label: 'Unified' },
  { value: 'split', label: 'Split' },
] as const;

export function ContentToolbar({
  diffStats,
  viewType,
  theme,
  sidebarOpen,
  onViewTypeChange,
  onToggleTheme,
  onToggleSidebar,
}: ContentToolbarProps) {
  return (
    <div className={styles['content-toolbar']} data-sidebar-open={sidebarOpen}>
      {!sidebarOpen && (
        <button
          type="button"
          className={styles['content-toolbar__sidebar-toggle']}
          aria-controls="workspace-sidebar-panels"
          aria-expanded="false"
          aria-label="Show sidebars"
          onClick={onToggleSidebar}
        >
          <SidebarIcon />
        </button>
      )}

      <span className={styles['content-toolbar__spacer']} />

      {diffStats !== null && (
        <>
          <span className={styles['content-toolbar__divider']} aria-hidden="true" />
          <DiffStat additions={diffStats.additions} deletions={diffStats.deletions} />
          <SegmentedControl
            ariaLabel="Diff view"
            items={VIEW_ITEMS}
            value={viewType}
            onChange={onViewTypeChange}
          />
        </>
      )}

      <button
        type="button"
        className={styles['content-toolbar__theme-toggle']}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        aria-pressed={theme === 'light'}
        onClick={onToggleTheme}
      >
        {theme === 'light' ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  );
}
