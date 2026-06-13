import { useCallback, useState } from 'react';

import type { WorktreeDto, WorktreeSummaryDto } from '../../../../../contracts/ipc';
import { desktopApi } from '../../../shared/api/desktopApi';
import { describeError } from '../describeError';
import { useLatestRequest } from './useLatestRequest';

export interface ErrorSlot {
  set(message: string): void;
  clear(): void;
}

export interface RepositoryCatalog {
  repoPath: string | null;
  worktrees: WorktreeDto[];
  summaries: WorktreeSummaryDto[];
  loading: boolean;
  // Picks a repository and, on success, commits its path + worktrees. Returns the newly
  // committed repository path, or null when nothing changed (dialog cancelled or failure).
  openRepository(): Promise<string | null>;
  // Manual full refresh of the open repository (shows the loading state).
  refreshRepository(): Promise<void>;
  // Quiet list reload for auto-refresh: no loading flag, so a watcher signal does not
  // flash the picker's spinner.
  reloadWorktrees(path: string): Promise<void>;
}

/**
 * Repository-catalog resource: the open repository path, its worktrees, the per-worktree
 * summaries, and the open/refresh/reload workflows. The shared error slot is injected so
 * repository and selected-worktree failures keep the exact cross-clearing behavior of the
 * original single-slot god-hook.
 */
export function useRepositoryCatalog(errorSlot: ErrorSlot): RepositoryCatalog {
  const [repoPath, setRepoPath] = useState<string | null>(null);
  const [worktrees, setWorktrees] = useState<WorktreeDto[]>([]);
  const [summaries, setSummaries] = useState<WorktreeSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const summariesRequest = useLatestRequest();

  // Summary data is secondary: rows remain selectable when a summary query fails.
  const loadSummaries = useCallback(
    async (nextWorktrees: WorktreeDto[], clear: boolean) => {
      const signal = summariesRequest.begin();
      if (clear) {
        setSummaries([]);
      }
      if (nextWorktrees.length === 0) {
        setSummaries([]);
        return;
      }

      try {
        const response = await desktopApi.listWorktreeSummaries(
          nextWorktrees.map((worktree) => worktree.path)
        );
        if (!signal.aborted) {
          setSummaries(response);
        }
      } catch {
        // Keep the last known summaries on a quiet refresh failure.
      }
    },
    [summariesRequest]
  );

  // Never throws: failures are reported via the error slot and signalled as null, so
  // callers' own try/catch only ever sees errors from other desktopApi calls.
  const loadWorktrees = useCallback(
    async (path: string): Promise<WorktreeDto[] | null> => {
      try {
        return await desktopApi.listWorktrees(path);
      } catch (caught) {
        setWorktrees([]);
        setSummaries([]);
        summariesRequest.invalidate();
        errorSlot.set(describeError(caught));
        return null;
      }
    },
    [errorSlot, summariesRequest]
  );

  const refreshRepository = useCallback(async () => {
    if (repoPath === null) {
      return;
    }
    setLoading(true);
    errorSlot.clear();
    try {
      const nextWorktrees = await loadWorktrees(repoPath);
      if (nextWorktrees !== null) {
        setWorktrees(nextWorktrees);
        void loadSummaries(nextWorktrees, false);
      }
    } finally {
      setLoading(false);
    }
  }, [errorSlot, loadSummaries, loadWorktrees, repoPath]);

  const reloadWorktrees = useCallback(
    async (path: string) => {
      const nextWorktrees = await loadWorktrees(path);
      if (nextWorktrees !== null) {
        setWorktrees(nextWorktrees);
        void loadSummaries(nextWorktrees, false);
      }
    },
    [loadSummaries, loadWorktrees]
  );

  const openRepository = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    errorSlot.clear();
    try {
      const picked = await desktopApi.pickRepo();
      if (picked === null) {
        return null;
      }

      const nextWorktrees = await loadWorktrees(picked);
      if (nextWorktrees === null) {
        return null;
      }

      setRepoPath(picked);
      setWorktrees(nextWorktrees);
      void loadSummaries(nextWorktrees, true);
      return picked;
    } catch (caught) {
      errorSlot.set(describeError(caught));
      return null;
    } finally {
      setLoading(false);
    }
  }, [errorSlot, loadSummaries, loadWorktrees]);

  return {
    repoPath,
    worktrees,
    summaries,
    loading,
    openRepository,
    refreshRepository,
    reloadWorktrees,
  };
}
