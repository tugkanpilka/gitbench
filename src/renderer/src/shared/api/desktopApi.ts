// The ONLY renderer code that sees Result envelopes — unwraps them into data or ApiError.
import type {
  ColorScheme,
  GetDiffResponse,
  ListRecentReposResponse,
  ListUnpushedCommitsResponse,
  ListWorktreeSummariesResponse,
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
  async listWorktreeSummaries(worktreePaths: string[]): Promise<ListWorktreeSummariesResponse> {
    return unwrap(await window.api.listWorktreeSummaries(worktreePaths));
  },
  async getDiff(worktreePath: string): Promise<GetDiffResponse> {
    return unwrap(await window.api.getDiff(worktreePath));
  },
  async listUnpushedCommits(worktreePath: string): Promise<ListUnpushedCommitsResponse> {
    return unwrap(await window.api.listUnpushedCommits(worktreePath));
  },
  async startWatch(repoPath: string, worktreePaths: string[]): Promise<null> {
    return unwrap(await window.api.startWatch(repoPath, worktreePaths));
  },
  async stopWatch(): Promise<null> {
    return unwrap(await window.api.stopWatch());
  },
  async listRecentRepos(): Promise<ListRecentReposResponse> {
    return unwrap(await window.api.listRecentRepos());
  },
  async addRecentRepo(repoPath: string): Promise<null> {
    return unwrap(await window.api.addRecentRepo({ repoPath }));
  },
  // Not a Result envelope — a direct subscription that returns its unsubscribe fn.
  onRepoChanged(listener: () => void): () => void {
    return window.api.onRepoChanged(listener);
  },
  // Resolved OS scheme at window creation; the renderer applies this before first paint.
  // A getter (not a plain field) so it reads window.api lazily — desktopApi is imported
  // before the preload bridge/test stub installs window.api.
  get initialColorScheme(): ColorScheme {
    return window.api.initialColorScheme;
  },
  // Live OS appearance changes — also a direct subscription, not a Result envelope.
  onThemeChanged(listener: (scheme: ColorScheme) => void): () => void {
    return window.api.onThemeChanged(listener);
  },
};
