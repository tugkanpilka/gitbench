export interface WorktreeSummary {
  worktreePath: string;
  fileCount: number;
  additions: number;
  deletions: number;
  conflictCount: number;
  unpushedCount: number;
  behindCount: number | null;
}

export interface WorktreeSummaryReader {
  listWorktreeSummaries(worktreePaths: string[]): Promise<WorktreeSummary[]>;
}
