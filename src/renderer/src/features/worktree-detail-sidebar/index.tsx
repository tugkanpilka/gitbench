import { nameFromPath } from '../../shared/path/nameFromPath';
import { DiffStat } from '../../shared/ui/diff-stat';
import { Chevron } from '../../shared/ui/icons';
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
  repositorySidebarOpen,
  onSelectFile,
  onFileListModeChange,
  onToggleRepositorySidebar,
}: WorktreeDetailSidebarProps) {
  if (worktree === null) {
    return (
      <div className={styles['worktree-detail-sidebar']}>
        <p className={styles['worktree-detail-sidebar__placeholder']}>
          Select a worktree to inspect its changes.
        </p>
        <DetailFooter fileListMode={fileListMode} onFileListModeChange={onFileListModeChange} />
      </div>
    );
  }

  const reference = worktree.branch ?? 'Detached HEAD';

  return (
    <div className={styles['worktree-detail-sidebar']}>
      <header
        className={styles['worktree-detail-sidebar__header']}
        data-repository-sidebar-open={repositorySidebarOpen}
      >
        <div className={styles['worktree-detail-sidebar__toolbar']}>
          <button
            type="button"
            className={styles['worktree-detail-sidebar__back']}
            aria-label={`${repositorySidebarOpen ? 'Hide' : 'Show'} worktree sidebar`}
            aria-expanded={repositorySidebarOpen}
            onClick={onToggleRepositorySidebar}
          >
            <Chevron collapsed={false} className={styles['worktree-detail-sidebar__back-icon']} />
          </button>
        </div>
      </header>

      <div className={styles['worktree-detail-sidebar__content']}>
        <div className={styles['worktree-detail-sidebar__identity']}>
          <strong className={styles['worktree-detail-sidebar__name']} title={worktree.path}>
            {nameFromPath(worktree.path)}
          </strong>
          <span className={styles['worktree-detail-sidebar__reference']} title={reference}>
            {reference}
          </span>
          {diffStats !== null && (
            <DiffStat
              className={styles['worktree-detail-sidebar__diff-stat']}
              additions={diffStats.additions}
              deletions={diffStats.deletions}
            />
          )}
        </div>
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

      <DetailFooter fileListMode={fileListMode} onFileListModeChange={onFileListModeChange} />
    </div>
  );
}

function DetailFooter({
  fileListMode,
  onFileListModeChange,
}: Pick<WorktreeDetailSidebarProps, 'fileListMode' | 'onFileListModeChange'>) {
  return (
    <footer className={styles['worktree-detail-sidebar__footer']}>
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
