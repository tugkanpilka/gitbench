import type { Worktree } from '../../../domain/worktree/Worktree';

export interface WorktreeReader {
  listWorktrees(repoPath: string): Promise<Worktree[]>;
}
