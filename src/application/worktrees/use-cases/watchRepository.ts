import type { RepoWatchHandle, RepoWatchTarget, RepoWatcher } from '../ports/RepoWatcher';

export function makeWatchRepository(watcher: RepoWatcher) {
  return function watchRepository(
    target: RepoWatchTarget,
    onChange: () => void
  ): RepoWatchHandle {
    return watcher.watch(target, onChange);
  };
}
