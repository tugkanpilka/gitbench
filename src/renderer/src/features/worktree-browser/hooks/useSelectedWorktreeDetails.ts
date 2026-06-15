import { startTransition, useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { desktopApi } from '../../../shared/api/desktopApi';
import { describeError } from '../describeError';
import type { CommitsState, DiffState } from '../index.types';
import type { ErrorSlot } from './useRepositoryCatalog';
import { useLatestRequest } from './useLatestRequest';

function nextDiffState(
  prev: DiffState | null,
  worktreePath: string,
  diffText: string
): DiffState | null {
  if (prev && prev.worktreePath === worktreePath && prev.diffText === diffText) {
    return prev;
  }
  return { worktreePath, diffText };
}

function commitsChanged(
  prev: CommitsState | null,
  response: { commits: CommitsState['commits']; truncated: boolean }
): boolean {
  if (!prev) {
    return true;
  }
  if (prev.truncated !== response.truncated || prev.commits.length !== response.commits.length) {
    return true;
  }
  return !prev.commits.every((commit, index) => commit.sha === response.commits[index].sha);
}

export interface SelectedWorktreeDetails {
  selectedPath: string | null;
  diff: DiffState | null;
  commits: CommitsState | null;
  diffLoading: boolean;
  // A user selection: commit the new path, clear old details, and load diff + commits.
  selectWorktree(path: string): Promise<void>;
  // Quiet auto-refresh reload for the given (currently selected) path: keeps the current
  // view and swaps the diff text only when it changed, preserving scroll position.
  reloadDetails(path: string): void;
  // Repository replacement: drop the selection and details, invalidating in-flight loads.
  reset(): void;
}

interface WorktreeDiff {
  diff: DiffState | null;
  diffLoading: boolean;
  diffRequest: ReturnType<typeof useLatestRequest>;
  loadDiff(worktreePath: string, showLoading: boolean): Promise<void>;
  resetDiff(): void;
}

type DiffSetter = Dispatch<SetStateAction<DiffState | null>>;

interface DiffResultCtx {
  path: string;
  text: string;
  signal: AbortSignal;
  setDiff: DiffSetter;
}
function applyDiffResult({ path, text, signal, setDiff }: DiffResultCtx): void {
  if (!signal.aborted) {
    startTransition(() => {
      setDiff((prev) => nextDiffState(prev, path, text));
    });
  }
}

interface DiffFailCtx {
  caught: unknown;
  showLoading: boolean;
  signal: AbortSignal;
  slot: ErrorSlot;
  setDiff: DiffSetter;
}
function handleDiffFailure({ caught, showLoading, signal, slot, setDiff }: DiffFailCtx): void {
  if (!signal.aborted) {
    if (showLoading) {
      setDiff(null);
    }
    slot.set(describeError(caught));
  }
}

type LoadDiffFn = (worktreePath: string, showLoading: boolean) => Promise<void>;
type LatestReq = ReturnType<typeof useLatestRequest>;

interface LoadDiffDeps {
  req: LatestReq;
  setDiff: DiffSetter;
  setLoading: (v: boolean) => void;
  slot: ErrorSlot;
}

interface FetchDiffCtx {
  path: string;
  show: boolean;
  signal: AbortSignal;
  deps: LoadDiffDeps;
}

// eslint-disable-next-line max-lines-per-function -- prettier expands catch object arg to multi-line; body already minimal
async function fetchAndApplyDiff({ path, show, signal, deps }: FetchDiffCtx): Promise<void> {
  try {
    const { diffText } = await desktopApi.getDiff(path);
    applyDiffResult({ path, text: diffText, signal, setDiff: deps.setDiff });
  } catch (caught) {
    handleDiffFailure({
      caught,
      showLoading: show,
      signal,
      slot: deps.slot,
      setDiff: deps.setDiff,
    });
  } finally {
    if (!signal.aborted) {
      deps.setLoading(false);
    }
  }
}

async function runLoadDiff(path: string, show: boolean, deps: LoadDiffDeps): Promise<void> {
  const signal = deps.req.begin();
  if (show) {
    deps.setDiff(null);
    deps.setLoading(true);
  }
  deps.slot.clear();
  await fetchAndApplyDiff({ path, show, signal, deps });
}

function useLoadDiff(deps: LoadDiffDeps): LoadDiffFn {
  return useCallback(
    async (path: string, show: boolean) => runLoadDiff(path, show, deps),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deps.req, deps.setDiff, deps.setLoading, deps.slot]
  );
}

function useResetDiff(
  setDiff: DiffSetter,
  setDiffLoading: (v: boolean) => void,
  diffRequest: LatestReq
): () => void {
  return useCallback(() => {
    setDiff(null);
    setDiffLoading(false);
    diffRequest.invalidate();
  }, [diffRequest, setDiff, setDiffLoading]);
}

// `showLoading` true = user selection (clear + spinner); false = auto-refresh (keep view).
function useWorktreeDiff(errorSlot: ErrorSlot): WorktreeDiff {
  const [diff, setDiff] = useState<DiffState | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const diffRequest = useLatestRequest();
  const loadDiff = useLoadDiff({
    req: diffRequest,
    setDiff,
    setLoading: setDiffLoading,
    slot: errorSlot,
  });
  const resetDiff = useResetDiff(setDiff, setDiffLoading, diffRequest);
  return { diff, diffLoading, diffRequest, loadDiff, resetDiff };
}

interface WorktreeCommits {
  commits: CommitsState | null;
  commitsRequest: ReturnType<typeof useLatestRequest>;
  loadCommits(worktreePath: string, clear: boolean): Promise<void>;
  resetCommits(): void;
}

type CommitsSetter = Dispatch<SetStateAction<CommitsState | null>>;

// eslint-disable-next-line max-lines-per-function -- multi-line signature from prettier; body is already minimal
function applyCommitsResult(
  response: CommitsState,
  signal: AbortSignal,
  setCommits: CommitsSetter
): void {
  if (signal.aborted) {
    return;
  }
  startTransition(() => {
    setCommits((prev) =>
      commitsChanged(prev, response)
        ? { commits: response.commits, truncated: response.truncated }
        : prev
    );
  });
}

interface RunCommitsCtx {
  path: string;
  clear: boolean;
  req: LatestReq;
  setCommits: CommitsSetter;
}
async function runLoadCommits({ path, clear, req, setCommits }: RunCommitsCtx): Promise<void> {
  const signal = req.begin();
  if (clear) {
    setCommits(null);
  }
  try {
    const response = await desktopApi.listUnpushedCommits(path);
    applyCommitsResult(response, signal, setCommits);
  } catch {
    if (!signal.aborted && clear) {
      setCommits(null);
    }
  }
}

// Commits are secondary: failures are swallowed (the section just hides).
function useWorktreeCommits(): WorktreeCommits {
  const [commits, setCommits] = useState<CommitsState | null>(null);
  const commitsRequest = useLatestRequest();
  const loadCommits = useCallback(
    async (path: string, clear: boolean) =>
      runLoadCommits({ path, clear, req: commitsRequest, setCommits }),
    [commitsRequest]
  );
  const resetCommits = useCallback(() => {
    setCommits(null);
    commitsRequest.invalidate();
  }, [commitsRequest]);
  return { commits, commitsRequest, loadCommits, resetCommits };
}

/**
 * Selected-worktree resource: the selected path plus its diff and unpushed commits.
 * Diff and commits each have their own latest-wins guard so out-of-order resolutions
 * never show a stale diff. The shared error slot is injected so a diff load clears (and
 * can set) the same error the repository catalog uses.
 */
type LoadDiffFn2 = (path: string, show: boolean) => Promise<void>;
type LoadCommitsFn = (path: string, clear: boolean) => Promise<void>;
type ActionsResult = Pick<SelectedWorktreeDetails, 'selectWorktree' | 'reloadDetails' | 'reset'>;

interface ActionDeps {
  setPath: (p: string | null) => void;
  loadDiff: LoadDiffFn2;
  loadCommits: LoadCommitsFn;
  resetDiff(): void;
  resetCommits(): void;
}

function useSelectWorktree(
  setPath: ActionDeps['setPath'],
  loadDiff: LoadDiffFn2,
  loadCommits: LoadCommitsFn
): ActionsResult['selectWorktree'] {
  return useCallback(
    async (path: string) => {
      setPath(path);
      await Promise.all([loadDiff(path, true), loadCommits(path, true)]);
    },
    [loadCommits, loadDiff, setPath]
  );
}

function useReloadDetails(
  loadDiff: LoadDiffFn2,
  loadCommits: LoadCommitsFn
): ActionsResult['reloadDetails'] {
  return useCallback(
    (path: string) => {
      void loadDiff(path, false);
      void loadCommits(path, false);
    },
    [loadCommits, loadDiff]
  );
}

// eslint-disable-next-line max-lines-per-function -- prettier expands destructured params; body already minimal
function useWorktreeActions({
  setPath,
  loadDiff,
  loadCommits,
  resetDiff,
  resetCommits,
}: ActionDeps): ActionsResult {
  const selectWorktree = useSelectWorktree(setPath, loadDiff, loadCommits);
  const reloadDetails = useReloadDetails(loadDiff, loadCommits);
  const reset = useCallback(() => {
    setPath(null);
    resetDiff();
    resetCommits();
  }, [resetCommits, resetDiff, setPath]);
  return { selectWorktree, reloadDetails, reset };
}

export function useSelectedWorktreeDetails(errorSlot: ErrorSlot): SelectedWorktreeDetails {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const { diff, diffLoading, loadDiff, resetDiff } = useWorktreeDiff(errorSlot);
  const { commits, loadCommits, resetCommits } = useWorktreeCommits();
  const actions = useWorktreeActions({
    setPath: setSelectedPath,
    loadDiff,
    loadCommits,
    resetDiff,
    resetCommits,
  });
  return { selectedPath, diff, commits, diffLoading, ...actions };
}
