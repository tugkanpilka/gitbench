export interface RepoWatchTarget {
  repoPath: string;
  /** All current worktree roots; changes update row summaries and the selected diff. */
  worktreePaths: string[];
}

export interface RepoWatchHandle {
  /** Stop watching and release all filesystem resources. Safe to call more than once. */
  stop(): Promise<void>;
}

export interface RepoWatcher {
  /**
   * Begin watching a repo for changes that could affect the worktree list, row
   * summaries, or selected diff. `onChange` fires once per debounced burst — it is a
   * pure signal ("re-query now") and carries no data; git stays the source of truth.
   */
  watch(target: RepoWatchTarget, onChange: () => void): RepoWatchHandle;
}
