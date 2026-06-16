import type { RecentRepoRecord } from './recentRepoRecord';

export interface RecentReposStore {
  add(repoPath: string): Promise<void>;
  list(): Promise<RecentRepoRecord[]>;
}
