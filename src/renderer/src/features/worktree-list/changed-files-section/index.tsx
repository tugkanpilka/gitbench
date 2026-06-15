import { useMemo } from 'react';

import { cx } from '../../../shared/ui/cx';
import { Match, Switch } from '../../../shared/ui/switch';
import { Visibility } from '../../../shared/ui/visibility';
import type { ChangedFileItem } from '../changed-file-item';
import { FileListProvider } from '../file-list-context';
import { FileNavigationList } from '../file-navigation-list';
import type { ChangedFilesSectionProps } from './index.types';
import styles from '../index.module.scss';

type GroupKey = 'added' | 'modified' | 'deleted' | 'other' | 'all';
type FileGroup = { key: GroupKey; label: string; files: ChangedFileItem[] };
type FileListMode = ChangedFilesSectionProps['fileListMode'];

const STATUS_BUCKET: Record<string, number> = { add: 0, modify: 1, delete: 2 };

function groupChangedFiles(files: ChangedFileItem[]): FileGroup[] {
  const groups: FileGroup[] = [
    { key: 'added', label: 'Added', files: [] },
    { key: 'modified', label: 'Modified', files: [] },
    { key: 'deleted', label: 'Deleted', files: [] },
    { key: 'other', label: 'Other', files: [] },
  ];
  for (const file of files) {
    groups[STATUS_BUCKET[file.status] ?? 3].files.push(file);
  }
  return groups.filter((g) => g.files.length > 0);
}

function FileGroupHeader({ group, isGrouped }: { group: FileGroup; isGrouped: boolean }) {
  return (
    <Visibility isVisible={isGrouped}>
      <div
        className={cx(
          styles['worktree-file-group__header'],
          styles[`worktree-file-group__header--${group.key}`]
        )}
      >
        <span>{group.label}</span>
        <span className={styles['worktree-file-group__count']}>{group.files.length}</span>
      </div>
    </Visibility>
  );
}

interface FileGroupSectionProps {
  group: FileGroup;
  isGrouped: boolean;
  fileListMode: FileListMode;
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
}

// eslint-disable-next-line max-lines-per-function -- pure JSX group section; Prettier multi-prop formatting inflates count
function FileGroupSection({
  group,
  isGrouped,
  fileListMode,
  activeFileId,
  onSelectFile,
}: FileGroupSectionProps) {
  return (
    <div className={styles['worktree-file-group']}>
      <FileGroupHeader group={group} isGrouped={isGrouped} />
      <FileListProvider files={group.files} activeFileId={activeFileId} onSelectFile={onSelectFile}>
        <FileNavigationList files={group.files} mode={fileListMode} />
      </FileListProvider>
    </div>
  );
}

interface FileGroupListProps {
  groups: FileGroup[];
  isGrouped: boolean;
  fileListMode: FileListMode;
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
}

// eslint-disable-next-line max-lines-per-function -- pure JSX list of FileGroupSections; Prettier multi-prop formatting inflates count
function FileGroupList({
  groups,
  isGrouped,
  fileListMode,
  activeFileId,
  onSelectFile,
}: FileGroupListProps) {
  return (
    <>
      {groups.map((group) => (
        <FileGroupSection
          key={group.key}
          group={group}
          isGrouped={isGrouped}
          fileListMode={fileListMode}
          activeFileId={activeFileId}
          onSelectFile={onSelectFile}
        />
      ))}
    </>
  );
}

interface SectionHeaderProps {
  count: number;
}

function SectionHeader({ count }: SectionHeaderProps) {
  return (
    <header className={styles['worktree-files-section__header']}>
      <h2 className={styles['worktree-files-section__label']}>Changes</h2>
      <span className={styles['worktree-file-group__count']}>{count}</span>
    </header>
  );
}

function useFileGroups(
  changedFiles: ChangedFileItem[],
  fileListMode: FileListMode,
  flatGroupMode: ChangedFilesSectionProps['flatGroupMode']
): { groups: FileGroup[]; isGrouped: boolean } {
  const statusGroups = useMemo(() => groupChangedFiles(changedFiles), [changedFiles]);
  const isGrouped = fileListMode === 'tree' || flatGroupMode === 'status';
  const groups = isGrouped
    ? statusGroups
    : [{ key: 'all' as GroupKey, label: 'All Files', files: changedFiles }];
  return { groups, isGrouped };
}

/** The "Changes" panel for the selected worktree: header, totals, and file navigation. */
// eslint-disable-next-line max-lines-per-function -- top-level section; decomposed into SectionHeader/FileGroupList; Prettier multi-prop formatting inflates count
export function ChangedFilesSection({
  changedFiles,
  fileListMode,
  flatGroupMode,
  activeFileId,
  onSelectFile,
}: ChangedFilesSectionProps) {
  const { groups, isGrouped } = useFileGroups(changedFiles, fileListMode, flatGroupMode);
  const listProps = { groups, isGrouped, fileListMode, activeFileId, onSelectFile };
  return (
    <section className={styles['worktree-files-section']} aria-label="Changes">
      <SectionHeader count={changedFiles.length} />
      <Switch>
        <Match when={changedFiles.length === 0}>
          <p className={styles['worktree-files-section__empty']}>No uncommitted changes.</p>
        </Match>
        <Match when={true}>
          <FileGroupList {...listProps} />
        </Match>
      </Switch>
    </section>
  );
}
