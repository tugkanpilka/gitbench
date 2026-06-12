import { nameFromPath } from '../../../shared/path/nameFromPath';
import { Badge } from '../../../shared/ui/badge';
import { DiffStat, diffStatLabel } from '../../../shared/ui/diff-stat';
import { WorktreeIcon } from '../../../shared/ui/icons';
import type { WorktreeRowProps } from './index.types';
import styles from '../index.module.scss';

function worktreeReference(branch: string | null, shortSha: string): string {
  if (branch !== null) {
    return branch;
  }
  return shortSha ? `detached @ ${shortSha}` : 'detached HEAD';
}

export function WorktreeRow({ worktree, selected, summary, onSelect }: WorktreeRowProps) {
  const name = nameFromPath(worktree.path);
  const shortSha = worktree.headSha.slice(0, 7);
  const reference = worktreeReference(worktree.branch, shortSha);
  const statuses = [
    worktree.isMain ? 'main worktree' : null,
    worktree.isLocked ? 'locked' : null,
  ].filter(Boolean);
  const summaryLabels =
    summary === null
      ? []
      : [
          summary.fileCount === 0
            ? 'clean'
            : `${summary.fileCount} changed ${summary.fileCount === 1 ? 'file' : 'files'}`,
          summary.fileCount > 0 ? diffStatLabel(summary.additions, summary.deletions) : null,
          summary.conflictCount > 0
            ? `${summary.conflictCount} ${summary.conflictCount === 1 ? 'conflict' : 'conflicts'}`
            : null,
          summary.unpushedCount > 0 ? `${summary.unpushedCount} unpushed` : null,
          summary.behindCount !== null && summary.behindCount > 0
            ? `${summary.behindCount} behind`
            : null,
        ].filter(Boolean);
  const accessibleLabel = [name, reference, shortSha, ...statuses, ...summaryLabels].join(', ');

  return (
    <button
      type="button"
      className={styles['worktree-row']}
      aria-label={accessibleLabel}
      aria-pressed={selected}
      title={accessibleLabel}
      onClick={() => onSelect(worktree.path)}
    >
      <span className={styles['worktree-row__top']}>
        <WorktreeIcon className={styles['worktree-row__icon']} />
        <span className={styles['worktree-row__name']}>{name}</span>
        {summary !== null && summary.fileCount > 0 && (
          <Badge onSelection={selected}>{summary.fileCount}</Badge>
        )}
      </span>
      <span className={styles['worktree-row__meta']} aria-hidden="true">
        <span className={styles['worktree-row__reference']}>{reference}</span>
        <span className={styles['worktree-row__stats']}>
          {worktree.isLocked && <span className={styles['worktree-row__state']}>Locked</span>}
          {summary !== null && summary.conflictCount > 0 && (
            <span className={styles['worktree-row__conflicts']}>!{summary.conflictCount}</span>
          )}
          {summary !== null && summary.fileCount === 0 && (
            <span className={styles['worktree-row__clean']}>Clean</span>
          )}
          {summary !== null && summary.fileCount > 0 && (
            <DiffStat
              additions={summary.additions}
              deletions={summary.deletions}
              onSelection={selected}
            />
          )}
          {summary !== null && summary.behindCount !== null && summary.behindCount > 0 && (
            <span className={styles['worktree-row__sync']}>↓{summary.behindCount}</span>
          )}
          {summary !== null && summary.unpushedCount > 0 && (
            <span className={styles['worktree-row__sync']}>↑{summary.unpushedCount}</span>
          )}
        </span>
      </span>
    </button>
  );
}
