import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';

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
type CatalogResource = ReturnType<typeof useRepositoryCatalog>;
type DetailsResource = ReturnType<typeof useSelectedWorktreeDetails>;

function useErrorSlot(): [string | null, ErrorSlot] {
  const [error, setError] = useState<string | null>(null);
  const slot = useMemo<ErrorSlot>(
    () => ({ set: (message) => setError(message), clear: () => setError(null) }),
    []
  );
  return [error, slot];
}

function usePickRepository(catalog: CatalogResource, details: DetailsResource): () => Promise<void> {
  return useCallback(async () => {
    const opened = await catalog.openRepository();
    if (opened !== null) { details.reset(); }
  }, [catalog, details]);
}

interface WatcherState {
  selectedPathRef: MutableRefObject<string | null>;
  onRepoChanged: () => void;
}

function useWatcherState(catalog: CatalogResource, details: DetailsResource): WatcherState {
  const repoPathRef = useRef<string | null>(null);
  const selectedPathRef = useRef<string | null>(null);
  useEffect(() => {
    repoPathRef.current = catalog.repoPath;
    selectedPathRef.current = details.selectedPath;
  }, [catalog.repoPath, details.selectedPath]);
  const onRepoChanged = useCallback(() => {
    if (repoPathRef.current !== null) { void catalog.reloadWorktrees(repoPathRef.current); }
    if (selectedPathRef.current !== null) { details.reloadDetails(selectedPathRef.current); }
  }, [catalog, details]);
  return { selectedPathRef, onRepoChanged };
}

export function useWorktreeBrowser() {
  const [error, errorSlot] = useErrorSlot();
  const catalog = useRepositoryCatalog(errorSlot);
  const details = useSelectedWorktreeDetails(errorSlot);
  const { selectedPathRef, onRepoChanged } = useWatcherState(catalog, details);
  const worktreePaths = useMemo(() => catalog.worktrees.map((w) => w.path), [catalog.worktrees]);
  useRepositoryWatcher({ repoPath: catalog.repoPath, worktreePaths, onRepoChanged });
  const pickRepository = usePickRepository(catalog, details);
  const selectWorktree = useCallback(async (path: string) => { selectedPathRef.current = path; await details.selectWorktree(path); }, [details, selectedPathRef]);
  const { repoPath, worktrees, summaries, loading, refreshRepository } = catalog;
  const { selectedPath, diff, commits, diffLoading } = details;
  return { repoPath, worktrees, summaries, selectedPath, diff, commits, error, loading, diffLoading, pickRepository, refreshRepository, selectWorktree };
}
