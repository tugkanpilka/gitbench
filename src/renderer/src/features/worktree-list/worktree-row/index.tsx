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

export function WorktreeRow({
  worktree,
  selected,
  fileCount,
  unpushedCount,
  onSelect,
}: WorktreeRowProps) {
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
        {(fileCount !== null || unpushedCount !== null) && (
          <span className={styles['worktree-row__badges']}>
            {unpushedCount !== null && unpushedCount > 0 && (
              <span
                className={styles['worktree-row__unpushed']}
                aria-label={`${unpushedCount} unpushed`}
              >
                ↑{unpushedCount}
              </span>
            )}
            {fileCount !== null && <Badge onSelection={selected}>{fileCount}</Badge>}
          </span>
        )}
      </span>
    </button>
  );
}
