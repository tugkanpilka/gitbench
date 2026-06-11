// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ErrorDto, Result, WorktreeDto } from '../../../../contracts/ipc';
import { useWorktreeBrowser } from '.';

const okResult = <T,>(data: T): Result<T> => ({ ok: true, data });
const failResult = <T,>(code: ErrorDto['code'], message: string): Result<T> => ({
  ok: false,
  error: { code, message },
});

const MAIN_WORKTREE: WorktreeDto = {
  path: '/repo',
  branch: 'main',
  headSha: 'a'.repeat(40),
  isMain: true,
  isLocked: false,
};

const FEATURE_WORKTREE: WorktreeDto = {
  path: '/repo-feature',
  branch: 'feature/login',
  headSha: 'b'.repeat(40),
  isMain: false,
  isLocked: false,
};

function stubApi(overrides: Partial<Window['api']> = {}): void {
  window.api = {
    pickRepo: vi.fn().mockResolvedValue(okResult<string | null>('/repo')),
    listWorktrees: vi.fn().mockResolvedValue(okResult([MAIN_WORKTREE, FEATURE_WORKTREE])),
    getDiff: vi.fn().mockResolvedValue(okResult({ diffText: 'diff' })),
    ...overrides,
  };
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function BrowserHarness() {
  const browser = useWorktreeBrowser();

  return (
    <>
      <output aria-label="Repository">{browser.repoPath ?? '(none)'}</output>
      <output aria-label="Worktrees">
        {browser.worktrees.map((worktree) => worktree.path).join(',') || '(empty)'}
      </output>
      <output aria-label="Selected">{browser.selectedPath ?? '(none)'}</output>
      <output aria-label="Diff">
        {browser.diff === null ? '(none)' : `${browser.diff.worktreePath}:${browser.diff.diffText}`}
      </output>
      <output aria-label="Error">{browser.error ?? '(none)'}</output>
      <output aria-label="Loading">{String(browser.loading)}</output>
      <output aria-label="Diff loading">{String(browser.diffLoading)}</output>
      <button type="button" onClick={() => void browser.pickRepository()}>
        Pick repository
      </button>
      <button type="button" onClick={() => void browser.refreshRepository()}>
        Refresh repository
      </button>
      <button type="button" onClick={() => void browser.selectWorktree(MAIN_WORKTREE.path)}>
        Select main
      </button>
      <button type="button" onClick={() => void browser.selectWorktree(FEATURE_WORKTREE.path)}>
        Select feature
      </button>
    </>
  );
}

describe('useWorktreeBrowser', () => {
  beforeEach(() => {
    stubApi();
  });
  afterEach(() => {
    cleanup();
  });

  it('shows only the most recently selected worktree diff when requests race', async () => {
    const featureDiff = deferred<Result<{ diffText: string }>>();
    const mainDiff = deferred<Result<{ diffText: string }>>();
    stubApi({
      getDiff: vi
        .fn()
        .mockReturnValueOnce(featureDiff.promise)
        .mockReturnValueOnce(mainDiff.promise),
    });
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Select feature' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select main' }));
    await act(async () => {
      mainDiff.resolve(okResult({ diffText: 'main changes' }));
    });

    expect(screen.getByLabelText('Diff').textContent).toBe('/repo:main changes');
    expect(screen.getByLabelText('Diff loading').textContent).toBe('false');

    await act(async () => {
      featureDiff.resolve(okResult({ diffText: 'stale feature changes' }));
    });

    expect(screen.getByLabelText('Diff').textContent).toBe('/repo:main changes');
    expect(screen.getByLabelText('Selected').textContent).toBe('/repo');
    expect(screen.getByLabelText('Error').textContent).toBe('(none)');
  });

  it('ignores an error from a superseded diff request', async () => {
    const featureDiff = deferred<Result<{ diffText: string }>>();
    const mainDiff = deferred<Result<{ diffText: string }>>();
    stubApi({
      getDiff: vi
        .fn()
        .mockReturnValueOnce(featureDiff.promise)
        .mockReturnValueOnce(mainDiff.promise),
    });
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Select feature' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select main' }));
    await act(async () => {
      mainDiff.resolve(okResult({ diffText: 'main changes' }));
    });

    await act(async () => {
      featureDiff.resolve(failResult('GIT_COMMAND_FAILED', 'Late failure.'));
    });

    expect(screen.getByLabelText('Error').textContent).toBe('(none)');
    expect(screen.getByLabelText('Diff').textContent).toBe('/repo:main changes');
    expect(screen.getByLabelText('Diff loading').textContent).toBe('false');
  });

  it('keeps the open repository path when picking another repository fails to list worktrees', async () => {
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
    stubApi({
      pickRepo: vi
        .fn()
        .mockResolvedValueOnce(okResult<string | null>('/repo'))
        .mockResolvedValueOnce(failResult('GIT_NOT_INSTALLED', 'Git executable not found.')),
      listWorktrees: vi.fn().mockResolvedValue(okResult([MAIN_WORKTREE])),
    });
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
    const pendingDiff = deferred<Result<{ diffText: string }>>();
    stubApi({
      pickRepo: vi
        .fn()
        .mockResolvedValueOnce(okResult<string | null>('/repo'))
        .mockResolvedValueOnce(okResult<string | null>('/repo2')),
      getDiff: vi.fn().mockReturnValue(pendingDiff.promise),
    });
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
    expect(await screen.findByText('/repo')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Select feature' }));
    expect(screen.getByLabelText('Diff loading').textContent).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
    expect(await screen.findByText('/repo2')).toBeTruthy();

    expect(screen.getByLabelText('Selected').textContent).toBe('(none)');
    expect(screen.getByLabelText('Diff').textContent).toBe('(none)');
    expect(screen.getByLabelText('Diff loading').textContent).toBe('false');

    await act(async () => {
      pendingDiff.resolve(okResult({ diffText: 'stale diff from the old repository' }));
    });

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
    stubApi({
      listWorktrees: vi
        .fn()
        .mockResolvedValueOnce(okResult([MAIN_WORKTREE]))
        .mockResolvedValueOnce(okResult([MAIN_WORKTREE, FEATURE_WORKTREE])),
    });
    render(<BrowserHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Pick repository' }));
    await waitFor(() => expect(screen.getByLabelText('Repository').textContent).toBe('/repo'));

    fireEvent.click(screen.getByRole('button', { name: 'Refresh repository' }));
    expect(await screen.findByText('/repo,/repo-feature')).toBeTruthy();

    expect(window.api.listWorktrees).toHaveBeenLastCalledWith('/repo');
    expect(screen.getByLabelText('Loading').textContent).toBe('false');
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
});
