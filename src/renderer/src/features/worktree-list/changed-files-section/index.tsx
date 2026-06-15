import { useMemo } from 'react';

import { cx } from '../../../shared/ui/cx';
import { Match, Switch } from '../../../shared/ui/switch';
import { Visibility } from '../../../shared/ui/visibility';
import type { ChangedFileItem } from '../changed-file-item';
import { FileListProvider } from '../file-list-context';
import { FileNavigationList } from '../file-navigation-list';
import type { ChangedFilesSectionProps } from './index.types';
import styles from '../index.module.scss';

type FileGroup = {
  key: 'added' | 'modified' | 'deleted' | 'other';
  label: string;
  files: ChangedFileItem[];
};

// Pure and component-state-free, so it lives at module scope. Memoizing its call (below)
// keeps group references stable across unrelated re-renders, which stops FileListProvider
// from resetting collapse state when the file list itself has not changed.
function groupChangedFiles(files: ChangedFileItem[]): FileGroup[] {
  const groups: FileGroup[] = [
    { key: 'added', label: 'Added', files: [] },
    { key: 'modified', label: 'Modified', files: [] },
    { key: 'deleted', label: 'Deleted', files: [] },
    { key: 'other', label: 'Other', files: [] },
  ];

  for (const file of files) {
    if (file.status === 'add') {
      groups[0].files.push(file);
    } else if (file.status === 'delete') {
      groups[2].files.push(file);
    } else if (file.status === 'modify') {
      groups[1].files.push(file);
    } else {
      groups[3].files.push(file);
    }
  }

  return groups.filter((group) => group.files.length > 0);
}

/** The "Changes" panel for the selected worktree: header, totals, and file navigation. */
export function ChangedFilesSection({
  changedFiles,
  fileListMode,
  flatGroupMode,
  activeFileId,
  onSelectFile,
}: ChangedFilesSectionProps) {
  const isGrouped = fileListMode === 'tree' || flatGroupMode === 'status';
  const statusGroups = useMemo(() => groupChangedFiles(changedFiles), [changedFiles]);
  const groups = isGrouped
    ? statusGroups
    : [{ key: 'all' as const, label: 'All Files', files: changedFiles }];

  return (
    <section className={styles['worktree-files-section']} aria-label="Changes">
      <header className={styles['worktree-files-section__header']}>
        <h2 className={styles['worktree-files-section__label']}>Changes</h2>
        <span className={styles['worktree-file-group__count']}>{changedFiles.length}</span>
      </header>
      <Switch>
        <Match when={changedFiles.length === 0}>
          <p className={styles['worktree-files-section__empty']}>No uncommitted changes.</p>
        </Match>
        <Match when={true}>
          {groups.map((group) => (
            <div key={group.key} className={styles['worktree-file-group']}>
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
              <FileListProvider
                files={group.files}
                activeFileId={activeFileId}
                onSelectFile={onSelectFile}
              >
                <FileNavigationList files={group.files} mode={fileListMode} />
              </FileListProvider>
            </div>
          ))}
        </Match>
      </Switch>
    </section>
  );
}
