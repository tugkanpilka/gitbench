import type { ListUnpushedCommitsResponse } from './commits';
import type { GetDiffResponse } from './diff';
import type { PickRepositoryResponse } from './repository';
import type { Result } from './result';
import type { ListWorktreeSummariesResponse } from './worktreeSummaries';
import type { ListWorktreesResponse } from './worktrees';

export interface DesktopApi {
  pickRepo(): Promise<Result<PickRepositoryResponse>>;
  listWorktrees(repoPath: string): Promise<Result<ListWorktreesResponse>>;
  listWorktreeSummaries(worktreePaths: string[]): Promise<Result<ListWorktreeSummariesResponse>>;
  getDiff(worktreePath: string): Promise<Result<GetDiffResponse>>;
  listUnpushedCommits(worktreePath: string): Promise<Result<ListUnpushedCommitsResponse>>;
  startWatch(repoPath: string, worktreePaths: string[]): Promise<Result<null>>;
  stopWatch(): Promise<Result<null>>;
  /** Subscribe to the "repo changed, re-query now" signal. Returns an unsubscribe fn. */
  onRepoChanged(listener: () => void): () => void;
}
