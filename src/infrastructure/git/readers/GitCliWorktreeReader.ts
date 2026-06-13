import { parseWorktreeListPorcelain, type ParsedWorktree } from '../parsers/porcelainParser';
import { runGit } from '../runGit';

export class GitCliWorktreeReader {
  async listWorktrees(repoPath: string): Promise<ParsedWorktree[]> {
    const output = await runGit(repoPath, ['worktree', 'list', '--porcelain']);
    return parseWorktreeListPorcelain(output);
  }
}
