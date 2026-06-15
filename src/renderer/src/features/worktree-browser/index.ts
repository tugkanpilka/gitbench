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

function usePickRepository(
  catalog: CatalogResource,
  details: DetailsResource
): () => Promise<void> {
  return useCallback(async () => {
    const opened = await catalog.openRepository();
    if (opened !== null) {
      details.reset();
    }
  }, [catalog, details]);
}

interface WatcherState {
  selectedPathRef: MutableRefObject<string | null>;
  onRepoChanged: () => void;
}

interface RepoChangedDeps {
  catalog: CatalogResource;
  details: DetailsResource;
  repoPathRef: MutableRefObject<string | null>;
  selectedPathRef: MutableRefObject<string | null>;
}

function useOnRepoChanged({ catalog, details, repoPathRef, selectedPathRef }: RepoChangedDeps): () => void {
  return useCallback(() => {
    if (repoPathRef.current !== null) {
      void catalog.reloadWorktrees(repoPathRef.current);
    }
    if (selectedPathRef.current !== null) {
      details.reloadDetails(selectedPathRef.current);
    }
  }, [catalog, details, repoPathRef, selectedPathRef]);
}

function useWatcherState(catalog: CatalogResource, details: DetailsResource): WatcherState {
  const repoPathRef = useRef<string | null>(null);
  const selectedPathRef = useRef<string | null>(null);
  useEffect(() => {
    repoPathRef.current = catalog.repoPath;
    selectedPathRef.current = details.selectedPath;
  }, [catalog.repoPath, details.selectedPath]);
  const onRepoChanged = useOnRepoChanged({ catalog, details, repoPathRef, selectedPathRef });
  return { selectedPathRef, onRepoChanged };
}

function useSelectWorktree(
  details: DetailsResource,
  selectedPathRef: MutableRefObject<string | null>
): (path: string) => Promise<void> {
  return useCallback(
    async (path: string) => {
      selectedPathRef.current = path;
      await details.selectWorktree(path);
    },
    [details, selectedPathRef]
  );
}

function useBrowserActions(catalog: CatalogResource, details: DetailsResource) {
  const { selectedPathRef, onRepoChanged } = useWatcherState(catalog, details);
  const worktreePaths = useMemo(() => catalog.worktrees.map((w) => w.path), [catalog.worktrees]);
  useRepositoryWatcher({ repoPath: catalog.repoPath, worktreePaths, onRepoChanged });
  const pickRepository = usePickRepository(catalog, details);
  const selectWorktree = useSelectWorktree(details, selectedPathRef);
  return { pickRepository, selectWorktree };
}

export function useWorktreeBrowser() {
  const [error, errorSlot] = useErrorSlot();
  const catalog = useRepositoryCatalog(errorSlot);
  const details = useSelectedWorktreeDetails(errorSlot);
  const { pickRepository, selectWorktree } = useBrowserActions(catalog, details);
  return {
    repoPath: catalog.repoPath, worktrees: catalog.worktrees, summaries: catalog.summaries,
    loading: catalog.loading, refreshRepository: catalog.refreshRepository,
    selectedPath: details.selectedPath, diff: details.diff,
    commits: details.commits, diffLoading: details.diffLoading,
    error, pickRepository, selectWorktree,
  };
}
