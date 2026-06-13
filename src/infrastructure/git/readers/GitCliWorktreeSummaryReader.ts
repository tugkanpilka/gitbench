import type {
  WorktreeSummary,
  WorktreeSummaryReader,
} from '../../../application/worktrees/ports/WorktreeSummaryReader';
import { mapWithConcurrency } from '../mapWithConcurrency';
import {
  parseNumstat,
  parseWorktreeStatus,
  type LineStats,
} from '../parsers/worktreeSummaryParser';
import { refResolves } from '../refResolves';
import { runGit } from '../runGit';
import { resolveUnpushedStrategy } from '../unpushedStrategy';

const SUMMARY_CONCURRENCY = 4;
const UNTRACKED_STATS_CONCURRENCY = 8;

export class GitCliWorktreeSummaryReader implements WorktreeSummaryReader {
  async listWorktreeSummaries(worktreePaths: string[]): Promise<WorktreeSummary[]> {
    // Summaries are decorative: one unreadable worktree (mid-rebase, permissions,
    // a transient git error) must not blank out every other row's stats. Drop the
    // failed path so the renderer simply shows that worktree without a summary.
    const summaries = await mapWithConcurrency(worktreePaths, SUMMARY_CONCURRENCY, (path) =>
      this.readSummary(path).catch(() => null)
    );
    return summaries.filter((summary): summary is WorktreeSummary => summary !== null);
  }

  private async readSummary(worktreePath: string): Promise<WorktreeSummary> {
    const [statusOutput, headExists, hasUpstream] = await Promise.all([
      runGit(worktreePath, ['status', '--porcelain=v1', '-z', '--untracked-files=all']),
      refResolves(worktreePath, 'HEAD'),
      refResolves(worktreePath, '@{upstream}'),
    ]);
    const status = parseWorktreeStatus(statusOutput);

    if (!headExists) {
      return {
        worktreePath,
        fileCount: status.fileCount,
        additions: 0,
        deletions: 0,
        conflictCount: status.conflictCount,
        unpushedCount: 0,
        behindCount: null,
      };
    }

    const [trackedStatsOutput, untrackedStats, pushCounts] = await Promise.all([
      runGit(worktreePath, ['--no-pager', 'diff', '--numstat', 'HEAD']),
      this.getUntrackedStats(worktreePath, status.untrackedPaths),
      this.getPushCounts(worktreePath, hasUpstream),
    ]);
    const trackedStats = parseNumstat(trackedStatsOutput);

    return {
      worktreePath,
      fileCount: status.fileCount,
      additions: trackedStats.additions + untrackedStats.additions,
      deletions: trackedStats.deletions + untrackedStats.deletions,
      conflictCount: status.conflictCount,
      unpushedCount: pushCounts.unpushedCount,
      behindCount: pushCounts.behindCount,
    };
  }

  private async getUntrackedStats(
    worktreePath: string,
    untrackedPaths: string[]
  ): Promise<LineStats> {
    const perFile = await mapWithConcurrency(
      untrackedPaths,
      UNTRACKED_STATS_CONCURRENCY,
      async (path) => {
        const output = await runGit(
          worktreePath,
          [
            '--no-pager',
            'diff',
            '--no-index',
            '--numstat',
            '--no-ext-diff',
            '--no-textconv',
            '--',
            '/dev/null',
            path,
          ],
          { acceptedExitCodes: [1] }
        );
        return parseNumstat(output);
      }
    );

    return perFile.reduce<LineStats>(
      (total, stats) => ({
        additions: total.additions + stats.additions,
        deletions: total.deletions + stats.deletions,
      }),
      { additions: 0, deletions: 0 }
    );
  }

  private async getPushCounts(
    worktreePath: string,
    hasUpstream: boolean
  ): Promise<{ unpushedCount: number; behindCount: number | null }> {
    const strategy = await resolveUnpushedStrategy(worktreePath, hasUpstream);

    if (strategy === 'upstream') {
      // --left-right --count yields "<behind>\t<ahead>" against the tracking branch.
      const output = await runGit(worktreePath, [
        'rev-list',
        '--left-right',
        '--count',
        '@{upstream}...HEAD',
      ]);
      const [behind = '0', ahead = '0'] = output.trim().split(/\s+/);
      return { unpushedCount: parseCount(ahead), behindCount: parseCount(behind) };
    }

    if (strategy === 'none') {
      return { unpushedCount: 0, behindCount: null };
    }

    // No upstream but remotes exist: count commits absent from every remote-tracking
    // ref. "Behind" is undefined without a tracking branch.
    const output = await runGit(worktreePath, [
      'rev-list',
      '--count',
      'HEAD',
      '--not',
      '--remotes',
    ]);
    return { unpushedCount: parseCount(output), behindCount: null };
  }
}

function parseCount(value: string): number {
  const count = Number.parseInt(value.trim(), 10);
  return Number.isFinite(count) ? count : 0;
}
