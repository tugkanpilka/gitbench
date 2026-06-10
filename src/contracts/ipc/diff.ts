export interface GetDiffRequest {
  worktreePath: string;
}

export interface GetDiffResponse {
  /** An empty string is a valid clean-worktree result. */
  diffText: string;
}
