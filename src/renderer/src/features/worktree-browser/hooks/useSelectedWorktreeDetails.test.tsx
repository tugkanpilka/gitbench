// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Result } from '../../../../../contracts/ipc';
import { deferred, failResult, okResult, stubApi } from '../../../test/fixtures';
import type { ErrorSlot } from './useRepositoryCatalog';
import { useSelectedWorktreeDetails } from './useSelectedWorktreeDetails';

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

describe('useSelectedWorktreeDetails', () => {
  beforeEach(() => stubApi());
  afterEach(() => vi.restoreAllMocks());

  it('commits the selection and loads its diff', async () => {
    stubApi({ getDiff: vi.fn().mockResolvedValue(okResult({ diffText: 'main changes' })) });
    const { result } = renderHook(() => useSelectedWorktreeDetails(makeErrorSlot()));

    await act(async () => {
      await result.current.selectWorktree('/repo');
    });

    expect(result.current.selectedPath).toBe('/repo');
    expect(result.current.diff).toEqual({ worktreePath: '/repo', diffText: 'main changes' });
    expect(result.current.diffLoading).toBe(false);
  });

  it('keeps only the latest selection when diff requests resolve out of order', async () => {
    const featureDiff = deferred<Result<{ diffText: string }>>();
    const mainDiff = deferred<Result<{ diffText: string }>>();
    stubApi({
      getDiff: vi
        .fn()
        .mockReturnValueOnce(featureDiff.promise)
        .mockReturnValueOnce(mainDiff.promise),
    });
    const { result } = renderHook(() => useSelectedWorktreeDetails(makeErrorSlot()));

    act(() => {
      void result.current.selectWorktree('/repo-feature');
      void result.current.selectWorktree('/repo');
    });
    await act(async () => {
      mainDiff.resolve(okResult({ diffText: 'main changes' }));
    });
    await act(async () => {
      featureDiff.resolve(okResult({ diffText: 'stale feature changes' }));
    });

    expect(result.current.diff).toEqual({ worktreePath: '/repo', diffText: 'main changes' });
  });

  it('reset drops the selection and discards an in-flight diff', async () => {
    const pendingDiff = deferred<Result<{ diffText: string }>>();
    stubApi({ getDiff: vi.fn().mockReturnValue(pendingDiff.promise) });
    const { result } = renderHook(() => useSelectedWorktreeDetails(makeErrorSlot()));

    act(() => {
      void result.current.selectWorktree('/repo-feature');
    });
    expect(result.current.diffLoading).toBe(true);

    act(() => {
      result.current.reset();
    });
    await act(async () => {
      pendingDiff.resolve(okResult({ diffText: 'stale diff' }));
    });

    expect(result.current.selectedPath).toBeNull();
    expect(result.current.diff).toBeNull();
    expect(result.current.diffLoading).toBe(false);
  });

  it('a diff failure sets the shared error slot', async () => {
    const errorSlot = makeErrorSlot();
    stubApi({
      getDiff: vi.fn().mockResolvedValue(failResult('GIT_COMMAND_FAILED', 'no commits yet')),
    });
    const { result } = renderHook(() => useSelectedWorktreeDetails(errorSlot));

    await act(async () => {
      await result.current.selectWorktree('/repo');
    });

    await waitFor(() => expect(errorSlot.message).toBe('no commits yet'));
    expect(result.current.diff).toBeNull();
  });
});
