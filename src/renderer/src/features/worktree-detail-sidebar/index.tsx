import type { ReactNode } from 'react';

import { nameFromPath } from '../../shared/path/nameFromPath';
import { DiffStat } from '../../shared/ui/diff-stat';
import { Match, Switch } from '../../shared/ui/switch';
import { Visibility } from '../../shared/ui/visibility';
import { Chevron, TreeListIcon, FlatListIcon } from '../../shared/ui/icons';
import { SegmentedControl } from '../../shared/ui/segmented-control';
import { ChangedFilesSection } from '../worktree-list/changed-files-section';
import { UnpushedCommitsSection } from '../worktree-list/unpushed-commits-section';
import type { WorktreeDetailSidebarProps } from './index.types';
import styles from './index.module.scss';

const FILE_LIST_MODE_ITEMS = [
  { value: 'tree', label: <TreeListIcon />, ariaLabel: 'Tree view' },
  { value: 'flat', label: <FlatListIcon />, ariaLabel: 'Flat view' },
] as const;

export function WorktreeDetailSidebar({
  worktree,
  changedFiles,
  unpushedCommits,
  commitsTruncated,
  diffLoading,
  fileListMode,
  flatGroupMode,
  activeFileId,
  diffStats,
  repositorySidebarOpen,
  onSelectFile,
  onFileListModeChange,
  onFlatGroupModeChange,
  onToggleRepositorySidebar,
}: WorktreeDetailSidebarProps) {
  return (
    <div className={styles['worktree-detail-sidebar']}>
      <DetailHeader
        repositorySidebarOpen={repositorySidebarOpen}
        onToggleRepositorySidebar={onToggleRepositorySidebar}
      >
        <WorktreeIdentity worktree={worktree} diffStats={diffStats} />
      </DetailHeader>

      <Switch>
        <Match when={worktree === null}>
          <p className={styles['worktree-detail-sidebar__placeholder']}>
            Select a worktree to inspect its changes.
          </p>
        </Match>
        <Match when={true}>
          <div className={styles['worktree-detail-sidebar__content']}>
            <Switch>
              <Match when={diffLoading}>
                <p className={styles['worktree-detail-sidebar__loading']}>Loading changes…</p>
              </Match>
              <Match when={true}>
                <ChangedFilesSection
                  changedFiles={changedFiles}
                  fileListMode={fileListMode}
                  flatGroupMode={flatGroupMode}
                  activeFileId={activeFileId}
                  onSelectFile={onSelectFile}
                />
              </Match>
            </Switch>
          </div>
          <Visibility isVisible={unpushedCommits.length > 0}>
            <UnpushedCommitsSection commits={unpushedCommits} truncated={commitsTruncated} />
          </Visibility>
        </Match>
      </Switch>

      <DetailFooter
        fileListMode={fileListMode}
        flatGroupMode={flatGroupMode}
        onFileListModeChange={onFileListModeChange}
        onFlatGroupModeChange={onFlatGroupModeChange}
      />
    </div>
  );
}

// The worktree's name + reference + diff stat, shown in the header only when a worktree
// is selected. Returning null when absent keeps `worktree` non-null for the markup.
function WorktreeIdentity({
  worktree,
  diffStats,
}: Pick<WorktreeDetailSidebarProps, 'worktree' | 'diffStats'>) {
  if (worktree === null) {
    return null;
  }

  const reference = worktree.branch ?? 'Detached HEAD';
  const diffStat =
    diffStats === null ? null : (
      <DiffStat
        className={styles['worktree-detail-sidebar__diff-stat']}
        additions={diffStats.additions}
        deletions={diffStats.deletions}
      />
    );

  return (
    <div className={styles['worktree-detail-sidebar__identity']}>
      <div className={styles['worktree-detail-sidebar__title']}>
        <span className={styles['worktree-detail-sidebar__name']} title={worktree.path}>
          {nameFromPath(worktree.path)}
        </span>
        {diffStat}
      </div>
      <span className={styles['worktree-detail-sidebar__reference']} title={reference}>
        {reference}
      </span>
    </div>
  );
}

// Header bar carrying the repository-sidebar toggle. Rendered in both the selected
// and placeholder states so the (possibly inert) repository sidebar can always be
// reopened — `children` carries the worktree identity when one is selected.
function DetailHeader({
  repositorySidebarOpen,
  onToggleRepositorySidebar,
  children,
}: Pick<WorktreeDetailSidebarProps, 'repositorySidebarOpen' | 'onToggleRepositorySidebar'> & {
  children?: ReactNode;
}) {
  return (
    <header
      className={styles['worktree-detail-sidebar__header']}
      data-repository-sidebar-open={repositorySidebarOpen}
    >
      <div className={styles['worktree-detail-sidebar__toolbar']}>
        <div className={styles['worktree-detail-sidebar__toolbar-content']}>
          <button
            type="button"
            className={styles['worktree-detail-sidebar__back']}
            aria-label={`${repositorySidebarOpen ? 'Hide' : 'Show'} worktree sidebar`}
            aria-expanded={repositorySidebarOpen}
            onClick={onToggleRepositorySidebar}
          >
            <Chevron
              collapsed={!repositorySidebarOpen}
              className={styles['worktree-detail-sidebar__back-icon']}
            />
          </button>
          {children}
        </div>
      </div>
    </header>
  );
}

const FLAT_GROUP_MODE_ITEMS = [
  { value: 'none', label: 'No Group' },
  { value: 'status', label: 'By Status' },
] as const;

function DetailFooter({
  fileListMode,
  flatGroupMode,
  onFileListModeChange,
  onFlatGroupModeChange,
}: Pick<
  WorktreeDetailSidebarProps,
  'fileListMode' | 'flatGroupMode' | 'onFileListModeChange' | 'onFlatGroupModeChange'
>) {
  return (
    <footer className={styles['worktree-detail-sidebar__footer']}>
      <Visibility isVisible={fileListMode === 'flat'}>
        <SegmentedControl
          className={styles['worktree-detail-sidebar__view-toggle']}
          density="compact"
          ariaLabel="Flat group view"
          items={FLAT_GROUP_MODE_ITEMS}
          value={flatGroupMode}
          onChange={onFlatGroupModeChange}
        />
      </Visibility>
      <SegmentedControl
        className={styles['worktree-detail-sidebar__view-toggle']}
        density="compact"
        ariaLabel="File list view"
        items={FILE_LIST_MODE_ITEMS}
        value={fileListMode}
        onChange={onFileListModeChange}
      />
    </footer>
  );
}
