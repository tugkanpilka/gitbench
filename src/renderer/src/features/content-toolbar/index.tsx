import { DiffStat } from '../../shared/ui/diff-stat';
import { MoonIcon, SidebarIcon, SunIcon } from '../../shared/ui/icons';
import { SegmentedControl } from '../../shared/ui/segmented-control';
import type { ContentToolbarProps } from './index.types';
import styles from './index.module.scss';

const VIEW_ITEMS = [
  { value: 'unified', label: 'Unified' },
  { value: 'split', label: 'Split' },
] as const;

const FILE_LIST_MODE_ITEMS = [
  { value: 'flat', label: 'Flat' },
  { value: 'tree', label: 'Tree' },
] as const;

export function ContentToolbar({
  worktreeName,
  repoName,
  fileCount,
  diffStats,
  viewType,
  theme,
  sidebarOpen,
  fileListMode,
  onViewTypeChange,
  onToggleTheme,
  onToggleSidebar,
  onFileListModeChange,
}: ContentToolbarProps) {
  return (
    <div className={styles['content-toolbar']} data-sidebar-open={sidebarOpen}>
      <button
        type="button"
        className={styles['content-toolbar__sidebar-toggle']}
        aria-controls="repository-sidebar-panel"
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        onClick={onToggleSidebar}
      >
        <SidebarIcon />
      </button>

      {worktreeName !== null && (
        <div className={styles['content-toolbar__info']}>
          <span className={styles['content-toolbar__worktree-name']}>{worktreeName}</span>
          <span className={styles['content-toolbar__meta']}>
            {repoName}
            {fileCount > 0 && ` — ${fileCount} changed files`}
          </span>
        </div>
      )}

      <span className={styles['content-toolbar__spacer']} />

      {sidebarOpen && (
        <SegmentedControl
          className={styles['content-toolbar__file-list-toggle']}
          ariaLabel="File list view"
          items={FILE_LIST_MODE_ITEMS}
          value={fileListMode}
          onChange={onFileListModeChange}
        />
      )}

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
