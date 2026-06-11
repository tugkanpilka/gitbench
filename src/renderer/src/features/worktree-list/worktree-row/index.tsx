import { nameFromPath } from '../../../shared/path/nameFromPath';
import { Badge } from '../../../shared/ui/badge';
import type { TProps } from './index.types';
import styles from '../index.module.scss';

function worktreeReference(branch: string | null, shortSha: string): string {
  if (branch !== null) {
    return branch;
  }
  return shortSha ? `detached @ ${shortSha}` : 'detached HEAD';
}

export function WorktreeRow({ worktree, selected, fileCount, onSelect }: TProps) {
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
        <svg
          className={styles['worktree-row__icon']}
          viewBox="0 0 16 16"
          width="12"
          height="12"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122v5.256a2.25 2.25 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 9.5 3.25ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM4.25 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Z" />
        </svg>
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
