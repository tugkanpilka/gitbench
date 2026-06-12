export interface WorktreeSummaryDto {
  worktreePath: string;
  fileCount: number;
  additions: number;
  deletions: number;
  conflictCount: number;
  unpushedCount: number;
  /** Commits present on the upstream but not locally; null when there is no upstream. */
  behindCount: number | null;
}

export interface ListWorktreeSummariesRequest {
  worktreePaths: string[];
}

export type ListWorktreeSummariesResponse = WorktreeSummaryDto[];
