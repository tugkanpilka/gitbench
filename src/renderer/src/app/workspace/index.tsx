import type { RefObject } from 'react';
import { DiffView } from '../../features/diff-viewer';
import { cx } from '../../shared/ui/cx';
import { Match, Switch } from '../../shared/ui/switch';
import type { DiffModel } from '../../features/diff-viewer/utils/diffModel.types';
import type { DiffNavigationTarget } from '../../features/diff-viewer/index.types';
import type { WorkspaceProps } from './index.types';
import styles from './index.module.scss';

interface DiffPanelProps {
  model: DiffModel;
  clean: boolean;
  navigationTarget: DiffNavigationTarget | null;
  scrollContainerRef: RefObject<HTMLElement | null>;
  onActiveFileChange: (fileId: string | null) => void;
}

function DiffPanel(
  { model, clean, navigationTarget, scrollContainerRef, onActiveFileChange }: DiffPanelProps
) {
  return (
    <DiffView
      model={model}
      clean={clean}
      viewType="unified"
      navigationTarget={navigationTarget}
      scrollContainerRef={scrollContainerRef}
      onActiveFileChange={onActiveFileChange}
    />
  );
}

function ErrorState({ error }: { error: string | null }) {
  return <div className={styles['workspace__error']} role="alert">{error}</div>;
}

function LoadingState() {
  return <div className={styles['workspace__loading']} role="status">Loading diff…</div>;
}

function EmptyState() {
  return (
    <p className={styles['workspace__placeholder']}>
      Select a worktree to view all uncommitted changes.
    </p>
  );
}

function WorkspaceSwitch(
  { error, diffLoading, hasDiff, diffPanelProps }: { error: string | null; diffLoading: boolean; hasDiff: boolean; diffPanelProps: DiffPanelProps }
) {
  return (
    <Switch>
      <Match when={!!error}><ErrorState error={error} /></Match>
      <Match when={diffLoading}><LoadingState /></Match>
      <Match when={!hasDiff}><EmptyState /></Match>
      <Match when={true}><DiffPanel {...diffPanelProps} /></Match>
    </Switch>
  );
}

export function Workspace(
  { error, diffLoading, hasDiff, isCleanWorktree, diffModel, navigationTarget, scrollContainerRef, onActiveFileChange }: WorkspaceProps
) {
  const classes = cx(styles['workspace'], hasDiff && styles['workspace--diff']);
  const panelProps: DiffPanelProps = { model: diffModel, clean: isCleanWorktree, navigationTarget, scrollContainerRef, onActiveFileChange };

  return (
    <div className={classes}>
      <WorkspaceSwitch error={error} diffLoading={diffLoading} hasDiff={hasDiff} diffPanelProps={panelProps} />
    </div>
  );
}
