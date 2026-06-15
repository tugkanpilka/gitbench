import type { RecentRepoDto } from '../../../contracts/ipc';
import type { RecentRepoRecord } from '../../../infrastructure/recentRepos/recentRepoRecord';

export function toRecentRepoDto(record: RecentRepoRecord, worktreeCount: number | null): RecentRepoDto {
  return {
    repoPath: record.repoPath,
    openedAt: record.openedAt,
    worktreeCount,
  };
}
