import { makeGetUncommittedDiff } from '../../application/worktrees/use-cases/getUncommittedDiff';
import { makeListUnpushedCommits } from '../../application/worktrees/use-cases/listUnpushedCommits';
import { makeListWorktrees } from '../../application/worktrees/use-cases/listWorktrees';
import { makeWatchRepository } from '../../application/worktrees/use-cases/watchRepository';
import { GitCliCommitReader } from '../../infrastructure/git/readers/GitCliCommitReader';
import { GitCliDiffReader } from '../../infrastructure/git/readers/GitCliDiffReader';
import { GitCliWorktreeReader } from '../../infrastructure/git/readers/GitCliWorktreeReader';
import { ChokidarRepoWatcher } from '../../infrastructure/watch/ChokidarRepoWatcher';

export interface ApplicationServices {
  listWorktrees: ReturnType<typeof makeListWorktrees>;
  getUncommittedDiff: ReturnType<typeof makeGetUncommittedDiff>;
  listUnpushedCommits: ReturnType<typeof makeListUnpushedCommits>;
  watchRepository: ReturnType<typeof makeWatchRepository>;
}

export function createApplicationServices(): ApplicationServices {
  return {
    listWorktrees: makeListWorktrees(new GitCliWorktreeReader()),
    getUncommittedDiff: makeGetUncommittedDiff(new GitCliDiffReader()),
    listUnpushedCommits: makeListUnpushedCommits(new GitCliCommitReader()),
    watchRepository: makeWatchRepository(new ChokidarRepoWatcher()),
  };
}
