import type {
  AddRecentRepoRequest,
  ListRecentReposResponse,
} from '../../../contracts/ipc';
import { IPC_CHANNELS } from '../../../contracts/ipc';
import type { GitCliWorktreeReader } from '../../../infrastructure/git/readers/GitCliWorktreeReader';
import type { RecentReposStore } from '../../../infrastructure/recentRepos/RecentReposStore';
import { handle } from '../handle';
import { toRecentRepoDto } from '../mappers/recentRepoMapper';

const CONCURRENCY = 3;

async function resolveWorktreeCount(
  reader: GitCliWorktreeReader,
  repoPath: string
): Promise<number | null> {
  try {
    const worktrees = await reader.listWorktrees(repoPath);
    return worktrees.length;
  } catch {
    return null;
  }
}

// eslint-disable-next-line max-lines-per-function -- fan-out with bounded concurrency; no meaningful sub-function to extract
async function listWithCounts(
  store: RecentReposStore,
  reader: GitCliWorktreeReader
): Promise<ListRecentReposResponse> {
  const records = await store.list();
  const results: ListRecentReposResponse = new Array(records.length);
  const queue = [...records.entries()];

  async function worker(): Promise<void> {
    let item = queue.shift();
    while (item !== undefined) {
      const [index, record] = item;
      const count = await resolveWorktreeCount(reader, record.repoPath);
      results[index] = toRecentRepoDto(record, count);
      item = queue.shift();
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
}

export function registerRecentReposHandlers(
  store: RecentReposStore,
  worktreeReader: GitCliWorktreeReader
): void {
  handle<void, ListRecentReposResponse>(
    IPC_CHANNELS.listRecentRepos,
    () => listWithCounts(store, worktreeReader)
  );

  handle<AddRecentRepoRequest, null>(IPC_CHANNELS.addRecentRepo, async (request) => {
    await store.add(request.repoPath);
    return null;
  });
}
