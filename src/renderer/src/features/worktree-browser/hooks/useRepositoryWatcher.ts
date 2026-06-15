import { useEffect, useRef } from 'react';

import { desktopApi } from '../../../shared/api/desktopApi';

function parseWatchedPaths(joined: string): string[] {
  return joined.length === 0 ? [] : joined.split('\0');
}

export interface RepositoryWatcherOptions {
  repoPath: string | null;
  // The set of worktree roots to watch, joined into a stable key by the caller.
  worktreePaths: string[];
  // Called on each debounced repo:changed signal. Kept in a ref so the subscription
  // stays mounted across selection changes without re-subscribing.
  onRepoChanged: () => void;
}

/**
 * Filesystem-watch lifecycle for the open repository: starts/replaces the all-worktree
 * watch when the root set changes, stops it on unmount, and forwards the debounced
 * repo:changed signal to the caller.
 */
function startWatchSilently(repoPath: string, paths: string[]): void {
  void desktopApi.startWatch(repoPath, paths).catch(() => {});
}

function useWatchLifecycle(repoPath: string | null, watchedWorktreePaths: string): void {
  useEffect(() => {
    if (repoPath === null) {
      return;
    }
    startWatchSilently(repoPath, parseWatchedPaths(watchedWorktreePaths));
  }, [repoPath, watchedWorktreePaths]);

  useEffect(
    () => () => {
      void desktopApi.stopWatch().catch(() => {});
    },
    []
  );
}

function useStableRepoChangedRef(onRepoChanged: () => void): void {
  const onRepoChangedRef = useRef(onRepoChanged);
  useEffect(() => {
    onRepoChangedRef.current = onRepoChanged;
  }, [onRepoChanged]);
  useEffect(() => desktopApi.onRepoChanged(() => onRepoChangedRef.current()), []);
}

export function useRepositoryWatcher({
  repoPath,
  worktreePaths,
  onRepoChanged,
}: RepositoryWatcherOptions): void {
  // Filesystem paths cannot contain NUL, so this is a stable dependency key for
  // restarting the watcher only when the set/order of worktree roots changes.
  const watchedWorktreePaths = worktreePaths.join('\0');
  useWatchLifecycle(repoPath, watchedWorktreePaths);
  useStableRepoChangedRef(onRepoChanged);
}
