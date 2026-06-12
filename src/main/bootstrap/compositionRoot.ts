import { makeGetUncommittedDiff } from '../../application/worktrees/use-cases/getUncommittedDiff';
import { makeListUnpushedCommits } from '../../application/worktrees/use-cases/listUnpushedCommits';
import { makeListWorktreeSummaries } from '../../application/worktrees/use-cases/listWorktreeSummaries';
import { makeListWorktrees } from '../../application/worktrees/use-cases/listWorktrees';
import { makeWatchRepository } from '../../application/worktrees/use-cases/watchRepository';
import { GitCliCommitReader } from '../../infrastructure/git/readers/GitCliCommitReader';
import { GitCliDiffReader } from '../../infrastructure/git/readers/GitCliDiffReader';
import { GitCliWorktreeReader } from '../../infrastructure/git/readers/GitCliWorktreeReader';
import { GitCliWorktreeSummaryReader } from '../../infrastructure/git/readers/GitCliWorktreeSummaryReader';
import { ChokidarRepoWatcher } from '../../infrastructure/watch/ChokidarRepoWatcher';

export interface ApplicationServices {
  listWorktrees: ReturnType<typeof makeListWorktrees>;
  listWorktreeSummaries: ReturnType<typeof makeListWorktreeSummaries>;
  getUncommittedDiff: ReturnType<typeof makeGetUncommittedDiff>;
  listUnpushedCommits: ReturnType<typeof makeListUnpushedCommits>;
  watchRepository: ReturnType<typeof makeWatchRepository>;
}

export function createApplicationServices(): ApplicationServices {
  return {
    listWorktrees: makeListWorktrees(new GitCliWorktreeReader()),
    listWorktreeSummaries: makeListWorktreeSummaries(new GitCliWorktreeSummaryReader()),
    getUncommittedDiff: makeGetUncommittedDiff(new GitCliDiffReader()),
    listUnpushedCommits: makeListUnpushedCommits(new GitCliCommitReader()),
    watchRepository: makeWatchRepository(new ChokidarRepoWatcher()),
  };
}
