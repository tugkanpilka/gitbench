export interface StartWatchRequest {
  repoPath: string;
  /** Every current worktree root whose working files can affect sidebar summaries. */
  worktreePaths: string[];
}
