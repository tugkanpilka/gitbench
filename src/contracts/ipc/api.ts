import type { GetDiffResponse } from './diff';
import type { PickRepositoryResponse } from './repository';
import type { Result } from './result';
import type { ListWorktreesResponse } from './worktrees';

export interface DesktopApi {
  pickRepo(): Promise<Result<PickRepositoryResponse>>;
  listWorktrees(repoPath: string): Promise<Result<ListWorktreesResponse>>;
  getDiff(worktreePath: string): Promise<Result<GetDiffResponse>>;
}
