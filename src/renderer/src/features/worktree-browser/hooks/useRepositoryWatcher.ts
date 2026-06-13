import { useEffect, useRef } from 'react';

import { desktopApi } from '../../../shared/api/desktopApi';

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
export function useRepositoryWatcher({
  repoPath,
  worktreePaths,
  onRepoChanged,
}: RepositoryWatcherOptions): void {
  // Filesystem paths cannot contain NUL, so this is a stable dependency key for
  // restarting the watcher only when the set/order of worktree roots changes.
  const watchedWorktreePaths = worktreePaths.join('\0');

  // Watch every worktree so non-selected row summaries stay current as agents edit.
  // startWatch replaces any prior watch on the main side.
  useEffect(() => {
    if (repoPath === null) {
      return;
    }
    void desktopApi
      .startWatch(
        repoPath,
        watchedWorktreePaths.length === 0 ? [] : watchedWorktreePaths.split('\0')
      )
      .catch(() => {
        // A watch failure is non-fatal — manual refresh still works.
      });
  }, [repoPath, watchedWorktreePaths]);

  // Stop watching when the browser unmounts.
  useEffect(
    () => () => {
      void desktopApi.stopWatch().catch(() => {});
    },
    []
  );

  // Auto-refresh on the debounced "repo changed" signal. Reads the latest handler via a
  // ref so the subscription stays mounted across selection changes.
  const onRepoChangedRef = useRef(onRepoChanged);
  useEffect(() => {
    onRepoChangedRef.current = onRepoChanged;
  }, [onRepoChanged]);

  useEffect(() => desktopApi.onRepoChanged(() => onRepoChangedRef.current()), []);
}
