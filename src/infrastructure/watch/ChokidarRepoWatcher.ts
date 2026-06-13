import { isAbsolute, join, relative, sep } from 'node:path';

import { runGit } from '../git/runGit';
import { startRecursiveWatch, type StopRecursiveWatch } from './recursiveWatch';

export interface RepoWatchTarget {
  repoPath: string;
  /** All current worktree roots; changes update row summaries and the selected diff. */
  worktreePaths: string[];
}

export interface RepoWatchHandle {
  /** Stop watching and release all filesystem resources. Safe to call more than once. */
  stop(): Promise<void>;
}

// One signal per burst. Editors and git both touch many files per logical change;
// coalesce them so the renderer re-queries once, not dozens of times.
const DEBOUNCE_MS = 250;

const WORKING_TREE_IGNORED_SEGMENTS = new Set(['node_modules', '.git']);

export class ChokidarRepoWatcher {
  watch(target: RepoWatchTarget, onChange: () => void): RepoWatchHandle {
    const stopWatchers: StopRecursiveWatch[] = [];
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const signal = (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        onChange();
      }, DEBOUNCE_MS);
    };

    // Watchers attach asynchronously; guard against a stop() that races ahead
    // of setup so no native stream survives after the handle is disposed.
    const register = (stopWatcher: StopRecursiveWatch): void => {
      if (stopped) {
        void stopWatcher();
        return;
      }
      stopWatchers.push(stopWatcher);
    };

    const attach = (watcher: Promise<StopRecursiveWatch>): void => {
      void watcher.then(register).catch(() => {
        // Auto-refresh is best-effort. List/diff queries surface repository and
        // Git failures without taking down Electron's main process.
      });
    };

    // 1) Every worktree's working tree: edits, adds, deletes update row summaries.
    for (const worktreePath of new Set(target.worktreePaths)) {
      attach(
        startRecursiveWatch(worktreePath, signal, (path) =>
          containsIgnoredSegment(worktreePath, path)
        )
      );
    }

    // 2) The shared git dir: refs, logs, index, worktrees/ admin — covers commits,
    //    resets, checkouts, and add/remove/lock for every worktree. Needs git to
    //    resolve, so it attaches async.
    attach(this.watchSharedGitDir(target.repoPath, signal));

    return {
      async stop() {
        stopped = true;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        await Promise.all(stopWatchers.map((stopWatcher) => stopWatcher()));
        stopWatchers.length = 0;
      },
    };
  }

  private async watchSharedGitDir(
    repoPath: string,
    onChange: () => void
  ): Promise<StopRecursiveWatch> {
    const commonDir = (
      await runGit(repoPath, ['rev-parse', '--path-format=absolute', '--git-common-dir'])
    ).trim();
    const stores = [join(commonDir, 'objects'), join(commonDir, 'lfs')];
    const insideObjectStore = (path: string): boolean =>
      stores.some((store) => path === store || path.startsWith(store + sep));

    return startRecursiveWatch(commonDir, onChange, insideObjectStore);
  }
}

/**
 * True when ANY segment of the changed path matches the ignored set
 * (`node_modules`, `.git`) — so a nested `node_modules/` or `.git/` anywhere in the
 * tree is filtered, not just one directly under the worktree root. `changedPath` may
 * be absolute (it is relativized against `rootPath` first) or already relative to the
 * root; either way it is split on path separators and matched segment-by-segment.
 */
function containsIgnoredSegment(rootPath: string, changedPath: string): boolean {
  const pathWithinRoot = isAbsolute(changedPath) ? relative(rootPath, changedPath) : changedPath;
  return pathWithinRoot
    .split(/[\\/]+/)
    .some((segment) => WORKING_TREE_IGNORED_SEGMENTS.has(segment));
}
