import { startTransition, useCallback, useState } from 'react';

import { desktopApi } from '../../../shared/api/desktopApi';
import { describeError } from '../describeError';
import type { CommitsState, DiffState } from '../index.types';
import type { ErrorSlot } from './useRepositoryCatalog';
import { useLatestRequest } from './useLatestRequest';

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

/**
 * Selected-worktree resource: the selected path plus its diff and unpushed commits.
 * Diff and commits each have their own latest-wins guard so out-of-order resolutions
 * never show a stale diff. The shared error slot is injected so a diff load clears (and
 * can set) the same error the repository catalog uses.
 */
export function useSelectedWorktreeDetails(errorSlot: ErrorSlot): SelectedWorktreeDetails {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [diff, setDiff] = useState<DiffState | null>(null);
  const [commits, setCommits] = useState<CommitsState | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const diffRequest = useLatestRequest();
  const commitsRequest = useLatestRequest();

  // Loads the diff for a worktree. `showLoading` is true for a user selection (clear the
  // view, show the spinner) and false for an auto-refresh (keep the current view; only
  // swap it in when the text actually changed, preserving the scroll position).
  const loadDiff = useCallback(
    async (worktreePath: string, showLoading: boolean) => {
      const signal = diffRequest.begin();
      if (showLoading) {
        setDiff(null);
        setDiffLoading(true);
      }
      errorSlot.clear();
      try {
        const response = await desktopApi.getDiff(worktreePath);
        if (signal.aborted) {
          return;
        }
        startTransition(() => {
          setDiff((prev) =>
            prev && prev.worktreePath === worktreePath && prev.diffText === response.diffText
              ? prev
              : { worktreePath, diffText: response.diffText }
          );
        });
      } catch (caught) {
        if (!signal.aborted) {
          if (showLoading) {
            setDiff(null);
          }
          errorSlot.set(describeError(caught));
        }
      } finally {
        if (!signal.aborted) {
          setDiffLoading(false);
        }
      }
    },
    [diffRequest, errorSlot]
  );

  // Loads the unpushed commits for a worktree. Secondary to the diff: failures are
  // swallowed (the section just hides) so they never block the diff view or steal the
  // shared error slot. `clear` drops stale commits immediately on a user selection;
  // an auto-refresh (`clear` false) keeps the current list on failure, like loadDiff.
  const loadCommits = useCallback(
    async (worktreePath: string, clear: boolean) => {
      const signal = commitsRequest.begin();
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
        startTransition(() => {
          setCommits((prev) =>
            prev &&
            prev.truncated === response.truncated &&
            prev.commits.length === response.commits.length &&
            prev.commits.every((commit, index) => commit.sha === response.commits[index].sha)
              ? prev
              : { commits: response.commits, truncated: response.truncated }
          );
        });
      } catch {
        if (!signal.aborted && clear) {
          setCommits(null);
        }
      }
    },
    [commitsRequest]
  );

  const selectWorktree = useCallback(
    async (worktreePath: string) => {
      setSelectedPath(worktreePath);
      await Promise.all([loadDiff(worktreePath, true), loadCommits(worktreePath, true)]);
    },
    [loadCommits, loadDiff]
  );

  const reloadDetails = useCallback(
    (worktreePath: string) => {
      void loadDiff(worktreePath, false);
      void loadCommits(worktreePath, false);
    },
    [loadCommits, loadDiff]
  );

  const reset = useCallback(() => {
    setSelectedPath(null);
    setDiff(null);
    setCommits(null);
    diffRequest.invalidate();
    commitsRequest.invalidate();
    setDiffLoading(false);
  }, [commitsRequest, diffRequest]);

  return {
    selectedPath,
    diff,
    commits,
    diffLoading,
    selectWorktree,
    reloadDetails,
    reset,
  };
}
