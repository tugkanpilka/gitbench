// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubApi } from '../../../test/fixtures';
import { useRepositoryWatcher } from './useRepositoryWatcher';

function makeSignalAndUnsubscribe(): { getSignal: () => () => void; unsubscribe: ReturnType<typeof vi.fn> } {
  let signal!: () => void;
  const unsubscribe = vi.fn();
  stubApi({
    onRepoChanged: vi.fn().mockImplementation((fn: () => void) => {
      signal = fn;
      return unsubscribe;
    }),
  });
  return { getSignal: () => signal, unsubscribe };
}

// eslint-disable-next-line max-lines-per-function
describe('useRepositoryWatcher', () => {
  beforeEach(() => stubApi());
  afterEach(() => vi.restoreAllMocks());

  it('does not start a watch before a repository is open', () => {
    renderHook(() =>
      useRepositoryWatcher({ repoPath: null, worktreePaths: [], onRepoChanged: () => {} })
    );

    expect(window.api.startWatch).not.toHaveBeenCalled();
  });

  it('starts watching all worktree roots for the open repository', () => {
    renderHook(() =>
      useRepositoryWatcher({
        repoPath: '/repo',
        worktreePaths: ['/repo', '/repo-feature'],
        onRepoChanged: () => {},
      })
    );

    expect(window.api.startWatch).toHaveBeenCalledWith('/repo', ['/repo', '/repo-feature']);
  });

  it('restarts only when the worktree-root set changes, not on unrelated re-renders', () => {
    const singleRoot = { repoPath: '/repo', worktreePaths: ['/repo'], onRepoChanged: () => {} };
    const { rerender } = renderHook((props) => useRepositoryWatcher(props), {
      initialProps: singleRoot,
    });
    expect(window.api.startWatch).toHaveBeenCalledTimes(1);

    rerender({ repoPath: '/repo', worktreePaths: ['/repo'], onRepoChanged: () => {} });
    expect(window.api.startWatch).toHaveBeenCalledTimes(1);

    rerender({ repoPath: '/repo', worktreePaths: ['/repo', '/repo-feature'], onRepoChanged: () => {} });
    expect(window.api.startWatch).toHaveBeenCalledTimes(2);
    expect(window.api.startWatch).toHaveBeenLastCalledWith('/repo', ['/repo', '/repo-feature']);
  });

  it('stops watching on unmount', () => {
    const { unmount } = renderHook(() =>
      useRepositoryWatcher({ repoPath: '/repo', worktreePaths: ['/repo'], onRepoChanged: () => {} })
    );

    unmount();

    expect(window.api.stopWatch).toHaveBeenCalled();
  });

  it('forwards the latest repo:changed handler without re-subscribing', () => {
    const { getSignal, unsubscribe } = makeSignalAndUnsubscribe();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook((props) => useRepositoryWatcher(props), {
      initialProps: { repoPath: '/repo', worktreePaths: ['/repo'], onRepoChanged: first },
    });

    rerender({ repoPath: '/repo', worktreePaths: ['/repo'], onRepoChanged: second });
    getSignal()();

    expect(window.api.onRepoChanged).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
