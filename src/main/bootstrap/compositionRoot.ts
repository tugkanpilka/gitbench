import { app } from 'electron';

import { GitCliCommitReader } from '../../infrastructure/git/readers/GitCliCommitReader';
import { GitCliDiffReader } from '../../infrastructure/git/readers/GitCliDiffReader';
import { GitCliWorktreeReader } from '../../infrastructure/git/readers/GitCliWorktreeReader';
import { GitCliWorktreeSummaryReader } from '../../infrastructure/git/readers/GitCliWorktreeSummaryReader';
import { JsonFileRecentReposStore } from '../../infrastructure/recentRepos/JsonFileRecentReposStore';
import { ChokidarRepoWatcher } from '../../infrastructure/watch/ChokidarRepoWatcher';

/**
 * The concrete infrastructure readers/watcher, constructed once and injected into the
 * IPC handlers. There is no intermediate application port or forwarding factory: this
 * viewer commits to the git CLI with no pluggable backend, so handlers call these
 * readers directly while main still maps their results to DTOs at the boundary.
 */
export interface ApplicationServices {
  worktreeReader: GitCliWorktreeReader;
  worktreeSummaryReader: GitCliWorktreeSummaryReader;
  diffReader: GitCliDiffReader;
  commitReader: GitCliCommitReader;
  watcher: ChokidarRepoWatcher;
  recentReposStore: JsonFileRecentReposStore;
}

export function createApplicationServices(): ApplicationServices {
  return {
    worktreeReader: new GitCliWorktreeReader(),
    worktreeSummaryReader: new GitCliWorktreeSummaryReader(),
    diffReader: new GitCliDiffReader(),
    commitReader: new GitCliCommitReader(),
    watcher: new ChokidarRepoWatcher(),
    recentReposStore: new JsonFileRecentReposStore(app.getPath('userData')),
  };
}
