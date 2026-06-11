import { nameFromPath } from '../../../shared/path/nameFromPath';
import { Badge } from '../../../shared/ui/badge';
import { WorktreeIcon } from '../../../shared/ui/icons';
import type { WorktreeRowProps } from './index.types';
import styles from '../index.module.scss';

function worktreeReference(branch: string | null, shortSha: string): string {
  if (branch !== null) {
    return branch;
  }
  return shortSha ? `detached @ ${shortSha}` : 'detached HEAD';
}

export function WorktreeRow({ worktree, selected, fileCount, onSelect }: WorktreeRowProps) {
  const name = nameFromPath(worktree.path);
  const shortSha = worktree.headSha.slice(0, 7);
  const reference = worktreeReference(worktree.branch, shortSha);
  const statuses = [
    worktree.isMain ? 'main worktree' : null,
    worktree.isLocked ? 'locked' : null,
  ].filter(Boolean);
  const accessibleLabel = [name, reference, shortSha, ...statuses].join(', ');

  return (
    <button
      type="button"
      className={styles['worktree-row']}
      aria-label={accessibleLabel}
      aria-pressed={selected}
      onClick={() => onSelect(worktree.path)}
    >
      <span className={styles['worktree-row__top']}>
        <WorktreeIcon className={styles['worktree-row__icon']} />
        <span className={styles['worktree-row__name']}>{name}</span>
        {(fileCount !== null || worktree.isMain || worktree.isLocked) && (
          <span className={styles['worktree-row__badges']}>
            {fileCount !== null && (
              <Badge onSelection={selected}>
                <span aria-hidden="true">{fileCount}</span>
              </Badge>
            )}
            {worktree.isMain && <Badge onSelection={selected}>main</Badge>}
            {worktree.isLocked && <Badge onSelection={selected}>locked</Badge>}
          </span>
        )}
      </span>
      <span className={styles['worktree-row__reference']} title={reference}>
        {reference}
        <span className={styles['worktree-row__sha']}>{shortSha}</span>
      </span>
    </button>
  );
}
