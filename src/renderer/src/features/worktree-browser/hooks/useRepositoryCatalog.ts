import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

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

// Fetches summary rows for the given worktrees; swallowed on failure (secondary data).
async function fetchSummaryPage(paths: string[]): Promise<WorktreeSummaryDto[]> {
  return desktopApi.listWorktreeSummaries(paths);
}

type SumSet = (s: WorktreeSummaryDto[]) => void;

async function runLoadSummaries(
  worktrees: WorktreeDto[],
  signal: AbortSignal,
  setSummaries: SumSet
): Promise<void> {
  if (worktrees.length === 0) { setSummaries([]); return; }
  try {
    const rows = await fetchSummaryPage(worktrees.map((w) => w.path));
    if (!signal.aborted) { setSummaries(rows); }
  } catch {
    // Keep the last known summaries on a quiet refresh failure.
  }
}

interface SummaryResources {
  summaries: WorktreeSummaryDto[];
  loadSummaries(nextWorktrees: WorktreeDto[], clear: boolean): Promise<void>;
  invalidateSummaries(): void;
}

function useSummaries(): SummaryResources {
  const [summaries, setSummaries] = useState<WorktreeSummaryDto[]>([]);
  const req = useLatestRequest();
  const loadSummaries = useCallback(
    async (nextWorktrees: WorktreeDto[], clear: boolean) => {
      const signal = req.begin();
      if (clear) { setSummaries([]); }
      await runLoadSummaries(nextWorktrees, signal, setSummaries);
    },
    [req]
  );
  return { summaries, loadSummaries, invalidateSummaries: req.invalidate };
}

interface WorktreeResources {
  worktrees: WorktreeDto[];
  setWorktrees: Dispatch<SetStateAction<WorktreeDto[]>>;
  loadWorktrees(path: string): Promise<WorktreeDto[] | null>;
}

interface LoadWorktreeDeps {
  errorSlot: ErrorSlot;
  invalidateSummaries(): void;
  setWorktrees: Dispatch<SetStateAction<WorktreeDto[]>>;
}

async function fetchWorktrees(path: string, deps: LoadWorktreeDeps): Promise<WorktreeDto[] | null> {
  try {
    return await desktopApi.listWorktrees(path);
  } catch (caught) {
    deps.setWorktrees([]); deps.invalidateSummaries(); deps.errorSlot.set(describeError(caught));
    return null;
  }
}

function useWorktrees(errorSlot: ErrorSlot, invalidateSummaries: () => void): WorktreeResources {
  const [worktrees, setWorktrees] = useState<WorktreeDto[]>([]);
  const loadWorktrees = useCallback(
    async (path: string) => fetchWorktrees(path, { errorSlot, invalidateSummaries, setWorktrees }),
    [errorSlot, invalidateSummaries]
  );
  return { worktrees, setWorktrees, loadWorktrees };
}

type LoadFn = (path: string) => Promise<WorktreeDto[] | null>;
type SummariesFn = (w: WorktreeDto[], clear: boolean) => Promise<void>;
type WtSetter = Dispatch<SetStateAction<WorktreeDto[]>>;

function useApplyReload(loadWorktrees: LoadFn, setWorktrees: WtSetter, loadSummaries: SummariesFn): (path: string) => Promise<void> {
  return useCallback(
    async (path: string) => {
      const next = await loadWorktrees(path);
      if (next !== null) {
        setWorktrees(next);
        void loadSummaries(next, false);
      }
    },
    [loadSummaries, loadWorktrees, setWorktrees]
  );
}

interface RefreshDeps {
  repoPath: string | null;
  applyReload(path: string): Promise<void>;
  errorSlot: ErrorSlot;
  setLoading(v: boolean): void;
}

function useRefreshRepository(deps: RefreshDeps): () => Promise<void> {
  const { repoPath, applyReload, errorSlot, setLoading } = deps;
  return useCallback(async () => {
    if (repoPath === null) { return; }
    setLoading(true); errorSlot.clear();
    try { await applyReload(repoPath); } finally { setLoading(false); }
  }, [applyReload, errorSlot, repoPath, setLoading]);
}

interface OpenDeps {
  errorSlot: ErrorSlot;
  loadSummaries: SummariesFn;
  loadWorktrees: LoadFn;
  setWorktrees: WtSetter;
  setRepoPath(p: string): void;
  setLoading(v: boolean): void;
}

async function runOpenRepository(deps: OpenDeps): Promise<string | null> {
  const { loadWorktrees, loadSummaries, setRepoPath, setWorktrees, setLoading, errorSlot } = deps;
  setLoading(true); errorSlot.clear();
  try {
    const picked = await desktopApi.pickRepo();
    if (picked === null) { return null; }
    const next = await loadWorktrees(picked);
    if (next === null) { return null; }
    setRepoPath(picked); setWorktrees(next);
    void loadSummaries(next, true); return picked;
  } catch (caught) {
    errorSlot.set(describeError(caught)); return null;
  } finally { setLoading(false); }
}

function useOpenRepository(deps: OpenDeps): () => Promise<string | null> {
  const { errorSlot, loadSummaries, loadWorktrees, setWorktrees, setRepoPath, setLoading } = deps;
  return useCallback(
    () => runOpenRepository(deps),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [errorSlot, loadSummaries, loadWorktrees, setWorktrees, setRepoPath, setLoading]
  );
}

/**
 * Repository-catalog resource: the open repository path, its worktrees, the per-worktree
 * summaries, and the open/refresh/reload workflows. The shared error slot is injected so
 * repository and selected-worktree failures keep the exact cross-clearing behavior of the
 * original single-slot god-hook.
 */
export function useRepositoryCatalog(errorSlot: ErrorSlot): RepositoryCatalog {
  const [repoPath, setRepoPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { summaries, loadSummaries, invalidateSummaries } = useSummaries();
  const { worktrees, setWorktrees, loadWorktrees } = useWorktrees(errorSlot, invalidateSummaries);
  const applyReload = useApplyReload(loadWorktrees, setWorktrees, loadSummaries);
  const refreshRepository = useRefreshRepository({ repoPath, applyReload, errorSlot, setLoading });
  const reloadWorktrees = useCallback(async (path: string) => applyReload(path), [applyReload]);
  const openRepository = useOpenRepository({ errorSlot, loadSummaries, loadWorktrees, setWorktrees, setRepoPath, setLoading });
  return { repoPath, worktrees, summaries, loading, openRepository, refreshRepository, reloadWorktrees };
}
