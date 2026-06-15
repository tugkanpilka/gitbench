import { nameFromPath } from '../../../shared/path/nameFromPath';
import { Badge } from '../../../shared/ui/badge';
import { DiffStat, diffStatLabel } from '../../../shared/ui/diff-stat';
import { WorktreeIcon } from '../../../shared/ui/icons';
import { Visibility } from '../../../shared/ui/visibility';
import type { WorktreeSummaryDto } from '../../../../../contracts/ipc';
import type { WorktreeRowProps } from './index.types';
import styles from '../index.module.scss';

function worktreeReference(branch: string | null, shortSha: string): string {
  if (branch !== null) return branch;
  return shortSha ? `detached @ ${shortSha}` : 'detached HEAD';
}

function summaryLabels(s: WorktreeSummaryDto): (string | null)[] {
  const nFiles = s.fileCount;
  const fileLabel = nFiles === 0 ? 'clean' : `${nFiles} changed ${nFiles === 1 ? 'file' : 'files'}`;
  const statLabel = nFiles > 0 ? diffStatLabel(s.additions, s.deletions) : null;
  const conflictLabel = s.conflictCount > 0 ? `${s.conflictCount} ${s.conflictCount === 1 ? 'conflict' : 'conflicts'}` : null;
  const unpushedLabel = s.unpushedCount > 0 ? `${s.unpushedCount} unpushed` : null;
  const behindLabel = s.behindCount !== null && s.behindCount > 0 ? `${s.behindCount} behind` : null;
  return [fileLabel, statLabel, conflictLabel, unpushedLabel, behindLabel];
}

interface AccessibleLabelOptions {
  name: string; reference: string; shortSha: string;
  isMain: boolean; isLocked: boolean; summary: WorktreeSummaryDto | null;
}

function buildWorktreeAccessibleLabel(opts: AccessibleLabelOptions): string {
  const statuses = [opts.isMain ? 'main worktree' : null, opts.isLocked ? 'locked' : null];
  const labels = opts.summary === null ? [] : summaryLabels(opts.summary);
  return [opts.name, opts.reference, opts.shortSha, ...statuses, ...labels].filter(Boolean).join(', ');
}

function WorktreeCountBadges({ summary }: { summary: WorktreeSummaryDto }) {
  return (
    <>
      <Visibility isVisible={summary.conflictCount > 0}>
        <span className={styles['worktree-row__conflicts']}>!{summary.conflictCount}</span>
      </Visibility>
      <Visibility isVisible={summary.behindCount !== null && summary.behindCount > 0}>
        <span className={styles['worktree-row__sync']}>↓{summary.behindCount}</span>
      </Visibility>
      <Visibility isVisible={summary.unpushedCount > 0}>
        <span className={styles['worktree-row__sync']}>↑{summary.unpushedCount}</span>
      </Visibility>
    </>
  );
}

function WorktreeStatsBadges({ summary, selected }: { summary: WorktreeSummaryDto; selected: boolean }) {
  return (
    <>
      <Visibility isVisible={summary.fileCount > 0}>
        <DiffStat additions={summary.additions} deletions={summary.deletions} onSelection={selected} />
      </Visibility>
      <WorktreeCountBadges summary={summary} />
      <Visibility isVisible={summary.fileCount > 0}>
        <Badge onSelection={selected}>{summary.fileCount}</Badge>
      </Visibility>
    </>
  );
}

function WorktreeStats({ summary, selected, isLocked }: { summary: WorktreeSummaryDto | null; selected: boolean; isLocked: boolean }) {
  return (
    <span className={styles['worktree-row__stats']}>
      <Visibility isVisible={isLocked}>
        <span className={styles['worktree-row__state']}>Locked</span>
      </Visibility>
      <Visibility isVisible={summary !== null}>
        <WorktreeStatsBadges summary={summary!} selected={selected} />
      </Visibility>
    </span>
  );
}

function WorktreeRowLabel({ name, reference }: { name: string; reference: string }) {
  return (
    <span className={styles['worktree-row__content']}>
      <span className={styles['worktree-row__name']}>{name}</span>
      <Visibility isVisible={name !== reference}>
        <span className={styles['worktree-row__reference']}>{reference}</span>
      </Visibility>
    </span>
  );
}

export function WorktreeRow({ worktree, selected, summary, onSelect }: WorktreeRowProps) {
  const name = nameFromPath(worktree.path);
  const shortSha = worktree.headSha.slice(0, 7);
  const reference = worktreeReference(worktree.branch, shortSha);
  const label = buildWorktreeAccessibleLabel({ name, reference, shortSha, isMain: worktree.isMain, isLocked: worktree.isLocked, summary });
  return (
    <button type="button" className={styles['worktree-row']} aria-label={label}
      aria-pressed={selected} title={label} onClick={() => onSelect(worktree.path)}
    >
      <WorktreeIcon className={styles['worktree-row__icon']} />
      <WorktreeRowLabel name={name} reference={reference} />
      <WorktreeStats summary={summary} selected={selected} isLocked={worktree.isLocked} />
    </button>
  );
}
