import { useCallback, useEffect, useRef, useState } from 'react';

import type { WorktreeDto } from '../../../../contracts/ipc';
import { ApiError } from '../../shared/api/ApiError';
import { desktopApi } from '../../shared/api/desktopApi';
import type { DiffState } from './index.types';

function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Unexpected error.';
}

export function useWorktreeBrowser() {
  const [repoPath, setRepoPath] = useState<string | null>(null);
  const [worktrees, setWorktrees] = useState<WorktreeDto[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [diff, setDiff] = useState<DiffState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  // Latest-wins token for diff loads. ipcRenderer.invoke can't be cancelled, so
  // this AbortController is used purely for freshness: a superseded request's
  // signal is aborted, and we check signal.aborted before committing results.
  const diffRequest = useRef<AbortController | null>(null);

  // Latest repo/selection, read by the stable repo:changed subscription without
  // re-subscribing on every change. Mirrored synchronously each render.
  const repoPathRef = useRef<string | null>(null);
  const selectedPathRef = useRef<string | null>(null);
  repoPathRef.current = repoPath;
  selectedPathRef.current = selectedPath;

  // Never throws: failures are reported via setError and signalled as null, so
  // callers' own try/catch only ever sees errors from other desktopApi calls.
  const loadWorktrees = useCallback(async (path: string): Promise<WorktreeDto[] | null> => {
    try {
      return await desktopApi.listWorktrees(path);
    } catch (caught) {
      setWorktrees([]);
      setError(describeError(caught));
      return null;
    }
  }, []);

  const refreshWorktrees = useCallback(
    async (path: string) => {
      setLoading(true);
      setError(null);
      try {
        const nextWorktrees = await loadWorktrees(path);
        if (nextWorktrees !== null) {
          setWorktrees(nextWorktrees);
        }
      } finally {
        setLoading(false);
      }
    },
    [loadWorktrees]
  );

  // Quiet list reload for auto-refresh: updates the sidebar without flipping the
  // `loading` flag, so a watcher signal doesn't flash the picker's spinner.
  const reloadWorktrees = useCallback(
    async (path: string) => {
      const nextWorktrees = await loadWorktrees(path);
      if (nextWorktrees !== null) {
        setWorktrees(nextWorktrees);
      }
    },
    [loadWorktrees]
  );

  // Marks any in-flight diff load as stale and returns the signal that guards
  // the new load. Aborting the previous controller is the latest-wins token.
  const beginDiffRequest = useCallback((): AbortSignal => {
    diffRequest.current?.abort();
    const controller = new AbortController();
    diffRequest.current = controller;
    return controller.signal;
  }, []);

  // Loads the diff for a worktree. `showLoading` is true for a user selection (clear
  // the view, show the spinner) and false for an auto-refresh (keep the current view;
  // only swap it in when the text actually changed, preserving the scroll position).
  const loadDiff = useCallback(
    async (worktreePath: string, showLoading: boolean) => {
      const signal = beginDiffRequest();
      if (showLoading) {
        setDiff(null);
        setDiffLoading(true);
      }
      setError(null);
      try {
        const response = await desktopApi.getDiff(worktreePath);
        if (signal.aborted) {
          return;
        }
        setDiff((prev) =>
          prev && prev.worktreePath === worktreePath && prev.diffText === response.diffText
            ? prev
            : { worktreePath, diffText: response.diffText }
        );
      } catch (caught) {
        if (!signal.aborted) {
          if (showLoading) {
            setDiff(null);
          }
          setError(describeError(caught));
        }
      } finally {
        if (!signal.aborted) {
          setDiffLoading(false);
        }
      }
    },
    [beginDiffRequest]
  );

  const pickRepository = async () => {
    setLoading(true);
    setError(null);
    try {
      const picked = await desktopApi.pickRepo();
      if (picked === null) {
        return;
      }

      const nextWorktrees = await loadWorktrees(picked);
      if (nextWorktrees === null) {
        return;
      }

      setRepoPath(picked);
      setWorktrees(nextWorktrees);
      setSelectedPath(null);
      setDiff(null);
      beginDiffRequest();
      setDiffLoading(false);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setLoading(false);
    }
  };

  // Manual full refresh (shows the loading state). Auto-refresh uses the quieter
  // reloadWorktrees path above.
  const refreshRepository = async () => {
    if (repoPath !== null) {
      await refreshWorktrees(repoPath);
    }
  };

  const selectWorktree = useCallback(
    async (worktreePath: string) => {
      selectedPathRef.current = worktreePath;
      setSelectedPath(worktreePath);
      await loadDiff(worktreePath, true);
    },
    [loadDiff]
  );

  // Keep the watcher pointed at the current repo and selected worktree. startWatch
  // replaces any prior watch on the main side, so no explicit stop between changes.
  useEffect(() => {
    if (repoPath === null) {
      return;
    }
    void desktopApi.startWatch(repoPath, selectedPath).catch(() => {
      // A watch failure is non-fatal — manual refresh still works.
    });
  }, [repoPath, selectedPath]);

  // Stop watching when the browser unmounts.
  useEffect(
    () => () => {
      void desktopApi.stopWatch().catch(() => {});
    },
    []
  );

  // Auto-refresh on the debounced "repo changed" signal: reload the list and the
  // open diff for whatever is currently selected. Reads refs so the subscription
  // stays mounted across selection changes.
  useEffect(() => {
    const onChanged = (): void => {
      if (repoPathRef.current !== null) {
        void reloadWorktrees(repoPathRef.current);
      }
      if (selectedPathRef.current !== null) {
        void loadDiff(selectedPathRef.current, false);
      }
    };
    return desktopApi.onRepoChanged(onChanged);
  }, [reloadWorktrees, loadDiff]);

  return {
    repoPath,
    worktrees,
    selectedPath,
    diff,
    error,
    loading,
    diffLoading,
    pickRepository,
    refreshRepository,
    selectWorktree,
  };
}
