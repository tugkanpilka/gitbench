import type { CommitReader, UnpushedCommits } from '../../../application/worktrees/ports/CommitReader';
import { COMMIT_LOG_FORMAT, parseCommitLog } from '../parsers/commitLogParser';
import { refResolves } from '../refResolves';
import { runGit } from '../runGit';

// Cap the list so a long-lived local branch can't dump thousands of commits into the
// sidebar. We request one extra to detect (and flag) truncation honestly.
const MAX_COMMITS = 100;

export class GitCliCommitReader implements CommitReader {
  async listUnpushedCommits(worktreePath: string): Promise<UnpushedCommits> {
    // The probes are independent read-only rev-parses, so run them together.
    const [headExists, hasUpstream] = await Promise.all([
      refResolves(worktreePath, 'HEAD'),
      refResolves(worktreePath, '@{upstream}'),
    ]);

    // Unborn HEAD (zero commits): nothing to list. Real repo/git errors still throw.
    if (!headExists) {
      return { commits: [], truncated: false };
    }

    const range = await this.resolveUnpushedRange(worktreePath, hasUpstream);
    if (range === null) {
      // No upstream and no remote — "unpushed" is undefined, so show nothing.
      return { commits: [], truncated: false };
    }

    // `-c core.quotePath=false` keeps non-ASCII paths literal instead of \xNN-escaped.
    const stdout = await runGit(worktreePath, [
      '-c',
      'core.quotePath=false',
      '--no-pager',
      'log',
      ...range,
      '--no-color',
      `--max-count=${MAX_COMMITS + 1}`,
      '--name-status',
      `--format=${COMMIT_LOG_FORMAT}`,
    ]);

    const parsed = parseCommitLog(stdout);
    const truncated = parsed.length > MAX_COMMITS;
    return {
      commits: truncated ? parsed.slice(0, MAX_COMMITS) : parsed,
      truncated,
    };
  }

  /**
   * The rev range for "unpushed", in priority order:
   *  1. `@{upstream}..HEAD` — ahead of the branch's tracking branch (git status's count).
   *  2. `HEAD --not --remotes` — no upstream, but commits not on any remote-tracking ref.
   *  3. null — no remote at all; nothing is "pushable".
   */
  private async resolveUnpushedRange(
    worktreePath: string,
    hasUpstream: boolean
  ): Promise<string[] | null> {
    if (hasUpstream) {
      return ['@{upstream}..HEAD'];
    }

    const remotes = (await runGit(worktreePath, ['remote'])).trim();
    if (remotes.length === 0) {
      return null;
    }
    return ['HEAD', '--not', '--remotes'];
  }
}
