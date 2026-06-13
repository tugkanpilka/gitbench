import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ErrorSlot } from './hooks/useRepositoryCatalog';
import { useRepositoryCatalog } from './hooks/useRepositoryCatalog';
import { useRepositoryWatcher } from './hooks/useRepositoryWatcher';
import { useSelectedWorktreeDetails } from './hooks/useSelectedWorktreeDetails';

/**
 * Thin facade composing the three worktree-browser resources behind one controller:
 *
 * - useRepositoryCatalog — repository path, worktrees, summaries, open/refresh.
 * - useSelectedWorktreeDetails — selection, diff, unpushed commits.
 * - useRepositoryWatcher — watch lifecycle + repo:changed auto-refresh.
 *
 * The shared `error` slot lives here so repository and selected-worktree failures keep
 * their original single-slot cross-clearing semantics (selecting a worktree clears a
 * repository error; a refresh clears a diff error). The returned shape is unchanged so
 * `App` is unaffected by the internal split.
 */
export function useWorktreeBrowser() {
  const [error, setError] = useState<string | null>(null);
  const errorSlot = useMemo<ErrorSlot>(
    () => ({
      set: (message) => setError(message),
      clear: () => setError(null),
    }),
    []
  );

  const catalog = useRepositoryCatalog(errorSlot);
  const details = useSelectedWorktreeDetails(errorSlot);

  // Latest repo/selection, read by the stable repo:changed subscription without
  // re-subscribing on every change. Mirrored in an effect (not during render) so a
  // discarded transition render can't leave the refs ahead of committed state — the
  // subscription would otherwise refresh a selection that was never committed.
  const repoPathRef = useRef<string | null>(null);
  const selectedPathRef = useRef<string | null>(null);
  useEffect(() => {
    repoPathRef.current = catalog.repoPath;
    selectedPathRef.current = details.selectedPath;
  }, [catalog.repoPath, details.selectedPath]);

  const onRepoChanged = useCallback(() => {
    if (repoPathRef.current !== null) {
      void catalog.reloadWorktrees(repoPathRef.current);
    }
    if (selectedPathRef.current !== null) {
      details.reloadDetails(selectedPathRef.current);
    }
  }, [catalog, details]);

  const watchedWorktreePaths = useMemo(
    () => catalog.worktrees.map((worktree) => worktree.path),
    [catalog.worktrees]
  );

  useRepositoryWatcher({
    repoPath: catalog.repoPath,
    worktreePaths: watchedWorktreePaths,
    onRepoChanged,
  });

  const pickRepository = useCallback(async () => {
    const opened = await catalog.openRepository();
    // A successful open replaces the repository: drop the previous selection and
    // invalidate any in-flight detail requests before they can commit stale data.
    if (opened !== null) {
      details.reset();
    }
  }, [catalog, details]);

  const selectWorktree = useCallback(
    async (worktreePath: string) => {
      // Set the ref synchronously: App wraps this call in startTransition, so the
      // committed selection may lag, but a watcher tick mid-load must reload this path.
      selectedPathRef.current = worktreePath;
      await details.selectWorktree(worktreePath);
    },
    [details]
  );

  return {
    repoPath: catalog.repoPath,
    worktrees: catalog.worktrees,
    summaries: catalog.summaries,
    selectedPath: details.selectedPath,
    diff: details.diff,
    commits: details.commits,
    error,
    loading: catalog.loading,
    diffLoading: details.diffLoading,
    pickRepository,
    refreshRepository: catalog.refreshRepository,
    selectWorktree,
  };
}
