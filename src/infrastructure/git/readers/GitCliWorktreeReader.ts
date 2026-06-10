import type { WorktreeReader } from '../../../application/worktrees/ports/WorktreeReader';
import type { Worktree } from '../../../domain/worktree/Worktree';
import { parseWorktreeListPorcelain } from '../parsers/porcelainParser';
import { runGit } from '../runGit';

export class GitCliWorktreeReader implements WorktreeReader {
  async listWorktrees(repoPath: string): Promise<Worktree[]> {
    const output = await runGit(repoPath, ['worktree', 'list', '--porcelain']);
    return parseWorktreeListPorcelain(output);
  }
}
