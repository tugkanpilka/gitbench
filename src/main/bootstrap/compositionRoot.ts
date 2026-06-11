import { makeGetUncommittedDiff } from '../../application/worktrees/use-cases/getUncommittedDiff';
import { makeListWorktrees } from '../../application/worktrees/use-cases/listWorktrees';
import { makeWatchRepository } from '../../application/worktrees/use-cases/watchRepository';
import { GitCliDiffReader } from '../../infrastructure/git/readers/GitCliDiffReader';
import { GitCliWorktreeReader } from '../../infrastructure/git/readers/GitCliWorktreeReader';
import { ChokidarRepoWatcher } from '../../infrastructure/watch/ChokidarRepoWatcher';

export interface ApplicationServices {
  listWorktrees: ReturnType<typeof makeListWorktrees>;
  getUncommittedDiff: ReturnType<typeof makeGetUncommittedDiff>;
  watchRepository: ReturnType<typeof makeWatchRepository>;
}

export function createApplicationServices(): ApplicationServices {
  return {
    listWorktrees: makeListWorktrees(new GitCliWorktreeReader()),
    getUncommittedDiff: makeGetUncommittedDiff(new GitCliDiffReader()),
    watchRepository: makeWatchRepository(new ChokidarRepoWatcher()),
  };
}
