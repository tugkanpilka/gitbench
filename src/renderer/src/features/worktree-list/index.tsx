import { Match, Switch } from '../../shared/ui/switch';
import { WorktreeRow } from './worktree-row';
import type { WorktreeListProps } from './index.types';
import styles from './index.module.scss';

// CLAUDE.md: "The sidebar should present worktrees as a simple, flat list. We don't
// attempt to group by branch or nest them, even if branch names share prefixes. This
// avoids the complexity of a tree view and ensures users can always see all worktrees."

export function WorktreeList({ worktrees, summaries, selectedPath, onSelect }: WorktreeListProps) {
  return (
    <Switch>
      <Match when={worktrees.length === 0}>
        <p className={styles['worktree-list__empty']}>No worktrees to display in this repository.</p>
      </Match>
      <Match when={true}>
        <ul className={styles['worktree-list']} aria-label="Worktrees">
          {worktrees.map((worktree) => {
            const selected = worktree.path === selectedPath;
            const summary =
              summaries.find((candidate) => candidate.worktreePath === worktree.path) ?? null;

            return (
              <li key={worktree.path}>
                <WorktreeRow
                  worktree={worktree}
                  selected={selected}
                  summary={summary}
                  onSelect={onSelect}
                />
              </li>
            );
          })}
        </ul>
      </Match>
    </Switch>
  );
}
