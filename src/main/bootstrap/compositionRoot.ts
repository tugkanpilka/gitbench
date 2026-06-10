import { makeGetUncommittedDiff } from '../../application/worktrees/use-cases/getUncommittedDiff';
import { makeListWorktrees } from '../../application/worktrees/use-cases/listWorktrees';
import { GitCliDiffReader } from '../../infrastructure/git/readers/GitCliDiffReader';
import { GitCliWorktreeReader } from '../../infrastructure/git/readers/GitCliWorktreeReader';

export interface ApplicationServices {
  listWorktrees: ReturnType<typeof makeListWorktrees>;
  getUncommittedDiff: ReturnType<typeof makeGetUncommittedDiff>;
}

export function createApplicationServices(): ApplicationServices {
  return {
    listWorktrees: makeListWorktrees(new GitCliWorktreeReader()),
    getUncommittedDiff: makeGetUncommittedDiff(new GitCliDiffReader()),
  };
}
