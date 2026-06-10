import type { Worktree } from '../../../domain/worktree/Worktree';
import type { WorktreeReader } from '../ports/WorktreeReader';

export function makeListWorktrees(reader: WorktreeReader) {
  return function listWorktrees(repoPath: string): Promise<Worktree[]> {
    return reader.listWorktrees(repoPath);
  };
}
