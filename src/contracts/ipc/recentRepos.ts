export interface RecentRepoDto {
  repoPath: string;
  openedAt: string; // ISO 8601
  worktreeCount: number | null; // null when git is temporarily unreachable
}

export interface AddRecentRepoRequest {
  repoPath: string;
}

export type ListRecentReposResponse = RecentRepoDto[];
