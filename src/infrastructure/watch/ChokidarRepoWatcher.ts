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

type StopFn = StopRecursiveWatch;

function makeDebounced(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, ms);
  };
}

// eslint-disable-next-line max-lines-per-function -- factory closure with shared mutable state, three logical lines per operation
function makeWatcherRegistry(): { register: (s: StopFn) => void; stopAll: () => Promise<void> } {
  const stopWatchers: StopFn[] = [];
  let stopped = false;

  return {
    register(stopWatcher: StopFn): void {
      if (stopped) {
        void stopWatcher();
        return;
      }
      stopWatchers.push(stopWatcher);
    },
    async stopAll(): Promise<void> {
      stopped = true;
      await Promise.all(stopWatchers.map((stopWatcher) => stopWatcher()));
      stopWatchers.length = 0;
    },
  };
}

function attachWatcher(
  watcher: Promise<StopFn>,
  register: (s: StopFn) => void
): void {
  void watcher.then(register).catch(() => {
    // Auto-refresh is best-effort. List/diff queries surface repository and
    // Git failures without taking down Electron's main process.
  });
}

export class ChokidarRepoWatcher {
  watch(target: RepoWatchTarget, onChange: () => void): RepoWatchHandle {
    const signal = makeDebounced(onChange, DEBOUNCE_MS);
    const registry = makeWatcherRegistry();
    const attach = (w: Promise<StopFn>): void => attachWatcher(w, registry.register);
    for (const worktreePath of new Set(target.worktreePaths)) {
      attach(
        startRecursiveWatch(worktreePath, signal, (path) =>
          containsIgnoredSegment(worktreePath, path)
        )
      );
    }
    attach(this.watchSharedGitDir(target.repoPath, signal));
    return { stop: registry.stopAll };
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
