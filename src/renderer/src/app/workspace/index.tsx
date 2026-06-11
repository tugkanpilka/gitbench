import { DiffView } from '../../features/diff-viewer';
import type { TProps } from './index.types';
import styles from './index.module.scss';

export function Workspace({
  error,
  diffLoading,
  hasDiff,
  isCleanWorktree,
  diffModel,
  viewType,
  navigationTarget,
  onActiveFileChange,
}: TProps) {
  const classes = hasDiff 
    ? `${styles['workspace']} ${styles['workspace--diff']}` 
    : styles['workspace'];

  return (
    <div className={classes}>
      {error && (
        <div className={styles['workspace__error']} role="alert">
          {error}
        </div>
      )}
      {diffLoading && !error && (
        <div className={styles['workspace__loading']} role="status">
          Loading diff…
        </div>
      )}
      {!hasDiff && !diffLoading && !error && (
        <p className={styles['workspace__placeholder']}>
          Select a worktree to view uncommitted changes in tracked files.
        </p>
      )}
      {hasDiff && !error && (
        <DiffView
          model={diffModel}
          clean={isCleanWorktree}
          viewType={viewType}
          navigationTarget={navigationTarget}
          onActiveFileChange={onActiveFileChange}
        />
      )}
    </div>
  );
}
