import { Match, Switch } from '../../shared/ui/switch';
import { WorktreeRow } from './worktree-row';
import type { WorktreeListProps } from './index.types';
import type { WorktreeDto, WorktreeSummaryDto } from '../../../../contracts/ipc';
import styles from './index.module.scss';

// CLAUDE.md: flat list — no grouping, no hierarchy.

interface WorktreeItemProps {
  worktree: WorktreeDto;
  summaries: WorktreeSummaryDto[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function WorktreeItem({ worktree, summaries, selectedPath, onSelect }: WorktreeItemProps) {
  const selected = worktree.path === selectedPath;
  const summary = summaries.find((s) => s.worktreePath === worktree.path) ?? null;
  return (
    <li>
      <WorktreeRow worktree={worktree} selected={selected} summary={summary} onSelect={onSelect} />
    </li>
  );
}

function WorktreeItems({ worktrees, summaries, selectedPath, onSelect }: WorktreeListProps) {
  return (
    <ul className={styles['worktree-list']} aria-label="Worktrees">
      {worktrees.map((wt) => (
        <WorktreeItem
          key={wt.path}
          worktree={wt}
          summaries={summaries}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

export function WorktreeList(props: WorktreeListProps) {
  return (
    <Switch>
      <Match when={props.worktrees.length === 0}>
        <p className={styles['worktree-list__empty']}>
          No worktrees to display in this repository.
        </p>
      </Match>
      <Match when={true}>
        <WorktreeItems {...props} />
      </Match>
    </Switch>
  );
}
