// The ONLY renderer code that sees Result envelopes — unwraps them into data or ApiError.
import type {
  GetDiffResponse,
  ListUnpushedCommitsResponse,
  ListWorktreesResponse,
  PickRepositoryResponse,
  Result,
} from '../../../../contracts/ipc';
import { ApiError } from './ApiError';

function unwrap<T>(result: Result<T>): T {
  if (result.ok) {
    return result.data;
  }
  throw new ApiError(result.error.code, result.error.message);
}

export const desktopApi = {
  async pickRepo(): Promise<PickRepositoryResponse> {
    return unwrap(await window.api.pickRepo());
  },
  async listWorktrees(repoPath: string): Promise<ListWorktreesResponse> {
    return unwrap(await window.api.listWorktrees(repoPath));
  },
  async getDiff(worktreePath: string): Promise<GetDiffResponse> {
    return unwrap(await window.api.getDiff(worktreePath));
  },
  async listUnpushedCommits(worktreePath: string): Promise<ListUnpushedCommitsResponse> {
    return unwrap(await window.api.listUnpushedCommits(worktreePath));
  },
  async startWatch(repoPath: string, selectedWorktreePath: string | null): Promise<null> {
    return unwrap(await window.api.startWatch(repoPath, selectedWorktreePath));
  },
  async stopWatch(): Promise<null> {
    return unwrap(await window.api.stopWatch());
  },
  // Not a Result envelope — a direct subscription that returns its unsubscribe fn.
  onRepoChanged(listener: () => void): () => void {
    return window.api.onRepoChanged(listener);
  },
};
