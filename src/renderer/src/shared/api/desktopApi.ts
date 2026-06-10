// The ONLY renderer code that sees Result envelopes — unwraps them into data or ApiError.
import type {
  GetDiffResponse,
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
};
