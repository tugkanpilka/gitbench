export interface WorktreeDto {
  path: string;
  branch: string | null;
  headSha: string;
  isMain: boolean;
  isLocked: boolean;
}

export interface ListWorktreesRequest {
  repoPath: string;
}

export type ListWorktreesResponse = WorktreeDto[];
