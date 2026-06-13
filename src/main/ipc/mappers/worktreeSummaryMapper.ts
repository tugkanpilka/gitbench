import type { WorktreeSummaryDto } from '../../../contracts/ipc';
import type { WorktreeSummary } from '../../../infrastructure/git/readers/GitCliWorktreeSummaryReader';

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
