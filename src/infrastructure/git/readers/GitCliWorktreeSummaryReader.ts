import type {
  WorktreeSummary,
  WorktreeSummaryReader,
} from '../../../application/worktrees/ports/WorktreeSummaryReader';
import {
  parseNumstat,
  parseWorktreeStatus,
  type LineStats,
} from '../parsers/worktreeSummaryParser';
import { refResolves } from '../refResolves';
import { runGit } from '../runGit';

const SUMMARY_CONCURRENCY = 4;
const UNTRACKED_STATS_CONCURRENCY = 8;

export class GitCliWorktreeSummaryReader implements WorktreeSummaryReader {
  async listWorktreeSummaries(worktreePaths: string[]): Promise<WorktreeSummary[]> {
    const summaries: WorktreeSummary[] = [];

    for (let offset = 0; offset < worktreePaths.length; offset += SUMMARY_CONCURRENCY) {
      const batch = worktreePaths.slice(offset, offset + SUMMARY_CONCURRENCY);
      summaries.push(...(await Promise.all(batch.map((path) => this.readSummary(path)))));
    }

    return summaries;
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
    const total: LineStats = { additions: 0, deletions: 0 };

    for (let offset = 0; offset < untrackedPaths.length; offset += UNTRACKED_STATS_CONCURRENCY) {
      const batch = untrackedPaths.slice(offset, offset + UNTRACKED_STATS_CONCURRENCY);
      const outputs = await Promise.all(
        batch.map((path) =>
          runGit(
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
          )
        )
      );

      for (const output of outputs) {
        const stats = parseNumstat(output);
        total.additions += stats.additions;
        total.deletions += stats.deletions;
      }
    }

    return total;
  }

  private async getPushCounts(
    worktreePath: string,
    hasUpstream: boolean
  ): Promise<{ unpushedCount: number; behindCount: number | null }> {
    if (hasUpstream) {
      const output = await runGit(worktreePath, [
        'rev-list',
        '--left-right',
        '--count',
        '@{upstream}...HEAD',
      ]);
      const [behind = '0', ahead = '0'] = output.trim().split(/\s+/);
      return {
        unpushedCount: parseCount(ahead),
        behindCount: parseCount(behind),
      };
    }

    const remotes = (await runGit(worktreePath, ['remote'])).trim();
    if (remotes.length === 0) {
      return { unpushedCount: 0, behindCount: null };
    }

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
