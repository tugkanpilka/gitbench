import { FileListProvider } from '../file-list-context';
import { FileNavigationList } from '../file-navigation-list';
import type { ChangedFilesSectionProps } from './index.types';
import styles from '../index.module.scss';

type FileGroup = {
  key: 'added' | 'modified' | 'deleted' | 'other';
  label: string;
  files: ChangedFilesSectionProps['changedFiles'];
};

function groupChangedFiles(files: ChangedFilesSectionProps['changedFiles']): FileGroup[] {
  const groups: FileGroup[] = [
    { key: 'added', label: 'Added', files: [] },
    { key: 'modified', label: 'Modified', files: [] },
    { key: 'deleted', label: 'Deleted', files: [] },
    { key: 'other', label: 'Other', files: [] },
  ];

  for (const file of files) {
    if (file.file.type === 'add') {
      groups[0].files.push(file);
    } else if (file.file.type === 'delete') {
      groups[2].files.push(file);
    } else if (file.file.type === 'modify') {
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
  activeFileId,
  onSelectFile,
}: ChangedFilesSectionProps) {
  const groups = groupChangedFiles(changedFiles);

  return (
    <section className={styles['worktree-files-section']} aria-label="Changes">
      <header className={styles['worktree-files-section__header']}>
        <h2 className={styles['worktree-files-section__label']}>Changes</h2>
        <span className={styles['worktree-file-group__count']}>{changedFiles.length}</span>
      </header>
      {groups.length === 0 ? (
        <p className={styles['worktree-files-section__empty']}>No uncommitted changes.</p>
      ) : (
        groups.map((group) => (
          <div key={group.key} className={styles['worktree-file-group']}>
            <div
              className={`${styles['worktree-file-group__header']} ${styles[`worktree-file-group__header--${group.key}`]}`}
            >
              <span>{group.label}</span>
              <span className={styles['worktree-file-group__count']}>{group.files.length}</span>
            </div>
            <FileListProvider
              files={group.files}
              activeFileId={activeFileId}
              onSelectFile={onSelectFile}
            >
              <FileNavigationList files={group.files} mode={fileListMode} />
            </FileListProvider>
          </div>
        ))
      )}
    </section>
  );
}
