export interface Worktree {
  path: string;
  branch: string | null; // null = detached HEAD, or a bare main worktree
  headSha: string; // "" for a bare main worktree (porcelain emits no HEAD line)
  isMain: boolean;
  isLocked: boolean;
}
