import { DiffView } from '../../features/diff-viewer';
import { cx } from '../../shared/ui/cx';
import { Match, Switch } from '../../shared/ui/switch';
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
      <Switch>
        <Match when={!!error}>
          <div className={styles['workspace__error']} role="alert">
            {error}
          </div>
        </Match>
        <Match when={diffLoading}>
          <div className={styles['workspace__loading']} role="status">
            Loading diff…
          </div>
        </Match>
        <Match when={!hasDiff}>
          <p className={styles['workspace__placeholder']}>
            Select a worktree to view all uncommitted changes.
          </p>
        </Match>
        <Match when={true}>
          <DiffView
            model={diffModel}
            clean={isCleanWorktree}
            viewType="unified"
            navigationTarget={navigationTarget}
            scrollContainerRef={scrollContainerRef}
            onActiveFileChange={onActiveFileChange}
          />
        </Match>
      </Switch>
    </div>
  );
}
