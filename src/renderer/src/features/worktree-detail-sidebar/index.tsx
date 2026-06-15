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

const FLAT_GROUP_MODE_ITEMS = [
  { value: 'none', label: 'No Group' },
  { value: 'status', label: 'By Status' },
] as const;

type IdentityProps = Pick<WorktreeDetailSidebarProps, 'worktree' | 'diffStats'>;

function WorktreeIdentityDiffStat({ diffStats }: Pick<IdentityProps, 'diffStats'>) {
  return (
    <Visibility isVisible={diffStats !== null}>
      <DiffStat
        className={styles['worktree-detail-sidebar__diff-stat']}
        additions={diffStats?.additions ?? 0}
        deletions={diffStats?.deletions ?? 0}
      />
    </Visibility>
  );
}

function WorktreeIdentity({ worktree, diffStats }: IdentityProps) {
  const reference = worktree?.branch ?? 'Detached HEAD';
  const worktreePath = worktree?.path ?? '';
  const worktreeName = worktreePath !== '' ? nameFromPath(worktreePath) : '';

  return (
    <div className={styles['worktree-detail-sidebar__identity']}>
      <div className={styles['worktree-detail-sidebar__title']}>
        <span className={styles['worktree-detail-sidebar__name']} title={worktreePath}>{worktreeName}</span>
        <WorktreeIdentityDiffStat diffStats={diffStats} />
      </div>
      <span className={styles['worktree-detail-sidebar__reference']} title={reference}>{reference}</span>
    </div>
  );
}

type ToggleProps = { label: string; expanded: boolean; collapsed: boolean; onClick: () => void; iconClassName: string };

function SidebarToggleButton({ label, expanded, collapsed, onClick, iconClassName }: ToggleProps) {
  return (
    <button type="button" className={styles['worktree-detail-sidebar__back']} aria-label={label} aria-expanded={expanded} onClick={onClick}>
      <Chevron collapsed={collapsed} className={iconClassName} />
    </button>
  );
}

type DetailHeaderProps = Pick<WorktreeDetailSidebarProps, 'repositorySidebarOpen' | 'onToggleRepositorySidebar'> & { children?: ReactNode };

function DetailHeader({ repositorySidebarOpen, onToggleRepositorySidebar, children }: DetailHeaderProps) {
  const sidebarToggleLabel = repositorySidebarOpen ? 'Hide worktree sidebar' : 'Show worktree sidebar';

  return (
    <header className={styles['worktree-detail-sidebar__header']} data-repository-sidebar-open={repositorySidebarOpen}>
      <div className={styles['worktree-detail-sidebar__toolbar']}>
        <div className={styles['worktree-detail-sidebar__toolbar-content']}>
          <SidebarToggleButton label={sidebarToggleLabel} expanded={repositorySidebarOpen} collapsed={!repositorySidebarOpen} onClick={onToggleRepositorySidebar} iconClassName={styles['worktree-detail-sidebar__back-icon']} />
          {children}
        </div>
      </div>
    </header>
  );
}

type FlatGroupControlProps = { flatGroupMode: WorktreeDetailSidebarProps['flatGroupMode']; onChange: WorktreeDetailSidebarProps['onFlatGroupModeChange']; className: string; isVisible: boolean };

function FlatGroupControl({ flatGroupMode, onChange, className, isVisible }: FlatGroupControlProps) {
  return (
    <Visibility isVisible={isVisible}>
      <SegmentedControl className={className} density="compact" ariaLabel="Flat group view" items={FLAT_GROUP_MODE_ITEMS} value={flatGroupMode} onChange={onChange} />
    </Visibility>
  );
}

type DetailFooterProps = Pick<WorktreeDetailSidebarProps, 'fileListMode' | 'flatGroupMode' | 'onFileListModeChange' | 'onFlatGroupModeChange'>;

function DetailFooter({ fileListMode, flatGroupMode, onFileListModeChange, onFlatGroupModeChange }: DetailFooterProps) {
  return (
    <footer className={styles['worktree-detail-sidebar__footer']}>
      <FlatGroupControl flatGroupMode={flatGroupMode} onChange={onFlatGroupModeChange} className={styles['worktree-detail-sidebar__view-toggle']} isVisible={fileListMode === 'flat'} />
      <SegmentedControl className={styles['worktree-detail-sidebar__view-toggle']} density="compact" ariaLabel="File list view" items={FILE_LIST_MODE_ITEMS} value={fileListMode} onChange={onFileListModeChange} />
    </footer>
  );
}

type ContentProps = Pick<WorktreeDetailSidebarProps, 'worktree' | 'changedFiles' | 'unpushedCommits' | 'commitsTruncated' | 'diffLoading' | 'fileListMode' | 'flatGroupMode' | 'activeFileId' | 'onSelectFile'>;

function ChangedFilesOrLoading({ diffLoading, changedFiles, fileListMode, flatGroupMode, activeFileId, onSelectFile }: Omit<ContentProps, 'worktree' | 'unpushedCommits' | 'commitsTruncated'>) {
  return (
    <Switch>
      <Match when={diffLoading}>
        <p className={styles['worktree-detail-sidebar__loading']}>Loading changes…</p>
      </Match>
      <Match when={true}>
        <ChangedFilesSection changedFiles={changedFiles} fileListMode={fileListMode} flatGroupMode={flatGroupMode} activeFileId={activeFileId} onSelectFile={onSelectFile} />
      </Match>
    </Switch>
  );
}

function WorktreeDetailContent({ worktree, changedFiles, unpushedCommits, commitsTruncated, diffLoading, fileListMode, flatGroupMode, activeFileId, onSelectFile }: ContentProps) {
  return (
    <Switch>
      <Match when={worktree === null}><p className={styles['worktree-detail-sidebar__placeholder']}>Select a worktree to inspect its changes.</p></Match>
      <Match when={true}>
        <div className={styles['worktree-detail-sidebar__content']}>
          <ChangedFilesOrLoading diffLoading={diffLoading} changedFiles={changedFiles} fileListMode={fileListMode} flatGroupMode={flatGroupMode} activeFileId={activeFileId} onSelectFile={onSelectFile} />
        </div>
        <Visibility isVisible={unpushedCommits.length > 0}>
          <UnpushedCommitsSection commits={unpushedCommits} truncated={commitsTruncated} />
        </Visibility>
      </Match>
    </Switch>
  );
}

export function WorktreeDetailSidebar({ worktree, changedFiles, unpushedCommits, commitsTruncated, diffLoading, fileListMode, flatGroupMode, activeFileId, diffStats, repositorySidebarOpen, onSelectFile, onFileListModeChange, onFlatGroupModeChange, onToggleRepositorySidebar }: WorktreeDetailSidebarProps) {
  return (
    <div className={styles['worktree-detail-sidebar']}>
      <DetailHeader repositorySidebarOpen={repositorySidebarOpen} onToggleRepositorySidebar={onToggleRepositorySidebar}>
        <Visibility isVisible={worktree !== null}>
          <WorktreeIdentity worktree={worktree} diffStats={diffStats} />
        </Visibility>
      </DetailHeader>
      <WorktreeDetailContent worktree={worktree} changedFiles={changedFiles} unpushedCommits={unpushedCommits} commitsTruncated={commitsTruncated} diffLoading={diffLoading} fileListMode={fileListMode} flatGroupMode={flatGroupMode} activeFileId={activeFileId} onSelectFile={onSelectFile} />
      <DetailFooter fileListMode={fileListMode} flatGroupMode={flatGroupMode} onFileListModeChange={onFileListModeChange} onFlatGroupModeChange={onFlatGroupModeChange} />
    </div>
  );
}
