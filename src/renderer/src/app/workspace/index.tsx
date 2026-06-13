import { DiffView } from '../../features/diff-viewer';
import { cx } from '../../shared/ui/cx';
import type { WorkspaceProps } from './index.types';
import styles from './index.module.scss';

export function Workspace({
  error,
  diffLoading,
  hasDiff,
  isCleanWorktree,
  diffModel,
  navigationTarget,
  scrollContainerRef,
  onActiveFileChange,
}: WorkspaceProps) {
  const classes = cx(styles['workspace'], hasDiff && styles['workspace--diff']);

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
          Select a worktree to view all uncommitted changes.
        </p>
      )}
      {hasDiff && !error && (
        <DiffView
          model={diffModel}
          clean={isCleanWorktree}
          viewType="unified"
          navigationTarget={navigationTarget}
          scrollContainerRef={scrollContainerRef}
          onActiveFileChange={onActiveFileChange}
        />
      )}
    </div>
  );
}
