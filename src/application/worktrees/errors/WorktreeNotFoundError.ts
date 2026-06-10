export class WorktreeNotFoundError extends Error {
  constructor(path: string) {
    super(`Worktree not found: ${path}`);
    this.name = 'WorktreeNotFoundError';
  }
}
