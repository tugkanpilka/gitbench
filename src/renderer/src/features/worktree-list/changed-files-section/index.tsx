import { DiffStat } from '../../../shared/ui/diff-stat';
import { FileNavigationList } from '../file-navigation-list';
import type { TProps } from './index.types';
import styles from '../index.module.scss';

/** The "Changes" panel for the selected worktree: header, totals, and file navigation. */
export function ChangedFilesSection({
  changedFiles,
  fileListMode,
  activeFileId,
  diffStats,
  onSelectFile,
}: TProps) {
  return (
    <div className={styles['worktree-files-section']}>
      <header className={styles['worktree-files-section__header']}>
        <h2 className={styles['worktree-files-section__label']}>Changes</h2>
        {diffStats && <DiffStat additions={diffStats.additions} deletions={diffStats.deletions} />}
      </header>
      <FileNavigationList
        files={changedFiles}
        mode={fileListMode}
        activeFileId={activeFileId}
        onSelectFile={onSelectFile}
      />
    </div>
  );
}
