// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FEATURE_WORKTREE,
  failResult,
  MAIN_WORKTREE,
  okResult,
  stubApi,
} from '../../../test/fixtures';
import type { ErrorSlot } from './useRepositoryCatalog';
import { useRepositoryCatalog } from './useRepositoryCatalog';

function makeErrorSlot(): ErrorSlot & { message: string | null } {
  const slot = {
    message: null as string | null,
    set(message: string) {
      slot.message = message;
    },
    clear() {
      slot.message = null;
    },
  };
  return slot;
}

function stubBrokenSecondRepo(): void {
  stubApi({
    pickRepo: vi
      .fn()
      .mockResolvedValueOnce(okResult<string | null>('/repo'))
      .mockResolvedValueOnce(okResult<string | null>('/broken')),
    listWorktrees: vi
      .fn()
      .mockResolvedValueOnce(okResult([MAIN_WORKTREE]))
      .mockResolvedValueOnce(failResult('NOT_A_REPOSITORY', 'Not a git repository: /broken')),
  });
}

function stubRefreshFailed(): void {
  stubApi({
    listWorktrees: vi
      .fn()
      .mockResolvedValueOnce(okResult([MAIN_WORKTREE, FEATURE_WORKTREE]))
      .mockResolvedValueOnce(failResult('GIT_COMMAND_FAILED', 'git worktree list failed.')),
  });
}

// eslint-disable-next-line max-lines-per-function
describe('useRepositoryCatalog', () => {
  beforeEach(() => stubApi());
  afterEach(() => vi.restoreAllMocks());

  it('commits the picked repository and its worktrees on a successful open', async () => {
    const errorSlot = makeErrorSlot();
    const { result } = renderHook(() => useRepositoryCatalog(errorSlot));

    let opened: string | null = null;
    await act(async () => {
      opened = await result.current.openRepository();
    });

    expect(opened).toBe('/repo');
    expect(result.current.repoPath).toBe('/repo');
    expect(result.current.worktrees.map((worktree) => worktree.path)).toEqual([
      '/repo',
      '/repo-feature',
    ]);
    await waitFor(() => expect(result.current.summaries).toHaveLength(2));
  });

  it('keeps the previous repository when listing worktrees for the new one fails', async () => {
    stubBrokenSecondRepo();
    const errorSlot = makeErrorSlot();
    const { result } = renderHook(() => useRepositoryCatalog(errorSlot));

    await act(async () => { await result.current.openRepository(); });
    expect(result.current.repoPath).toBe('/repo');

    let opened: string | null = '/unchanged';
    await act(async () => { opened = await result.current.openRepository(); });

    expect(opened).toBeNull();
    expect(result.current.repoPath).toBe('/repo');
    expect(errorSlot.message).toBe('Not a git repository: /broken');
  });

  it('refresh failure empties the list and reports the error', async () => {
    stubRefreshFailed();
    const errorSlot = makeErrorSlot();
    const { result } = renderHook(() => useRepositoryCatalog(errorSlot));

    await act(async () => { await result.current.openRepository(); });
    expect(result.current.worktrees).toHaveLength(2);

    await act(async () => { await result.current.refreshRepository(); });

    expect(result.current.worktrees).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    expect(errorSlot.message).toBe('git worktree list failed.');
  });

  it('refreshRepository is a no-op before a repository is opened', async () => {
    const errorSlot = makeErrorSlot();
    const { result } = renderHook(() => useRepositoryCatalog(errorSlot));

    await act(async () => {
      await result.current.refreshRepository();
    });

    expect(window.api.listWorktrees).not.toHaveBeenCalled();
  });
});
