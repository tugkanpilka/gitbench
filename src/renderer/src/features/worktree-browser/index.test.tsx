// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Result } from '../../../../contracts/ipc';
import {
  deferred,
  failResult,
  FEATURE_WORKTREE,
  MAIN_WORKTREE,
  okResult,
  stubApi,
} from '../../test/fixtures';
import { useWorktreeBrowser } from '.';

type BrowserApi = ReturnType<typeof useWorktreeBrowser>;

function formatDiff(browser: BrowserApi): string {
  return browser.diff === null
    ? '(none)'
    : `${browser.diff.worktreePath}:${browser.diff.diffText}`;
}

// eslint-disable-next-line max-lines-per-function
function BrowserStatus({ browser }: { browser: BrowserApi }) {
  const paths = browser.worktrees.map((wt) => wt.path).join(',') || '(empty)';
  const sums = browser.summaries.map((s) => `${s.worktreePath}:${s.fileCount}`).join(',') || '(empty)';
  return (
    <>
      <output aria-label="Repository">{browser.repoPath ?? '(none)'}</output>
      <output aria-label="Worktrees">{paths}</output>
      <output aria-label="Summaries">{sums}</output>
      <output aria-label="Selected">{browser.selectedPath ?? '(none)'}</output>
      <output aria-label="Diff">{formatDiff(browser)}</output>
      <output aria-label="Error">{browser.error ?? '(none)'}</output>
      <output aria-label="Loading">{String(browser.loading)}</output>
      <output aria-label="Diff loading">{String(browser.diffLoading)}</output>
    </>
  );
}

function BrowserHarness() {
  const browser = useWorktreeBrowser();
  return (
    <>
      <BrowserStatus browser={browser} />
      <button type="button" onClick={() => void browser.pickRepository()}>Pick repository</button>
      <button type="button" onClick={() => void browser.refreshRepository()}>Refresh repository</button>
      <button type="button" onClick={() => void browser.selectWorktree(MAIN_WORKTREE.path)}>Select main</button>
      <button type="button" onClick={() => void browser.selectWorktree(FEATURE_WORKTREE.path)}>Select feature</button>
    </>
  );
}

type DiffDeferred = ReturnType<typeof deferred<Result<{ diffText: string }>>>;

function stubRacingFeatureMain(): { featureDiff: DiffDeferred; mainDiff: DiffDeferred } {
  const featureDiff = deferred<Result<{ diffText: string }>>();
  const mainDiff = deferred<Result<{ diffText: string }>>();
  stubApi({
    getDiff: vi.fn().mockReturnValueOnce(featureDiff.promise).mockReturnValueOnce(mainDiff.promise),
  });
  return { featureDiff, mainDiff };
}

function stubRacingMainMain(): { firstDiff: DiffDeferred; secondDiff: DiffDeferred } {
  const firstDiff = deferred<Result<{ diffText: string }>>();
  const secondDiff = deferred<Result<{ diffText: string }>>();
  stubApi({
    getDiff: vi.fn().mockReturnValueOnce(firstDiff.promise).mockReturnValueOnce(secondDiff.promise),
  });
  return { firstDiff, secondDiff };
}

function stubPickBrokenSecondRepo(): void {
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

function stubPickerDialogFails(): void {
  stubApi({
    pickRepo: vi
      .fn()
      .mockResolvedValueOnce(okResult<string | null>('/repo'))
      .mockResolvedValueOnce(failResult('GIT_NOT_INSTALLED', 'Git executable not found.')),
    listWorktrees: vi.fn().mockResolvedValue(okResult([MAIN_WORKTREE])),
  });
}

function stubTwoPicksWithPendingDiff(): DiffDeferred {
  const pendingDiff = deferred<Result<{ diffText: string }>>();
  stubApi({
    pickRepo: vi
      .fn()
      .mockResolvedValueOnce(okResult<string | null>('/repo'))
      .mockResolvedValueOnce(okResult<string | null>('/repo2')),
    getDiff: vi.fn().mockReturnValue(pendingDiff.promise),
  });
  return pendingDiff;
}

function stubRefreshAddsWorktree(): void {
  stubApi({
    listWorktrees: vi
      .fn()
      .mockResolvedValueOnce(okResult([MAIN_WORKTREE]))
      .mockResolvedValueOnce(okResult([MAIN_WORKTREE, FEATURE_WORKTREE])),
  });
}

function stubSignalCapture(): { getSignal: () => () => void } {
  let signal!: () => void;
  stubApi({ onRepoChanged: vi.fn().mockImplementation((fn: () => void) => { signal = fn; return () => {}; }) });
  return { getSignal: () => signal };
}

function clearApiMocks(): void {
  vi.mocked(window.api.listWorktrees).mockClear();
  vi.mocked(window.api.listWorktreeSummaries).mockClear();
  vi.mocked(window.api.getDiff).mockClear();
}

function stubWatchRestartOnRefresh(): void {
  stubApi({
    listWorktrees: vi
      .fn()
      .mockResolvedValueOnce(okResult([MAIN_WORKTREE]))
      .mockResolvedValueOnce(okResult([MAIN_WORKTREE, FEATURE_WORKTREE])),
  });
}

// eslint-disable-next-line max-lines-per-function
describe('useWorktreeBrowser', () => {
  beforeEach(() => {
    stubApi();
  });
  afterEach(() => {
    cleanup();
  });

  it('shows only the most recently selected worktree diff when requests race', async () => {
    const { featureDiff, mainDiff } = stubRacingFeatureMain();
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Select feature' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select main' }));
    await act(async () => { mainDiff.resolve(okResult({ diffText: 'main changes' })); });

    expect(screen.getByLabelText('Diff').textContent).toBe('/repo:main changes');
    expect(screen.getByLabelText('Diff loading').textContent).toBe('false');

    await act(async () => { featureDiff.resolve(okResult({ diffText: 'stale feature changes' })); });

    expect(screen.getByLabelText('Diff').textContent).toBe('/repo:main changes');
    expect(screen.getByLabelText('Selected').textContent).toBe('/repo');
    expect(screen.getByLabelText('Error').textContent).toBe('(none)');
  });

  it('ignores an error from a superseded diff request', async () => {
    const { featureDiff, mainDiff } = stubRacingFeatureMain();
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Select feature' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select main' }));
    await act(async () => { mainDiff.resolve(okResult({ diffText: 'main changes' })); });

    await act(async () => { featureDiff.resolve(failResult('GIT_COMMAND_FAILED', 'Late failure.')); });

    expect(screen.getByLabelText('Error').textContent).toBe('(none)');
    expect(screen.getByLabelText('Diff').textContent).toBe('/repo:main changes');
    expect(screen.getByLabelText('Diff loading').textContent).toBe('false');
  });

  it('ignores a stale result when the same worktree is re-selected before it resolves', async () => {
    const { firstDiff, secondDiff } = stubRacingMainMain();
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Select main' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select main' }));
    await act(async () => { secondDiff.resolve(okResult({ diffText: 'fresh main changes' })); });

    expect(screen.getByLabelText('Diff').textContent).toBe('/repo:fresh main changes');
    expect(screen.getByLabelText('Diff loading').textContent).toBe('false');

    await act(async () => { firstDiff.resolve(okResult({ diffText: 'stale main changes' })); });

    expect(screen.getByLabelText('Diff').textContent).toBe('/repo:fresh main changes');
    expect(screen.getByLabelText('Error').textContent).toBe('(none)');
  });

  it('keeps the open repository path when picking another repository fails to list worktrees', async () => {
    stubPickBrokenSecondRepo();
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
    await waitFor(() => expect(screen.getByLabelText('Repository').textContent).toBe('/repo'));

    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
    expect(await screen.findByText('Not a git repository: /broken')).toBeTruthy();

    expect(screen.getByLabelText('Repository').textContent).toBe('/repo');
    // Documents current behavior: loadWorktrees' catch clears the list even
    // though repoPath still points at the previously opened repository, so the
    // UI is left with an open repo whose worktree list is empty. Suspected bug.
    expect(screen.getByLabelText('Worktrees').textContent).toBe('(empty)');
  });

  it('keeps the previous repository and worktrees when the picker dialog itself fails', async () => {
    stubPickerDialogFails();
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
    await waitFor(() => expect(screen.getByLabelText('Repository').textContent).toBe('/repo'));

    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
    expect(await screen.findByText('Git executable not found.')).toBeTruthy();

    expect(screen.getByLabelText('Repository').textContent).toBe('/repo');
    expect(screen.getByLabelText('Worktrees').textContent).toBe('/repo');
    expect(window.api.listWorktrees).toHaveBeenCalledTimes(1);
  });

  it('opening a new repository resets the selection and discards the in-flight diff', async () => {
    const pendingDiff = stubTwoPicksWithPendingDiff();
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
    expect(await screen.findByText('/repo')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Select feature' }));
    expect(screen.getByLabelText('Diff loading').textContent).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
    expect(await screen.findByText('/repo2')).toBeTruthy();
    expect(screen.getByLabelText('Selected').textContent).toBe('(none)');
    expect(screen.getByLabelText('Diff loading').textContent).toBe('false');

    await act(async () => { pendingDiff.resolve(okResult({ diffText: 'stale diff from the old repository' })); });

    expect(screen.getByLabelText('Diff').textContent).toBe('(none)');
    expect(screen.getByLabelText('Error').textContent).toBe('(none)');
  });

  it('refreshRepository does nothing before a repository is opened', async () => {
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh repository' }));
    await act(async () => {});

    expect(window.api.listWorktrees).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Loading').textContent).toBe('false');
    expect(screen.getByLabelText('Error').textContent).toBe('(none)');
  });

  it('refreshRepository reloads the worktree list of the open repository', async () => {
    stubRefreshAddsWorktree();
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
    await waitFor(() => expect(screen.getByLabelText('Repository').textContent).toBe('/repo'));

    fireEvent.click(screen.getByRole('button', { name: 'Refresh repository' }));
    expect(await screen.findByText('/repo,/repo-feature')).toBeTruthy();

    expect(window.api.listWorktrees).toHaveBeenLastCalledWith('/repo');
    expect(window.api.listWorktreeSummaries).toHaveBeenLastCalledWith(['/repo', '/repo-feature']);
    expect(screen.getByLabelText('Loading').textContent).toBe('false');
  });

  it('loads summaries for every worktree without requiring selection', async () => {
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Summaries').textContent).toBe('/repo:0,/repo-feature:6')
    );
    expect(window.api.listWorktreeSummaries).toHaveBeenCalledWith(['/repo', '/repo-feature']);
    expect(window.api.getDiff).not.toHaveBeenCalled();
  });

  it('refreshRepository failure empties the worktree list and reports the error', async () => {
    stubApi({
      listWorktrees: vi
        .fn()
        .mockResolvedValueOnce(okResult([MAIN_WORKTREE, FEATURE_WORKTREE]))
        .mockResolvedValueOnce(failResult('GIT_COMMAND_FAILED', 'git worktree list failed.')),
    });
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
    expect(await screen.findByText('/repo,/repo-feature')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh repository' }));
    expect(await screen.findByText('git worktree list failed.')).toBeTruthy();

    expect(screen.getByLabelText('Worktrees').textContent).toBe('(empty)');
    expect(screen.getByLabelText('Loading').textContent).toBe('false');
  });

  it("describes non-ApiError failures as 'Unexpected error.'", async () => {
    stubApi({
      getDiff: vi.fn().mockRejectedValue(new TypeError('window.api is broken')),
    });
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Select main' }));

    expect(await screen.findByText('Unexpected error.')).toBeTruthy();
    expect(screen.getByLabelText('Diff').textContent).toBe('(none)');
    expect(screen.getByLabelText('Diff loading').textContent).toBe('false');
  });

  // eslint-disable-next-line max-lines-per-function
  describe('file watching', () => {
    it('starts watching after a repository is picked', async () => {
      render(<BrowserHarness />);

      fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
      await waitFor(() => expect(screen.getByLabelText('Repository').textContent).toBe('/repo'));

      expect(window.api.startWatch).toHaveBeenCalledWith('/repo', ['/repo', '/repo-feature']);
    });

    it('restarts the watch when the set of worktree roots changes', async () => {
      stubWatchRestartOnRefresh();
      render(<BrowserHarness />);

      fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
      await waitFor(() => expect(window.api.startWatch).toHaveBeenCalledWith('/repo', ['/repo']));

      fireEvent.click(screen.getByRole('button', { name: 'Refresh repository' }));
      await waitFor(() =>
        expect(window.api.startWatch).toHaveBeenLastCalledWith('/repo', ['/repo', '/repo-feature'])
      );
      expect(window.api.startWatch).toHaveBeenCalledTimes(2);
    });

    it('does not restart the all-worktree watch when selection changes', async () => {
      render(<BrowserHarness />);

      fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
      await waitFor(() => expect(screen.getByLabelText('Repository').textContent).toBe('/repo'));

      fireEvent.click(screen.getByRole('button', { name: 'Select feature' }));
      await waitFor(() =>
        expect(screen.getByLabelText('Selected').textContent).toBe('/repo-feature')
      );

      expect(window.api.startWatch).toHaveBeenCalledTimes(1);
    });

    it('stops watching on unmount', () => {
      const { unmount } = render(<BrowserHarness />);
      unmount();
      expect(window.api.stopWatch).toHaveBeenCalled();
    });

    it('subscribes to repo:changed and unsubscribes on unmount', () => {
      const unsubscribe = vi.fn();
      stubApi({ onRepoChanged: vi.fn().mockReturnValue(unsubscribe) });

      const { unmount } = render(<BrowserHarness />);
      expect(window.api.onRepoChanged).toHaveBeenCalledTimes(1);

      unmount();
      expect(unsubscribe).toHaveBeenCalled();
    });

    it('silently reloads the worktree list and diff on a repo:changed signal', async () => {
      const { getSignal } = stubSignalCapture();
      render(<BrowserHarness />);

      fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
      await waitFor(() => expect(screen.getByLabelText('Repository').textContent).toBe('/repo'));
      fireEvent.click(screen.getByRole('button', { name: 'Select feature' }));
      await waitFor(() => expect(screen.getByLabelText('Diff loading').textContent).toBe('false'));
      clearApiMocks();
      await act(async () => { getSignal()(); });

      await waitFor(() => { expect(window.api.listWorktrees).toHaveBeenCalledWith('/repo'); });
      expect(window.api.getDiff).toHaveBeenCalledWith('/repo-feature');
      expect(window.api.listWorktreeSummaries).toHaveBeenCalledWith(['/repo', '/repo-feature']);
      expect(screen.getByLabelText('Loading').textContent).toBe('false');
    });

    it('does not re-query when repo:changed fires before a repo is opened', async () => {
      const { getSignal } = stubSignalCapture();
      render(<BrowserHarness />);

      await act(async () => { getSignal()(); });

      expect(window.api.listWorktrees).not.toHaveBeenCalled();
      expect(window.api.listWorktreeSummaries).not.toHaveBeenCalled();
      expect(window.api.getDiff).not.toHaveBeenCalled();
    });

    it('a startWatch failure is non-fatal — the UI continues working', async () => {
      stubApi({
        startWatch: vi.fn().mockResolvedValue(failResult('GIT_COMMAND_FAILED', 'watch error')),
      });
      render(<BrowserHarness />);

      fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
      await waitFor(() => expect(screen.getByLabelText('Repository').textContent).toBe('/repo'));

      expect(screen.getByLabelText('Error').textContent).toBe('(none)');
    });
  });
});
