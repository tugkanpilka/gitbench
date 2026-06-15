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

const UNTRACKED_NUMSTAT_ARGS = [
  '--no-pager',
  'diff',
  '--no-index',
  '--numstat',
  '--no-ext-diff',
  '--no-textconv',
  '--',
  '/dev/null',
] as const;

/**
 * A per-worktree status summary as read from git, before it is mapped to the contract
 * DTO at the IPC boundary. Structurally matches `WorktreeSummaryDto`; infrastructure
 * cannot import contracts, so the shape lives here and `worktreeSummaryMapper` is the
 * compile-time tripwire that keeps the two aligned.
 */
export interface WorktreeSummary {
  worktreePath: string;
  fileCount: number;
  additions: number;
  deletions: number;
  conflictCount: number;
  unpushedCount: number;
  behindCount: number | null;
}

export class GitCliWorktreeSummaryReader {
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
      return unbornSummary(worktreePath, status);
    }

    return this.readFullStats(worktreePath, status, hasUpstream);
  }

  // eslint-disable-next-line max-lines-per-function -- multi-line signature + Promise.all + destructure exhausts 15 lines; no meaningful split
  private async readFullStats(
    worktreePath: string,
    status: ReturnType<typeof parseWorktreeStatus>,
    hasUpstream: boolean
  ): Promise<WorktreeSummary> {
    const [trackedStatsOutput, untrackedStats, pushCounts] = await Promise.all([
      runGit(worktreePath, ['--no-pager', 'diff', '--numstat', 'HEAD']),
      this.getUntrackedStats(worktreePath, status.untrackedPaths),
      this.getPushCounts(worktreePath, hasUpstream),
    ]);
    return assembleSummary({
      worktreePath,
      status,
      trackedStats: parseNumstat(trackedStatsOutput),
      untrackedStats,
      pushCounts,
    });
  }

  private async getUntrackedStats(
    worktreePath: string,
    untrackedPaths: string[]
  ): Promise<LineStats> {
    const perFile = await mapWithConcurrency(untrackedPaths, UNTRACKED_STATS_CONCURRENCY, (path) =>
      this.fetchUntrackedFileStats(worktreePath, path)
    );
    return sumLineStats(perFile);
  }

  private async fetchUntrackedFileStats(worktreePath: string, path: string): Promise<LineStats> {
    const output = await runGit(worktreePath, [...UNTRACKED_NUMSTAT_ARGS, path], {
      acceptedExitCodes: [1],
    });
    return parseNumstat(output);
  }

  private async getPushCounts(
    worktreePath: string,
    hasUpstream: boolean
  ): Promise<{ unpushedCount: number; behindCount: number | null }> {
    const strategy = await resolveUnpushedStrategy(worktreePath, hasUpstream);

    if (strategy === 'none') {
      return { unpushedCount: 0, behindCount: null };
    }

    if (strategy === 'upstream') {
      return this.countUpstreamPushCounts(worktreePath);
    }

    return this.countRemoteOnlyPushCounts(worktreePath);
  }

  private async countUpstreamPushCounts(
    worktreePath: string
  ): Promise<{ unpushedCount: number; behindCount: number }> {
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

  private async countRemoteOnlyPushCounts(
    worktreePath: string
  ): Promise<{ unpushedCount: number; behindCount: null }> {
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

function sumLineStats(perFile: LineStats[]): LineStats {
  return perFile.reduce<LineStats>(
    (total, stats) => ({
      additions: total.additions + stats.additions,
      deletions: total.deletions + stats.deletions,
    }),
    { additions: 0, deletions: 0 }
  );
}

interface AssembleSummaryArgs {
  worktreePath: string;
  status: ReturnType<typeof parseWorktreeStatus>;
  trackedStats: LineStats;
  untrackedStats: LineStats;
  pushCounts: { unpushedCount: number; behindCount: number | null };
}

// eslint-disable-next-line max-lines-per-function -- pure data transform; destructured params + object literal exhaust 15 lines with no meaningful split
function assembleSummary({
  worktreePath,
  status,
  trackedStats,
  untrackedStats,
  pushCounts,
}: AssembleSummaryArgs): WorktreeSummary {
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

function unbornSummary(
  worktreePath: string,
  status: ReturnType<typeof parseWorktreeStatus>
): WorktreeSummary {
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
