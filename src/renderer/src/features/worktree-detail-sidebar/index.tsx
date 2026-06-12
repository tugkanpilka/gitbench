import { nameFromPath } from '../../shared/path/nameFromPath';
import { SidebarIcon } from '../../shared/ui/icons';
import { DiffStat } from '../../shared/ui/diff-stat';
import { SegmentedControl } from '../../shared/ui/segmented-control';
import { ChangedFilesSection } from '../worktree-list/changed-files-section';
import { UnpushedCommitsSection } from '../worktree-list/unpushed-commits-section';
import type { WorktreeDetailSidebarProps } from './index.types';
import styles from './index.module.scss';

const FILE_LIST_MODE_ITEMS = [
  { value: 'tree', label: 'Tree' },
  { value: 'flat', label: 'Flat' },
] as const;

export function WorktreeDetailSidebar({
  worktree,
  changedFiles,
  unpushedCommits,
  commitsTruncated,
  diffLoading,
  fileListMode,
  activeFileId,
  diffStats,
  onSelectFile,
  onFileListModeChange,
  onToggleSidebar,
}: WorktreeDetailSidebarProps) {
  if (worktree === null) {
    return (
      <div className={styles['worktree-detail-sidebar']}>
        <p className={styles['worktree-detail-sidebar__placeholder']}>
          Select a worktree to inspect its changes.
        </p>
        <DetailFooter
          fileListMode={fileListMode}
          onFileListModeChange={onFileListModeChange}
          onToggleSidebar={onToggleSidebar}
        />
      </div>
    );
  }

  const shortSha = worktree.headSha.slice(0, 7);
  const reference = worktree.branch ?? 'Detached HEAD';

  return (
    <div className={styles['worktree-detail-sidebar']}>
      <header className={styles['worktree-detail-sidebar__header']}>
        <div className={styles['worktree-detail-sidebar__identity']}>
          <strong className={styles['worktree-detail-sidebar__name']} title={worktree.path}>
            {nameFromPath(worktree.path)}
          </strong>
          <span className={styles['worktree-detail-sidebar__reference']} title={reference}>
            {reference}
          </span>
        </div>
        <div className={styles['worktree-detail-sidebar__summary']}>
          {diffStats !== null && (
            <DiffStat additions={diffStats.additions} deletions={diffStats.deletions} />
          )}
          <span className={styles['worktree-detail-sidebar__sha']}>{shortSha}</span>
        </div>
      </header>

      <div className={styles['worktree-detail-sidebar__content']}>
        {diffLoading ? (
          <p className={styles['worktree-detail-sidebar__loading']}>Loading changes…</p>
        ) : (
          <ChangedFilesSection
            changedFiles={changedFiles}
            fileListMode={fileListMode}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
          />
        )}
        {unpushedCommits.length > 0 && (
          <UnpushedCommitsSection commits={unpushedCommits} truncated={commitsTruncated} />
        )}
      </div>

      <DetailFooter
        fileListMode={fileListMode}
        onFileListModeChange={onFileListModeChange}
        onToggleSidebar={onToggleSidebar}
      />
    </div>
  );
}

function DetailFooter({
  fileListMode,
  onFileListModeChange,
  onToggleSidebar,
}: Pick<WorktreeDetailSidebarProps, 'fileListMode' | 'onFileListModeChange' | 'onToggleSidebar'>) {
  return (
    <footer className={styles['worktree-detail-sidebar__footer']}>
      <button
        type="button"
        className={styles['worktree-detail-sidebar__toggle']}
        aria-controls="workspace-sidebar-panels"
        aria-expanded="true"
        aria-label="Hide sidebars"
        onClick={onToggleSidebar}
      >
        <SidebarIcon />
      </button>
      <SegmentedControl
        className={styles['worktree-detail-sidebar__view-toggle']}
        ariaLabel="File list view"
        items={FILE_LIST_MODE_ITEMS}
        value={fileListMode}
        onChange={onFileListModeChange}
      />
    </footer>
  );
}
