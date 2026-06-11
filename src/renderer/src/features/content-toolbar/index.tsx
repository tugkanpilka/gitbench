import type { TProps } from './index.types';
import { DiffStat } from '../../shared/ui/diff-stat';
import { SegmentedControl } from '../../shared/ui/segmented-control';
import styles from './index.module.scss';

const VIEW_ITEMS = [
  { value: 'unified', label: 'Unified' },
  { value: 'split', label: 'Split' },
] as const;

const FILE_LIST_MODE_ITEMS = [
  { value: 'flat', label: 'Flat' },
  { value: 'tree', label: 'Tree' },
] as const;

function SidebarIcon() {
  return (
    <svg aria-hidden="true" width="17" height="14" viewBox="0 0 17 14">
      <rect
        x="0.5"
        y="0.5"
        width="16"
        height="13"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="6"
        y1="1"
        x2="6"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14">
      <circle
        cx="7"
        cy="7"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <line x1="7" y1="0.8" x2="7" y2="2.4" />
        <line x1="11.4" y1="2.6" x2="10.2" y2="3.8" />
        <line x1="13.2" y1="7" x2="11.6" y2="7" />
        <line x1="11.4" y1="11.4" x2="10.2" y2="10.2" />
        <line x1="7" y1="13.2" x2="7" y2="11.6" />
        <line x1="2.6" y1="11.4" x2="3.8" y2="10.2" />
        <line x1="0.8" y1="7" x2="2.4" y2="7" />
        <line x1="2.6" y1="2.6" x2="3.8" y2="3.8" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14">
      <path
        d="M11.5 8.6 A5 5 0 1 1 5.4 2.5 A4 4 0 0 0 11.5 8.6 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
}: TProps) {
  return (
    <div className={styles['content-toolbar']}>
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
