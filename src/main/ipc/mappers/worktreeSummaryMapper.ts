import type { WorktreeSummary } from '../../../application/worktrees/ports/WorktreeSummaryReader';
import type { WorktreeSummaryDto } from '../../../contracts/ipc';

export function toWorktreeSummaryDto(summary: WorktreeSummary): WorktreeSummaryDto {
  return {
    worktreePath: summary.worktreePath,
    fileCount: summary.fileCount,
    additions: summary.additions,
    deletions: summary.deletions,
    conflictCount: summary.conflictCount,
    unpushedCount: summary.unpushedCount,
    behindCount: summary.behindCount,
  };
}
