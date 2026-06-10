import type { WorktreeDto } from '../../../../contracts/ipc';
import { nameFromPath } from '../../shared/path/nameFromPath';
import { Badge, DiffStat } from '../../shared/ui/core';

interface Props {
  worktree: WorktreeDto;
  selected: boolean;
  fileCount: number | null;
  diffStats: { additions: number; deletions: number } | null;
  onSelect: (worktreePath: string) => void;
}

function worktreeReference(worktree: WorktreeDto): string {
  if (worktree.branch !== null) {
    return worktree.branch;
  }
  return worktree.headSha ? `detached @ ${worktree.headSha.slice(0, 7)}` : 'detached HEAD';
}

export function WorktreeRow({ worktree, selected, fileCount, diffStats, onSelect }: Props) {
  const name = nameFromPath(worktree.path);
  const reference = worktreeReference(worktree);
  const statuses = [
    worktree.isMain ? 'main worktree' : null,
    worktree.isLocked ? 'locked' : null,
  ].filter(Boolean);
  const accessibleLabel = [name, reference, worktree.headSha.slice(0, 7), ...statuses].join(', ');

  return (
    <button
      type="button"
      className="worktree-row"
      aria-label={accessibleLabel}
      aria-pressed={selected}
      onClick={() => onSelect(worktree.path)}
    >
      <span className="worktree-row__top">
        <svg
          className="worktree-row__icon"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          fill="currentColor"
          aria-hidden="true"
          style={{ opacity: 0.5, flex: 'none', marginTop: 1 }}
        >
          <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122v5.256a2.25 2.25 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 9.5 3.25ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM4.25 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Z" />
        </svg>
        <span className="worktree-row__name">{name}</span>
        {(fileCount !== null || worktree.isMain || worktree.isLocked) && (
          <span className="worktree-row__badges">
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
      <span className="worktree-row__reference" title={reference}>
        {reference}
        <span style={{ opacity: 0.4, marginLeft: 6, fontVariantNumeric: 'tabular-nums' }}>
          {worktree.headSha.slice(0, 7)}
        </span>
      </span>
    </button>
  );
}
