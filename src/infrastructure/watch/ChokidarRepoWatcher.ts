import { join, sep } from 'node:path';

import { watch, type FSWatcher } from 'chokidar';

import type {
  RepoWatchHandle,
  RepoWatchTarget,
  RepoWatcher,
} from '../../application/worktrees/ports/RepoWatcher';
import { runGit } from '../git/runGit';

// One signal per burst. Editors and git both touch many files per logical change;
// coalesce them so the renderer re-queries once, not dozens of times.
const DEBOUNCE_MS = 250;

// node_modules is large and noisy; .git's object store churns on every git operation
// and would storm. The shared git dir is watched separately (far more cheaply) below.
const WORKING_TREE_IGNORED = /(^|[\\/])(node_modules|\.git)([\\/]|$)/;

export class ChokidarRepoWatcher implements RepoWatcher {
  watch(target: RepoWatchTarget, onChange: () => void): RepoWatchHandle {
    const watchers: FSWatcher[] = [];
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const signal = (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        onChange();
      }, DEBOUNCE_MS);
    };

    // The git dir watcher attaches asynchronously; guard against a stop() that races
    // ahead of it so we never leak a watcher after the handle is disposed.
    const register = (watcher: FSWatcher): void => {
      if (stopped) {
        void watcher.close();
        return;
      }
      watcher.on('all', signal);
      watchers.push(watcher);
    };

    // 1) The selected worktree's working tree: edits, adds, deletes.
    if (target.selectedWorktreePath !== null) {
      register(
        watch(target.selectedWorktreePath, {
          ignoreInitial: true,
          ignored: WORKING_TREE_IGNORED,
          // Wait for a file to stop changing before signalling, so a half-written
          // editor save does not fire mid-write.
          awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
        })
      );
    }

    // 2) The shared git dir: refs, logs, index, worktrees/ admin — covers commits,
    //    resets, checkouts, and add/remove/lock for every worktree. Needs git to
    //    resolve, so it attaches async.
    void this.watchSharedGitDir(target.repoPath, register).catch(() => {
      // repoPath is gone or git is unavailable — the list/diff queries surface the
      // real error to the user. Nothing watchable here; leave it.
    });

    return {
      async stop() {
        stopped = true;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        await Promise.all(watchers.map((w) => w.close()));
        watchers.length = 0;
      },
    };
  }

  private async watchSharedGitDir(
    repoPath: string,
    register: (watcher: FSWatcher) => void
  ): Promise<void> {
    const commonDir = (
      await runGit(repoPath, ['rev-parse', '--path-format=absolute', '--git-common-dir'])
    ).trim();
    const stores = [join(commonDir, 'objects'), join(commonDir, 'lfs')];
    const insideObjectStore = (path: string): boolean =>
      stores.some((store) => path === store || path.startsWith(store + sep));

    register(
      watch(commonDir, {
        ignoreInitial: true,
        ignored: insideObjectStore,
      })
    );
  }
}
