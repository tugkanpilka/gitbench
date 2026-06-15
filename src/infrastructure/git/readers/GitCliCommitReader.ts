import type { UnpushedCommits } from '../../../application/worktrees/commits';
import { COMMIT_LOG_FORMAT, parseCommitLog } from '../parsers/commitLogParser';
import { refResolves } from '../refResolves';
import { runGit } from '../runGit';
import { resolveUnpushedStrategy } from '../unpushedStrategy';

// Cap the list so a long-lived local branch can't dump thousands of commits into the
// sidebar. We request one extra to detect (and flag) truncation honestly.
const MAX_COMMITS = 100;

const COMMIT_LOG_PREFIX_ARGS = ['-c', 'core.quotePath=false', '--no-pager', 'log'] as const;
const COMMIT_LOG_SUFFIX_ARGS = [
  '--no-color',
  `--max-count=${MAX_COMMITS + 1}`,
  '--name-status',
  `--format=${COMMIT_LOG_FORMAT}`,
] as const;

export class GitCliCommitReader {
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

    const strategy = await resolveUnpushedStrategy(worktreePath, hasUpstream);
    if (strategy === 'none') {
      // No upstream and no remote — "unpushed" is undefined, so show nothing.
      return { commits: [], truncated: false };
    }
    const range = strategy === 'upstream' ? ['@{upstream}..HEAD'] : ['HEAD', '--not', '--remotes'];

    return this.fetchUnpushedCommits(worktreePath, range);
  }

  private async fetchUnpushedCommits(
    worktreePath: string,
    range: string[]
  ): Promise<UnpushedCommits> {
    // `-c core.quotePath=false` keeps non-ASCII paths literal instead of \xNN-escaped.
    const stdout = await runGit(worktreePath, [
      ...COMMIT_LOG_PREFIX_ARGS,
      ...range,
      ...COMMIT_LOG_SUFFIX_ARGS,
    ]);
    return truncateCommits(parseCommitLog(stdout));
  }
}

function truncateCommits(parsed: ReturnType<typeof parseCommitLog>): UnpushedCommits {
  const truncated = parsed.length > MAX_COMMITS;
  return {
    commits: truncated ? parsed.slice(0, MAX_COMMITS) : parsed,
    truncated,
  };
}
