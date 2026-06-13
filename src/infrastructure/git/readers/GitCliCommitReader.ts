import type {
  CommitReader,
  UnpushedCommits,
} from '../../../application/worktrees/ports/CommitReader';
import { COMMIT_LOG_FORMAT, parseCommitLog } from '../parsers/commitLogParser';
import { refResolves } from '../refResolves';
import { runGit } from '../runGit';
import { resolveUnpushedStrategy } from '../unpushedStrategy';

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

    const strategy = await resolveUnpushedStrategy(worktreePath, hasUpstream);
    if (strategy === 'none') {
      // No upstream and no remote — "unpushed" is undefined, so show nothing.
      return { commits: [], truncated: false };
    }
    const range = strategy === 'upstream' ? ['@{upstream}..HEAD'] : ['HEAD', '--not', '--remotes'];

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
}
