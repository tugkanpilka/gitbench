export interface StartWatchRequest {
  repoPath: string;
  /** The worktree whose diff is currently open, or null if none is selected. */
  selectedWorktreePath: string | null;
}
