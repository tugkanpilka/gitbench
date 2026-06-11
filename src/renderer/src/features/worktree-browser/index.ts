import { useCallback, useRef, useState } from 'react';

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
  const latestDiffRequest = useRef(0);

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
      latestDiffRequest.current += 1;
      setDiffLoading(false);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setLoading(false);
    }
  };

  // Currently unused by the UI — the refresh model is an open decision in
  // CLAUDE.md ("MVP is manual refresh"). Kept until that decision lands.
  const refreshRepository = async () => {
    if (repoPath !== null) {
      await refreshWorktrees(repoPath);
    }
  };

  const selectWorktree = async (worktreePath: string) => {
    const requestId = latestDiffRequest.current + 1;
    latestDiffRequest.current = requestId;
    setSelectedPath(worktreePath);
    setDiff(null);
    setDiffLoading(true);
    setError(null);
    try {
      const response = await desktopApi.getDiff(worktreePath);
      if (latestDiffRequest.current === requestId) {
        setDiff({ worktreePath, diffText: response.diffText });
      }
    } catch (caught) {
      if (latestDiffRequest.current === requestId) {
        setDiff(null);
        setError(describeError(caught));
      }
    } finally {
      if (latestDiffRequest.current === requestId) {
        setDiffLoading(false);
      }
    }
  };

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
