import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';

import type { WorktreeDto, WorktreeSummaryDto } from '../../../../contracts/ipc';
import { ApiError } from '../../shared/api/ApiError';
import { desktopApi } from '../../shared/api/desktopApi';
import type { CommitsState, DiffState } from './index.types';

function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Unexpected error.';
}

// Marks any in-flight request on `ref` as stale and returns the signal that guards
// the new one. ipcRenderer.invoke can't be cancelled, so the AbortController is used
// purely for freshness: callers check signal.aborted before committing results.
function beginRequest(ref: MutableRefObject<AbortController | null>): AbortSignal {
  ref.current?.abort();
  const controller = new AbortController();
  ref.current = controller;
  return controller.signal;
}

export function useWorktreeBrowser() {
  const [repoPath, setRepoPath] = useState<string | null>(null);
  const [worktrees, setWorktrees] = useState<WorktreeDto[]>([]);
  const [summaries, setSummaries] = useState<WorktreeSummaryDto[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [diff, setDiff] = useState<DiffState | null>(null);
  const [commits, setCommits] = useState<CommitsState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  // Independent latest-wins tokens (see beginRequest) for the diff and the
  // secondary unpushed-commits load.
  const diffRequest = useRef<AbortController | null>(null);
  const commitsRequest = useRef<AbortController | null>(null);
  const summariesRequest = useRef<AbortController | null>(null);

  // Latest repo/selection, read by the stable repo:changed subscription without
  // re-subscribing on every change. Mirrored synchronously each render.
  const repoPathRef = useRef<string | null>(null);
  const selectedPathRef = useRef<string | null>(null);
  repoPathRef.current = repoPath;
  selectedPathRef.current = selectedPath;

  // Summary data is secondary: rows remain selectable when a summary query fails.
  const loadSummaries = useCallback(async (nextWorktrees: WorktreeDto[], clear: boolean) => {
    const signal = beginRequest(summariesRequest);
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
  }, []);

  // Never throws: failures are reported via setError and signalled as null, so
  // callers' own try/catch only ever sees errors from other desktopApi calls.
  const loadWorktrees = useCallback(async (path: string): Promise<WorktreeDto[] | null> => {
    try {
      return await desktopApi.listWorktrees(path);
    } catch (caught) {
      setWorktrees([]);
      setSummaries([]);
      beginRequest(summariesRequest);
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
          void loadSummaries(nextWorktrees, false);
        }
      } finally {
        setLoading(false);
      }
    },
    [loadSummaries, loadWorktrees]
  );

  // Quiet list reload for auto-refresh: updates the sidebar without flipping the
  // `loading` flag, so a watcher signal doesn't flash the picker's spinner.
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

  // Loads the diff for a worktree. `showLoading` is true for a user selection (clear
  // the view, show the spinner) and false for an auto-refresh (keep the current view;
  // only swap it in when the text actually changed, preserving the scroll position).
  const loadDiff = useCallback(async (worktreePath: string, showLoading: boolean) => {
    const signal = beginRequest(diffRequest);
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
  }, []);

  // Loads the unpushed commits for a worktree. Secondary to the diff: failures are
  // swallowed (the section just hides) so they never block the diff view or steal the
  // shared error slot. `clear` drops stale commits immediately on a user selection;
  // an auto-refresh (`clear` false) keeps the current list on failure, like loadDiff.
  const loadCommits = useCallback(async (worktreePath: string, clear: boolean) => {
    const signal = beginRequest(commitsRequest);
    if (clear) {
      setCommits(null);
    }
    try {
      const response = await desktopApi.listUnpushedCommits(worktreePath);
      if (signal.aborted) {
        return;
      }
      // Keep the previous reference when nothing changed (a sha pins its content),
      // so watcher ticks don't re-render the whole sidebar subtree.
      setCommits((prev) =>
        prev &&
        prev.truncated === response.truncated &&
        prev.commits.length === response.commits.length &&
        prev.commits.every((commit, index) => commit.sha === response.commits[index].sha)
          ? prev
          : { commits: response.commits, truncated: response.truncated }
      );
    } catch {
      if (!signal.aborted && clear) {
        setCommits(null);
      }
    }
  }, []);

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
      void loadSummaries(nextWorktrees, true);
      setSelectedPath(null);
      setDiff(null);
      setCommits(null);
      beginRequest(diffRequest);
      beginRequest(commitsRequest);
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
      await Promise.all([loadDiff(worktreePath, true), loadCommits(worktreePath, true)]);
    },
    [loadDiff, loadCommits]
  );

  // Watch every worktree so non-selected row summaries stay current as agents edit.
  // startWatch replaces any prior watch on the main side.
  useEffect(() => {
    if (repoPath === null) {
      return;
    }
    void desktopApi
      .startWatch(
        repoPath,
        worktrees.map((worktree) => worktree.path)
      )
      .catch(() => {
        // A watch failure is non-fatal — manual refresh still works.
      });
  }, [repoPath, worktrees]);

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
        void loadCommits(selectedPathRef.current, false);
      }
    };
    return desktopApi.onRepoChanged(onChanged);
  }, [reloadWorktrees, loadDiff, loadCommits]);

  return {
    repoPath,
    worktrees,
    summaries,
    selectedPath,
    diff,
    commits,
    error,
    loading,
    diffLoading,
    pickRepository,
    refreshRepository,
    selectWorktree,
  };
}
