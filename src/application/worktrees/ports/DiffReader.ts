export interface DiffReader {
  /** Raw unified diff text. "" means a clean worktree — a valid success state, never an error. */
  getUncommittedDiff(worktreePath: string): Promise<string>;
}
