import type { DiffReader } from '../../../application/worktrees/ports/DiffReader';
import { GitCommandFailedError } from '../errors/GitCommandFailedError';
import { runGit } from '../runGit';

export class GitCliDiffReader implements DiffReader {
  async getUncommittedDiff(worktreePath: string): Promise<string> {
    await this.assertHeadExists(worktreePath);
    // `diff HEAD` = staged + unstaged in one diff. "" output is a clean worktree — success.
    return runGit(worktreePath, ['--no-pager', 'diff', '--no-color', 'HEAD']);
  }

  /**
   * On an unborn HEAD (zero commits) `git diff HEAD` fails with a confusing
   * "ambiguous argument" error — detect it first and report clearly. Do not fake
   * an empty diff: there may be staged files, and an empty diff would lie.
   */
  private async assertHeadExists(worktreePath: string): Promise<void> {
    try {
      await runGit(worktreePath, ['rev-parse', '--verify', '--quiet', 'HEAD']);
    } catch (error) {
      if (error instanceof GitCommandFailedError) {
        // Keep the original stderr detail reachable for debugging via `cause`.
        throw new GitCommandFailedError('Repository has no commits yet.', { cause: error });
      }
      throw error; // GitNotInstalledError / NotARepositoryError / WorktreeNotFoundError
    }
  }
}
